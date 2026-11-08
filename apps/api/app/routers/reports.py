from fastapi import APIRouter, Depends, HTTPException, Query

from app.deps import get_meteo_client
from app.schemas.report import WeatherReport
from app.services.open_meteo import (
    OpenMeteoClient,
    OpenMeteoError,
    build_report_payload,
    default_history_range,
)

router = APIRouter(prefix="/reports", tags=["reports"])


@router.get("", response_model=WeatherReport)
async def get_report(
    lat: float = Query(..., ge=-90, le=90),
    lon: float = Query(..., ge=-180, le=180),
    timezone: str = Query(default="auto"),
    name: str | None = Query(default=None, max_length=200),
    forecast_days: int = Query(default=7, ge=1, le=16),
    history_days: int = Query(default=0, ge=0, le=30),
    client: OpenMeteoClient = Depends(get_meteo_client),
) -> WeatherReport:
    try:
        forecast = await client.fetch_forecast(
            lat, lon, timezone=timezone, forecast_days=forecast_days
        )
        history = None
        if history_days > 0:
            start, end = default_history_range(history_days)
            history = await client.fetch_history(lat, lon, start, end, timezone=timezone)
        payload = build_report_payload(
            lat, lon, forecast, history=history, location_name=name
        )
    except OpenMeteoError as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc
    return WeatherReport.model_validate(payload)


@router.get("/history")
async def get_history(
    lat: float = Query(..., ge=-90, le=90),
    lon: float = Query(..., ge=-180, le=180),
    start: str | None = Query(default=None, description="YYYY-MM-DD"),
    end: str | None = Query(default=None, description="YYYY-MM-DD"),
    days: int = Query(default=14, ge=1, le=90),
    timezone: str = Query(default="auto"),
    client: OpenMeteoClient = Depends(get_meteo_client),
) -> dict:
    from datetime import date

    try:
        if start and end:
            start_d = date.fromisoformat(start)
            end_d = date.fromisoformat(end)
        else:
            start_d, end_d = default_history_range(days)
        raw = await client.fetch_history(lat, lon, start_d, end_d, timezone=timezone)
        payload = build_report_payload(lat, lon, {"timezone": raw.get("timezone", timezone)}, history=raw)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail="Invalid date format; use YYYY-MM-DD") from exc
    except OpenMeteoError as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc
    if payload["history"] is None:
        return {"location": payload["location"], "history": {"start": None, "end": None, "daily": []}}
    return {"location": payload["location"], "history": payload["history"]}
