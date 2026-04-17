# R-050 — POI Promotion Criteria for BBL Landmark Seeds

| Field | Value |
|-------|-------|
| Date | 2026-04-17 |
| PROMPT-ID | NYCX-POI-PROMOTION-CRITERIA-RESEARCH-001 |
| Area | Data / POI pipeline / Quality |
| Status | Complete |
| Confidence | 92% |
| Evidence Links | R-034, R-038, R-049, `data/historical/README_for_Copilot.md`, `data/historical/BBL_Lookup_Playbook.md`, `data/historical/PROVENANCE.md` |

## Prior Research Lookup

Searched ResearchIndex.md and read the following prior work:
- **R-034** (Attraction Data Source-of-Truth): defines runtime schema fields, identifies CSV as idle ready-asset
- **R-038** (Data Promotion v0): proposes CSV → poi.v1.json pipeline, field mapping, validation gates
- **R-049** (Historical Data Inventory): filesystem inventory, candidate tiers, enrichment gaps, verification status counts
- **README_for_Copilot.md**: glossary, data rules, provenance requirements, density cap, BBL derivation rules
- **BBL_Lookup_Playbook.md**: source hierarchy for BBL verification, workflow steps
- **PROVENANCE.md / PROVENANCE.csv**: master source citations for existing landmarks and events

No single prior document defines a complete POI-promotion criteria checklist. The criteria below are synthesized from the rules scattered across these sources.

## Question

What criteria must a BBL landmark seed (or related historical source material) satisfy before it is credible and complete enough to be promoted into a runtime POI?

## What Was Already Defined in the Repo

### Explicitly stated rules (verbatim or near-verbatim from repo docs)

| Rule | Source | Exact or paraphrased |
|------|--------|---------------------|
| Primary sources > secondary; no invented BBLs | README_for_Copilot.md §0, §2 | Exact |
| BBL must derive from a primary source (LPC, DOF/ACRIS/PIP, official open data) | README_for_Copilot.md §2 | Exact |
| ≤ 3 attractions per block per era (current operational/runtime cap — not a credibility or provenance gate; overflow is flagged as "more available" in UI) | README_for_Copilot.md §2 | Exact |
| Provenance = source_primary (institutional/archival) + source_secondary (press/wiki). Primary required for critical facts (BBL, dates, identities) | README_for_Copilot.md §2 | Exact |
| Never infer precise coordinates from vague addresses; leave lat/lng NULL | README_for_Copilot.md §4 | Exact |
| BBL lookup sources: ZoLa → DOF → PLUTO → OASIS → ACRIS | BBL_Lookup_Playbook.md | Exact |
| Confirm BBL by cross-checking lat/lng and frontage | BBL_Lookup_Playbook.md | Exact |
| Runtime schema: id, name, summary, description, coords, neighborhood, tags, year, sources, images, borough, area, block, route_id, order | R-034 | Exact |
| Sources must have real URLs (not placeholders) | R-038 §6 | Exact (proposed gate) |
| Every promoted POI should have ≥ 1 real image | R-038 §6 | Exact (proposed gate) |
| CSV images use `url`; runtime uses `src` — rename on promotion | R-038 §2 | Exact |

### Implicitly established but not formalized

| Rule | Inferred from |
|------|---------------|
| Wikipedia is acceptable as secondary/scaffolding but not as sole primary source | README_for_Copilot.md "tertiary as scaffolding" + provenance hierarchy |
| `needs_verification` status means the row is not yet promotion-ready | BBL_Seed_Landmarks.csv status column + BBL_Lookup_Playbook workflow |
| Events require separate schema decision before runtime promotion | R-049 (events have no runtime representation) |
| `_legacy/` files must not be used | R-049 |

### Not yet defined anywhere in the repo

- Minimum number of independent sources required per POI
- Whether a POI can ship without images (or with placeholder images)
- Formal reject/defer conditions
- Whether `needs_verification` landmarks can ever be promoted without BBL verification
- How to handle landmarks that no longer physically exist
- Whether events can be promoted as POIs or require their own schema

## Synthesized POI-Promotion Criteria

