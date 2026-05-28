# Phase 1.2 IA Proposal

## Summary

This report proposes a future `Phase 1.2` scope focused on product
information architecture and desktop layout clarity.

It does not change the active roadmap yet.
Current decision status is now `Opened` for the narrow `Sessions split first`
slice only.

It exists so that future implementation can start from a constrained proposal
instead of casually expanding from the Phase 1.1 closeout baseline.

## Why A Separate Phase 1.2 Proposal Is Needed

Phase 1 and Phase 1.1 already stabilized:

- LMU session and lap loading
- actual lap line analysis
- core Speed / Brake / Throttle graph workflow
- compact advanced graph support
- density and invalid-lap polish

The next major improvement is no longer a telemetry feature.
It is an IA and workspace restructuring problem:

- browsing and analysis still share too much surface area
- desktop navigation is still analysis-first rather than app-first
- the product now has enough stable pieces to justify page-level separation

This is larger than polish, but smaller than a new telemetry-analysis phase.

## Proposed Phase 1.2 Goal

Give Brakepoint a cleaner desktop product shell without changing the telemetry
truth model.

Primary goal:

- separate browsing, lap analysis, and graph-focused reading into clearer page
  responsibilities

Secondary goal:

- reduce analysis-page clutter by moving broad browsing concerns out of the
  lap-analysis workspace

## Proposed Scope

### In Scope

- left global navigation
- page split between:
  - Dashboard
  - Sessions
  - Lap Analysis
  - Graph Analysis
  - Settings
- top context and lightweight filter bar patterns
- Sessions workspace that can support wider browsing layouts
- preserving Lap Analysis as the dedicated actual-lap-line page

### Not In Scope

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
- fake track map
- telemetry model changes
- LMU adapter changes

## Proposed Page Roles

### Dashboard

- source status
- recent analysis shortcuts
- quick route into active work

### Sessions

- grouped session browsing
- compact list or table-first browsing workspace
- lightweight status and session-type filtering

### Lap Analysis

- actual lap line
- lap inspector
- core Speed / Brake / Throttle graphs
- advanced graph drawer
- warnings and fallback states

### Graph Analysis

- wider graph-reading workspace
- advanced graphs in a graph-focused context
- future home for denser telemetry reading without polluting Lap Analysis

### Settings

- telemetry folder status
- environment/runtime state
- adapter/debug controls where appropriate

## Proposed Layout Rules

1. Lap Analysis keeps Racing Line Canvas as the visual center.
2. Sessions becomes browsing-first, not canvas-first.
3. Graph Analysis becomes graph-first, not navigation-first.
4. Global navigation must not imply a multi-game launcher or social shell.
5. Top bars should stay compact and contextual.
6. Table/list density is allowed in Sessions, but not at the expense of
   readability.

## Entry Criteria

Before opening Phase 1.2 implementation:

- Phase 1 closeout remains stable
- Phase 1.1 closeout remains stable
- release sanity remains green
- no unresolved release-blocking regression in packaged app flow

## Exit Criteria

Phase 1.2 should only be considered done if:

- page-level IA is clearer than the current single-surface layout
- Sessions can handle broader browsing without shrinking Lap Analysis
- Lap Analysis still reads as actual-lap-line-first within 3 seconds
- Graph Analysis does not turn the app into a graph-heavy engineering shell by
  default
- no telemetry source-of-truth rules are weakened

## Guardrails

Phase 1.2 must not silently turn into:

- telemetry feature expansion
- comparison systems
- coaching systems
- AI features
- track-geometry claims without validated data

Keep these rules:

- no new graph channels by default
- no fake telemetry fallback
- no actual track boundary
- no actual gray track surface
- no actual track width
- no corridor UI
- no Best Lap / Ghost / Coach / Delta / Heatmap / AI

## Suggested First Slice

If this proposal is accepted later, the safest first slice is:

1. split `Sessions` from `Lap Analysis` first
2. keep `Lap Analysis` behavior unchanged as much as possible
3. add only the minimum navigation shell needed to support that split
4. defer `Graph Analysis` page until the shell is stable

This keeps the first Phase 1.2 increment focused on IA rather than feature
expansion.

### Why `Sessions Split First` Is The Safest Slice

- it separates browsing from analysis with the least telemetry risk
- it allows `Sessions` to become wider and more table or list oriented
  without shrinking the existing canvas-first analysis view
- it avoids opening `Graph Analysis` and global product shell questions at the
  same time
- it lets the team validate the IA split before committing to a broader
  navigation rewrite

Implementation rule for the first slice:

- `Sessions` changes first
- `Lap Analysis` changes as little as possible
- `Graph Analysis` stays deferred
- do not attach new telemetry features to the IA split

## Recommendation

Treat this as a proposal only.

The current opening is constrained to the first slice only:

1. `Sessions split first`
2. `Lap Analysis unchanged as much as possible`
3. no Dashboard or Graph Analysis in the first slice

Do not broaden the implementation scope beyond that until:

1. the team agrees to open `Phase 1.2`
2. page boundaries are accepted
3. the first slice is explicitly chosen

After opening:

- keep `Sessions split first` as the only allowed active first-slice scope
- do not treat the opening as approval for a broader shell rewrite
- do not begin Dashboard or Graph Analysis implementation from this document
  alone
