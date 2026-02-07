# Sprint‑06 Plan — Provider‑ready routing (fixture‑backed) + turn list + LOC relief

**Dates:** TBD (one‑week sprint)  
**Owner:** Stephen (PM) · ChatGPT “Certification Coach” (Scrum/QA prompts) · Copilot (dev)  
**Version:** v0.6 (selectors.md v0.5)

## Sprint Goal (what “done” means)
Deliver a **provider‑ready** geocoding & routing layer that works end‑to‑end in our app **without live network calls in CI**, render a basic **turn list** (accessible), and reduce **Program.cs LOC pressure** by extracting small adapter files — all while keeping the full Playwright suite and typecheck **green**.

### Out of scope (explicitly)
- Street‑following geometry from a real provider in CI (we’ll use **fixtures** to simulate).  
- Full “Google‑Maps‑like” instructions; we’ll render a **basic turn list** using adapter step objects.  
- Big refactors (Razor/JS split); only the **smallest extractions** needed to keep ≤60 LOC fences.

## Read order (for every slice)
1. Protocol.md → 2. selectors.md (v0.5) → 3. Copilot‑Instructions.md → 4. Adapters.md → 5. code‑review.md → 6. project‑history.md

## Definition of Done (per slice)
- **Tests:** Target spec + `npm run e2e:auto` green; `npm run typecheck` green.  
- **Docs:** Append Decisions line to `docs/code-review.md`; ≤4‑line micro‑entry to `docs/project-history.md`.  
- **LOC:** ≤60 LOC change in the allowed file(s). One file per GREEN unless the slice explicitly allows 2.  
- **Ask‑before‑act rule:** Copilot asks any question likely to raise success ≥ **5%** before coding.

## New selectors (predeclared in selectors.md v0.5 — already aligned)
- `data-testid="turn-list"`, `data-testid="turn-item"`, `data-testid="route-warn"`

---

## Backlog (one‑prompt, lock‑step). Order is deliberate.

**Fixtures:** Playwright interception helper `routeFromFixture()` and sample geo/route payloads land in **PROV-FIXTURES-1a**; until then, suites stay on mocks.

### 0) **DOC-GATE-S6-REV — provider fixtures + 429 governance + LOC relief (docs‑only)**
**Story/Goal:** Lock guardrails before code: e2e uses **Playwright interception + canned fixtures**; never live HTTP in CI. Define 429/timeout fallback (flip to mock + log). Note LOC relief: adapter code in small files, not Program.cs.  
**Constraints:** Edit Protocol.md, Adapters.md, selectors.md header note, Copilot‑Instructions.md, logs. ≤120 LOC total.  
**After‑green:** Commit `[schur] DOC-GATE-S6-REV — provider fixtures + 429 governance + LOC relief; suites green`. **Outcome:** PROCEED.

---

### 1) **PROV‑FIXTURES‑1a — RED contract: provider fixtures & intercept helper**
**Read:** + `tests/support/provider-fixtures.ts` (new).  
**Story/Goal:** Add a tiny helper `routeFromFixture(page, { geo, route })` that intercepts provider endpoints and serves **local JSON** fixtures. Add sample fixtures. Write RED e2e that asserts intercept is used.  
**Constraints:** Files: `tests/support/provider-fixtures.ts` (≤60), 1 e2e spec (≤60).  
**Artifacts:** `tests/fixtures/geo/*.json`, `tests/fixtures/route/*.json`.  
**After‑green:** log lines. **Outcome:** RED (expected).

### 2) **PROV‑FIXTURES‑1b — GREEN: wire intercept helper in the RED spec**
**Story/Goal:** Update the RED spec to use `routeFromFixture()` so it passes with fixtures (no app changes).  
**Constraints:** Spec only ≤30 LOC. **Outcome:** GREEN.

---

### 3) **EXTRACT‑ADAPTERS‑1 — minimal LOC relief (server or client)**
**Story/Goal:** Move adapter DI shapes out of Program.cs into small files so later slices stay ≤60 LOC.  
- Option A (server): `apps/web-mvc/Adapters/GeoProviderAdapter.cs`, `RouteProviderAdapter.cs` (interfaces + thin DI).  
- Option B (client): `wwwroot/js/adapters/geo-provider.js`, `route-provider.js` (window.App.adapters bridge).  
**Constraints:** ≤60 LOC per new file; Program.cs delta ≤30 LOC. No behavior change. **Outcome:** GREEN.

