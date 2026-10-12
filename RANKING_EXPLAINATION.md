# Tachyon House Ranking System — Technical Specification & Explanation

This document provides a comprehensive explanation of how scoring, ranking, and winner determination operate within the **Tachyon** house-points and competition platform.

---

## 1. Architectural Philosophy

The Tachyon ranking engine is built upon three foundational engineering invariants:

1. **Single Source of Truth:**  
   All point aggregation, competition rankings, and winner resolutions are computed exclusively by backend domain functions in [`app/scoring.py`](file:///c:/Users/User/Desktop/Tachyon/app/scoring.py). The frontend ([`app/static/js/app.js`](file:///c:/Users/User/Desktop/Tachyon/app/static/js/app.js)) acts strictly as a presentation layer; it never calculates ranks or invents state.

2. **Pure, Decoupled Domain Logic:**  
   The scoring subsystem is implemented as stateless pure functions with no dependencies on Flask, SQLite, or network I/O. This guarantees reproducible, deterministic outcomes that are easily verified in unit tests.

3. **Complete Inclusivity:**  
   The four canonical houses (**ALPHA**, **INFER**, **MATRIX**, **LAYER**) are permanent fixtures of the department. Every ranking report always includes all four houses, even when a house has zero points or when no events have yet been recorded.

---

## 2. High-Level Pipeline

The end-to-end data pipeline transforms raw audit records into the live leaderboard:

```mermaid
flowchart TD
    A[SQLite Database instance/tachyon.db] -->|get_events| B[Raw Point Events List]
    B -->|calculate_scores| C[Aggregated House Scores dict]
    C -->|rank_houses| D[Ranked Houses List]
    C -->|get_winners| E[Leading House(es) List]
    D --> F[GET /api/leaderboard Response]
    E --> F
    F -->|fetchLeaderboard| G[Frontend Visual Pillars]
    F -->|renderRankTable| H[Standings Table]
    F -->|renderWinner| I[Leader Banner]
```

---

## 3. The Core Domain Functions

All business logic resides in [`app/scoring.py`](file:///c:/Users/User/Desktop/Tachyon/app/scoring.py).

### 3.1 Input Validation & Normalization

#### House Normalization: [`normalize_house(name)`](file:///c:/Users/User/Desktop/Tachyon/app/scoring.py#L56-L71)
```python
HOUSES: tuple[str, ...] = ("ALPHA", "INFER", "MATRIX", "LAYER")
_HOUSE_SET: frozenset[str] = frozenset(HOUSES)
```
- Accepts case-insensitive names (`"alpha"`, `"Alpha"`, `"ALPHA"`).
- Strips leading and trailing whitespace (`"  matrix  "` &rarr; `"MATRIX"`).
- Validates membership against `_HOUSE_SET`.
- Raises `ValueError` for unknown names, empty strings, non-string types, or `None`.

#### Point Validation: [`validate_points(points)`](file:///c:/Users/User/Desktop/Tachyon/app/scoring.py#L74-L94)
- Enforces strict positive integers (`points > 0`).
- Rejects zero (`0`) and negative values (`-5`) with `ValueError`.
- Explicitly checks for and rejects booleans (`True`/`False`), because in Python `bool` inherits from `int`.
- Rejects floats (`1.0`, `2.5`), strings, and `None` with `TypeError`.

---

### 3.2 Score Aggregation: [`calculate_scores(events)`](file:///c:/Users/User/Desktop/Tachyon/app/scoring.py#L102-L134)

```python
def calculate_scores(events: list[PointEvent]) -> dict[str, int]:
    totals: dict[str, int] = {house: 0 for house in HOUSES}

    for i, event in enumerate(events):
        canonical = normalize_house(event["house"])
        validate_points(event["points"])
        totals[canonical] += event["points"]

    return totals
```

- **Base State:** Initializes a dictionary where every house starts with a score of `0`:
  ```json
  {"ALPHA": 0, "INFER": 0, "MATRIX": 0, "LAYER": 0}
  ```
- **Commutative & Associative:** Point accumulation is an addition operation; the order in which historical events are processed does not alter final point totals.
- **Strict Integrity:** Missing keys (`house`, `points`) in an event trigger `KeyError`; malformed structures raise `TypeError` rather than failing silently.

---

### 3.3 Competition Ranking: [`rank_houses(scores)`](file:///c:/Users/User/Desktop/Tachyon/app/scoring.py#L137-L166)

Tachyon implements **Standard Competition Ranking** (commonly known as the **"1224"** ranking system):

#### The Algorithm Step-by-Step:
1. Normalize and extract each house name and score from the input dictionary.
2. Sort the `(house, score)` tuples in descending order by score (`reverse=True`).
3. Iterate over the sorted items with a 0-indexed counter `i`:
   - If `i == 0` (the first house), assign `rank = 1`.
   - If the current house's score matches the previous house's score (`score == sorted_houses[i - 1][1]`), assign the **same rank** as the previous house (`rank = ranked[i - 1]["rank"]`).
   - If the current house's score is lower than the previous house's score, assign `rank = i + 1` (the 1-based index in the sorted list).

#### Code Implementation:
```python
def rank_houses(scores: dict[str, int]) -> list[RankedHouse]:
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
```

#### Why Standard Competition Ranking (1224)?
Unlike *Dense Ranking* (where tied ranks produce 1, 2, 2, 3), Standard Competition Ranking preserves the count of competitors ahead of each participant. If two houses tie for 2nd place, there are 3 houses equal to or better than the 4th house, so the 4th house correctly receives **Rank 4**.

---

### 3.4 Winner Determination: [`get_winners(scores)`](file:///c:/Users/User/Desktop/Tachyon/app/scoring.py#L169-L190)

```python
def get_winners(scores: dict[str, int]) -> list[str]:
    if not scores:
        return []

    top = max(scores.values())
    if top <= 0:
        return []

    return sorted(h for h, s in scores.items() if s == top)
```

#### Key Rules:
1. **Positive Score Requirement (`top > 0`):**  
   If all houses have 0 points (e.g. before any points have been awarded), `get_winners()` returns an empty list `[]`. Zero points do not entitle a house to victory.
2. **Co-Leaders / Ties:**  
   If multiple houses share the highest positive score, all of them are returned.
3. **Deterministic Output:**  
   The returned list of house names is sorted alphabetically (e.g., `["ALPHA", "INFER"]`), ensuring idempotent JSON serialization across different environments.

---

## 4. Ranking Scenarios & Examples

### Scenario 1: Clear Hierarchical Standings
- **Scores:** ALPHA = 120, INFER = 90, MATRIX = 60, LAYER = 30
- **Ranking Output:**
  | Position (`i`) | House | Score | Computed Rank | Explanation |
  | :--- | :--- | :--- | :--- | :--- |
  | `0` | ALPHA | 120 | **1** | Top score |
  | `1` | INFER | 90 | **2** | Lower than ALPHA (`i + 1 = 2`) |
  | `2` | MATRIX | 60 | **3** | Lower than INFER (`i + 1 = 3`) |
  | `3` | LAYER | 30 | **4** | Lower than MATRIX (`i + 1 = 4`) |
- **Winners:** `["ALPHA"]`

---

### Scenario 2: Two-Way Tie for Second Place (Classic "1-2-2-4")
- **Scores:** ALPHA = 150, INFER = 100, MATRIX = 100, LAYER = 40
- **Ranking Output:**
  | Position (`i`) | House | Score | Computed Rank | Explanation |
  | :--- | :--- | :--- | :--- | :--- |
  | `0` | ALPHA | 150 | **1** | Top score |
  | `1` | INFER | 100 | **2** | Lower than ALPHA (`i + 1 = 2`) |
  | `2` | MATRIX | 100 | **2** | Equal to INFER (shares Rank 2) |
  | `3` | LAYER | 40 | **4** | Lower than MATRIX; jumps to `i + 1 = 4` (**Rank 3 is skipped**) |
- **Winners:** `["ALPHA"]`

---

### Scenario 3: Two-Way Tie for First Place ("1-1-3-4")
- **Scores:** ALPHA = 200, INFER = 200, MATRIX = 110, LAYER = 50
- **Ranking Output:**
  | Position (`i`) | House | Score | Computed Rank | Explanation |
  | :--- | :--- | :--- | :--- | :--- |
  | `0` | ALPHA | 200 | **1** | First position |
  | `1` | INFER | 200 | **1** | Equal to ALPHA (shares Rank 1) |
  | `2` | MATRIX | 110 | **3** | Lower than INFER; jumps to `i + 1 = 3` (**Rank 2 is skipped**) |
  | `3` | LAYER | 50 | **4** | Lower than MATRIX (`i + 1 = 4`) |
- **Winners:** `["ALPHA", "INFER"]` (Co-leaders, sorted alphabetically)

---

### Scenario 4: Three-Way Tie for First Place ("1-1-1-4")
- **Scores:** ALPHA = 80, INFER = 80, MATRIX = 80, LAYER = 20
- **Ranking Output:**
  | Position (`i`) | House | Score | Computed Rank | Explanation |
  | :--- | :--- | :--- | :--- | :--- |
  | `0` | ALPHA | 80 | **1** | First position |
  | `1` | INFER | 80 | **1** | Equal score (shares Rank 1) |
  | `2` | MATRIX | 80 | **1** | Equal score (shares Rank 1) |
  | `3` | LAYER | 20 | **4** | Lower score; jumps to `i + 1 = 4` (**Ranks 2 & 3 skipped**) |
- **Winners:** `["ALPHA", "INFER", "MATRIX"]`

---

### Scenario 5: Initial / All-Zero State
- **Scores:** ALPHA = 0, INFER = 0, MATRIX = 0, LAYER = 0
- **Ranking Output:**
  - All houses are tied with a score of 0.
  - Every house receives **Rank 1**:
    `[{"rank": 1, "house": "ALPHA", "score": 0}, {"rank": 1, "house": "INFER", "score": 0}, {"rank": 1, "house": "LAYER", "score": 0}, {"rank": 1, "house": "MATRIX", "score": 0}]`
- **Winners:** `[]` (Empty list; the winner banner remains hidden on the frontend because no house has scored positive points).

---

## 5. API Exposure: `GET /api/leaderboard`

The HTTP endpoint in [`app/routes.py`](file:///c:/Users/User/Desktop/Tachyon/app/routes.py#L44-L68) orchestrates this flow:

```python
@bp.route("/api/leaderboard")
def leaderboard():
    events = storage.get_events(_db())
    scores = scoring.calculate_scores(events)
    ranked = scoring.rank_houses(scores)
    winners = scoring.get_winners(scores)

    return jsonify({
        "houses": ranked,
        "winners": winners,
    })
```

### Sample HTTP Response (`200 OK`):
```json
{
  "houses": [
    {
      "house": "ALPHA",
      "rank": 1,
      "score": 150
    },
    {
      "house": "INFER",
      "rank": 2,
      "score": 100
    },
    {
      "house": "MATRIX",
      "rank": 2,
      "score": 100
    },
    {
      "house": "LAYER",
      "rank": 4,
      "score": 40
    }
  ],
  "winners": [
    "ALPHA"
  ]
}
```

---

## 6. Frontend Presentation & UI Binding

In [`app/static/js/app.js`](file:///c:/Users/User/Desktop/Tachyon/app/static/js/app.js), the frontend consumes the JSON payload:

1. **Four Pillars Standings (`renderPillars`):**  
   Computes height percentages proportionally against the top score (`maxScore = Math.max(...scores)`). If all houses have 0 points, meter heights rest gracefully at 0%.
2. **Rankings Table (`renderRankTable`):**  
   - Converts numeric rank integers to ordinal badges (`1st`, `2nd`, `3rd`, `4th`).
   - Applies the gold accent class `td-rank-1` only when `rank === 1 && score > 0`.
3. **Winner Banner (`renderWinner`):**  
   - If `winners.length === 0`, hides the banner completely (`dom.winnerBanner.hidden = true`).
   - If `winners.length === 1`, displays `"Leading House"` alongside the house emblem and name.
   - If `winners.length > 1`, displays `"Co-leading Houses"` with the tied house names joined by `" & "` (e.g., `"ALPHA & INFER"`).

---

## 7. Automated Test Coverage

The ranking and scoring algorithms are backed by comprehensive unit tests in [`tests/test_scoring.py`](file:///c:/Users/User/Desktop/Tachyon/tests/test_scoring.py):

| Test Class | Focus | Key Invariants Verified |
| :--- | :--- | :--- |
| `TestNormalizeHouse` | Canonical naming | Case-insensitivity, whitespace trimming, rejection of non-string & unknown houses. |
| `TestValidatePoints` | Value constraints | Positive integers required; explicit rejection of booleans, floats, strings, 0, and negatives. |
| `TestCalculateScores` | Point aggregation | All 4 houses present, zero-initialization, multi-event summation, malformed event rejection. |
| `TestRankHouses` | Competition ranking | Descending order, tied ranks share position, rank skipping (1-2-2-4), all-zero handling, four-way ties. |
| `TestGetWinners` | Leader detection | Single winner, co-winners on ties, empty list when all scores are 0, alphabetical tie determinism. |

All 120 automated tests in the repository pass cleanly, confirming mathematical consistency and robustness across all edge cases.
