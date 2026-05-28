# Phase 1.2-A Default Route and Entry Behavior

## Summary

This document defines the default route and entry behavior for
`Phase 1.2-A: Sessions Split First`.

It exists to keep the first slice predictable before implementation begins.

The goal is to answer a narrow question:

- where does the user land first
- how does the user move from browsing into analysis

## Default Route Decision

For the first Phase 1.2 slice, the default route should be:

- `Sessions`

Reason:

- the first slice is explicitly about separating browsing from analysis
- landing directly in `Lap Analysis` would weaken the value of the split
- `Sessions` is now the correct home for grouped history and lightweight
  selection controls

## Entry Behavior

On app entry, the user should see:

1. `Sessions` page
2. telemetry source status summary
3. grouped session results
4. compact filters

The default route should not require:

- a Dashboard first
- a global launcher step
- a graph-first entry page

## Primary Entry Flow

The first-slice entry flow should be:

1. open app
2. land in `Sessions`
3. review grouped sessions
4. select a ready session
5. transition into `Lap Analysis`
6. review session metadata and lap list
7. select a valid lap
8. inspect Racing Line Canvas and graphs

## Source Status Rule

Telemetry source status remains important even if the app lands in `Sessions`.

Required behavior:

- source status remains visible at entry in a compact form
- missing or broken source state must still be obvious
- source state must not be hidden behind navigation collapse or deferred UI

## Selected Session Rule

If the user comes from `Sessions` into `Lap Analysis`:

- the chosen session becomes the active analysis target
- current session metadata must load as before
- lap list behavior must stay unchanged

The first slice does not require:

- session preloading across multiple views
- saved browsing state across app restarts
- multi-tab analysis behavior

## Re-entry Behavior

If the user leaves `Lap Analysis` and returns to `Sessions`:

- the browsing context should remain understandable
- the current track/layout grouping should still be obvious
- the user should not feel dropped into an unrelated blank state

This does not require persistence beyond the current renderer session unless a
later scope decision adds it.

## Explicit Non-Goals

This route definition does not authorize:

- Dashboard as a mandatory first page
- Graph Analysis as an entry page
- deep navigation hierarchy
- search-first entry
- saved workspace state
- new telemetry behavior

## Acceptance For Entry Behavior

The route and entry behavior are acceptable only if:

- landing in `Sessions` feels natural
- moving from browsing into analysis is obvious
- source status remains visible enough
- the split does not slow down access to a valid lap in a confusing way

## Recommended Next Step

After this entry behavior is accepted:

1. define the return or back-navigation behavior from `Lap Analysis`
2. confirm whether the first slice needs any route placeholder for deferred pages
3. only then start implementation planning
