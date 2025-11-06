# Protocol — UPDATED for Sprint 02 (v2)

**Keep:** prompt-only, tiny steps, TDD; ≤2 files / ≤60 LOC; Decisions log; Ambiguity Cards; Pause rule.

## Read Order (load in sequence)
1) docs/Protocol.md
2) docs/selectors.md
3) docs/Copilot-Instructions.md
4) docs/Project.md
> Selector Gate: Before implementing UI, update selectors.md (governance section) and bump version.
> Sprint 05+: insert `docs/Adapters.md` immediately after selectors to honor DI contracts.
> Deep-link + share slices rely on the selector contracts in `docs/selectors.md` (`share-link`, `route-msg`, geo typeahead hooks).
> Sprint 06 Directions Gate: Directions UI work (DIR-UI-*) must reference selectors.md v0.6+ (dir- selectors) before adding tests or code.

## Process Flow (each slice)
1) **RED** — write failing spec with clear messages (edge + error).  
2) **GREEN** — minimal change to pass.  
3) **LOG** — append one line to `/docs/code-review.md`.  
4) **PAUSE** — stop until user cue.

<!-- PROMPT_SCHEMA_V2 -->
## Prompt Schema v2
Every prompt must surface these header fields before work begins:
- **READ** — explicit doc list already reviewed for this prompt.
- **GOAL** — single-sentence objective in the user’s words.
- **ACCEPTANCE** — measurable exit criteria (tests, docs, approvals).
- **CONSTRAINTS** — file/LOC limits, tooling expectations, and forbidden actions.
- **FILES** — canonical paths allowed this slice (even if unchanged).
- **COMMANDS** — planned shell/script invocations; note which are optional.
- **LOGGING** — required code-review/project-history updates.
- **COMMIT-ON-GREEN** — recap test matrix required before committing.
- **WHY-NOW** — why the slice exists (link to sprint plan/backlog entry).
- **DRIFT-RADAR** — risk indicators to watch (selectors, schema, env toggles).
If any header lacks data, pause and request clarification before editing.

<!-- QUARANTINE_POLICY -->
## Quarantine Policy (TTL 48h)
- Tag flakey specs/skipped tests with a quarantine note and start a 48-hour TTL clock.
- Cap quarantined items at ≤5; if adding a sixth, unblock at least one first.
- Auto-remind the user at 24h and 48h marks with current status + unblock plan.
- After TTL expires, escalate via Ambiguity Card unless explicitly re-authorized.

<!-- LOOP_STOP_RULES -->
## Loop Stop Rules
- After **2 unsuccessful iterations** (same failure or no progress), stop.
- If a command repeats an identical failure twice, stop immediately.
- Emit a **BLOCKER CARD** summarizing attempts, errors, and proposed next moves.
- Resume only after user guidance; do not silently continue looping.

<!-- COMMIT_ON_GREEN -->
## Commit-on-Green Matrix
- **Docs-only changes** → no Playwright run required; note "docs-only" in response.
- **Runtime/code changes** → run full Playwright suite + `npm run typecheck` before committing.
- Record results in the response (tests + typecheck status) prior to `git commit`.
- Never commit partial work; restage after re-running if new edits occur.

<!-- REPO_SNAPSHOT -->
## Repository Snapshot (optional pre-flight)
- When starting complex slices, capture current `git status -sb` and head commit hash.
- Store snapshot details in the response for traceability; skip if unchanged from prior prompt.

<!-- BLOCKER_CARD -->
## Blocker Card Template
- Invoke after Loop Stop Rules fire (two failed attempts or repeated failures).
- Fill every field before pausing for user direction.

```
BLOCKER CARD — <STORY-ID>
Context:
- <summary of the attempted work>
Failing specs:
- <spec name — failure detail>
Last diffs (paths only):
- <relative/path>
Top hypothesis:
- <suspected root cause>
Next experiments:
1. <minimal follow-up>
2. <backup experiment>
Snapshot:
- branch: <name>@<sha>
```

<!-- SELECTOR_CANON -->
## Selector Canon Freeze
- Treat `docs/selectors.md` as immutable during a prompt unless the user issues a dedicated selector-change request.
- Any selector update requires bumping the selectors version and logging the reason before touching runtime code.
- If a prompt risks selector drift, stop and request a dedicated selector story.

## Q-GATE — Ask Clarifying Questions (single pre-execution message)

Purpose: Only ask clarifying questions when doing so meaningfully increases the chance of success.

Thresholds
- Default: Ask if expected success lift ≥ **10%**.
- High-risk slices: Ask if expected lift ≥ **5%**.
  High-risk = DevOps/watchers/probes; new adapters/dependencies/DI; schema/data contracts; accessibility semantics/copy.
- Trivial slices (single-file UI or docs-only, ≤30 LOC): Ask only if expected lift ≥ **15%**; otherwise proceed.

Time/Volume Caps
- Spend ≤ **2 minutes** and ≤ **3 questions total**.
- Combine into **one** message. Ask **once** unless a new blocker appears.

Format
- Start with `Q-GATE:` then bullets.
- End with `If you confirm, I’ll proceed.` or `Proceeding without questions (below threshold).`

Examples
- High-risk (adapters): `Q-GATE: Swapping to GeoAdapter—do we prefer mock-only this sprint? ETA to real provider?`
- Trivial UI: `Q-GATE: Proceeding without questions (below threshold).`

### Sprint Gate — Dev Loop First
> **NOTE:** Do **not** begin ROUTE-FIND-1a until TOOL-DEV-LOOP-1 (dev server watch loop) is GREEN **and** verified manually (hot reload feels solid, stop/start clean). Routing work pauses if the loop regresses.
> **GATE:** Do not start GEO-UI or ROUTE-FIND slices until DOC-SEL-GEO is merged; tests must target the selectors above.
> **GATE:** DI adapters must match `docs/Adapters.md`; update that doc before swapping providers.
> **GATE (Sprint 06):** Provider slices stay fixture-backed (no live HTTP in CI); enforce Manhattan clamps + timeout/429 fallback to mock before wiring real adapters.
> **Gate Check (Sprint 06):** Any slice touching real providers must call out the 429 policy in `docs/Adapters.md` and log a decision plus project-history micro-entry.

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

## Sprint 6 Workflow Hooks
- Definition of Done chain: follow `docs/Workflow-Tweaks-S6.md#definition-of-done-chain` on every slice.
- Stop-the-line triggers: escalate immediately if any `docs/Workflow-Tweaks-S6.md#stop-the-line-triggers` condition fires.

**End.**
