# 03 UX Flow Spec

## 1. UX Principle

Brakepoint is not a graph-heavy telemetry dashboard first.
Brakepoint is a product that helps the user understand their driven lap first.

Phase 1 visual priority:

- Racing Line Canvas is the visual center
- Speed / Brake / Throttle graphs are supporting evidence
- warnings and fallback states should explain data quality without pretending the
  app is broken

## 2. Screen Structure

Phase 1 onboarding translation:

- Connect LMU Telemetry
- Select Session
- Analyse Lap
- Improve Later

Competitor onboarding reference:

- Track Titan Setup Guide
  `https://www.youtube.com/watch?v=EGtFmRucLPU`

What Brakepoint should learn from this pattern:

- onboarding should reduce setup uncertainty before deep analysis begins
- the user should understand the flow in a few steps, not through dense
  telemetry language
- the first meaningful action should be getting to a valid lap analysis state
- `Improve Later` can exist as future intent without pretending Phase 1 already
  includes coaching or setup automation

Product IA direction after Phase 1:

- Dashboard
- Sessions
- Lap Analysis
- Graph Analysis
- Settings

Rule:

- do not keep every workflow on one screen
- long recent-session history should move to `Sessions`
- `Lap Analysis` should focus on the currently selected session and lap
- graph-heavy expert reading can expand later without taking over the core
  analysis page

### 2.1 Home / Source Status

Show:

- app entry point
- LMU telemetry folder status
- folder-missing guidance
- route into session browsing

### 2.2 Session List

Show:

- Track
- Layout
- SessionType
- Car
- CarClass
- RecordingTime
- status: ready / error / partial

Rules:

- do not show an SVG track as source of truth
- do not show a track preview when coordinates are unavailable
- Phase 1.1-B1 may group sessions by track and layout in the renderer
- grouping must remain metadata-only and must not imply a track preview or map
- Phase 1.1-B2 may add lite filters for session status and session type
- B2 filters must stay renderer-local, compact, and non-invasive
- B2 filters must not expand into search, saved filters, or dashboard-style
  browsing controls

### 2.3 Session Detail

Show:

- session metadata
- lap list
- valid / invalid status
- best lap badge when available
- invalid reason

Invalid lap presentation rules:

- invalid laps remain visible in the lap list
- invalid laps remain non-selectable
- invalid laps should show a short reason such as `Lap time unavailable` or
  `Cannot analyse this lap`
- invalid styling should be clearly separate from valid or best-lap styling
- invalid presentation should explain data availability without sounding like a
  fatal app error

### 2.4 Lap Analysis

Top:

- Game / Track / Layout / Car / Lap / Data Mode badge

Center:

- Racing Line Canvas

Right:

- Lap list
- selected lap inspector
- warning stack

Bottom:

- Speed graph
- Brake graph
- Throttle graph

Recommended Phase 1 layout direction:

- Left: Source / Sessions
- Top: Current context bar
- Center: large Racing Line Canvas
- Right: lap inspector
- Bottom: full-width distance graphs

This layout is preferred because the user should understand the selected lap
line first, then use graphs as supporting evidence.

Lap Analysis page scope:

- Actual Lap Line
- lap list
- selected lap inspector
- warnings
- Speed / Brake / Throttle graphs
- hover sync

Lap Analysis should not try to own:

- full recent session browsing
- race records
- comparison-first workflow
- graph-heavy expert workspace

Phase 1.1-A1 for Lap Analysis:

- zoom
- pan
- fit-to-view control
- reset view

Deferred after A1:

- minimap or overview

Advanced or collapsible graph candidates after Phase 1:

- Gear
- RPM
- Steering

Phase 1.1-D1:

- Gear may be added as the first advanced graph channel
- Gear stays inside an advanced or collapsible graph area
- Speed / Brake / Throttle remain the default core graph set
- missing Gear data must not block lap loading or hide the core graphs
- when Gear is unavailable for a lap, show a compact non-blocking unavailable
  state instead of pretending the graph exists

