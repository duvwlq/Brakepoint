# Phase 1.2 Scope Decision

## Summary

This document is the final decision layer before any real Phase 1.2
implementation begins.

Use it only after:

- `reports/phase1_2_open_checklist.md`
- `reports/phase1_2_sessions_split_first_kickoff.md`

have been reviewed and accepted.

This document is intentionally short.
Its job is to force a clear go/no-go decision and prevent scope drift.

## Decision Status

Current status:

- `Opened`

Allowed future statuses:

- `Not Opened`
- `Opened`
- `Deferred`

## Decision Question

Should Brakepoint open Phase 1.2 now?

The default answer should remain `No` unless the first slice scope is accepted
explicitly.

Current decision:

- open Phase 1.2 now
- start only with `Sessions split first`
- keep the current closeout baseline outside that first slice

Decision rationale:

- the first slice is now explicitly approved
- the scope is narrow enough to avoid a broad shell rewrite
- `Lap Analysis unchanged as much as possible` remains the controlling rule
- Dashboard, Graph Analysis, and non-IA feature expansion remain out of the
  first slice

## Scope If Opened

If Phase 1.2 is opened, the first slice is:

- `Sessions split first`

Hard rules:

- keep `Lap Analysis` unchanged as much as possible
- do not include `Dashboard`
- do not include `Graph Analysis`
- do not include search or saved filters
- do not include new telemetry features
- do not include minimap
- do not include comparison, coaching, or AI features
- do not include corridor or track-geometry UI

## Acceptance Baseline

If opened, the first slice must satisfy:

- Sessions is separate from Lap Analysis
- track/layout grouping remains intact
- lite filters remain intact
- selecting a ready session still leads cleanly into analysis
- invalid lap behavior remains unchanged
- Racing Line Canvas remains the visual center of Lap Analysis
- core Speed / Brake / Throttle graphs remain unchanged
- fallback behavior remains unchanged

## Go / No-Go Checklist

| ID | Check | Result |
| --- | --- | --- |
| P12-DEC-01 | current release sanity remains green |  |
| P12-DEC-02 | packaged app flow has no known blocker |  |
| P12-DEC-03 | `Sessions split first` is accepted |  |
| P12-DEC-04 | `Lap Analysis unchanged as much as possible` is accepted |  |
| P12-DEC-05 | Dashboard is explicitly out of the first slice |  |
| P12-DEC-06 | Graph Analysis is explicitly out of the first slice |  |
| P12-DEC-07 | no telemetry feature expansion is bundled in |  |
| P12-DEC-08 | no track-geometry UI is bundled in |  |

## Approval Statement

Use this exact form when approving the phase:

`Open Phase 1.2 with Sessions split first. Keep Lap Analysis unchanged as much as possible. Do not include Dashboard, Graph Analysis, search, minimap, comparison, coaching, AI, or track-geometry UI in the first slice.`

## Rejection Statement

Use this exact form when deferring the phase:

`Do not open Phase 1.2 yet. Keep the current closeout baseline and revisit only when Sessions split first can remain a narrow IA slice.`

Selected statement:

`Open Phase 1.2 with Sessions split first. Keep Lap Analysis unchanged as much as possible. Do not include Dashboard, Graph Analysis, search, minimap, comparison, coaching, AI, or track-geometry UI in the first slice.`

## Recommended Next Step

Choose one:

1. treat `Phase 1.2-A` as the accepted first-slice baseline
2. use `reports/phase1_2_a_closeout.md` as the current operating summary
3. patch only direct regressions unless a new scope decision opens wider IA work
