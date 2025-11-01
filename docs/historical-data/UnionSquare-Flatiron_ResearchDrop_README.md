# UnionSquare–Flatiron Research Drop (v1)

This bundle contains two complementary data layers for NYC Explorer (Union Square & Flatiron/Madison Square):

1) **Attractions ("What was here?")** — one CSV per year plus an image manifest (links-only) and a provenance memo.
   - File pattern per year: 
     - `NYC-Explorer_POIs_UnionSquare-Flatiron_<YEAR>.csv`
     - `NYC-Explorer_ImageManifest_<YEAR>.json`
     - `NYC-Explorer_Provenance_<YEAR>.md`
   - Key CSV fields: `id, name, summary, description, lat, lng, neighborhood, area, borough, block, year, route_id, order, tags(json), sources(json), images(json)`

2) **Events ("What happened here?")** — a single CSV with time-stamped events across years, plus an image manifest and provenance.
   - Files:
     - `NYC-Explorer_Events_UnionSquare-Flatiron.csv`
     - `NYC-Explorer_Events_ImageManifest.json`
     - `NYC-Explorer_Events_Provenance.md`
   - Event CSV fields: `id, title, start_date, end_date, is_approximate, area, neighborhood, lat, lng, categories(json), people(json), summary, description, sources(json), images(json)`

## Coverage (this drop)
Years: **1852, 1877, 1902, 1927, 1952, 1977, 2002** (Union Square & Flatiron/Madison Square)
Event categories include: politics, labor, art, music, cinema, true-crime, memorial, culture, etc.

## Provenance
Each year/event includes a short **Provenance** markdown. Sources focus on official pages (NYC Parks, MSP Conservancy), institutional archives (NYPL), and reference overviews (Wikipedia) as scaffolding. Future passes should prioritize **primary sources** (LPC/NHL nominations, Sanborns, tax photos, period newspapers).

## Inventory
### Present files
- NYC-Explorer_Events_ImageManifest.json
- NYC-Explorer_Events_Provenance.md
- NYC-Explorer_Events_UnionSquare-Flatiron.csv
- NYC-Explorer_ImageManifest_1852.json
- NYC-Explorer_ImageManifest_1877.json
- NYC-Explorer_ImageManifest_1902.json
- NYC-Explorer_ImageManifest_1927.json
- NYC-Explorer_ImageManifest_1952.json
- NYC-Explorer_ImageManifest_1977.json
- NYC-Explorer_ImageManifest_2002.json
- NYC-Explorer_POIs_UnionSquare-Flatiron_1852.csv
- NYC-Explorer_POIs_UnionSquare-Flatiron_1877.csv
- NYC-Explorer_POIs_UnionSquare-Flatiron_1902.csv
- NYC-Explorer_POIs_UnionSquare-Flatiron_1927.csv
- NYC-Explorer_POIs_UnionSquare-Flatiron_1952.csv
- NYC-Explorer_POIs_UnionSquare-Flatiron_1977.csv
- NYC-Explorer_POIs_UnionSquare-Flatiron_2002.csv
- NYC-Explorer_Provenance_1852.md
- NYC-Explorer_Provenance_1877.md
- NYC-Explorer_Provenance_1902.md
- NYC-Explorer_Provenance_1927.md
- NYC-Explorer_Provenance_1952.md
- NYC-Explorer_Provenance_1977.md
- NYC-Explorer_Provenance_2002.md
