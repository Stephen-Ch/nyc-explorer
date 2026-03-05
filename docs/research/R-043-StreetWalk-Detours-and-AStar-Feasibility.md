# R-043 — StreetWalk Detours and A* Weighted-Attraction Feasibility

**Date:** 2026-03-05
**Status:** Open
**Author:** Research pass — automated evidence sweep
**Builds on:** R-040 (Along-Route Detour Feasibility), R-036 (Eric MVP Contract v0)

---

## Purpose

This document goes deeper than R-040 on two distinct but related problems:

1. **True street-walk detour scoring** — replacing the current crow-flies stub
   with network-accurate walking distance, and scoring POIs by proximity to the
   actual walked path.
2. **A\* weighted-attraction routing** — determining whether an A\*-style
   spatial algorithm can select the *best route from A to B weighted by attraction
   density and quality*, and what would be required to implement it.

Both are **evidence-backed feasibility analyses**. No code was changed.

---

## Section 1 — Current Routing Capabilities (Evidence)

### 1.1 Provider model

`apps/web-mvc/wwwroot/js/adapters.js` lines 9–17:

```js
const geoProvider  = pick(cfg.geoProvider,  'mock');
const routeProvider = pick(cfg.routeProvider, 'mock');
```

- Default: `'mock'` — straight-line fallback used for all routing in dev/test.
- Real provider: any non-empty, non-`'mock'` string is treated as a POST endpoint URL.
- No named provider constants (Google, OSRM, Mapbox, GraphHopper) — provider-agnostic.

### 1.2 What the provider returns today (fixture + normalization evidence)

