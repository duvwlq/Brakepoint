# 05 Research Notes

## 1. Research Principle

Brakepoint는 아이디어를 telemetry 데이터로 검증한 뒤 구현한다.
웹 자료는 참고 근거이고, 실제 구현 기준은 probe 결과다.

## 2. LMU Telemetry Research

확인된 방향:

- LMU는 `.duckdb` telemetry recording을 지원한다.
- channel/event recording은 설정에 따라 달라질 수 있다.
- 파일 기반 post-session 분석이 Phase 1에 적합하다.

조사 필요:

- 자동 기록과 수동 기록의 차이
- `.wal` 또는 incomplete recording 처리
- session 종료 전 파일 완성 여부
- DLC/업데이트에 따른 metadata 차이

## 3. DuckDB Probe Findings

샘플 15개 파일 기준 공통 구조:

- `metadata`
- `channelsList`
- `eventsList`
- 약 100개 내외 channel/event table
- channel table: `value`
- event table: `ts`, `value`

핵심 채널:

- `GPS Latitude`
- `GPS Longitude`
- `GPS Speed`
- `Lap Dist`
- `Total Dist`
- `Ground Speed`
- `Engine RPM`
- `Brake Pos`
- `Throttle Pos`
- `Steering Pos`
- `Path Lateral`
- `Track Edge`

핵심 이벤트:

- `Lap`
- `Lap Time`
- `Current LapTime`
- `In Pits`
- `Gear`

현재 판단:

- Phase 1 Single Lap Racing Line Viewer는 구현 가능
- Phase 2/3은 distance/time alignment 세부 검증 후 진행

## 3.1 Phase 1 Adapter Prototype Notes

`lmuDuckdbAdapter` prototype 검증에서 확인된 내용:

- Sebring / Fuji / Spa / Monza 샘플에서 selected valid lap의 `RacingLineViewData` 생성 가능
- `Lap Dist` reset으로 lap-local segment를 자를 수 있음
- Fuji 샘플에서 lap 내부 `Lap Dist`가 몇 m 단위로 작게 감소하는 노이즈가 확인됨
- Phase 1 prototype은 graph/canvas sync를 위해 lap-local distance를 누적 최대값으로 정리한다
- 고주파 채널(`Ground Speed` 100Hz, `Brake Pos`/`Throttle Pos` 50Hz)은 Phase 1 prototype에서 distance segment 비율 기반으로 단순 정렬한다

Known limitation:

- channel별 명시 timestamp가 없으므로 Phase 1 prototype의 channel alignment는 정밀 분석용이 아니라 racing line viewer 검증용이다.
- Best Lap comparison, Ghost, Coach로 넘어가기 전에는 보간/정렬 전략을 별도로 고도화해야 한다.

## 3.2 RacingLineViewData Validation Pass

2026-05-04 validation pass added a batch `validate` command to the LMU
DuckDB adapter CLI.

Command examples:

- `python scripts\brakepoint_lmu.py validate`
- `python scripts\brakepoint_lmu.py validate --limit 4`
- `python scripts\brakepoint_lmu.py validate --json`
- `python scripts\brakepoint_lmu.py validate --output reports\lmu_validation_report.json`

Validated report fields:

- session metadata summary
- lap count / valid lap count / invalid lap count
- best lap id / best lap time
- core channel availability
- lap mode: `real-racing-line` or `distance-graph-only`
- point count / graph point count
- min/max `distanceM`
- monotonic distance status
- raw distance backsteps
- repaired distance backsteps
- distance repair strategy
- coordinate bounding box
- coordinate confidence
- channel coverage
- warning / error code

Initial validation result:

- 4 recent LMU sessions scanned.
- 4 sessions were ready.
- 32 laps found.
- 28 valid laps found.
- 28 valid laps produced `real-racing-line`.
- 0 laps fell back to `distance-graph-only` in the first validation sample.
- 0 `MISSING_DISTANCE` laps in the first validation sample.

Multi-track spot check:

- Spa race sample: 8 valid laps, `real-racing-line`, first valid lap 1585 points,
  max distance 6978.1m, bbox 1267x2016, raw/fixed backsteps 0/0.
- Fuji race sample: 12 valid laps, `real-racing-line`, first valid lap 1385
  points, max distance 4530.4m, bbox 1292x1266, raw/fixed backsteps 51/51.
- Monza race sample: 3 valid laps, `real-racing-line`, first valid lap 1246
  points, max distance 5776.1m, bbox 1256x2154, raw/fixed backsteps 0/0.
