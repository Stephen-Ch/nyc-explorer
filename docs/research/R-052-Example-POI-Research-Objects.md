# R-052 — Deep-Research Output Contract: Candidate Packet Specimens

| Field | Value |
|-------|-------|
| Date | 2026-04-17 |
| PROMPT-ID | NYCX-R052-CONTRACT-SPECIMENS-REWRITE-001 |
| Area | Data / POI pipeline / Quality |
| Status | Complete |
| Confidence | 92% |
| Evidence Links | R-050, R-049, R-034, `content/poi.v1.json`, `tests/schema/poi.schema.ts` |

## Purpose

Define the exact output shape that future deep-research batches and x-branch recon spikes should produce when researching POI candidates. This doc contains **structural specimens**, not real content — the specimens use neutral placeholder names and labeled source slots so they cannot be confused with actual accepted POIs.

## What This Doc Is For

- **For deep-research prompts:** "Produce candidate packets shaped like the specimens in R-052."
- **For x-branch recon spikes:** The spike report's candidate output section should match this structure.
- **For Stephen's review:** Every candidate packet arriving for assimilation review should be classifiable as A (promotion-ready), B (one flagged gap), or C (deferred). If the output doesn't fit one of these categories, the research prompt needs rework.

This doc does **not** define promotion policy (that is R-050) or the runtime schema (that is `poi.schema.ts`). It defines the **handoff shape** between research and assimilation.

## Current Runtime Shape Constraints (Observed)

From `content/poi.v1.json` and `tests/schema/poi.schema.ts`:

| Field | Type | Required | Constraints |
|-------|------|----------|-------------|
| `id` | string | Yes | min 1 char, kebab-case, should include era suffix (e.g., `slug-1852`) |
| `name` | string | Yes | min 1 char |
| `summary` | string | Yes | min 1 char, ~1 sentence |
| `description` | string | Yes | min 1 char, ~2–5 sentences, historically grounded |
| `coords` | object | Yes | `{ lat: number, lng: number }` — from authoritative source, never inferred |
| `neighborhood` | string | Yes | min 1 char |
| `tags` | string[] | Yes | ≥ 1 from controlled interest-tag list |
| `year` | number | Yes | one of 7 canonical eras: 1852, 1877, 1902, 1927, 1952, 1977, 2002 |
| `sources` | array | Yes | `[{ title: string, url: string (valid URL), publisher: string }]` — ≥ 1 primary or secondary |
| `images` | array | Yes | `[{ src: string, credit: string, license: string }]` — may be empty/null if flagged image-pending |
| `borough` | string | Yes | literal `"Manhattan"` |
| `area` | string | Yes | currently enum `"Union Square"` or `"Flatiron District"` — expansion neighborhoods require schema update |
| `block` | string | Yes | cross-street description |
| `route_id` | string | Optional | route group identifier (e.g., `FIDI-1852`) |
| `order` | number | Optional | position within route |

**Key constraint:** The `area` enum is currently locked to Union Square / Flatiron District. Any candidate from a different neighborhood will require a schema update before runtime promotion. This is a known barrier, not a reason to reject a candidate packet.

## How Future Deep-Research Output Should Be Structured

Each candidate packet produced by deep-research work should include:

1. **A JSON-shaped object** with all fields from the table above, using `null` for genuinely unknown values (never omitting fields silently).
2. **Inline flags** (`⚠️`) on any field that is uncertain, pending, or below the R-050 quality bar.
3. **A disposition note** classifying the candidate as:
   - **A — Promotion-ready:** All R-050 checklist items pass. Human assimilation review still required.
   - **B — Flagged gap:** Passes most criteria but has one explicitly identified gap that does not block promotion.
   - **C — Deferred:** Interesting but has unresolved issues that prevent promotion until resolved.
4. **A short evidence summary** explaining source quality, coordinate provenance, and any verification work done or remaining.

A candidate packet is an **input to Stephen's editorial review**, not an output of it. "Promotion-ready" means the evidence is sufficient for review — not that the candidate is pre-approved.

---

## Specimen A — Promotion-Ready Candidate Packet

> **STRUCTURAL SPECIMEN — not real content. Names, coordinates, and sources are placeholders.**

