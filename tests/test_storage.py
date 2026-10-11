"""
Tests for app/storage.py.

Verifies database access functions using a temporary file-backed
SQLite database per test (via pytest's tmp_path fixture) to keep
tests fast, isolated, and capable of testing cross-connection
persistence.
"""

from __future__ import annotations

from datetime import datetime
from pathlib import Path

import pytest

from app.storage import add_event, get_events, init_db


# ---------------------------------------------------------------------------
# Fixture
# ---------------------------------------------------------------------------


@pytest.fixture
def db(tmp_path: Path) -> Path:
    """Return the path to a freshly initialised temporary database."""
    path = tmp_path / "tachyon_test.db"
    init_db(path)
    return path


# ===========================================================================
# init_db
# ===========================================================================


class TestInitDb:
    """Tests for database schema initialisation."""

    def test_init_creates_usable_database(self, db: Path) -> None:
        """After init, get_events should return an empty list (not raise)."""
        assert get_events(db) == []

    def test_repeated_init_does_not_raise(self, db: Path) -> None:
        """Calling init_db a second and third time must be safe."""
        init_db(db)
        init_db(db)
        assert get_events(db) == []

    def test_repeated_init_preserves_existing_data(self, db: Path) -> None:
        """Re-initialising must not truncate existing rows."""
        add_event(db, "ALPHA", 10, "Before reinit")
        init_db(db)
        assert len(get_events(db)) == 1


# ===========================================================================
# add_event — valid inputs
# ===========================================================================


class TestAddEventValid:
    """Tests for successful event insertion."""

    def test_returns_dict_with_expected_keys(self, db: Path) -> None:
        event = add_event(db, "ALPHA", 10, "Science fair")
        assert set(event.keys()) == {"id", "house", "points", "reason", "recorded_at"}

    def test_returned_fields_match_input(self, db: Path) -> None:
        event = add_event(db, "ALPHA", 10, "Science fair")
        assert event["house"] == "ALPHA"
        assert event["points"] == 10
        assert event["reason"] == "Science fair"

    def test_id_is_assigned(self, db: Path) -> None:
        event = add_event(db, "INFER", 5, "Quiz win")
        assert isinstance(event["id"], int)
        assert event["id"] >= 1

    def test_recorded_at_is_utc_iso8601(self, db: Path) -> None:
        event = add_event(db, "MATRIX", 20, "Hackathon")
        dt = datetime.fromisoformat(event["recorded_at"])
        assert dt.tzinfo is not None  # timezone-aware

    def test_house_name_normalised_to_uppercase(self, db: Path) -> None:
        event = add_event(db, "alpha", 5, "Lowercase input")
        assert event["house"] == "ALPHA"

    def test_mixed_case_house_normalised(self, db: Path) -> None:
        event = add_event(db, "MaTrIx", 15, "Mixed case")
        assert event["house"] == "MATRIX"

    def test_all_four_houses_accepted(self, db: Path) -> None:
        for house in ("ALPHA", "INFER", "MATRIX", "LAYER"):
            add_event(db, house, 1, f"{house} base event")
        events = get_events(db)
        assert {e["house"] for e in events} == {"ALPHA", "INFER", "MATRIX", "LAYER"}

    def test_large_points_value_accepted(self, db: Path) -> None:
        event = add_event(db, "LAYER", 10_000, "Grand prize")
        assert event["points"] == 10_000


# ===========================================================================
# add_event — invalid house names
# ===========================================================================


class TestAddEventInvalidHouse:
    """Tests for house validation on insertion."""

    def test_unknown_house_raises_value_error(self, db: Path) -> None:
        with pytest.raises(ValueError, match="Unknown house"):
            add_event(db, "DELTA", 10, "Bad house")

    def test_empty_house_raises_value_error(self, db: Path) -> None:
        with pytest.raises(ValueError):
            add_event(db, "", 10, "Empty house")

    def test_non_string_house_raises_value_error(self, db: Path) -> None:
        with pytest.raises(ValueError):
            add_event(db, 42, 10, "Non-string house")  # type: ignore[arg-type]

    def test_failed_insert_leaves_no_partial_record(self, db: Path) -> None:
        """Validation failure before any write — table must stay empty."""
        with pytest.raises(ValueError, match="Unknown house"):
            add_event(db, "BOGUS", 10, "Invalid house")
        assert get_events(db) == []


# ===========================================================================
# add_event — invalid points
# ===========================================================================


