from __future__ import annotations

import sqlite3
from pathlib import Path

from app.config import settings


def _sqlite_path() -> Path:
    url = settings.database_url
    if not url.startswith("sqlite"):
        raise ValueError("Only sqlite database_url is supported in v0.1")
    # sqlite+aiosqlite:///./coolweather.db -> coolweather.db
    path = url.split("///", 1)[-1]
    return Path(path)


def get_connection() -> sqlite3.Connection:
    path = _sqlite_path()
    conn = sqlite3.connect(path, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    return conn


def init_db() -> None:
    conn = get_connection()
    try:
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS watchlist (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                client_id TEXT NOT NULL,
                name TEXT NOT NULL,
                lat REAL NOT NULL,
                lon REAL NOT NULL,
                timezone TEXT NOT NULL DEFAULT 'auto',
                sort_order INTEGER NOT NULL DEFAULT 0,
                created_at TEXT NOT NULL DEFAULT (datetime('now'))
            )
            """
        )
        conn.execute(
            "CREATE INDEX IF NOT EXISTS idx_watchlist_client ON watchlist(client_id, sort_order)"
        )
        conn.commit()
    finally:
        conn.close()


def list_watchlist(client_id: str) -> list[dict]:
    conn = get_connection()
    try:
        rows = conn.execute(
            """
            SELECT id, name, lat, lon, timezone, sort_order
            FROM watchlist
            WHERE client_id = ?
            ORDER BY sort_order ASC, id ASC
            """,
            (client_id,),
        ).fetchall()
        return [dict(row) for row in rows]
    finally:
        conn.close()


def add_watchlist(client_id: str, name: str, lat: float, lon: float, timezone: str) -> dict:
    conn = get_connection()
    try:
        max_order = conn.execute(
            "SELECT COALESCE(MAX(sort_order), -1) + 1 FROM watchlist WHERE client_id = ?",
            (client_id,),
        ).fetchone()[0]
        cur = conn.execute(
            """
            INSERT INTO watchlist (client_id, name, lat, lon, timezone, sort_order)
            VALUES (?, ?, ?, ?, ?, ?)
            """,
            (client_id, name, lat, lon, timezone, max_order),
        )
        conn.commit()
        item_id = cur.lastrowid
        row = conn.execute(
            "SELECT id, name, lat, lon, timezone, sort_order FROM watchlist WHERE id = ?",
            (item_id,),
        ).fetchone()
        return dict(row)
    finally:
        conn.close()


def delete_watchlist(client_id: str, item_id: int) -> bool:
    conn = get_connection()
    try:
        cur = conn.execute(
            "DELETE FROM watchlist WHERE id = ? AND client_id = ?",
            (item_id, client_id),
        )
        conn.commit()
        return cur.rowcount > 0
    finally:
        conn.close()
