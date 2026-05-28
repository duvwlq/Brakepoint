# Phase 1.2 Sessions Split First

## Summary

This document defines the safest first implementation slice if Brakepoint later
opens Phase 1.2.

It is intentionally narrower than a full layout rewrite.

The goal is to separate browsing from analysis before introducing a broader
navigation shell or a graph-focused page.

## Core Decision

If Phase 1.2 begins, the first slice should be:

- `Sessions split first`

Interpretation:

- create a dedicated Sessions workspace before any broader shell rewrite
- preserve the current Lap Analysis behavior as much as possible
- do not open Graph Analysis in the same slice

## Why This Slice Comes First

This slice solves the highest-value IA problem with the lowest product risk.

Benefits:

- removes long browsing history pressure from the analysis workspace
- gives Sessions room to become table or grouped-list oriented
- preserves the proven Actual Lap Line first experience in Lap Analysis
- avoids mixing IA work with telemetry feature expansion

## Scope

### In Scope

- dedicated Sessions page or workspace
- session grouping and current lite filters carried into that workspace
- current session metadata and selection flow preserved
- minimal navigation support required to move between Sessions and Lap Analysis

### Out Of Scope

- Dashboard implementation
- Graph Analysis implementation
- full global app shell redesign
- search
- saved filters
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

## Sessions Workspace Rules

The Sessions workspace should be:

- browsing-first
- list or table friendly
- track and layout oriented
- compact and desktop readable

The Sessions workspace should not:

- pretend to be analysis-first
- embed a fake track preview
- imply actual track geometry
- become a dashboard shell

## Lap Analysis Protection Rules

During the first Phase 1.2 slice:

- keep Racing Line Canvas as the visual center
- keep Speed / Brake / Throttle as the core graph set
- keep advanced graphs secondary and collapsible
- keep hover sync and fallback behavior unchanged
- avoid unnecessary layout churn inside Lap Analysis

Preferred implementation attitude:

- move browsing out
- do not redesign analysis unless required by the split

## Suggested Implementation Order

1. define route or page boundary for Sessions
2. move current grouped session browsing into that workspace
3. keep session selection behavior unchanged
4. make Lap Analysis open from a selected session flow
5. only after that evaluate whether more navigation shell work is necessary

## Acceptance For The First Slice

The first slice should only be considered successful if:

- Sessions is clearly separate from Lap Analysis
- browsing no longer competes with the canvas-heavy analysis view
- selecting a ready session still leads cleanly into lap analysis
- current valid / invalid lap behavior remains unchanged
- release sanity for the existing analysis workflow stays green

## Guardrails

Do not allow the first slice to expand into:

- comparison features
- new telemetry channels
- graph-heavy redesign
- dashboard-led product shell
- track-geometry claims without validated data

Keep these rules:

- no fake telemetry fallback
- no actual track boundary
- no actual gray track surface
- no actual track width
- no corridor UI
- no Best Lap / Ghost / Coach / Delta / Heatmap / AI

## Recommended Follow-Up Sequence

Only after `Sessions split first` is stable:

1. review whether a lightweight global navigation shell is still needed
2. decide whether Dashboard should exist as a real page or remain deferred
3. evaluate whether Graph Analysis deserves its own page

This keeps the IA expansion incremental instead of turning into a large
multi-page rewrite immediately.
