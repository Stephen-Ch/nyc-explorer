# Manhattan Readiness Kit — Scope & Workflow (MN01–MN12)
**Timestamp:** 20251031-145651

## Coverage
- **All of Manhattan**, river‑to‑river, **MN01–MN12**.
- Seven snapshot years (unchanged): **1852, 1877, 1902, 1927, 1952, 1977, 2002**.
- Density: **max 3 attractions per block** per route; show "More on this block" affordance.
- Detours: default walking **≤ 5 minutes** each way (configurable).
- **Lot‑level timelines** (attractions by snapshot year); **events** carry exact dates.

## Data quality & sources
- **Primary sources first** (LPC designations, NYPL maps & photos, PLUTO/ZoLa, period newspapers, archives); institutional next; tertiary as scaffolding.
- Permanent **provenance**: keep JSON (`sources_json`) with publisher + URL + accession IDs (where possible).

## Research ops
- Team A: space/time coverage expansion by CD and year; BBL verification via ZoLa/PLUTO/DOF.
- Team B: events with emphasis on **true‑crime, performance, LGBTQ, scandal, labor & politics** — exact dates, people, and places.

## Output in this kit
- **Excel workbook** with per‑year attractions sheets (placeholders for every neighborhood) + a **citywide events backlog** (needs verification flags).
- **BBL seed landmarks CSV** (per CD; status `needs_verification` unless validated).
- **SQL**: MERGE seed for all Manhattan CDs; optional neighborhoods table.
- **Admin notes**: provisional `tile_id` grid can be added later; vector tiles preferred long‑term.
