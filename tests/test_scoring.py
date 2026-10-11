"""
Tests for app/scoring.py.

Verifies scoring and ranking logic in isolation,
without requiring a database or running Flask server.
"""

from __future__ import annotations

import pytest

from app.scoring import (
    HOUSES,
    PointEvent,
    calculate_scores,
    get_winners,
    normalize_house,
    rank_houses,
    validate_points,
)


# ===========================================================================
# normalize_house
# ===========================================================================


class TestNormalizeHouse:
    """Tests for house name normalisation and validation."""

    def test_all_four_houses_uppercase(self) -> None:
        """Canonical uppercase names are accepted and returned unchanged."""
        for house in HOUSES:
            assert normalize_house(house) == house

    def test_case_insensitive_lower(self) -> None:
        assert normalize_house("alpha") == "ALPHA"
        assert normalize_house("infer") == "INFER"
        assert normalize_house("matrix") == "MATRIX"
        assert normalize_house("layer") == "LAYER"

    def test_case_insensitive_mixed(self) -> None:
        assert normalize_house("Alpha") == "ALPHA"
        assert normalize_house("MaTrIx") == "MATRIX"

    def test_strips_surrounding_whitespace(self) -> None:
        assert normalize_house("  alpha  ") == "ALPHA"

    def test_unknown_house_raises_value_error(self) -> None:
        with pytest.raises(ValueError, match="Unknown house"):
            normalize_house("DELTA")

    def test_empty_string_raises_value_error(self) -> None:
        with pytest.raises(ValueError, match="Unknown house"):
            normalize_house("")

    def test_non_string_raises_value_error(self) -> None:
        with pytest.raises(ValueError):
            normalize_house(42)  # type: ignore[arg-type]

    def test_none_raises_value_error(self) -> None:
        with pytest.raises(ValueError):
            normalize_house(None)  # type: ignore[arg-type]


# ===========================================================================
# validate_points
# ===========================================================================


class TestValidatePoints:
    """Tests for point value validation."""

    def test_positive_integer_accepted(self) -> None:
        assert validate_points(1) == 1
        assert validate_points(100) == 100

    def test_zero_raises_value_error(self) -> None:
        with pytest.raises(ValueError, match="positive integer"):
            validate_points(0)

    def test_negative_raises_value_error(self) -> None:
        with pytest.raises(ValueError, match="positive integer"):
            validate_points(-5)

    def test_float_raises_type_error(self) -> None:
        with pytest.raises(TypeError):
            validate_points(1.0)  # type: ignore[arg-type]

    def test_float_non_integer_raises_type_error(self) -> None:
        with pytest.raises(TypeError):
            validate_points(1.5)  # type: ignore[arg-type]

    def test_bool_true_raises_type_error(self) -> None:
        """bool is a subclass of int; must be rejected explicitly."""
        with pytest.raises(TypeError):
            validate_points(True)  # type: ignore[arg-type]

    def test_bool_false_raises_type_error(self) -> None:
        with pytest.raises(TypeError):
            validate_points(False)  # type: ignore[arg-type]

    def test_string_raises_type_error(self) -> None:
        with pytest.raises(TypeError):
            validate_points("10")  # type: ignore[arg-type]

    def test_none_raises_type_error(self) -> None:
        with pytest.raises(TypeError):
            validate_points(None)  # type: ignore[arg-type]


# ===========================================================================
# calculate_scores
# ===========================================================================


class TestCalculateScores:
    """Tests for score accumulation from event lists."""

    def test_empty_events_all_zeros(self) -> None:
        scores = calculate_scores([])
        assert scores == {"ALPHA": 0, "INFER": 0, "MATRIX": 0, "LAYER": 0}

    def test_all_four_houses_always_present(self) -> None:
        scores = calculate_scores([PointEvent(house="ALPHA", points=10)])
        assert set(scores.keys()) == {"ALPHA", "INFER", "MATRIX", "LAYER"}

    def test_single_event_accumulates(self) -> None:
        scores = calculate_scores([PointEvent(house="ALPHA", points=5)])
        assert scores["ALPHA"] == 5

    def test_multiple_events_same_house(self) -> None:
        events = [
            PointEvent(house="INFER", points=10),
            PointEvent(house="INFER", points=20),
            PointEvent(house="INFER", points=5),
        ]
        scores = calculate_scores(events)
        assert scores["INFER"] == 35

    def test_multiple_events_different_houses(self) -> None:
        events = [
            PointEvent(house="ALPHA", points=10),
            PointEvent(house="MATRIX", points=30),
            PointEvent(house="LAYER", points=20),
        ]
        scores = calculate_scores(events)
        assert scores["ALPHA"] == 10
        assert scores["MATRIX"] == 30
        assert scores["LAYER"] == 20
        assert scores["INFER"] == 0

    def test_case_insensitive_house_names(self) -> None:
        events = [
            PointEvent(house="alpha", points=15),
            PointEvent(house="Alpha", points=10),
        ]
        scores = calculate_scores(events)
        assert scores["ALPHA"] == 25

    def test_invalid_house_raises_value_error(self) -> None:
        with pytest.raises(ValueError, match="Unknown house"):
            calculate_scores([PointEvent(house="DELTA", points=10)])

    def test_invalid_points_float_raises_type_error(self) -> None:
        with pytest.raises(TypeError):
            calculate_scores([{"house": "ALPHA", "points": 1.5}])  # type: ignore[list-item]

    def test_invalid_points_zero_raises_value_error(self) -> None:
        with pytest.raises(ValueError):
            calculate_scores([{"house": "ALPHA", "points": 0}])  # type: ignore[list-item]

    def test_invalid_points_negative_raises_value_error(self) -> None:
        with pytest.raises(ValueError):
            calculate_scores([{"house": "ALPHA", "points": -1}])  # type: ignore[list-item]

    def test_malformed_event_missing_house_key(self) -> None:
        with pytest.raises(KeyError):
            calculate_scores([{"points": 10}])  # type: ignore[list-item]

    def test_malformed_event_missing_points_key(self) -> None:
        with pytest.raises(KeyError):
            calculate_scores([{"house": "ALPHA"}])  # type: ignore[list-item]

    def test_malformed_event_not_a_mapping(self) -> None:
        with pytest.raises(TypeError):
            calculate_scores(["not_a_dict"])  # type: ignore[list-item]


