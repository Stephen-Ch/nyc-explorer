# R-035 — Interest Taxonomy Seed Survey (Existing Tags/Themes + Counts)

**R-ID:** R-035  
**Date:** 2026-03-05  
**Type:** Provenance / Research Doc  
**Status:** Open  
**Prompt:** NYCX-R-INTEREST-TAXONOMY-SEED-SURVEY-001

---

## Question

What tag/theme/interest-like fields already exist in the repo's datasets? What values and counts do they have, and which existing families can seed a user-facing Interest taxonomy vs. which must be authored net-new?

---

## Data Sources Surveyed

| Path | Type | Row/Entry count | Has tag-like field? |
|------|------|----------------|---------------------|
| `content/poi.v1.json` | Runtime JSON | 10 POIs | ✅ `tags` (string[]) |
| `data/historical/NYC-Explorer_POIs_AllYears_withBBL.csv` | Historical CSV | 42 POIs (7 eras) | ✅ `tags` (JSON array string) |
| `data/historical/Events_Seed.csv` | Events CSV | 20 events | ✅ `interest_tags` (comma-delimited) |
| `data/historical/Events_Seed_Deep.csv` | Events CSV | 16 events | ✅ `interest_tags` (comma-delimited) |
| `data/historical/attractions/{era}/*.csv` | Per-era CSVs | 42 POIs total (same as AllYears) | ✅ `tags` (JSON array) — same data |

**Field names discovered:**
- POI data: `tags` — present in all POI files
- Events data: `interest_tags` — present in both Events CSVs, **absent** from POI files

---

## A) `tags` Field — POI Data

### poi.v1.json (runtime, 10 POIs, 13 unique tag values)

| Rank | Tag | Count | Example POIs |
|------|-----|-------|-------------|
| 1 | `architecture` | 6 | Flatiron Building, Con Edison Building, New York Life Building |
| 2 | `landmark` | 3 | Flatiron Building, Metropolitan Life Tower, New York Life Building |
| 3 | `politics` | 2 | Tammany Hall, Theodore Roosevelt Birthplace |
| 4 | `public-space` | 2 | Union Square Park, Madison Square Park |
| 5 | `park` | 2 | Union Square Park, Madison Square Park |
| 6 | `scandal` | 1 | Tammany Hall |
| 7 | `infrastructure` | 1 | Con Edison Building |
| 8 | `museum` | 1 | Theodore Roosevelt Birthplace |
| 9 | `civic` | 1 | (civic building entry) |
| 10 | `history` | 1 | Theodore Roosevelt Birthplace |
| 11 | `public` | 1 | (public art entry) |
| 12 | `art` | 1 | (art entry) |
| 13 | `clock` | 1 | (clock tower entry) |

### AllYears CSV (historical, 42 POIs, 7 eras, 17 unique tag values)

| Rank | Tag | Count | Example POIs |
|------|-----|-------|-------------|
| 1 | `public-art` | 24 | Equestrian Statue of George Washington; Statue of Abraham Lincoln; Statue of Marquis de Lafayette |
| 2 | `architecture` | 18 | Union Square Park; 862–866 Broadway Rowhouses; Madison Square Park |
| 3 | `politics` | 16 | Union Square Park; Equestrian Statue of George Washington; Statue of Abraham Lincoln |
| 4 | `commerce` | 6 | Fifth Avenue Hotel; Metropolitan Life Insurance Company Tower |
| 5 | `culture` | 2 | Max's Kansas City (213 Park Ave South); Madison Square Park |
| 6 | `hospitality` | 1 | Madison Cottage (road house) |
| 7 | `engineering` | 1 | Croton Fountain (Union Square) |
| 8 | `scandal` | 1 | Tammany Hall (44 Union Square East) |
| 9 | `residential` | 1 | 862–866 Broadway Rowhouses |
| 10 | `transportation` | 1 | Madison Cottage (road house) |
| 11 | `music` | 1 | Max's Kansas City (213 Park Ave South) |
| 12 | `public-space` | 1 | Madison Square Park |
| 13 | `infrastructure` | 1 | Croton Fountain (Union Square) |
| 14 | `theatre` | 1 | Daryl Roth Theatre (former Union Square Savings Bank) |
| 15 | `celebrity` | 1 | Max's Kansas City (213 Park Ave South) |
| 16 | `education` | 1 | Free Academy (City College precursor) |

> **Note:** Per-era CSVs in `data/historical/attractions/{year}/` contain identical data to the AllYears CSV — same rows, same tags. No additional unique tags found.

