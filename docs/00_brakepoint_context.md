# Brakepoint Context

## 1. Current Status

Brakepoint는 기획을 재정렬한 상태다.
이전 Electron/React 구현은 복잡도가 과도했고, 현재 기준은 문서 우선으로 다시 시작한다.

현재 단계:

- Phase 0: Research & Product Lock
- DuckDB 샘플 probe 완료
- LMU `.duckdb`에서 `GPS Latitude`, `GPS Longitude`, `Lap Dist`, `Ground Speed`, `Brake Pos`, `Throttle Pos`, `Steering Pos` 등 Phase 1 핵심 후보 채널 확인
- 다음 구현 대상은 전체 앱이 아니라 LMU DuckDB data layer와 Single Lap Racing Line Viewer다

## 2. Product Definition

Brakepoint는 Le Mans Ultimate `.duckdb` telemetry에서 실제 주행 좌표와 distance 기반 입력 데이터를 읽어, 사용자가 자신의 단일 랩 주행 라인과 브레이크/스로틀/속도 흐름을 이해하게 하는 데스크톱 분석 도구다.

장기적으로는 Best Lap 비교, Ghost Replay, Difference Analysis, Coach UX로 확장한다.
하지만 Phase 1은 Single Lap Racing Line Viewer에 집중한다.

## 3. Non-Negotiable Rules

- Telemetry XY/GPS 좌표가 Phase 1 racing line의 source of truth다.
- SVG는 참고용이다. MVP의 source of truth가 아니다.
- Distance는 hover, graph, replay, comparison의 동기화 기준이다.
- 좌표가 없으면 가짜 트랙맵을 만들지 않는다.
- Brakepoint는 telemetry 기반 actual lap racing line을 실선으로 표시할 수 있다.
- 하지만 actual gray track surface, actual track boundary, actual track width는 아직 지원하지 않는다.
- `Path Lateral`은 estimated placement 연구 신호로만 취급한다.
- `Track Edge` semantics는 아직 unresolved 상태다.
- 향후 corridor를 표시하더라도 `Estimated Telemetry Corridor`로만 표시한다.
- Canvas는 계산하지 않는다. Canvas는 precomputed point를 그린다.
- UI는 DuckDB table/channel 구조를 직접 알면 안 된다.
- Game-specific raw field는 Game Adapter 내부에서 canonical model로 변환한다.
- Phase 1은 LMU 전용 구현이지만 core model은 multi-game-ready로 유지한다.
- Best Lap, Ghost, Coach, Heatmap, AI는 MVP 전에 구현하지 않는다.
- Cross-game comparison은 기본 금지다.

## 4. Current MVP

MVP 목표:

사용자가 LMU telemetry 폴더에서 세션을 선택하고, 유효 랩 하나를 선택한 뒤, 실제 좌표 기반 racing line과 Speed/Brake/Throttle graph를 distance 기준으로 함께 본다.

MVP 포함:

- Telemetry folder 확인
- `.duckdb` session discovery
- metadata 표시
- lap list
- valid/invalid lap 표시
- coordinate detection
- single lap racing line canvas
- Speed / Brake / Throttle graph
- distance hover sync
- coordinate missing fallback

MVP 제외:

- Best Lap comparison
- Ghost car
- Coach insight
- Delta heatmap
- 자동 segment/corner 분석
- AI
- F1/AC/iRacing adapter
- SVG 기반 실제 트랙맵

## 5. Core User Flow

1. 앱 실행
2. LMU telemetry folder 확인
3. session list 표시
4. session 선택
5. metadata와 lap list 표시
6. valid lap 선택
7. 좌표 채널 탐지
8. 좌표가 있으면 Racing Line Viewer 표시
9. 좌표가 없으면 `distance-graph-only` fallback 표시
10. graph와 canvas는 distance hover로 동기화

## 6. Future Product Flow

Phase 1 이후 흐름:

