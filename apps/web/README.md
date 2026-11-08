# CoolWeather Web

Single-page query UI for the FastAPI backend.

## UX

1. **City search** — type a place name; debounced suggestions from `/api/v1/locations/search`; click a row to load the report.
2. **Lat / lon** — direct coordinate query with validation.
3. **Past weather** — optional; on the report, choose 7 / 14 / 30 days and click **View history**.

## Run (dev)

Terminal 1 — API:

```bash
cd apps/api && source .venv/bin/activate
uvicorn app.main:app --reload --port 8000
```

Terminal 2 — web (proxies `/api` to port 8000):

```bash
cd apps/web
npm install
npm run dev
```

Open [http://127.0.0.1:5173](http://127.0.0.1:5173).

## Production build

```bash
npm run build
```

Set `VITE_API_BASE` to your public API origin if the UI is not served behind the same host/proxy.