class TestAddEventInvalidPoints:
    """Tests for points validation on insertion."""

    def test_zero_raises_value_error(self, db: Path) -> None:
        with pytest.raises(ValueError):
            add_event(db, "ALPHA", 0, "Zero points")

    def test_negative_raises_value_error(self, db: Path) -> None:
        with pytest.raises(ValueError):
            add_event(db, "ALPHA", -5, "Negative points")

    def test_float_raises_type_error(self, db: Path) -> None:
        with pytest.raises(TypeError):
            add_event(db, "ALPHA", 1.5, "Float points")  # type: ignore[arg-type]

    def test_bool_raises_type_error(self, db: Path) -> None:
        with pytest.raises(TypeError):
            add_event(db, "ALPHA", True, "Bool points")  # type: ignore[arg-type]

    def test_string_points_raises_type_error(self, db: Path) -> None:
        with pytest.raises(TypeError):
            add_event(db, "ALPHA", "10", "String points")  # type: ignore[arg-type]


# ===========================================================================
# add_event — invalid reasons
# ===========================================================================


class TestAddEventInvalidReason:
    """Tests for reason validation on insertion."""

    def test_empty_string_raises_value_error(self, db: Path) -> None:
        with pytest.raises(ValueError):
            add_event(db, "ALPHA", 10, "")

    def test_whitespace_only_raises_value_error(self, db: Path) -> None:
        with pytest.raises(ValueError):
            add_event(db, "ALPHA", 10, "   ")

    def test_none_reason_raises_type_error(self, db: Path) -> None:
        with pytest.raises(TypeError):
            add_event(db, "ALPHA", 10, None)  # type: ignore[arg-type]

    def test_integer_reason_raises_type_error(self, db: Path) -> None:
        with pytest.raises(TypeError):
            add_event(db, "ALPHA", 10, 42)  # type: ignore[arg-type]


# ===========================================================================
# get_events
# ===========================================================================


class TestGetEvents:
    """Tests for event retrieval."""

    def test_empty_db_returns_empty_list(self, db: Path) -> None:
        assert get_events(db) == []

    def test_retrieved_event_has_all_fields(self, db: Path) -> None:
        add_event(db, "LAYER", 15, "Art project")
        events = get_events(db)
        assert set(events[0].keys()) == {"id", "house", "points", "reason", "recorded_at"}

    def test_retrieved_values_match_inserted(self, db: Path) -> None:
        add_event(db, "INFER", 25, "Debate trophy")
        event = get_events(db)[0]
        assert event["house"] == "INFER"
        assert event["points"] == 25
        assert event["reason"] == "Debate trophy"

    def test_house_stored_as_canonical_uppercase(self, db: Path) -> None:
        add_event(db, "layer", 10, "Lowercase input")
        assert get_events(db)[0]["house"] == "LAYER"

    def test_multiple_events_all_returned(self, db: Path) -> None:
        add_event(db, "ALPHA", 10, "First")
        add_event(db, "INFER", 20, "Second")
        add_event(db, "MATRIX", 30, "Third")
        assert len(get_events(db)) == 3

    def test_ordered_by_ascending_id(self, db: Path) -> None:
        """Events must be returned in insertion order, not arbitrary order."""
        add_event(db, "ALPHA", 10, "First")
        add_event(db, "INFER", 20, "Second")
        add_event(db, "MATRIX", 30, "Third")
        ids = [e["id"] for e in get_events(db)]
        assert ids == sorted(ids)

    def test_points_are_stored_correctly(self, db: Path) -> None:
        add_event(db, "ALPHA", 10, "Event A")
        add_event(db, "ALPHA", 30, "Event B")
        points = [e["points"] for e in get_events(db)]
        assert points == [10, 30]

    def test_isolation_between_tests(self, db: Path) -> None:
        """The db fixture is fresh per test — no bleed from other tests."""
        assert get_events(db) == []

    def test_persistence_across_separate_connections(self, tmp_path: Path) -> None:
        """Data written via one connection must survive a new connection."""
        path = tmp_path / "persist.db"
        init_db(path)
        add_event(path, "LAYER", 50, "Cross-connection check")

        # Deliberately open a new connection via a second get_events call.
        events = get_events(path)
        assert len(events) == 1
        assert events[0]["house"] == "LAYER"
        assert events[0]["points"] == 50
        assert events[0]["reason"] == "Cross-connection check"