- Sebring School sample appears in latest-session validation: 7 valid laps,
  `real-racing-line`, first valid lap 748 points, max distance 3081.0m,
  bbox 1132x566, raw/fixed backsteps 0/0.

Data quality note:

- Some LMU `Lap Dist` samples can move backwards by a few meters inside a lap.
- Phase 1 prototype uses `cumulative-max` distance repair for graph/canvas sync.
- Validation reports now separate `rawDistanceBacksteps`,
  `repairedDistanceBacksteps`, `remainingBacksteps`, and
  `distanceRepairStrategy`.
- This is acceptable for Phase 1 single-lap visualization, but Best Lap,
  Ghost, Coach, and delta analysis still require a stricter interpolation
  strategy before implementation.

## 3.3 Electron-Python Bridge Smoke Test

2026-05-04 bridge pass added a minimal Electron Main compatible bridge that
calls the validated Python LMU adapter through `child_process`.

Bridge path:

```text
Renderer
  -> preload `window.brakepointApi`
  -> Electron Main IPC
  -> BrakepointApiService
  -> PythonBridgeService
  -> scripts/brakepoint_lmu.py
  -> ApiResult JSON
```

Implemented Phase 1 bridge API:

- `getTelemetryFolderStatus()`
- `listSessions()`
- `loadSession(sessionId)`
- `loadLapRacingLine(sessionId, lapId)`

Smoke test result:

- folder status: telemetry folder exists, 89 `.duckdb` files
- session list: 89 sessions
- session detail: first ready session has 8 laps, 7 valid laps, best lap `lap-7`
- lap load: `real-racing-line`, 748 racing line points, 748 graph points

Bridge constraints:

- Python stdout must remain JSON only.
- Python stderr is treated as debug/error detail.
- Main process converts Python failure, timeout, and JSON parse failure into
  `ApiResult` errors.
- Renderer receives canonical API results only and does not know DuckDB
  table/channel names.

Known limitation:

- Development bridge uses system Python or project-local `.venv`.
- Packaged desktop builds still need an explicit Python runtime strategy.

## 4. Coordinate Research

우선 사용 후보:

- `GPS Latitude`
- `GPS Longitude`

주의:

- 좌표값이 실제 지구 GPS인지 game-projected coordinate인지는 확정하지 않는다.
- UI에서는 “Real Racing Line (Telemetry Coordinates)”처럼 표현하고 공식 지도 좌표처럼 말하지 않는다.
- 좌표가 없으면 graph-only fallback으로 간다.

## 5. Multi-Track Research

원칙:

- MVP는 Single Lap Viewer지만 Single Track Viewer가 아니다.
- 좌표가 있는 모든 LMU track/layout은 hardcoded track map 없이 표시되어야 한다.

검증 sample:

- Spa
- Fuji
- Sebring School
- Monza

추가 권장 sample:

- Circuit de la Sarthe
- Bahrain
- Portimão
- DLC track 1개 이상

## 6. Competitor Research: Track Titan

참고할 점:

- 복잡한 telemetry보다 사용자가 잃은 시간을 먼저 보여준다.
- distance marker는 graph 이해에 중요하다.
- Focus Zone은 Phase 4 이후에 유용하다.
- Coach Flow는 Phase 5 방향으로 적합하다.
- setup guide reference: Track Titan Setup Guide video
  `https://www.youtube.com/watch?v=EGtFmRucLPU`
- onboarding framing on Track Titan side is closer to setup / drive / insights /
  improve than to a raw telemetry file browser
- Track Titan product messaging also emphasizes drive / analyse / learn and
  easy setup, while the broader platform includes AI coaching, setups, rewards,
  news, and multi-game expansion

복제하지 않을 것:

- Track Titan UI/브랜딩 직접 복제
- MVP에서 coach flow 구현
- MVP에서 segment 자동 분석 구현
- rewards, points, leaderboard, or achievement onboarding
- AI coaching promises in Phase 1
- setup download or auto-install flow
- multi-game launcher style onboarding in Phase 1

Brakepoint 변환:

- Track Titan의 “Drive -> Analyse -> Learn”을 Phase 1에서는 “Load Session -> Select Lap -> See Line -> Understand Inputs”로 변환한다.

Brakepoint onboarding translation:

- Connect LMU Telemetry
- Select Session
- Analyse Lap
- Improve Later

What Brakepoint should learn:

- first-run onboarding should reduce uncertainty before showing analysis UI
- the user should understand the product flow in a few steps, not by reading a
  long technical explanation
- setup friction matters: Brakepoint should make telemetry folder readiness,
  session readiness, and valid lap selection obvious
- “improve” messaging should point to later workflow value without pretending
  Phase 1 already has coaching

