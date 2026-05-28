# Phase 1.2-B Candidate Slice

## Summary

This document defines the narrowest reasonable candidate for:

- `Phase 1.2-B`

It is a decision-input document only.
It does not open implementation.

The purpose is to avoid broad or vague follow-up work after the accepted
`Phase 1.2-A` baseline.

## Current Status

Current status:

- `Candidate only`
- `Not approved`
- `Not opened`

## Candidate Name

- `Phase 1.2-B: Sessions Table Density and Inline Detail Polish`

## Why This Slice

This is the safest next candidate because:

- it stays inside `Sessions`
- it does not require Dashboard
- it does not require Graph Analysis
- it does not require telemetry feature expansion
- it does not weaken the accepted `Lap Analysis` baseline

## Candidate Objective

Improve the readability and efficiency of the accepted `Sessions` workspace
without changing the product model.

Primary outcome:

- session rows become easier to scan
- compact inline detail becomes clearer
- grouped browsing remains the primary activity

## In Scope

Allowed only if this slice is later approved:

- row density tuning in `Sessions`
- stronger column hierarchy in the sessions list
- compact inline detail polish for session metadata
- small readability improvements for ready / partial / error states
- no-change refinement of grouped browsing layout

## Out Of Scope

Still excluded from this candidate:

- Dashboard
- Graph Analysis
- search
- saved filters
- new filters beyond current lite behavior
- telemetry feature expansion
- minimap
- comparison-style features
- corridor UI
- actual track boundary
- actual gray track surface
- actual track width
- major `Lap Analysis` redesign

## Acceptance Shape

If approved later, this candidate should satisfy:

- `Sessions` remains browsing-first
- grouped browsing remains intact
- ready / partial / error clarity improves or stays neutral
- `Lap Analysis` behavior does not change
- no broader navigation or shell rewrite is required

## Rejection Rule

Reject this candidate if it starts requiring:

- search-heavy browsing
- broader shell redesign
- Dashboard
- Graph Analysis
- new telemetry features
- deeper route/history work

## Recommended Next Step

Do next:

1. keep `Phase 1.2-B` unopened
2. use this document only as a candidate input
3. open `Phase 1.2-B` only if this narrow slice is explicitly approved

## Related Documents

- `reports/phase1_2_b_scope_decision.md`
- `reports/phase1_2_a_closeout.md`
- `reports/phase1_2_a_implementation_plan.md`
