# Phase 1.2-A Back Navigation Behavior

## Summary

This document defines how the user returns from `Lap Analysis` to `Sessions`
during `Phase 1.2-A: Sessions Split First`.

It exists to keep the first-slice navigation predictable and narrow.

The goal is simple:

- entering analysis should feel intentional
- returning to browsing should feel recoverable and unsurprising

## Core Rule

For the first Phase 1.2 slice, `Lap Analysis` must provide a clear path back
to `Sessions`.

The return behavior should:

- preserve browsing context as much as possible within the active renderer
  session
- avoid dropping the user into an unrelated or reset-looking state
- avoid requiring a large shell or route framework

## Required Back Action

`Lap Analysis` should expose a clear return action to `Sessions`.

This can be:

- a compact back control
- a navigation item with obvious current-page state
- a minimal route-level return affordance

The first slice does not require:

- breadcrumbs
- multi-step navigation history UI
- deep route stacks

## Preserved Context Rule

When returning to `Sessions`, preserve as much of the current browsing context
as is reasonable without adding persistence complexity.

Preserve if available in the current renderer session:

- current track group visibility
- current layout subgroup visibility
- current lite filter state
- current scroll position or nearby context when practical
- the previously selected session being still recognizable

Do not require:

- persistence across app restarts
- multi-window synchronization
- deep browsing-history reconstruction

## Selection Relationship Rule

Returning to `Sessions` should not clear the meaning of the currently inspected
session.

Expected behavior:

- the session just inspected in `Lap Analysis` should still be recognizable in
  `Sessions`
- the user should be able to continue browsing from that point instead of
  re-finding the same group from scratch

## Fallback and Error State Rule

Back navigation must not hide or weaken important source and session states.

Required behavior:

- source missing or broken state remains visible enough in `Sessions`
- error or partial sessions remain visibly different from ready sessions
- back navigation does not imply that invalid laps became selectable

## Explicit Non-Goals

This back-navigation definition does not authorize:

- browser-like navigation systems
- tabbed workspaces
- full route persistence
- Dashboard back stack behavior
- Graph Analysis navigation behavior
- broader shell redesign

## Acceptance For Back Navigation

The first slice back-navigation behavior is acceptable only if:

- the return path is obvious
- the user lands back in understandable browsing context
- current lite filters and grouping do not feel lost
- `Lap Analysis` does not become harder to use because of route complexity

## Recommended Next Step

After back-navigation behavior is accepted:

1. define whether deferred pages need placeholder navigation treatment
2. summarize the full first-slice navigation model in one short implementation
   brief
3. only then prepare implementation planning
