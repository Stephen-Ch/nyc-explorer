# NYC Explorer — Deep Research Brief
**Document ID:** DR-POI-UnionSquare-Flatiron-1852-2002 v1.0  
**Purpose:** Guide ChatGPT Research Mode to produce a source-backed, license-safe, downloadable CSV of Points of Interest (POIs) for the NYC Explorer project.  
**Audience:** Researcher/Agent operating in Deep Research mode (no guessing; use Ambiguity Cards when blocked).

---

## 1) Project Snapshot (what we’re building)
- **Product:** Manhattan-only walking explorer (MVP: desktop), initial focus on **Union Square** and the **Flatiron District**.
- **Experience:** User picks **year** + optional **theme filter** (Area of Interest), receives a walkable route with map + POIs.  
- **Routing density rule:** _Apply at **route time** only:_ **≤ 3 POIs per block per user filter + year**.  
  - Example: On the same block/year, users filtering `true-crime` vs `celebrity` vs `labor` should each see up to 3 **different** POIs.  
  - **Do not prune** the master dataset for density; collect as many qualifying POIs as possible.

---

## 2) Research Objective
Collect historically significant POIs for target years **{1852, 1877, 1902, 1927, 1952, 1977, 2002}** within:
- **Borough:** Manhattan
- **Areas (enum):** `"Union Square"` or `"Flatiron District"`

For each target year, find **3–5 POIs** (minimum 3) **per area** is ideal, but prioritize quality and coverage. Multiple themes per POI are allowed (see taxonomy).

**Deliver:** A single CSV (plus provenance memo) conforming to the import schema in §5.

---

## 3) Scope, Evidence & Quality Bar
- **Significance:** Architecture, civic/cultural institutions, labor/politics/civil‑rights moments, LGBTQ history, celebrity/culture, commerce/transportation, public art, notable scandals/true‑crime with documented impact.
- **Relevance year:** The POI must **exist or be relevant** by or in the target year (e.g., constructed/opened/designated/event happened). If a site spans many decades, choose the earliest year ≤ target year for that row, or include a `valid_from`/`valid_to` note in provenance.
- **Coordinates:** Provide **WGS84 lat/lng**, verified against authoritative or cross-checked sources. Note confidence/method in provenance.
- **Sources (per POI):** At least **two** reputable references:  
  - **Primary (preferred):** NYC Landmarks Preservation Commission (designation reports), National Register of Historic Places (NPS), NYPL Digital Collections/Maps (Sanborn/Bromley), Municipal Archives, NYC Planning datasets, institutional archives/museums, academic publishers.  
  - **Secondary:** Major newspapers (e.g., NYT), established historians, scholarly articles, reputable books.
- **Licensing for images:** Only include images with explicit open licenses: **Public Domain, CC0, CC-BY (4.0 or noted variant), or institutional open license**. Record `credit` and `license`. When unclear, **omit images** and note in provenance.
- **No guessing:** Use the **Ambiguity Card** (§8) if constraints cannot be met.

---

## 4) Areas of Interest (Themes) — Controlled Vocabulary v1
Use **canonical slugs** in the `tags` field (JSON array). Choose up to 3 themes per POI.

```
architecture, public-art, labor, politics, civil-rights, lgbtq, celebrity,
literature, publishing, theatre, music, cinema, commerce, transportation,
true-crime, scandal
```

> Note: This is a controlled list. Do **not** invent new slugs. If a concept doesn’t fit, pick the closest match and explain in provenance.

---

## 5) Output — CSV (primary import)
**Target path in repo:** `content/import/poi.v1.bulk-1852-2002.csv`

**Header (exact, ordered):**
```
id,name,summary,description,lat,lng,neighborhood,tags,year,borough,area,block,route_id,order,sources,images
```

**Field rules:**
- `id` — **stable, kebab-case, unique**, e.g., `flatiron-building-1902`. Include year if it disambiguates variants.  
- `name` — official/common name used in sources.  
- `summary` — ≤ 240 chars, neutral, high-signal “what/why”.  
- `description` — ≤ 600 chars, neutral, includes what/when/why significant, key dates/figures.  
- `lat`,`lng` — decimal WGS84 (e.g., `40.741061,-73.989699`).  
- `neighborhood` — human-readable label: “Union Square” or “Flatiron District”.  
- `tags` — **JSON array** of theme slugs, e.g., `["architecture","lgbtq"]`.  
- `year` — one of **1852, 1877, 1902, 1927, 1952, 1977, 2002** indicating relevance.  
- `borough` — literal `Manhattan`.  
- `area` — enum: `"Union Square"` or `"Flatiron District"` (must match app).  
- `block` — human street segment text, e.g., `E 23rd St (5th Ave–Broadway)`.  
- `route_id` — `USQ-<year>` for Union Square rows, `FLAT-<year>` for Flatiron rows.  
- `order` — integer **1..N** within the `route_id` (walkable order; avoid clustering >3 on the same block; variety is good).  
- `sources` — **JSON array** of objects, each exactly `{"title":"…","url":"…","publisher":"…"}`; include at least **2** per POI.  
- `images` — **JSON array** of objects (optional) `{"src":"…","credit":"…","license":"Public Domain|CC0|CC-BY 4.0|…"};` omit if uncertain.