```jsonc
{
  // SPECIMEN — structural example only
  "id": "example-candidate-a-1902",
  "name": "EXAMPLE_CANDIDATE_A",
  "summary": "[One-sentence factual summary of the landmark, grounded in a primary source.]",
  "description": "[2–5 sentences of historically grounded description. At least 1 primary fact cited. Written or human-reviewed — not auto-generated filler.]",
  "coords": { "lat": 0.0000, "lng": 0.0000 },
  // Coordinates: from ZoLa lot centroid or equivalent authoritative source.
  // Cross-checked against lot geometry or official site boundary.
  "neighborhood": "EXAMPLE_NEIGHBORHOOD",
  "tags": ["architecture", "landmark"],
  // Tags: ≥ 1 from the controlled interest-tag list.
  "year": 1902,
  // Year: one of the 7 canonical eras.
  "sources": [
    {
      "title": "[Primary source title — e.g., LPC designation report, NPS nomination, NRHP listing]",
      "url": "PRIMARY_SOURCE_URL",
      // A real, verifiable URL to an institutional/archival source with direct authority.
      // Examples of acceptable source types: LPC reports, NPS nominations, DOF/ACRIS records,
      // NYPL digitized materials, city agency publications.
      "publisher": "[Institutional publisher name]"
    },
    {
      "title": "[Secondary source title — e.g., museum website, reputable press, scholarly article]",
      "url": "SECONDARY_SOURCE_URL",
      // A real URL to an institutional or reputable secondary source.
      // Acceptable: organization websites, NYT, academic papers, CultureNOW.
      // NOT acceptable as sole source: Wikipedia, blogs, social media, undated pages.
      "publisher": "[Publisher name]"
    }
  ],
  "images": [
    {
      "src": "/images/example-candidate-a.jpg",
      "credit": "[Credit line — e.g., Library of Congress, NYPL Digital Collections]",
      "license": "[License — e.g., Public domain, CC-BY-SA-4.0]"
    }
  ],
  "borough": "Manhattan",
  "area": "EXAMPLE_NEIGHBORHOOD",
  // Note: if this neighborhood is not in the current area enum, flag as schema-barrier.
  "block": "[Cross-street description, e.g., Main St & 2nd Ave]",
  "route_id": "EXNB-1902",
  // Route group: assigned at promotion time or in seed data. Editorial decision.
  "order": 1
}
```

**Disposition: A — Promotion-ready**

| Check | Status |
|-------|--------|
| Sources | ≥ 1 primary + ≥ 1 secondary, both with real URLs |
| Coordinates | From authoritative source, cross-checked |
| BBL (verification artifact) | Derived from primary source, confirmed via ZoLa |
| Summary/description | Factual, historically grounded, human-reviewed |
| Tags | ≥ 1 from controlled list |
| Year | Canonical era assigned |
| Images | ≥ 1 with license info |
| No Wikipedia-only | Confirmed |
| Not from _legacy/ | Confirmed |

**What "promotion-ready" means here:** The evidence is sufficient for Stephen's assimilation review. It does not mean pre-approved — Stephen still makes the editorial decision.

---

## Specimen B — Strong Candidate with One Unresolved Gap

> **STRUCTURAL SPECIMEN — not real content.**

```jsonc
{
  // SPECIMEN — structural example only
  "id": "example-candidate-b-1952",
  "name": "EXAMPLE_CANDIDATE_B",
  "summary": "[One-sentence factual summary.]",
  "description": "[2–5 sentences, historically grounded.]",
  "coords": { "lat": 0.0000, "lng": 0.0000 },
  // Coordinates: from authoritative source, cross-checked.
  "neighborhood": "EXAMPLE_NEIGHBORHOOD_2",
  "tags": ["politics", "landmark"],
  "year": 1952,
  "sources": [
    {
      "title": "[Primary source — e.g., NHL nomination]",
      "url": "PRIMARY_SOURCE_URL",
      "publisher": "[Institutional publisher]"
    },
    {
      "title": "[Secondary source — e.g., LPC report]",
      "url": "SECONDARY_SOURCE_URL",
      "publisher": "[Institutional publisher]"
    }
  ],
  "images": null,
  // ⚠️ IMAGE-PENDING: No confirmed public-domain or appropriately licensed image
  // found yet. Research identified potential candidates in [source collection] but
  // license status has not been verified.
  // Per R-050: images are recommended, not required. This candidate is promotable
  // but ships as image-pending.
  "borough": "Manhattan",
  "area": "EXAMPLE_NEIGHBORHOOD_2",
  "block": "[Cross-street description]",
  "route_id": "EXNB2-1952",
  "order": 1
}
```

**Disposition: B — Flagged gap (images)**

| Check | Status |
|-------|--------|
| Sources | PASS — primary + secondary with real URLs |
| Coordinates | PASS |
| BBL | PASS |
| Summary/description | PASS |
| Tags | PASS |
| Year | PASS |
| Images | ⚠️ PENDING — does not block promotion but flagged |
| No Wikipedia-only | PASS |

**What this specimen demonstrates:**
- One gap is acceptable if it is **explicitly flagged** with an inline `⚠️` comment explaining what is missing and why it does not block promotion.
- The `images` field is `null` rather than populated with a fake placeholder — honesty over cosmetics.
- The disposition note clearly states the gap and its severity.
- A reviewer can see at a glance what needs follow-up without re-reading the sources.

---

## Specimen C — Deferred Lead Packet

> **STRUCTURAL SPECIMEN — not real content.**