What Brakepoint should not copy:

- a direct Track Titan-style product shell with multi-game, rewards, academy,
  setup marketplace, or news surfaces
- any onboarding that implies Brakepoint already provides AI coaching or setup
  distribution
- any UI that visually demotes the Racing Line Canvas under marketing cards or
  gamified progress elements

Phase 1 competitor takeaway:

- Brakepoint can borrow the clarity of a guided onboarding sequence
- Brakepoint must translate that sequence into a narrower LMU-only Phase 1 flow
- Racing Line Canvas remains the visual center
- Speed / Brake / Throttle graph remain supporting evidence
- distance hover sync remains the next implementation priority inside this flow

## 7. Car / Session / Race Context Research

조사 필요:

- CarName / CarClass 위치
- SessionType 위치
- Race result 존재 여부
- overall position / class position 존재 여부
- Daily/Weekly/Special event metadata 존재 여부
- 차량별 channel 차이
- hybrid/regen/fuel/tyre channel 존재 여부

정책:

- 공식 차량 목록은 reference catalog일 뿐 source of truth가 아니다.
- 실제 source of truth는 telemetry metadata와 probe 결과다.
- 다른 차량/다른 클래스 비교는 기본 차단 또는 warning 대상이다.

## 8. Multi-Game Research

장기 후보:

- F1 25: UDP stream
- Assetto Corsa: shared memory
- ACC: shared memory/API 조사 필요
- iRacing: SDK/memory/log 조사 필요

현재 정책:

- Phase 7 전 구현 금지
- 모든 게임은 Game Adapter를 통해 canonical model로 변환
- live telemetry는 raw stream을 직접 UI에 연결하지 않고 normalized session store로 저장한 뒤 분석

## 9. Design Research

Brakepoint 디자인은 LMU inspired, not LMU branded다.

색상 토큰:

- background `#0B0F14`
- panel `#121821`
- primary `#E60442`
- brake `#EB2622`
- throttle `#447FBC`
- deepIndigo `#424B78`
- softBlue `#91B4D4`
- textPrimary `#F6F7F7`

## 10. Open Questions

- Practice session에서 lap boundary와 lap time mismatch를 어떻게 처리할 것인가?
- GPS coordinate를 lap-local coordinate로 정규화할 때 projection 방식은 무엇이 가장 안정적인가?
- 좌표 sampling rate 10Hz가 line rendering에 충분한가?
- Speed/Brake/Throttle과 GPS/Lap Dist frequency 차이를 Phase 1에서 어느 수준까지 보간할 것인가?
- Race result 데이터가 실제 DuckDB에 존재하는가?
- 차량별 channel 차이가 Phase 1 graph에 영향을 주는가?

## 11. Next Research Tasks

1. Phase 1 대상 DuckDB file 3~5개로 lap extraction 세부 검증
2. GPS coordinate projection/fit-to-view 실험
3. `RacingLineViewData` 생성 prototype
4. 좌표 없는 file이 있는지 확인
5. Race result metadata 존재 여부 추가 probe

## 12. Track Corridor Probe

Probe command:

- `python scripts\brakepoint_lmu.py track-corridor-probe --limit 5`
- `python scripts\brakepoint_lmu.py track-corridor-probe --limit 10 --output reports\track_corridor_probe.json`

Sample result snapshot:

- 5-session preview: 30 valid laps scanned
- 10-session report: 53 valid laps scanned
- confirmed multi-track sample: Sebring School, Spa, Fuji, Monza

Path Lateral probe result:

- `Path Lateral` exists across the scanned LMU sessions and valid laps in the current sample.
- sample counts aligned closely with lap-local `Lap Dist` sample counts after the existing lap slicing strategy.
- values repeatedly cross both negative and positive ranges on Sebring / Spa / Fuji / Monza.
- current interpretation: likely lateral offset relative to some path or center reference.
- current confidence: medium for estimated in-track placement, not enough for verified left/right boundary semantics.
- allowed wording: estimated in-track placement signal / Estimated Telemetry Corridor
- forbidden wording before separate verification: Actual Track Boundary / Actual Track Width

Track Edge probe result:

- `Track Edge` also exists across the scanned sample and can be sliced against lap-local `Lap Dist`.
- however, values are not consistently positive; negative and positive ranges both appear in the current sample.
- current interpretation is unclear: one-edge distance, signed offset, normalized lane state, or another telemetry-specific meaning are all still plausible.
- current confidence: low for corridor reconstruction until semantics are verified.
- `Track Edge` must not be treated as actual edge distance at this stage.

Corridor feasibility verdict:

