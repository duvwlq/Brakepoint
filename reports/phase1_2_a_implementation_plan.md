# Phase 1.2-A Implementation Plan

## Summary

This document defines the concrete implementation plan for:

- `Phase 1.2-A: Sessions Split First`

It now also serves as the current implementation status tracker for the first
active Phase 1.2 slice.

Current state:

- implementation has started
- core first-slice structure is in place
- packaged app human spot-check has passed the first-slice acceptance flow
- the slice can now be treated as accepted unless direct regressions are found

## Implementation Objective

Implement a dedicated `Sessions` workspace while preserving the existing
analysis behavior as much as possible.

Primary outcome:

- grouped browsing moves into `Sessions`
- `Lap Analysis` remains the current analysis-first experience

## Current File Baseline

Current renderer baseline is still single-surface oriented:

- `renderer/index.html`
  - single shell with sidebar and workspace
- `renderer/app.js`
  - source status, session list, lap list, lap analysis, panel state, and
    interaction state are all orchestrated in one module
- `renderer/styles.css`
  - shell, sidebar, analysis grid, graph area, and panel styling are all in
    one stylesheet

That means the first slice should prioritize separation by responsibility,
not by broad visual redesign.

## First-Slice File Ownership

### 1. `renderer/index.html`

Responsibility in this slice:

- introduce the minimal structural boundary between `Sessions` and
  `Lap Analysis`
- add only the minimum route or workspace containers needed

Do not use this file to:

- introduce Dashboard
- introduce Graph Analysis
- redesign the full app shell

### 2. `renderer/app.js`

Responsibility in this slice:

- split browsing state from analysis state
- define which view is active: `Sessions` or `Lap Analysis`
- preserve selection flow from session choice into lap analysis
- preserve invalid lap, fallback, and hover-sync behavior

Do not use this file to:

- add telemetry features
- add search
- add saved filters
- change adapter or API contracts

### 3. `renderer/styles.css`

Responsibility in this slice:

- support the new `Sessions` workspace structure
- support the minimal navigation shell
- preserve Lap Analysis hierarchy and density as much as possible

Do not use this file to:

- introduce a broad visual redesign
- make navigation visually more important than analysis

## Suggested Work Sequence

### Step 1. View State Introduction

In `renderer/app.js`:

- introduce a narrow page or view state:
  - `sessions`
  - `lap-analysis`

Rules:

- default entry route remains `Sessions`
- analysis view opens from a selected ready session
- returning to `Sessions` should preserve current browsing context where
  practical

Current status:

- implemented

### Step 2. Structural Markup Split

In `renderer/index.html`:

- separate the browsing workspace from the analysis workspace
- add a minimal navigation affordance only if required for the split

Rules:

- do not add unrelated page placeholders as active obligations
- keep current analysis structure recognizable

Current status:

- implemented

### Step 3. Sessions Workspace Extraction

In `renderer/app.js` and `renderer/styles.css`:

- move grouped session browsing into the dedicated `Sessions` workspace
- keep lite filters there
- keep source status visible enough at entry

Rules:

- preserve ready / error / partial states
- preserve grouped browsing semantics
- do not add search-heavy controls

Current status:

- implemented
- grouped browsing is now rendered in the dedicated `Sessions` workspace
- lite filters remain renderer-local
- compact browse summary is present

### Step 4. Lap Analysis Protection

In `renderer/app.js`, `renderer/index.html`, and `renderer/styles.css`:

- keep current Lap Analysis rendering logic and hierarchy as stable as possible
- only change what is necessary to coexist with the split

Rules:

- canvas remains visually primary
- Speed / Brake / Throttle remain the core graphs
- advanced graphs remain secondary

Current status:

- implemented with compact context polish only
- analysis target context is clearer
- no telemetry feature expansion was added

### Step 5. Back Navigation

In `renderer/app.js`:

- add the minimal action needed to return from `Lap Analysis` to `Sessions`

Rules:

- do not introduce deep route history
- do not introduce dashboard-led navigation

Current status:

- implemented
- `Back to Sessions` action exists
- renderer-local filter and scroll context preservation is in place

## Current Implementation Summary

Implemented in code:

- default route opens into `Sessions`
- minimal `Sessions / Lap Analysis` navigation shell
- grouped session browsing is separated from Lap Analysis
- lite filters remain in `Sessions`
- ready session selection still opens Lap Analysis
- invalid laps remain visible but non-selectable
- `Back to Sessions` is visible in analysis
- browsing context is preserved within the active renderer session
- Lap Analysis keeps canvas-first priority and core graphs

Not implemented in this slice:

- Dashboard
- Graph Analysis
- search
- saved filters
- car/date filter expansion
- minimap
- comparison-style features
- telemetry feature expansion

## Validation Plan

Required validation after implementation:

- `node --check renderer\\app.js`
- `node --check renderer\\racingLineCanvas.js`
- `node --check renderer\\telemetryGraphs.js`
- `npm.cmd run typecheck`
- `npm.cmd run build`

Recommended additional validation:

- `node scripts\\bridge_smoke_test.js`
- `npm.cmd run python:validate`

## Manual QA Focus

The first-slice implementation should be checked for:

1. app opens into `Sessions`
2. grouped session browsing still works
3. lite filters still work
4. selecting a ready session opens `Lap Analysis`
5. invalid laps remain visible but non-selectable
6. canvas and core graphs remain unchanged in meaning
7. fallback and warning states remain safe
8. returning to `Sessions` keeps context understandable
9. `Back to Sessions` returns to understandable grouped browsing context
10. current filter and scroll context remain understandable after return

## Current QA Status

Automated validation:

- passing

Manual QA:

- passing
- packaged app human spot-check completed for the first-slice flow

Resolved checks:

- default route readability in Electron
- grouped browsing readability in `Sessions`
- `Sessions -> Lap Analysis -> Back to Sessions` flow
- active selection visibility after return
- no fallback regression in the split

Reference checklist:

- `reports/phase1_2_a_manual_qa.md`
- `reports/phase1_2_a_closeout.md`

## Stop Conditions

Pause and re-scope if implementation starts requiring:

- Dashboard
- Graph Analysis
- search or saved filters
- telemetry feature expansion
- major Lap Analysis redesign
- broad shell rewrite beyond the split

## Related Documents

- `reports/phase1_2_scope_decision.md`
- `reports/phase1_2_sessions_split_first_kickoff.md`
- `reports/phase1_2_a_page_boundary_definition.md`
- `reports/phase1_2_a_minimal_navigation_shell.md`
- `reports/phase1_2_a_sessions_workspace_structure.md`
- `reports/phase1_2_a_default_route_and_entry.md`
- `reports/phase1_2_a_back_navigation.md`

## Recommended Next Step

The next valid step is no longer more structure work by default.

Do next:

1. keep `Phase 1.2-A` as the accepted first slice
2. patch only direct regressions if they appear
3. use `reports/phase1_2_a_closeout.md` as the baseline summary for this slice
4. do not widen the slice without a new scope decision