The following criteria synthesize all existing repo rules into a single checklist. Items marked **(repo-stated)** come directly from existing docs. Items marked **(synthesized)** are logical extensions grounded in the repo's quality bar but not previously formalized.

### 1. Source Hierarchy

| Tier | Definition | Examples | Use for |
|------|-----------|----------|---------|
| **Primary** (required for critical facts) | Official government, institutional, or archival sources with direct authority | LPC designation reports, NYC DOF/ACRIS, NYPL maps/photos, NPS nominations, period newspapers (digitized), city agency records, PLUTO/ZoLa | BBL, dates, identities, addresses, coordinates |
| **Secondary** (acceptable for enrichment) | Institutional websites, museum databases, reputable press, scholarly publications | Organization websites (e.g., bluenotejazz.com, publictheater.org), NYT, academic papers, CultureNOW | Summary/description text, context, historical narrative |
| **Scaffolding** (leads only — not sufficient alone) | General reference, crowd-sourced, or unverifiable sources | Wikipedia, HMdb.org, blog posts, social media, property listing sites | Initial discovery, fact-checking pointers — must be corroborated by primary or secondary before promotion |

**(repo-stated):** "Primary sources first; institutional next; tertiary as scaffolding" (Manhattan_ScopePlan.md).
**(repo-stated):** "Primary is required for critical facts (BBL, dates, identities)" (README_for_Copilot.md §2).

### 2. BBL Verification Requirements

**(repo-stated)** — from BBL_Lookup_Playbook.md and README_for_Copilot.md:

- BBL must be derived from a primary source — never invented or guessed
- Source hierarchy for BBL: LPC reports → DOF/ACRIS/PIP → NYC Open Data (PLUTO/MapPLUTO) → official agency PDFs → (last resort) trusted property indices
- BBL format: 10-digit string = `1` (Manhattan) + 5-digit block (left-padded) + 4-digit lot (left-padded)
- Cross-check lat/lng against the BBL lot geometry (ZoLa or PLUTO)
- If BBL cannot be resolved (e.g., condo lot, park with no single lot), leave `bbl` empty and open a verification task — do not promote with a guessed BBL
- Record the source used and date of verification

**(synthesized):** A POI may be promoted without a BBL if the landmark is a park, public space, or multi-lot complex where no single BBL applies — but only if coordinates and address are independently verified from a primary source.

### 3. Minimum Evidence Before Promotion

A BBL landmark seed row requires the following before it can be promoted to a runtime POI:

| Field | Required? | Minimum evidence standard |
|-------|-----------|--------------------------|
| `id` (slug) | Yes | Unique, kebab-case, includes era year suffix (e.g., `federal-hall-1852`) |
| `name` | Yes | Official or commonly accepted name, verifiable against a primary or secondary source |
| `summary` | Yes | 1 sentence, factual, written by a human or reviewed human — not auto-generated filler |
| `description` | Yes | 2–5 sentences, historically grounded, citing at least 1 primary fact |
| `coords.lat` / `coords.lng` | Yes | From a verifiable source (ZoLa lot centroid, official park coordinates, NYPL map cross-reference). Never inferred from vague addresses **(repo-stated)** |
| `neighborhood` | Yes | Matching an established neighborhood name used in the repo (consistent with existing POIs) |
| `tags` | Yes | ≥ 1 tag from the controlled list: architecture, politics, public-art, infrastructure, engineering, residential, education, public-space, transportation, hospitality, commerce, music, cinema, lgbtq, crime, art, labor, disaster, sports, literature, media |
| `year` | Yes | One of the 7 canonical eras (1852, 1877, 1902, 1927, 1952, 1977, 2002) |
| `sources` | Yes | ≥ 1 source with `{title, publisher, url}` — at least 1 must be primary or secondary (not scaffolding-only) |
| `images` | Recommended | ≥ 1 image with `{url, credit, license}`. Public domain or CC-licensed preferred. If no image is available, the POI may still be promoted but is flagged as image-pending |
| `borough` | Yes | `"Manhattan"` for current scope |
| `area` | Yes | Cross-street or block description |
| `block` | Yes | Street block description |
| `route_id` | Yes | Assigned route group (e.g., `FIDI-1852`) |
| `order` | Yes | Position within route (integer) |

