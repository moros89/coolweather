from fastapi import APIRouter, Depends, Query

from app.deps import get_meteo_client
from app.schemas.report import LocationOut
from app.services.open_meteo import OpenMeteoClient, OpenMeteoError

router = APIRouter(prefix="/locations", tags=["locations"])


@router.get("/search", response_model=list[LocationOut])
async def search_locations(
    q: str = Query(min_length=1, max_length=100),
    count: int = Query(default=10, ge=1, le=20),
    client: OpenMeteoClient = Depends(get_meteo_client),
) -> list[LocationOut]:
    try:
        results = await client.search_locations(q, count=count)
    except OpenMeteoError as exc:
        from fastapi import HTTPException

        raise HTTPException(status_code=502, detail=str(exc)) from exc
    return [
        LocationOut(
            name=r.name,
            lat=r.lat,
            lon=r.lon,
            timezone=r.timezone,
            country=r.country,
            admin1=r.admin1,
        )
        for r in results
    ]