1. Single Lap 이해
2. Best Lap과 distance 기준 비교
3. Ghost Replay로 두 랩의 차이를 직관화
4. Difference Analysis로 손실 구간 식별
5. Rule-based Coach로 다음 랩 행동 제안
6. Multi-lap envelope로 주행 일관성 분석
7. Game Adapter 확장

## 7. Architecture Summary

```text
Game-specific Source
  -> Game Adapter
  -> Raw Ingest
  -> Normalize
  -> Brakepoint Canonical Session Store
  -> Domain / Analysis Layer
  -> Rendering Layer
  -> UI Layer
```

Phase 1 adapter:

- `lmuDuckdbAdapter`

Future adapters:

- `f1UdpAdapter`
- `assettoSharedMemoryAdapter`
- `accAdapter`
- `iracingSdkAdapter`

Layer rules:

- Adapter: game-specific raw schema 처리
- Domain: lap extraction, coordinate projection, distance alignment, graph generation
- Rendering: canvas draw only
- UI: state and user events only

## 8. Data Contract Summary

핵심 타입:

- `GameId`
- `DataSourceKind`
- `GameDataSource`
- `TrackIdentity`
- `CarIdentity`
- `NormalizedSessionSummary`
- `NormalizedLapSummary`
- `NormalizedTelemetryPoint`
- `NormalizedLapTelemetry`
- `CoordinateStatus`
- `SyncStatus`
- `RacingLineViewData`
- `ApiResult<T>`

Renderer API는 `sessionId`와 `lapId` 중심으로 호출한다.
`filePath`는 debug/internal field로만 사용한다.

Phase 1 주요 API:

- `detectSources(game)`
- `listSessions(sourceId?)`
- `loadSession(sessionId)`
- `loadLapRacingLine(sessionId, lapId)`

## 9. Roadmap Summary

- Phase 0: Research & Product Lock
- Phase 1: Single Lap Racing Line Viewer
- Phase 1.5: Race Records Candidate
- Phase 2: Best Lap Comparison
- Phase 3: Ghost Replay
- Phase 4: Difference Analysis
- Phase 5: Coach UX
- Phase 6: Track Envelope / Multi-Lap Learning
- Phase 7: Adapter-Based Game Expansion

개발은 Phase Gate를 통과한 기능만 진행한다.

## 10. Open Questions

- LMU 파일별 lap boundary와 Lap Time mapping이 모든 session type에서 안정적인가?
- GPS Latitude/Longitude가 모든 차량/트랙/설정에서 항상 기록되는가?
- GPS 좌표가 real GPS인지 game-projected coordinate인지 여부가 UI 문구에 영향을 주는가?
- Race result, overall/class position이 DuckDB에 기록되는가?
- 차량별 추가 채널(hybrid, regen, tyre, fuel)이 Phase 1 이후 분석에 충분한가?
- `.wal` 또는 incomplete session 처리 정책을 구현에서 어떻게 노출할 것인가?

## 11. Document Map

- MVP 기준: `/docs/01_mvp_spec.md`
- Data/API/DuckDB/coordinate 기준: `/docs/02_data_contract_spec.md`
- UI/UX/design 기준: `/docs/03_ux_flow_spec.md`
- Roadmap/Phase Gate 기준: `/docs/04_roadmap_and_phase_gates.md`
- Research/competitor/open questions: `/docs/05_research_notes.md`
- Decision record: `/docs/09_adrs/*.md`
- 이전 상세 문서: `/docs/archive/`

## 12. Next Tasks

1. LMU DuckDB read-only data layer 설계
2. `lmuDuckdbAdapter` 최소 구현
3. session list / metadata / lap list 반환 검증
4. selected lap에서 `GPS Latitude` + `GPS Longitude` + `Lap Dist` 기반 `RacingLineViewData` 생성
5. Phase 1 UI scaffold 구현
6. Track Edge semantics deep probe before any corridor UI