**Sample (2 illustrative rows):**
```
id,name,summary,description,lat,lng,neighborhood,tags,year,borough,area,block,route_id,order,sources,images
flatiron-building-1902,Flatiron Building,"Triangular steel-frame skyscraper by D.H. Burnham, completed 1902.","Iconic early skyscraper noted for steel-frame construction and Beaux‑Arts styling; a defining landmark of the Flatiron District.",40.741061,-73.989699,Flatiron District,"[""architecture"",""landmark""]",1902,Manhattan,"Flatiron District","E 23rd St (5th Ave–Broadway)","FLAT-1902",1,"[{""title"":""LPC Designation Report – Flatiron Building"",""url"":""https://example.org/flatiron-lpc"",""publisher"":""NYC LPC""},{""title"":""NRHP Nomination – Flatiron Building"",""url"":""https://example.org/flatiron-nrhp"",""publisher"":""NPS""}]","[{""src"":""https://example.org/flatiron.jpg"",""credit"":""NYPL Digital Collections"",""license"":""Public Domain""}]"
tammany-hall-1927,Tammany Hall (Union Square),"1929 headquarters of Tammany Hall political machine; earlier organization influential by 1927.","Seat of Democratic machine politics; site associated with political influence and corruption narratives in early 20th century.",40.7356,-73.9897,Union Square,"[""politics"",""scandal""]",1927,Manhattan,"Union Square","E 17th St (Park Ave S–Irving Pl)","USQ-1927",2,"[{""title"":""LPC Designation Report – 44 Union Sq"",""url"":""https://example.org/tammany-lpc"",""publisher"":""NYC LPC""},{""title"":""NY Times Archive – Tammany Hall"",""url"":""https://example.org/nyt-tammany"",""publisher"":""NYT""}]","[]"
```

> JSON-in-CSV must remain valid JSON (double quotes escaped as `""`).

---

## 6) Output — Provenance Memo (Markdown)
**Target path:** `docs/provenance/DR-POI-1852-2002.md`

Template per POI:
```md
### <id> — <name> (year: <YYYY>, area: <Union Square|Flatiron District>)
- **Coords:** <lat>, <lng> (method: <source|geocoded>, confidence: <high|med|low>)
- **Themes:** <comma-separated canonical slugs>
- **Date rationale:** <why this POI is valid by/in YYYY; earliest known completion/opening/event>
- **Sources (min 2):**
  - <publisher>: <title> — <url>
  - <publisher>: <title> — <url>
- **Image license (optional):** <license> — credit: <name> — src: <url>
- **Notes:** <ambiguities, name variants, block notes/cross-streets>
```

---

## 7) Output — Optional Image Manifest (JSON)
**Target path:** `docs/provenance/DR-POI-1852-2002.images.json`

Shape:
```json
{
  "<id>": [
    {"src":"...","credit":"...","license":"Public Domain|CC0|CC-BY 4.0|..."}
  ]
}
```

---

## 8) Ambiguity Card (use instead of guessing)
If blocked (e.g., fewer than 3 eligible POIs for a year/area, conflicting dates, unclear coordinates, no licenseable images), return a card **per year**:

```md
#### Ambiguity Card — <YEAR> — <Area>
- **Issue:** <what’s blocking>
- **Candidates considered:** <short list>
- **Conflict/details:** <what sources say>
- **Proposed options:** <A/B/C>
- **Fields blocked:** <which CSV fields cannot be completed>
```

---

## 9) Quality Gates (please report)
- Count per year (≥3, ≤5) and total rows; coverage across both areas.
- CSV header matches exactly (see §5).
- `area` only `"Union Square"` or `"Flatiron District"`; `borough` always `"Manhattan"`.
- All rows have valid `lat`,`lng`.
- All rows have **≥2 sources**; JSON in `sources` parses; image licenses valid if present.
- `tags[]` only from canonical themes (§4).
- No duplicate `id`.
- Note any likely per-block clustering (we *allow* clustering at data level; routing will cap at 3 per block per user filter + year).

---

## 10) Submission Format (what to return)
1. **Summary** (counts per year & area, notable gaps)  
2. **CSV** in a single fenced code block (so we can download & commit as `content/import/poi.v1.bulk-1852-2002.csv`)  
3. **Provenance memo** (Markdown) in a second fenced block (`docs/provenance/DR-POI-1852-2002.md`)  
4. **Image manifest** (optional) in a third fenced JSON block (`docs/provenance/DR-POI-1852-2002.images.json`)  
5. **Ambiguity Cards** (only if needed), as a final section

---

## 11) Notes & Priorities
- Prefer **Union Square South/North** and **Flatiron core** to start; expand concentrically if needed.
- Spread POIs across blocks to increase route variety.
- For multi-era sites, consider multiple rows across the target years when historically meaningful (e.g., initial opening vs. later landmark designation).
- Keep tone neutral, avoid speculation; provenance is key.