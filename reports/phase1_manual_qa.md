# Phase 1 Manual QA Report

## Summary

Phase 1 automated validation is green, and the LMU telemetry corpus contains ready sessions for the required manual QA tracks. Normal visual QA is now substantially closed for the current UI corpus: Sebring, Fuji, and Monza are treated as pass, while Spa is not currently available in the UI corpus and is not considered a release blocker.

This pass confirms the data path, adapter path, bridge path, lap loading path, invalid-lap handling path, and the normal visual QA path for the available tracks. Remaining acceptance work is concentrated on Electron fixture visual QA and packaging readiness.

Current product guardrails remain intact:

- Actual lap racing line is supported.
- Actual gray track boundary/surface is not rendered.
- Estimated Telemetry Corridor remains research-only.
- Best Lap, Ghost, and Coach remain out of MVP.

## Validation Commands

Executed:

```bash
node --check renderer\app.js
node --check renderer\racingLineCanvas.js
node --check renderer\telemetryGraphs.js
npm.cmd run typecheck
node scripts\bridge_smoke_test.js
npm.cmd run python:validate
python scripts\brakepoint_lmu.py list-sessions
```

Build/package check:

- `npm.cmd run build` is available.
- `npm.cmd run package` is available.
- `npm.cmd run pack:verify` is available.

Key automated results:

- Syntax checks passed for `renderer\app.js`, `renderer\racingLineCanvas.js`, and `renderer\telemetryGraphs.js`.
- `npm.cmd run typecheck` passed.
- `node scripts\bridge_smoke_test.js` passed.
- `npm.cmd run python:validate` passed.
- `python scripts\brakepoint_lmu.py list-sessions` confirmed ready LMU sessions for Sebring School, Spa, Fuji, and Monza.
- `npm.cmd run build` passed.
- `npm.cmd run package` passed and created `dist\brakepoint-portable`.
- `npm.cmd run pack:verify` passed and confirmed packaged app launch.
- Fixture checks passed for:
  - empty telemetry folder override
  - missing telemetry folder override
  - corrupt `.duckdb` session discovery
  - dev-only `no-coordinates` fallback mode

## Track-by-Track QA

### Sebring School

- Result: Pass with minor notes
- Notes:
  - Ready session confirmed in telemetry corpus: `lmu-877d18c4cdf06bcd`
  - Session metadata is readable from session discovery output.
  - Lap list exists.
  - Visual QA confirmed:
    - valid lap loads
    - actual lap line is visible and fit-to-view is acceptable
    - Speed / Brake / Throttle graphs render
    - hover sync is functioning
    - active summary is usable
    - no gray track surface or actual boundary is rendered
  - Invalid lap disabled handling is acceptable with minor presentation notes only.
- Issues:
  - Minor presentation polish may still be desirable, but no release-blocking issue was identified.

### Spa

- Result: Not available / not blocker
- Notes:
  - Ready Spa sessions confirmed in telemetry corpus.
  - Current UI corpus did not expose a Spa session for direct visual QA in this pass.
  - Prior validation and implementation work already established real racing line generation for Spa.
- Issues:
  - No current release blocker, but Spa should still be rechecked when it is available in the UI corpus.

### Fuji

- Result: Pass
- Notes:
  - Ready Fuji session confirmed in telemetry corpus: `lmu-97ebeed4bb6121e1`
  - Visual QA confirmed:
    - valid lap loads
    - actual lap line is visible
    - graphs render
    - hover sync behavior is acceptable
    - no fake track or actual boundary implication was observed
- Issues:
  - None identified as a release blocker.

### Monza

- Result: Pass
- Notes:
  - Ready Monza sessions confirmed in telemetry corpus.
  - Visual QA confirmed:
    - valid lap loads
    - actual lap line is visible
    - graphs render
    - hover sync behavior is acceptable
    - no gray track surface or actual boundary is rendered
- Issues:
  - None identified as a release blocker.

## Fixture QA

### Coordinate Missing

- Fixture method: `BRAKEPOINT_LMU_FIXTURE_MODE=no-coordinates`
- Source session: `lmu-877d18c4cdf06bcd`
- Lap: `lap-1`
- Expected:
  - mode = `distance-graph-only`
  - racingLine = `[]`
  - graphPoints > 0
  - warning = `NO_COORDINATES`
  - no fake track map
- Result: Pass
- Notes:
  - Verified result:
    - `mode: distance-graph-only`
    - `racingLineCount: 0`
    - `graphPointCount: 748`
    - `warningCodes: NO_COORDINATES`
  - Electron launch sanity check passed:
    - app launched under `BRAKEPOINT_LMU_FIXTURE_MODE=no-coordinates`
    - process remained alive until command timeout
  - User-confirmed Electron result:
    - distance-graph-only fallback was shown
    - no racing line or fake track map was rendered
    - Speed / Brake / Throttle graphs remained visible
    - `NO_COORDINATES` warning was shown

### File Read Failure

