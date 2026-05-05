# ADR-0002. MVP Single Lap Racing Line Viewer

## Status

Accepted

## Context

이전 Brakepoint 개발은 Best Lap 비교, Ghost, Coach, Heatmap, Track SVG, Replay까지 한 번에 확장되면서 구조가 꼬였다. MVP는 먼저 실제 데이터가 안정적으로 읽히고, 한 랩의 실제 주행 라인을 정확히 볼 수 있어야 한다.

## Decision

Brakepoint MVP는 Single Lap Racing Line Viewer로 제한한다.

## Included

- Telemetry folder 확인
- Session list
- Metadata 표시
- Lap list
- Coordinate detection
- Single lap racing line viewer
- Speed / Brake / Throttle graph
- Hover sync
- Coordinate missing fallback

## Excluded

- Best Lap 비교
- Ghost car
- Coach insight
- Delta heatmap
- 자동 segment 생성
- AI 분석

## Consequences

- MVP 개발 중에는 비교/코칭 기능을 추가하지 않는다.
- 사용자 가치는 "내가 실제로 어떻게 돌았는지 한눈에 보는 것"에 집중한다.
