---
name: tachyon-visualizations
description: Use when creating, experimenting with, or integrating dynamic visualizations, animations, scroll effects, or interactive representations of the four competing houses in Tachyon.
---

# Tachyon Interactive Visualizations & Animation Workflow

Use this skill when designing kinetic elements, evolving visual structures, or interactive representations that respond to real-time house scores.

## Principles & Objectives
1. **Representing Growth & Competition:** Visual elements should reflect scores in a compelling way (e.g., dynamic physical pillars, kinetic glyphs, evolving geometric lattices, or procedural canvas effects) rather than simple progress bars.
2. **State-Driven Integrity:** Animations and visual states must strictly represent verified data fetched from `/api/leaderboard`. Never simulate or fabricate success animations prior to backend confirmation.
3. **Performance & Lightweight Tech:** Use lightweight Vanilla JS, CSS keyframes/transitions, or HTML5 Canvas. Avoid heavy third-party 3D engines or bloated dependencies unless approved.
4. **Motion Accessibility:** All animations must feature a static, instant alternative when `prefers-reduced-motion` is active.

## Step-by-Step Procedure

### 1. Isolated Sandbox Prototyping
- When experimenting with a new visual concept:
  - Create a standalone sandbox prototype (e.g., in a temporary prototyping file or scratch template) rather than directly modifying the production [`app/templates/index.html`](file:///c:/Users/User/Desktop/Tachyon/app/templates/index.html).
  - Verify frame rates (aim for 60fps), GPU layer efficiency (`transform`, `opacity`), and resizing behavior.

### 2. Reactive Score Binding
- Map the backend schema directly to visual parameters:
  - House identity -> Visual entity (`ALPHA`, `INFER`, `MATRIX`, `LAYER`).
  - Score -> Dimensional property (height, scale, node density, elevation, or energy level).
  - Rank / Winner -> Distinct visual state (highlight, crown glyph, leading aura).
- Support smooth transitions from previous state $S_{old}$ to new state $S_{new}$ when points are awarded.

### 3. Edge-Case Validation
- Verify behavior across edge cases:
  - All scores at 0 (initial/reset state).
  - Four-way ties and two-way ties.
  - Large point differences (e.g., 500 vs 5).
  - Single point increments (+1).
