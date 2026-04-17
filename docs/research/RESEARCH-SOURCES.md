# Research Sources Reference — NYC Explorer (Manhattan-First)

> **Last verified:** 2026-04-17
> **Scope:** Manhattan (MN01–MN12). Useful for any Manhattan neighborhood, not Lower Manhattan only.

---

## Purpose

Eliminate discovery overhead at the start of every research session. This doc maps institutional sources to what they prove, how to query them, and whether they can stand alone as promotion-ready evidence per R-050.

## How to Use This Reference

1. **Start with the question.** Use the Question-to-Source Cheat Sheet (§7) to find the best 2–4 sources for your specific need.
2. **Check the tier.** Tier A/B/C sources can provide promotion-ready evidence. Tier D sources are discovery/scaffolding — they point you toward evidence but are not sufficient alone.
3. **Check "Use alone?"** If NO, pair with a primary source before treating any fact as verified.
4. **Check staleness notes.** Some URLs drift or require manual lookup.

## Source Hierarchy Used by NYC Explorer

From R-050 and README_for_Copilot.md:

| Tier | Definition | Use for |
|------|-----------|---------|
| **Primary** | Official government, institutional, or archival sources with direct authority | BBL, dates, identities, addresses, coordinates — critical facts |
| **Secondary** | Institutional websites, museum databases, reputable press, scholarly publications | Summary/description, context, historical narrative |
| **Scaffolding** | General reference, crowd-sourced, unverifiable | Discovery and leads only — must be corroborated before promotion |

**Rule:** A POI whose only source is scaffolding-tier is **not promotion-ready** (R-050).

---

## Tier A — Primary / NYC Government

| Name | URL / Pattern | Best For | What It Proves | Not Sufficient For | How to Query | Use Alone? | Stability | Last Verified |
|------|--------------|----------|----------------|-------------------|-------------|-----------|-----------|---------------|
| **NYC LPC (Landmarks Preservation Commission)** | `s-media.nyc.gov/agencies/lpc/lp/####.pdf` | Landmark designation, architect, construction date, historical significance | Designation status, BBL, architect, date, significance statement | Present-day condition, extant/demolished, ownership history | Search by address or name at `www1.nyc.gov/site/lpc/designations/designation-reports.page`; reports are PDFs | Yes — primary authority for designation | Stable; PDF archive is durable | 2026-04-17 |
| **ZoLa (NYC Planning)** | `zola.planning.nyc.gov` | BBL, lot boundaries, zoning, land use | BBL (10-digit), lot geometry, lat/lng centroid, zoning designation | Historical significance, construction date, architect | Search by address; click lot for BBL + details; interactive map | Yes — for BBL/parcel identity | Stable | 2026-04-17 |
| **NYC DOF (Dept. of Finance)** | `a836-pts-access.nyc.gov/care/search/commonsearch.aspx` | BBL, assessed value, ownership, property class | BBL, current owner, property class, assessment | Historical significance, architect, construction date | Search by address → property details | Yes — for BBL/ownership | Stable; may require CAPTCHA | 2026-04-17 |
| **PLUTO / MapPLUTO** | `www1.nyc.gov/site/planning/data-maps/open-data/dwn-pluto-mappluto.page` | BBL, lot area, land use, building class, year built | BBL, year built (approximate), building class, lot dimensions | Architect, significance, precise construction date | Download dataset; filter by address or BBL | Yes — for parcel data | Updated ~annually; year-built field is approximate | 2026-04-17 |
| **ACRIS** | `a836-acris.nyc.gov/CP/` | Deed transfers, mortgages, ownership chain | Ownership history, transaction dates, BBL | Historical significance, architect, construction date | Search by address or BBL → document list | Yes — for ownership/transaction history | Stable; older records may be incomplete | 2026-04-17 |
| **OASIS NYC** | `oasisnyc.net` | Interactive map with tax lots, open space, environmental data | BBL (via lot click), open space boundaries | Historical significance, architect | Interactive map; click lot or search address | No — use to cross-check, not as primary | Intermittently slow; data from PLUTO | 2026-04-17 |
| **NYC Dept. of Records / Municipal Archives** | `www.nyc.gov/records` / `nycma.lunaimaging.com` | Historical photos, maps, building permits, vital records | Visual evidence (dated photos), building permits (architect, date), historical maps | BBL (use ZoLa), present-day status | Search online catalog (Luna) by address/name; some materials require in-person visit | Yes — for dated visual evidence and permits | Online catalog stable; physical archive requires appointment | 2026-04-17 |
| **NYC Parks** | `www.nycgovparks.org/parks` | Park history, monuments, public art, park properties | Park boundaries, monument locations, park creation dates, public art inventory | BBL for non-park parcels, architect (sometimes available) | Search by park name; each park page has history + features | Yes — for park-specific facts | Stable | 2026-04-17 |
| **NYC HPD (Housing Preservation & Development)** | `hpdonline.nyc.gov` | Building registration, violations, residential building data | Whether a building is registered residential, complaint/violation history | Historical significance, architect, landmark status | Search by address → building profile | No — supporting data only, not historical authority | Stable | 2026-04-17 |

