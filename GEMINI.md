# TACHYON — PROJECT DEVELOPMENT GUIDELINES

## 1. Project Identity & Scope
Tachyon is a house-points and competition platform for the Tachyon technical department.
The four canonical houses are:
- **ALPHA**
- **INFER**
- **MATRIX**
- **LAYER**

The system records points awarded to houses with descriptive reasons, computes aggregated totals, ranks houses using standard competition rankings, identifies leader(s), and maintains historical audit logs.

---

## 2. Technology Stack & Constraints
- **Backend:** Python 3, Flask, SQLite (`instance/tachyon.db`).
- **Frontend:** Vanilla HTML5, Vanilla CSS, Vanilla JavaScript.
- **Testing:** `pytest` (120 automated tests currently passing).
- **Architecture Principle:** Do NOT introduce frontend frameworks (React, Vue), CSS frameworks (Tailwind), heavy 3D/animation libraries, or secondary databases without explicit user authorization and clear technical justification.

---

## 3. Core Development Invariants

### A. Inspect Before Editing
- Always read existing files, contracts, and tests before modifying code.
- The actual repository filesystem is the single source of truth, not assumptions or memory from previous conversations.

### B. Preserve Working Architecture
- **Do not rewrite [`app/scoring.py`](file:///c:/Users/User/Desktop/Tachyon/app/scoring.py)**: Pure domain functions (`normalize_house`, `validate_points`, `calculate_scores`, `rank_houses`, `get_winners`) are authoritative and complete.
- **Do not rewrite [`app/storage.py`](file:///c:/Users/User/Desktop/Tachyon/app/storage.py)**: Database schema (`point_events`), connection handling, and validation must remain intact.
- **Do not change API contracts**:
  - `GET /api/leaderboard` -> `{"houses": [{"rank": int, "house": str, "score": int}, ...], "winners": [str, ...]}`
  - `GET /api/events` -> `{"events": [{"id": int, "house": str, "points": int, "reason": str, "recorded_at": str}, ...]}`
  - `POST /api/events` -> Accepts `{"house": str, "points": int, "reason": str}`; returns HTTP 201 on success; HTTP 415, 400, 422 on errors.
- **Single Source of Truth:** Authoritative scores and rankings are derived exclusively by the backend. The frontend must never duplicate scoring calculations or invent state.

### C. Small, Reversible Changes
- Break tasks into small, self-contained iterations.
- Never make unrecoverable broad changes without checkpointing.

### D. Prototype Complex Visualizations in Isolation
- When exploring ambitious visual metaphors (kinetic forms, evolving entities, dynamic shaders, particle canvases), build prototypes in dedicated sandbox files before altering the production `index.html` or `app.js`.

### E. Rigorous Testing & Honest Reporting
- Never claim tests passed without executing them and observing output.
- All 120 existing tests must pass after backend or integration touchpoints.
- Run `python -m pytest -v` and accurately report collected, passed, and failed counts.

### F. Data Integrity & Safety
- **Never delete or overwrite [`instance/tachyon.db`](file:///c:/Users/User/Desktop/Tachyon/instance/tachyon.db)**. Automated tests use isolated temporary databases; development data must be preserved.

### G. User Authority & Collaborative Gates
- The user holds final creative and architectural authority.
- Explore ideas, propose alternatives, and critique designs, but obtain user approval before locking in design directions, palettes, or structural changes.
