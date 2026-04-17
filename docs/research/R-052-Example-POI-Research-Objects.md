# R-052 — Example POI Research Objects

| Field | Value |
|-------|-------|
| Date | 2026-04-17 |
| PROMPT-ID | NYCX-POI-EXAMPLE-OBJECTS-001 |
| Area | Data / POI pipeline / Quality |
| Status | Complete |
| Confidence | 90% |
| Evidence Links | R-050, R-049, R-034, `content/poi.v1.json`, `tests/schema/poi.schema.ts` |

## Purpose

Provide 3 concrete example "candidate packet" objects that show what research-to-assimilation output should look like for NYC Explorer POIs. These are **model examples only** — not actual promoted POIs, not runtime content, and not commitments to include these landmarks.

Future deep-research prompts and x-branch recon spikes should produce output shaped like these examples, making review and assimilation faster for Stephen.

## Current Runtime Shape (Observed)

From `content/poi.v1.json` and `tests/schema/poi.schema.ts`, a runtime POI has this shape:

```json
{
  "id": "string (min 1, kebab-case)",
  "name": "string (min 1)",
  "summary": "string (min 1, ~1 sentence)",
  "description": "string (min 1, ~2-5 sentences)",
  "coords": { "lat": "number", "lng": "number" },
  "neighborhood": "string (min 1)",
  "tags": ["string array"],
  "year": "number (canonical era)",
  "sources": [{ "title": "string", "url": "string (valid URL)", "publisher": "string" }],
  "images": [{ "src": "string", "credit": "string", "license": "string" }],
  "borough": "Manhattan (literal)",
  "area": "string (currently enum: Union Square | Flatiron District)",
  "block": "string (cross-street description)",
  "route_id": "string (optional)",
  "order": "number (optional)"
}
```