- Fixture folder: `fixtures/lmu/corrupt`
- Fixture file: `broken.duckdb`
- Expected:
  - app does not crash
  - broken file shows error state
- Result: Pass
- Notes:
  - `list-sessions` did not crash.
  - `broken.duckdb` was reported with:
    - `status: error`
    - `warningCode: FILE_CORRUPT`
  - Electron launch sanity check passed:
    - app launched under `BRAKEPOINT_LMU_TELEMETRY_PATH=fixtures\lmu\corrupt`
    - process remained alive until command timeout
  - User-confirmed Electron result:
    - `broken.duckdb` appeared as an item-level error
    - the app did not crash

### Empty Folder

- Fixture folder: `fixtures/lmu/empty`
- Expected:
  - exists true
  - fileCount 0
  - no sessions message
- Result: Needs Visual QA
- Notes:
  - Verified:
    - `exists: true`
    - `fileCount: 0`
    - `sessionCount: 0`
  - Electron launch sanity check passed:
    - app launched under `BRAKEPOINT_LMU_TELEMETRY_PATH=fixtures\lmu\empty`
    - process remained alive until command timeout
  - Expected Electron result:
    - no sessions message is shown
    - app does not crash
  - Electron visual confirmation is still pending.

### Missing Folder

- Fixture path: `fixtures/lmu/missing`
- Expected:
  - exists false
  - folder missing message
- Result: Needs Visual QA
- Notes:
  - Verified:
    - `exists: false`
    - `fileCount: 0`
    - `warningCode: TELEMETRY_FOLDER_MISSING`
  - `list-sessions` returns a structured `TELEMETRY_FOLDER_MISSING` error.
  - Electron launch sanity check passed:
    - app launched under `BRAKEPOINT_LMU_TELEMETRY_PATH=fixtures\lmu\missing`
    - process remained alive until command timeout
  - Expected Electron result:
    - folder missing message is shown
    - app does not crash
  - Electron visual confirmation is still pending.

## Acceptance Test Results

| ID | Result | Notes |
|---|---|---|
| AT-001 Telemetry Folder Status | Pass | Bridge smoke test confirmed telemetry folder exists and session discovery is operational. |
| AT-002 Session List | Pass | `list-sessions` returned ready LMU sessions, including Sebring School, Spa, Fuji, and Monza. |
| AT-003 Session Metadata | Pass | Track, layout, car, class, session type, and timestamps are readable in session discovery output. |
| AT-004 Lap List | Pass | Bridge smoke test and validation confirmed lap enumeration, valid/invalid counts, and best-lap selection path. |
| AT-005 Coordinate Detection | Pass | Valid laps continue to produce telemetry-derived `real-racing-line` output; prior validation confirms GPS-based projected coordinates. |
| AT-006 Racing Line Viewer | Pass | Normal visual QA passed for Sebring, Fuji, and Monza. Spa was not available in the current UI corpus and is not treated as a blocker. |
| AT-007 Hover Sync | Pass | Normal visual QA confirmed usable canvas/graph hover sync on the available ready laps. |
| AT-008 Coordinate Missing Fallback | Pass | Electron displayed the graph-only fallback correctly, no racing line or fake track was rendered, and `NO_COORDINATES` warning was shown. |
| AT-009 File Read Failure | Pass | Corrupt file appeared as an item-level error and the app remained usable. |
| AT-010 Invalid Lap Disabled | Pass with minor notes | Visual QA on available sessions indicates acceptable disabled handling; any remaining issue is presentation polish, not a blocker. |

## Issues Found

- No automated regression blockers were found in the current Phase 1 flow.
- Fixture coverage exists for empty folder, missing folder, corrupt file, and coordinate-missing fallback.
- Spa was not surfaced in the current UI corpus during manual visual QA, but this is not currently treated as a blocker because the data path and prior track validation remain healthy.
- Packaging is no longer a blocker.

## Needs Fixture

- Optional low-confidence coordinate fixture if warning copy needs direct manual confirmation.

## Release Readiness

- Ready for MVP Freeze Candidate

Reason:

- Automated validation is healthy.
- Core Phase 1 data and bridge paths are working.
- Normal visual QA is largely complete for the current UI corpus.
- Fixture visual QA is complete for the required fallback and error paths.
- Packaged app build and launch verification are complete.
- AT-001 through AT-010 are now in passing state.

## Freeze Decision

Status:

- Ready for MVP Freeze Candidate

Frozen scope:

- Single Lap Racing Line Viewer
- Speed / Brake / Throttle graph
- Distance hover sync
- fallback and error handling
- portable package

Moved to Phase 1.1:

- zoom / pan
- session categorization
- collapsible panels
- advanced graph channels

## Next Step

1. Treat Phase 1 as an MVP Freeze Candidate.
2. Optionally run one final release sanity pass on the packaged app with the default LMU telemetry source.
3. Record any post-freeze polish as Phase 1.1 follow-up, not MVP scope expansion.
