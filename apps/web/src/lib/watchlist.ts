import { isStaticSite } from "../api";
import type { WatchlistEntry } from "../types";

const STORAGE_KEY = "coolweather.watchlist.v1";
const CLIENT_ID_KEY = "coolweather.clientId";

function readLocal(): WatchlistEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as WatchlistEntry[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeLocal(items: WatchlistEntry[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

export function getClientId(): string {
  let id = localStorage.getItem(CLIENT_ID_KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(CLIENT_ID_KEY, id);
  }
  return id;
}

async function apiJson<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      "X-Client-Id": getClientId(),
      ...(init?.headers ?? {}),
    },
  });
  if (!res.ok) {
    throw new Error(await res.text().catch(() => `Request failed (${res.status})`));
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export async function listWatchlist(): Promise<WatchlistEntry[]> {
  if (isStaticSite) return readLocal();
  const rows = await apiJson<
    { id: number; name: string; lat: number; lon: number; timezone: string }[]
  >("/api/v1/watchlist");
  return rows.map((r) => ({
    id: String(r.id),
    serverId: r.id,
    name: r.name,
    lat: r.lat,
    lon: r.lon,
    timezone: r.timezone,
  }));
}

export async function addWatchlist(entry: Omit<WatchlistEntry, "id" | "serverId">): Promise<WatchlistEntry> {
  if (isStaticSite) {
    const items = readLocal();
    const exists = items.some(
      (i) => Math.abs(i.lat - entry.lat) < 0.0001 && Math.abs(i.lon - entry.lon) < 0.0001,
    );
    if (exists) throw new Error("This place is already in your saved cities.");
    const created: WatchlistEntry = { ...entry, id: crypto.randomUUID() };
    writeLocal([...items, created]);
    return created;
  }
  const row = await apiJson<{ id: number; name: string; lat: number; lon: number; timezone: string }>(
    "/api/v1/watchlist",
    {
      method: "POST",
      body: JSON.stringify({
        name: entry.name,
        lat: entry.lat,
        lon: entry.lon,
        timezone: entry.timezone,
      }),
    },
  );
  return {
    id: String(row.id),
    serverId: row.id,
    name: row.name,
    lat: row.lat,
    lon: row.lon,
    timezone: row.timezone,
  };
}

export async function removeWatchlist(id: string, serverId?: number): Promise<void> {
  if (isStaticSite) {
    writeLocal(readLocal().filter((i) => i.id !== id));
    return;
  }
  const numericId = serverId ?? Number(id);
  if (Number.isNaN(numericId)) throw new Error("Invalid watchlist id");
  await apiJson(`/api/v1/watchlist/${numericId}`, { method: "DELETE" });
}
