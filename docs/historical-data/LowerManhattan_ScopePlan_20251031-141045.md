# Lower Manhattan Extension — Scope & Workflow

## Coverage
- **River-to-river**, **south of the Flatiron District**, using **Manhattan Community Districts MN01–MN03** as administrative scaffold.
- Neighborhood set (initial): FiDi, Tribeca, Battery Park City, Civic Center, South Street Seaport, Greenwich Village/West Village, SoHo/NoHo/Hudson Square/South Village/Meatpacking, East Village/Alphabet City, Lower East Side, Chinatown, Little Italy, Nolita, Bowery, Two Bridges.

## Years (unchanged)
**1852, 1877, 1902, 1927, 1952, 1977, 2002** — snapshot “attractions” layers.
Events layer remains multi-year (any date) and answers **“what happened here?”**

## Basemap & time-awareness
- Respect **shoreline and landfill changes** (e.g., pre–Battery Park City in early years).
- Treat **lots/buildings** as time-sliced: an attraction record is valid **for a single snapshot year**; use events for precise dates.
- Use **BBL (10-digit)** canonical ID; add **cd_id** and **tile_id** for indexing.

## Density & detours
- Max **3 attractions per block** per route, with **“See more on this block”** affordance.
- Detour budget (walking): default ≤5 min each way; configurable per route.

## Data quality
- **Primary sources first** (LPC reports, NYPL maps/photos, newspapers, city records); institutional second; tertiary scaffolding only.
- Citations stored as JSON arrays (`sources_json`) with publisher + URL and optional accession IDs.

## Research ops
- Split into **Team A (space/time expansion)** and **Team B (entertainment focus)**.
- Use the included **Excel workbook** to track per-neighborhood/year assignments and BBL verification.
- Events backlog sheet seeds high-power candidates (to be verified and cited).

## Output
- CSV templates per year across all neighborhoods (placeholders with BBL fields).
- Events backlog with verification flags.
- SQL Server **migration** to add `cd_id` and `tile_id` to schema.
- Tile scheme: simple rectilinear grid per CD (e.g., `MN02-R03C05`). Replace with vector tiles later.
