# R-040 — Along-Route Detour Feasibility

**Date:** 2026-03-05  
**Status:** Open  
**Author:** Research pass — automated evidence sweep  

---

## Purpose

Determine whether the current routing stack can support the Eric-story requirement
of "show me events/POIs that are ≤2 blocks (~280 m) from my walking route", and
if not, what is the minimum work required to build it.

---

## Scope

- Current routing provider model (mock vs. real)  
- Polyline geometry format and handling  
- Distance computation: straight-line vs. street-walk  
- `route.walk()` stub capabilities  
- Fixture structure (Union Sq → Bryant Park example)  
- Missing: nearest-on-line, corridor/buffer query, spatial indexing  

Files examined:  
- `apps/web-mvc/wwwroot/js/adapters.js`  
- `apps/web-mvc/wwwroot/js/directions.js`  
- `apps/web-mvc/wwwroot/js/route-bootstrap.js`  
- `tests/fixtures/route/provider-union-to-bryant.json`  
- `tests/fixtures/overlay/route-happy.json`  
- `tests/fixtures/route/provider-steps-only.json`  
- `tests/fixtures/overlay/route-missing-polyline.json`  

---

## Evidence

### C15 — Routing provider model

From `adapters.js` lines 9-17:

```js
const geoProvider  = pick(cfg.geoProvider,  'mock');
const routeProvider = pick(cfg.routeProvider, 'mock');
const config = {
  geoProvider,
  routeProvider,
  geoTimeoutMs:  coercePositive(cfg.geoTimeoutMs,  3200),
  routeTimeoutMs: coercePositive(cfg.routeTimeoutMs, 3200),
  geoMock:   coerceBool(cfg.geoMock,   geoProvider  === 'mock'),
  routeMock: coerceBool(cfg.routeMock, routeProvider === 'mock'),
};
```

- `routeProvider` defaults to `'mock'`.  
- Real-provider path: `config.routeProvider` is used as the POST endpoint URL.
  The adapter accepts any URL — it is provider-agnostic at the config level.  
- Recognised named providers: only `'mock'` is handled specially; any non-empty
  non-`'mock'` string is treated as a URL (line 275: `const providerUrlFromConfig`).

**Implication:** No named Google / OSRM / Mapbox / GraphHopper constants exist
yet. The app would speak to any provider whose response matches the expected shape.

### C15 — Polyline handling in adapters.js

`decodePolyline()` (line 185) handles Encoded Polyline Algorithm (Google format).  
Polyline property resolution hierarchy (lines 228-231):

```js
const polyline = route?.polyline ?? {};
if (Array.isArray(polyline?.coordinates))
  rawPath = polyline.coordinates.map((coord) => coord?.latLng ?? coord);
else if (typeof polyline?.encodedPolyline === 'string')
  rawPath = decodePolyline(polyline.encodedPolyline);
else if (Array.isArray(route?.polyline))
  rawPath = route.polyline;
```

Three accepted shapes:
1. `polyline.coordinates[]` with `{ latLng: { latitude, longitude } }` objects ← Google Routes API v2  
2. `polyline.encodedPolyline` string ← Google Routes API v1 / Directions API  
3. `route.polyline[]` flat array ← legacy ad-hoc  

**Clamp:** `readNode()` clamps all coordinates to NYC bounding box
`[40.4774–40.9178, -74.2591 – -73.7004]` — safe for NYC-only use.

### C15 — `route.walk()` stub

From `adapters.js` line 390:

```js
if (typeof route.walk !== 'function')
  route = {
    ...route,
    walk: async (from, to) => ({
      nodes: [from, to],
      length_m: computeLength(from, to)
    })
  };
```

`computeLength()` (lines 110-117) = **haversine straight-line formula**:

```js
const computeLength = (from, to) => {
  const rad = (deg) => deg * Math.PI / 180, R = 6371000;
  const dLat = rad(to.lat - from.lat), dLng = rad(to.lng - from.lng);
  const a = Math.sin(dLat/2)**2 + Math.cos(fromLat)*Math.cos(toLat)*Math.sin(dLng/2)**2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c; // metres, straight line only
};
```

The stub `route.walk()` returns ONLY straight-line meters — it does **not**:
- Walk along actual streets  
- Return intermediate waypoints  
- Snap a point to the nearest street  

### C16 — Fixture structure: provider-union-to-bryant.json

```json
{
  "routes": [{
    "polyline": {
      "coordinates": [
        { "latLng": { "latitude": 40.7359, "longitude": -73.9911 } },
        { "latLng": { "latitude": 40.7420, "longitude": -73.9870 } },
        { "latLng": { "latitude": 40.7460, "longitude": -73.9850 } },
        { "latLng": { "latitude": 40.7536, "longitude": -73.9832 } }
      ]
    },
    "legs": [{ "steps": [
      { "navigationInstruction": {"instructions": "Head north on Broadway"},
        "startLocation": { "latLng": { "latitude": 40.7359, "longitude": -73.9911 } },
        "distanceMeters": 320,
        "duration": {"text": "4 min"} },
      { "navigationInstruction": {"instructions": "Turn right toward Bryant Park"},
        "startLocation": { "latLng": { "latitude": 40.7530, "longitude": -73.9840 } },
        "distanceMeters": 120,
        "duration": {"text": "2 min"} }
    ]}]
  }]
}
```

