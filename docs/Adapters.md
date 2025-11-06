# Adapters — Geo & Route (Sprint 05)

**Purpose:** Keep UI slices provider-agnostic by standardizing geocoding and routing adapters.

## Interfaces (TypeScript)
```ts
export type GeoKind = 'address' | 'intersection' | 'place';

export interface GeoResult {
  id: string;
  label: string;
  lat: number;
  lng: number;
  kind: GeoKind;
}

export interface GeoAdapter {
  search(query: string): Promise<GeoResult[]>;
  reverse(lat: number, lng: number): Promise<GeoResult | null>;
}

export interface RouteAdapter {
  walk(from: { lat: number; lng: number }, to: { lat: number; lng: number }): Promise<{
    polyline: Array<{ lat: number; lng: number }>;
    poiIds?: string[];
  }>;
}
```
- Manhattan-only expectation: adapters must reject results outside borough limits.
- Results remain deterministic for tests; no turn-by-turn narration.

## Fixtures
- **MockGeocoder:** file-backed responses; filters to Manhattan bounds; caches by query in memory.
- **MockRouteEngine:** deterministic Manhattan paths; optional POI snapping for existing route markers.
- **Provider fixtures (Sprint 06):** JSON payloads mirroring the real provider’s geo search and walking route responses; used by Playwright interception helpers so CI never calls the network.

## Sprint 06 — Provider-ready contracts
- **RealGeocoderAdapter** (planned): resolves via fixtures or live provider, returning the same normalized array as `MockGeocoder` — `{ id, label, lat, lng, kind }[]` clamped to Manhattan with a per-call timeout + single retry before falling back to the mock adapter.
- **RealRouteAdapter** (planned): decodes provider polylines into `{ lat, lng }[]` and exposes `steps: Array<{ text: string; distance: string; duration?: string }>` so UI and tests share the mock contract; Manhattan bounds + timeout mirrored from the geocoder, with fallback to the mock implementation on 429/timeout.

## Dependency Injection
- Single portal: `window.App.adapters = { geo, route }` set during home init.
- Test harness swaps mocks by assigning to `window.App.adapters` before UI scripts run.
- Production keys deferred; `.env` flags (Sprint 05) remain `mock` only.

## Environment Flags (Sprint 06)
- `.env` → `APP_PORT` controls the ASP.NET dev server port (defaults to 5000 when unset).
- `.env` → `GEO_TIMEOUT_MS` populates `ProviderConfig.geoTimeoutMs`; `fetchJsonWithTimeout` in the geocoder adapter uses it before falling back to the mock.
- `.env` → `GEO_PROVIDER` and `ROUTE_PROVIDER` toggle which adapters `Program.cs` injects; default to `mock`. Real provider values must fall back to `mock` (and log) after a timeout or HTTP 429.
- Real provider keys (`GEO_API_KEY`, `ROUTE_API_URL`) remain optional; leave blank when using mocks or fixtures.

### Deep-link params (adapter routes)
| Param | Description |
| --- | --- |
| `gfrom` | `lat,lng` for the adapter route origin |
| `gto` | `lat,lng` for the adapter route destination |
| `gfl` | URL-encoded label for the origin (announced in the UI) |
| `gtl` | URL-encoded label for the destination |
| (derived) | When both pairs are present, the UI restores the adapter path overlay without POI markers |

```
UI (geo inputs, buttons)
  │
  ├── Typeahead controller → adapters.geo.search / reverse
  └── Find handler → adapters.route.walk
        └→ existing helpers (buildRoute → renderRoute → markers/path/live msg)
```

**Note:** Any adapter change requires updating this document plus selectors.md contracts.

### Rate Limit (429) Policy
- **Scope:** Applies to real Geo and Route adapters in Sprint 06+.
- **Detection:** Treat HTTP 429 responses and provider-specific "too many requests" bodies as rate limits.
- **Immediate action:** Swap the affected adapter back to its mock fixtures for the session and emit a single `provider-rate-limit` log event.
- **Recovery:** Allow retries only after the user triggers a new Find/typing interaction or the cooldown elapses quietly (`GEO_RATE_LIMIT_COOLDOWN_MS=30000`, `ROUTE_RATE_LIMIT_COOLDOWN_MS=60000`).
- **UX copy:** Live region message remains plain text: `Using cached results due to provider limits.` (no HTML).
