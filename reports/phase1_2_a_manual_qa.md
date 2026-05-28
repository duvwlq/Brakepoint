# Phase 1.2-A Manual QA

## Summary

This document is the focused manual QA checklist for:

- `Phase 1.2-A: Sessions Split First`

It exists to validate the current first-slice implementation without adding
new scope.

This is not a feature plan.
It is an acceptance and regression checklist only.

## Current Status

Current implementation state:

- `Sessions` is the default route
- grouped session browsing renders in `Sessions`
- lite filters render in `Sessions`
- ready session selection opens `Lap Analysis`
- invalid laps remain visible but non-selectable
- `Back to Sessions` exists
- browsing context preservation is implemented in the active renderer session

Current QA state:

- packaged app human spot-check passed for the core first-slice flow

## Required Setup

Before manual QA:

1. run `npm.cmd run build`
2. launch the app in a stable local environment
3. ensure LMU telemetry source is available

Recommended launch:

- `npm.cmd run electron`

If packaged app QA is preferred:

- use the existing packaged app sanity flow separately

## Acceptance Checklist

| ID | Check | Pass Condition | Result | Notes |
| --- | --- | --- | --- | --- |
| P12-A-QA-01 | Default entry | app opens into `Sessions` | Pass | packaged app spot-check |
| P12-A-QA-02 | Source status visible | telemetry source state is visible enough at entry | Pass | packaged app spot-check |
| P12-A-QA-03 | Grouped browsing | track/layout grouped browsing still works | Pass | packaged app spot-check |
| P12-A-QA-04 | Lite filters | session status and session type filters still work | Pass | packaged app spot-check |
| P12-A-QA-05 | Ready session selection | selecting a ready session opens `Lap Analysis` cleanly | Pass | packaged app spot-check |
| P12-A-QA-06 | Error/partial clarity | ready / error / partial session states remain visually distinct | Pass | packaged app spot-check |
| P12-A-QA-07 | Invalid lap visibility | invalid laps remain visible in the lap list | Pass | packaged app spot-check |
| P12-A-QA-08 | Invalid lap blocking | invalid laps remain non-selectable | Pass | packaged app spot-check |
| P12-A-QA-09 | Analysis context | current analysis target is understandable in `Lap Analysis` | Pass | packaged app spot-check |
| P12-A-QA-10 | Canvas priority | Racing Line Canvas remains visually primary | Pass | packaged app spot-check |
| P12-A-QA-11 | Core graphs | Speed / Brake / Throttle remain the core graphs | Pass | packaged app spot-check |
| P12-A-QA-12 | Advanced graphs | advanced graph drawer remains secondary | Pass | packaged app spot-check |
| P12-A-QA-13 | Hover sync | hover sync still works across canvas and graphs | Pass | packaged app spot-check |
| P12-A-QA-14 | Fallback safety | fallback and warning states remain safe | Pass | packaged app spot-check |
| P12-A-QA-15 | Back navigation | `Back to Sessions` is obvious and works | Pass | packaged app spot-check |
| P12-A-QA-16 | Browsing context preservation | returning to `Sessions` keeps filter and scroll context understandable | Pass | packaged app spot-check |
| P12-A-QA-17 | Scope guardrail | no Dashboard, no Graph Analysis, no search, no minimap, no comparison UI appears | Pass | packaged app spot-check |

## Fallback / Error Regression Check

Spot-check the following if possible:

1. missing telemetry folder
2. empty telemetry folder
3. corrupt `.duckdb`
4. `distance-graph-only` no-coordinates fallback

Pass rule:

- the split must not weaken or hide these states

## Pass Rule

The first slice can be treated as accepted only if:

- blocker-level navigation or browsing regressions are not present
- grouped browsing remains understandable
- `Lap Analysis` meaning remains intact
- fallback safety remains intact
- no new scope was introduced to make the slice work

Current result:

- accepted

## Fail Rule

Treat as not accepted yet if any of the following happen:

- app no longer reads as `Sessions` first
- selecting a ready session does not lead cleanly into analysis
- invalid lap behavior regresses
- canvas or core graph meaning becomes weaker
- back navigation loses browsing context in a confusing way
- the fix would require Dashboard, Graph Analysis, search, or a broad shell rewrite

## Recommended Next Step

After this QA:

1. treat `Phase 1.2-A` as the accepted first-slice implementation
2. keep follow-up work limited to regression-only fixes unless a new scope decision opens wider IA work
3. do not expand into Dashboard, Graph Analysis, search-heavy browsing, or telemetry feature growth in the same pass
