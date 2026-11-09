import { useCallback, useEffect, useState } from "react";
import { addWatchlist, listWatchlist, removeWatchlist } from "../lib/watchlist";
import type { WatchlistEntry, WeatherReport } from "../types";
import { iconForCode, formatTemp } from "../weatherIcon";

interface Props {
  report: WeatherReport | null;
  onSelect: (entry: WatchlistEntry) => void;
  activeKey: string | null;
}

function entryKey(e: Pick<WatchlistEntry, "lat" | "lon">): string {
  return `${e.lat.toFixed(4)},${e.lon.toFixed(4)}`;
}

export function WatchlistPanel({ report, onSelect, activeKey }: Props) {
  const [items, setItems] = useState<WatchlistEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      setItems(await listWatchlist());
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Could not load saved cities");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const onSaveCurrent = async () => {
    if (!report) return;
    setMessage(null);
    try {
      const { location } = report;
      await addWatchlist({
        name: location.name,
        lat: location.lat,
        lon: location.lon,
        timezone: location.timezone,
      });
      await refresh();
      setMessage("Saved to your list.");
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Could not save");
    }
  };

  const onRemove = async (entry: WatchlistEntry) => {
    setMessage(null);
    try {
      await removeWatchlist(entry.id, entry.serverId);
      await refresh();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Could not remove");
    }
  };

  const currentSaved =
    report != null &&
    items.some(
      (i) =>
        Math.abs(i.lat - report.location.lat) < 0.0001 &&
        Math.abs(i.lon - report.location.lon) < 0.0001,
    );

  return (
    <section className="watchlist-card glass" aria-labelledby="watchlist-title">
      <div className="watchlist-head">
        <h2 id="watchlist-title" className="watchlist-title">
          Saved cities
        </h2>
        {report && (
          <button
            type="button"
            className="btn primary btn-sm"
            onClick={() => void onSaveCurrent()}
            disabled={currentSaved}
          >
            {currentSaved ? "Saved" : "Save current"}
          </button>
        )}
      </div>
      <p className="watchlist-hint">Quick access — stored in this browser{!report ? " (search a city first)" : ""}.</p>
      {message && <p className="watchlist-msg">{message}</p>}

      {loading ? (
        <p className="watchlist-empty">Loading…</p>
      ) : items.length === 0 ? (
        <p className="watchlist-empty">No saved cities yet.</p>
      ) : (
        <ul className="watchlist-list">
          {items.map((entry) => {
            const key = entryKey(entry);
            const isActive = activeKey === key;
            const icon =
              isActive && report ? iconForCode(report.current.weather_code) : "◌";
            const temp =
              isActive && report ? formatTemp(report.current.temperature, report.units.temperature) : null;
            return (
              <li key={entry.id}>
                <div className={`watchlist-row${isActive ? " active" : ""}`}>
                  <button
                    type="button"
                    className="watchlist-select"
                    onClick={() => onSelect(entry)}
                  >
                    <span className="watchlist-icon" aria-hidden>
                      {icon}
                    </span>
                    <span className="watchlist-name">{entry.name}</span>
                    {temp && <span className="watchlist-temp">{temp}</span>}
                  </button>
                  <button
                    type="button"
                    className="watchlist-remove"
                    aria-label={`Remove ${entry.name}`}
                    onClick={() => void onRemove(entry)}
                  >
                    ×
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