```jsonc
{
  // SPECIMEN — structural example only
  // STATUS: DEFERRED — multiple unresolved issues (see below)
  "id": "example-deferred-c-1852",
  "name": "EXAMPLE_DEFERRED_C",
  "summary": "[One-sentence summary of a historically interesting candidate.]",
  "description": "[2–5 sentences. Content may be partially sourced but not independently verified.]",
  "coords": { "lat": 0.0000, "lng": 0.0000 },
  // ⚠️ COORDS UNCERTAIN: Coordinates are approximate. Derived from a modern
  // reference point but the historical feature's footprint differs. Needs
  // cross-reference against archival maps before promotion.
  "neighborhood": "EXAMPLE_NEIGHBORHOOD_3",
  "tags": ["public-space"],
  "year": 1852,
  "sources": [
    {
      "title": "[Only available source — e.g., Wikipedia article or secondary summary]",
      "url": "SCAFFOLDING_SOURCE_URL",
      // ⚠️ SOURCE INSUFFICIENT: This source is scaffolding-tier only (e.g., Wikipedia,
      // general reference). A primary or secondary source with institutional authority
      // must be found before promotion.
      // Per R-050: "A POI whose only source is Wikipedia is not promotion-ready."
      "publisher": "PENDING — needs primary or secondary source"
    }
  ],
  "images": null,
  // ⚠️ IMAGE-PENDING: Potential historical images may exist in archival collections
  // but have not been identified or license-checked.
  "borough": "Manhattan",
  "area": "EXAMPLE_NEIGHBORHOOD_3",
  // ⚠️ AREA ENUM BARRIER: This neighborhood is not in the current schema enum.
  // Requires schema update before runtime promotion.
  "block": "[Approximate cross-street description]",
  "route_id": null,
  // ⚠️ ROUTE-ID UNASSIGNED: No route group exists for this neighborhood yet.
  // Editorial decision required.
  "order": null
}
```

**Disposition: C — Deferred**

| Check | Status |
|-------|--------|
| Sources | ⚠️ FAIL — scaffolding-only, no primary or secondary |
| Coordinates | ⚠️ UNCERTAIN — approximate, not cross-checked |
| BBL | ⚠️ NOT VERIFIED |
| Summary/description | Partial — not independently verified |
| Tags | PASS |
| Year | PASS |
| Images | ⚠️ PENDING |
| Area enum | ⚠️ BARRIER — schema update needed |
| Route group | ⚠️ UNASSIGNED |

**What this specimen demonstrates:**
- A candidate can be historically significant and still not promotion-ready. Defer is not rejection — it means "needs more work."
- Every uncertain or missing field has an inline `⚠️` flag explaining the gap and what must happen to resolve it.
- The disposition table makes the failure points scannable.
- The packet is structurally complete (all fields present) even though many are flagged — this lets a reviewer see at a glance what the candidate would need.
- Events that were shoehorned into place packets with weak place evidence should look like this: deferred, with the weakness made visible.

**When to defer vs. reject:** Per R-050, defer if the evidence gap is closable (e.g., a primary source likely exists but hasn't been found). Reject if the candidate fundamentally cannot meet the criteria (e.g., no verifiable address, only source is a blog).

---

## Rules for Using These Specimens in Future Deep-Research Prompts

1. **Shape compliance:** Every candidate packet must include all fields from the runtime schema table above. Use `null` for unknown values — never omit fields silently.

2. **Disposition classification:** Every candidate must be classified A, B, or C with a disposition table. If most candidates in a batch are C-quality, the research question may be premature.

3. **Inline uncertainty flags:** Use `⚠️` comments directly in the JSON on the affected field. Do not bury gaps in prose below the object.

4. **Source honesty:** Use labeled placeholders (`PRIMARY_SOURCE_URL`, `SECONDARY_SOURCE_URL`, `SCAFFOLDING_SOURCE_URL`) in specimens. In real candidate packets, use real URLs — never fabricate URLs that look real. If a source has not been found yet, write `"PENDING — [what kind of source is needed]"`.

5. **Batch sizing:** 3–5 candidates per deep-research batch. This keeps review manageable and aligns with the x-branch recon pattern (R-051).

6. **Not a commitment:** A candidate packet is an input to Stephen's editorial review, not a pre-approved promotion.

7. **Events are not place packets:** If the research target is an event rather than a place, do not force it into this structure with weak place evidence. Events require a separate schema decision (R-050 open question #1). Flag event-shaped candidates and defer them.

## What These Specimens Are NOT

- **Not real POIs.** No landmark names, no real coordinates, no real URLs.
- **Not promotion decisions.** The A/B/C classification is a research output, not an editorial verdict.
- **Not schema documentation.** The runtime schema lives in `tests/schema/poi.schema.ts`. This doc references it but does not replace it.
- **Not promotion policy.** Promotion criteria live in R-050. This doc shows the output shape, not the rules.
- **Not a template to copy-paste.** The specimens show structure and quality bar. Real candidate packets should have real content, real sources, and real evidence — just shaped like these specimens.

## Confidence Statement

**Confidence:** 92%
**Basis:** Specimens are grounded in the actual runtime schema (`poi.v1.json` + `poi.schema.ts`) and R-050 promotion criteria. All placeholder fields are labeled. The A/B/C disposition model covers the three cases that arise in practice (ready, one gap, deferred). No real landmarks or URLs are used.
**Ready to proceed:** YES — these specimens are immediately usable as the target shape reference for deep-research prompts and x-branch candidate-packet output.
