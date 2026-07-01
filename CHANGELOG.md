# Changelog

All notable changes to this project will be documented in this file.

## [2026-07-01] BRIEF4 Runtime Hardening and Operational Controls

Commit: db0b205

### Added
- Runtime mission queue drift detection and repair surfaces (API + dashboard integration).
- Browser sandbox diagnostics endpoint with host-level failure and cooldown visibility.
- Browser sandbox task modes for Claude and DeepSeek in both backend contracts and frontend controls.
- Fallback-only operator confirmation flow before browser mode execution.

### Changed
- AI Gateway health now returns live snapshot data sourced through router diagnostics.
- Runtime mission execution queue creation now links to AgentRun source-of-truth bridge.
- Runtime smoke checks hardened for deterministic local verification flow.
- Mission queue drift and list endpoints now clamp limit values at daemon API boundary.

### Fixed
- Import/runtime contract inconsistencies across mission queue runtime hub wiring.
- Windows-local secure store rename contention through safer write behavior in persistence path.
- Runtime route and module compatibility issues affecting local check:runtime flows.

### Validation
- npm run lint: pass
- npm run check:runtime: pass
- Runtime route contract checks: pass
