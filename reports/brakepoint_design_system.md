# Brakepoint Design System Proposal

## Summary

This document defines the proposed Brakepoint design-system direction for the
next product pass.

The desired feel is:

- bright
- calm
- trustworthy
- telemetry-aware

The reference is not a racing game menu.
The reference is a soft, card-first analysis app with clear hierarchy.

## Design Direction

Brakepoint should feel like:

- a trustworthy analysis app
- a telemetry-first product
- a product that highlights the current thing to inspect

Brakepoint should not feel like:

- a dark debug shell
- a motorsport marketing site
- a gaming HUD
- a dense engineering dashboard by default

## Foundation

### Color Strategy

Brakepoint should use two different accent roles:

1. `Brand Accent`
2. `Product Action Accent`

This keeps the Brakepoint brand identity while still allowing a clean bright
application hierarchy.

#### Brand Accent

Use for:

- logo
- high-importance product identity marks
- selected product signature details

Token:

- `brandAccent: #E60442`

#### Product Action Accent

Use for:

- selected navigation state
- toggles
- active buttons
- compact CTA surfaces

Token:

- `actionPrimary: #3182F6`

### Base Palette

```ts
pageBackground: '#F6F8FB'
pageBackgroundStrong: '#EEF2F6'
cardBackground: '#FFFFFF'
cardBackgroundSoft: '#F9FBFD'
borderSubtle: '#E5EAF0'
textPrimary: '#191F28'
textSecondary: '#8B95A1'
textTertiary: '#AEB7C2'
```

### Telemetry Semantics

Telemetry colors should remain semantic and stable across pages.

```ts
racingLinePrimary: '#19C7C0'
bestLapOverlay: '#8FB6FF'
brakePrimary: '#EB2622'
throttlePrimary: '#447FBC'
speedPrimary: '#3182F6'
warningAccent: '#F59E0B'
successAccent: '#17B26A'
```

Rules:

- current lap stays visually stronger than comparison data
- best lap stays secondary
- telemetry colors are not the app's general navigation colors
- warning colors should guide, not alarm

### Typography

Typography should prioritize fast reading over decoration.

Roles:

- `Display`: page or key context title
- `Title`: card title or section heading
- `Body`: primary readable content
- `Meta`: compact metadata and supportive labels

Rules:

- avoid playful display typography
- keep data labels compact
- prefer strong hierarchy through size and weight, not color alone

### Spacing

Spacing should make the interface feel calmer than the current dense shell.

Base steps:

- 4
- 8
- 12
- 16
- 20
- 24
- 32

Rules:

- cards should breathe
- do not compress all telemetry UI to maximize visible widgets
- page rhythm matters more than squeezing one more panel onto the screen

### Radius

Recommended radius family:

- small: `10px`
- medium: `14px`
- large: `20px`

Use:

- cards: large
- buttons and chips: medium
- small info pills and badges: small or medium

### Shadow

Shadows should be subtle.

Rules:

- use soft elevation to separate white cards from the page
- do not use dramatic floating card shadows
- rely on spacing + border + subtle elevation together

## Component Inventory

### Priority 1 Foundations

- Color Token
- Typography
- Spacing
- Radius
- Shadow

### Priority 2 Core Components

- Button
- Card
- Chip
- Badge
- Status Pill
- Empty State
- Warning Banner

### Priority 3 Product Components

- Session Card
- Session Row
- Lap Card
- Lap Row
- Telemetry Graph Card
- Inspector Stat Card
- Comparison Toggle
- Advanced Graph Drawer Header

## Component Rules

### Button

Should feel:

- rounded
- obvious
- compact

Variants:

- primary
- secondary
- quiet
- destructive only when truly needed

### Card

Card is the primary product primitive.

Rules:

- white surface
- subtle border
- soft shadow
- clear internal spacing
- readable header and body separation

### Chip

Use for:

- filters
- session type
- lap validity
- comparison availability

Do not use chips as decoration.

### Badge

Use for:

- best lap
- invalid lap
- ready / partial / error status
- advanced graph availability summary

Badges should be short and legible.

### Warning Banner

Tone:

- calm
- explanatory
- data-availability oriented

Examples:

- `Coordinate data is unavailable. Showing graphs only.`
- `Selected lap is already the best lap.`
- `Steering unavailable.`

Warnings should not read like system failure unless the app is actually broken.

### Empty State

Empty states should guide the next action quickly.

Examples:

- no source
- no session selected
- no valid lap selected
- no advanced channel available

## Icon Policy

Icons should be semantic and consistent.

Preferred meanings:

- Folder -> Source
- Map -> Track
- Timer -> Lap Time
- Gauge -> Speed
- Flag -> Session
- Car -> Vehicle
- Alert -> Warning

Rules:

- do not add icons randomly for decoration
- icon meaning should remain stable across pages
- if an icon is not making the UI clearer, remove it

## Screen-Level Design Priorities

### Sessions

- browsing-first
- clear grouping
- lightweight metadata
- best lap and validity summary visible quickly

### Lap Analysis

- canvas-centered
- context-first
- inspector compact but readable
- graphs supportive, not dominant

### Graph Analysis

- future scope
- should not drive the current design system prematurely

## Relationship To Current Accepted Baseline

This document does not invalidate the current accepted product baseline.
It defines the design language to use for future UI passes and Figma design
work.

## Acceptance Shape

This design-system proposal is successful if:

- the app can look brighter without losing telemetry trust
- comparison and advanced graphs remain secondary
- warnings feel informative rather than scary
- cards, buttons, filters, and banners share one visual logic

## Recommended Next Step

Use this document directly before Figma screen design.

Immediate next design target:

- `Lap Analysis` Figma structure brief
