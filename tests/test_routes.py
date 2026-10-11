"""
Integration tests for the Flask routes (app/routes.py).

Uses Flask's test client with a temporary per-test SQLite database
to verify HTTP-level behaviour without coupling to internal details.
All 78 existing unit tests remain fully independent of this file.
"""

from __future__ import annotations

import json
from pathlib import Path

import pytest

from app import create_app


# ---------------------------------------------------------------------------
# Fixture
# ---------------------------------------------------------------------------


@pytest.fixture
def client(tmp_path: Path):
    """Return a Flask test client backed by an isolated temporary database."""
    db_path = tmp_path / "test_routes.db"
    app = create_app({"TESTING": True, "DATABASE": str(db_path)})
    with app.test_client() as client:
        yield client


# ---------------------------------------------------------------------------
# Helper
# ---------------------------------------------------------------------------

JSON_CT = {"Content-Type": "application/json"}


def post_event(client, house: str, points: int, reason: str):
    """POST a valid point-award event and return the response."""
    return client.post(
        "/api/events",
        data=json.dumps({"house": house, "points": points, "reason": reason}),
        headers=JSON_CT,
    )


# ===========================================================================
# GET /
# ===========================================================================


class TestIndex:
    def test_returns_200(self, client) -> None:
        resp = client.get("/")
        assert resp.status_code == 200

    def test_returns_html(self, client) -> None:
        resp = client.get("/")
        assert b"Tachyon" in resp.data
        assert resp.content_type.startswith("text/html")


# ===========================================================================
# GET /api/leaderboard
# ===========================================================================


class TestLeaderboard:
    def test_returns_200(self, client) -> None:
        resp = client.get("/api/leaderboard")
        assert resp.status_code == 200

    def test_returns_json(self, client) -> None:
        resp = client.get("/api/leaderboard")
        assert resp.is_json

    def test_empty_leaderboard_all_four_houses(self, client) -> None:
        data = client.get("/api/leaderboard").get_json()
        houses = {h["house"] for h in data["houses"]}
        assert houses == {"ALPHA", "INFER", "MATRIX", "LAYER"}

    def test_empty_leaderboard_all_zero_scores(self, client) -> None:
        data = client.get("/api/leaderboard").get_json()
        assert all(h["score"] == 0 for h in data["houses"])

    def test_empty_leaderboard_no_winners(self, client) -> None:
        data = client.get("/api/leaderboard").get_json()
        assert data["winners"] == []

    def test_scores_accumulate_after_events(self, client) -> None:
        post_event(client, "ALPHA", 30, "Hackathon")
        post_event(client, "ALPHA", 20, "Quiz")
        data = client.get("/api/leaderboard").get_json()
        alpha = next(h for h in data["houses"] if h["house"] == "ALPHA")
        assert alpha["score"] == 50

    def test_winner_set_correctly(self, client) -> None:
        post_event(client, "MATRIX", 100, "Championship")
        data = client.get("/api/leaderboard").get_json()
        assert data["winners"] == ["MATRIX"]

    def test_co_winners_on_tied_scores(self, client) -> None:
        post_event(client, "ALPHA", 50, "Event")
        post_event(client, "LAYER", 50, "Event")
        data = client.get("/api/leaderboard").get_json()
        assert set(data["winners"]) == {"ALPHA", "LAYER"}

    def test_houses_ordered_descending_by_score(self, client) -> None:
        post_event(client, "INFER", 10, "Low")
        post_event(client, "ALPHA", 50, "High")
        post_event(client, "MATRIX", 30, "Mid")
        data = client.get("/api/leaderboard").get_json()
        scores = [h["score"] for h in data["houses"]]
        assert scores == sorted(scores, reverse=True)

    def test_ranks_present_in_response(self, client) -> None:
        data = client.get("/api/leaderboard").get_json()
        assert all("rank" in h for h in data["houses"])

    def test_case_insensitive_house_recorded_and_scored(self, client) -> None:
        post_event(client, "alpha", 25, "Lower-case input")
        data = client.get("/api/leaderboard").get_json()
        alpha = next(h for h in data["houses"] if h["house"] == "ALPHA")
        assert alpha["score"] == 25


# ===========================================================================
# GET /api/events
# ===========================================================================


class TestListEvents:
    def test_returns_200(self, client) -> None:
        resp = client.get("/api/events")
        assert resp.status_code == 200

    def test_empty_database_returns_empty_list(self, client) -> None:
        data = client.get("/api/events").get_json()
        assert data["events"] == []

    def test_event_appears_after_insert(self, client) -> None:
        post_event(client, "LAYER", 15, "Art prize")
        data = client.get("/api/events").get_json()
        assert len(data["events"]) == 1

    def test_event_fields_correct(self, client) -> None:
        post_event(client, "INFER", 20, "Debate")
        event = client.get("/api/events").get_json()["events"][0]
        assert event["house"] == "INFER"
        assert event["points"] == 20
        assert event["reason"] == "Debate"
        assert "id" in event
        assert "recorded_at" in event

    def test_multiple_events_all_returned(self, client) -> None:
        post_event(client, "ALPHA", 10, "A")
        post_event(client, "INFER", 20, "B")
        post_event(client, "MATRIX", 30, "C")
        data = client.get("/api/events").get_json()
        assert len(data["events"]) == 3

    def test_events_returned_in_insertion_order(self, client) -> None:
        post_event(client, "ALPHA", 10, "First")
        post_event(client, "INFER", 20, "Second")
        events = client.get("/api/events").get_json()["events"]
        ids = [e["id"] for e in events]
        assert ids == sorted(ids)


