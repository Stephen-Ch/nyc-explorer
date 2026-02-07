# Stack Decision Record — NYC TimeWalk
**Date:** 2025-10-29 • **Status:** Approved for planning • **Owner:** Editor-in-Chief (Product)  
**Scope:** Researcher/Editor data app, routing service integration, map front-end, storage & search

## TL;DR
Keep **ASP.NET Core** for the application layer, adopt **PostgreSQL + PostGIS** for geospatial data, run a containerized **Valhalla or OSRM** router, store media in **Blob/S3**, and cache with **Redis**. This maximizes geospatial capability while preserving .NET velocity and open-map flexibility.

---

## Decision
- **App/UI:** ASP.NET Core (Razor/Blazor or ASP.NET + SPA). Map client: **MapLibre GL** (or Leaflet).
- **Database:** **PostgreSQL 16 + PostGIS 3** via Npgsql + EF Core + **NetTopologySuite**.
- **Routing:** **Valhalla** (preferred) *or* **OSRM** in Docker; app computes story score & detour policy.
- **Storage:** **Azure Blob** (or Amazon S3) for images/derivatives; metadata in DB.
- **Search:** Start with **Postgres FTS** + **pg_trgm** (trigram) for fuzzy matching.
- **Caching:** **Redis** (route cache, query cache, session state).
- **Jobs/ETL:** **Hangfire** (or Quartz) for thumbnails/tiles, ETL, and indexing.
- **Observability:** **Serilog** + **OpenTelemetry** (traces) + **MiniProfiler** for DB tuning.
- **Future tiles:** TileServer GL / Tegola reading PostGIS for vector tiles (Phase 2).

## Context & Goals
- **Product:** year-specific, lot-accurate routing with max **3 attractions per block** and a **Detour Budget** (0–10%).  
- **Non‑functional:** desktop-first; typical route renders ≤ **2s**; reproducible deep links; strong audit trail and rights metadata.  
- **Data:** parcel‑level geometry (BBL), spatial buffers near routes, block slicing, CRS transforms, and editorial search.

## Why this stack
- **PostGIS** provides the richest spatial ops (ST_Buffer, ST_Intersects, ST_Within, ST_Transform, topology, indexing) needed for lot timelines and block capping—fewer app‑side workarounds than SQL Server spatial.
- **ASP.NET Core** matches team comfort and gives excellent perf/tooling.  
- **Router as a service** keeps geospatial preprocessing outside the web app, enabling scale & easier tuning of pedestrian profiles.
- **MapLibre GL** avoids commercial lock‑in; vector styles are versionable and local.

## Architecture (high level)
```
[Browser (MapLibre)] ⇄ [ASP.NET Core API]
     │                            │
     │ tiles/geojson              ├─ Npgsql/EF → [PostgreSQL + PostGIS]
     │ route requests (A→B, yr)   ├─ HTTP → [Valhalla/OSRM]
     │ assets (img)               ├─ SDK → [Blob/S3 Storage]
     └─ auth/session              └─ Redis (cache) + Hangfire (jobs)
```

## Key Geospatial Settings
- **CRS storage:** EPSG:4326 (WGS84).  
- **Metrics:** compute distances/areas in **EPSG:2263** via `ST_Transform` for NYC‑accurate meters.  
- **Indexes:** GIST on `geom`; BTREE on `year`, `bbl`; GIN/trigram on text fields.  
- **Blocks:** precompute block polygons & a `block_attraction_index` per **year** to enforce density (3/block).

## Alternatives Considered
1) **ASP.NET + SQL Server Spatial (all‑MS stack)**  
   - *Pros:* single vendor, known ops.  
   - *Cons:* thinner spatial toolset; more custom code for buffers/joins; fewer open geo tools.
2) **Node/TypeScript + PostGIS**  
   - *Pros:* JS map ecosystem alignment.  
   - *Cons:* team velocity lower vs .NET; no gain in spatial power over ASP.NET + PostGIS.
3) **Hosted routing APIs only**  
   - *Pros:* quickest start.  
   - *Cons:* cost, vendor limits, opaque profiles; harder to ship interest‑aware detour tuning.

## Consequences
- **Pros:** best‑in‑class spatial SQL, open map stack, portable router, clean separation of concerns.  
- **Cons:** adds Postgres ops expertise; a Dockerized router to maintain; dual‑cloud choice for storage.

## Risks & Mitigations
- **Postgres/PostGIS unfamiliarity** → bootstrap with a seed repo + migrations + example queries; add MiniProfiler + EXPLAIN plans.  
- **Router ops** → pin Docker images; keep baseline OSRM fallback if Valhalla tuning stalls.  
- **Map tiles perf** → start with raster/vector from public sources; move to self‑hosted tiles in Phase 2.  
- **Rights/PII on media** → strict metadata & PD/CC policies; link‑only for restricted assets.

## Migration / Rollback
- If PostGIS blocks delivery, **fallback to SQL Server spatial** for MVP by swapping Npgsql for SqlClient + NetTopologySuite.  
- Router can swap **Valhalla ⇄ OSRM** behind an interface; identical API facade in app.  
- Storage can flip **Blob ⇄ S3** by configuration.

## Components & Packages
- `Npgsql.EntityFrameworkCore.PostgreSQL` + `NetTopologySuite`  
- `Hangfire`, `Serilog`, `OpenTelemetry`, `MiniProfiler`  
- Router container: **Valhalla** or **OSRM**  
- Front-end: **MapLibre GL** (+ maplibre-gl-draw) or **Leaflet + leaflet-draw**

## Open Questions
- Valhalla vs OSRM for pedestrian profile defaults?  
- Map client: MapLibre GL vs Leaflet (performance vs simplicity)?  
- Azure Blob vs S3 (use existing credits/contracts)?  
- Do we self‑host tiles in MVP or defer to Phase 2?

## Next Steps
1) Create infra-as-code stubs (DB, Blob/S3, Redis).  
2) Provision **Postgres + PostGIS** and import **PLUTO/LION** test slices.  
3) Stand up router container and smoke‑test A→B paths.  
4) Implement `GET /route?from=…&to=…&year=…&detour=…` with scoring & block density cap.  
5) Add basic Researcher UI forms for lots/attractions/sources.

---
**Decisions Log (paste into KB):**  
`2025-10-29 | Adopt ASP.NET Core + PostgreSQL/PostGIS + Valhalla/OSRM + Blob/S3 + Redis | Maximize geospatial capability without leaving .NET | All‑MS stack; Node+PostGIS; hosted routing only | Owner`
