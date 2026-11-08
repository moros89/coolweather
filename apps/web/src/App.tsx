import { useCallback, useEffect, useState, type FormEvent } from "react";
import { fetchReport, isStaticSite, searchLocations } from "./api";
import { ReportPanel } from "./components/ReportPanel";
import { SearchHero } from "./components/SearchHero";
import { LogoMark } from "./components/LogoMark";
import { WeatherBackground } from "./components/WeatherBackground";
import type { LocationResult, WeatherReport } from "./types";
import { isBrightSkyScene, sceneForCode } from "./weatherScene";

type QueryMode = "city" | "coordinates";

export function App() {
  const [mode, setMode] = useState<QueryMode>("city");
  const [query, setQuery] = useState("");
  const [lat, setLat] = useState("");
  const [lon, setLon] = useState("");
  const [suggestions, setSuggestions] = useState<LocationResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [loadingReport, setLoadingReport] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [report, setReport] = useState<WeatherReport | null>(null);

  useEffect(() => {
    if (mode !== "city") return;
    const trimmed = query.trim();
    if (trimmed.length < 2) {
      setSuggestions([]);
      return;
    }
    const t = window.setTimeout(async () => {
      setSearching(true);
      setError(null);
      try {
        const rows = await searchLocations(trimmed);
        setSuggestions(rows);
      } catch (e) {
        setSuggestions([]);
        setError(e instanceof Error ? e.message : "Search failed");
      } finally {
        setSearching(false);
      }
    }, 350);
    return () => window.clearTimeout(t);
  }, [query, mode]);

  const loadReport = useCallback(
    async (opts: { lat: number; lon: number; name?: string; timezone?: string }) => {
      setLoadingReport(true);
      setError(null);
      setSuggestions([]);
      try {
        const data = await fetchReport({ ...opts, historyDays: 0 });
        setReport(data);
      } catch (e) {
        setReport(null);
        setError(e instanceof Error ? e.message : "Failed to load report");
      } finally {
        setLoadingReport(false);
      }
    },
    [],
  );

  const onSelectLocation = (loc: LocationResult) => {
    const name = [loc.name, loc.country].filter(Boolean).join(", ");
    setQuery(name);
    void loadReport({
      lat: loc.lat,
      lon: loc.lon,
      name: loc.name,
      timezone: loc.timezone,
    });
  };

  const onCoordinateSubmit = (e: FormEvent) => {
    e.preventDefault();
    const latN = Number(lat);
    const lonN = Number(lon);
    if (Number.isNaN(latN) || Number.isNaN(lonN) || latN < -90 || latN > 90 || lonN < -180 || lonN > 180) {
      setError("Enter valid latitude (−90…90) and longitude (−180…180).");
      return;
    }
    void loadReport({ lat: latN, lon: lonN });
  };

  const weatherCode = report?.current.weather_code;
  const skyScene = sceneForCode(weatherCode);
  const brightSky = isBrightSkyScene(skyScene);

  return (
    <>
      <WeatherBackground weatherCode={weatherCode} />
      <div className="page" data-bright-sky={brightSky ? "" : undefined}>
      <header className="top">
        <div className="brand">
          <LogoMark className="brand-logo" size={46} />
          <h1>
            Cool<span className="serif">Weather</span>
          </h1>
        </div>
        <p className="tagline">Search any place and get a live weather report from Open-Meteo.</p>
      </header>

      <main className="main">
        <SearchHero
          mode={mode}
          onModeChange={setMode}
          query={query}
          onQueryChange={setQuery}
          lat={lat}
          lon={lon}
          onLatChange={setLat}
          onLonChange={setLon}
          onCoordinateSubmit={onCoordinateSubmit}
          suggestions={suggestions}
          searching={searching}
          onSelectLocation={onSelectLocation}
        />

        {error && (
          <div className="banner banner-error" role="alert">
            {error}
          </div>
        )}

        {loadingReport && (
          <div className="banner banner-loading" aria-live="polite">
            Loading report…
          </div>
        )}

        {report && !loadingReport && <ReportPanel report={report} />}
      </main>

      <footer className="footer">
        Data via{" "}
        <a href="https://open-meteo.com/" target="_blank" rel="noreferrer">
          Open-Meteo
        </a>
        {!isStaticSite && (
          <>
            {" · "}
            API{" "}
            <a href="http://127.0.0.1:8000/docs" target="_blank" rel="noreferrer">
              docs
            </a>
          </>
        )}
      </footer>
      </div>
    </>
  );
}