---

## B) `interest_tags` Field — Events Data (36 events total)

> **Key finding:** The Events CSVs have a distinct field named `interest_tags` (comma-delimited). This is structurally closer to a user-facing interest taxonomy than the POI `tags` field.

### Top 25 `interest_tags` values (Events_Seed.csv + Events_Seed_Deep.csv combined)

| Rank | Tag | Count | Example events |
|------|-----|-------|---------------|
| 1 | `activism` | 5 | The 'Sip-In' at Julius'; First NYC Pride March |
| 2 | `nightlife` | 3 | Cafe Society Opens (Integrated Nightclub); Billie Holiday debuts 'Strange Fruit' |
| 3 | `performance` | 3 | Warhol's Exploding Plastic Inevitable at The Dom; Club 57 Scene on St. Marks |
| 4 | `free-speech` | 3 | Washington Square Park Folk 'Riot'; Emma Goldman Arrest After Speech |
| 5 | `bohemia` | 3 | Arch Conspirators 'Seize' Washington Square Arch; Yippies Prank at the Fountain |
| 6 | `aids` | 3 | ACT UP Wall Street Action; ACT UP 'Stop the Church' Protest |
| 7 | `LGBTQ` | 2 | Stonewall Uprising; The 'Sip-In' at Julius' |
| 8 | `labor` | 2 | Triangle Shirtwaist Factory Fire; Tompkins Square Unemployment Riot |
| 9 | `politics` | 2 | Wall Street Bombing; Abraham Lincoln's Cooper Union Address |
| 10 | `protest` | 2 | Stonewall Uprising; ACT UP at FDA (NYC solidarity) |
| 11 | `folk` | 2 | Bob Dylan's First NYC Sets; Washington Sq Folk Permit Crackdown |
| 12 | `jazz` | 2 | Cafe Society Opens (Integrated Nightclub); Billie Holiday debuts 'Strange Fruit' |
| 13 | `rock` | 2 | Warhol's Exploding Plastic Inevitable at The Dom; Fillmore East Opens |
| 14 | `underground` | 2 | Club 57 Scene on St. Marks; Club 57 Halloween Show |
| 15 | `policing` | 2 | Stonewall Uprising; Tompkins Square Unemployment Riot |
| 16 | `pride` | 2 | First NYC Pride March (Christopher Street Liberation Day); First Pride March Route |
| 17 | `poetry` | 2 | Nuyorican Poets Cafe Revives; Beat Scene Readings and Gatherings |
| 18 | `anti-racism` | 1 | Cafe Society Opens (Integrated Nightclub) — integrated nightclub that defied Jim Crow norms |
| 19 | `anti-lynching` | 1 | Billie Holiday debuts 'Strange Fruit' |
| 20 | `women's-rights` | 1 | Triangle Shirtwaist Factory Fire |
| 21 | `civil-war` | 1 | Abraham Lincoln's Cooper Union Address |
| 22 | `latinx` | 1 | Nuyorican Poets Cafe Revives |
| 23 | `asian-american` | 1 | Chinatown Garment Workers March |
| 24 | `german-american` | 1 | General Slocum Disaster Aftermath (LES) |
| 25 | `fire-safety` | 1 | Triangle Shirtwaist Factory Fire |

**Full rare tags (count = 1):** `dance`, `services`, `halloween`, `disco`, `beats`, `mafia`, `avant-garde`, `dada`, `panic-of-1873`, `speeches`, `union`, `art`, `finance`, `stunt`, `house`, `little-italy`, `yippies`, `curfew`, `venues`, `gentrification`, `homelessness`, `drug-prices`, `law`, `greenwich-village`, `venue`, `anarchism`, `cbgb`, `punk`, `spoken-word`, `folklore`, `myth`, `garment`, `pranks`, `route`, `parade`, `church`, `drug-approval`, `restoration`, `bowery`, `club-culture`, `garage`, `art-market`, `soho`, `lofts`

---

## C) Evidence Check — African American / Irish / Immigration Signals

**Search pattern applied:** `african|black|abolit|irish|immigr|civil.war|emancipat|slavery|freedm` — run against all three dataset types.

