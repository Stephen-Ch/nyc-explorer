# NYC TimeWalk — Quickstart README
**Date:** 2025-10-29 • **Status:** Planning (pre‑code) • **Owner:** Editor‑in‑Chief (solo to MVP)

> A year‑specific, lot‑accurate Manhattan walking router that highlights the best **three stories per block**, 
> sourced from **primary records** and tuned by an **interest‑aware** route scorer.

## TL;DR
Pick **A → B** and a **Year**. We return a Google‑maps‑style walking route with annotated **Attractions**
(buildings, venues, businesses, events) active that year. We allow a small **Detour Budget** (e.g., +5% time)
to trade speed for richer stories. Everything is **primary‑sourced, PD/open** where possible.

## Product Slice (MVP)
- **Geo:** Manhattan, **14th–42nd Street** corridor (exact polygon TBD).
- **Time:** **Exact Year** (DB supports intervals too). One pilot year published at launch.
- **Display:** **Max 3 attractions per block**, with “More available (+N)” overflow.
- **Inputs:** Origin, Destination, Year, **Detour Budget** (0–10%). “Speed ↔ Stories” slider.
- **Save:** Users can save items to a reading list (anon key OK).

## Core Principles
- **Academic rigor:** every published claim cites ≥1 primary source; confidence recorded per claim/interval.
- **Lot‑first:** all content anchors to a **BBL** with **lot timelines** (from_year–to_year).
- **Editor‑set Power (1–3):** 3 = seminal; 2 = notable; 1 = context. Used for ranking and density capping.
- **Rights‑clear:** embed PD/CC0/permitted CC only; otherwise link‑out with thumbnails.
- **Desktop‑first MVP;** researcher/editor work happens in a **DB‑backed UI** (no production spreadsheets).

## What “Done” Means (MVP Acceptance)
- Route renders in ≤2s on desktop for typical A→B within the corridor.
- Detour slider increases **RouteScore** without exceeding the chosen time cap.
- ≥120 approved attractions across the corridor; each has **blurb + 3‑para essay + ≥1 primary source**.
- Per‑block density rule enforced; overflow visible.
- Shareable deep link restores **A, B, Year, Detour, pins**.

## Data Model (bird’s‑eye)
- **lots, lot_timelines, attractions, attraction_years, events, interests, sources, source_links, media, blocks, block_attraction_index, route_cache, saved_items.**
- Status workflow: **draft → fact_checked → approved** with audit trail; rights + confidence required.

## Routing & Scoring (plain‑English)
- Start with the fastest walking path on the **NYC LION** (or OSM) pedestrian graph.
- Consider alternates that add short side streets.
- Score each candidate by **story density along the path** (Power‑weighted attractions within ~50m).
- Choose the **best score** subject to the Detour Budget. The slider tunes the time penalty vs stories.

## Editorial Ladder
1) **Blurb (≤200 chars)** → map pin.
2) **3‑paragraph essay** → origin, peak, what changed/why it matters.
3) **In‑depth** → footnoted narrative with images/maps and extended sources.

## Teams & Roles
- **Solo to MVP:** Product/Editor‑in‑Chief (you).
- **Post‑MVP:** 
  - **Research Team A** (Time/Space): expand years & neighborhoods; lot timelines and core attractions.
  - **Research Team B** (Entertainment): venues, performance runs, people (VIAF/ISNI/LCNAF), setlists/playbills.

## Researcher UI (no‑code spec)
- Queues: Needs‑Primary, Low‑Confidence, Ready‑for‑Review, Density Conflicts.
- Editors: Lot Timeline editor, Attraction editor, Events, Sources manager, Review diff panel, Density resolver.

## Primary Sources (starter set)
- NYC MapPLUTO/PLUTO (BBL & lots), NYC LION (network), ACRIS (post‑1966), NYC Municipal Archives tax photos (1939–41), 
  LPC designation reports, NYPL Map Warper (Bromley/Robinson/Sanborn PD sets), period newspapers/directories/playbills.

## Working Norms
- **Decisions log:** append one line per decision (date | decision | rationale | owner).
- **Checklists:** Lot Interval / Attraction / Performance Run must pass before “approved.”
- **Weekly demo:** show coverage added and any rubric tweaks; sample QA of 10% new items.

## North‑Star (v10.x)
- **AR/VR “Time‑Travel Performances”** (paid episodes). Example: *Sam Cooke at the Copa (1964):* portal to the supper‑club, spatial audio, 
  labeled **Original Master / Re‑performance / Composite**, replayable beats.

## Contact
- Owner: (your name/contact here) • Repo/KB: shared folder or drive link (TBD).
