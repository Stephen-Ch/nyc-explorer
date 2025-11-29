# Architecture – NYC Explorer

## Module Boundaries

### Web MVC (`apps/web-mvc/`)
- Controllers handle routing and view rendering
- Static files served from `wwwroot/`
- Razor views for server-rendered pages

### Content (`content/`)
- `poi.v1.json` — POI data with schema validation
- Additive-only changes in v1.x; breaking changes go to v2

### Tests (`tests/`)
- Playwright e2e tests
- Schema validation tests
- Meta tests for process compliance

## Patterns

### Leaflet Map Interaction
- Place an overlay container above `#map`
- Position button elements per POI using `map.latLngToContainerPoint`
- Overlay controls expose `data-testid="poi-marker"`, `role="button"`, `tabindex="0"`
- Tests target `[data-testid="poi-marker"]`

### Adapters (Geo & Route)
- Single portal: `window.App.adapters = { geo, route }`
- Test harness swaps mocks via `window.App.adapters`
- Production keys deferred; `.env` flags remain `mock` only

### Error Handling
- POI fetch errors display in `[data-testid="poi-error"]` with `aria-live="polite"`
- Timeouts handled with fallback to mock adapters
- Rate limits (429) trigger swap to fixtures for session

## Constraints
- **Geography:** Manhattan only
- **Routing density:** ≤3 POIs per block frontage
- **File limits:** ≤2 files, ≤60 LOC per change
