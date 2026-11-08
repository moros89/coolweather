import type { DailyRow, HistoryResponse, LocationResult, WeatherReport } from "../types";
import { summaryForCode } from "../weatherIcon";

const GEO = "https://geocoding-api.open-meteo.com/v1";
const FORECAST = "https://api.open-meteo.com/v1/forecast";
const ARCHIVE = "https://archive-api.open-meteo.com/v1/archive";

function at(block: Record<string, unknown>, key: string, index: number): unknown {
  const values = block[key];
  if (!Array.isArray(values) || index >= values.length) return null;
  return values[index];
}

function historyRange(days: number): { start: string; end: string } {
  const end = new Date();
  end.setDate(end.getDate() - 1);
  const start = new Date(end);
  start.setDate(start.getDate() - Math.max(days - 1, 0));
  return { start: start.toISOString().slice(0, 10), end: end.toISOString().slice(0, 10) };
}

function buildReport(
  lat: number,
  lon: number,
  forecast: Record<string, unknown>,
  opts: { name?: string; history?: Record<string, unknown> | null },
): WeatherReport {
  const tz = (forecast.timezone as string) ?? "UTC";
  const current = (forecast.current as Record<string, unknown>) ?? {};
  const currentUnits = (forecast.current_units as Record<string, string>) ?? {};
  const code = current.weather_code as number | null;

  const dailyBlock = (forecast.daily as Record<string, unknown>) ?? {};
  const daily: DailyRow[] = [];
  const times = (dailyBlock.time as string[]) ?? [];
  times.forEach((day, i) => {
    const codeD = at(dailyBlock, "weather_code", i) as number | null;
    daily.push({
      date: day,
      temp_max: at(dailyBlock, "temperature_2m_max", i) as number | null,
      temp_min: at(dailyBlock, "temperature_2m_min", i) as number | null,
      precip_sum: at(dailyBlock, "precipitation_sum", i) as number | null,
      weather_code: codeD,
      summary: summaryForCode(codeD),
    });
  });

  const hourlyBlock = (forecast.hourly as Record<string, unknown>) ?? {};
  const hourlyTimes = (hourlyBlock.time as string[]) ?? [];
  const hourly = hourlyTimes.map((time, i) => ({
    time,
    temperature: at(hourlyBlock, "temperature_2m", i) as number | null,
    precipitation: at(hourlyBlock, "precipitation", i) as number | null,
    weather_code: at(hourlyBlock, "weather_code", i) as number | null,
  }));

  let history: WeatherReport["history"] = null;
  if (opts.history) {
    const histDaily = (opts.history.daily as Record<string, unknown>) ?? {};
    const histDays = (histDaily.time as string[]) ?? [];
    const rows: DailyRow[] = histDays.map((date, i) => {
      const codeH = at(histDaily, "weather_code", i) as number | null;
      return {
        date,
        temp_max: at(histDaily, "temperature_2m_max", i) as number | null,
        temp_min: at(histDaily, "temperature_2m_min", i) as number | null,
        precip_sum: at(histDaily, "precipitation_sum", i) as number | null,
        weather_code: codeH,
        summary: summaryForCode(codeH),
      };
    });
    if (rows.length > 0) {
      history = { start: rows[0].date, end: rows[rows.length - 1].date, daily: rows };
    }
  }

  return {
    location: {
      name: opts.name ?? `${lat.toFixed(2)}, ${lon.toFixed(2)}`,
      lat,
      lon,
      timezone: tz,
    },
    generated_at: new Date().toISOString(),
    units: {
      temperature: currentUnits.temperature_2m ?? "°C",
      wind_speed: currentUnits.wind_speed_10m ?? "km/h",
    },
    current: {
      temperature: (current.temperature_2m as number | null) ?? null,
      apparent_temperature: (current.apparent_temperature as number | null) ?? null,
      humidity: (current.relative_humidity_2m as number | null) ?? null,
      wind_speed: (current.wind_speed_10m as number | null) ?? null,
      weather_code: code,
      summary: summaryForCode(code),
    },
    daily,
    hourly,
    history,
  };
}

async function getOpenMeteo<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Open-Meteo request failed (${res.status})`);
  return res.json() as Promise<T>;
}

export async function searchLocationsDirect(query: string): Promise<LocationResult[]> {
  const sp = new URLSearchParams({
    name: query.trim(),
    count: "8",
    language: "en",
    format: "json",
  });
  const data = await getOpenMeteo<{ results?: Record<string, unknown>[] }>(`${GEO}/search?${sp}`);
  return (data.results ?? []).map((row) => ({
    name: String(row.name),
    lat: Number(row.latitude),
    lon: Number(row.longitude),
    timezone: (row.timezone as string) ?? "UTC",
    country: (row.country as string) ?? null,
    admin1: (row.admin1 as string) ?? null,
  }));
}

export async function fetchReportDirect(params: {
  lat: number;
  lon: number;
  name?: string;
  timezone?: string;
}): Promise<WeatherReport> {
  const sp = new URLSearchParams({
    latitude: String(params.lat),
    longitude: String(params.lon),
    timezone: params.timezone ?? "auto",
    forecast_days: "7",
    current:
      "temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m",
    hourly: "temperature_2m,precipitation,weather_code",
    daily: "weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum",
  });
  const forecast = await getOpenMeteo<Record<string, unknown>>(`${FORECAST}?${sp}`);
  return buildReport(params.lat, params.lon, forecast, { name: params.name });
}

export async function fetchHistoryDirect(params: {
  lat: number;
  lon: number;
  timezone?: string;
  days: number;
}): Promise<HistoryResponse> {
  const { start, end } = historyRange(params.days);
  const sp = new URLSearchParams({
    latitude: String(params.lat),
    longitude: String(params.lon),
    start_date: start,
    end_date: end,
    timezone: params.timezone ?? "auto",
    daily: "weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum",
  });
  const raw = await getOpenMeteo<Record<string, unknown>>(`${ARCHIVE}?${sp}`);
  const report = buildReport(
    params.lat,
    params.lon,
    { timezone: raw.timezone ?? params.timezone },
    { history: raw },
  );
  const history = report.history ?? { start: null, end: null, daily: [] };
  return {
    location: report.location,
    history: {
      start: history.start,
      end: history.end,
      daily: history.daily,
    },
  };
}
