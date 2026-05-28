# Phase 1.2-A Minimal Navigation Shell

## Summary

This document defines the smallest navigation shell needed to support
`Sessions split first`.

It is not a full application shell redesign.

Its purpose is to support the page boundary between `Sessions` and
`Lap Analysis` without opening broader IA scope in the same slice.

## Shell Principle

The first Phase 1.2 slice needs only enough navigation to:

- enter `Sessions`
- enter `Lap Analysis`
- move back from `Lap Analysis` to `Sessions`

Anything beyond that should stay deferred.

## Required Navigation Items

For this slice, the required navigation targets are:

- `Sessions`
- `Lap Analysis`

Optional placeholder targets may exist visually only if they are clearly
inactive or deferred, but the first slice does not require them.

## Not Required In This Slice

Do not require a working shell for:

- Dashboard
- Graph Analysis
- Settings
- Help
- Leaderboard-like utility areas
- multi-product or multi-game entry points

If any of these appear, they must not become implementation obligations of the
first slice.

## Navigation Behavior

Minimum behavior:

1. app opens into an agreed default route
2. user can go to `Sessions`
3. user can open a selected session into `Lap Analysis`
4. user can return to `Sessions`

The shell should not require:

- deep route hierarchy
- rich breadcrumb system
- tabbed multi-analysis workspace
- Dashboard as a mandatory landing step

## Visual Rules

The shell should read as support UI, not as the product center.

Rules:

- navigation remains compact
- current location is obvious
- navigation should not visually overpower the analysis canvas
- the shell should not feel like a multi-feature gaming hub

## Lap Analysis Protection

The shell must not force a redesign of Lap Analysis.

Required rule:

- `Lap Analysis` layout changes only when necessary to coexist with the split

Avoid:

- turning Lap Analysis into a route-heavy dashboard page
- shrinking the canvas just to satisfy shell symmetry
- moving core graphs out of their current role

## Sessions Protection

The shell must allow `Sessions` to become browsing-first.

That means:

- enough width for grouped list or table-style browsing
- enough context for track/layout browsing
- no pressure to keep long session history embedded in analysis

## Explicit Non-Goals

This shell does not authorize:

- full left-nav product redesign
- Dashboard implementation
- Graph Analysis implementation
- search
- saved filters
- new telemetry features
- comparison features
- AI / coaching features
- corridor or track-geometry UI

## Acceptance For This Shell

The minimal shell is acceptable only if:

- it supports `Sessions split first`
- it does not force extra page scope into the slice
- it preserves current analysis usability
- it keeps the IA change smaller than a broad product-shell rewrite

## Recommended Next Step

After this shell definition is accepted:

1. define the `Sessions` workspace structure
2. confirm the default route and back-navigation rule
3. only then prepare implementation planning
