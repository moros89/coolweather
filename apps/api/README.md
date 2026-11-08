# CoolWeather API (FastAPI)

Open-Meteo-backed weather reports, multi-city watchlist, and history.

## Setup

```bash
cd apps/api
python3 -m venv .venv
source .venv/bin/activate
pip install -e .
```

## Run

```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Docs: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)

## Examples

```bash
# Search
curl 'http://127.0.0.1:8000/api/v1/locations/search?q=Beijing'

# Report (forecast + optional history)
curl 'http://127.0.0.1:8000/api/v1/reports?lat=39.9&lon=116.4&name=Beijing&history_days=7'

# Watchlist (send a stable client id)
curl -H 'X-Client-Id: demo-client-1' http://127.0.0.1:8000/api/v1/watchlist
```

## Configuration

Optional env vars (prefix `COOLWEATHER_`):

- `DATABASE_URL` — default `sqlite:///./coolweather.db`
- `FORECAST_CACHE_TTL_SECONDS` — reserved for future caching
