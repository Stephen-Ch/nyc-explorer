# R-041 — Eric MVP Requirements Snapshot

**Date:** 2026-03-05  
**Status:** Open  
**Author:** Research pass — decisions captured from prompt §D3  

---

## Purpose

Freeze the open design decisions and closed requirements for the Eric story
MVP (v0.1) in one place, so sprint planning and e2e spec authoring can proceed
from a single source of truth.

Cross-reference: R-036 (Eric MVP contract) contains the user-facing story and
must-have capability list. This document captures the owner decisions made during
the research prompt and consolidates the remaining open questions.

---

## Closed Decisions (confirmed in §D3)

### Map & Location model

| # | Decision |
|---|----------|
| L1 | Map pins = physical locations (lat/lon). The *geographic unit* of the app is a place. |
| L2 | Events are the primary *meaning* unit (what happened), but the map unit is their resolved location. |
| L3 | One event → one location. Events that span multiple locations are out of scope for MVP. |
| L4 | Stable `location_id` is separate from the displayed name; BBL (Block/Lot) is optional enrichment. |

### Interest / Taxonomy model

| # | Decision |
|---|----------|
| T1 | Base taxonomy = DAG (directed acyclic graph). Topics may have multiple parents. |
| T2 | Multi-topic filter default = **OR** (events matching any selected topic show). Toggle to **AND** is in-scope. |
| T3 | Every event in the dataset **must** have ≥1 topic tag. No untagged events in production data. |
| T4 | Parent topic selection **includes all descendants** automatically. Selecting "History" selects all subtopics. |
| T5 | No event containers (series, collections, playlists) in MVP. Each event is standalone. |
| T6 | Mobile MVP taxonomy = 14-value flat list (R-037). DAG edges are a data layer concern; UI presents flat in v0.1. |

### Geocoding model

| # | Decision |
|---|----------|
| G1 | Primary geocoding mechanism = **typed address input** (street address or landmark name). |
| G2 | Optional secondary = "Use my location" (GPS). Must have explicit permission prompt. |
| G3 | Geocoding provider: not yet chosen (Google Places / Nominatim / Pelias). Open per D1 below. |

### Results model

| # | Decision |
|---|----------|
| R1 | Results without a time filter = **curated set** (all tagged POIs). App prompts user to narrow by date or topic. |
| R2 | Ranking top-3 results = **route proximity + source quality + topic match** (weighted; see R3–R5). |
| R3 | Route proximity = along-route distance from nearest polyline point (R-040, Option A). |
| R4 | Source quality = ≥1 citation URL on the event/POI record (binary signal for MVP). |
| R5 | Topic match = # of user-selected topics that match the event's tags (higher = ranked higher). |

### Routing model

| # | Decision |
|---|----------|
| RT1 | Routing is **hybrid**: real provider preferred; pure-mock fallback if provider returns error. |
| RT2 | Walking mode is the **only** mode in MVP. No driving/transit. |
| RT3 | Along-route "detour" = walking distance along streets (not straight-line) to the nearest route point. |
| RT4 | Detour display format: distance in **blocks** (~2 blocks) AND time in **minutes** (~4 min). Both required. |
| RT5 | Default "near route" radius = 320 m (2 standard Manhattan blocks). |

---

## Open Questions

| # | Question | Owner | Decision |
|---|----------|-------|----------|
| D1 | Which geocoding provider for typed address? | Product | **CLOSED** — Google-first, behind server-side proxy; swap-later acceptable. |
| D2 | Is PWA installability in v0.1 scope? | Product | **CLOSED** — NICE-TO-HAVE for v0.1 (not required for DoD). |
| D3 | Is Turf.js acceptable as a client-side dependency for along-route? | Engineering | **CLOSED** — Turf.js acceptable for v0.1 corridor filtering/scoring; replaceable later. |
| D4 | Hardcoded 320 m radius or `App.config`-injectable? | Engineering | Hardcoded for MVP simplicity is preferred |
| D5 | AA/Irish community interests (R-037 taxonomy): net-new, confirmed in scope? | Product | Confirmed net-new per R-035; need final sign-off |
| D6 | Events without a resolved `location_id` — filter out, or show in list only (no map pin)? | Product | Filter out of map; show in list with "location unavailable" label |

---

## Gap vs. Eric Story — Consolidated

| Capability | R-036 status | Runtime today | Snap |
|------------|-------------|---------------|------|
| Route from A→B (walking) | Must-have | ✅ Mock works; provider config ready | Build |
| Date-span filter | Must-have v0.1 | ❌ No date field on POIs/Events at runtime | Promote from AllYears CSV (R-038) |
| Interest/topic filter | Must-have v0.1 | ❌ No interest field on `poi.v1.json` | Promote from Events CSVs (R-038) + R-037 taxonomy |
| Along-route POI display | Must-have v0.1 | ❌ Straight-line fallback only | R-040 Option A (Turf.js) |
| POI detail card | Partial | ✅ Name, summary, images, sources | Add distance/time display |
| Geocoder (typed address) | Must-have | ⚠️ Typeahead exists; real provider TBD | D1 decision needed |
| "Use my location" | Nice-to-have | ✅ `geo-current` button + GeoStatus in UI | Wire to start-of-route |
| PWA installability | Nice-to-have | ❌ Absent (R-039) | R-039 G2-G4 (D2 to decide) |
| Viewport meta (mobile) | Must-have (mobile) | ❌ Absent | R-039 G1 — XS effort, unblock now |

---

## Recommended Sprint 07 Starting State

1. **Close D2 and D3** (PWA + Turf.js decisions) before sprint 07 planning.  
2. **Unblock immediately (XS):** Add `<meta name="viewport">` to `home.inline.html` and `Detail.cshtml`.  
3. **Data promotion first:** R-038 CSV→JSON promotion script unlocks date-span and interest fields — block on this before any filter work.  
4. **Then:** interest taxonomy (R-037 14 values) → seed `poi.v1.json` tags → enable topic filter.  
5. **Then:** along-route corridor (R-040 Option A) → Turf.js + `nearestPointOnLine`.  
6. **Geocoder provider (D1):** Choose before sprint 07 coding begins; 2-day integration risk if new provider.

---

## References

| Doc | Contents |
|----|---------|
| R-036 | Eric MVP contract: full user story, must-haves, e2e spec outline |
| R-037 | Unified interest taxonomy v0 (14 values, AA/Irish confirmed net-new) |
| R-038 | Data promotion plan: AllYears CSV → poi.v1.json |
| R-039 | PWA/mobile readiness audit (all gaps + effort estimates) |
| R-040 | Along-route detour feasibility (Option A = Turf.js recommended) |