---

## Tier B — Primary / Federal and National

| Name | URL / Pattern | Best For | What It Proves | Not Sufficient For | How to Query | Use Alone? | Stability | Last Verified |
|------|--------------|----------|----------------|-------------------|-------------|-----------|-----------|---------------|
| **NPS (National Park Service)** | `www.nps.gov` | National monuments, national historic landmarks, national memorials in Manhattan | Federal designation, significance statement, boundary maps | BBL, city-level designation, present-day condition | Search by site name; each site has official page | Yes — for NPS-designated sites | Stable | 2026-04-17 |
| **National Register / NPGallery** | `npgallery.nps.gov/NRHP` | National Register listings, NHL nominations | National Register status, significance narrative, period of significance, architect | BBL, city landmark status (separate from NR) | Search by property name or NRHP reference number | Yes — primary authority for NR/NHL status | Stable; PDFs are durable | 2026-04-17 |
| **Library of Congress** | `loc.gov` | Historical maps, photographs, prints, manuscripts | Dated visual evidence, historical maps, primary documents | BBL, present-day status, architect (unless in a document) | Search LOC Digital Collections; filter by geography/date; use Chronicling America for newspapers | Yes — for archival evidence | Stable | 2026-04-17 |
| **HABS / HAER / HALS** | `loc.gov/pictures/collection/hh/` | Architectural documentation, measured drawings, large-format photos | Architect, construction details, historical appearance, measured dimensions | BBL, present-day status, ownership | Search by building name or location within LOC | Yes — authoritative architectural documentation | Stable; historical collection | 2026-04-17 |
| **NYPL Digital Collections** | `digitalcollections.nypl.org` | Historical photographs, maps (Lionel Pincus collection), prints, manuscripts | Dated visual evidence, historical maps (fire insurance, topographic), archival documents | BBL (use ZoLa), present-day status | Search by keyword, location, date; filter by collection; map collections have dedicated viewer | Yes — institutional archive with direct authority | Stable | 2026-04-17 |

---

## Tier C — Primary / Institutional and Archive

