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

Status: Phase 1.1-B1 implemented

Candidate scope:

- group sessions by track
- subgroup by layout

Deferred after B1:

- prepare filtering by session type, car, and date

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

Status: Phase 1.1-D2 implemented

Candidate channels:

- Gear
- RPM
- Steering

Current slice:

- D1: Gear only
- D2: RPM

Deferred after D1:

- D3: Steering

Recommended treatment:

- not default Phase 1 core graphs
- advanced or collapsible
- possible future Graph Analysis ownership

Reason:

- these channels are useful, but they should not reduce clarity of the core
  Single Lap Racing Line Viewer

### 5. Invalid Lap Presentation Polish

Priority: P2

Candidate scope:

- clearer disabled-state styling
- clearer reason copy
- stronger separation between invalid and unavailable

Reason:

- acceptance passed with minor notes, so this is polish rather than repair

### 6. Spa Visual QA Follow-Up

Priority: P3

Candidate scope:

- rerun visual QA when Spa is surfaced in the active UI corpus

Reason:

- not a release blocker
- still useful to close the coverage gap after freeze

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

These belong to later roadmap phases or remain research-gated.

## Working Rules

For any new request after the freeze candidate decision:

1. first ask whether it is a release-blocking regression
2. if not, classify it into this backlog or a later phase
3. do not re-open frozen Phase 1 scope by convenience

## Suggested Next Step

Pick one of the following before any runtime implementation:

1. create a Phase 1.1 planning branch
2. break these backlog items into implementation tickets
3. choose whether Canvas View Controls or Session Categorization is the first
   Phase 1.1 implementation target