---

### 4) **GEO‑ADAPTER‑2a — RED: real geocoder adapter contract (fixture‑backed)**
**Story/Goal:** Unit/e2e specs define **normalized output** identical to MockGeocoder: `{ lat, lng, label }[]`, Manhattan clamp, timeout. **No network**; use fixtures. **Outcome:** RED.

### 5) **GEO‑ADAPTER‑2b — GREEN: implement RealGeocoderAdapter (fixture‑backed)**
**Story/Goal:** Map provider JSON → normalized shape; enforce timeouts; reuse debounce; no UI changes. **Outcome:** GREEN.

---

### 6) **ROUTE‑ADAPTER‑2a — RED: real route adapter contract (fixture‑backed)**
**Story/Goal:** Unit/e2e define path+steps normalized to our mock:  
```
{ path: Array<{lat,lng}>, steps: Array<{text, distance, duration}> }
```  
Polyline decoding (if present) happens in adapter. **Outcome:** RED.

### 7) **ROUTE‑ADAPTER‑2b — GREEN: implement RealRouteAdapter (fixture‑backed)**
**Story/Goal:** Decode polyline (fixture), map steps, Manhattan clamp, timeout + error copy reuse. **Outcome:** GREEN.

---

### 8) **ROUTE‑FIND‑4a — RED: provider wire‑up e2e (with intercept)**
**Story/Goal:** Spec drives From/To (geo), clicks Find, expects adapter path, **turn list empty** (not yet). Uses fixture intercept. **Outcome:** RED.

### 9) **ROUTE‑FIND‑4b — GREEN: minimal wire‑up using adapter layer**
**Story/Goal:** Call adapters via DI; reuse existing SVG overlay; maintain POI route parity; keep Program.cs delta ≤60. **Outcome:** GREEN.

---

### 10) **TURN‑LIST‑1a — RED: accessible turn list contract**
**Story/Goal:** Spec asserts `#turn-list` renders `turn-item`s with ordered semantics, `aria-live="polite"` updates, and keyboard focus cycling. **Outcome:** RED.

### 11) **TURN‑LIST‑1b — GREEN: render simple turn list from adapter steps**
**Story/Goal:** Render list; add `data-testid="turn-list"/"turn-item"`; announce `"Showing N turns"`. No street‑follow guarantees. **Outcome:** GREEN.

---

### 12) **RATE‑LIMIT‑OPS‑1 — docs+probe**
**Story/Goal:** Add `.env.example` flags for provider on/off; add probe spec that flips to mock after simulated 429/timeout; update README Quickstart. **Outcome:** GREEN (docs + small test).

---

## Risks & Mitigations
- **External network brittleness** → Fix: **100% fixture‑backed** e2e via Playwright interception.  
- **LOC pressure in Program.cs** → Fix: **EXTRACT‑ADAPTERS‑1** early; tighten fences.  
- **Adapter contract drift** → Fix: unit specs compare **normalized shapes** to mock contracts.  
- **429 storms/timeouts** → Fix: governance rule (one retry, flip to mock, log decision), probe test.  
- **Selector churn** → Fix: selectors already bumped to v0.5; slices must update docs first.

## Metrics (targets)
- +6–10 new specs; full suite remains **green** each slice.  
- Program.cs net delta this sprint **≤120 LOC** (because of extraction).  
- Typecheck stays **green**; no skipped tests in CI.

## Slice template (use for each prompt)
```
TITLE: <ID> — <name>
READ: Protocol.md → selectors.md → Copilot‑Instructions.md → Adapters.md
STORY + GOAL: <crisp outcome>
BEHAVIOR: <Given/When/Then + a11y + error copy>
CONSTRAINTS: files + ≤LOC + single‑file rule
ARTIFACTS: <tests/docs only as applicable>
AFTER‑GREEN: decisions line + micro‑entry
OUTCOME: PROCEED
```
