# TACHYON

> **House-Points & Competition Platform for the AIML Technical Department**  
> *A unified full-stack application pairing a scroll-synchronized cinematic cosmic journey with authoritative real-time house rankings, immutable audit logging, and point management.*

---

## 1. Project Overview

**Tachyon** is the official house-points and competition platform designed for the AIML technical department. It organizes students and technical contributors into four canonical houses:

- **ALPHA** — Systems Architecture, Low-Latency Computing & Competitive Speed (Electric Azure)
- **INFER** — Machine Learning Inference, AI Workflows & Autonomous Pipelines (Solar Flame)
- **MATRIX** — Mathematical Foundations, Linear Algebra & GPU Tensor Kernels (Jade Matrix)
- **LAYER** — Deep Neural Topologies, Foundation Architectures & Emergent AI (Royal Violet)

The platform pairs an immersive, scroll-driven cinematic journey (featuring deep space celestial visuals, video acceleration scrubbing, and a custom canvas meteor cursor) with an authoritative, rock-solid Flask/SQLite backend engine that computes competition standings, handles point submissions, and maintains a transparent, tamper-evident audit ledger.

---

## 2. Problem Statement

Technical departments and student competition cohorts frequently struggle with:
1. **Opaque Scoring Systems:** Unclear criteria and lack of historical traceability for awarded points.
2. **Disconnected Engagement:** Traditional competition dashboards are often dry, uninspired spreadsheets that fail to generate enthusiasm or pride in technical houses.
3. **Complex Setup Overhead:** Heavy frameworks requiring secondary database daemons, container clusters, or multi-process frontends make local execution brittle.

**Tachyon solves this** by providing:
- A single-command, zero-external-dependency deployment powered by Python, Flask, SQLite, and vanilla modern web technologies.
- A mathematically deterministic, pure-Python domain scoring model that guarantees reproducible rankings and handles competition ties correctly.
- A captivating cinematic frontend that welcomes visitors through a scroll-controlled space exploration before revealing the live operational headquarters.

---

## 3. Key Features

- **Scroll-Synchronized Cinematic Journey:**
  - **Scene A (Cosmic Void & Emergence):** Smooth scroll-driven spiral galaxy zoom and rotation, monumental `TACHYON` title reveal, followed by a deliberate 2-second cinematic freeze frame.
  - **Scene B (Galaxy Acceleration):** Scroll-controlled frame scrubbing through cinematic footage (`gala-zoom.mp4`) accompanied by radial warp-speed stardust streaks and typographic storytelling.
  - **Scene C (Dawn Singularity & Four Houses):** Seamless transition into desert dunes footage (`desert-next.mp4`) with golden dawn light blending, introducing all four canonical houses.
- **Fluid Meteor Cursor:**
  - Canvas-rendered electric-blue and ionized-gold ribbon tail that dynamically tracks mouse movement speed and emits trailing cosmic embers.
- **The Four Pillars Standings:**
  - Proportional vertical bar meters that visually compare scores across Alpha, Infer, Matrix, and Layer in real time.
  - Automatic Leader Banner identifying the current first-place house or co-leaders in case of ties.
- **Standard Competition Ranking (1224):**
  - Ranks houses descending by score. Tied scores share the higher rank, skipping subsequent ranks (e.g., if two houses tie for Rank 2, the next house is ranked 4th).
- **Interactive Point Award System:**
  - Validated scoring form supporting house selection, positive integer point values, and descriptive achievement reasons.
  - Client-side and server-side validation with duplicate-submission protection and loading spinners.
- **Immutable Event Audit Stream:**
  - Real-time chronological audit ledger detailing the recipient house, point delta, achievement rationale, and ISO 8601 UTC timestamp.
- **Department Guide & Lore:**
  - Clear architectural breakdown of all four houses and governing competition rules.
- **Comprehensive Test Suite:**
  - 120 automated unit and integration tests passing with 100% test reliability.

---

## 4. Technology Stack

- **Backend:** Python 3.10+, Flask 3.x
- **Storage:** SQLite 3 (isolated `instance/tachyon.db`)
- **Frontend:** Vanilla HTML5, Vanilla CSS3 (Custom Design System & CSS Variables), Vanilla JavaScript (ES2022)
- **Testing:** `pytest` (120 test cases covering domain scoring, storage persistence, and HTTP API contracts)
- **Zero Heavy Frontend Frameworks:** No React, Vue, Tailwind, or complex build pipelines required. Everything runs out of the box directly through Flask.

