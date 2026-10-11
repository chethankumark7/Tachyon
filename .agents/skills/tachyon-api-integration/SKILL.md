---
name: tachyon-api-integration
description: Use when connecting frontend components, forms, feeds, or visualizations to the Tachyon Flask REST API endpoints (/api/leaderboard, /api/events).
---

# Safe Frontend-to-Backend Integration Workflow

Use this skill when modifying or extending API communication in Tachyon.

## Principles & Non-Negotiables
1. **Backend is the Sole Authority:** The frontend never computes cumulative scores, determines rankings, or identifies winners locally. All leaderboard data comes directly from `GET /api/leaderboard`.
2. **Deterministic Sequence:** Every point award must be committed through `POST /api/events` before updating the UI. If the request fails (400, 415, 422, 500, or network drop), local state must remain unchanged and surface an accessible error message.
3. **No Contract Breaking:** Never modify endpoint URLs, HTTP methods, JSON payload structures, or response status codes in [`app/routes.py`](file:///c:/Users/User/Desktop/Tachyon/app/routes.py).

## API Contract Reference

### 1. Leaderboard (`GET /api/leaderboard`)
- **Response (200):**
  ```json
  {
    "houses": [
      {"rank": 1, "house": "ALPHA", "score": 150},
      {"rank": 2, "house": "MATRIX", "score": 100},
      {"rank": 3, "house": "INFER", "score": 50},
      {"rank": 4, "house": "LAYER", "score": 0}
    ],
    "winners": ["ALPHA"]
  }
  ```

### 2. Event History (`GET /api/events`)
- **Response (200):**
  ```json
  {
    "events": [
      {
        "id": 1,
        "house": "ALPHA",
        "points": 25,
        "reason": "Robotics showcase victory",
        "recorded_at": "2026-10-10T14:32:00+00:00"
      }
    ]
  }
  ```

### 3. Record Point Award (`POST /api/events`)
- **Headers:** `Content-Type: application/json`
- **Request Body:**
  ```json
  {
    "house": "ALPHA",
    "points": 25,
    "reason": "Hackathon 1st place"
  }
  ```
- **Responses:**
  - `201 Created`: `{"event": {"id": 1, "house": "ALPHA", "points": 25, "reason": "...", "recorded_at": "..."}}`
  - `400 Bad Request`: Malformed JSON or missing required fields (`house`, `points`, `reason`).
  - `415 Unsupported Media Type`: Non-JSON content type.
  - `422 Unprocessable Entity`: Validation failure (unknown house, non-positive integer points, blank reason).

## Integration Checklist
- [ ] Disable submit button and display loading indicator during active `POST` requests.
- [ ] On `201 Created`: Refresh both leaderboard and event history concurrently via `Promise.all([fetchLeaderboard(), fetchHistory()])`.
- [ ] On `4xx`/`5xx` error: Display backend error message in `aria-live` status container without altering displayed totals.
- [ ] Escape HTML strings when rendering user-submitted `reason` text in event history to prevent XSS.
- [ ] Run full automated test suite (`python -m pytest -v`) to confirm 120/120 tests pass.
