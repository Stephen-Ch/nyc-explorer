# NYC Explorer (Manhattan) — v0.1

**One‑liner:** A Manhattan‑only, map‑based walking guide launching around **Union Square + Flatiron**, with curated walking routes capped at **≤ 3 POIs per block frontage**.

---

## TL;DR
- **Scope:** Manhattan only (v0.1). Launch focus: **Union Square + Flatiron**.
- **Rule:** Routes enforce **≤ 3 POIs/block**; overflow becomes a new route variant.
- **Goal:** Map + list + POI details from a stable **JSON schema v1**; Playwright e2e + schema tests.

## Quickstart
```bash
# e2e deps
npm ci && npx playwright install chromium
# run the app (ASP.NET Core 8 MVC)
cd apps/web-mvc && dotnet restore && dotnet build && dotnet run
# in another shell: run e2e
BASE_URL=http://localhost:5000 npx playwright test --project=chromium
```

**Simplified (Sprint 02+):**
- Run tests + auto server: `npm run e2e:auto`
- Typecheck: `npm run typecheck`
- Visual artifacts live in `docs/artifacts/` (map/detail smoke)

## Scope
- Manhattan-only (Union Square + Flatiron), desktop MVP.

## Read Order (start of session)
1) `/docs/Project.md`
2) `/docs/Code-Review-Guide.md`
3) `/docs/code-review.md` (last 3 lines)

## Guardrails (anti‑guessing)
- **Ambiguity → BLOCK** (return an Ambiguity Card; no code).
- **Fence:** ≤2 files / ≤60 LOC per prompt.
- **Tests‑first:** Spec goes red before implementation.
- **Schema/Selector freeze** unless a dedicated story authorizes changes.
- **Diff preview** required before commit; **Decisions log** appended after GREEN.

## Story seeds
- **MAP-1:** Map + list from `content/poi.v1.json` (Manhattan scope).
- **ROUT-1:** Union Square core route honoring **≤3/block** (`route_id` + `order`).
- **POI-2:** `/poi/:id` detail (title, summary, map focus, sources, placeholder on missing image).
- **SRCH-3:** Client search (tags/neighborhood) + deep‑link query param.
- **DATA-4:** Schema validation (TS/Zod or .NET) + CI.

## Repo sketch
```
apps/web-mvc/           # ASP.NET Core MVC app
packages/content-schema # schema + validators
content/poi.v1.json     # POIs (Manhattan)
tests/                  # e2e + schema
docs/                   # process + artifacts
```

**More details:** See `/docs/Project.md` and `/docs/Code-Review-Guide.md`.
