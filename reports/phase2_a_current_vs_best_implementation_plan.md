# Phase 2-A Current vs Best Implementation Plan

## Summary

This document defines the concrete implementation plan for:

- `Phase 2-A: Current vs Best Minimal Overlay`

It is the first approved slice inside Phase 2.

The slice must remain comparison-minimal.
It must not expand into Ghost, delta systems, Loss Zone, Coach, replay controls,
or track-geometry UI.

## Implementation Objective

Add the smallest useful best-lap comparison layer to the existing
`Lap Analysis` flow.

Primary outcome:

- the user can toggle a best-lap comparison overlay
- the current lap remains visually primary
- the comparison remains readable without changing Brakepoint into a
  comparison-first dashboard

## Approved Scope

In scope:

- compare current valid lap against best valid lap
- same session only
- same game / same track / same layout / same car by construction
- current lap remains primary
- best lap overlay is secondary
- comparison toggle on/off
- distance-based hover sync remains intact

Out of scope:

- Ghost replay
- delta timeline
- Loss Zone
- Focus Zone
- Coach
- AI
- replay scrubber
- graph-heavy comparison dashboard
- minimap
- corridor UI
- actual track boundary
- actual gray track surface
- actual track width

## Data Contract Notes

The current `RacingLineViewData` shape is single-lap oriented.

Before implementation, confirm whether the narrowest safe path is:

1. extend the existing lap-analysis response with optional best-lap comparison
   data
or
2. add a separate comparison-focused API response for the same screen

Rules:

- keep compatibility narrow
- preserve existing single-lap consumers
- do not expose raw adapter fields to the renderer
- keep distance as the primary sync basis

Likely canonical needs:

- best lap summary reference
- best lap racing line points
- best lap graph points
- comparison-availability state

## Renderer Ownership

Likely renderer ownership:

- `renderer/app.js`
  - toggle state
  - best-lap load orchestration
  - comparison visibility state
- `renderer/racingLineCanvas.js`
  - current lap primary rendering
  - best lap secondary overlay rendering
  - current/best hover marker sync behavior
- `renderer/telemetryGraphs.js`
  - keep current Speed / Brake / Throttle graphs primary
  - add only the smallest comparison visualization if required
- `renderer/styles.css`
  - toggle styling
  - comparison badge / state styling
  - ensure current lap remains visually dominant

## Suggested Work Sequence

### Step 1. Comparison Data Shape Decision

Decide and document the smallest safe response shape.

Rules:

- do not break current single-lap behavior
- do not bundle future Loss Zone data
- do not bundle Ghost/replay assumptions

### Step 2. Best Lap Eligibility Rule

Define when comparison is available.

Rules:

- current lap must be valid
- best lap must exist
- comparison must remain same-session in this first slice
- invalid laps remain non-selectable and non-comparable

### Step 3. Toggle State

Add a compact comparison toggle to `Lap Analysis`.

Rules:

- comparison is off by default if that best preserves current behavior
- toggle must not dominate the screen
- unavailable state must be compact and non-alarming

### Step 4. Canvas Overlay

Render best lap as a secondary overlay.

Rules:

- current lap remains visually primary
- best lap must not look like track geometry
- no fake track surface or boundary
- current lap and best lap must remain interpretable as driven traces

### Step 5. Hover Sync Preservation

Keep distance-based sync intact.

Rules:

- current lap hover still drives the shared sync model
- best lap overlay follows distance alignment rules
- do not introduce replay playhead behavior in this slice

### Step 6. Graph Comparison Minimum

Only if required for useful comparison:

- add a light comparison treatment inside existing core graphs

Rules:

- Speed / Brake / Throttle remain primary graphs
- do not turn graphs into a comparison-heavy dashboard
- keep best-lap graph treatment visibly secondary

## Validation Plan

Required:

- `node --check renderer\\app.js`
- `node --check renderer\\racingLineCanvas.js`
- `node --check renderer\\telemetryGraphs.js`
- `npm.cmd run typecheck`
- `npm.cmd run build`

Recommended:

- `node scripts\\bridge_smoke_test.js`
- `npm.cmd run python:validate`

## Manual QA Focus

The first-slice comparison implementation should be checked for:

1. current lap still reads as the primary subject
2. best lap overlay is visible but secondary
3. toggle is obvious and safe
4. invalid laps remain non-selectable
5. hover sync still works
6. core graphs remain readable
7. no fake track-map implication appears
8. no Ghost / delta / coaching implication appears

## Stop Conditions

Pause and re-scope if implementation starts requiring:

- Ghost
- delta timeline
- Loss Zone
- replay controls
- broad graph redesign
- `Lap Analysis` major layout rewrite
- track-geometry UI

## Recommended Next Step

Do next:

1. document the exact comparison response shape before code changes
2. implement only the narrow approved first slice
3. defer `Loss Zone` until minimal comparison is validated

## Related Documents

- `reports/phase2_scope_decision.md`
- `reports/phase2_current_vs_best_candidate.md`
- `docs/02_data_contract_spec.md`
- `docs/04_roadmap_and_phase_gates.md`
