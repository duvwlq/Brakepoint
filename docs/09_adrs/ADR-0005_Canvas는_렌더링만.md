# ADR-0005. Canvas Render Only

## Status

Accepted

## Context

이전 구현은 Canvas rendering 안에서 mapping, delta, segment 계산이 섞이면서 성능과 디버깅이 어려워졌다.

## Decision

Canvas는 계산하지 않는다. Canvas는 domain/data layer가 이미 생성한 `RacingLinePoint[]`와 graph-ready data를 그리기만 한다.

## Consequences

- Coordinate detection은 Canvas 밖에서 수행한다.
- Racing line normalization과 smoothing은 domain/data layer에서 수행한다.
- Canvas component는 DuckDB table/channel 구조를 알면 안 된다.
- Hover 시 전체 telemetry를 다시 계산하지 않는다.
