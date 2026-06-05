# Layout Direction Next

## Summary

This report records a later-phase layout direction for Brakepoint after the
Phase 1 and Phase 1.1 closeout baseline.

It does not reopen Phase 1 or Phase 1.1 scope.

Its purpose is to capture a clear IA and layout direction for future planning
before implementation work begins.

## Why This Direction Exists

The current Lap Analysis workspace is now stable and usable:

- actual lap line remains visually primary
- core Speed / Brake / Throttle graphs remain readable
- advanced graphs remain secondary
- fallback and warning states are stable

The next structural question is no longer about adding telemetry features.
It is about whether Brakepoint should move from a single analysis-heavy surface
toward a clearer multi-page desktop information architecture.

The proposed direction is:

- left global navigation
- top context and lightweight filter bar
- wide central workspace
- page-specific content instead of one screen owning every workflow

## Reference Interpretation

The reference layout direction is useful for structure, not for feature scope.

Useful structural ideas:

- fixed global navigation on the left
- strong current-page highlight
- top bar with compact filters and current context
- wide data workspace that does not feel cramped
- dense information shown as tables or lists when browsing is the primary task

What should not be copied:

- leaderboard framing
- setup marketplace framing
- multi-feature shell that implies gameplay, rewards, or community systems
- non-Brakepoint product categories that do not belong to telemetry analysis

## Proposed Future IA

Recommended page-level IA after the current closeout baseline:

- Dashboard
- Sessions
- Lap Analysis
- Graph Analysis
- Settings

### Dashboard

Role:

- telemetry source status
- recent session shortcuts
- quick entry into analysis

Must not become:

- leaderboard
- multi-game launcher
- reward shell

### Sessions

Role:

- broad browsing workspace
- track and layout first navigation
- recent session history
- compact metadata and filter controls

Preferred structure:

- left global nav stays fixed
- top context bar shows current browsing scope
- center content becomes a table or grouped list view

### Lap Analysis

Role:

- current selected session and lap
- Racing Line Canvas as the visual center
- core Speed / Brake / Throttle graphs
- advanced graph drawer
- warnings and fallback states

This page should remain analysis-first, not browsing-first.

### Graph Analysis

Role:

- larger graph workspace
- advanced channels in a graph-focused reading mode
- future deeper telemetry reading without taking over Lap Analysis

### Settings

Role:

- LMU telemetry folder and environment status
- adapter and runtime status
- fixture and debug controls where appropriate

## Proposed Layout Pattern

Recommended desktop pattern:

```text
Left Global Navigation
Top Context / Filter Bar
Wide Main Workspace
```

Translated into Brakepoint:

### Sessions Page

- Left: global nav
- Top: track scope, recent/fastest or similar light filters when justified
- Main: grouped session table or grouped session list

### Lap Analysis Page

- Left: global nav
- Top: current track / layout / lap / data mode context
- Main center: Racing Line Canvas
- Right: lap inspector
- Bottom: core graphs

### Graph Analysis Page

- Left: global nav
- Top: current lap context and graph controls
- Main: graph workspace

## What This Direction Solves

- separates browsing from analysis
- gives Sessions room to be table or list oriented without shrinking the canvas
- keeps Lap Analysis focused on `How did I drive this lap?`
- creates a natural home for later graph-focused work without turning the main
  analysis screen into a telemetry control room
- gives desktop navigation a clearer product-level structure

## What This Direction Does Not Authorize

This report does not authorize immediate implementation of:

- Dashboard page
- Graph Analysis page
- large navigation shell rewrite
- search and saved-filter systems
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

Those remain separate scope decisions.

## Scope Classification

Current classification:

- not Phase 1
- not Phase 1.1
- later-phase IA proposal

Interpretation:

- document now
- plan later
- implement only through a new phase-gate decision

## Guardrails

Keep these rules even if the future layout changes:

- Racing Line Canvas remains the visual center of Lap Analysis
- core graph set remains Speed / Brake / Throttle unless a new scope decision is
  made
- advanced telemetry stays secondary to the current lap understanding task
- do not imply actual track geometry without validated data
- do not let browsing IA quietly turn into comparison or coaching scope

## Recommended Next Step

Do not implement this layout rewrite inside the current closeout scope.

If revisited later:

1. decide whether this belongs to Phase 1.2 or a later named phase
2. define page boundaries before visual implementation
3. start with `Sessions split first`
4. keep `Lap Analysis` as unchanged as possible during that first slice
5. only then prototype the broader global navigation shell

## Safest First Slice

If this direction is reopened for implementation, the safest first slice is:

- split `Sessions` into its own workspace first
- preserve the current Lap Analysis behavior and hierarchy
- avoid opening `Graph Analysis` at the same time
- treat global navigation as a minimal support shell, not as the main feature

This keeps the IA change narrow and reduces the chance that layout work turns
into a broad feature rewrite.

## Related References

- `reports/brakepoint_2_0_ia.md`
- `reports/brakepoint_design_system.md`
- `reports/lap_analysis_figma_brief.md`

## Implementation Note: Lap Analysis Visual Slice

The first implementation slice after the design-system documentation should
stay visual-only.

Approved shape:

- keep the existing `Lap Analysis` behavior
- keep Racing Line Canvas as the center of the page
- keep Speed / Brake / Throttle as the core graph row
- keep Gear / RPM / Steering inside the advanced graph section
- place advanced graphs after the core graph row so they remain secondary
- use brighter card surfaces, softer shadows, and calmer spacing

Not approved in this slice:

- new telemetry channels
- new comparison analysis
- Graph Analysis page implementation
- Dashboard implementation
- minimap
- corridor UI
- actual track boundary, gray surface, or track width UI
- Ghost, Coach, Delta, Heatmap, or AI

## Implementation Note: Sessions Visual Slice

The next implementation slice may improve the existing `Sessions` page visual
hierarchy without changing browsing behavior.

Approved shape:

- keep existing session discovery and grouping behavior
- keep existing lightweight filters only
- make the summary, filters, track groups, and rows read as one browsing
  workspace
- use brighter cards, subtle grouping containers, and clearer selected-row
  emphasis
- keep the path into `Lap Analysis` unchanged

Not approved in this slice:

- search
- saved filters
- new sort modes
- pagination
- Dashboard implementation
- Graph Analysis implementation
- session quality scoring
- Best Lap comparison expansion
- Ghost, Coach, Delta, Heatmap, or AI

## Implementation Note: App Shell Visual Slice

The app shell may be visually polished only as support for the already split
`Sessions` and `Lap Analysis` surfaces.

Approved shape:

- keep the existing two-page navigation behavior
- keep source status visible in the left shell
- keep sidebar collapse behavior unchanged
- make the brand, source card, nav links, and topbar feel like one bright
  product shell
- use `brandAccent` for identity and `actionPrimary` for navigation state

Not approved in this slice:

- adding Dashboard as an implemented page
- adding Graph Analysis as an implemented page
- adding Settings as an implemented page
- new navigation destinations without a separate scope decision
- changing source detection behavior
- hiding critical source missing states behind collapsed UI
- comparison, coach, replay, minimap, corridor, or track geometry features
