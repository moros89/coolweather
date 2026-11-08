from fastapi import APIRouter, Depends, HTTPException

from app.db import watchlist as watchlist_db
from app.deps import require_client_id
from app.schemas.report import WatchlistCreate, WatchlistItem

router = APIRouter(prefix="/watchlist", tags=["watchlist"])


@router.get("", response_model=list[WatchlistItem])
def get_watchlist(client_id: str = Depends(require_client_id)) -> list[WatchlistItem]:
    items = watchlist_db.list_watchlist(client_id)
    return [WatchlistItem.model_validate(i) for i in items]


@router.post("", response_model=WatchlistItem, status_code=201)
def create_watchlist_item(
    body: WatchlistCreate,
    client_id: str = Depends(require_client_id),
) -> WatchlistItem:
    row = watchlist_db.add_watchlist(
        client_id, body.name, body.lat, body.lon, body.timezone
    )
    return WatchlistItem.model_validate(row)


@router.delete("/{item_id}", status_code=204)
def delete_watchlist_item(
    item_id: int,
    client_id: str = Depends(require_client_id),
) -> None:
    if not watchlist_db.delete_watchlist(client_id, item_id):
        raise HTTPException(status_code=404, detail="Watchlist item not found")
