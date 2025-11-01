# Lower Manhattan (MN01–MN03) — BBL Pass + Events Sprint (first drop)

**Date:** 2025-10-31
**Scope:** Borough of Manhattan Community Districts MN01–MN03 (FiDi/Tribeca/Civic Center; Greenwich/SoHo/NoHo/Hudson Sq; East Village/LES/Chinatown).  
**Years supported:** use existing NYC Explorer eras; events include exact dates.

## What's inside
- `BBL_Seed_Landmarks.csv` — first-tranche fixed landmarks with block/lot and BBL10.
- `Events_Seed.csv` — 20 verified events (true-crime, performance, LGBTQ, protest, labor) with people, place, coords, and suggested power/tags.
- `nycx_seed_landmarks_bbl.sql` — UPDATEs to apply BBLs once landmarks exist in `attractions`.
- `nycx_events_seed.sql` — INSERTs for events table.
- `PROVENANCE.csv` — human-readable source notes. See in-chat citations for authoritative links.

## Notes
- **BBL coverage:** 15 easy, high-confidence landmarks via LPC designation reports; continue pass to reach 30–50. We convert Block/Lot → BBL10 as `1 + block(5) + lot(4)`.- **Events depth:** Focused on true-crime, performance, LGBTQ, scandal, labor & politics. Calibrate `power` in CMS; tags drive filters.
- **Tile IDs (optional):** For now, derive `tile_id` as `MNxx-Rid                                   metropolitan-life-tower-1927
name                    Metropolitan Life Insurance Company Tower
summary             Skyscraper with clock tower (completed 1909).
description     East of the park, the Metropolitan Life Tower ...
lat                                                       40.7414
lng                                                      -73.9876
neighborhood                                    Flatiron District
tags                                 ["architecture", "commerce"]
year                                                         1927
borough                                                 Manhattan
area                                            Flatiron District
block                            1 Madison Ave (E 23rd & Madison)
route_id                                                FLAT-1927
order                                                           3
sources         [{"title": "Metropolitan Life Insurance Compan...
images          [{"url": "https://commons.wikimedia.org/wiki/F...
Name: 5, dtype: objectCimages` over a 200m grid. We’ll assign once the vector-tile basemap is integrated.

## Import
1. Load `BBL_Seed_Landmarks.csv` into your staging table or apply `nycx_seed_landmarks_bbl.sql` after you seed attractions.
2. Load `Events_Seed.csv` or run `nycx_events_seed.sql`.
3. Record best sources in your CMS (each event/landmark has a `sources` note to copy).

— NYC Explorer / Lower Manhattan seed pack
