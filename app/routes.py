"""
HTTP route definitions for the Tachyon application.

Maps URL endpoints to view functions.  All business logic is
delegated to scoring.py and storage.py — this module contains
no SQL, scoring algorithms, or validation rules.
"""

from __future__ import annotations

from flask import Blueprint, current_app, jsonify, render_template, request

from app import scoring, storage

bp = Blueprint("main", __name__)


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def _db() -> str:
    """Return the configured database path for the current app context."""
    return current_app.config["DATABASE"]


def _error(message: str, status: int):
    """Return a JSON error response."""
    return jsonify({"error": message}), status


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------


@bp.route("/")
def index():
    """Render the single-page application shell."""
    return render_template("index.html")


@bp.route("/api/leaderboard")
def leaderboard():
    """Return current scores, rankings, and winners for all four houses.

    Response shape::

        {
          "houses": [
            {"rank": 1, "house": "ALPHA", "score": 150},
            ...
          ],
          "winners": ["ALPHA"]
        }
    """
    events = storage.get_events(_db())
    scores = scoring.calculate_scores(events)
    ranked = scoring.rank_houses(scores)
    winners = scoring.get_winners(scores)

    return jsonify(
        {
            "houses": ranked,
            "winners": winners,
        }
    )


@bp.route("/api/events", methods=["GET"])
def list_events():
    """Return all recorded point events in insertion order.

    Response shape::

        {
          "events": [
            {
              "id": 1,
              "house": "ALPHA",
              "points": 10,
              "reason": "Science fair",
              "recorded_at": "2026-10-10T06:30:00+00:00"
            },
            ...
          ]
        }
    """
    events = storage.get_events(_db())
    return jsonify({"events": events})


@bp.route("/api/events", methods=["POST"])
def create_event():
    """Record a point-award event.

    Request body (``Content-Type: application/json``)::

        {"house": "ALPHA", "points": 10, "reason": "Science fair"}

    Success response (201)::

        {
          "event": {
            "id": 1,
            "house": "ALPHA",
            "points": 10,
            "reason": "Science fair",
            "recorded_at": "2026-10-10T06:30:00+00:00"
          }
        }

    Error responses (4xx) all have the shape ``{"error": "<message>"}``.
    """
    # Require JSON content type.
    if not request.is_json:
        return _error("Request must be JSON (Content-Type: application/json).", 415)

    body = request.get_json(silent=True)
    if body is None:
        return _error("Request body is not valid JSON.", 400)

    # Check required fields are present.
    missing = [f for f in ("house", "points", "reason") if f not in body]
    if missing:
        return _error(f"Missing required field(s): {', '.join(missing)}.", 400)

    house = body["house"]
    points = body["points"]
    reason = body["reason"]

    # Delegate validation and persistence to storage.  Map the domain
    # exceptions that storage/scoring raises to clean HTTP responses.
    try:
        event = storage.add_event(_db(), house, points, reason)
    except (TypeError, ValueError) as exc:
        return _error(str(exc), 422)

    return jsonify({"event": event}), 201