| Name | URL / Pattern | Best For | What It Proves | Not Sufficient For | How to Query | Use Alone? | Stability | Last Verified |
|------|--------------|----------|----------------|-------------------|-------------|-----------|-----------|---------------|
| **Museum of the City of New York (MCNY)** | `collections.mcny.org` | Historical photographs, paintings, prints, decorative arts of NYC | Dated visual evidence, historical appearance, social/cultural context | BBL, architect (unless documented in caption), designation | Search online collection by keyword/location/date | Yes — for visual evidence with provenance metadata | Stable | 2026-04-17 |
| **New-York Historical Society** | `www.nyhistory.org/library` | Manuscripts, maps, photographs, prints, architectural records | Historical context, dated documents, visual evidence | BBL, present-day status | Search online catalog; many materials require in-person visit to library | Yes — for archival documents (if accessed) | Online catalog stable; physical archive requires appointment | 2026-04-17 |
| **Schomburg Center for Research in Black Culture (NYPL)** | `www.nypl.org/locations/schomburg` | African American and African diaspora history, Harlem history, civil rights | Historical significance for Black history, dated photographs, oral histories, manuscripts | BBL, architect, non-Harlem neighborhoods | Search NYPL catalog with Schomburg filter; some collections require in-person access | Yes — primary institutional authority for Black NYC history | Stable | 2026-04-17 |
| **Municipal Art Society (MAS)** | `www.mas.org` | Advocacy reports, neighborhood plans, preservation campaigns | Urban planning context, preservation advocacy history | BBL, architect, formal designation (MAS advocates but does not designate) | Browse reports and publications on website | No — advocacy/context, not designation authority | Stable | 2026-04-17 |
| **Columbia University — Avery Architectural & Fine Arts Library** | `library.columbia.edu/libraries/avery.html` | Architectural drawings, records of NYC architects, building documentation | Architect attribution, original drawings, specification books | BBL, current condition, designation | Search library catalog (CLIO); many collections require in-person access | Yes — for architect attribution from original records | Stable catalog; physical access requires university visit | 2026-04-17 |
| **NYU Fales Library & Special Collections** | `library.nyu.edu/locations/fales-library-special-collections/` | Downtown NYC history, literary/cultural archives, LGBTQ history | Cultural significance, dated documents, literary/arts community history | BBL, architect, formal designation | Search NYU library catalog; most materials require in-person access | Yes — for cultural/literary/LGBTQ institutional history | Stable | 2026-04-17 |
| **CUNY — LaGuardia & Wagner Archives** | `www.lagcc.cuny.edu/library/archives/` | NYC municipal government records, mayoral papers | Government decision-making context, policy history | BBL, architect, non-government history | Contact archives; most materials require appointment | No — context/supporting, not primary for site-level facts | Stable | 2026-04-17 |
| **Trinity Church Wall Street Archives** | `www.trinitywallstreet.org/about/history` | Parish history, early Manhattan land records, burial records (Trinity Churchyard, St. Paul's Chapel) | Church/parish history, burial records, early colonial land ownership | Non-church BBL, architect (unless church-commissioned) | Contact parish directly; some records available via website | Yes — for Trinity/St. Paul's parish history and early land records | Limited online; in-person for deep records | 2026-04-17 |
| **Lincoln Center for the Performing Arts — NYPL for the Performing Arts** | `www.nypl.org/locations/lpa` | Performing arts history, theater/music/dance archives, production records | Performance history, venue history, artist documentation | BBL, architect (unless in building records), non-performing-arts history | Search NYPL catalog; Theatre on Film and Tape Archive requires appointment | Yes — for performing arts institutional history | Stable (NYPL branch) | 2026-04-17 |
| **Cathedral of St. John the Divine Archives** | `www.stjohndivine.org/about/history/` | Cathedral history, Morningside Heights religious/architectural history | Construction phases, architect (Heins & LaFarge, Cram), institutional history | BBL (use ZoLa), non-cathedral sites | Website for overview; deeper records require contact | Yes — for cathedral-specific history | Limited online | 2026-04-17 |

---

## Tier D — Secondary and Discovery Sources

These sources are useful for discovery and enrichment but are **not sufficient alone** for promotion per R-050. Use them as leads, then verify against Tier A/B/C sources.

| Name | URL / Pattern | Best For | What It Proves | Limitations | How to Query | Use Alone? | Stability | Last Verified |
|------|--------------|----------|----------------|-------------|-------------|-----------|-----------|---------------|
| **NYC Landmarks Conservancy** | `nylandmarks.org` | Preservation advocacy, Sacred Sites program, neighborhood context | Context about preservation campaigns, building condition concerns | Not a designating authority; advocacy position, not formal status | Browse website by topic/neighborhood | No — supporting context only | Stable | 2026-04-17 |
| **Historic Districts Council (HDC)** | `hdc.org` | Historic district information, walking tours, neighborhood history | Neighborhood context, district boundaries, advocacy history | Not a designating authority; information may lag behind official LPC actions | Browse by neighborhood or search site | No — discovery and context only | Stable | 2026-04-17 |
| **Daytonian in Manhattan** | `daytoninmanhattan.blogspot.com` | Building-by-building history, architectural details, social history | Useful leads and historical narrative (well-researched blog) | Blog — no institutional authority; not peer-reviewed; no independent verification guarantee | Google search: `site:daytoninmanhattan.blogspot.com [building name]` | No — scaffolding/lead only | Stable (archived blog) | 2026-04-17 |
| **Untapped Cities** | `untappedcities.com` | Hidden/lesser-known NYC history, behind-the-scenes stories | Discovery leads, interesting angles, lesser-known facts | Journalistic, not institutional; may contain errors; not peer-reviewed | Search site by keyword | No — scaffolding/lead only | Stable | 2026-04-17 |
| **HMDB (Historical Marker Database)** | `www.hmdb.org` | Historical marker text and locations | Marker text, approximate location, marker photos | Crowd-sourced; marker text may contain errors; no BBL or institutional verification | Search by location or keyword | No — lead only; verify marker claims against primary sources | Stable | 2026-04-17 |
| **Wikipedia** | `en.wikipedia.org` | General background, linked references, discovery starting point | Nothing alone — scaffolding only per R-050 | Crowd-sourced; may contain errors; no editorial guarantee; citations may be dead links | Search by subject | No — scaffolding only; follow citations to primary sources | Stable but content changes | 2026-04-17 |
| **CultureNOW** | `culturenow.org` | Public art, cultural sites, audio tours | Public art locations, cultural site identification | Limited depth; not designating authority | Search by location or browse map | No — discovery/enrichment only | Intermittently available | 2026-04-17 |
| **PropertyShark** | `www.propertyshark.com` | Property details, ownership, sale history | Leads for BBL, owner, sale dates | Commercial site; requires subscription for full data; not government-authoritative | Search by address | No — lead only; verify BBL via ZoLa/DOF | Stable but paywalled | 2026-04-17 |

---

## Key Distinctions to Keep in Mind

| Dimension | Strong Sources | Weak/Lead Sources |
|-----------|---------------|-------------------|
| **Parcel/location identity** (BBL, coordinates, lot boundaries) | ZoLa, DOF, PLUTO, ACRIS | PropertyShark, HMDB, Wikipedia |
| **Historical significance** (why it matters) | LPC, NPS/NPGallery, NYPL, MCNY, Schomburg | Daytonian, Untapped Cities, HDC |
| **Architect / construction date** | LPC reports, HABS/HAER, Avery Library, PLUTO (year-built approximate) | Wikipedia, blogs |
| **Extant vs. demolished** | DOF (property class), ZoLa (current lot use), NYC Dept. of Records (historical photos) | Wikipedia, blogs |
| **Ownership / transaction history** | ACRIS, DOF | PropertyShark |
| **Discovery / leads** | All Tier D sources | — (they are the lead sources) |

---

## Question-to-Source Cheat Sheet

| Question | Best Sources (2–4) |
|----------|--------------------|
| **Need BBL / parcel identity?** | ZoLa, DOF, PLUTO, ACRIS |
| **Need precise coordinates?** | ZoLa (lot centroid), DOF (cross-check), PLUTO (lot geometry) |
| **Need landmark designation / architect / construction date?** | LPC designation reports, NPGallery (NR/NHL), HABS/HAER, Avery Library |
| **Need ownership history?** | ACRIS (deed chain), DOF (current owner) |
| **Need extant vs. demolished status?** | DOF (property class), ZoLa (current use), NYC Dept. of Records (historical vs. current photos) |
| **Need historical significance narrative?** | LPC reports (significance section), NPGallery (NR nomination), NYPL (manuscripts/photos), MCNY |
| **Need archival images?** | NYPL Digital Collections, LOC (prints/photos), MCNY, NYC Dept. of Records (Luna), HABS/HAER |
| **Need performing-arts / cultural institution history?** | NYPL for the Performing Arts, NYU Fales, Lincoln Center archives |
| **Need Black history / Harlem / African diaspora research?** | Schomburg Center, NYPL Digital Collections, NYC Dept. of Records |
| **Need church / parish / religious institutional history?** | Trinity Church Archives, Cathedral of St. John the Divine, NYC Dept. of Records (burial/vital records) |
| **Need park / public space history?** | NYC Parks, LPC (if designated), NYPL (historical maps) |
| **Need university-area / institutional campus history?** | Columbia Avery Library, NYU Fales, CUNY archives |

---

## Specialty Collections and Fieldwork-Oriented Sources

These resources are especially useful for pre-planning site visits and anchoring neighborhood-specific research.

### Archives That Help Pre-Plan a Site Visit
- **NYC Dept. of Records / Municipal Archives** — historical photos keyed to address can confirm what a site looked like at a specific date. Useful for before-and-after comparisons before visiting a site.
- **NYPL Map Division** — fire insurance maps (Sanborn, Bromley) and topographic maps show lot layouts, building footprints, and street grids at specific dates. Essential for understanding what was physically present in an era.
- **HABS/HAER/HALS** — measured drawings and large-format photos document buildings in detail. If a HABS record exists for a site, it provides authoritative pre-visit architectural documentation.

### Collections That May Justify In-Person Follow-Up
- **New-York Historical Society Library** — manuscript collections, architectural records, and photograph archives that are only partially digitized. If online search reveals relevant holdings, an in-person visit unlocks deeper material.
- **Columbia Avery Library** — original architectural drawings and specification books for many Manhattan buildings. Especially strong for 19th and early 20th century architects who practiced in NYC.
- **NYC Municipal Archives** — building permits, tax photos (1939–1941 series), and departmental records. The tax photo collection covers nearly every building in the city at a fixed date — landmark anchor for visual verification.

### Neighborhood-Anchoring Sources
- **Schomburg Center** — anchors Harlem and Upper Manhattan Black history research. Oral histories, photographs, and manuscripts not available elsewhere.
- **Trinity Church Wall Street Archives** — anchors Lower Manhattan colonial/early American history. Land records, burial records, and parish history from the 1690s forward.
- **NYPL for the Performing Arts** — anchors Midtown/Lincoln Center performing arts venue history. Theater, music, and dance archives.
- **NYU Fales Library** — anchors Greenwich Village/Downtown cultural and literary history. LGBTQ archives, Downtown Collection.
- **El Museo del Barrio** (`elmuseo.org`) — anchors East Harlem / El Barrio Latino cultural history. Limited online catalog; in-person visit for deeper material.

---

## Staleness / Maintenance Notes

### URL Patterns Likely to Drift
- `a836-pts-access.nyc.gov` (DOF) — NYC city agency URLs occasionally change with platform migrations.
- `hpdonline.nyc.gov` (HPD) — same risk as DOF.
- `a836-acris.nyc.gov` (ACRIS) — same risk as DOF.
- `oasisnyc.net` (OASIS) — independently maintained; intermittently slow or down.
- `nycma.lunaimaging.com` (Municipal Archives Luna catalog) — depends on Luna Imaging platform; may migrate.

### Systems Requiring Login / CAPTCHA / Manual Lookup
- **DOF Property Search** — CAPTCHA on some lookups.
- **ACRIS** — no login required but interface is dated; complex searches may require multiple steps.
- **NYPL special collections** — some digitized materials require NYPL card login.
- **Columbia/NYU/CUNY archives** — most deep materials require in-person access with university or researcher credentials.

### Sources to Re-Verify Periodically
- **PLUTO/MapPLUTO** — dataset updated annually; year-built and building-class fields may change.
- **LPC designation reports** — new designations are added; check for newly designated buildings in research areas.
- **NPGallery** — new NR/NHL listings are added; check for newly listed properties.
- **CultureNOW** — intermittent availability; verify the site is accessible before relying on it.

---

## Confidence Statement

**Confidence:** 88%
**Basis:** Source entries are grounded in current repo practice (BBL_Lookup_Playbook.md, README_for_Copilot.md, R-050 source hierarchy). URL patterns have been stated as documented in repo and standard NYC city/federal systems. Query mechanics are described honestly — where in-person access is required, this is noted. Tier assignments align with R-050 source hierarchy. Staleness risk is flagged where known. Some specialty-collection query mechanics (especially in-person archives) are described at summary level because detailed query procedures depend on access arrangements that change.
**Ready to proceed:** YES — this reference is immediately usable to reduce discovery overhead in NYC Explorer research sessions.
