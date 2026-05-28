# Phase 2 Scope Decision

## Summary

This document is the decision layer for opening:

- `Phase 2: Best Lap Comparison`

It exists to prevent Brakepoint from jumping directly from a validated
single-lap analysis tool into a broad comparison, coaching, or replay system
without a narrow scope decision.

This document does not approve implementation by itself.
It defines the question, the baseline, the guardrails, and the conditions for
go/no-go approval.

## Current Status

Current status:

- `Opened`

Allowed future statuses:

- `Not Opened`
- `Opened`
- `Deferred`

## Decision Question

Should Brakepoint open `Phase 2` now?

Default answer:

- `No`

Phase 2 should remain closed unless:

- the first slice is narrower than full comparison tooling
- the accepted Phase 1 / Phase 1.1 / Phase 1.2-A baselines remain intact
- the new slice does not silently expand into Ghost, Coach, Delta, replay
  systems, or track-geometry UI

## Required Baseline

Before opening `Phase 2`, the following must remain true:

- `Phase 1` release sanity remains green
- `Phase 1.1` remains closed out
- `Phase 1.2-A` accepted baseline remains stable
- no blocker regression exists in current `Sessions` or `Lap Analysis`
- `Lap Analysis` still reads as actual-lap-first, not comparison-first

## Candidate First Slice

The narrowest approved-looking candidate is:

- `Current vs Best Minimal Overlay`

Meaning:

- current lap remains the primary line
- best lap is shown as a secondary visual aid only
- comparison stays same game / same track / same layout / same car only
- hover sync remains distance-based
- no Ghost
- no delta timeline
- no coach wording
- no automatic loss explanation in the first slice

## Explicitly Not Included In The First Slice

Still blocked unless separately approved:

- Ghost replay
- delta time system
- Loss Zone
- Focus Zone
- Coach
- AI
- Heatmap
- replay scrubber
- graph-heavy comparison dashboard
- minimap
- corridor UI
- actual track boundary
- actual gray track surface
- actual track width

## Why This Decision Matters

Brakepoint is strongest when it remains telemetry-trustworthy.

The project should not:

- invent fake track geometry
- hide data quality ambiguity behind flashy comparison UI
- widen into a broad multi-tool shell just because comparison becomes possible

Phase 2 should begin with the smallest comparison layer that still improves
repeat-use value for sim racers.

## Go / No-Go Checklist

| ID | Check | Result |
| --- | --- | --- |
| P2-DEC-01 | current release sanity remains green |  |
| P2-DEC-02 | `Phase 1.2-A` accepted baseline remains stable |  |
| P2-DEC-03 | first slice is limited to current vs best minimal overlay |  |
| P2-DEC-04 | same game / same track / same layout / same car rule is accepted |  |
| P2-DEC-05 | first slice does not include Ghost |  |
| P2-DEC-06 | first slice does not include delta timeline |  |
| P2-DEC-07 | first slice does not include Loss Zone |  |
| P2-DEC-08 | first slice does not include Coach / AI wording |  |
| P2-DEC-09 | first slice does not imply actual track boundary or fake track map |  |
| P2-DEC-10 | first slice has a separate approval statement before implementation |  |

## Approval Statement

Use this only when the narrow first slice is explicitly approved:

`Open Phase 2 with Current vs Best minimal overlay only. Keep the current lap primary, keep comparison constrained to the same game, track, layout, and car, and do not include Ghost, delta timeline, Loss Zone, Coach, AI, minimap, corridor UI, or track-geometry UI in the first slice.`

## Rejection Statement

Use this when `Phase 2` should remain closed:

`Do not open Phase 2 yet. Keep the current actual-lap-first baseline and reopen comparison work only when the first slice can remain a narrow current-vs-best overlay.`

## Selected Statement

Current selected statement:

`Open Phase 2 with Current vs Best minimal overlay only. Keep the current lap primary, keep comparison constrained to the same game, track, layout, and car, and do not include Ghost, delta timeline, Loss Zone, Coach, AI, minimap, corridor UI, or track-geometry UI in the first slice.`

## Decision Rationale

Current rationale:

- users want repeat-use comparison value earlier than a broader coaching layer
- `Current vs Best` is the smallest useful comparison step
- this first slice is narrow enough to stay inside the current Lap Analysis model
- `Loss Zone`, Ghost, delta systems, and coaching remain intentionally deferred

## Recommended Next Step

Do next:

1. treat `Current vs Best Minimal Overlay` as the active first slice for Phase 2
2. keep `Loss Zone` as a later candidate after minimal comparison is validated
3. do not widen Phase 2 beyond the approved first slice without a new scope decision

## Related Documents

- `docs/01_mvp_spec.md`
- `docs/03_ux_flow_spec.md`
- `docs/04_roadmap_and_phase_gates.md`
- `reports/phase1_1_closeout.md`
- `reports/phase1_2_a_closeout.md`
