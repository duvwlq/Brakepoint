# Harness Engineering Transition

## Summary

Brakepoint should now shift from product-feature and visual-polish work into
harness engineering.

This transition does not approve new telemetry features.
It exists to make the current product baseline easier to verify repeatedly.

Current state:

- Phase 1 core workflow is stable
- Phase 1.1 and Phase 1.2 visual/IA slices are documented
- bright UI visual passes have been applied
- fallback and warning tone has been polished
- release sanity and packaged spot-check documents already exist

The next useful work is not another feature.
The next useful work is repeatable proof that the app still behaves correctly
across normal, invalid, fallback, and packaged-app paths.

## Why Harness Engineering Now

Brakepoint now has enough UI and telemetry behavior that manual checking alone
is becoming inefficient.

The fragile areas are:

- telemetry folder state
- session discovery state
- invalid lap handling
- no-coordinate fallback
- corrupt `.duckdb` handling
- packaged app launch
- visual guardrails such as no fake track map and no actual track surface

These are not feature-development problems.
They are verification problems.

Harness engineering should make these paths cheap to run before any future
feature work resumes.

## Definition

For Brakepoint, harness engineering means:

- scripts that set up deterministic fixture modes
- smoke checks that assert expected app/API behavior
- packaged app launch verification
- documented visual QA checkpoints
- small test fixtures for known fallback states
- guardrail checks that prevent forbidden UI/feature drift

It does not mean:

- new product features
- dashboard expansion
- graph dashboard work
- Coach, Ghost, Delta, Heatmap, or AI
- fake telemetry generation
- fake track geometry

## Harness Layers

### Layer 1: Static Checks

Purpose:

- catch syntax or script-level regressions quickly

Current commands:

- `node --check renderer\app.js`
- `node --check renderer\racingLineCanvas.js`
- `node --check renderer\telemetryGraphs.js`
- `npm.cmd run typecheck`

Recommended improvement:

- keep this as the fastest preflight layer
- do not add browser or packaging work here

### Layer 2: Bridge And Python Data Harness

Purpose:

- prove that the app can discover telemetry and load normalized data without
  involving Electron UI

Current commands:

- `node scripts\bridge_smoke_test.js`
- `npm.cmd run python:validate`

Recommended improvement:

- add explicit fixture-mode assertions later, one fixture at a time
- keep adapter and API contracts stable

### Layer 3: Fixture State Harness

Purpose:

- verify known fallback and error states deterministically

Required fixture states:

| State | Expected Result |
| --- | --- |
| default LMU source | session discovery works when telemetry exists |
| empty telemetry folder | app shows empty state and does not crash |
| missing telemetry folder | app shows source unavailable state and does not crash |
| corrupt `.duckdb` | session item-level read issue, app does not crash |
| no coordinates | `distance-graph-only`, no fake track, graphs remain visible |
| invalid lap | visible but non-selectable, load blocked by `LAP_INVALID` |

Recommended improvement:

- create one command or script that runs fixture checks and prints a compact
  pass/fail matrix
- avoid screenshot automation until process-level fixture checks are stable

### Layer 4: Electron Launch Harness

Purpose:

- prove the desktop app starts and stays alive for expected scenarios

Current commands:

- `npm.cmd run electron`
- environment overrides for fixture paths or fixture modes

Recommended improvement:

- standardize a small Electron launch probe script
- keep it process-level first
- avoid UI automation until launch reliability is boring

### Layer 5: Packaged App Harness

Purpose:

- prove portable packaging still produces a launchable app

Current commands:

- `npm.cmd run package`
- `npm.cmd run pack:verify`

Recommended improvement:

- keep packaged launch verification in the release path
- only add deeper packaged visual QA after fixture launch probes are stable

### Layer 6: Human Visual Spot-Check

Purpose:

- confirm that the app reads correctly in a real window after automated checks

Existing document:

- `reports/packaged_app_spot_check.md`

Recommended improvement:

- update spot-check notes after each release-candidate visual pass
- treat minor wording/density issues as follow-up polish, not release blockers

## Guardrail Harness Targets

Harness work should protect these non-negotiable rules:

- no fake track map
- no actual gray track surface
- no actual track boundary UI
- no actual track width UI
- no minimap unless separately approved later
- no corridor UI
- no Ghost, Coach, Delta, Heatmap, or AI
- no new graph channel without a phase decision
- no invalid lap analysis fallback
- no UI dependency on raw game-specific telemetry field names

## First Harness Slice

Recommended first implementation slice:

### Harness H1: Fixture State Smoke Matrix

Scope:

- script-only
- no UI redesign
- no new feature behavior
- use existing fixture paths and fixture modes
- produce a compact pass/fail matrix

Include:

- default source availability probe
- empty telemetry folder probe
- missing telemetry folder probe
- corrupt `.duckdb` probe
- no-coordinate fixture probe
- invalid lap load-block probe if reachable through existing bridge/API path

Exclude:

- screenshot diffing
- Playwright or browser automation
- packaged app visual automation
- new fixtures that require telemetry generation changes
- new product UI

Acceptance:

- command exits non-zero on blocker failure
- command output is short enough to read in CI or terminal
- no fake data is generated
- existing `npm.cmd run build` remains unchanged until the harness proves stable

## Suggested Future Harness Slices

### H2: Electron Fixture Launch Probe

Goal:

- launch Electron with each known fixture state and verify process survival

Do not inspect UI yet.

### H3: Packaged Fixture Launch Probe

Goal:

- launch packaged app with fixture overrides after `npm.cmd run package`

Use only after H2 is stable.

### H4: Minimal Visual Evidence Capture

Goal:

- capture screenshots for a small fixed set of states

Use only after process-level fixture harnesses are stable.

### H5: Guardrail Text/DOM Probe

Goal:

- detect forbidden labels or UI surfaces such as Ghost, Coach, Heatmap, or
  fake track-related copy if a later UI automation layer exists

This is future work, not the first harness slice.

## Non-Goals

Do not use harness engineering as a back door to implement:

- Best Lap comparison expansion
- Loss Zone
- Coach
- Ghost
- Delta
- Heatmap
- AI
- minimap
- corridor UI
- actual track surface, boundary, or width
- graph-heavy dashboard behavior
- multi-game adapter support

## Relationship To Current Documents

Use these as inputs:

- `reports/release_sanity_pass.md`
- `reports/packaged_app_spot_check.md`
- `reports/phase1_manual_qa.md`
- `reports/layout_direction_next.md`

This document becomes the transition point between visual/product polish and
repeatable release verification.

## Recommended Next Step

Implement `Harness H1: Fixture State Smoke Matrix`.

Keep it small:

- one script
- one compact report output
- no Electron UI automation
- no product UI changes
- no feature expansion
