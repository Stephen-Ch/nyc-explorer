# NYC Explorer — Project Charter (v0.1)

**One‑liner:** A Manhattan‑only, map‑based walking guide—launching around **Union Square + Flatiron**—with curated walking routes that cap density at **≤ 3 POIs per block frontage**.

---

## Goals (v0.1)
- Interactive **map + list** for Manhattan POIs; **detail pages** per POI.
- **Union Square “core” walking route** that obeys the ≤3‑per‑block rule.
- **Content schema v1** + validation tests to lock the data contract.
- **Playwright e2e** (happy, edge, error) + CI wiring.

## Non‑Goals (v0.1)
- Admin CMS, AR/VR, offline packs, payments, multi‑borough content.

---

## Domain constraints
- **Geography:** Manhattan only for v0.1.
- **Launch focus:** Union Square + Flatiron District.
- **Routing density:** ≤ 3 POIs per block frontage; overflow → new **route variant** (e.g., `USQ-N-v2`).
- **Blocks:** Prefer curb‑to‑curb blocks; avoid mid‑block backtracking; prefer signalized crossings.

---

## Stack & structure
- **App:** ASP.NET Core 8 MVC + TypeScript UI (Leaflet + OSM tiles).
- **Data:** `content/poi.v1.json` (JSON) + optional routing fields; SQLite (dev), SQL Server (prod).
- **Tests:** Playwright (Chromium) for e2e; TS/Zod or .NET model tests for schema.
- **Folders:**

```
apps/web-mvc/           # web app
packages/content-schema # schema + validators
content/poi.v1.json     # data (Manhattan)
tests/                  # e2e + schema tests
docs/                   # process docs + artifacts
```

---

## Content schema v1 (excerpt)
Minimal JSON to unblock content + UI. Keep additive‑only changes in v1.x; breaking changes go to v2 later.

```json
{
  "id": "trinity-church-001",
  "name": "Trinity Church",
  "summary": "Historic parish at Broadway and Wall Street (1846 Gothic Revival)",
  "description": "…markdown…",
  "coords": { "lat": 40.7081, "lng": -74.0121 },
  "neighborhood": "Financial District",
  "tags": ["architecture","colonial","cemetery"],
  "year": 1846,
  "sources": [{ "title": "NYC Landmarks", "url": "https://…", "publisher": "NYC LPC" }],
  "images": [{ "src": "/images/trinity.jpg", "credit": "NYPL", "license": "public-domain" }],
  "borough": "Manhattan",
  "area": "Union Square",
  "block": "Broadway 14th→15th",
  "route_id": "USQ-core-001",
  "order": 3
}
```
> **Routing fields** are optional in v1; required where a POI belongs to a published route.

---

## Story seeds (active)
- **MAP-1:** Map + list from `poi.v1.json` (Manhattan scope).
- **ROUT-1:** Build Union Square core walking route (≤3 per block) with `route_id` + `order`.
- **POI-2:** `/poi/:id` detail (title, summary, map focus, sources, image placeholder on miss).
- **SRCH-3:** Client‑side search (tags/neighborhood) + deep‑link query param.
- **DATA-4:** Schema validation (TS/Zod or .NET) + CI.
- **OPS-5:** GitHub Actions (build + tests + artifact).

---

## Definition of Done (per story)
- **Behavior:** 3–6 Given/When/Then including **edge + error**.
- **Tests:** Playwright e2e GREEN; schema tests GREEN.
- **UX:** Mobile-friendly; title + meta/alt present; a11y checks for obvious issues.
- **Docs:** Update README if contract changes; append one line in `/docs/code-review.md`.
- **PR:** Uses Code Review Template; size ≤ 2 files / ≤ 60 LOC unless refactor.

---

## Dev quickstart
```bash
# install e2e deps
npm ci && npx playwright install chromium
# build & run the app
cd apps/web-mvc && dotnet restore && dotnet build && dotnet run
# in another shell: run e2e
BASE_URL=http://localhost:5000 npx playwright test --project=chromium
```

---

## Copilot working prompt (paste)
```
READ: /docs/Protocol_10-24-25.md, /docs/code-review.md (last 3 lines), /docs/Playbook_10-24-25.md, /docs/Copilot-Instructions_10-24-25.md
STORY: MAP-1 — Render map + list from content/poi.v1.json (Manhattan only; focus Union Square + Flatiron)
BEHAVIOR (incl. edge + error):
- Given the home route loads in Manhattan scope
- When the app fetches poi.v1.json
- Then the map renders markers and a list filtered to Union Square + Flatiron; clicking a POI opens its detail page
- (edge) Given a 2s fetch delay, a skeleton/loader shows and interaction remains responsive
- (error) Given a missing image, a placeholder appears and a non-fatal warning is logged
CONSTRAINTS: ≤2 files, ≤60 LOC; tests‑first; obey ≤3‑per‑block in ROUT‑1
ARTIFACTS: screenshots to docs/artifacts/MAP-1
AFTER-GREEN: append the Decisions line and reply PROCEED/REVISE/BLOCK
```

---

## Open questions
- Tile provider: stick with **OSM** or use **Mapbox** keys?
- Image policy: public‑domain/CC‑BY only vs allow AI‑generated placeholders in v0.1?
- CI runner: Ubuntu default OK?
- Do we lock minimum mobile breakpoints now, or defer to v0.2?