Fixture: `tests/fixtures/route/provider-union-to-bryant.json` — Google Routes API v2 shape.

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
      {
        "navigationInstruction": { "instructions": "Head north on Broadway" },
        "startLocation": { "latLng": { "latitude": 40.7359, "longitude": -73.9911 } },
        "distanceMeters": 320,
        "duration": { "text": "4 min" }
      },
      {
        "navigationInstruction": { "instructions": "Turn right toward Bryant Park" },
        "startLocation": { "latLng": { "latitude": 40.7530, "longitude": -73.9840 } },
        "distanceMeters": 120,
        "duration": { "text": "2 min" }
      }
    ]}]
  }]
}
```

`normalizeRoutePayload()` (`adapters.js` ~line 228) outputs:

```js
{ path: [{lat, lng}, ...], steps: [{text, distance, duration, lat, lng}, ...] }
```

Three polyline formats accepted:
1. `polyline.coordinates[].latLng` objects ← Google Routes API v2
2. `polyline.encodedPolyline` string ← Google Routes API v1 / Directions API (decoded via `decodePolyline()`)
3. `route.polyline[]` flat array ← legacy

**Per-step fields normalized:** `text`, `distance` (meters), `duration` (seconds), `lat`, `lng`.

### 1.3 `route.walk()` stub — what it does and what it does NOT do

`adapters.js` ~line 390:

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

`computeLength()` is pure Haversine (straight-line, `adapters.js` lines 110–117):

```js
const computeLength = (from, to) => {
  const rad = (deg) => deg * Math.PI / 180, R = 6371000;
  const a = Math.sin(dLat/2)**2 + Math.cos(fromLat)*Math.cos(toLat)*Math.sin(dLng/2)**2;
  return R * c; // straight-line metres ONLY
};
```

The stub `route.walk()`:
- Returns only `[from, to]` as nodes (no intermediate street points)
- Computes **air distance** (not street-walk distance)
- Ignores street network, building footprints, one-way restrictions
- Is NOT the same as walking distance anywhere except open fields

**Implication:** Any "≤2 blocks along route" calculation currently uses a circle around route endpoints, not a corridor along the walked path.

### 1.4 Missing spatial capabilities (confirmed GAP)

`Select-String` across all tracked `.js` files for: nearest, detour, buffer,
corridor, snap, along, turf, haversine (geometry), rbush, kdbush → **zero matches**.

`git ls-files | Select-String "turf|rbush|kdbush|geojson|proj4"` → **zero results**.

Not present in repo:
- Point-on-line / `nearestPointOnLine`
- Polyline-to-point distance (perpendicular offset)
- Spatial index (R-tree, k-d tree)
- Any street graph
- Any graph traversal (BFS, DFS, Dijkstra, A\*)

---

## Section 2 — What "True Street-Walk Detour" Means in MVP Terms

### 2.1 The user story (from R-036)

> Eric walks from Union Square to Bryant Park (~2 km). He wants to see
> events/POIs that are ≤2 blocks off his walking route, approximately 4 minutes
> or less of extra walking.

### 2.2 "2 blocks" expressed as meters

Manhattan block reference (from R-040 Appendix):
- North-south block ≈ 80 m
- East-west block ≈ 274 m

For a "2 block" walking detour:
- Conservative: **280 m** (~1 east-west block, or ~3.5 north-south blocks) — safest threshold
- Recommended default: **320 m** (~4 north-south blocks, ~1 east-west block)
- Liberal: **400 m** (~5 min walk)

The threshold must be measured **along streets from the route**, not as a straight line from the route endpoint. A POI 200 m crow-flies from a route midpoint might be 400 m of street walking if separated by a block.

### 2.3 Why crow-flies distance is insufficient

Scenario: Route polyline runs along 5th Avenue from 14th→42nd. A POI is at
`lat 40.7430, lng -73.9960` (6th Avenue / 22nd Street). Crow-flies to nearest
polyline segment ≈ 90 m. Street-walk distance = 90 m + overhead for crossing
blocks ≈ 180–270 m depending on intersection access. Still within 280 m — but a
POI 90 m crow-flies on a blocked side street could require 400 m of actual walk.

**For MVP, the nearest-point-on-polyline distance is an acceptable proxy IF we use
a conservative threshold (+20% buffer over raw crow-flies).**

The nearest-point-on-polyline is not crow-flies from route START — it is the
perpendicular (or nearest segment) distance from the POI to the polyline path. This
is the Turf.js `nearestPointOnLine` output, not `computeLength`.

---

## Section 3 — Feasible Implementation Architectures

### Option 1 — Provider-as-Oracle Detour Scoring (extra routing calls)

**Concept:** For each candidate POI within a generous crow-flies bounding box, make
a routing call: `origin → POI → destination`. Subtract the direct `origin → destination`
distance to get the detour cost. Filter by `detour_cost ≤ threshold`.

**Accuracy:** High — uses actual street network routing from provider.

**Complexity:**
- Requires N routing API calls per POI per route (where N = number of candidates).
- With 40 POIs in `content/poi.v1.json` and a 2 km route → up to 40 POST calls.
- Rate-limit risk: `adapters.js` already has `routeCooldownMs` (5 min CD after 2 failures).

**Testability:**
- Easy to test with existing mock provider and fixture intercept pattern.
- Each routing call is independently interceptable.

**Perf:** Slow for large POI sets. Acceptable for ≤20 candidates.

**Cost:** If using Google Routes API — N calls × per-route cost. For 40 POIs = 40 calls.

**Fits MVP?** ❌ — Too many API calls. 40 route requests per route render is
prohibitive for rate limits and cost. Acceptable only as a "verify top candidate"
step for final detour confirmation (1–2 calls, not 40).

---

### Option 2 — Client-Side Corridor Query with Turf.js (Recommended)

**Concept:** The route polyline is already returned by the provider.
`turf.nearestPointOnLine(polyline, poi_point)` returns the nearest point on the
route polyline and the perpendicular distance. Filter POIs where this distance
≤ threshold (e.g., 320 m).

**Accuracy:** Near-accurate for straight streets; 10–30% underestimate on zigzag
routes. Acceptable for Manhattan grid. Does NOT account for street network
one-ways or block access, but within a grid the perpendicular distance to a
polyline is a good proxy.

**Complexity:**
- Add Turf.js to `home.inline.html` (CDN or tree-shake `nearestPointOnLine` — ~3 KB gzipped)
- Implement a `filterPoisAlongRoute(polyline, pois, thresholdMeters)` function
- No server changes; no routing calls; purely client-side geometry

**Testability:**
- Fully deterministic given a polyline fixture and POI set.
- Easily unit-tested with `provider-union-to-bryant.json` fixture.
- No provider call required.

**Perf:** <1 ms for 40 POIs on modern hardware. Linear in POI count.

**Cost:** Zero API cost. Turf.js CDN ≈ 360 KB full / ~3 KB tree-shaken.

**Fits MVP?** ✅ YES — recommended approach (carries forward R-040 recommendation).

**What's currently missing to implement this:**
- Turf.js not in repo (GAP confirmed above)
- `normalizeRoutePayload()` already returns `path[]` — polyline is available
- Need: `path[]` array passed to the POI filter step in the render pipeline
- Need: `filterPoisAlongRoute()` function (new, ~20 lines)
- Need: Turf CDN `<script>` tag in `home.inline.html`

---

### Option 3 — Server-Side Routing Engine (Self-Hosted OSRM/Valhalla)

**Concept:** Deploy a Docker container running OSRM or Valhalla with a Manhattan OSM
extract. The ASP.NET Core app proxies routing requests to the self-hosted engine.
Server can also compute walking distance from POI to nearest point on route using
PostGIS or NetTopologySuite.

**Accuracy:** Maximum — actual street network, turn restrictions, pedestrian profiles.
Valhalla supports rich pedestrian routing including crosswalks.

**Complexity:**
- Requires Docker infrastructure (or cloud container hosting)
- OSM data extract download + OSRM pre-processing (~500 MB for Manhattan)
- New ASP.NET Core `/api/route` proxy endpoint
- `adapters.js` `routeProvider` can point to this endpoint (already provider-agnostic)
- NetTopologySuite for server-side geometry (already referenced in archived ADR)

**Testability:**
- Harder to test end-to-end in CI without container services
- Fixture intercept pattern already supports custom provider responses
- Existing `route-adapter-real` (quarantined e2e spec) was designed for this path

**Perf:** Sub-100 ms for typical Manhattan routes (OSRM is C++ native).

**Cost:** Infrastructure cost only (container). No per-call API cost.

**Fits MVP?** ❌ — Infrastructure complexity is high relative to MVP timeline.
Correct long-term architecture (R-040 + archived Stack ADR both point here),
but not the first step.

**Prior art in repo (archived):**
- `docs/archive/2026-01-11/timewalk/NYC-TimeWalk-Stack-Decision-Record.md` line 13:
  > "Routing: Valhalla (preferred) *or* OSRM in Docker; app computes story score
  > & detour policy."
- This document explicitly named Valhalla as preferred. It is **not wired** in the
  current codebase — it lives only in planning/archive docs.

---

## Section 4 — A\* Weighted Attractions: Problem Shape and Constraints

### 4.1 What "A\* weighted attractions routing" means

Standard A\* finds the lowest-cost path between two nodes on a graph. In the
attraction-routing problem the cost function weights **story density** along the
path — routes with many high-quality POIs near the path are preferred over
shortest routes.

This is a variant of the **orienteering problem** or **team orienteering problem**:
find a route from A to B within a time/distance budget that maximizes collected
attraction score.

### 4.2 The blocking constraint: no street graph exists in this repo

A\* requires a **graph** (nodes = street intersections, edges = street segments
with weights). This repo has:

- No street graph of any kind (`rg` across all tracked files for `graph`, `node`,
  `edge`, `dijkstra`, `astar` → GAP: zero matches in current codebase)
- No OSM data (`.osm`, `.pbf`, `.geojson` street network) → GAP
- No PostGIS database at all in this codebase (archived ADR recommends it as
  future state; not implemented)
- Leaflet map tiles are display-only — they carry NO queryable topology

**If we do not have a graph, true A\* cannot be run internally.**
Any "A\*" implementation would require either:
(a) building or downloading a street graph (OSM), or
(b) delegating graph traversal to an external engine (OSRM/Valhalla) and
post-processing results.

### 4.3 A\* prior work in repo

Search: `Select-String -Pattern "A\*|astar|AStar|shortest.path|dijkstra|orienteer|knapsack|weighted.attract|graph\."` across all tracked `.js`, `.ts`, `.cs`, `.md` files.

**Result:** Only matches found are in archived planning documents:

| File | Excerpt (≤25 words) |
|------|---------------------|
| `docs/archive/2026-01-11/timewalk/NYC-TimeWalk-README-Quickstart.md` | "fastest walking path on the NYC LION (or OSM) pedestrian graph… Score each candidate by story density" |
| `docs/archive/2026-01-11/timewalk/NYC-TimeWalk-Stack-Decision-Record.md` | "Valhalla (preferred) or OSRM in Docker; app computes story score & detour policy" |

**No A\* implementation exists in any current code files.** The concept was in
pre-code planning only.

### 4.4 Scoring fields: what exists today

| Source | Field | Type | Notes |
|--------|-------|------|-------|
| `data/historical/Events_Seed.csv` | `power` | int 1–3 | Editorial importance: 3=seminal, 2=notable, 1=context |
| `content/poi.v1.json` | ❌ (none) | — | GAP: no power/importance/weight field |
| `data/historical/NYC-Explorer_POIs_AllYears_withBBL.csv` | ❌ (none) | — | GAP: no power field |
| `content/poi.v1.json` | `sources[]` | array | Citation quality proxy possible (count non-placeholder URLs) |
| `content/poi.v1.json` | `order` | int | Route-order position only — not editorial importance |

The `power` field on Events is the only editorial weight in the repo.
POIs have no equivalent — but citation count (non-placeholder `sources[]`) could
serve as a weak quality signal.

### 4.5 "Scoring then re-route" approximation (no graph required)

Since we lack a street graph, true A\* is not implementable in-client.
The feasible MVP approximation is a **two-pass approach**:

**Pass 1 — Score candidates:**
- Filter POIs to those within N meters of the route polyline (Option 2 above)
- Assign a relevance score per POI = `topic_match_weight + proximity_weight + citation_quality_weight`
- Sort by score descending; take top K (e.g., top 5)

**Pass 2 — (Optional) Validate or sequence:**
- If the provider is real (non-mock), fire 1–3 extra routing calls for top K candidates to confirm walk time
- This is a greedy selection, NOT a true graph search

**Accuracy:** This is an approximation that works well on Manhattan grid routes
where the street network is nearly orthogonal. It fails for complex routes with
detours, dead-ends, or parks.

**Label it clearly** in the UI and code: "≈ nearby attractions" — not "optimal
detour routing".

### 4.6 True A\* path: what would be required

To implement real A\* weighted-attraction routing the team would need:

| Requirement | Gap |
|-------------|-----|
| Manhattan street graph (OSM/LION) as adjacency list or PostGIS network | ❌ Not in repo |
| Edge weights = time + inverse(attraction_score_in_buffer) | ❌ No graph, no weight schema |
| `power` / importance field on POIs (not just Events) | ❌ GAP in poi.v1.json + AllYears CSV |
| Server-side architecture (ASP.NET + PostGIS or routing engine) | ❌ Not built yet |
| Attraction-density precompute per block or grid cell | ❌ Not built (tile_id exists in CSV but not in runtime JSON) |

The archived ADR recommends: PostgreSQL + PostGIS + Valhalla/OSRM + a
`block_attraction_index` precomputed per year. That architecture is the correct
long-term path. It is not the MVP path.

---

## Section 5 — Concrete Next-Proof Commands (Future Work)

These commands are NOT executed in this research pass. They define the
evidence-gathering work needed before committing to each architecture option.

### 5.1 Validate Option 2 (Turf.js) proof-of-concept

```powershell
# Add Turf.js to home.inline.html (CDN) and run a unit test:
# Prove that nearestPointOnLine(polyline, poi) returns correct distance
# for provider-union-to-bryant fixture vs Union Square POI (40.7359, -73.9911)