# ===========================================================================
# POST /api/events — success
# ===========================================================================


class TestCreateEventSuccess:
    def test_returns_201(self, client) -> None:
        resp = post_event(client, "ALPHA", 10, "Science fair")
        assert resp.status_code == 201

    def test_returns_json(self, client) -> None:
        resp = post_event(client, "ALPHA", 10, "Science fair")
        assert resp.is_json

    def test_response_contains_event(self, client) -> None:
        data = post_event(client, "ALPHA", 10, "Science fair").get_json()
        assert "event" in data

    def test_returned_event_fields(self, client) -> None:
        data = post_event(client, "ALPHA", 10, "Science fair").get_json()
        event = data["event"]
        assert event["house"] == "ALPHA"
        assert event["points"] == 10
        assert event["reason"] == "Science fair"
        assert isinstance(event["id"], int)
        assert "recorded_at" in event

    def test_house_name_normalised(self, client) -> None:
        data = post_event(client, "alpha", 5, "Lower").get_json()
        assert data["event"]["house"] == "ALPHA"

    def test_all_four_houses_accepted(self, client) -> None:
        for house in ("ALPHA", "INFER", "MATRIX", "LAYER"):
            resp = post_event(client, house, 1, f"{house} event")
            assert resp.status_code == 201


# ===========================================================================
# POST /api/events — client errors
# ===========================================================================


class TestCreateEventErrors:
    def test_wrong_content_type_returns_415(self, client) -> None:
        resp = client.post(
            "/api/events",
            data="house=ALPHA&points=10&reason=Test",
            headers={"Content-Type": "application/x-www-form-urlencoded"},
        )
        assert resp.status_code == 415

    def test_invalid_json_body_returns_400(self, client) -> None:
        resp = client.post(
            "/api/events",
            data="not-json{{{{",
            headers=JSON_CT,
        )
        assert resp.status_code == 400

    def test_missing_house_returns_400(self, client) -> None:
        resp = client.post(
            "/api/events",
            data=json.dumps({"points": 10, "reason": "No house"}),
            headers=JSON_CT,
        )
        assert resp.status_code == 400

    def test_missing_points_returns_400(self, client) -> None:
        resp = client.post(
            "/api/events",
            data=json.dumps({"house": "ALPHA", "reason": "No points"}),
            headers=JSON_CT,
        )
        assert resp.status_code == 400

    def test_missing_reason_returns_400(self, client) -> None:
        resp = client.post(
            "/api/events",
            data=json.dumps({"house": "ALPHA", "points": 10}),
            headers=JSON_CT,
        )
        assert resp.status_code == 400

    def test_empty_body_returns_400(self, client) -> None:
        resp = client.post(
            "/api/events",
            data=json.dumps({}),
            headers=JSON_CT,
        )
        assert resp.status_code == 400

    def test_invalid_house_returns_422(self, client) -> None:
        resp = post_event(client, "DELTA", 10, "Bad house")
        assert resp.status_code == 422

    def test_zero_points_returns_422(self, client) -> None:
        resp = post_event(client, "ALPHA", 0, "Zero")
        assert resp.status_code == 422

    def test_negative_points_returns_422(self, client) -> None:
        resp = post_event(client, "ALPHA", -5, "Negative")
        assert resp.status_code == 422

    def test_float_points_returns_422(self, client) -> None:
        resp = post_event(client, "ALPHA", 1.5, "Float")
        assert resp.status_code == 422

    def test_string_points_returns_422(self, client) -> None:
        resp = client.post(
            "/api/events",
            data=json.dumps({"house": "ALPHA", "points": "ten", "reason": "String"}),
            headers=JSON_CT,
        )
        assert resp.status_code == 422

    def test_empty_reason_returns_422(self, client) -> None:
        resp = post_event(client, "ALPHA", 10, "")
        assert resp.status_code == 422

    def test_whitespace_reason_returns_422(self, client) -> None:
        resp = post_event(client, "ALPHA", 10, "   ")
        assert resp.status_code == 422

    def test_error_response_has_error_key(self, client) -> None:
        resp = post_event(client, "BOGUS", 10, "Bad house")
        assert "error" in resp.get_json()

    def test_no_stack_trace_in_error_response(self, client) -> None:
        """Internal details must never leak to the client."""
        data = post_event(client, "BOGUS", 10, "Bad house").get_json()
        assert "Traceback" not in data.get("error", "")
        assert "sqlite" not in str(data).lower()


# ===========================================================================
# Database isolation between tests
# ===========================================================================


class TestDatabaseIsolation:
    def test_each_test_starts_with_empty_database(self, client) -> None:
        """The client fixture provides a fresh database per test."""
        data = client.get("/api/events").get_json()
        assert data["events"] == []

    def test_events_do_not_bleed_between_tests(self, client) -> None:
        post_event(client, "ALPHA", 99, "Should not bleed")
        # Verify within the same test — separate tests get separate dbs
        data = client.get("/api/events").get_json()
        assert len(data["events"]) == 1