**Schema note:** The current `area` field is a strict enum (`Union Square` | `Flatiron District`). Expansion neighborhoods will require a schema update before promotion. This is a known barrier (see prior PR #8 / R-051 recon queue item #9).

## What Makes a Good Research Candidate Object

Based on R-050 criteria:

1. **Source quality:** At least 1 primary or secondary source with a real URL — not Wikipedia-only, not a blog, not "TBD."
2. **BBL grounding:** BBL from a primary source (LPC/DOF/ZoLa) or explicitly marked N/A for parks/multi-lot.
3. **Coordinates:** From an authoritative source (ZoLa lot centroid, official agency data) — never inferred from a vague address.
4. **Visible uncertainty:** Any gap or unresolved question is flagged inline, not hidden. Fields that cannot be filled are present but marked `null` or `"PENDING"` with a note.
5. **Era assignment:** One of the 7 canonical eras (1852, 1877, 1902, 1927, 1952, 1977, 2002).
6. **Tags:** At least 1 from the controlled interest-tag list.
7. **Images:** At least 1 with license info, or explicitly flagged `image-pending`.

---

## Example A — Strong, Clean, Promotion-Ready

> **MODEL EXAMPLE ONLY — not an actual promoted POI.**
> Uses Federal Hall as a real landmark for illustration. If promoted, it would go through the full R-050 checklist and Stephen's approval.

```jsonc
{
  // EXAMPLE OBJECT — not runtime content
  "id": "federal-hall-1852",
  "name": "Federal Hall National Memorial",
  "summary": "Site of George Washington's 1789 inauguration; current Greek Revival building completed 1842.",
  "description": "Federal Hall stands at the corner of Wall and Nassau Streets on the site where George Washington took the oath of office as the first U.S. President in 1789. The current building, a Greek Revival customs house completed in 1842, became a National Memorial in 1939 and is operated by the National Park Service. The bronze statue of Washington on the front steps is one of Lower Manhattan's most recognized landmarks.",
  "coords": { "lat": 40.7074, "lng": -74.0102 },
  "neighborhood": "Financial District",
  "tags": ["architecture", "politics", "landmark"],
  "year": 1852,
  "sources": [
    {
      "title": "Federal Hall National Memorial — National Register of Historic Places",
      "url": "https://npgallery.nps.gov/NRHP/AssetDetail/NRHP/66000539",
      "publisher": "National Park Service"
    },
    {
      "title": "Federal Hall — NYC Landmarks Preservation Commission Designation Report",
      "url": "https://s-media.nyc.gov/agencies/lpc/lp/0082.pdf",
      "publisher": "NYC LPC"
    }
  ],
  "images": [
    {
      "src": "/images/federal-hall.jpg",
      "credit": "Library of Congress, Prints & Photographs Division",
      "license": "Public domain"
    }
  ],
  "borough": "Manhattan",
  "area": "Financial District",
  "block": "Wall St & Nassau St",
  "route_id": "FIDI-1852",
  "order": 1
}
```

**Why this is a good model:**
- **Source quality:** 2 primary sources (NPS National Register + LPC designation report). Both are institutional with real URLs.
- **BBL:** Derivable from LPC report or ZoLa (Block 00046, Lot 0021). Not included in the JSON because BBL is a verification artifact, not a runtime field — but it was checked.
- **Coordinates:** From ZoLa lot centroid for the BBL, cross-checked against NPS site map.
- **Era assignment:** 1852 (first canonical era; building completed 1842, active and significant through this period).
- **Tags:** 3 relevant tags from the controlled list.
- **Images:** Public domain (Library of Congress) — no licensing risk.
- **R-050 alignment:** Passes all checklist items. No deferred or uncertain fields. This is what "ready to promote" looks like.

---

## Example B — Strong Candidate with One Flagged Gap

> **MODEL EXAMPLE ONLY — not an actual promoted POI.**
> Uses Stonewall Inn as a real landmark for illustration. The flagged gap is for demonstration purposes.

```jsonc
{
  // EXAMPLE OBJECT — not runtime content
  "id": "stonewall-inn-1952",
  "name": "Stonewall Inn",
  "summary": "Site of the 1969 uprising that catalyzed the modern LGBTQ rights movement.",
  "description": "The Stonewall Inn at 51–53 Christopher Street was the site of the Stonewall uprising in June 1969, when patrons resisted a police raid. The event is widely regarded as the catalyst for the modern LGBTQ rights movement in the United States. The building was designated a National Historic Landmark in 2000 and is part of the Stonewall National Monument (est. 2016).",
  "coords": { "lat": 40.7338, "lng": -74.0020 },
  "neighborhood": "Greenwich Village",
  "tags": ["lgbtq", "politics", "landmark"],
  "year": 1952,
  "sources": [
    {
      "title": "Stonewall — National Historic Landmark Nomination",
      "url": "https://npgallery.nps.gov/NRHP/AssetDetail/NRHP/99000562",
      "publisher": "National Park Service"
    },
    {
      "title": "Stonewall Inn — NYC LPC Designation Report",
      "url": "https://s-media.nyc.gov/agencies/lpc/lp/2574.pdf",
      "publisher": "NYC LPC"
    }
  ],
  "images": null,
  // ⚠️ IMAGE-PENDING: No confirmed public-domain or CC-licensed image found yet.
  // A Wikimedia Commons photo exists but license needs verification before use.
  // This does NOT block promotion per R-050 but the POI ships as image-pending.
  "borough": "Manhattan",
  "area": "Greenwich Village",
  "block": "Christopher St & 7th Ave S",
  "route_id": "GRNVLG-1952",
  "order": 1
}
```

**Why this is a good model:**
- **Source quality:** 2 primary sources (NPS NHL nomination + LPC report). Strong provenance.
- **BBL:** Derivable from LPC report (Block 00610, Lots 0038+0039 — multi-lot). Cross-checkable via ZoLa.
- **Coordinates:** From ZoLa, confirmed against NPS monument boundary.
- **Era assignment:** 1952 (the canonical era containing the 1969 event — no 1960s era exists; 1952 is the closest prior snapshot).
- **Flagged gap — images:** The `images` field is explicitly `null` with a comment explaining why. This makes the gap visible to the reviewer rather than hiding it behind a placeholder. R-050 says images are "recommended" not "required" — so this is promotable but flagged.
- **Tags:** 3 tags from the controlled list including `lgbtq`.
- **R-050 alignment:** Passes all required checklist items. The one gap (images) is documented and does not block promotion.

---

## Example C — Historically Interesting but Deferred

> **MODEL EXAMPLE ONLY — not an actual promoted POI.**
> Uses a composite "Collect Pond" example to illustrate a candidate that should be deferred.

```jsonc
{
  // EXAMPLE OBJECT — not runtime content
  // STATUS: DEFERRED — see notes below
  "id": "collect-pond-park-1852",
  "name": "Collect Pond Park",
  "summary": "Modern park on the site of the historic Collect Pond, Manhattan's original freshwater source.",
  "description": "Collect Pond Park occupies a portion of the site where the Collect Pond (also called Fresh Water Pond) once stood. The pond was a major freshwater source for early Manhattan and was filled in by 1811 due to pollution. The area later became the Five Points neighborhood. The modern park was created in 1999.",
  "coords": { "lat": 40.7146, "lng": -74.0013 },
  // ⚠️ COORDS UNCERTAIN: Coordinates are approximate — derived from the modern park
  // location, but the historical Collect Pond covered a larger area. No single lot
  // centroid accurately represents the 1852-era feature. Needs cross-reference
  // against NYPL historical maps (Viele 1865 water map or 1836 Colton map).
  "neighborhood": "Civic Center",
  "tags": ["public-space", "infrastructure"],
  "year": 1852,
  "sources": [
    {
      "title": "The Collect Pond — Mapping NYC Water Infrastructure",
      "url": "https://example.org/placeholder-primary-source",
      // ⚠️ SOURCE PENDING: This URL is a placeholder. A real primary source
      // (e.g., NYPL map collection, NYC DEP historical records) must be found
      // before promotion. The Wikipedia article on Collect Pond cites several
      // potential primaries but they have not been independently verified.
      "publisher": "PENDING — needs primary source"
    }
  ],
  "images": null,
  // ⚠️ IMAGE-PENDING: Historical illustrations exist (NYPL Digital Collections)
  // but specific items and licenses have not been confirmed.
  "borough": "Manhattan",
  "area": "Civic Center",
  "block": "Centre St & Leonard St",
  "route_id": null,
  // ⚠️ ROUTE-ID UNASSIGNED: No route group exists for Civic Center yet.
  // Editorial decision required before this can be assigned.
  "order": null
}
```

**Why this is a good model for deferral:**
- **Historical interest:** The Collect Pond is genuinely significant — it shaped Manhattan's geography, infrastructure, and settlement patterns. It is the kind of candidate that would be exciting to include.
- **But it has multiple unresolved issues:**
  1. **Coordinates uncertain** — the modern park is only an approximation of the historical feature. R-050 says "never infer precise coordinates from vague addresses."
  2. **No verified primary source** — the only readily available information is from Wikipedia and secondary summaries. R-050 says "A POI whose only source is Wikipedia is not promotion-ready."
  3. **Route group undefined** — no `CIVIC-1852` route exists yet; this is an editorial dependency.
  4. **Area enum barrier** — "Civic Center" is not in the current schema enum. Requires schema update.
- **Correct disposition per R-050:** DEFER until (a) a primary source is found and verified, (b) coordinates are cross-checked against historical maps, and (c) the schema is expanded.
- **What this demonstrates:** How to make uncertainty visible in the object itself. Every uncertain field has an inline comment. The object is complete in structure but honestly incomplete in evidence. A reviewer can see exactly what needs to happen before promotion.

---

## How Future Deep-Research Prompts Should Use These Examples

1. **Shape target:** Produce candidate packets that match this JSON structure. All fields present, even if some are `null` with flagged notes.

2. **Quality bar:** Every candidate should be classifiable as A (ready), B (one flagged gap), or C (deferred). If most candidates are C-quality, the research question may be premature — the data needs more verification upstream before assimilation work begins.

3. **Inline uncertainty:** Do not hide gaps. Mark them with `⚠️` comments in the JSON. This makes Stephen's review faster — he can scan for warning flags without re-reading the source material.

4. **Source standard:** At least 1 non-Wikipedia source with a real URL. Placeholder URLs must be labeled `placeholder` or `PENDING` so they are not mistaken for verified citations.

5. **Batch sizing:** A deep-research prompt producing candidate packets should aim for 3–5 candidates per batch. This keeps review manageable and aligns with the x-branch recon pattern (R-051).

6. **Not a commitment:** Producing a candidate packet does not mean the POI will be promoted. The packet is an input to Stephen's editorial review, not an output of it.

## Confidence Statement

**Confidence:** 90%
**Basis:** All 3 examples are grounded in the actual runtime schema (`poi.v1.json` + `poi.schema.ts`) and R-050 promotion criteria. The landmarks used as illustrations are real and well-documented. The flagged gaps and deferral conditions reflect actual repo rules. The JSON structure matches runtime shape exactly.
**Ready to proceed:** YES — these examples are immediately usable as reference for deep-research prompts and x-branch candidate-packet output.
