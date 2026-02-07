# Test Catalog — NYC Explorer

## Commands
- E2E suite: `npm run e2e:auto`
- Schema suite: `npm run schema`
- Typecheck: `npm run typecheck`

## Degraded Green Gate (no Playwright)
If Playwright cannot run in the current environment (locked-down browser policies, missing dependencies, CI constraints), treat the following as a temporary “degraded Green Gate” until e2e coverage can be restored:
- `npm run typecheck`
- `npm run schema`
- `dotnet build apps/web-mvc/NYCExplorer.csproj`

Record the reason and remediation plan in `docs/status/tech-debt-and-future-work.md`.

## Test areas

### E2E (Playwright)
Located in `tests/e2e/`. Covers:
- Home map/list behavior, markers, and accessibility hooks
- Deep links and share links
- Geocoding typeahead behaviors (debounce, timeout, adapter modes)
- Routing UI, route steps, and turn list semantics
- Error handling for POI load and provider failures

### Schema validation
Located in `tests/schema/`. Covers:
- `content/poi.v1.json` schema expectations and contract checks

### Meta checks
Located in `tests/meta/`. Covers:
- Repository-level safety checks (selectors/log integrity and related guardrails)

Last updated: 2026-01-11
