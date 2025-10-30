# Selectors — Canonical (v0.1)

**Purpose:** Lock stable selectors so tests and UI don’t drift mid‑sprint.

## Global
- Map container: `#map`
- Search input: `[data-testid="search-input"]`

## Lists
- POI list item: `[data-testid="poi-item"]`
- List link: `[data-testid="poi-link"]`

## Leaflet
- Marker: `.leaflet-marker-icon`
> Note: `.leaflet-*` classes come from Leaflet — do **not** modify. You may assert their presence in tests.

## Detail Page (reserved for Sprint 02+)
- Title: `#poi-title`
- Summary: `#poi-summary`
- Image: `#poi-image`
- Images container: `#poi-images`
- Detail image item: `[data-testid="poi-image"]`
- Sources list item: `[data-testid="poi-source"]`
- Back link: `[data-testid="back-to-map"]`

## Future Selectors (Sprint 03+)
- Tag chip: `[data-testid="tag-chip"]`
- Results counter: `#results-count`

> Note: `.leaflet-marker-icon` is external (do not rename/style)

## Naming conventions
- `data-testid` values use **kebab-case** (e.g., `search-input`, `poi-name`, `back-to-map`).
- `id` for unique structural containers (e.g., `#map`, `#poi-title`).
- `class` for styling; avoid using for test assertions unless from a third‑party lib.

## Rules
- Do not rename or replace selectors during a sprint.  
- New selectors require a story and must be added here in the same PR.  
- Prefer `data-testid` for list items and controls.

**End.**
