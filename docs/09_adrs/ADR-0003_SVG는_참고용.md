# ADR-0003. SVG Reference Only

## Status

Accepted

## Context

일반적인 트랙 SVG는 대부분 중심선 또는 외곽선 그림이다. 실제 트랙 폭, 좌/우 경계, 코너별 폭 변화, 차량 위치 좌표를 제공하지 않는다.

## Decision

MVP에서 SVG는 source of truth가 아니다. SVG는 참고 이미지 또는 향후 보조 시각화로만 사용할 수 있다.

## Consequences

- 좌표가 없는 경우 SVG로 가짜 racing line을 만들지 않는다.
- SVG 기반 track map을 실제 주행 분석처럼 표시하지 않는다.
- 실제 racing line은 telemetry XY/GPS 좌표가 있을 때만 표시한다.
