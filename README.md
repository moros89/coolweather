# CoolWeather

Weather reports powered by [Open-Meteo](https://open-meteo.com/): FastAPI backend, React web UI, animated backgrounds, and optional history.

**Live demo (GitHub Pages):** https://moros89.github.io/coolweather/

## Project layout

```
apps/api/   # FastAPI — geocoding, forecasts, watchlist (SQLite)
apps/web/   # Vite + React query UI
```

GitHub Pages serves the static web app and calls Open-Meteo from the browser. For local development you can use the FastAPI proxy instead.

## Local development

**API**

```bash
cd apps/api
python3 -m venv .venv && source .venv/bin/activate
pip install -e .
uvicorn app.main:app --reload --port 8000
```

**Web** (proxies `/api` to port 8000)

```bash
cd apps/web
npm install
npm run dev
```

Open http://127.0.0.1:5173

Share a place with URL query params, e.g. `?lat=35.6895&lon=139.6917&name=Tokyo&tz=Asia/Tokyo`.

## Roadmap (in progress)

1. **Permalinks + saved cities** — shareable URLs and browser/API watchlist
2. Hosted API + CI tests
3. Units, geolocation, history charts
4. PWA or Android client

## License

Apache 2.0 — see [LICENSE](LICENSE).
