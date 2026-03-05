# R-037 — Unified Interest Taxonomy v0

**R-ID:** R-037  
**Date:** 2026-03-05  
**Type:** Taxonomy Design / Research Doc  
**Status:** Open  
**Prompt:** NYCX-R-ERIC-MVP-CONTRACT-TAXONOMY-DATAPROMO-RESEARCH-003  
**Depends on:** R-034, R-035

---

## 1. What Exists Today

### POI files — `tags` field (category labels)

Source: `content/poi.v1.json` (10 POIs) and `data/historical/NYC-Explorer_POIs_AllYears_withBBL.csv` (42 POIs × 7 eras)  
Field name: **`tags`**  
Format: JSON array strings (e.g. `["architecture", "politics"]`)

Top values (AllYears CSV + runtime JSON combined):

| Tag | Count (AllYears) | Count (runtime) | Nature |
|-----|-----------------|----------------|--------|
| `public-art` | 24 | 0 | Category label |
| `architecture` | 18 | 6 | Category label |
| `politics` | 16 | 2 | Category / partial interest |
| `commerce` | 6 | 0 | Category label |
| `culture` | 2 | 0 | Category label |
| `landmark` | 0 | 3 | Category label |
| `scandal` | 1 | 1 | Category label |
| `infrastructure` | 1 | 1 | Category label |
| `music` | 1 | 0 | Weak interest signal |
| `theatre` | 1 | 0 | Weak interest signal |

**Assessment:** `tags` values are internal classification labels. Only `politics` and weakly `music`/`theatre` are user-facing interest candidates. The rest describe physical type, not thematic interests.

---

### Events files — `interest_tags` field (user-facing candidates)

Sources surveyed:

| File | Field name | Row count |
|------|-----------|-----------|
| `data/historical/Events_Seed.csv` | `interest_tags` | 20 |
| `data/historical/Events_Seed_Deep.csv` | `interest_tags` | 16 |
| `data/historical/nycx_events_backlog_seed.csv` | `category_tags` | ~20+ |
| `data/historical/nycx_events_seed.csv` | `tags` | 88 |
| `data/historical/nycx_events_tranche2.csv` | `interest` | ~10 |
| `data/historical/Events_withBBL_andTiles.csv` | `categories` | 14 |

**Top 25 combined interest/tag values from Events CSVs (all sources):**

| Rank | Value | Count | Example events |
|------|-------|-------|---------------|
| 1 | `activism` | 5 | The 'Sip-In' at Julius'; First NYC Pride March |
| 2 | `nightlife` | 3 | Cafe Society Opens; Billie Holiday 'Strange Fruit' |
| 3 | `performance` | 3 | Warhol's Exploding Plastic Inevitable; Club 57 |
| 4 | `free-speech` | 3 | Washington Square Folk 'Riot'; Emma Goldman Arrest |
| 5 | `bohemia` | 3 | Arch Conspirators 'Seize' Washington Square Arch |
| 6 | `aids` | 3 | ACT UP Wall Street Action; ACT UP 'Stop the Church' |
| 7 | `LGBTQ` | 2 | Stonewall Uprising; The 'Sip-In' at Julius' |
| 8 | `labor` | 2 | Triangle Shirtwaist Factory Fire; Tompkins Square Riot |
| 9 | `politics` | 2 | Wall Street Bombing; Lincoln's Cooper Union Address |
| 10 | `protest` | 2 | Stonewall Uprising; ACT UP at FDA |
| 11 | `folk` | 2 | Bob Dylan's First NYC Sets; Washington Sq Folk Crackdown |
| 12 | `jazz` | 2 | Cafe Society Opens; Billie Holiday 'Strange Fruit' |
| 13 | `rock` | 2 | Warhol's Exploding Plastic Inevitable; Fillmore East |
| 14 | `underground` | 2 | Club 57 Scene on St. Marks; Club 57 Halloween Show |
| 15 | `policing` | 2 | Stonewall Uprising; Tompkins Square Unemployment Riot |
| 16 | `pride` | 2 | First NYC Pride March; First Pride March Route |
| 17 | `poetry` | 2 | Nuyorican Poets Cafe Revives; Beat Scene Readings |
| 18 | `anti-racism` | 1 | Cafe Society Opens (integrated nightclub, 1938) |
| 19 | `anti-lynching` | 1 | Billie Holiday debuts 'Strange Fruit' |
| 20 | `women's-rights` | 1 | Triangle Shirtwaist Factory Fire |
| 21 | `civil-war` | 1 | Abraham Lincoln's Cooper Union Address |
| 22 | `latinx` | 1 | Nuyorican Poets Cafe Revives |
| 23 | `asian-american` | 1 | Chinatown Garment Workers March |
| 24 | `german-american` | 1 | General Slocum Disaster Aftermath (LES) |
| 25 | `labor` (tranche2) | 2 | Triangle fire; Wall St bombing |

---

## 2. Proposed Unified Taxonomy v0

### Design principles
1. Value slugs: lowercase, hyphen-separated, human-readable
2. Broad enough for multi-select (8–15 values at launch)
3. Each value must be supportable with ≥ 1 POI or event in the data — OR flagged as "Requires authoring"

### Taxonomy v0 — 14 values