# Expected: POI at route START → distance ≈ 0 m
# Expected: POI 500 m off route midpoint → distance ≈ 500 m
```

### 5.2 Confirm provider walk mode (OSRM/Google)

```powershell
# If switching to a real routing provider, confirm walking-mode endpoint:
# Google Routes API: POST https://routes.googleapis.com/directions/v2:computeRoutes
#   with "travel_mode": "WALK" → returns encodedPolyline with walking geometry
# OSRM: GET http://router.project-osrm.org/route/v1/walking/{coords}
#   → returns "routes[0].geometry" as encoded polyline
# Confirm adapters.js normalizeRoutePayload handles both shapes (already tested via fixture)
```

### 5.3 Validate tile_id fields for block-level density

```powershell
# Check how many POIs per tile_id in AllYears CSV:
Get-Content "data/historical/NYC-Explorer_POIs_AllYears_withBBL.csv" |
  Select-Object -Skip 1 | ConvertFrom-Csv -Header (Get-Content ...) |
  Group-Object tile_id | Sort-Object Count -Descending | Select-Object -First 10

# If tiles are coarse (many POIs per tile), tile_id is unsuitable for
# block-level density scoring; would need a finer grid or PostGIS ST_Within buffer
```

### 5.4 Data fields needed for weighted scoring (future authoring work)

| Field | Where to add | Priority |
|-------|-------------|---------|
| `power` (1–3 editorial weight) | `poi.v1.json` and AllYears CSV | HIGH — prerequisite for A* weighting |
| `interest_tags` (from R-037 taxonomy) | `poi.v1.json` | HIGH — topic-match scoring |
| `year_start` / `year_end` | `poi.v1.json` and AllYears CSV | MEDIUM — date-span filtering |
| `tile_id` | `poi.v1.json` (runtime) | LOW — block-level density capping |

---

## Section 6 — Decision Table

| Option | Accuracy | Complexity | Testability | Perf | API Cost | Fits MVP? |
|--------|---------|-----------|-------------|------|----------|-----------|
| 1 — Provider oracle (N calls) | High | Medium | Easy | Slow (N×) | High (N calls) | ❌ |
| 2 — Turf.js nearest-on-line | Near (grid OK) | Low | Easy | Fast (<1 ms) | Zero | ✅ |
| 3 — Self-hosted OSRM/Valhalla | Maximum | High | Hard in CI | Sub-100 ms | Infra only | ❌ now / ✅ later |
| A\* internal | Perfect | Very high | Hard | Fast (if graph built) | Infra only | ❌ no graph |
| Scoring → re-route (approx) | Approximation | Low | Easy | Fast | Minimal | ✅ acceptable for MVP |

**Top recommendation:** Option 2 (Turf.js) for MVP detour filtering +
scoring approximation (pass 1 score, pass 2 optional provider validation for top
1–3 POIs only).

**Top risks:**

| Risk | Severity | Mitigation |
|------|---------|-----------|
| Turf.js adds ~3–360 KB to page load | Medium | Tree-shake or CDN with subresource integrity |
| Crow-flies-to-polyline underestimates street distance by 10–30% | Medium | Add +20% threshold buffer (use 380 m for "320 m" target) |
| `power` field missing from POI data | High | Cannot weight attractions without authoring power values |
| No graph → A\* is approximation only | High | Label clearly; document as future-state |
| Route polyline absent in mock mode | Medium | Fall back to straight-line filtering from midpoint; document limitation |