Phase 1.1-D2:

- RPM may be added as the second advanced graph channel
- RPM stays inside the same advanced or collapsible graph area as Gear
- Gear behavior must remain unchanged
- missing RPM data must not block lap loading or hide the core graphs
- when only some advanced channels are available, the advanced section should
  keep visible availability messaging without increasing default density

Phase 1.1-D3:

- Steering may be added as the third advanced graph channel
- Steering stays inside the same advanced or collapsible graph area as Gear and RPM
- Speed / Brake / Throttle remain the default core graph set
- missing Steering data must not block lap loading or hide the core graphs
- Steering should use the same distance X-axis and hover sync rules as the
  other advanced graphs

Phase 2-A:

- `Current vs Best Minimal Overlay` stays inside the existing `Lap Analysis`
  screen
- current lap remains the primary subject
- best lap is a secondary visual aid only
- comparison uses the same-session best valid lap only
- comparison toggle remains compact and non-dominant
- comparison is off by default if that best preserves actual-lap-first reading
- best lap overlay must not read as actual track geometry or a replacement
  racing line
- distance remains the comparison sync basis
- comparison unavailable state should read like compact data availability, not a
  fatal error
- do not add Ghost, delta timeline, Loss Zone, Coach, replay controls, minimap,
  corridor UI, or track-geometry UI in this slice

Phase 1 boundary inside onboarding:

- Racing Line Canvas remains the visual center
- Speed / Brake / Throttle graphs remain supporting evidence
- do not add multi-game launcher UI here
- do not add rewards, points, leaderboard, AI coaching, or setup download
  entry points here

## 3. Racing Line Canvas

Requirements:

- the full lap line must fit inside the canvas
- use bounding-box-based fit-to-view
- preserve aspect ratio
- apply padding
- show hover point
- show selected distance tooltip or active summary
- canvas does not calculate telemetry; it only renders precomputed points
- Track Guide Style is allowed, but until telemetry or reference data is
  verified, do not draw actual track edge or track surface as fact
- in fallback mode, do not show fake track boundary or fake track surface
- `Path Lateral` / `Track Edge` remain research inputs for future corridor work
- future corridor rendering may use only `Estimated Telemetry Corridor` wording
- `Actual Track Boundary`, `Verified Track Edge`, and `Actual Track Width`
  wording remain forbidden until separate validation passes

Color and presentation:

- current racing line: clean teal or cyan guide line
- brake segments: tick or marker oriented, not full-line overlay
- throttle segments: subtle underlay or marker oriented
- hover point: strong active marker with primary accent
- low confidence line: deep indigo or clearly muted treatment
- Phase 1 canvas is an `Actual Lap Line` view, not an actual track map
- the teal line must read as the user's driven lap trace within 3 seconds
- the canvas must not visually imply actual track boundary, actual track
  surface, or actual track width
- if the line starts reading like a road band or track outline, the visual
  treatment is wrong

Guide-style markers:

- start marker
- direction arrow
- small distance tick or label
- stronger data mode badge
- compact legend aligned to the guide-style canvas

Phase 1.1-A1 canvas interaction rules:

- initial load still opens in fit-to-view
- user zoom and pan are applied on top of the base fit transform
- Fit recomputes the full lap bounds into view
- Reset returns to the initial fit-to-view state
- hover sync must remain distance-based after zoom or pan
- controls must stay hidden in `distance-graph-only` fallback mode

## 4. Graph UX

Shared rules:

- X-axis is distance
- hover cursor syncs with canvas
- graph labels and units must be explicit

Speed:

- reveal speed flow through the lap
- help explain entry and exit speed in corners

Brake:

- show where and how strongly brake input is applied

Throttle:

- show where and how strongly throttle is applied

## 5. Data Mode Badge

The user should understand the current data mode immediately.

Modes:

- `Actual Lap Line`: coordinate-based line is available
- `Distance Graph Only`: coordinates are unavailable, graphs only
- `Low Confidence Coordinates`: coordinates exist but confidence is low

