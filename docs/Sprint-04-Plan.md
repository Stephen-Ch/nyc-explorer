# Sprint 04 Plan — Archived

This file has been archived to reduce clutter in `docs/`.

Current location:
- `docs/archive/2026-01-11/sprints/Sprint-04-Plan.md`
# Sprint 04 — From/To Routing & DevOps Loop (v2)

**Dates:** TBD (target 1–2 days)  
**Mode:** Prompt‑only tiny‑step TDD · ≤2 files/≤60 LOC per slice · RED→GREEN→LOG→PAUSE  
**Assumptions:** None.  
**Selectors Contract (new/confirmed):**
- Inputs: `[data-testid="route-from"]`, `[data-testid="route-to"]`, `[data-testid="route-find"]`
- Route list: `#route-steps` (container), `[data-testid="route-step"]` (items), `[data-step-index]` (order badge)
- Marker highlight: `[data-testid="poi-marker-active"]` with `data-step-index` and `aria-current="step"`
- No‑route UX: `[data-testid="route-msg"]`

---

## Goals
1) Ship working **From/To** routes from the current POI set.  
2) Lock a **smooth DevOps loop** (run, watch, test) so future slices iterate faster.  
3) Keep the **≤3 per block** guardrail deterministic across orders.  
4) Preserve all green tests and typecheck throughout.

---

## Story Order (DevOps loop scheduled first)

### TOOL‑DEV‑LOOP‑1a — **RED**: script presence & watch probe
- **Test/Check:** Add a tiny node/TS check (or manual verification step) that `npm run dev:server` exists and launches server on `http://localhost:5000` without Playwright.
- **Behavior:** Script uses `dotnet watch --urls http://localhost:5000` in `apps/web-mvc` with hot reload enabled for Razor/views.
- **Constraints:** `package.json` only (≤10 LOC).
- **GREEN:** Run `npm run dev:server`, hit `/` in browser; stop cleanly (Ctrl‑C).

### TOOL‑DEV‑LOOP‑1b — **GREEN**: VS Code one‑key run
- **Behavior:** Add `.vscode/tasks.json` and `.vscode/launch.json` so **F5** runs `dotnet watch` and attaches debugger.
- **DoD:** Pressing F5 starts server, hot reload of Razor/Program.cs confirmed by visual change; Stop ends process.
- **Constraints:** 2 files ≤60 LOC total.

### TOOL‑DEV‑LOOP‑2 — **GREEN**: Playwright UI loop
- **Behavior:** Add `npm run e2e:ui` (`playwright test --ui`) to quickly re‑run targeted specs while dev server is running.
- **DoD:** With dev server up, `npm run e2e:ui` runs tests without spawning a second server (config uses `reuseExistingServer: true`).

### CI‑PIPELINE‑1 — **GREEN**: GitHub Actions for build+tests
- **Behavior:** Add `.github/workflows/ci.yml` to build ASP.NET, install Playwright browsers, run `npm ci && npm run e2e`.
- **DoD:** PRs/commits show a green “CI” check; failing tests upload Playwright HTML report as artifact.
- **Constraints:** 1 file; keep YAML minimal.

> **Pause** (confirm DevOps loop feels smooth).

---

### ROUTE‑FIND‑1a — **RED**: click “Find Route” runs new helper
- **E2E:** Asserts typing into From/To then clicking Find calls a client helper `routeSegment(from,to,pois)` and renders `#route-steps` + marker highlights.
- **Failure now:** Missing handler/helper.

### ROUTE‑FIND‑1b — **GREEN**: implement `routeSegment` + wire click
- **Unit tests:** Ascending vs. descending steps (From appears after To); missing/blank `route_id` ignored gracefully; fallback when `order` missing; POIs without coords skipped without throwing; respects ≤3 per block.
- **E2E:** Steps render in order with `[data-step-index]`; markers gain `[data-testid="poi-marker-active"]` + `aria-current="step"`.
- **Constraints:** ≤2 files (TS helper + Program.cs wiring).

### ROUTE‑FIND‑2a — **RED**: mismatch UX
- **E2E:** When no path found, `#route-steps` clears (0 items), active markers drop, and `[data-testid="route-msg"]` shows a concise message.

### ROUTE‑FIND‑2b — **GREEN**: implement mismatch UX
- **Behavior:** Clear steps, remove active markers, set route message (`[data-testid="route-msg"]`) with helpful copy.

### ROUTE‑FIND‑3 — **GREEN**: highlight parity & keyboard
- **E2E:** Active markers toggle `[data-testid="poi-marker-active"]`, expose `data-step-index`, remain tabbable with focus ring, set `aria-current="step"`, and Enter triggers nav to detail.

---

## Testing Requirements
- **Unit:** `routeSegment` handles: (a) ascending order, (b) descending order (`From` after `To`), (c) missing/blank `route_id` filtered safely, (d) missing `order` skip or stable fallback, (e) POIs without coords ignored without throwing, (f) ≤3 per block cap.
- **E2E:** (1) Find Route happy path (steps + active markers), (2) mismatch clears UI with `route-msg` and empties route/marker state, (3) search filter recomputes steps and active markers, (4) keyboard/ARIA parity (`aria-current="step"`, focus ring, Enter nav) on active markers.

---

## Risks & Mitigations
- **Race between dev server & Playwright:** `reuseExistingServer: true` already configured; ensure UI run doesn’t spawn a second instance.
- **LOC pressure:** Split ROUTE‑FIND‑1b if needed (wire then render).
- **Selector drift:** selectors.md updated before any UI slice; no renames mid‑sprint.

---

## Definition of Done (Sprint 04)
- All **unit + e2e tests** GREEN (including new route cases).
- DevOps: `npm run dev:server`, F5 debugging, and `npm run e2e:ui` feel fast and reliable.
- Docs: selectors.md (v0.3), Protocol.md (“Leaflet overlay pattern” and “Dev loop”), Sprint‑04‑Plan logged.
- Decisions line + micro‑entry after each GREEN; commit & push every slice.

---

## Decisions Lines (copy/paste template)
- `[YYYY-MM-DD HH:MM] nyc-explorer/main TOOL-DEV-LOOP-1a — add dev server script, red→green (#tests=?, green=true)`
- `[YYYY-MM-DD HH:MM] nyc-explorer/main ROUTE-FIND-1b — routeSegment + wiring, tests green (#tests=?, green=true)`

## Micro‑Entry Template (project-history.md)
```
### [YYYY-MM-DD] TOOL-DEV-LOOP-1a — Dev server loop
In order to iterate faster, I added `npm run dev:server` (dotnet watch) and verified hot reload.
Considerations: Works with Playwright’s `reuseExistingServer`; prefer `e2e:ui` for targeted runs.
Evidence: #tests=?, green=true
Files: package.json
```
