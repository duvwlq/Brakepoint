# 04 Roadmap and Phase Gates

## 1. Roadmap Rule

로드맵은 크게 설계한다.
구현은 Phase Gate를 통과한 기능만 진행한다.

데이터가 확인되지 않은 기능은 `Needs Research`로 둔다.

## 2. Phase 0. Research & Product Lock

목표:

- 아이디어와 실제 LMU telemetry 데이터가 충돌하지 않게 한다.

포함:

- DuckDB schema probe
- 좌표 채널 검증
- distance 채널 검증
- speed/brake/throttle 채널 검증
- car/session/race context 조사
- Game Adapter contract
- canonical telemetry model
- design system

Exit Gate:

- Phase 1 핵심 channel 확인
- fallback 정책 확정
- active docs 정리
- ADR 유지

## 3. Phase 1. Single Lap Racing Line Viewer

목표:

- 사용자가 자신의 단일 랩 주행 라인을 본다.

포함:

- LMU DuckDB adapter
- session list
- lap list
- coordinate detection
- Racing Line Canvas
- Speed/Brake/Throttle graph
- hover sync
- coordinate missing fallback

Entry Gate:

- DuckDB probe 완료
- 좌표 후보 확인
- distance 후보 확인
- graph channel 후보 확인
- API/data contract 확정

Done:

- 서로 다른 LMU track/layout 2개 이상에서 fit-to-view 확인
- 좌표 없는 케이스에서 graph-only fallback 확인

## 4. Phase 1.5. Race Records Candidate

목표:

- Race session 기록을 구조화할 수 있는지 확인한다.

조건:

- DuckDB에 race result, class position, finish status 등이 실제로 기록되는지 확인되어야 한다.

구현 금지:

- 데이터 확인 전 Race Records tab 구현

## 5. Phase 2. Best Lap Comparison

목표:

- selected lap과 best lap을 distance 기준으로 비교한다.

Entry Gate:

- Phase 1 안정 동작
- 두 lap distance alignment 가능
- same game/track/layout/car compatibility rule 확정

금지:

- 다른 game 비교
- 다른 layout 비교
- low confidence coordinate 비교를 실제 분석처럼 표시

## 6. Phase 3. Ghost Replay

목표:

- Current lap과 Best lap 차량 위치를 distance playhead 기준으로 표시한다.

Entry Gate:

- Phase 2 comparison 안정화
- interpolation 가능
- Canvas 성능 확인

## 7. Phase 4. Difference Analysis

목표:

- 어디서 다른지, 어디서 손실이 큰지 보여준다.

필요 지표:

- brake start
- throttle reapply
- min speed
- exit speed
- line deviation

Entry Gate:

- 지표 계산 신뢰도 확인
- false positive guardrail 존재

## 8. Phase 5. Coach UX

목표:

- 다음 랩에서 무엇을 바꿀지 행동 중심으로 제안한다.

원칙:

- AI보다 rule-based 먼저
- 판단 source of truth는 telemetry
- 문장은 데이터 기반

Entry Gate:

- Difference Analysis 안정화
- Top issue 선정 기준 확정
- confidence rule 존재

## 9. Phase 6. Track Envelope / Multi-Lap Learning

목표:

- 여러 랩의 좌표 데이터를 누적해 주행 영역과 일관성을 분석한다.

Needs Research:

- track envelope estimation
- multi-lap consistency score
- coordinate normalization cache
- estimated telemetry corridor semantics

Guardrail:

- `Path Lateral` / `Track Edge` probe가 second validation pass를 통과하기 전까지
  actual gray track surface, actual track boundary, actual track width UI는 구현하지 않는다.
- corridor를 먼저 표시해야 하면 `Estimated Telemetry Corridor` wording으로만 제한한다.

## 10. Phase 7. Adapter-Based Game Expansion

목표:

- F1 25, Assetto Corsa, ACC, iRacing 등을 Game Adapter로 추가한다.

Entry Gate:

- LMU MVP 안정화
- target game telemetry source 조사
- Game Adapter probe 완료
- Capability Matrix 작성
- canonical mapping 검증
- live/post-session 저장 전략 확정
- 법적/API 제한 확인

금지:

- LMU Phase 1 전 다른 게임 구현
- raw field를 UI에 직접 노출
- cross-game comparison 기본 제공

## 11. Idea/Data Alignment Matrix

모든 아이디어는 아래 항목을 통과해야 한다.

| 항목 | 질문 |
| --- | --- |
| User Value | 사용자의 어떤 질문에 답하는가? |
| Required Data | 어떤 telemetry가 필요한가? |
| Data Confirmed? | 실제 파일에서 확인했는가? |
| Data Quality | sample count/null/unit/range는 어떤가? |
| Algorithm | 어떤 계산이 필요한가? |
| UI Output | 무엇으로 보여줄 것인가? |
| Failure Mode | 데이터가 없으면 어떻게 fallback하는가? |
| Phase | 어느 Phase인가? |
| Acceptance Criteria | 테스트 가능한가? |

## 12. Current Feature Matrix

| Feature | Phase | Status |
| --- | --- | --- |
| Single Lap Racing Line | 1 | Ready for Phase 1 prototype |
| Speed/Brake/Throttle Graph | 1 | Ready for Phase 1 prototype |
| Hover Sync | 1 | Ready for Phase 1 prototype |
| Best Lap Comparison | 2 | Needs Phase 1 |
| Ghost Replay | 3 | Needs Phase 2 |
| Difference Analysis | 4 | Needs Research |
| Coach UX | 5 | Needs Research |
| Multi-Lap Envelope | 6 | Future |
| F1/AC/iRacing | 7 | Future |