This is the **only** fixture with a real polyline. 4 nodes spanning Union Sq to
Bryant Park (~2.0 km). Format is Google Routes API v2 shape.

Other fixtures:
- `route-happy.json` — overlay test fixture (no external routing call)  
- `route-missing-polyline.json` — error path fixture  
- `provider-steps-only.json` — steps without polyline (degenerate path)  

### C17 — Gap scan: detour / corridor / buffer logic

Command: `Select-String -Path "apps/web-mvc/wwwroot/js/*.js" -Pattern "distance|detour|buffer|corridor|nearest|polyline|along|snap|haversine|turf"`

Found:
- `distance` / `parseDistance` — per-step distance extraction only (from provider response)  
- `polyline` — property name only (reading provider response; no geometry processing)  
- `computeLength` — straight-line only  
- `route.walk` — straight-line stub only  

**NOT found:**
- `nearest` point-on-line  
- `detour` / `buffer` / `corridor`  
- `snap` (to street network)  
- `along` (along a polyline distance)  
- `turf` (Turf.js)  
- Any spatial indexing  

### C18 — Third-party spatial libraries

Command (JS file scan): `Select-String -Path "apps/web-mvc/wwwroot/js/*.js" -Pattern "turf|rbush|kdbush|geojson|proj4|jsts"`  
**Result: ZERO MATCHES.**

`git ls-files` confirms no Turf.js, no rbush, no k-d tree library in the repo.

---

## Summary

| Capability | Current state | Gap |
|------------|--------------|-----|
| Receive polyline from provider | ✅ Full — 3 formats supported | — |
| Decode encoded polyline (Google) | ✅ | — |
| Per-step distance (meters) | ✅ | — |
| Straight-line distance (haversine) | ✅ `computeLength()` | Only approximation |
| Street-walk distance (A→B) | ❌ Stub only — straight-line | Need OSRM/Valhalla walking or Google Routes walking mode |
| Nearest point on polyline | ❌ Absent | Need point-on-line algorithm |
| Corridor query (POI within N m of route) | ❌ Absent | Need nearest-on-polyline + threshold filter |
| Spatial library | ❌ None | Turf.js (~100 KB) would cover all geometry needs |

---

## Feasibility

### Option A — Pure client-side (Turf.js)

1. Add **Turf.js** CDN (or bundle `@turf/nearest-point-on-line` + `@turf/distance`: ~40 KB min+gz).  
2. After provider returns polyline → convert to GeoJSON LineString.  
3. For each POI lat/lng: `nearestPointOnLine(routeLine, poiPoint)` → get `properties.dist` in km.  
4. Filter POIs where `dist <= 0.28` (≈2 NYC blocks).  
5. Display distance as both blocks (`Math.round(dist / 0.14)`) and minutes (`Math.ceil(dist / 80)`).  

**Effort:** M (1–2 days).  
**Dependencies:** Turf.js addition to `home.inline.html`.  

### Option B — Server-side corridor query

1. ASP.NET Core adds a `/api/pois-along-route` endpoint.  
2. Client POSTs polyline + POI list + radius.  
3. Server runs point-on-line + filter (using NetTopologySuite or hand-coded haversine).  
4. Returns filtered POI subset with `dist_m`.  

**Effort:** L (3–4 days).  
**Dependencies:** NetTopologySuite or manual geometry in C#.  

### Option C — Mock-only (straight-line only, no street walking)

Use `computeLength()` from route start/end to POI.  
This is a coarse proxy — acceptable for demo only.  
Does NOT satisfy "≤2 blocks **along route**" — measures air distance from start/end
rather than nearest point on the full path.

**Effort:** XS (already existing).  
**Risk:** Misleading results on non-linear routes (Z-shape, detours).  

### Recommendation

**Option A** (Turf.js client-side) for MVP. Turf is well-maintained, tree-shakeable,
and integrates cleanly with the existing Leaflet + polyline pipeline.
`nearestPointOnLine` is ~3 KB isolated.

---

## Decisions Needed

| # | Question |
|---|---------|
| D1 | Is Turf.js acceptable as a new dependency? (CDN or bundled subpackage?) |
| D2 | "2 blocks" threshold — hardcoded to 280 m, or configurable via `App.config`? |
| D3 | Should along-route filtering happen client-side (Option A) or server-side (Option B)? |
| D4 | Does "along route" apply to POIs only, or also to Events that have a resolved location? |
| D5 | If no provider route is available (mock fallback), fall back to straight-line from start? |

---

## Appendix — 2 NYC blocks ≈ meters

Standard Manhattan block north-south ≈ 80 m; east-west ≈ 274 m.  
The Eric story says "2 blocks" as a walking detour comfort.  
Conservative threshold: **280 m** (1 long block).  
Liberal threshold: **400 m** (5 min walk).  
Recommended default: **320 m** (~4 blocks north-south, ~1 block east-west).
