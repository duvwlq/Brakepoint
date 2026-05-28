# Phase 1.1 Backlog

## Summary

Phase 1 is now treated as a frozen candidate.

This backlog exists to keep new work out of the frozen Phase 1 runtime scope
while still capturing the highest-value follow-up improvements.

Phase 1.1 work should improve usability and information architecture without
changing the core product definition:

- LMU-focused
- actual lap line as telemetry-first source of truth
- distance-based graph and hover sync
- no actual track boundary or corridor UI

## Current Completion Status

Phase 1.1 core plan is now largely complete.

Core feature done:

- Phase 1.1-A1 Canvas View Controls
- Phase 1.1-B1 Session Categorization
- Phase 1.1-B2 Session Filters Lite
- Phase 1.1-C1 Collapsible Panels
- Phase 1.1-D1 Gear Only
- Phase 1.1-D2 RPM Only
- Phase 1.1-D3 Steering

Polish done:

- Invalid Lap Presentation Polish

Phase 1.1-D3 manual QA result:

- Steering advanced graph displays correctly
- core Speed / Brake / Throttle graphs remain unchanged
- hover sync remains intact
- missing / unavailable state remains consistent with the advanced graph policy

Invalid lap polish result:

- invalid laps remain visible but non-selectable
- invalid laps show short reasons such as `Lap time unavailable` or
  `Cannot analyse this lap`
- invalid presentation does not conflict with selected, best, or valid lap
  states
- invalid lap loading remains blocked by `LAP_INVALID`
- core session / lap / graph / bridge / python / build paths did not regress

Interpretation:

- the first Phase 1.1 usability and advanced-graph slice is complete
- remaining work should now be treated as polish or optional expansion
- do not treat the remaining items below as new must-have features

## Phase 1.1 Status Report

Status:

- Phase 1.1 implementation: closeout
- Phase 1.1 core: done
- Phase 1.1 polish: done
- Phase 1.1 optional expansion: no active implementation
- Phase 1.1 remaining work: deferred only unless a later phase gate re-opens scope

Completed core feature slice:

- A1 Canvas View Controls
- B1 Session Categorization
- B2 Session Filters Lite
- C1 Collapsible Panels
- D1 Gear advanced graph
- D2 RPM advanced graph
- D3 Steering advanced graph

Completed polish slice:

- invalid lap presentation polish
- graph drawer / density polish
- advanced graph unavailable-state tone polish

Validation evidence:

- `node --check renderer\\app.js`
- `node --check renderer\\racingLineCanvas.js`
- `node --check renderer\\telemetryGraphs.js`
- `npm.cmd run typecheck`
- `node scripts\\bridge_smoke_test.js`
- `npm.cmd run python:validate`
- `npm.cmd run build`

Remaining work classification:

- Optional expansion:
  - Session filter expansion review only if it stays lightweight and
    renderer-local
- Deferred:
  - later-phase IA and layout rewrite with global navigation and page split
  - optional minimap
  - corridor UI
  - actual track boundary
  - actual gray track surface
  - actual track width
  - Best Lap comparison
  - Ghost
  - Coach
  - Delta
  - Heatmap
  - AI

## Scope Rule

Phase 1.1 may improve:

- analysis usability
- screen organization
- interaction controls
- advanced but non-core telemetry display

Phase 1.1 must not silently expand into:

- Best Lap comparison
- Ghost replay
- Coach
- Race Records UI
- Estimated Telemetry Corridor UI
- actual track boundary
- actual gray track surface
- actual track width

Phase 1.1 should now be managed as polish-first work:

- prefer clarity, density, and wording polish over new feature expansion
- do not add new analysis modes without explicitly re-planning scope
- optional ideas should remain deferred unless they solve a concrete usability
  issue
- after this closeout point, do not add more Phase 1.1 implementation work by
  default

## Priority Backlog

### 1. Canvas View Controls

Priority: P1

Status: Phase 1.1-A1 implemented

Candidate scope:

- zoom
- pan
- fit-to-view button
- reset view

Deferred to A2:

- optional minimap or overview

Reason:

- current fit-to-view is good for whole-lap context
- detailed corner and braking inspection still needs local view control

Guardrail:

- canvas remains render-only
- no telemetry recomputation in renderer
- controls stay hidden when no real racing line is available

### 2. Session Categorization

Priority: P1

Status: Phase 1.1-B2 implemented

Candidate scope:

- group sessions by track
- subgroup by layout
- lite filters for session status and session type

Deferred after B2:

- prepare filtering by session type, car, and date
- search and saved filters stay deferred after B2