**(synthesized):** `route_id` and `order` assignment may happen at promotion time rather than in the seed data — these are editorial decisions, not provenance questions.

### 4. Independent Verifiability

**(repo-stated + synthesized):**

- **Critical facts** (BBL, coordinates, founding/construction dates, names of principals) must be independently verifiable against at least 1 primary source
- **Narrative claims** (description text, historical context) should be supported by at least 1 secondary source
- If a claim appears only in Wikipedia with no linked primary citation, it is a **lead** — not a verified fact. It must be corroborated before the POI ships

### 5. When a Source Is a Lead vs. Promotion-Ready

| Scenario | Status | Action |
|----------|--------|--------|
| Wikipedia article with linked primary citations (e.g., LPC report PDF) | **Lead → verify** | Follow the primary citation link; if it confirms the fact, record the primary source |
| Wikipedia article with no linked primary citations | **Lead only** | Do not promote the fact. Search for a primary source independently |
| PropertyShark or similar listing site | **Lead only** | Use only to find block/lot numbers, then verify via ZoLa or DOF |
| LPC designation report | **Primary — promotion-ready** | Record as source_primary |
| NYC Parks official page | **Secondary — promotion-ready** | Acceptable for name, address, summary, description |
| Museum / organization website (e.g., publictheater.org) | **Secondary — promotion-ready** | Acceptable for enrichment facts; not sufficient alone for BBL or dates |
| Blog post, social media, undated | **Unacceptable** | Do not use as evidence for any fact |

### 6. Treatment of Wikipedia-Only or Weakly Cited Material

**(synthesized from repo quality bar):**

- A POI whose **only** source is Wikipedia is **not promotion-ready**
- Wikipedia is acceptable as one of multiple sources (i.e., as scaffolding) when paired with at least 1 primary or secondary source
- If Wikipedia is the discovery source, the researcher must follow its citations to find the underlying primary authority
- Rows in seed CSVs that cite only "Wikipedia" or "press" without URLs remain at `needs_verification` status

### 7. Exclusion Rules / Reject Conditions

A seed row must be **rejected or deferred** if any of these apply:

| Condition | Disposition |
|-----------|------------|
| No verifiable address or coordinates — cannot be placed on a map | **Reject** |
| BBL is guessed or derived from non-authoritative source | **Defer** until verified via BBL Lookup Playbook |
| Only source is Wikipedia with no linked primary citation | **Defer** until a primary or secondary source is found |
| Only source is a blog, social media, or undated page | **Reject** |
| Landmark has no clear historical significance (no LPC, NPS, or equivalent recognition) | **Defer** — needs editorial justification |
| Density cap exceeded: > 3 attractions on the same block for the same era | **Not a reject/defer for credibility.** This is a current operational/runtime curation cap, not a permanent truth rule. If more than 3 well-sourced candidates exist on a block, additional candidates are **eligible but not currently selected** — flag as overflow for future weighted/ranked experiences. Do not reject well-supported candidates solely because the cap is hit. |
| Row is from `_legacy/` directory | **Reject** — use the canonical copy in `attractions/` or root |
| Row has `needs_verification` status and no verification work has been done | **Defer** — cannot promote until verified |
| Coordinates inferred from vague address without cross-check | **Reject** coordinates — must re-derive from authoritative source |

### 8. Duplicate and Legacy Handling

**(repo-stated + synthesized):**

- `_legacy/root-duplicates-2026-02-07/` files are confirmed duplicates — never use as source. Always use the canonical copies in `data/historical/attractions/` or root.
- If the same landmark appears in multiple seed CSVs (e.g., `BBL_Seed_Landmarks.csv` and `BBL_Seed_Landmarks_Extended.csv`), prefer the row with `status: verified` and the most complete fields.
- The aggregated `AllYears_withBBL.csv` files represent Union Square + Flatiron only — these are already in runtime. Do not re-promote them.
- If two overlapping event CSVs contain the same event, prefer the version with primary source citations over the one without.

### 9. Events: Separate Treatment

