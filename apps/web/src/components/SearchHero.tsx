import type { FormEvent } from "react";
import type { LocationResult } from "../types";
import { locationLabel } from "../weatherIcon";

interface Props {
  mode: "city" | "coordinates";
  onModeChange: (m: "city" | "coordinates") => void;
  query: string;
  onQueryChange: (q: string) => void;
  lat: string;
  lon: string;
  onLatChange: (v: string) => void;
  onLonChange: (v: string) => void;
  onCoordinateSubmit: (e: FormEvent) => void;
  suggestions: LocationResult[];
  searching: boolean;
  onSelectLocation: (loc: LocationResult) => void;
}

export function SearchHero(props: Props) {
  return (
    <section className="search-card glass">
      <div className="mode-tabs" role="tablist" aria-label="Query mode">
        <button
          type="button"
          role="tab"
          aria-selected={props.mode === "city"}
          className={props.mode === "city" ? "tab active" : "tab"}
          onClick={() => props.onModeChange("city")}
        >
          City search
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={props.mode === "coordinates"}
          className={props.mode === "coordinates" ? "tab active" : "tab"}
          onClick={() => props.onModeChange("coordinates")}
        >
          Lat / lon
        </button>
      </div>

      {props.mode === "city" ? (
        <div className="search-block">
          <label className="label" htmlFor="city-query">
            Place name
          </label>
          <div className="input-wrap">
            <input
              id="city-query"
              type="search"
              autoComplete="off"
              placeholder="e.g. Beijing, Tokyo, San Francisco"
              value={props.query}
              onChange={(e) => props.onQueryChange(e.target.value)}
            />
            {props.searching && <span className="input-hint">Searching…</span>}
          </div>

          {props.suggestions.length > 0 && (
            <ul className="suggestions" role="listbox">
              {props.suggestions.map((loc) => (
                <li key={`${loc.lat}-${loc.lon}-${loc.name}`}>
                  <button
                    type="button"
                    role="option"
                    className="suggestion"
                    onClick={() => props.onSelectLocation(loc)}
                  >
                    <span className="suggestion-name">{locationLabel(loc)}</span>
                    <span className="suggestion-meta">
                      {loc.lat.toFixed(2)}°, {loc.lon.toFixed(2)}°
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : (
        <form className="coord-form" onSubmit={props.onCoordinateSubmit}>
          <div className="coord-grid">
            <div>
              <label className="label" htmlFor="lat">
                Latitude
              </label>
              <input
                id="lat"
                inputMode="decimal"
                placeholder="39.90"
                value={props.lat}
                onChange={(e) => props.onLatChange(e.target.value)}
              />
            </div>
            <div>
              <label className="label" htmlFor="lon">
                Longitude
              </label>
              <input
                id="lon"
                inputMode="decimal"
                placeholder="116.40"
                value={props.lon}
                onChange={(e) => props.onLonChange(e.target.value)}
              />
            </div>
          </div>
          <button type="submit" className="btn primary">
            Get weather report
          </button>
        </form>
      )}
    </section>
  );
}