# ===========================================================================
# rank_houses
# ===========================================================================


class TestRankHouses:
    """Tests for competition ranking."""

    def test_descending_order(self) -> None:
        scores = {"ALPHA": 30, "INFER": 20, "MATRIX": 10, "LAYER": 5}
        ranked = rank_houses(scores)
        assert [r["house"] for r in ranked] == ["ALPHA", "INFER", "MATRIX", "LAYER"]
        assert [r["score"] for r in ranked] == [30, 20, 10, 5]

    def test_ranks_are_correct(self) -> None:
        scores = {"ALPHA": 30, "INFER": 20, "MATRIX": 10, "LAYER": 5}
        ranked = rank_houses(scores)
        assert [r["rank"] for r in ranked] == [1, 2, 3, 4]

    def test_tied_scores_share_rank(self) -> None:
        """Two houses with equal scores must share the same rank."""
        scores = {"ALPHA": 50, "INFER": 50, "MATRIX": 20, "LAYER": 10}
        ranked = rank_houses(scores)
        rank_map = {r["house"]: r["rank"] for r in ranked}
        assert rank_map["ALPHA"] == rank_map["INFER"]

    def test_tied_rank_causes_skip(self) -> None:
        """After a two-way tie at rank 1, the next rank must be 3."""
        scores = {"ALPHA": 50, "INFER": 50, "MATRIX": 20, "LAYER": 10}
        ranked = rank_houses(scores)
        rank_map = {r["house"]: r["rank"] for r in ranked}
        assert rank_map["MATRIX"] == 3

    def test_all_zero_scores(self) -> None:
        scores = {"ALPHA": 0, "INFER": 0, "MATRIX": 0, "LAYER": 0}
        ranked = rank_houses(scores)
        assert len(ranked) == 4
        assert all(r["rank"] == 1 for r in ranked)

    def test_all_four_houses_included(self) -> None:
        scores = calculate_scores([])
        ranked = rank_houses(scores)
        assert {r["house"] for r in ranked} == set(HOUSES)

    def test_four_way_tie(self) -> None:
        scores = {"ALPHA": 10, "INFER": 10, "MATRIX": 10, "LAYER": 10}
        ranked = rank_houses(scores)
        assert all(r["rank"] == 1 for r in ranked)

    def test_competition_ranking_1_2_2_4(self) -> None:
        """Classic 1-2-2-4 scenario."""
        scores = {"ALPHA": 40, "INFER": 30, "MATRIX": 30, "LAYER": 10}
        ranked = rank_houses(scores)
        rank_map = {r["house"]: r["rank"] for r in ranked}
        assert rank_map["ALPHA"] == 1
        assert rank_map["INFER"] == 2
        assert rank_map["MATRIX"] == 2
        assert rank_map["LAYER"] == 4


# ===========================================================================
# get_winners
# ===========================================================================


class TestGetWinners:
    """Tests for winner detection."""

    def test_single_winner(self) -> None:
        scores = {"ALPHA": 50, "INFER": 30, "MATRIX": 20, "LAYER": 10}
        assert get_winners(scores) == ["ALPHA"]

    def test_co_winners_tied_top_score(self) -> None:
        scores = {"ALPHA": 50, "INFER": 50, "MATRIX": 20, "LAYER": 10}
        assert get_winners(scores) == ["ALPHA", "INFER"]

    def test_all_tied_returns_all_four(self) -> None:
        scores = {"ALPHA": 25, "INFER": 25, "MATRIX": 25, "LAYER": 25}
        winners = get_winners(scores)
        assert set(winners) == set(HOUSES)

    def test_no_winner_when_all_zero(self) -> None:
        scores = {"ALPHA": 0, "INFER": 0, "MATRIX": 0, "LAYER": 0}
        assert get_winners(scores) == []

    def test_no_winner_on_empty_scores(self) -> None:
        assert get_winners({}) == []

    def test_winners_sorted_alphabetically(self) -> None:
        """Result must be deterministic — sorted alphabetically."""
        scores = {"LAYER": 100, "ALPHA": 100, "INFER": 50, "MATRIX": 50}
        assert get_winners(scores) == ["ALPHA", "LAYER"]

    def test_winner_with_all_events_via_calculate_scores(self) -> None:
        """Integration smoke test: events → scores → winner."""
        events = [
            PointEvent(house="MATRIX", points=100),
            PointEvent(house="ALPHA", points=50),
        ]
        scores = calculate_scores(events)
        assert get_winners(scores) == ["MATRIX"]
