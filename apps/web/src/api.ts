import type { HistoryResponse, LocationResult, WeatherReport } from "./types";
import {
  fetchHistoryDirect,
  fetchReportDirect,
  searchLocationsDirect,
} from "./api/directOpenMeteo";

const API_BASE = import.meta.env.VITE_API_BASE ?? "";
const STATIC_SITE = import.meta.env.VITE_STATIC_SITE === "true";

function useDirectClient(): boolean {
  return STATIC_SITE || (!API_BASE && import.meta.env.PROD);
}

async function getJson<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`);
  if (!res.ok) {
    const detail = await res.text();
    throw new Error(detail || `Request failed (${res.status})`);
  }
  return res.json() as Promise<T>;
}

export function searchLocations(query: string): Promise<LocationResult[]> {
  if (useDirectClient()) return searchLocationsDirect(query);
  const q = encodeURIComponent(query.trim());
  return getJson(`/api/v1/locations/search?q=${q}&count=8`);
}

export function fetchReport(params: {
  lat: number;
  lon: number;
  name?: string;
  timezone?: string;
  historyDays?: number;
}): Promise<WeatherReport> {
  if (useDirectClient()) {
    return fetchReportDirect(params);
  }
  const sp = new URLSearchParams({
    lat: String(params.lat),
    lon: String(params.lon),
    forecast_days: "7",
    history_days: String(params.historyDays ?? 0),
  });
  if (params.name) sp.set("name", params.name);
  if (params.timezone) sp.set("timezone", params.timezone);
  return getJson(`/api/v1/reports?${sp}`);
}

export type { HistoryResponse } from "./types";

export function fetchHistory(params: {
  lat: number;
  lon: number;
  timezone?: string;
  days: number;
}): Promise<HistoryResponse> {
  if (useDirectClient()) return fetchHistoryDirect(params);
  const sp = new URLSearchParams({
    lat: String(params.lat),
    lon: String(params.lon),
    days: String(params.days),
  });
  if (params.timezone) sp.set("timezone", params.timezone);
  return getJson(`/api/v1/reports/history?${sp}`);
}

export const isStaticSite = useDirectClient();