**(repo-stated from R-049):** Events have no runtime representation in `poi.v1.json`.

Until a schema decision is made:
- Events remain in their seed CSVs as research material
- Events are **not promotable** to `poi.v1.json` under the current criteria
- Event data may inform POI descriptions or interest tags (e.g., "The Stonewall uprising (1969) occurred here" in a POI description), but the event itself is not a POI
- A future schema decision (event type, event layer, or event-as-POI) is required before event promotion criteria can be defined
- This is listed as an open question below

## Required Verification Checklist Before POI Creation

For each BBL landmark seed row being considered for promotion, verify:

- [ ] **Name:** Confirmed against a primary or secondary source
- [ ] **Address:** Verified — not vague or approximate
- [ ] **Coordinates:** From ZoLa lot centroid, official source, or NYPL cross-reference — never inferred from vague address
- [ ] **BBL:** From primary source (LPC/DOF/PLUTO/ZoLa) — or explicitly marked N/A for parks/multi-lot
- [ ] **BBL cross-check:** lat/lng falls within or adjacent to the BBL lot geometry
- [ ] **Sources:** ≥ 1 primary or secondary source with full `{title, publisher, url}`
- [ ] **Summary/description:** Written, factual, historically grounded — not auto-generated filler
- [ ] **Tags:** ≥ 1 from controlled list
- [ ] **Year:** Assigned to one of the 7 canonical eras
- [ ] **Images:** ≥ 1 with license info (or flagged image-pending)
- [ ] **Density check (operational, not credibility):** Note if > 3 attractions exist on this block for this era. This is a current runtime cap, not a promotion-eligibility gate. Excess candidates are eligible but deferred for selection/ranking, not rejected for weak sourcing
- [ ] **No Wikipedia-only:** At least 1 non-Wikipedia source
- [ ] **Not from _legacy/:** Using canonical file copy
- [ ] **Status:** Changed from `needs_verification` to `verified` after passing above checks

## Open Questions

| # | Question | Why it matters |
|---|----------|---------------|
| 1 | Should events be promotable as a distinct runtime type? | 88+ events in seed CSVs have no runtime path; blocks a large data tranche |
| 2 | Can a POI ship without any images? | R-038 proposes "every promoted POI should have ≥ 1 real image" but this is not yet enforced; some landmarks may lack public-domain imagery |
| 3 | What is the minimum number of independent sources? | This doc recommends ≥ 1 primary/secondary, but some teams use ≥ 2 independent sources for critical claims |
| 4 | Should `route_id` and `order` be assigned in the seed CSV or at promotion time? | Current seed landmarks lack these fields; they are editorial grouping decisions, not provenance |
| 5 | How should landmarks that no longer physically exist be handled? | A demolished building was historically present in an era — is it a valid POI? (Likely yes for historical context, but needs editorial policy) |
| 6 | Should the promotion pipeline (R-038 `promote-pois.ts`) be built before or after the first batch promotion? | Manual promotion is possible for small batches; script is needed for scale |
| 7 | What is the de-duplication key across seed CSVs? | `name + neighborhood` or `bbl10` or `address`? No canonical de-dup rule exists |

## Suggested Next Actions

1. **Resolve open question #1 (events).** This unblocks the largest data tranche (88+ events) and determines whether we need a separate schema.
2. **Pick a small batch (5–10 Lower Manhattan landmarks) and apply this checklist manually.** This validates the criteria against real data before scaling.
3. **Complete R-038 (promotion pipeline).** Formalizes the CSV → JSON generation and validation gates.
4. **Assign `route_id` / `order` editorial conventions.** Decide whether these belong in the seed CSV or are added at promotion time.
5. **Address open question #2 (images).** Decide if image-pending POIs can ship or must wait.

## Confidence Statement

- **Confidence:** 92%
- **Basis:** All criteria are grounded in existing repo docs (README_for_Copilot, BBL_Lookup_Playbook, R-034, R-038, R-049, PROVENANCE). Synthesized rules extend the explicitly stated rules logically. Open questions are clearly labeled rather than decided prematurely.
- **Ready to proceed:** YES — sufficient for a future batch-promotion story to use as its quality gate.
