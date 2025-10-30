# Data Model & Indices (PostgreSQL + PostGIS)

> DB-backed; no spreadsheets in production. Researcher UI validates required fields and review states.

## Core Tables
- **lots**(bbl PK, geom, borough, address_std)
- **lot_timelines**(id PK, bbl FK, from_year, to_year, use_type, name, note, confidence, created_by, reviewed_by, status)
- **attractions**(id PK, title, geom, primary_bbl FK, summary_blurb, essay_short, essay_long, power SMALLINT, editorial_priority SMALLINT, created_by, reviewed_by, status)
- **attraction_years**(attraction_id FK, from_year, to_year)  -- activation window
- **interests**(id PK, slug UNIQUE)
- **attraction_interests**(attraction_id FK, interest_id FK)
- **events**(id PK, attraction_id FK, year, month NULL, day NULL, headline, narrative)
- **sources**(id PK, kind {primary, secondary}, archive_repo, citation_text, url, rights, call_number, notes)
- **source_links**(id PK, source_id FK, entity_table, entity_id, claim_scope)
- **media**(id PK, attraction_id FK, year_opt, url, rights, caption, thumb_url)
- **blocks**(id PK, geom, name_opt)
- **block_attraction_index**(block_id FK, attraction_id FK, year, rank)
- **route_cache**(hash PK, params_json, geom, computed_at)
- **saved_items**(user_or_anon_key, attraction_id FK, saved_at)

## Indices
- GIST on all `geom` columns; BTREE on `year`, `bbl`; trigram/GIN on name/title for editorial search.

## Status Workflow (all content tables)
- `draft` → `fact_checked` → `approved`; audit log with diffs; immutable source rows.

## Data Dictionary (selected fields)
- `confidence`: 0–100 scale; required on lot_timeline intervals and contested claims.
- `rights`: {PD, CC0, CC-BY-x, link_only}, enforced by UI.
- `claim_scope`: free text tagging what fact a source substantiates (e.g., "opening date", "name change").
