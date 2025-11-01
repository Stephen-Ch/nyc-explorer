# Protocol — UPDATED for Sprint 02 (v2)

**Keep:** prompt-only, tiny steps, TDD; ≤2 files / ≤60 LOC; Decisions log; Ambiguity Cards; Pause rule.

## Process Flow (each slice)
1) **RED** — write failing spec with clear messages (edge + error).  
2) **GREEN** — minimal change to pass.  
3) **LOG** — append one line to `/docs/code-review.md`.  
4) **PAUSE** — stop until user cue.

### Sprint Gate — Dev Loop First
> **NOTE:** Do **not** begin ROUTE-FIND-1a until TOOL-DEV-LOOP-1 (dev server watch loop) is GREEN **and** verified manually (hot reload feels solid, stop/start clean). Routing work pauses if the loop regresses.

## When ≤60 LOC isn’t enough
- **BLOCK** with an Ambiguity Card that proposes:
  - **SPLIT**: break into two smaller slices (e.g., `MAP-2a`, `MAP-2b`), *or*
  - **REFACTOR**: a tiny `REFAC-*` story (≤60 LOC) to extract helpers, then return.
- Never bypass the constraint in the same prompt.

## Testing Standards
- Prefer Playwright `expect` assertions over manual throws.
- Fix viewport (e.g., 1280×800) for UI tests that depend on layout.
- Use built-in waiting (`expect(locator).toBeVisible()`) rather than sleeps.
- **Artifacts**: optional visual smoke — store **one** PNG per UI story at `docs/artifacts/<STORY-ID>/P<NN>-map.png`, ≤500KB.

### Playwright Usage
- Primary loop: `npm run e2e:auto` (headless).
- UI loop (Sprint 04+): run `playwright test --ui --project=chromium` (exposed via `npm run e2e:ui` once TOOL-DEV-LOOP-1b lands). Keep the dev server running via `npm run dev:server`; `reuseExistingServer: true` prevents duplicate launches.
- Command snippets:
  - `npm run e2e:ui` → `playwright test --ui --project=chromium` (auto-starts the configured Playwright webServer).
  - `npm run dev:api` → `dotnet watch --project apps/web-mvc run --urls http://localhost:5000` (hot reload; stop with Ctrl+C when finished).

## Server Lifecycle (Sprint‑02 target)
- Configure Playwright `webServer` to auto‑start/stop the ASP.NET app on port **5000**; block until ready. (Add as a Sprint‑02 story.)

## Types & Schema
- Zod remains the source of truth. For TS usage, derive or mirror **types** to prevent property mismatches.
- Any schema change requires a **new story** (no silent edits).

## Selectors Contract
- Canonical selectors live in `/docs/selectors.md`. Do not invent new ones without a story.
- Sprint 04 predeclared hooks: `[data-testid="poi-marker-active"]`, `data-step-index`, `[data-testid="route-msg"]`, plus `aria-current="step"` on active markers. Treat them as frozen for the sprint.

## Leaflet Map Interaction (Canonical Pattern)
- Place an overlay container above `#map` and position button elements per POI using `map.latLngToContainerPoint`.
- Overlay controls must expose `data-testid="poi-marker"`, `role="button"`, `tabindex="0"`, and handle Enter/Space to navigate to `/poi/{id}`.
- Keep Leaflet markers for visuals only; never rely on `.leaflet-marker-icon` for navigation or testing.
- Tests target `[data-testid="poi-marker"]`; list navigation continues through `[data-testid="poi-link"]`.
- Accessibility baseline: ensure a visible `:focus-visible` ring (2px, high contrast, 2px offset) for overlay buttons.
- Prefer `await expect(locator).toBeVisible()` / `toHaveCount(n)` with Playwright defaults; avoid sleeps and keep timeouts ≤5s.
- When debugging, first check overlay counts (`locator('[data-testid="poi-marker"]').count()`), then inspect DOM via `page.evaluate`—do not mutate Leaflet internals.
- As markup grows, migrate inline HTML to Razor views while retaining selectors and behavior.

## Commit Policy
- One commit per prompt, message: `STORY — <12 words> (#tests=<N>, green=<true|false>)`.

## Execution Loop (Sprint 03)
RED → GREEN → VERIFY (full suite + typecheck) → COMMIT (one story = one commit) → LOG (Decisions + Project-History) → PAUSE.

### LOC Overflow Rule
- If estimate >50 LOC → split before starting.
- If during work you exceed 60 LOC or 2 files → REVISE or SPLIT and stop.

## Appendix — Test Timeouts & Retries
- Default Playwright timeout: expectations wait up to 5s; `page.goto` honors Playwright config (currently 30s).
- No global retries enabled; if a slice is flaky, investigate before opting into `test.retry` locally.
- Increase timeouts only when a story introduces deliberate latency (e.g., lazy loading) and document the rationale.
- Prefer targeting specific `expect` calls with `.setTimeout()` rather than raising the global limit.
- For long-running setup (e.g., map tiles), avoid exceeding 10s without product sign-off; consider adding loading indicators instead.

**End.**