---

## 5. Project Structure

```
Tachyon/
├── app/
│   ├── __init__.py          # Flask application factory (create_app) & database bootstrap
│   ├── routes.py            # HTTP route definitions and REST API endpoints
│   ├── scoring.py           # Pure domain scoring functions (normalize, rank, winners)
│   ├── storage.py           # SQLite persistence layer and query handling
│   ├── static/
│   │   ├── assets/
│   │   │   └── galaxy.jpg   # Deep space celestial galaxy background
│   │   ├── assets-video/
│   │   │   ├── gala-zoom.mp4    # Cinematic galaxy acceleration footage
│   │   │   └── desert-next.mp4  # Cinematic desert dawn and horizon footage
│   │   ├── css/
│   │   │   └── style.css    # Unified design tokens, cinematic stage, & UI styles
│   │   └── js/
│   │       └── app.js       # Meteor cursor, particle engine, video scrubbing, & API sync
│   └── templates/
│       └── index.html       # Single-page application shell & cinematic stage
├── instance/
│   ├── .gitkeep             # Preserves instance directory structure
│   └── tachyon.db           # SQLite database (auto-generated at runtime)
├── tests/
│   ├── test_routes.py       # Integration tests for HTTP routes and status codes
│   ├── test_scoring.py      # Unit tests for scoring logic, normalisation, and ranking
│   └── test_storage.py      # Unit tests for database CRUD, isolation, and constraints
├── prototypes/              # Design sandboxes and developmental exploration files
├── GEMINI.md                # Project development guidelines and architecture invariants
├── requirements.txt         # Core dependencies (Flask, pytest)
├── run.py                   # Local application runner entrypoint
└── README.md                # Project documentation and submission guide
```

---

## 6. Prerequisites

- **Python:** Version 3.10 or higher.
- **Operating System:** Windows, macOS, or Linux.
- **Modern Web Browser:** Google Chrome, Microsoft Edge, Mozilla Firefox, or Apple Safari with hardware acceleration enabled.

---

## 7. Installation Instructions

1. **Clone the repository:**
   ```bash
   git clone https://github.com/your-username/tachyon.git
   cd tachyon
   ```

2. **Create and activate a Python virtual environment (recommended):**
   ```bash
   # Windows (PowerShell)
   python -m venv .venv
   .\.venv\Scripts\Activate.ps1

   # macOS / Linux
   python3 -m venv .venv
   source .venv/bin/activate
   ```

3. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

---

## 8. How to Run Locally

You can launch the integrated application directly using the provided entry point:

```bash
python run.py
```

Or via Flask's built-in CLI:

```bash
python -m flask --app app run --port 5000
```

Once started, open your web browser and navigate to:
```
http://127.0.0.1:5000/
```

- Scroll down to experience the cinematic voyage into the desert singularity.
- Or use the top-right navigation links (`Standings`, `Award Points`, `History`, `Guide`) to glide directly to any section.

---

## 9. How to Run the Test Suite

Execute the comprehensive automated test suite using `pytest`:

```bash
python -m pytest -v
```

### Expected Output:
```
============================= test session starts =============================
collected 120 items

tests/test_routes.py::TestIndex::test_returns_200 PASSED                [  0%]
tests/test_routes.py::TestIndex::test_returns_html PASSED               [  1%]
...
tests/test_scoring.py::TestRankHouses::test_competition_ranking_1_2_2_4 PASSED [ 66%]
tests/test_scoring.py::TestGetWinners::test_co_winners_tied_top_score PASSED [ 68%]
...
tests/test_storage.py::TestGetEvents::test_persistence_across_separate_connections PASSED [100%]

============================= 120 passed in 3.12s =============================
```

All 120 tests run against isolated, in-memory/temporary databases to guarantee that local development data is never contaminated.

---

## 10. Scoring Calculation & Ranking Rules

