# Brakepoint

Brakepoint는 Le Mans Ultimate `.duckdb` telemetry에서 실제 주행 좌표와 distance 기반 입력 데이터를 읽어, 사용자가 자신의 단일 랩 racing line과 Speed/Brake/Throttle 흐름을 이해하게 하는 데스크톱 분석 도구다.

## 현재 상태

이 프로젝트는 이전 구현을 정리하고 문서 기준으로 다시 시작한다.

현재 단계:

- Phase 0: Research & Product Lock
- 문서 구조 통합 완료
- DuckDB 샘플 probe 완료
- 다음 개발 대상은 `lmuDuckdbAdapter`와 Phase 1 Single Lap Racing Line Viewer다

## 핵심 원칙

- Telemetry XY/GPS 좌표가 Phase 1 racing line의 source of truth다.
- SVG는 참고용이며 MVP의 source of truth가 아니다.
- Distance는 graph, hover, replay, comparison의 기본 동기화 기준이다.
- 좌표가 없으면 가짜 트랙맵을 만들지 않고 `distance-graph-only` fallback을 표시한다.
- Canvas는 계산하지 않고 이미 계산된 point를 그린다.
- Best Lap, Ghost, Coach, Heatmap, AI는 MVP 전에 구현하지 않는다.

## 문서 진입점

항상 아래 순서로 읽는다.

1. `AGENTS.md`
2. `docs/00_brakepoint_context.md`

작업별 상세 문서:

- MVP: `docs/01_mvp_spec.md`
- Data/API/DuckDB/좌표: `docs/02_data_contract_spec.md`
- UI/UX/디자인: `docs/03_ux_flow_spec.md`
- Roadmap/Phase Gate: `docs/04_roadmap_and_phase_gates.md`
- Research/Open Questions: `docs/05_research_notes.md`
- ADR: `docs/09_adrs/`

이전 상세 문서는 `docs/archive/`에 보관한다.

## 다음 개발 순서

1. LMU DuckDB read-only data layer 설계
2. `lmuDuckdbAdapter` 최소 구현
3. session list / metadata / lap list 검증
4. selected lap에서 `RacingLineViewData` 생성
5. Single Lap Racing Line Viewer UI 구현

## 실행

현재는 코드 구현을 다시 시작하기 전 문서 기준 정리 상태다.
실행 명령은 Phase 1 구현이 들어간 뒤 갱신한다.
