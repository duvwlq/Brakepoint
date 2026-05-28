# Packaged App Human Spot-Check

## Purpose

This is the final short human spot-check after:

- automated validation
- build
- package
- packaged app launch verification

It exists to confirm that the packaged app still reads like a usable Brakepoint
release candidate in a real window, not just as a successful process launch.

This checklist is intentionally short.

It is not a new feature review.
It is a final packaged-app sanity confirmation.

## Preconditions

Before running this checklist, confirm:

- `npm.cmd run package` passed
- `npm.cmd run pack:verify` passed
- the packaged app can launch
- an LMU telemetry sample or a real LMU telemetry folder is accessible

Packaged app path:

- `dist\brakepoint-portable\Brakepoint.exe`

## Normal Session Checklist

Run:

1. Launch `dist\brakepoint-portable\Brakepoint.exe`
2. Open the app with the default LMU telemetry source

Record results:

| ID | Check | Pass / Fail / Notes |
| --- | --- | --- |
| N-01 | App window opens and does not show a black screen |  |
| N-02 | Telemetry folder status is visible |  |
| N-03 | Session list is visible |  |
| N-04 | At least one `ready` session is visible |  |
| N-05 | Selecting a ready session works |  |
| N-06 | Session metadata is visible |  |
| N-07 | Lap list is visible |  |
| N-08 | A valid lap can be selected |  |
| N-09 | Invalid lap is visible but non-selectable |  |
| N-10 | Racing Line Canvas is visible |  |
| N-11 | Speed / Brake / Throttle core graphs are visible |  |
| N-12 | Hover sync works between canvas and graphs |  |
| N-13 | Advanced Graphs drawer can open |  |
| N-14 | Gear / RPM / Steering appear only in the advanced section |  |
| N-15 | Advanced graph available / unavailable state reads compactly |  |
| N-16 | Advanced graphs do not visually overpower the core graphs |  |

## Fallback / Error Checklist

Use the same packaged app and, where needed, launch it against the prepared
fixture paths.

Record results:

| ID | Check | Pass / Fail / Notes |
| --- | --- | --- |
| F-01 | Empty telemetry folder shows an empty-state message without crash |  |
| F-02 | Missing telemetry folder shows a missing-source message without crash |  |
| F-03 | Corrupt `.duckdb` appears as an item-level error without app crash |  |
| F-04 | `no-coordinates` fixture shows graph-only fallback |  |
| F-05 | `no-coordinates` fixture does not render a fake racing line or fake track map |  |
| F-06 | Invalid lap load remains blocked |  |

Fixture reminder:

- empty folder
- missing folder
- corrupt `.duckdb`
- `BRAKEPOINT_LMU_FIXTURE_MODE=no-coordinates`

## Guardrail Checklist

These are blocker-sensitive visual guardrails.

Record results:

| ID | Check | Pass / Fail / Notes |
| --- | --- | --- |
| G-01 | No fake track map is shown |  |
| G-02 | No actual gray track surface is shown |  |
| G-03 | No actual track boundary UI is shown |  |
| G-04 | No actual track width UI is shown |  |
| G-05 | No minimap is shown |  |
| G-06 | No Best Lap comparison UI is shown |  |
| G-07 | No Ghost / Coach / Delta / Heatmap / AI UI is shown |  |

## Pass / Fail Recording Rule

Use:

- `Pass`
- `Fail`
- `Notes`

Decision handling:

- if a blocker is found, hold the release candidate decision
- if only small wording or density issues are found, keep RC possible and log
  them as follow-up polish notes

Examples of blockers:

- app crash
- packaged app black screen
- missing core graph area
- missing session or lap workflow
- fake track implication
- package launch failure

Examples of non-blocking follow-up notes:

- minor wording improvement
- small spacing or density polish
- compact-state tone adjustment

## Recommended Decision

Use this rule:

- if all blocker-sensitive items pass, the build can be treated as a Release
  Candidate
- if only minor wording or density issues remain, RC is still acceptable as
  long as the notes are recorded as follow-up polish
- if crash, package launch failure, missing core graph path, or fake track
  implication is found, hold RC and fix the blocker first
