# 20 경쟁사 리서치: Track Titan

## 1. 목적

Track Titan은 Brakepoint가 복제할 대상이 아니다.

이 문서는 Track Titan에서 참고할 UX 원칙과 Brakepoint에 반영하지 말아야 할 범위를 정리한다.

## 2. 참고한 자료

- Track Titan 공식 홈페이지
- Track Titan November 2025 Coaching Flows 업데이트
- Track Titan dashboard 공개 페이지

## 3. 핵심 관찰

### 3.1 복잡한 telemetry를 먼저 보여주지 않는다

Track Titan은 사용자를 처음부터 graph 분석 화면에 넣지 않는다.

공식 홈페이지의 기본 흐름은 다음에 가깝다.

```text
Drive
-> Analyse & Learn
-> Stay Up-To-Date
```

Brakepoint는 이를 그대로 복제하지 않고 다음 흐름으로 변환한다.

```text
Load Session
-> Select Lap
-> See Line
-> Understand Inputs
```

### 3.2 Root cause 중심 UX

Track Titan Coaching Flows는 corner별 telemetry를 단순 나열하기보다 lap 전체에서 가장 큰 time loss의 root cause를 찾는 방향이다.

Brakepoint에서는 이 개념을 Phase 5 Coach UX의 참고로만 사용한다.

MVP에 Coach Flow를 넣지 않는다.

### 3.3 Distance marker는 중요하다

Track Titan 업데이트는 chart에서 distance marker를 사용해 brake/throttle timing 차이를 이해하기 쉽게 만든다고 설명한다.

Brakepoint의 `Distance Sync` ADR과 일치한다.

MVP부터 고정할 원칙:

- Canvas hover = distance
- Graph hover = distance
- Tooltip = distance + speed + brake + throttle
- Phase 2 comparison = distance alignment
- Phase 3 replay = distance playhead

### 3.4 Focus Zone은 Phase 4 이후

Focus Zone은 사용자가 "여기를 봐라"라고 이해하게 하는 좋은 UX다.

하지만 MVP에 넣으면 범위가 커진다.

Brakepoint 적용 순서:

```text
Phase 1: Hover marker
Phase 2: Best lap delta marker
Phase 3: Ghost replay marker
Phase 4: Focus Zone
Phase 5: Coach explanation
```

## 4. Brakepoint가 가져올 것

- 쉬운 온보딩
- distance marker 기반 해석
- racing line 중심 화면
- root cause 기반 Coach 방향
- 사용자가 직접 graph를 해석하지 않아도 되는 UX 목표

## 5. Brakepoint가 가져오지 않을 것

- Track Titan UI 복제
- Track Titan 색상/브랜딩 복제
- MVP에서 Coach Flow 구현
- MVP에서 Focus Zone 구현
- MVP에서 segment 자동 분석 구현
- AI 기반 판단

## 6. Brakepoint 결정

Brakepoint는 Track Titan식 제품 메시지를 다음처럼 재해석한다.

```text
Track Titan:
Drive -> Analyse -> Learn

Brakepoint:
Load Session -> Select Lap -> See Line -> Understand Inputs
```

## 7. MVP 반영

MVP에 반영:

- Racing Line Canvas 중심
- Graph는 보조
- Distance marker / hover sync
- Data mode badge
- 좌표 없을 때 명확한 fallback

MVP에 반영하지 않음:

- Best Lap comparison
- Ghost
- Coach
- Focus Zone
- 자동 segment 분석

## 8. Open Questions

- Phase 5 Coach UX에서 Track Titan식 root cause flow를 어느 정도까지 rule-based로 구현할 수 있는가?
- Phase 4 Focus Zone의 최소 데이터 조건은 무엇인가?
- 사용자가 처음 열었을 때 안내 문장을 몇 단계로 줄이는 것이 좋은가?
