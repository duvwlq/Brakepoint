# Phase 1.2-B Scope Decision

## Summary

This document is the decision layer for the next Phase 1.2 slice after:

- `Phase 1.2-A: Sessions Split First`

It exists to prevent automatic scope expansion after the accepted first slice.

This document does not open implementation by itself.
It only defines the question, the guardrails, and the conditions for a future
go/no-go decision.

## Current Status

Current status:

- `Deferred`

Allowed future statuses:

- `Not Opened`
- `Opened`
- `Deferred`

## Decision Question

Should Brakepoint open `Phase 1.2-B` now?

Default answer:

- `No`

Phase 1.2-B should remain closed unless:

- the next slice is clearly narrower than a broad shell rewrite
- it does not weaken the accepted `Phase 1.2-A` baseline
- it does not reopen broad feature expansion indirectly

## Required Baseline

Before opening `Phase 1.2-B`, the following must remain true:

- `Phase 1.2-A` remains accepted
- grouped `Sessions` browsing remains understandable
- `Lap Analysis` remains protected
- no known blocker regression exists in the accepted first slice

## Candidate Direction

No active implementation direction is approved yet.

Possible later candidates may include:

- broader shell refinement
- explicit `Graph Analysis` page decision
- stronger browsing controls

These are examples only.
They are not approved scope.

## Hard Guardrails

Do not open `Phase 1.2-B` by accident through follow-up polish.

Still blocked unless explicitly approved:

- Dashboard
- Graph Analysis implementation
- search-heavy browsing
- saved filters
- telemetry feature expansion
- minimap
- comparison-style features
- coaching or AI features
- corridor UI
- actual track boundary
- actual gray track surface
- actual track width

## Go / No-Go Checklist

| ID | Check | Result |
| --- | --- | --- |
| P12-B-DEC-01 | `Phase 1.2-A` accepted baseline remains stable |  |
| P12-B-DEC-02 | no blocker regression exists in the accepted first slice |  |
| P12-B-DEC-03 | next slice goal is narrower than broad shell rewrite |  |
| P12-B-DEC-04 | next slice does not force Dashboard |  |
| P12-B-DEC-05 | next slice does not force Graph Analysis |  |
| P12-B-DEC-06 | next slice does not bundle telemetry feature expansion |  |
| P12-B-DEC-07 | next slice does not weaken `Lap Analysis` meaning |  |
| P12-B-DEC-08 | next slice has a separate approval statement |  |

## Approval Statement

Use this only when the next slice is explicitly approved:

`Open Phase 1.2-B with a narrowly defined second slice. Keep the accepted Phase 1.2-A baseline intact. Do not bundle Dashboard, Graph Analysis, search-heavy browsing, telemetry expansion, comparison UI, coaching, AI, minimap, or track-geometry UI unless they are explicitly approved inside the new slice.`

## Rejection Statement

Use this when the next slice should stay closed:

`Do not open Phase 1.2-B yet. Keep the accepted Phase 1.2-A baseline and reopen scope only after a new narrow slice is explicitly defined.`

## Selected Statement

Current selected statement:

`Do not open Phase 1.2-B yet. Keep the accepted Phase 1.2-A baseline and reopen scope only after a new narrow slice is explicitly defined.`

## Decision Rationale

Current rationale:

- `Phase 1.2-A` is accepted and should stabilize before a second slice opens
- the candidate slice is still only a candidate, not an approved implementation target
- automatic follow-up work would create scope drift risk
- the accepted `Sessions / Lap Analysis` split should remain the active baseline

## Recommended Next Step

Do next:

1. keep `Phase 1.2-B` in `Deferred`
2. use the candidate and open-checklist documents only as decision inputs
3. treat any new request as decision input first, not automatic implementation

## Related Documents

- `reports/phase1_2_a_closeout.md`
- `reports/phase1_2_scope_decision.md`
- `reports/phase1_2_a_implementation_plan.md`
