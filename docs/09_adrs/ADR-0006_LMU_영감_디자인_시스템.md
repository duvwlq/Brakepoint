# ADR-0006. LMU Inspired Design System

## Status

Accepted

## Context

Brakepoint는 Le Mans Ultimate telemetry를 중심으로 시작하는 앱이다. 따라서 시각 톤은 LMU의 레이싱 감각에서 영감을 받을 수 있다. 다만 Brakepoint는 공식 LMU 앱이 아니며, 공식 UI처럼 보이면 안 된다.

## Decision

Brakepoint는 "LMU inspired, not LMU branded" 원칙을 따른다.

## Color Tokens

- Background: `#0B0F14`
- Panel: `#121821`
- Primary / Brand Accent: `#E60442`
- Brake / Danger / Loss: `#EB2622`
- Throttle / Data Blue: `#447FBC`
- Dark Blue Accent: `#0A4E99`
- Deep Indigo / Muted Line: `#424B78`
- Soft Blue / Ghost / Secondary Text: `#91B4D4`
- Text Primary: `#F6F7F7`

## Consequences

- Primary red는 핵심 상태, 선택 지점, hover sync에 사용한다.
- Brake/loss는 hot red 계열로 표시한다.
- Throttle/data/secondary state는 blue 계열로 표시한다.
- SVG나 공식 LMU 로고/브랜딩을 사용하지 않는다.
- 색상만으로 의미를 전달하지 않고 tooltip, label, line width, marker shape를 함께 사용한다.
