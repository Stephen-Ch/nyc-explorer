# Researcher & Editor UI — Specification (No-code)

## Global
- Auth with roles: Researcher, Fact-checker, Editor-in-Chief.
- Queues: "Needs primary", "Low confidence", "Ready for review", "Density conflicts".

## Screens
- **Search & Queue:** map + filters (year, BBL, status); text search with faceting.
- **Lot Timeline Editor:** interval table with overlap guardrails; required primary citation per interval; confidence slider.
- **Attraction Editor:** geometry picker (snap to lot), activation years, Power, Interests, blurb/essays, editorial priority.
- **Event Editor:** year/month/day (nullable), headline, narrative, source attachments.
- **Sources Manager:** add archive item (type, repo, call #, URL, rights), attach to claims; auto footnotes.
- **Review Panel:** side-by-side diffs; checklist; approve/reject with notes.
- **Density Resolver:** per-block/year view; pick top 3; set overflow order.
- **Saved List Admin:** export anonymized stats (which items users save).

## Validation
- No publish without ≥1 primary per claim; enforce rights; prevent overlapping intervals without resolution note.
