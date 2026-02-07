# NYC Explorer — Epics

## EPIC-001 — Manhattan Explorer MVP
**Status:** IN PROGRESS

**Description:** Ship a reliable Manhattan-only map + list + POI detail experience focused on Union Square + Flatiron, backed by a stable JSON schema and deterministic Playwright coverage. Success means core navigation, data loading, and error states are consistently green in CI.

## EPIC-002 — Provider-ready Routing + Directions (Fixture-backed)
**Status:** IN PROGRESS

**Description:** Make geocoding and routing provider-ready without live network calls in CI by using fixtures and interception, and render a basic accessible turn list. Success means provider wiring can be exercised in tests, rate-limit behaviors are governed, and route UX stays predictable.

## EPIC-003 — Content Contract + Validation
**Status:** IN PROGRESS

**Description:** Lock the content contract (schema v1) with validation tests and clear upgrade rules so UI and data can evolve without silent breakage. Success means schema changes are deliberate, additive when possible, and verified through tests and documentation.

## EPIC-004 — Historical TimeWalk Expansion (Future)
**Status:** PLANNED

**Description:** Extend the product into year-specific, source-backed storytelling and routing aligned with TimeWalk research materials. Success means the project can add historically grounded context while maintaining rights clarity, attribution, and measurable coverage.

## EPIC-005 — Workflow, Quality Gates, and Documentation
**Status:** IN PROGRESS

**Description:** Keep development safe and repeatable via the vibe-coding kit, clear Control Deck docs (VISION/EPICS/NEXT), and a small set of enforceable gates. Success means contributors can start a session, run the Doc Audit, and follow a consistent prompt-only loop without drift.

Last updated: 2026-01-11
