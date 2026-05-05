# AGENTS.md

## Core Rule

Brakepoint는 문서 기준 개발을 원칙으로 한다.
Codex는 코드를 수정하기 전에 반드시 `AGENTS.md`와 `/docs/00_brakepoint_context.md`를 먼저 읽어야 한다.

## Active Reading Order

기본 읽기 순서:

1. `AGENTS.md`
2. `/docs/00_brakepoint_context.md`

작업별 추가 문서:

- MVP 요구사항/사용자 흐름: `/docs/01_mvp_spec.md`
- 데이터/API/DuckDB/좌표: `/docs/02_data_contract_spec.md`
- UI/UX/디자인: `/docs/03_ux_flow_spec.md`
- 로드맵/페이즈/기능 게이트: `/docs/04_roadmap_and_phase_gates.md`
- 자료조사/경쟁사/오픈 질문: `/docs/05_research_notes.md`
- 비가역적 결정 확인: `/docs/09_adrs/*.md`

`/docs/archive/`는 이전 상세 문서 보관용이다. 새 작업의 기준 문서가 아니다.

## Non-Negotiable Product Rules

- Phase 1은 Le Mans Ultimate `.duckdb` telemetry에 집중한다.
- Core model은 향후 다른 racing game adapter를 추가할 수 있도록 game-neutral canonical model로 유지한다.
- F1 25, Assetto Corsa, Assetto Corsa Competizione, iRacing 지원은 Phase 7 이후이며 Phase Gate 통과 전 구현하지 않는다.
- Telemetry XY/GPS 좌표가 Phase 1 racing line의 source of truth다.
- SVG는 MVP의 source of truth가 아니다.
- Distance는 graph, hover, replay, comparison의 기본 동기화 기준이다.
- MVP는 Single Lap Racing Line Viewer다.
- MVP는 Single Lap이지만 Single Track이 아니다. 좌표가 있는 모든 LMU track/layout은 hardcoded track map 없이 표시되어야 한다.
- Best Lap 비교, Ghost, Coach, Heatmap, AI는 MVP 전에 구현하지 않는다.
- 좌표가 없으면 가짜 트랙맵을 만들지 않고 `distance-graph-only` fallback을 표시한다.
- Canvas는 계산하지 않는다. Canvas는 이미 생성된 racing line point와 graph data를 그리기만 한다.
- 게임별 raw telemetry field를 UI model에 직접 노출하지 않는다.
- 모든 게임은 Game Adapter를 통해 Brakepoint canonical model로 변환되어야 한다.
- Cross-game comparison은 기본 금지이며 Future Research로 둔다.

## Change Policy

다음 변경은 코드보다 문서를 먼저 수정해야 한다.

- 기능 요구사항 변경
- 사용자 흐름 변경
- API contract 변경
- data model 변경
- coordinate detection 정책 변경
- fallback 정책 변경
- UI 구조 변경
- error policy 변경
- MVP 포함/제외 범위 변경
- Phase Gate 기준 변경
- Game Adapter contract 변경
- canonical telemetry model 변경

단순 버그 수정, 오타 수정, 내부 리팩터링은 코드 먼저 가능하다.
단, 외부 동작이 바뀌면 active 문서를 업데이트해야 한다.

## Implementation Rule

Codex는 복잡한 작업에서 다음 순서를 따른다.

1. 관련 active 문서 읽기
2. 현재 코드/파일 구조 확인
3. 문서와 코드의 충돌 확인
4. 구현 계획 작성
5. 필요한 문서 수정 제안 또는 적용
6. 코드 수정
7. 테스트 또는 검증 명령 실행
8. 변경 요약 작성

## Done Definition

작업은 아래 조건을 만족해야 완료로 본다.

- 관련 SRS/MVP 요구사항을 충족한다.
- API contract와 data model을 위반하지 않는다.
- acceptance criteria를 만족한다.
- 가능한 typecheck/build/test/probe 검증을 실행한다.
- 문서와 코드가 모순되지 않는다.
- MVP 제외 범위 기능을 임의로 추가하지 않는다.
- 좌표가 없는 데이터를 실제 racing line처럼 표시하지 않는다.

## Required Output

작업 후 항상 아래 형식으로 보고한다.

### Summary
### Requirement IDs
### Files Changed
### Validation
### Docs Updated
### Risks
