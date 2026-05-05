# ADR-0004. Distance Sync

## Status

Accepted

## Context

LMU telemetry는 channel별 sampling rate가 다르고, 일부 channel에는 명시적 timestamp가 없다. Racing line, graph, hover를 안정적으로 연결하려면 공통 기준이 필요하다.

## Decision

Brakepoint는 distance를 모든 sync 기준으로 사용한다.

## Consequences

- Canvas hover와 graph hover는 같은 distance 값을 공유한다.
- Speed / Brake / Throttle graph는 distance axis 기준으로 표시한다.
- Racing line point도 distance를 포함해야 한다.
- timestamp나 sample index는 내부 처리용일 수 있지만 UI sync 기준은 아니다.
