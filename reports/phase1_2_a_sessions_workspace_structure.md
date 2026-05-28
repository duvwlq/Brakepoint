# Phase 1.2-A Sessions Workspace Structure

## Summary

This document defines the structure of the `Sessions` workspace for the first
active Phase 1.2 slice.

It exists to keep `Sessions split first` narrow and browsing-focused.

It does not authorize a full browsing product surface, dashboard expansion, or
search-heavy session management system.

## Workspace Goal

`Sessions` should become the place where the user answers:

- which session do I want to inspect next?

It should not try to answer:

- how did I drive this lap?

That remains the job of `Lap Analysis`.

## Primary Structure

The `Sessions` workspace should have three visible layers:

1. top context bar
2. compact browsing controls
3. main grouped session results area

## Top Context Bar

The top area should show only enough context to orient the user.

Recommended content:

- page title: `Sessions`
- telemetry source status summary
- optional current browsing scope label

It should not become:

- a dashboard summary wall
- a telemetry analytics header
- a product marketing banner

## Compact Browsing Controls

This slice only needs lightweight controls already consistent with current
Phase 1.1 browsing behavior.

Allowed controls:

- session status filter
- session type filter
- compact refresh action if still needed

Rules:

- controls stay compact
- controls remain renderer-local
- controls do not expand into search
- controls do not expand into saved filters
- controls do not expand into advanced metadata builders

## Main Results Area

The main area should be browsing-first.

Allowed result patterns:

- grouped list
- grouped list with stronger row density
- table-like structure if it stays compact and readable

Required grouping logic:

- group by track display name
- subgroup by layout where available
- preserve latest-first ordering inside the group

Required row content:

- session title or identity
- recording time
- car or car class context where available
- session type
- state: ready / error / partial

## Selection Behavior

Selecting a ready session should:

- open `Lap Analysis`
- preserve current selection logic
- preserve session metadata loading
- preserve lap list behavior

Error or partial sessions should:

- remain visible
- keep item-level state clarity
- not pretend to be ready sessions

## Density Rules

The `Sessions` workspace may be denser than `Lap Analysis`, but it must remain
readable.

Rules:

- emphasize scanability over decorative cards
- prefer structured grouping over oversized panels
- allow long history without making the page feel like a dashboard
- keep state chips and badges compact

## Relationship To Lap Analysis

The split is only successful if `Sessions` and `Lap Analysis` stop competing
for the same job.

`Sessions` owns:

- browse
- group
- filter
- choose

`Lap Analysis` owns:

- inspect
- compare current graph evidence inside the current lap only
- read the actual lap line

## Explicit Non-Goals

Do not add any of the following in this structure definition:

- search
- saved filters
- favorites
- dashboard widgets
- track preview
- SVG map
- fake geometry
- Best Lap comparison
- Ghost
- Coach
- Delta
- Heatmap
- AI

## Acceptance For Sessions Structure

The structure is acceptable only if:

- the page reads as browsing-first
- grouped session browsing is clearer than in the analysis page
- filters remain lightweight
- ready/error/partial state clarity is preserved
- selecting a session still leads cleanly into Lap Analysis
- the page does not accidentally become a dashboard or comparison surface

## Recommended Next Step

After this structure is accepted:

1. define the default route and entry behavior
2. define the back-navigation behavior from `Lap Analysis`
3. then prepare implementation planning for the first slice
