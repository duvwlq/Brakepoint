# ADR-0007. DuckDB Data Layer

## Status

Accepted

## Context

LMU `.duckdb` 구조는 일반적인 wide telemetry table이 아니다. metadata, channelsList, eventsList, channel별 table이 분리되어 있고 실제 채널명과 schema는 probe 전까지 확정할 수 없다.

## Decision

DuckDB 접근은 별도 data layer로 분리한다. Renderer와 UI component는 DuckDB table 구조를 직접 알면 안 된다.

## Consequences

- DuckDB parser는 read-only로 동작한다.
- 실제 table/channel 이름은 `13_DuckDB_데이터_조사.md` 결과를 기준으로 확정한다.
- UI는 `SessionSummary`, `LapSummary`, `RacingLineViewData` 같은 contract model만 사용한다.
- DuckDB 내부 구조 변경이 UI 전체 변경으로 번지지 않게 한다.