Reason:

- large flat recent-session history becomes noisy quickly
- this supports future same-track workflows without changing Phase 1 acceptance

Guardrail:

- this is browsing IA, not cross-session comparison yet
- no track preview, SVG map, or fake geometry

### 3. Collapsible Panels

Priority: P1

Status: Phase 1.1-C1 implemented

Candidate scope:

- collapse non-core side panels
- collapse advanced details
- keep Dev JSON secondary

Deferred after C1:

- allow graph drawer height control if useful

Reason:

- desktop workspace should stay readable at different window sizes
- the actual lap line should remain visually primary

Guardrail:

- keep warning visibility available in compact form
- do not collapse the core canvas or distance graphs

### 4. Advanced Graph Channels

Priority: P2

Status: Phase 1.1-D3 implemented

Candidate channels:

- Gear
- RPM
- Steering

Current slice:

- D1: Gear only
- D2: RPM
- D3: Steering
- missing advanced-channel data should surface as compact unavailable messaging,
  not as a broken graph area

Deferred after D3:

- optional advanced graph density polish if needed

Recommended treatment:

- not default Phase 1 core graphs
- advanced or collapsible
- possible future Graph Analysis ownership

Reason:

- these channels are useful, but they should not reduce clarity of the core
  Single Lap Racing Line Viewer

### 5. Invalid Lap Presentation Polish

Priority: P2

Status: done

Candidate scope:

- clearer disabled-state styling
- clearer reason copy
- stronger separation between invalid and unavailable

Reason:

- acceptance passed with minor notes, so this is polish rather than repair

Category: polish

### 6. Graph Density / Drawer Polish

Priority: P3

Status: done

Candidate scope:

- graph drawer height tuning
- advanced graph density tuning
- compact unavailable-state wording polish

Reason:

- the core advanced graph set is done
- remaining work is mainly readability and density refinement

Category: polish

### 7. Session Filter Expansion Review

Priority: P3

Candidate scope:

- decide whether B2 should stay as-is
- only consider extra filters if they remain lightweight and renderer-local

Reason:

- current B2 scope already improves browsing
- filter growth can quickly turn into broader IA work

Category: optional expansion

Guardrail:

- no search
- no saved filters
- no dashboard-like filter experience

### 8. Spa Visual QA Follow-Up

Priority: P3

Candidate scope:

- rerun visual QA when Spa is surfaced in the active UI corpus

Reason:

- not a release blocker
- still useful to close the coverage gap after freeze

Category: deferred

### 9. Optional Minimap / Overview

Priority: P4

Status: deferred

Reason:

- A1 solved the main canvas usability problem with zoom / pan / fit / reset
- minimap can easily reintroduce a track-map reading problem if handled badly

Category: deferred

### 10. Later-Phase IA / Layout Rewrite

Priority: P4

Status: deferred

Candidate scope:

- left global navigation
- Sessions page with wider browsing workspace
- clearer page split between Sessions, Lap Analysis, Graph Analysis, and
  Settings

Reason:

- this is now a product IA question, not a Phase 1.1 polish question
- the current closeout baseline should not be reopened by a navigation-shell
  rewrite

Category: deferred

## Not In Phase 1.1

The following stay out of Phase 1.1 unless explicitly re-planned later:

- Best Lap comparison
- Ghost replay
- Coach
- Heatmap
- Race Records UI
- corridor UI
- actual boundary rendering
- actual track surface rendering
- actual track width rendering
- AI or coach workflows
- new comparison modes

These belong to later roadmap phases or remain research-gated.

## Working Rules

For any new request after the freeze candidate decision:

1. first ask whether it is a release-blocking regression
2. if not, classify it into this backlog or a later phase
3. do not re-open frozen Phase 1 scope by convenience

Additional guardrails:

1. do not add new telemetry analysis features by default
2. do not reclassify optional work as must-have without a written scope decision
3. do not add Best Lap comparison, Ghost, Coach, Delta, Heatmap, or AI here
4. do not add track boundary, actual gray surface, actual track width, SVG map,
   or fake geometry here
5. keep Phase 1.1 centered on polish, compact advanced telemetry display, and
   browsing usability

Current note:

- `Phase 1.2` may now proceed separately through `Sessions split first`
- do not treat that work as reopening or expanding Phase 1.1

## Suggested Next Step

Treat Phase 1.1 as closed out.

Choose from non-feature follow-up only:

1. release sanity pass
2. Electron visual QA follow-up where coverage gaps remain
3. package verification follow-up
4. only evaluate deferred items again through a later phase-gate decision