- final decision candidate: `estimated telemetry corridor only`
- Brakepoint can likely place the car within an estimated telemetry corridor using `Path Lateral`.
- Brakepoint cannot yet claim verified left/right track edges or actual track width from the current `Track Edge` interpretation.
- actual track corridor supported: not yet
- needs more research: still true for edge semantics and width reconstruction
- report wording stays constrained to `estimated-only`, `estimated telemetry corridor`, and `needs semantic validation`.

What is possible now:

- actual lap racing line can be shown as a telemetry-based solid line
- `Path Lateral` appears strong enough to justify future exploration of estimated within-track placement

What still needs more data:

- exact meaning and sign convention of `Track Edge`
- whether `Path Lateral` reference zero is track center, reference path, or another LMU-defined path
- whether left/right edge inference remains stable across more cars, layouts, and DLC tracks
- visual or reference validation of inferred corridor width

## 13. Track Edge Semantics Deep Probe

Probe command:

- `python scripts\brakepoint_lmu.py track-edge-semantics-probe --limit 5`
- `python scripts\brakepoint_lmu.py track-edge-semantics-probe --limit 10 --output reports\track_edge_semantics_probe.json`

Metadata consistency check:

- corridor preview/full reports continue to emit `coordinateSource: gps-lat-lon`
- corridor preview/full reports continue to emit `coordinateUnit: projected-meter`
- local `findstr` verification found no remaining `gps-degree` entries in `reports\*.json`

Deep probe result snapshot:

- 10-session run: 53 valid laps scanned
- global verdict: `estimated-corridor-only`
- global paired correlation: `0.8256`
- global absolute correlation: `0.3365`
- representative multi-track sample still includes Sebring School, Spa, Fuji, and Monza

Path Lateral stability:

- `Path Lateral` remains distance-aligned across the scanned laps.
- negative/positive sign distribution is stable enough to treat it as a likely signed lateral-offset style signal.
- global near-zero ratio stays materially above zero, which is consistent with a path-relative placement signal rather than a fixed-width edge metric.
- current confidence remains medium for estimated in-track placement research only.

Track Edge stability:

- `Track Edge` also remains distance-aligned, but its value range still crosses negative and positive territory.
- this prevents treating it as a simple one-sided edge distance or verified total track width metric.
- near-zero ratio stays close to zero while sign ratio tracks `Path Lateral`, which suggests a transformed paired signal more than an independently verified boundary measurement.
- current confidence remains low for actual boundary semantics.

Correlation findings:

- lap-by-lap Pearson correlation is consistently strong across the current sample, commonly around `0.82` to `0.91`
- strong pairing means `Track Edge` is related to `Path Lateral`, but not that it represents actual left/right boundary geometry
- near-zero `Path Lateral` buckets still allow wide `Track Edge` ranges, which argues against reading `Track Edge` as a direct centerline-to-edge distance
- extreme negative and extreme positive `Path Lateral` buckets usually preserve Track Edge sign, which reinforces the unresolved signed-signal interpretation

Track-by-track findings:

- Sebring School: strong paired correlation, but Track Edge remains signed and unresolved
- Spa: paired behavior persists at larger lap distance and bbox scale, without proving actual edge semantics
- Fuji: wider `Path Lateral` excursions appear, but verdict still stays `estimated-corridor-only`
- Monza: narrower ranges still keep the same paired-signal pattern rather than a verified boundary-distance pattern

Semantics verdict:

- allowed verdict: `estimated-corridor-only`
- `Estimated Telemetry Corridor` remains the only allowed future wording
- corridor UI remains blocked pending a second validation pass
- `Actual Track Boundary`, `Verified Track Edge`, and `Actual Track Width` remain forbidden wording

What still needs more research:

- whether `Track Edge` is a signed lateral signal, normalized offset, or another LMU-specific path-relative telemetry field
- whether `Path Lateral` zero corresponds to track center, reference path, or another LMU-defined baseline
- whether car class or vehicle choice changes Track Edge semantics instead of only changing scale
- whether replay or known circuit references can validate any inferred corridor interpretation

UI safety decision:

- Brakepoint는 현재 actual lap racing line을 telemetry 좌표 기반 실선으로 표시할 수 있다.
- 하지만 회색 track surface / track boundary / track width는 아직 actual data로 검증되지 않았다.
- `Path Lateral` / `Track Edge` probe가 통과하기 전까지, 회색 track surface를 실제 트랙처럼 표시하지 않는다.
- 검증이 통과하면 우선 `Estimated Telemetry Corridor`로 표시한다.
- `Actual Track Boundary`라는 표현은 별도 검증 전까지 사용하지 않는다.
