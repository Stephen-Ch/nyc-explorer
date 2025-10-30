# Sprint 02 Plan — NYC Explorer

**Goal:** Complete preflight infrastructure, then deliver POI detail pages, client search, and expanded content (Union Square + Flatiron).

---

## Ordered Backlog

### Preflight (remove friction from Sprint 01)
- **TOOL-1** ✅ — Playwright `webServer` auto-start/stop (eliminates manual server lifecycle)
- **TOOL-2** ✅ — TypeScript + `@types/node` (zero typecheck errors, catches type bugs early)
- **SCHEMA-TYPES** — Generate TS types from Zod POI schema (prevents property drift like `coords`/`coordinates`)

### Feature Work (core MVP flows)
- **ROUTE-1** — POI detail page routing (server route `/poi/{id}`, link from map/list)
- **DETAIL-1** — POI detail page rendering (full description, images, metadata, back-to-map link)
- **ROUTE-2** — Handle 404 for invalid POI IDs (test edge cases, friendly error page)
- **SEARCH-1** — Client-side POI filter (search box, filter by name/tags, live update map + list)
- **DATA-5** — Expand to 10 total POIs (add 7 more Union Square + Flatiron locations)

---

## Definition of Done (each story)
- ✅ RED test committed (failing with clear message)
- ✅ GREEN implementation committed (minimal change to pass)
- ✅ All e2e tests pass (`npm run e2e`)
- ✅ TypeScript typecheck passes (`npm run typecheck`)
- ✅ One-line entry appended to `/docs/code-review.md`
- ✅ Micro-entry (≤5 lines) appended to `/docs/project-history.md`
- ✅ **PAUSE** — await user cue before next story

---

## Constraints (per Protocol)
- ≤2 files edited per story
- ≤60 LOC total per story
- Test-first: RED → GREEN → LOG → PAUSE
- No schema/selector changes without explicit story
- Use canonical selectors from `/docs/selectors.md`

---

## Selectors (link)
See `/docs/selectors.md` for canonical test selectors. Do not invent new ones without updating that registry first.

---

## Out of Scope (Sprint 02)
- Admin CMS, user accounts, payments
- AR/VR features, offline mode
- Multi-borough content (Manhattan only)
- Route variants (single Union Square route for now)
- Backend database (keep JSON file for MVP)

---

## Risks & Mitigations
- **Risk:** Detail page routing conflicts with static file serving  
  **Mitigation:** Use `/poi/{id}` prefix, test collision edge cases

- **Risk:** Client search performance degrades with 100+ POIs  
  **Mitigation:** Start simple (filter array), optimize later if needed

- **Risk:** Image URLs in POI data may break (external sources)  
  **Mitigation:** Validate URLs in schema test, use placeholder fallback in UI

- **Risk:** TypeScript types drift from Zod schema  
  **Mitigation:** SCHEMA-TYPES story generates types from single source of truth

---

## Precedence (story dependencies)
- **SCHEMA-TYPES** before any feature work (prevents type mismatches)
- **ROUTE-1** before **DETAIL-1** (routing must work before rendering)
- **DETAIL-1** before **ROUTE-2** (need working detail page before testing 404)
- **SEARCH-1** can run parallel to **DATA-5** (no dependency)

---

**End of Sprint 02 Plan**
