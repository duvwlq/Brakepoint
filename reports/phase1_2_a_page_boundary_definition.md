# Phase 1.2-A Page Boundary Definition

## Summary

This document defines the page boundary for the first active Phase 1.2 slice:

- `Sessions split first`

Its purpose is to make the implementation boundary explicit before runtime
changes begin.

This is the first concrete execution document after the Phase 1.2 opening
decision.

## Slice Scope

This document applies only to:

- `Phase 1.2-A: Sessions Split First`

It does not define:

- Dashboard implementation
- Graph Analysis implementation
- a full product-shell rewrite

## Boundary Decision

The app is split into two active responsibilities for this slice:

1. `Sessions`
2. `Lap Analysis`

The boundary rule is:

- `Sessions` owns browsing
- `Lap Analysis` owns reading the selected lap

## Sessions Responsibility

`Sessions` should own:

- telemetry source entry context where useful
- grouped session list
- track and layout oriented browsing
- lite filters
- ready / error / partial session states
- choosing which session to inspect next

`Sessions` should not own:

- Racing Line Canvas
- lap-by-lap telemetry reading
- graph-heavy analysis
- broad app dashboard behavior

## Lap Analysis Responsibility

`Lap Analysis` should own:

- selected session context
- session metadata for the current analysis target
- lap list
- invalid lap visibility and non-selectable behavior
- selected lap inspector
- Racing Line Canvas
- core Speed / Brake / Throttle graphs
- advanced graph drawer
- warnings and fallback states

`Lap Analysis` should not own:

- long browsing history
- broad grouped session exploration
- table-style session browsing
- global product routing concerns beyond its local context

## Navigation Rule

For the first slice, navigation should stay minimal.

Required behavior:

- the user can move from `Sessions` into `Lap Analysis`
- the user can return from `Lap Analysis` to `Sessions`

The first slice does not require:

- a complete Dashboard entry flow
- a complete Graph Analysis route
- a broad left-nav shell beyond what this split needs

## State Transfer Rule

The split must preserve the current analysis entry flow.

Minimum preserved flow:

1. choose a session in `Sessions`
2. open that session in `Lap Analysis`
3. show session metadata
4. show lap list
5. choose a valid lap
6. inspect the actual lap line and graphs

Rules:

- selected session identity must transfer cleanly
- selected lap logic stays inside `Lap Analysis`
- invalid lap handling stays unchanged

## Preservation Rules

The following must remain unchanged in behavior:

- ready / error / partial session semantics
- track/layout grouping semantics
- valid lap selection
- invalid lap non-selectable behavior
- `distance-graph-only` fallback
- hover sync
- canvas zoom / pan / fit / reset
- core graph meaning and hierarchy

## Explicit Non-Goals

Do not treat this slice as authorization for:

- Dashboard
- Graph Analysis
- search
- saved filters
- car/date filter expansion
- new telemetry channels
- comparison features
- coaching features
- minimap
- corridor UI
- actual track boundary
- actual gray track surface
- actual track width

## Acceptance Mapping

This boundary is correct only if:

- `Sessions` becomes meaningfully browsing-first
- `Lap Analysis` becomes meaningfully analysis-first
- the selected session and lap flow is not broken
- no telemetry behavior is weakened by the split

## Recommended Next Step

After this boundary is accepted:

1. define the minimal navigation shell required for the split
2. define the `Sessions` workspace structure
3. begin extraction work only after those two documents are aligned
