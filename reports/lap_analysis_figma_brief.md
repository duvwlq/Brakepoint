# Lap Analysis Figma Brief

## Summary

This brief defines how `Lap Analysis` should be designed in Figma for the next
Brakepoint product pass.

It should interpret:

- the current accepted telemetry behavior
- the `Brakepoint 2.0 IA Proposal`
- the `Brakepoint Design System Proposal`

The goal is not to invent a new workflow.
The goal is to present the current core workflow with clearer structure and a
brighter, calmer product language.

## Product Role

`Lap Analysis` is the main Brakepoint experience.

It should answer:

- `What happened in this lap?`

It is not:

- a dashboard
- a full session browser
- a graph-heavy expert workspace

## Core Reading Order

The page should read in this order:

1. context
2. lap line
3. current lap status
4. graphs
5. deeper comparison or advanced graph details

The user should understand the selected lap in under 5 seconds.

## Layout Direction

Use the existing Option B direction as the main frame.

```text
┌──────────────────────────────────────────────────────────────┐
│ Track / Car / Lap Context                                   │
├──────────────────────────────────────────────────────────────┤
│ Session Context │ Racing Line Canvas          │ Lap Info    │
├──────────────────────────────────────────────────────────────┤
│ Speed Graph                                                  │
│ Brake Graph                                                  │
│ Throttle Graph                                               │
└──────────────────────────────────────────────────────────────┘
```

## Frame Structure

### Top Context Bar

Should include:

- track
- layout
- car
- selected lap number
- lap time
- data mode or confidence summary when needed
- compact action area such as comparison toggle

Tone:

- summary first
- short labels
- no dense debug vocabulary by default

### Left Session Context Panel

Should include:

- opened-from-session context
- selected session summary
- compact session metadata
- quick path back to browsing if needed

This panel should support the analysis context, not retake ownership of the
whole browsing workflow.

### Center Racing Line Canvas

This is the visual center.

Rules:

- largest region on the page
- current lap clearly primary
- best-lap overlay secondary and optional
- no fake track surface
- no actual track boundary
- no minimap
- no corridor UI

If current-vs-best is shown:

- current lap remains strongest
- best lap remains guide-only
- overlay must not read like actual track geometry

### Right Lap Info Panel

Should include:

- selected lap inspector
- warnings or data-quality notes
- lap validity state
- compact current hover summary
- advanced graph availability summary if helpful

Rules:

- avoid dense stacked debug blocks
- use grouped stat cards
- use white-card substructure with clear spacing

### Bottom Core Graph Stack

Should include:

- Speed
- Brake
- Throttle

Rules:

- these remain supporting evidence
- they should still be easy to scan
- they should not become visually louder than the canvas

## Comparison Placement

`Current vs Best Minimal Overlay` should remain compact.

Recommended placement:

- top context bar
- or compact comparison card above the canvas

Rules:

- off by default if that preserves actual-lap-first reading
- unavailable state should feel calm
- comparison should not turn the page into a dual-lap dashboard

## Advanced Graph Placement

Advanced graph channels:

- Gear
- RPM
- Steering

Recommended treatment:

- compact collapsed drawer below the core graphs
- white-card section with low visual weight
- simple availability summary when collapsed

The drawer should never visually outrank the Racing Line Canvas.

## Fallback And Warning States

### No Coordinates

Use calm language.

Preferred structure:

- short title
- short sentence
- graphs remain visible

Example:

- `Coordinate data is unavailable. Showing graphs only.`

### Invalid Lap

Preferred behavior:

- visible but non-selectable in the lap list
- short reason
- no fatal error framing

### Comparison Unavailable

Examples:

- `Selected lap is already the best lap.`
- `Best lap comparison unavailable.`

### Missing Advanced Channel

Examples:

- `Gear unavailable`
- `RPM unavailable`
- `Steering unavailable`

## Tone Rules

This page should feel:

- calm
- focused
- trustworthy
- efficient

It should not feel:

- noisy
- gamified
- scary
- overloaded

## Figma Build Order

When designing this page in Figma, use this order:

1. foundation tokens
2. page shell
3. top context bar
4. canvas card
5. right lap info panel
6. core graph cards
7. comparison toggle and unavailable states
8. advanced graph drawer
9. fallback and warning states

## Required Variants

Create at least these screen states:

1. normal valid lap
2. valid lap with best-lap overlay enabled
3. best lap selected with comparison unavailable
4. no-coordinates fallback
5. invalid lap visible in lap list

## Explicit Non-Goals

Do not introduce at Figma brief level:

- Ghost replay
- delta timeline
- Loss Zone
- Coach
- AI
- minimap
- track boundary
- actual track surface
- track width UI
- graph-first expert page behavior

## Recommended Next Step

After this brief, the next design work should be:

1. create Brakepoint foundation tokens in Figma
2. create `Lap Analysis` page frames and variants
3. only then create `Sessions` or `Dashboard` screens