| Slug | Label (display) | Seed from existing data | Authoring status |
|------|----------------|------------------------|-----------------|
| `lgbtq-history` | LGBTQ History | `LGBTQ`, `activism`, `pride`, `aids` (Events: 10+ hits) | ✅ Existing events; needs POI tagging |
| `labor-history` | Labor & Workers' Rights | `labor`, `women's-rights`, `fire-safety`, `union`, `garment` (Events) | ✅ Existing events; needs POI tagging |
| `politics-civic` | Politics & Civic History | `politics` (POI + Events); `civil-war`, `protest`, `free-speech` | ✅ POIs + events; broad value |
| `public-art` | Public Art & Monuments | `public-art` (AllYears CSV: 24 hits) | ✅ Existing POIs; re-use tag directly |
| `architecture` | Architecture & Landmarks | `architecture`, `landmark` (POI: 24 combined) | ✅ Existing POIs; re-use tag directly |
| `music-nightlife` | Music & Nightlife | `jazz`, `rock`, `folk`, `nightlife`, `performance` (Events) | ✅ Existing events; needs POI coverage |
| `arts-bohemia` | Arts & Bohemian Culture | `bohemia`, `underground`, `avant-garde`, `performance` (Events) | ✅ Existing events |
| `crime-scandal` | Crime & Scandal | `scandal`, `true-crime`, `mafia`, `crime` (Events + POIs) | ✅ Existing data |
| `commerce-industry` | Commerce & Industry | `commerce`, `infrastructure` (POI + AllYears) | ✅ Existing POIs |
| `protest-activism` | Protest & Free Expression | `activism`, `protest`, `free-speech`, `policing` (Events) | ✅ Existing events |
| `african-american-history` | African American History | `anti-racism`, `anti-lynching` (2 events only) | ⚠️ **REQUIRES NET-NEW AUTHORING** — see §3 |
| `irish-history` | Irish History & Immigration | (none) | ❌ **REQUIRES NET-NEW AUTHORING** — zero signals anywhere |
| `immigration` | Immigration & Ethnic Communities | `german-american`, `asian-american`, `latinx` (3 events) | ⚠️ **PARTIAL** — needs systematic authoring |
| `19th-century-history` | 19th Century NYC | `civil-war`, `public-art` from 1852–1877 eras | ⚠️ Good era coverage but no specific interest tagging yet |

---

## 3. African American / Irish History — Net-New Authoring Required

> **Evidence reference: R-035 (2026-03-05)**

| Signal searched | Result |
|----------------|--------|
| `content/poi.v1.json` — `african`, `black`, `abolit`, `irish`, `immigr` | **0 matches** |
| `data/historical/NYC-Explorer_POIs_AllYears_withBBL.csv` — same pattern | **0 matches** |
| Events CSVs — same pattern | **2 adjacent event tags** (`anti-racism`, `anti-lynching`) — no explicit "african american history" label |
| Irish / immigration signals | **0 explicit matches** in any file |

**Conclusion (from R-035):** Both `african-american-history` and `irish-history` are fully net-new authoring tasks. No existing POI or event entry uses these interest labels or describes these histories. Authoring would require:
1. Researching Union Square / Flatiron area landmarks connected to Black history (e.g. Underground Railroad stops, abolitionist meeting venues, NAACP-era sites) and Irish history (Irish immigration patterns, 19th-century neighborhoods, labor movement connections)
2. Creating new POI entries or tagging existing ones with these interest values
3. Adding the taxonomy values to the `interests[]` field schema

---

## 4. Authoring Rules

### Slug format
- All lowercase
- Hyphen-separated (`african-american-history` not `africanAmericanHistory`)
- No spaces, no underscores
- For events: retain existing `interest_tags` comma-delimited format; migrate toward slugs above
- For POIs: new `interests[]` JSON array field

### Storage field recommendation

| Data type | Canonical field | Format |
|-----------|---------------|--------|
| POIs (runtime JSON) | `interests[]` (NEW field, parallel to `tags`) | JSON array of slugs |
| POIs (AllYears CSV) | `interests` column (NEW) | JSON array string |
| Events CSVs | `interest_tags` (existing) | Comma-delimited; map to slugs above |

> **Rationale:** Keep `tags` as-is (internal category label used by schema tests). Add `interests[]` as the user-facing filter field. This avoids breaking existing schema tests while enabling the filter.

### Multi-select semantics
- **Default: OR** — show attractions matching ANY selected interest
- **AND mode** (optional future): show attractions matching ALL selected interests
- Recommendation for v0: implement OR only; mark AND as a future enhancement

### Cardinality
- Maximum 3 interests per POI recommended for authoring clarity
- No minimum (a POI may have 0 interests — it will only appear when no interest filter is active)

---

## 5. Migration Path from Existing `tags`

| Existing tag | Promote to interest slug? | Action |
|-------------|--------------------------|--------|
| `politics` | → `politics-civic` | Partial re-tag (POIs + events) |
| `public-art` | → `public-art` | Direct re-use (same slug) |
| `architecture` | → `architecture` | Direct re-use (same slug) |
| `labor` (Events) | → `labor-history` | Re-slug in Events + new POI tagging |
| `LGBTQ` (Events) | → `lgbtq-history` | Re-slug in Events + new POI tagging |
| `scandal` | → `crime-scandal` | Re-slug |
| `music` | → `music-nightlife` | Re-slug |
| `culture` | No direct promote | Too broad; sub-divide to specific interest |
| `commerce` | → `commerce-industry` | Re-slug |
| `infrastructure` | → `commerce-industry` | Merge |

---

## 6. Open Questions

| Question | Owner |
|----------|-------|
| Should `interests[]` be added to the schema test in `tests/schema/poi.spec.ts`? | Engineering decision |
| Should `irish-history` launch as an empty-state placeholder or be held until authoring is complete? | Product decision |
| What is the minimum authoring threshold to ship an interest filter? (e.g. ≥ 3 POIs per value?) | Product decision |
