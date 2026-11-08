import { useEffect, useState } from "react";
import { fetchHistory } from "../api";
import type { DailyRow, WeatherReport } from "../types";
import { formatTemp, iconForCode, shortDate, shortTime } from "../weatherIcon";

interface Props {
  report: WeatherReport;
}

const HISTORY_OPTIONS = [
  { value: 7, label: "7 days" },
  { value: 14, label: "14 days" },
  { value: 30, label: "30 days" },
] as const;

export function ReportPanel({ report }: Props) {
  const unit = report.units.temperature ?? "°C";
  const windUnit = report.units.wind_speed ?? "km/h";
  const { current, daily, hourly, location } = report;
  const nextHours = hourly.slice(0, 24);

  const [historyDays, setHistoryDays] = useState(14);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [historyRows, setHistoryRows] = useState<DailyRow[] | null>(null);
  const [historyRange, setHistoryRange] = useState<{ start: string; end: string } | null>(null);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [historyError, setHistoryError] = useState<string | null>(null);

  useEffect(() => {
    setHistoryOpen(false);
    setHistoryRows(null);
    setHistoryRange(null);
    setHistoryError(null);
  }, [location.lat, location.lon]);

  const loadHistory = async () => {
    setLoadingHistory(true);
    setHistoryError(null);
    try {
      const data = await fetchHistory({
        lat: location.lat,
        lon: location.lon,
        timezone: location.timezone,
        days: historyDays,
      });
      const daily = data.history.daily ?? [];
      if (daily.length === 0) {
        setHistoryRows([]);
        setHistoryRange(null);
        setHistoryError("No historical data returned for this range.");
      } else {
        setHistoryRows(daily);
        setHistoryRange({
          start: data.history.start ?? daily[0].date,
          end: data.history.end ?? daily[daily.length - 1].date,
        });
        setHistoryOpen(true);
      }
    } catch (e) {
      setHistoryError(e instanceof Error ? e.message : "Failed to load history");
      setHistoryRows(null);
    } finally {
      setLoadingHistory(false);
    }
  };

  return (
    <section className="report" aria-label="Weather report">
      <article className="current-card glass">
        <div className="current-head">
          <div>
            <h2 className="place-name">{location.name}</h2>
            <p className="place-meta">
              {location.lat.toFixed(2)}°, {location.lon.toFixed(2)}° · {location.timezone}
            </p>
          </div>
          <span className="weather-icon lg" aria-hidden>
            {iconForCode(current.weather_code)}
          </span>
        </div>
        <p className="temp-display">{formatTemp(current.temperature, unit)}</p>
        <p className="condition">{current.summary}</p>
        <div className="stats-grid">
          <div>
            <span className="stat-label">Feels like</span>
            <span className="stat-value">{formatTemp(current.apparent_temperature, unit)}</span>
          </div>
          <div>
            <span className="stat-label">Humidity</span>
            <span className="stat-value">
              {current.humidity != null ? `${Math.round(current.humidity)}%` : "—"}
            </span>
          </div>
          <div>
            <span className="stat-label">Wind</span>
            <span className="stat-value">
              {current.wind_speed != null
                ? `${Math.round(current.wind_speed)} ${windUnit}`
                : "—"}
            </span>
          </div>
        </div>
      </article>

      <article className="section-card glass">
        <h3 className="section-title">7-day forecast</h3>
        <div className="daily-row">
          {daily.map((day) => (
            <div key={day.date} className="daily-cell">
              <span className="daily-day">{shortDate(day.date)}</span>
              <span className="weather-icon sm" aria-hidden>
                {iconForCode(day.weather_code)}
              </span>
              <span className="daily-temps">
                <span className="hi">{formatTemp(day.temp_max, unit)}</span>
                <span className="lo">{formatTemp(day.temp_min, unit)}</span>
              </span>
              <span className="daily-precip" title="Precipitation sum">
                {day.precip_sum != null && day.precip_sum > 0
                  ? `${day.precip_sum.toFixed(1)} mm`
                  : ""}
              </span>
            </div>
          ))}
        </div>
      </article>

      <article className="section-card glass">
        <h3 className="section-title">Next 24 hours</h3>
        <div className="hourly-scroll">
          {nextHours.map((h) => (
            <div key={h.time} className="hour-cell">
              <span>{shortTime(h.time)}</span>
              <span className="weather-icon sm">{iconForCode(h.weather_code)}</span>
              <strong>{formatTemp(h.temperature, unit)}</strong>
            </div>
          ))}
        </div>
      </article>

      <article className="section-card glass history-cta-card">
        <h3 className="section-title">Past weather</h3>
        <p className="history-hint">Optional — load archived daily conditions when you need them.</p>
        <div className="history-actions">
          <label className="sr-only" htmlFor="history-range">
            History range
          </label>
          <select
            id="history-range"
            value={historyDays}
            onChange={(e) => setHistoryDays(Number(e.target.value))}
            disabled={loadingHistory}
          >
            {HISTORY_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                Last {opt.label}
              </option>
            ))}
          </select>
          <button
            type="button"
            className="btn primary"
            onClick={() => void loadHistory()}
            disabled={loadingHistory}
          >
            {loadingHistory ? "Loading…" : historyOpen ? "Refresh history" : "View history"}
          </button>
          {historyOpen && (
            <button
              type="button"
              className="btn ghost"
              onClick={() => setHistoryOpen(false)}
              disabled={loadingHistory}
            >
              Hide
            </button>
          )}
        </div>
        {historyError && (
          <p className="history-error" role="alert">
            {historyError}
          </p>
        )}

        {historyOpen && historyRows && historyRows.length > 0 && historyRange && (
          <div className="history-table-wrap history-table-spaced">
            <p className="history-range-label">
              {historyRange.start} — {historyRange.end}
            </p>
            <table className="history-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Condition</th>
                  <th>Low</th>
                  <th>High</th>
                  <th>Rain</th>
                </tr>
              </thead>
              <tbody>
                {historyRows.map((row) => (
                  <tr key={row.date}>
                    <td>{row.date}</td>
                    <td>
                      <span className="weather-icon xs" aria-hidden>
                        {iconForCode(row.weather_code)}
                      </span>{" "}
                      {row.summary}
                    </td>
                    <td>{formatTemp(row.temp_min, unit)}</td>
                    <td>{formatTemp(row.temp_max, unit)}</td>
                    <td>
                      {row.precip_sum != null && row.precip_sum > 0
                        ? `${row.precip_sum.toFixed(1)} mm`
                        : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </article>
    </section>
  );
}