## 6. Warning Banner

Warnings should not be overly alarming.
They should be action-oriented and data-specific.
They should read like data availability guidance, not fatal failure states.

Examples:

- `Coordinate data is unavailable. Showing graphs only.`
- `Brake data is unavailable for this lap.`
- `Coordinate confidence is low. Treat this line as approximate.`

## 7. Design Direction

Brakepoint should feel like a bright and trustworthy analysis app.

Theme:

- bright analysis application, not a racing game menu
- card-first hierarchy with wide spacing
- soft neutral background with clear white cards
- strong but limited accent usage
- telemetry line and graph colors stay semantic
- no glossy marketing gradients
- no childish saturation
- no fake track-surface presentation

Product reading order:

- the user should understand the selected lap in under 5 seconds
- the current thing to inspect should be visually obvious
- the Racing Line remains the visual center
- graphs remain supporting evidence
- status and warning text should feel calm, explicit, and trustworthy

Reference direction:

- light fintech-style clarity
- calm system status language
- rounded controls and cards
- large readable cards before dense debug detail
- keep telemetry trust and racing-analysis semantics, not general lifestyle-app styling

## 8. Color Tokens

```ts
background: '#F7F8FA'
backgroundStrong: '#EEF2F6'
panel: '#FFFFFF'
panelStrong: '#FFFFFF'
panelSoft: '#F9FBFD'
border: '#E5EAF0'
brandAccent: '#E60442'
actionPrimary: '#3182F6'
racingLine: '#19C7C0'
bestLapOverlay: '#8FB6FF'
brake: '#EB2622'
throttle: '#447FBC'
secondaryBlue: '#7FA8E8'
deepIndigo: '#6B7280'
softBlue: '#8B95A1'
textPrimary: '#191F28'
textSecondary: '#8B95A1'
```

Semantic usage:

- Brand accent `#E60442`: logo, best-lap emphasis, and limited product
  signature moments
- Action primary `#3182F6`: selected navigation state, active filter, toggle
  accent, compact CTA
- Teal or cyan: actual lap racing line only, not general app primary
- Brake red: brake telemetry only
- Throttle blue: throttle telemetry only
- Best-lap overlay blue: secondary comparison guide only
- Deep neutral gray: disabled, muted, low-confidence treatment
- Background should read as soft neutral app canvas, not paper-white and not
  black
- Panels should stay clearly separated from the page background through border,
  spacing, and elevation rather than dark contrast
- Warning banners should read as guidance cards, not error alarms

## 9. Future UX References

What not to copy from Track Titan onboarding:

- direct Track Titan visual layout or branded shell
- multi-game platform navigation in Phase 1
- rewards or achievement framing
- setup marketplace or setup auto-install onboarding
- AI coaching promise before the relevant later phases

Near-term implementation priority after Phase 1 freeze:

- visual QA
- fixture QA
- packaging

Phase 1.1 candidates:

- canvas zoom and pan
- fit and reset controls
- session categorization
- collapsible panels
- advanced graph channels

Phase 1.1-C1 collapsible panel rules:

- non-core panels may collapse to reduce density
- Racing Line Canvas and core graphs stay visible by default
- selected lap context must remain visible in compact form
- warning visibility must remain available through a compact count or label
- source missing and telemetry folder missing states must not be hidden behind collapse

Phase 1.1-B1 session categorization rules:

- group the session list by track display name
- subgroup by layout name when available
- preserve latest-first ordering inside each group
- preserve selected session and item-level error states
- do not add track preview, SVG map, or fake geometry

Phase 2:

- Current vs Best overlay
- graph-only comparison fallback

Phase 3:

- Ghost replay
- distance playhead

Phase 4:

- Focus Zone
- biggest loss area

Phase 5:

- rule-based Coach
- Top 1 action
- Top 3 improvements

Future UX ideas stay outside implementation until their data and phase gates are
validated.
