# Phase 1.2 Open Checklist

## Summary

This document defines the minimum checklist that should be satisfied before
Brakepoint opens actual Phase 1.2 implementation work.

It does not open Phase 1.2 by itself.

Its purpose is to stop a later-phase IA rewrite from starting casually without
explicit agreement on scope, acceptance, and non-goals.

## Current Status

Current baseline:

- Phase 1: frozen candidate / release sanity green baseline
- Phase 1.1: closeout
- Phase 1.2: proposal only

Interpretation:

- no active Phase 1.2 implementation is authorized yet
- any real Phase 1.2 work should pass this checklist first

## What Opening Phase 1.2 Means

Opening Phase 1.2 means:

- IA work is now an intentional scope
- `Sessions split first` is the first slice
- Lap Analysis protection rules remain active
- no telemetry feature expansion is bundled into the IA rewrite

It does not mean:

- Dashboard is automatically in scope
- Graph Analysis is automatically in scope
- comparison features are now allowed
- track-geometry UI is now allowed

## Entry Checklist

| ID | Check | Pass Condition |
| --- | --- | --- |
| P12-OPEN-01 | Baseline stability | current Phase 1 / 1.1 closeout baseline is accepted as stable |
| P12-OPEN-02 | Release sanity | no active release-blocking regression exists |
| P12-OPEN-03 | Slice agreement | `Sessions split first` is explicitly accepted as the first slice |
| P12-OPEN-04 | Non-goals accepted | Dashboard, Graph Analysis, search, minimap, comparison, and AI remain out of the first slice |
| P12-OPEN-05 | Lap Analysis protection | the team accepts `Lap Analysis unchanged as much as possible` as a hard rule |
| P12-OPEN-06 | Acceptance defined | the first slice acceptance checklist is accepted before implementation begins |
| P12-OPEN-07 | Guardrails accepted | no corridor, no actual boundary, no gray surface, no track width, no fake map |
| P12-OPEN-08 | Follow-up sequence accepted | broader nav shell or Graph Analysis remain post-slice decisions, not bundled scope |

## Required Inputs

Before opening Phase 1.2, the following documents should already be the active
reference set:

- `reports/layout_direction_next.md`
- `reports/phase1_2_ia_proposal.md`
- `reports/phase1_2_sessions_split_first.md`
- `reports/phase1_2_sessions_split_first_kickoff.md`

Optional supporting references:

- `reports/release_sanity_pass.md`
- `reports/packaged_app_spot_check.md`

## Non-Goals For Opening Decision

Do not use the Phase 1.2 opening decision to sneak in:

- new telemetry channels
- new graph interactions
- comparison systems
- coaching systems
- Dashboard implementation
- Graph Analysis implementation
- search and saved filters
- minimap
- corridor UI
- actual track boundary
- actual gray track surface
- actual track width

## Approval Prompt Template

If the team wants to open Phase 1.2, the approval sentence should read like:

`Open Phase 1.2 with Sessions split first. Keep Lap Analysis unchanged as much as possible. Do not include Dashboard, Graph Analysis, search, minimap, comparison, or track-geometry UI in the first slice.`

This keeps the scope explicit and compact.

## Stop Conditions

Do not open Phase 1.2 yet if any of the following is true:

- release sanity is no longer green
- packaged app flow has a new blocker
- the team wants Dashboard and Graph Analysis in the same first slice
- the first slice requires telemetry feature expansion
- the first slice cannot preserve current Lap Analysis behavior

## Recommended Next Step

Use this checklist only when the team is ready to make an actual Phase 1.2
scope decision.

Until then:

1. keep the current closeout baseline
2. treat Phase 1.2 as proposal-only
3. do not start implementation work early
