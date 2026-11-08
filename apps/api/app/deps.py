from fastapi import Header, HTTPException

from app.services.open_meteo import OpenMeteoClient

_meteo_client: OpenMeteoClient | None = None


def get_meteo_client() -> OpenMeteoClient:
    global _meteo_client
    if _meteo_client is None:
        _meteo_client = OpenMeteoClient()
    return _meteo_client


async def close_meteo_client() -> None:
    global _meteo_client
    if _meteo_client is not None:
        await _meteo_client.aclose()
        _meteo_client = None


def require_client_id(x_client_id: str | None = Header(default=None, alias="X-Client-Id")) -> str:
    if not x_client_id or not x_client_id.strip():
        raise HTTPException(
            status_code=400,
            detail="Missing X-Client-Id header (use a stable UUID per browser/device).",
        )
    return x_client_id.strip()
