# Brakepoint 2.0 IA Proposal

## Summary

This document defines the proposed Brakepoint 2.0 product information
architecture.

It is not an immediate implementation approval.
It exists to clarify the long-term product structure before screen-level visual
design or Figma work expands in an ad hoc way.

The core change is:

- Brakepoint should stop feeling like one dense telemetry workspace
- Brakepoint should become a clearer product with page-level responsibilities
- `Lap Analysis` should remain the main value screen

## Why This IA Is Needed

The current accepted baseline is already useful:

- LMU telemetry loading is stable
- session browsing works
- lap analysis works
- current-vs-best minimal overlay is constrained

But the current product shape still puts too many jobs on one surface:

- session browsing
- lap picking
- line analysis
- graph reading
- warning interpretation

That makes the product read as:

- `there is a lot of telemetry here`

before it reads as:

- `this is the lap I should understand right now`

Brakepoint 2.0 should fix that by separating responsibilities, not by simply
adding more UI to the same page.

## Product Principle

Brakepoint is not a racing-game dashboard.
Brakepoint is a trustworthy lap analysis product.

Primary reading order:

1. know what session and lap is selected
2. see the driven lap line
3. inspect the supporting graph evidence
4. go back to browsing only when needed

## Proposed Product Structure

### Dashboard

Purpose:

- lightweight app entry
- quick return to the last meaningful workflow
- source and telemetry readiness overview

Should show:

- LMU telemetry connection status
- recent analysed session
- recent best lap shortcut
- quick path into `Sessions`
- quick path back into `Lap Analysis`

Should not become:

- a marketing dashboard
- a reward screen
- a graph-heavy analytics home

### Sessions

Purpose:

- browsing and selecting analysis candidates

Should show:

- track grouping first
- layout grouping second
- session cards or rows with compact metadata
- best lap summary
- valid lap ratio
- session quality hints when available later

Should answer:

- `which session should I open next?`

Should not own:

- full lap analysis
- graph-heavy telemetry reading
- track-map presentation

### Lap Analysis

Purpose:

- the core Brakepoint experience

Should show:

- selected track / car / lap context
- current session and lap selection
- large Racing Line Canvas
- lap info and compact warnings
- Speed / Brake / Throttle as supporting evidence
- compact advanced graph drawer
- compact current-vs-best overlay toggle

Should answer:

- `what happened in this lap?`

Should remain:

- actual-lap-first
- canvas-centered
- readable within 5 seconds

Should not become:

- a dashboard
- a browsing page
- a graph-heavy expert wall by default

### Graph Analysis

Purpose:

- future graph-first workspace for deeper telemetry reading

This page is intentionally future-facing.
It exists so that `Lap Analysis` does not have to absorb every dense telemetry
feature.

Possible future role:

- graph-first review
- denser advanced channels
- future comparison-oriented graph work

Should not open automatically from this document.

### Settings

Purpose:

- source path
- telemetry adapter and environment settings
- product preferences
- future integrity or replay preferences if approved later

## Recommended Navigation Model

Primary navigation:

- Dashboard
- Sessions
- Lap Analysis
- Graph Analysis
- Settings

Rules:

- `Sessions` and `Lap Analysis` are the primary day-to-day pair
- `Lap Analysis` is the main destination after session selection
- `Graph Analysis` stays secondary and should never displace `Lap Analysis`
- the product must avoid putting all workflows back onto one screen

## IA Priority Order

If design or implementation work starts later, the priority should be:

1. Design system
2. `Lap Analysis`
3. `Sessions`
4. `Dashboard`
5. `Graph Analysis`
6. `Settings`

Reason:

- `Lap Analysis` is the core experience
- `Sessions` exists to support that experience
- `Dashboard` can wait as long as the path into analysis is strong
- `Graph Analysis` should not shape the product too early

## Guardrails

Brakepoint 2.0 should still preserve the existing telemetry trust model.

Do not introduce from IA work alone:

- fake track maps
- actual track boundary presentation
- actual gray track surface
- actual track width UI
- corridor UI
- Ghost
- Coach
- AI
- Heatmap
- delta-heavy expert workflow by default

The structure can evolve.
The telemetry truth rules must not.

## Acceptance Shape For The IA Proposal

This IA proposal is successful if it makes the following clearer:

- `Sessions` is for choosing what to analyse
- `Lap Analysis` is for understanding one selected lap
- `Graph Analysis` is future graph-first depth, not current default depth
- the app no longer needs one dense screen to express every workflow

## Recommended Next Step

Use this IA proposal as the parent reference for:

1. `Brakepoint Design System`
2. `Lap Analysis` screen design brief for Figma
3. later `Sessions` screen design brief for Figma
