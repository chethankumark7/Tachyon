"""
Database access layer for the Tachyon application.

Handles all SQLite interactions: connection management, schema
initialisation, and CRUD operations. Routes and scoring modules
should only access persistent data through this module.

Design note for Flask integration
----------------------------------
Each public function accepts an explicit ``db_path`` so that tests
can pass ``:memory:`` or a ``tmp_path`` file.  In the Flask layer,
``routes.py`` should derive the path from ``current_app.config``
and pass it here rather than having this module import Flask or
access ``g`` directly.  That keeps storage.py framework-agnostic
and independently testable.
"""

from __future__ import annotations

import sqlite3
from contextlib import closing
from datetime import datetime, timezone
from pathlib import Path

from app.scoring import normalize_house, validate_points

# ---------------------------------------------------------------------------
# Schema
# ---------------------------------------------------------------------------

_SCHEMA = """
CREATE TABLE IF NOT EXISTS point_events (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    house       TEXT    NOT NULL,
    points      INTEGER NOT NULL,
    reason      TEXT    NOT NULL,
    recorded_at TEXT    NOT NULL
);
"""

# ---------------------------------------------------------------------------
# Internal helpers
# ---------------------------------------------------------------------------


def _connect(db_path: str | Path) -> sqlite3.Connection:
    """Open a connection with Row factory enabled."""
    conn = sqlite3.connect(str(db_path))
    conn.row_factory = sqlite3.Row
    return conn


def _validate_reason(reason: object) -> str:
    """Return *reason* after asserting it is a non-empty string.

    Raises :exc:`TypeError` for non-string inputs and
    :exc:`ValueError` for blank strings.
    """
    if not isinstance(reason, str):
        raise TypeError(
            f"Reason must be a string, got {type(reason).__name__!r}."
        )
    if not reason.strip():
        raise ValueError("Reason must be a non-empty, non-whitespace string.")
    return reason


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------


def init_db(db_path: str | Path) -> None:
    """Create the database schema if it does not already exist.

    Safe to call repeatedly — uses ``CREATE TABLE IF NOT EXISTS``.
    Existing data is preserved on subsequent calls.

    Args:
        db_path: Path to the SQLite database file, or ``':memory:'``.
    """
    with closing(_connect(db_path)) as conn:
        # executescript issues an implicit COMMIT before running,
        # which is correct here since DDL is not transactional in SQLite.
        conn.executescript(_SCHEMA)


def add_event(
    db_path: str | Path,
    house: str,
    points: int,
    reason: str,
) -> dict:
    """Record a point-award event and return its stored representation.

    Validates all inputs before touching the database.  A failed
    validation raises before any write occurs, so no partial record
    is ever created.

    Args:
        db_path: Path to the SQLite database file.
        house:   House name (case-insensitive, normalised on storage).
        points:  Positive integer point value.
        reason:  Non-empty string describing why the points were awarded.

    Returns:
        Dict with keys ``id``, ``house``, ``points``, ``reason``,
        and ``recorded_at`` (ISO 8601 UTC string).

    Raises:
        ValueError: Invalid house name, non-positive points, or blank reason.
        TypeError:  Wrong type for points or reason.
    """
    # Validate all inputs before opening a connection.
    canonical = normalize_house(house)
    validated_points = validate_points(points)
    validated_reason = _validate_reason(reason)
    recorded_at = datetime.now(timezone.utc).isoformat()

    with closing(_connect(db_path)) as conn:
        with conn:  # auto-commits on success, rolls back on exception
            cursor = conn.execute(
                """
                INSERT INTO point_events (house, points, reason, recorded_at)
                VALUES (?, ?, ?, ?)
                """,
                (canonical, validated_points, validated_reason, recorded_at),
            )
            event_id = cursor.lastrowid

    return {
        "id": event_id,
        "house": canonical,
        "points": validated_points,
        "reason": validated_reason,
        "recorded_at": recorded_at,
    }


def get_events(db_path: str | Path) -> list[dict]:
    """Return all point events in insertion order (ascending ``id``).

    The deterministic ordering by ``id`` ensures that score totals
    computed from this list are reproducible.

    Args:
        db_path: Path to the SQLite database file.

    Returns:
        List of dicts with keys ``id``, ``house``, ``points``,
        ``reason``, and ``recorded_at``.  Empty list if no events exist.
    """
    with closing(_connect(db_path)) as conn:
        rows = conn.execute(
            """
            SELECT id, house, points, reason, recorded_at
            FROM point_events
            ORDER BY id ASC
            """
        ).fetchall()

    return [dict(row) for row in rows]
