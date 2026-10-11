"""
Scoring and ranking logic for the Tachyon house points system.

Contains pure functions for calculating points, rankings, and
any scoring rules. Has no dependencies on Flask or the database
layer, keeping business logic independently testable.
"""

from __future__ import annotations

from typing import TypedDict

# ---------------------------------------------------------------------------
# House registry
# ---------------------------------------------------------------------------

#: Canonical (uppercase) names for the four supported houses.
HOUSES: tuple[str, ...] = ("ALPHA", "INFER", "MATRIX", "LAYER")

#: Lookup set for O(1) membership tests (uppercase keys).
_HOUSE_SET: frozenset[str] = frozenset(HOUSES)


# ---------------------------------------------------------------------------
# Types
# ---------------------------------------------------------------------------


class PointEvent(TypedDict):
    """A single point-award event."""

    house: str
    points: int


class HouseScore(TypedDict):
    """Aggregated score for one house."""

    house: str
    score: int


class RankedHouse(TypedDict):
    """House with its competition rank and aggregated score."""

    rank: int
    house: str
    score: int


# ---------------------------------------------------------------------------
# Validation helpers
# ---------------------------------------------------------------------------


def normalize_house(name: object) -> str:
    """Return the canonical (uppercase) house name for *name*.

    Matching is case-insensitive.  Raises :exc:`ValueError` for unknown
    or non-string inputs.
    """
    if not isinstance(name, str):
        raise ValueError(
            f"House name must be a string, got {type(name).__name__!r}."
        )
    canonical = name.strip().upper()
    if canonical not in _HOUSE_SET:
        raise ValueError(
            f"Unknown house {name!r}. Valid houses: {', '.join(HOUSES)}."
        )
    return canonical


def validate_points(points: object) -> int:
    """Return *points* unchanged after asserting it is a positive integer.

    Rejects zero, negative numbers, floats, booleans, and strings.
    Raises :exc:`TypeError` for wrong types and :exc:`ValueError` for
    out-of-range integers.
    """
    # bool is a subclass of int in Python — reject it explicitly.
    if isinstance(points, bool):
        raise TypeError(
            f"Points must be a positive integer, got bool ({points!r})."
        )
    if not isinstance(points, int):
        raise TypeError(
            f"Points must be a positive integer, got {type(points).__name__!r}."
        )
    if points <= 0:
        raise ValueError(
            f"Points must be a positive integer, got {points!r}."
        )
    return points


# ---------------------------------------------------------------------------
# Core scoring functions
# ---------------------------------------------------------------------------


def calculate_scores(events: list[PointEvent]) -> dict[str, int]:
    """Aggregate points per house from a list of point events.

    Every event must be a mapping with ``'house'`` and ``'points'`` keys.
    Malformed events raise :exc:`KeyError`, :exc:`TypeError`, or
    :exc:`ValueError` rather than being silently ignored.

    All four houses are always present in the returned dict (score 0 if
    no events recorded for that house).

    Args:
        events: Sequence of :class:`PointEvent` dicts.

    Returns:
        Mapping of canonical house name → total points.
    """
    totals: dict[str, int] = {house: 0 for house in HOUSES}

    for i, event in enumerate(events):
        try:
            house = event["house"]
            points = event["points"]
        except (KeyError, TypeError) as exc:
            raise type(exc)(
                f"Event at index {i} is malformed: {exc}. "
                f"Expected keys 'house' and 'points'."
            ) from exc

        canonical = normalize_house(house)
        validate_points(points)
        totals[canonical] += points

    return totals


def rank_houses(scores: dict[str, int]) -> list[RankedHouse]:
    """Produce a competition-ranked list of all houses in descending order.

    Houses with equal scores share the same rank (1, 2, 2, 4 — standard
    competition ranking).  All four houses are always included.

    Args:
        scores: Mapping of house name → score, as returned by
            :func:`calculate_scores`.

    Returns:
        List of :class:`RankedHouse` dicts sorted descending by score.
    """
    sorted_houses = sorted(
        ((normalize_house(h), s) for h, s in scores.items()),
        key=lambda x: x[1],
        reverse=True,
    )

    ranked: list[RankedHouse] = []
    for i, (house, score) in enumerate(sorted_houses):
        if i == 0:
            rank = 1
        elif score == sorted_houses[i - 1][1]:
            rank = ranked[i - 1]["rank"]
        else:
            rank = i + 1
        ranked.append(RankedHouse(rank=rank, house=house, score=score))

    return ranked


def get_winners(scores: dict[str, int]) -> list[str]:
    """Return the house(es) with the highest positive score.

    Returns an empty list when every house has zero (or no) points,
    or when *scores* is empty.  Multiple houses are returned when they
    are tied for the top score.

    Args:
        scores: Mapping of house name → score, as returned by
            :func:`calculate_scores`.

    Returns:
        Sorted list of canonical house names that are tied for first.
    """
    if not scores:
        return []

    top = max(scores.values())
    if top <= 0:
        return []

    return sorted(h for h, s in scores.items() if s == top)
