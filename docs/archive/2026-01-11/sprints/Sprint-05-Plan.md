# Sprint 05 Plan — Geocoding & Routing (v0.1)

## Sprint Goal (Manhattan only)
- Add geocoding/typeahead + mockable routing so users enter From/To via addresses, intersections, place names, or "Current location."
- Return Manhattan-only walking segments that reuse existing steps, markers, and SVG path UI without breaking deep links.

## Scope
- **Must:** typeahead UX (`geo-from`/`geo-to`), mock adapters (geocoder + route engine), Find wiring through segments/markers/path, deep-link + history preservation, aria-live announcements, bound labels, keyboard flow, current-location stub.
- **Should:** status messaging via `[data-testid="geo-status"]`, minimal caching to reuse recent geocoder results.
- **Won't (S5):** production provider keys, street-level turn narration, non-Manhattan content, mobile polish beyond current breakpoints.

## Selectors & A11y (from selectors.md v0.4)
- Inputs: `[data-testid="geo-from"]`, `[data-testid="geo-to"]` with `<label for>` bindings and `aria-expanded`/`aria-controls` wiring.
- Listbox + options: `[data-testid="ta-list"]`, `[data-testid="geo-option"]`, active `[data-testid="ta-option-active"]` via `aria-activedescendant`.
- Current location: `[data-testid="geo-current"]` alongside `[data-testid="route-current"]` button.
- Status live region: `[data-testid="geo-status"]` (`aria-live="polite"`); reuse `[data-testid="route-msg"]` for route announcements.
- Marker highlight: `[data-testid="poi-marker-active"]` + `data-step-index` + `aria-current="step"` remain canonical.

## Backlog (split for ≤60 LOC/file)
- **GEO-ADAPTER-0 (docs):** Capture GeoAdapter/RouteAdapter interfaces, MockGeocoder/MockRouteEngine fixtures, DI sketch, high-level wiring diagram.
- **GEO-UI-1a (RED tests):** Unit/e2e contracts for typeahead open/close, arrow/enter/esc navigation, live status expectations.
- **GEO-ADAPTER-1b (GREEN):** Implement MockGeocoder covering addresses/intersections/place names within Manhattan bounds.
- **GEO-UI-1b (GREEN):** Render dropdown skeleton (listbox + options) with placeholder data, minimal styling, no keyboard polish yet.
- **GEO-UI-1c (GREEN):** Add keyboard/a11y polish, toggle `aria-expanded`, manage `aria-activedescendant`, update `[data-testid="geo-status"]`.
- **ROUTE-ADAPTER-1a (GREEN):** Implement MockRouteEngine returning linear Manhattan paths (no turn-by-turn copy).
- **ROUTE-FIND-4a (RED):** e2e contract: selected typeahead values populate From/To; Find segments, updates markers/path, announces via live region; deep-link/history intact.
- **ROUTE-FIND-4b (GREEN):** Wire adapters into Find handler; steps/markers update from adapter output.
- **ROUTE-FIND-4c (GREEN):** Ensure UI reuse for SVG path, marker highlights, `route-msg` copy remains accurate.
- **GEO-CUR-LOC-1a (RED):** Contract for `[data-testid="geo-current"]` button behavior and aria messaging.
- **GEO-CUR-LOC-1b (GREEN):** Stubbed geolocation injects mock lat/lng, handles denial/timeouts with status copy.
- **DEV-ENV-1 (docs):** Add `.env.example`, provider flags, Quickstart/README guidance for geocoder/route adapter toggles.

## Definition of Done
- All new unit/e2e tests green; `npm run typecheck` clean.
- Each slice respects ≤60 LOC/file and declared file list; one commit per story.
- Decisions log + project history updated on every GREEN.
- No hidden changes outside story scope; selectors stay aligned with `docs/selectors.md v0.4`.

## Risks & Mitigations
- **LOC creep:** backlog already split by adapter/UI slices; escalate with Ambiguity Card if scope grows.
- **Selector drift:** selectors.md v0.4 remains source of truth; tests must reference documented hooks.
- **Adapter sprawl:** single DI point defined in GEO-ADAPTER-0 keeps wiring centralized.
- **Mock realism:** fixtures stay Manhattan-bound; add notes if coverage gaps found during tests.

## Estimate
- ~10–12 prompts (including RED/GREEN docs/tests) to reach DoD.
- Confidence: High–Medium given prior routing groundwork and clarified selectors.
