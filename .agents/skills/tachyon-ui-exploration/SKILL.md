---
name: tachyon-ui-exploration
description: Use when brainstorming, exploring, prototyping, or refining UI/UX designs, color palettes, typography, layouts, and thematic directions for the Tachyon house points system.
---

# Tachyon UI/UX Design Exploration Workflow

Use this skill when developing visual concepts, experimenting with aesthetics, or refining the user experience of Tachyon.

## Principles & Objectives
1. **Move Beyond Generic Dashboards:** Tachyon is an ambitious departmental competition platform. Avoid cookie-cutter card grids.
2. **Distinct House Personas:** The four houses (**ALPHA**, **INFER**, **MATRIX**, **LAYER**) must possess distinct visual identities that feel cohesive when viewed together.
3. **Typography & Atmosphere:** Utilize high-quality typography pairings (e.g., editorial serifs with geometric sans-serifs) and curated color harmonies rather than default browser styling.
4. **Accessibility First:** Maintain WCAG AA contrast standards, keyboard navigability, semantic tags, and skip links.

## Step-by-Step Procedure

### 1. Conceptualization & Palette Definition
- Formulate a cohesive design theme (e.g., cinematic dark, refined cream & gold, kinetic technical, or architectural growth).
- Define design tokens in CSS variables:
  - Background, surface, border, and elevated layers.
  - Neutral text hierarchy (`--c-text-primary`, `--c-text-secondary`, `--c-text-muted`).
  - Four distinct house accent colors and subtle tinted background variants.
  - Type scales and spatial rhythm (`--space-xs` through `--space-2xl`).

### 2. Prototyping & Layout Exploration
- Explore compositional balance between:
  - The hero/thematic entry point.
  - The house visualization (dynamic standings representation).
  - The point-awarding mechanism (must remain frictionless and pleasant to use).
  - The event history log (readable, chronological, transparent).
- Present design concepts, layout wireframes, or targeted style snippets to the user for feedback before rewriting [`app/static/css/style.css`](file:///c:/Users/User/Desktop/Tachyon/app/static/css/style.css).

### 3. Verification & Polish
- Validate that all interactive controls have accessible focus states (`:focus-visible`).
- Check responsive behavior down to 320px mobile viewports.
- Ensure transitions are fluid and obey `@media (prefers-reduced-motion: reduce)`.