Tachyon implements strict domain rules defined in [`app/scoring.py`](file:///c:/Users/User/Desktop/Tachyon/app/scoring.py):

1. **Canonical House Normalization:**
   - House names are case-insensitive and stripped of whitespace upon entry, normalized to: `ALPHA`, `INFER`, `MATRIX`, `LAYER`.
2. **Point Validation:**
   - Points must be strictly positive integers ($\ge 1$). Zero, negative numbers, floats, booleans, and non-numeric types are rejected.
3. **Score Accumulation:**
   - Every house starts at zero points. Point events accumulate additively.
4. **Standard Competition Ranking (1224):**
   - Houses are ranked in descending order of points.
   - If multiple houses have identical point totals, they receive the same rank.
   - The subsequent rank numbers are skipped (e.g., scores 100, 80, 80, 60 result in Ranks 1, 2, 2, 4).
5. **Winner / Leader Determination:**
   - The house with the highest point total is the winner.
   - If the highest score is tied, all houses sharing that top score are returned as co-leaders (alphabetically sorted).
   - If all houses have 0 points, no winner is declared.

---

## 11. REST API Overview

All API endpoints return JSON and adhere to standard HTTP status codes:

### 1. `GET /api/leaderboard`
Returns calculated scores, ranks, and winners for all four houses.

- **Status Code:** `200 OK`
- **Response Format:**
  ```json
  {
    "houses": [
      { "house": "MATRIX", "rank": 1, "score": 75 },
      { "house": "ALPHA", "rank": 2, "score": 50 },
      { "house": "INFER", "rank": 2, "score": 50 },
      { "house": "LAYER", "rank": 4, "score": 15 }
    ],
    "winners": ["MATRIX"]
  }
  ```

### 2. `GET /api/events`
Returns all recorded point-award events in chronological insertion order.

- **Status Code:** `200 OK`
- **Response Format:**
  ```json
  {
    "events": [
      {
        "id": 1,
        "house": "ALPHA",
        "points": 50,
        "reason": "1st Place — Autonomous Drone Algorithm Hackathon",
        "recorded_at": "2026-10-10T14:30:00+00:00"
      }
    ]
  }
  ```

### 3. `POST /api/events`
Records a new point award.

- **Headers:** `Content-Type: application/json`
- **Request Body:**
  ```json
  {
    "house": "INFER",
    "points": 25,
    "reason": "Best Model Optimization & Low-Latency Benchmark"
  }
  ```
- **Response (`201 Created`):**
  ```json
  {
    "event": {
      "id": 2,
      "house": "INFER",
      "points": 25,
      "reason": "Best Model Optimization & Low-Latency Benchmark",
      "recorded_at": "2026-10-11T20:15:30+00:00"
    }
  }
  ```
- **Error Codes:**
  - `400 Bad Request`: Invalid JSON or missing required fields (`house`, `points`, `reason`).
  - `415 Unsupported Media Type`: Request body is not `application/json`.
  - `422 Unprocessable Content`: Domain validation failure (e.g., unknown house, non-positive points, empty reason).

---

## 12. Example Usage & API Verification

You can interact with the live API using `curl`:

### Award Points to House Matrix:
```bash
curl -X POST http://127.0.0.1:5000/api/events \
  -H "Content-Type: application/json" \
  -d '{"house": "MATRIX", "points": 30, "reason": "GPU Kernel Optimization Workshop"}'
```

### Fetch Current Leaderboard:
```bash
curl http://127.0.0.1:5000/api/leaderboard
```

### Fetch Audit Ledger:
```bash
curl http://127.0.0.1:5000/api/events
```

---

## 13. Screenshots & Visual Assets

To add genuine screenshots of your live deployment to GitHub, capture the following views in your browser:

1. **`docs/screenshots/01-cosmic-opening.png`**  
   *The cosmic galaxy opening at initial scroll position, displaying the stardust particle field and golden-blue meteor cursor.*
2. **`docs/screenshots/02-tachyon-singularity.png`**  
   *The full `TACHYON` title presentation during the cinematic hold over the rotating spiral galaxy.*
3. **`docs/screenshots/03-video-journey.png`**  
   *The video acceleration scrub through `gala-zoom.mp4` / `desert-next.mp4` with cinematic typographic overlays.*
4. **`docs/screenshots/04-live-standings.png`**  
   *The operational headquarters showing The Four Pillars score chart, leading house banner, and rankings table.*
5. **`docs/screenshots/05-award-points.png`**  
   *The interactive house selection cards and award submission form.*
6. **`docs/screenshots/06-event-history.png`**  
   *The chronological event audit log detailing recorded house accomplishments.*

Place the captured images inside a `docs/screenshots/` directory and reference them in your repository markdown.

---

## 14. License & Department Attribution

Designed and developed for the **AIML Technical Department**.  
Maintained under the Tachyon Project Development Guidelines.
