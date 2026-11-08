from __future__ import annotations

from dataclasses import dataclass
from datetime import date, datetime, timedelta, timezone
from typing import Any

import httpx

from app.config import settings
from app.services.weather_codes import summary_for_code


class OpenMeteoError(Exception):
    pass


@dataclass(frozen=True)
class GeocodedLocation:
    name: str
    lat: float
    lon: float
    timezone: str
    country: str | None
    admin1: str | None


class OpenMeteoClient:
    def __init__(self, http: httpx.AsyncClient | None = None) -> None:
        self._http = http
        self._owned_http: httpx.AsyncClient | None = None

    async def _client(self) -> httpx.AsyncClient:
        if self._http is not None:
            return self._http
        if self._owned_http is None:
            self._owned_http = httpx.AsyncClient(timeout=30.0)
        return self._owned_http

    async def aclose(self) -> None:
        if self._owned_http is not None:
            await self._owned_http.aclose()
            self._owned_http = None

    async def search_locations(self, query: str, count: int = 10) -> list[GeocodedLocation]:
        if not query.strip():
            return []
        client = await self._client()
        resp = await client.get(
            f"{settings.geocoding_base_url}/search",
            params={"name": query, "count": count, "language": "en", "format": "json"},
        )
        if resp.status_code != 200:
            raise OpenMeteoError(f"Geocoding failed: HTTP {resp.status_code}")
        data = resp.json()
        results: list[GeocodedLocation] = []
        for row in data.get("results") or []:
            results.append(
                GeocodedLocation(
                    name=row["name"],
                    lat=float(row["latitude"]),
                    lon=float(row["longitude"]),
                    timezone=row.get("timezone", "UTC"),
                    country=row.get("country"),
                    admin1=row.get("admin1"),
                )
            )
        return results

    async def fetch_forecast(
        self,
        lat: float,
        lon: float,
        *,
        timezone: str = "auto",
        forecast_days: int = 7,
        past_days: int = 0,
    ) -> dict[str, Any]:
        client = await self._client()
        params = {
            "latitude": lat,
            "longitude": lon,
            "timezone": timezone,
            "forecast_days": forecast_days,
            "current": ",".join(
                [
                    "temperature_2m",
                    "relative_humidity_2m",
                    "apparent_temperature",
                    "weather_code",
                    "wind_speed_10m",
                ]
            ),
            "hourly": ",".join(["temperature_2m", "precipitation", "weather_code"]),
            "daily": ",".join(
                ["weather_code", "temperature_2m_max", "temperature_2m_min", "precipitation_sum"]
            ),
        }
        if past_days > 0:
            params["past_days"] = past_days
        resp = await client.get(f"{settings.forecast_base_url}/forecast", params=params)
        if resp.status_code != 200:
            raise OpenMeteoError(f"Forecast failed: HTTP {resp.status_code}")
        return resp.json()

    async def fetch_history(
        self,
        lat: float,
        lon: float,
        start: date,
        end: date,
        *,
        timezone: str = "auto",
    ) -> dict[str, Any]:
        client = await self._client()
        params = {
            "latitude": lat,
            "longitude": lon,
            "start_date": start.isoformat(),
            "end_date": end.isoformat(),
            "timezone": timezone,
            "daily": ",".join(
                [
                    "weather_code",
                    "temperature_2m_max",
                    "temperature_2m_min",
                    "precipitation_sum",
                ]
            ),
        }
        resp = await client.get(f"{settings.archive_base_url}/archive", params=params)
        if resp.status_code != 200:
            raise OpenMeteoError(f"Archive failed: HTTP {resp.status_code}")
        return resp.json()


def build_report_payload(
    lat: float,
    lon: float,
    forecast: dict[str, Any],
    *,
    history: dict[str, Any] | None = None,
    location_name: str | None = None,
) -> dict[str, Any]:
    tz = forecast.get("timezone", "UTC")
    current = forecast.get("current") or {}
    current_units = forecast.get("current_units") or {}
    code = current.get("weather_code")

    daily_block = forecast.get("daily") or {}
    daily_rows = []
    times = daily_block.get("time") or []
    for i, day in enumerate(times):
        code_d = _at(daily_block, "weather_code", i)
        daily_rows.append(
            {
                "date": day,
                "temp_max": _at(daily_block, "temperature_2m_max", i),
                "temp_min": _at(daily_block, "temperature_2m_min", i),
                "precip_sum": _at(daily_block, "precipitation_sum", i),
                "weather_code": code_d,
                "summary": summary_for_code(code_d),
            }
        )

    hourly_block = forecast.get("hourly") or {}
    hourly_rows = []
    for i, t in enumerate(hourly_block.get("time") or []):
        hourly_rows.append(
            {
                "time": t,
                "temperature": _at(hourly_block, "temperature_2m", i),
                "precipitation": _at(hourly_block, "precipitation", i),
                "weather_code": _at(hourly_block, "weather_code", i),
            }
        )

    history_section = None
    if history:
        hist_daily = history.get("daily") or {}
        hist_rows = []
        for i, day in enumerate(hist_daily.get("time") or []):
            code_h = _at(hist_daily, "weather_code", i)
            hist_rows.append(
                {
                    "date": day,
                    "temp_max": _at(hist_daily, "temperature_2m_max", i),
                    "temp_min": _at(hist_daily, "temperature_2m_min", i),
                    "precip_sum": _at(hist_daily, "precipitation_sum", i),
                    "weather_code": code_h,
                    "summary": summary_for_code(code_h),
                }
            )
        if hist_rows:
            history_section = {
                "start": hist_rows[0]["date"],
                "end": hist_rows[-1]["date"],
                "daily": hist_rows,
            }

    display_name = location_name
    if not display_name:
        display_name = f"{lat:.2f}, {lon:.2f}"

    return {
        "location": {
            "name": display_name,
            "lat": lat,
            "lon": lon,
            "timezone": tz,
        },
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "units": {
            "temperature": current_units.get("temperature_2m", "°C"),
            "wind_speed": current_units.get("wind_speed_10m", "km/h"),
        },
        "current": {
            "temperature": current.get("temperature_2m"),
            "apparent_temperature": current.get("apparent_temperature"),
            "humidity": current.get("relative_humidity_2m"),
            "wind_speed": current.get("wind_speed_10m"),
            "weather_code": code,
            "summary": summary_for_code(code),
        },
        "daily": daily_rows,
        "hourly": hourly_rows,
        "history": history_section,
    }


def default_history_range(days: int) -> tuple[date, date]:
    end = date.today() - timedelta(days=1)
    start = end - timedelta(days=max(days - 1, 0))
    return start, end


def _at(block: dict[str, Any], key: str, index: int) -> Any:
    values = block.get(key) or []
    if index < len(values):
        return values[index]
    return None
