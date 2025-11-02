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

## Dependency Injection
- Single portal: `window.App.adapters = { geo, route }` set during home init.
- Test harness swaps mocks by assigning to `window.App.adapters` before UI scripts run.
- Production keys deferred; `.env` flags (Sprint 05) remain `mock` only.

```
UI (geo inputs, buttons)
  │
  ├── Typeahead controller → adapters.geo.search / reverse
  └── Find handler → adapters.route.walk
        └→ existing helpers (buildRoute → renderRoute → markers/path/live msg)
```

**Note:** Any adapter change requires updating this document plus selectors.md contracts.
