# Phase 2 Current vs Best Candidate

## Summary

This document defines the narrowest reasonable first slice for:

- `Phase 2: Best Lap Comparison`

It is a candidate-only document.
It does not approve implementation.

Its purpose is to make sure comparison begins as a minimal telemetry-trustworthy
overlay instead of expanding immediately into replay, coaching, or graph-heavy
workflow.

## Current Status

Current status:

- `Approved first slice`
- `Opened under Phase 2`

## Candidate Name

- `Phase 2-A: Current vs Best Minimal Overlay`

## Candidate Objective

Show the user the smallest useful comparison between:

- the currently selected valid lap
- the session best valid lap

Primary outcome:

- the user can see where the current lap differs from the best lap
- the app still reads as actual-lap-first rather than comparison-first

## In Scope

Allowed only if later approved:

- current lap remains the primary line
- best lap is rendered as a secondary comparison layer
- comparison toggle on/off
- same game / same track / same layout / same car only
- distance-based hover sync across current and best lap
- compact comparison state in the existing Lap Analysis flow

## Out Of Scope

Still excluded from this candidate:

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

## Rendering Rules

If approved later:

- current lap must stay visually primary
- best lap must read as a secondary guide, not as a replacement track
- no fake track surface or boundary may appear
- comparison must not make the canvas read like an actual track map

## Data Rules

If approved later:

- compare only compatible laps
- do not compare across different games
- do not compare across different layouts
- do not compare across different cars
- keep distance as the comparison sync basis

## Acceptance Shape

If approved later, this candidate should satisfy:

- current lap still feels like the main subject
- best lap overlay is understandable within seconds
- toggle behavior is obvious
- invalid lap behavior remains unchanged
- core Speed / Brake / Throttle graphs remain primary
- the comparison layer does not imply coaching by itself

## Rejection Rule

Reject this candidate if it starts requiring:

- Ghost
- delta-first workflow
- Loss Zone in the same pass
- replay controls
- track geometry UI
- major Lap Analysis redesign

## Recommended Next Step

Do next:

1. use this as the active implementation boundary for Phase 2
2. keep `Loss Zone` as a later follow-up candidate, not part of this first comparison slice
3. do not widen into Ghost, delta, or coach systems without a new scope decision

## Related Documents

- `reports/phase2_scope_decision.md`
- `docs/04_roadmap_and_phase_gates.md`
- `reports/phase1_2_a_closeout.md`
