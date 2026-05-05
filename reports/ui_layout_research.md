# UI Layout Research

## Summary

Brakepoint Phase 1 is not a general telemetry dashboard. It is a `Single Lap
Racing Line Viewer` where the user should understand the selected lap within 5
seconds.

That means the layout must optimize for:

1. actual lap line recognition
2. distance-linked graph reading
3. obvious session and lap selection
4. clear warning and fallback states

Phase 1 should not optimize for:

- leaderboard
- rewards
- AI coaching
- setup marketplace
- multi-game dashboard shell
- comparison-first workflow

## Current Brakepoint UI Diagnosis

Current strengths:

- session list, lap list, canvas, graph, and summary are already present
- hover sync model is correct because `distance` is the shared sync axis
- the current screen already contains the right core ingredients for Phase 1

Current weaknesses:

- actual lap line is not visually dominant enough
- canvas can read like a track outline instead of a driven lap trace
- graph area becomes dense when its width is constrained
- session and lap selection still feel closer to a dev scaffold than a product UI
- primary red is too weak while teal risks becoming the perceived app primary
- long recent-session history competes with the current analysis target

## Reference Layout Observations

### Track Titan

Reference:

- [Track Titan dashboard](https://app.tracktitan.io/dashboard)
- [Track Titan home / how it works](https://www.tracktitan.io/)

Useful observations:

- onboarding and analysis entry are step-based and easy to scan
- active cards and decision states are visually obvious
- map or trace and graph relationships are presented as one analysis journey

Not for Phase 1:

- rewards
- achievements
- community shell
- multi-game dashboard framing

### SimTelemetry

Reference:

- [SimTelemetry](https://simtelemetry.site/)

Useful observations:

- telemetry reading is framed around map or trace plus graphs
- chart groups are visually distinct and readable
- graph width is treated as essential, not optional

Not for Phase 1:

- multi-lap comparison emphasis
- AI insight framing
- community overlays

### MyLMU

Reference:

- [MyLMU home](https://www.mylmu.app/)

Useful observations:

- LMU-specific workflow keeps telemetry context close to session context
- telemetry can live inside a larger analysis workspace if hierarchy is clear

### Graph-Heavy Telemetry Tools

Reference:

- [Z1 Dashboard telemetry analysis](https://paddock.z1racetech.com/manual/dashboardTelemetry.cfm)
- [Hotlap.ai](https://www.hotlap.ai/)

Useful observations:

- graph readability depends on width, contrast, and active cursor visibility
- graph-heavy tools become complex very quickly

Not for Phase 1:

- graph-dominant screen
- replay-heavy controls
- strategy and engineering-dense workspace as the default view

## What To Copy Conceptually

- central analysis workspace with one obvious primary artifact
- session and lap selection separated from telemetry reading area
- charts grouped in clear repeatable cards
- active cursor and hover state that are visually obvious
- top context bar that tells the user what track, car, session, and lap are loaded
- fallback and warning states presented as analysis states, not app crashes

## What Not To Copy

- actual-looking gray track surface without verified boundary data
- fake track outline or SVG track map
- leaderboard or community shell
- rewards, points, and achievements
- AI coach framing
- setup marketplace or setup download flow
- multi-game launcher or dashboard
- comparison-first layout before Best Lap comparison exists

## Phase 1 Layout Options

### Option A. Current Scaffold Improved

Structure:

- left session list
- center detail plus canvas plus summary
- right lap list plus graphs

Pros:

- lowest implementation cost
- fastest path to acceptance

Cons:

- graph column stays narrow
- canvas competes with metadata and summary vertically
- right side becomes dense quickly

### Option B. Analysis Workspace Layout

Structure:

- left source and session navigation
- top context bar
- center large racing line canvas
- right lap inspector
- bottom full-width graphs

Pros:

- best supports actual-lap-line-first reading
- graphs get enough width to stay readable without stealing focus
- hover sync becomes easier to perceive
- scales more naturally into later comparison layers

Cons:

- moderate layout rewrite cost compared with A

### Option C. Graph-Heavy Layout

Structure:

- large graphs
- smaller track or line area

Pros:

- strong for expert telemetry reading

Cons:

- wrong for the Phase 1 user goal
- weakens lap-trace-first understanding
- pushes Brakepoint toward MoTeC-like complexity too early

## Recommended Layout

### Recommendation: Option B. Analysis Workspace Layout

Recommended structure:

```text
Top Context Bar
Track / Car / Session / Lap / Data Mode

Left Navigation
Source / Sessions

Center
Large Racing Line Canvas

Right
Lap List / Selected Lap Inspector / Warning Stack

Bottom
Full-width Speed / Brake / Throttle Graphs
```

## Product IA Decision

Brakepoint should not keep every workflow on one screen.

Phase 1 may continue using a single analysis surface for acceptance, but the
product direction after Phase 1 should separate the app into focused pages:

- Dashboard
- Sessions
- Lap Analysis
- Graph Analysis
- Settings

Core decision:

- long recent-session history should move out of the main analysis screen
- Lap Analysis should focus on the currently selected session and lap
- full session browsing should belong to Sessions
- graph-heavy analysis should expand later without taking over Lap Analysis

## Page Separation Strategy

### Dashboard

Role:

- latest session shortcut
- telemetry source status
- recent track summary
- quick entry into analysis

Should not become:

- a telemetry leaderboard
- a multi-game launch shell
- a long scrolling session archive

### Sessions

Role:

- track-based browsing
- session search and filters
- recent history exploration
- session selection before analysis

Expected grouping direction:

- Track
- Layout
- SessionType
- Car and CarClass
- Recording time

This is the right place for large recent-session lists, not Lap Analysis.

### Lap Analysis

Role:

- Actual Lap Line
- lap inspector
- distance graphs
- hover sync
- warnings and fallback states

This page should answer one question quickly:

`How did I drive this selected lap?`

### Graph Analysis

Role:

- larger graph workspace
- advanced telemetry channels
- future graph-focused reading beyond the core Phase 1 view

This is the correct future home for channels such as:

- Gear
- RPM
- Steering
- future delta or expanded telemetry sets

### Settings

Role:

- LMU telemetry folder
- adapter and bridge status
- Python path or runtime status
- dev and fixture controls when needed

## Track-Based Session Browsing

Session browsing should move toward category-first navigation instead of a
single flat recent-history feed.

Preferred structure:

- Track group
- Layout subgroup
- filtered session list

Example direction:

- Sebring International Raceway
- Sebring School Circuit
- Fuji Speedway
- Monza
- Spa

This is an IA direction for post-freeze work. It is not required to close
Phase 1 acceptance.

## Lap Analysis Rules

Lap Analysis should remain narrow in scope.

It should prioritize:

- Actual lap line
- current lap context
- lap list
- selected lap inspector
- warnings
- Speed / Brake / Throttle graphs
- hover sync

It should not try to own:

- full session archive
- race records
- graph-heavy expert workspace
- future comparison systems

## Collapsible Panel Rules

Non-core information should be collapsible in a desktop layout.

Good candidates:

- left navigation density controls
- right inspector detail blocks
- warning details
- Dev JSON
- advanced graphs

Default behavior should still keep the core analysis visible without setup:

- canvas visible
- lap inspector visible
- core graphs visible
- Dev JSON collapsed

## Canvas Interaction Candidates

Canvas interaction improvements are valid product needs, but they should be
tracked as Phase 1.1 candidates rather than Phase 1 freeze requirements.

Candidates:

- zoom
- pan
- fit-to-view
- reset view
- minimap or overview

These are interaction-layer improvements to the existing Racing Line Viewer.
They do not change the telemetry-first rule or allow fake track geometry.

## Advanced Graph Channels

Phase 1 core graphs remain:

- Speed
- Brake
- Throttle

Advanced or collapsible channels can be defined for later work:

- Gear
- RPM
- Steering

Recommendation:

- keep Speed / Brake / Throttle in Lap Analysis by default
- treat Gear / RPM / Steering as advanced graphs
- allow Graph Analysis or collapsible panels to own these channels later

## Why

- it makes the actual lap line the first thing the user sees
- it preserves graph usefulness without making graphs the product center
- it makes hover sync easier to read because graphs can be wider
- it separates selection from analysis more cleanly
- it leaves room for later growth without violating Phase 1 simplicity

## Visual Hierarchy Rules

1. The user must recognize `this is my driven lap line` within 3 seconds.
2. The canvas must read as `Actual Lap Line`, not `track map`.
3. The active lap context must be visible from the top bar and selected states.
4. Graphs must be readable, but clearly secondary to the canvas.
5. Warnings and fallbacks must read as data states, not application failure.
6. Dev JSON must stay visually secondary and collapsed.

## Color Hierarchy Rules

- App primary: `#E60442`
  Use for selected session, selected lap, active cursor, active badge, app accent.
- Actual lap line: teal or cyan
  Use only for the driven telemetry line.
- Brake: `#EB2622`
  Use only for brake data emphasis and warning or danger where appropriate.
- Throttle: `#447FBC`
  Use for throttle data.
- Background: `#0B0F14`
- Panel: `#121821`
- Text primary: `#F6F7F7`

Important rule:

- teal is not the product primary
- teal is data color
- red primary is application state color

## Acceptance Impact

This research is not cosmetic-only. It affects acceptance directly.

Why:

- `AT-006 Racing Line Viewer` needs the racing line to be clearly legible
- `AT-007 Hover Sync` needs cursor relationships to be visually obvious
- manual QA becomes unreliable if the hierarchy is weak

## Phase 1 Scope Impact

This IA direction does not expand Phase 1 MVP scope.

For Phase 1 freeze:

- keep Single Lap Racing Line Viewer scope
- keep core graphs limited to Speed / Brake / Throttle
- keep the current analysis flow focused on one selected lap
- do not block freeze on full page-split implementation

For Phase 1.1 and later:

- zoom and pan controls
- session categorization improvements
- collapsible panel refinement
- advanced graph channels
- graph-focused workspace exploration

## What Must Stay Out Of MVP

- Best Lap comparison
- Ghost replay
- Coach
- Heatmap
- Race Records UI
- Estimated Telemetry Corridor UI
- Actual Track Boundary
- gray track surface
- multi-game dashboard shell
- setup marketplace
- rewards, leaderboard, or AI insight framing

## Next Implementation Proposal

1. finish Phase 1 acceptance on the current feature set
2. keep Lap Analysis focused on the selected session and lap
3. move long session browsing toward a dedicated Sessions page after freeze
4. carry zoom, pan, and collapsible-panel work as Phase 1.1 candidates
5. keep advanced graph channels out of default Phase 1 analysis
6. do not add any Phase 2 or Phase 3 concepts during the freeze pass

## Final Direction

Brakepoint should not chase telemetry dashboard aesthetics.
It should build a Phase 1 analysis workspace where:

- the selected lap is obvious
- the actual lap line is visually primary
- graphs are wide enough to support hover sync
- the screen never implies an actual track boundary that does not exist in
  validated telemetry
- page separation reduces clutter instead of turning Lap Analysis into a
  catch-all workspace
