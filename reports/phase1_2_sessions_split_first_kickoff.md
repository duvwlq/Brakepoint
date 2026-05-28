# Phase 1.2 Sessions Split First Kickoff

## Summary

This document is the kickoff checklist for the first real implementation slice
if Brakepoint opens Phase 1.2.

It exists to prevent scope creep before code work begins.

This is not an approval to implement immediately.
It is a constrained execution baseline.

Current state:

- Phase 1.2 is opened
- this first slice is actively implemented
- the kickoff checklist now acts as the acceptance baseline for the in-progress slice

## Slice Name

- `Phase 1.2-A: Sessions Split First`

## Goal

Separate broad session browsing from Lap Analysis while keeping the proven
analysis flow stable.

Primary outcome:

- Sessions becomes its own workspace
- Lap Analysis remains the current analysis-first surface

## Non-Goals

Do not include any of the following in the first slice:

- Dashboard implementation
- Graph Analysis implementation
- global shell redesign beyond what Sessions split requires
- search
- saved filters
- car/date filter expansion
- Best Lap comparison
- Ghost
- Coach
- Delta
- Heatmap
- AI
- minimap
- corridor UI
- actual track boundary
- actual gray track surface
- actual track width

## Work Breakdown

### Step 1. Page Boundary Definition

Define:

- what is considered `Sessions`
- what is considered `Lap Analysis`
- how navigation between them works

Required rule:

- `Lap Analysis` must not absorb broad browsing again

### Step 2. Sessions Workspace Extraction

Move into Sessions:

- grouped session list
- lite filters
- telemetry source status entry context where appropriate

Preserve:

- ready / error / partial state rendering
- selected session behavior
- track/layout grouping behavior

### Step 3. Selection Flow Preservation

Keep the same logic for:

- selecting a session
- loading session metadata
- displaying lap list
- selecting a valid lap
- keeping invalid laps visible but non-selectable

### Step 4. Lap Analysis Protection

Do not redesign Lap Analysis beyond what the split requires.

Keep:

- Racing Line Canvas as visual center
- Speed / Brake / Throttle as core graphs
- advanced graph drawer secondary
- hover sync behavior
- fallback behavior

### Step 5. Sanity Verification

Verify after the split:

- session browsing still works
- lap analysis still works
- no fallback regression
- no packaged-app regression if packaging is rerun

## Acceptance Checklist

| ID | Check | Pass Condition |
| --- | --- | --- |
| P12-A-01 | Sessions separated | broad browsing no longer lives inside Lap Analysis |
| P12-A-02 | Grouping preserved | track/layout grouping still works |
| P12-A-03 | Filters preserved | lite filters still work |
| P12-A-04 | Selection preserved | selecting a ready session still leads to analysis cleanly |
| P12-A-05 | Invalid laps preserved | invalid laps remain visible but non-selectable |
| P12-A-06 | Lap Analysis protected | canvas-first analysis remains intact |
| P12-A-07 | Core graphs protected | Speed / Brake / Throttle remain core graphs |
| P12-A-08 | Fallback protected | no-coordinates and other fallback states still behave safely |
| P12-A-09 | Guardrails preserved | no minimap, no comparison, no track-geometry UI appears |

## Current Implementation Readout

Implemented so far:

- `Sessions` is the default entry route
- a minimal `Sessions / Lap Analysis` navigation shell exists
- grouped session browsing and lite filters render in `Sessions`
- ready session selection opens `Lap Analysis`
- invalid laps remain visible but non-selectable
- Lap Analysis still keeps canvas and core graph priority
- `Back to Sessions` exists
- browsing context is preserved inside the active renderer session

Still pending before slice close:

- none at blocker level for the first-slice core flow
- regression-only patching if later QA finds issues

Manual QA checklist:

- `reports/phase1_2_a_manual_qa.md`

## Risks To Watch

- Sessions split quietly turning into a full shell rewrite
- Lap Analysis receiving unnecessary layout churn
- filter scope expanding beyond lite browsing support
- Graph Analysis getting pulled in too early

## Stop Conditions

Pause and re-scope if any of these happen:

- the slice starts requiring Dashboard to make sense
- the slice starts requiring Graph Analysis to make sense
- the split requires new telemetry features
- the split pressures Lap Analysis into a major redesign

## Recommended Decision After Kickoff

Current result:

- the first slice passed manual QA

If the first slice passes manual QA:

1. keep `Sessions split first` as the accepted first slice
2. review outcome before opening any wider shell work
3. do not expand into Dashboard, Graph Analysis, or search-heavy browsing in the same pass

If the first slice is not accepted:

1. patch only direct first-slice regressions
2. do not widen the slice to solve local QA issues