| Dataset | Signal found? | Evidence |
|---------|--------------|----------|
| `content/poi.v1.json` | **NO** | Zero matches |
| `data/historical/NYC-Explorer_POIs_AllYears_withBBL.csv` | **NO** | Zero matches in tags, name, summary, description |
| `data/historical/Events_Seed.csv` | **WEAK** | `anti-racism` on Cafe Society (integrated nightclub 1938); `anti-lynching` on Billie Holiday; `civil-war` on Lincoln/Cooper Union — none use the explicit terms |
| `data/historical/Events_Seed_Deep.csv` | **NO** | Zero direct matches |

**Irish / immigration signals:** None in any file. The closest is `german-american` (1 event: General Slocum Disaster Aftermath).

**Abolitionist signals:** None. `civil-war` appears once (Lincoln's 1860 Cooper Union Address) but no abolitionist framing.

**African American cultural history signals:** `anti-racism` (1) and `anti-lynching` (1) are thematically adjacent but are event-specific labels, not a reusable taxonomy value.

---

## D) Recommendations

### Tag families that can be **re-used / promoted** as Interest filters

| Existing tag | Source | Recommended interest label | Notes |
|-------------|--------|---------------------------|-------|
| `politics` + `civil-war` | POI + Events | **Politics & Civic History** | Broad catch-all; already high frequency |
| `architecture` + `landmark` | POI | **Architecture & Landmarks** | Highest frequency in POI data |
| `public-art` | POI historical | **Public Art** | 24 hits in historical; 0 in runtime (placeholder gap) |
| `labor` + `women's-rights` | Events | **Labor & Workers' Rights** | Clear cluster |
| `LGBTQ` + `activism` + `pride` | Events | **LGBTQ History** | Well-represented in events |
| `jazz` + `nightlife` + `performance` + `rock` + `folk` + `music` | Events | **Music & Nightlife** | Strong cluster across genres |
| `free-speech` + `protest` + `activism` | Events | **Protest & Free Expression** | Natural grouping |
| `anti-racism` + `anti-lynching` | Events (weak signal) | **African American History** *(partial seed only)* | Only 2 events; explicit "African American history" POIs **do not exist** anywhere |

### Taxonomy values that **must be authored net-new** (no existing seed)

| Required interest | Signal in repo | What's needed |
|-------------------|---------------|---------------|
| **African American History** | 2 adjacent event tags only (`anti-racism`, `anti-lynching`) — zero POIs | New `interest_tags` values on POIs; new events covering abolition, Black churches, 19th-century free Black community in Union Sq/Flatiron area |
| **Irish History / Irish immigration** | **Zero signals** anywhere | Completely absent; requires both data authoring and taxonomy value |
| **Immigration (general)** | `german-american` (1), `asian-american` (1), `latinx` (1) — era-specific, not systematic | No general "immigration" category; would need POI + event authoring |
| **Abolitionism / Civil War era** | `civil-war` (1, on Lincoln speech only) | Only one event; no POI-level coverage of abolitionist movement in this geography |

---

## E) Field Structure Gap

The POI schema (`content/poi.v1.json` and historical CSVs) has **`tags`** — a category classification field.  
The Events schema has **`interest_tags`** — a user-facing thematic label field.

These serve different purposes. A user-facing Interest filter would need to either:
1. Rename/repurpose `tags` on POIs as `interest_tags` (requiring re-authoring all tag values), or  
2. Add a separate `interests[]` field to the POI schema distinct from the existing `tags` field

**UNKNOWN (needs decision):** Should the runtime POI schema gain a new `interests[]` field alongside `tags`, or should `tags` be repurposed as the interest filter field?

---

## Summary

| Metric | Value |
|--------|-------|
| Total unique POI tag values (runtime + historical combined) | **20** |
| Total unique `interest_tags` values (Events) | **~60** |
| Files with tag-like field | `content/poi.v1.json`, `data/historical/NYC-Explorer_POIs_AllYears_withBBL.csv`, `data/historical/Events_Seed.csv`, `data/historical/Events_Seed_Deep.csv` |
| African American history tags | **NO** (0 explicit; 2 adjacent event tags) |
| Irish history tags | **NO (zero)** |
| Immigration tags | **Weak** (3 ethnicity-specific event tags, not systematic) |
| LGBTQ tags | **YES** — `LGBTQ`, `activism`, `pride`, `protest`, `aids` (5 values, 10+ event hits) |
| Labor/workers' rights tags | **YES** — `labor`, `women's-rights`, `fire-safety`, `union`, `garment` |
| Closest existing structure to interest taxonomy | `interest_tags` in Events CSVs |
| Net-new authoring required for Eric MVP interests | African American History, Irish History, Immigration (all zero) |
