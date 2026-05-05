# ADR-0008. Estimated Telemetry Corridor Only

## Status

Accepted

## Context

Brakepoint는 telemetry 기반 actual lap racing line을 안정적으로 표시할 수 있다.
하지만 LMU telemetry의 `Path Lateral` / `Track Edge`만으로는 아직 actual left/right
track boundary 또는 actual track width를 검증하지 못했다.

`track-corridor-probe` 결과에서도 global verdict는 `estimated-only`이며,
`Path Lateral`은 estimated in-track placement 연구 신호로는 유의미하지만,
`Track Edge` semantics는 아직 unresolved 상태다.

## Decision

- Actual lap racing line is supported.
- Actual gray track boundary / surface is not supported yet.
- Estimated Telemetry Corridor is research-allowed.
- `Actual Track Boundary`, `Verified Track Edge`, `Actual Track Width`
  wording is forbidden until separately verified.

## Consequences

- 회색 track surface를 실제 트랙처럼 렌더링하지 않는다.
- `Track Edge`를 actual edge distance로 해석하지 않는다.
- `Path Lateral`은 estimated in-track placement 연구 신호로만 사용한다.
- `Track Edge` semantics remain unresolved.
- Corridor UI는 second validation pass 전까지 blocked 상태다.
