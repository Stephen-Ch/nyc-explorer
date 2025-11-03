# Selectors — Canonical (v0.4)

**Purpose:** Lock stable selectors so tests and UI don’t drift mid‑sprint.

## Global
- Map container: `#map`
- Search input: `[data-testid="search-input"]`

## Lists
- POI list item: `[data-testid="poi-item"]`
- List link: `[data-testid="poi-link"]`
- POI list wrapper: `[data-testid="poi-list"]` (encapsulates the rendered POI list for empty/error states)

## Leaflet
- Marker: `.leaflet-marker-icon`
> Note: `.leaflet-*` classes come from Leaflet — do **not** modify. You may assert their presence in tests.
- Marker handle: `[data-testid="poi-marker"]`
> Use for deterministic marker interaction (click/keyboard). Must exist on every POI marker; add without renaming during sprint.

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

## Route Steps
- Ordered list: `#route-steps`
- Step item: `[data-testid="route-step"]` includes `data-step-index` (0-based); active step sets `aria-current="step"`

## Errors & Status (Sprint 05+)
- POI load error region: `[data-testid="poi-error"]` (`aria-live="polite"`, surfaces concise copy like “Unable to load POIs.”)

## Route Inputs
- From input: `[data-testid="route-from"]`
- To input: `[data-testid="route-to"]`
- Find button: `[data-testid="route-find"]`

## Geocoder & Typeahead (Sprint 05 prep)
- Inputs: `[data-testid="geo-from"]`, `[data-testid="geo-to"]` (labels bind via `for="geo-from|geo-to"`, maintain `aria-expanded` + `aria-controls`)
- Listbox: `[data-testid="ta-list"]` (`role="listbox"`, only renders when open)
- Option item: `[data-testid="ta-option"]` (`role="option"`, carries lat/lng + label in data attributes)
- Active option hook: `[data-testid="ta-option-active"]` (input sets `aria-activedescendant` to this option id)
- Live status: `[data-testid="geo-status"]` (`aria-live="polite"`, announces results/errors)
- Keyboard contract: Up/Down moves selection, Enter commits, Esc closes (doc only)

## Current Location Control
- Button: `[data-testid="route-current"]` (`data-target="from|to"`, `aria-label="Use current location for From|To"`); mirror inside UI with `[data-testid="geo-current"]`
- CI note: mocked behavior — set fixture lat/lng; no Permissions API access.

## Active Routes
- Active marker: `[data-testid="poi-marker-active"]` includes `data-step-index` (mirrors route step index)
- Route status message: `[data-testid="route-msg"]` (must include `aria-live="polite"`)
- Route path overlay: `[data-testid="route-path"]`
- Route path node (optional): `[data-testid="route-node"]`
- Accessibility: Active markers set `aria-current="step"` and remain keyboard focusable.
- Share control: `[data-testid="share-link"]` (native button; copies `window.location.href`, announces “Link copied.” / “Unable to copy link.” via `route-msg`)

## Routing Adapters (Docs Only)
- Fixtures: `MockGeocoder`, `MockRouteEngine`; Interfaces: `GeoAdapter`, `RouteAdapter`

## Stability Rules
- Do not rename selectors mid-sprint.
- Add new selectors via story + same-PR doc update.
- Use kebab-case for all `data-testid` values.

## Notes
- `.leaflet-marker-icon` remains a Leaflet-provided class.
- `[data-testid="poi-marker"]` stays our overlay handle for marker interactions.
- `[data-testid="poi-marker-active"]` decorates the same button when part of the active route; do not repurpose the base selector.

> Note: `.leaflet-marker-icon` is external (do not rename/style)

## Naming conventions
- `data-testid` values use **kebab-case** (e.g., `search-input`, `poi-name`, `back-to-map`).
- `id` for unique structural containers (e.g., `#map`, `#poi-title`).
- `class` for styling; avoid using for test assertions unless from a third‑party lib.

## Rules
- Do not rename or replace selectors during a sprint.  
- New selectors require a story and must be added here in the same PR.  
- Prefer `data-testid` for list items and controls.

## URL Contracts (geocoder routing)
- `gfrom=<lat>,<lng>&gfl=<encoded label>`
- `gto=<lat>,<lng>&gtl=<encoded label>`
- Labels optional for UX; decimals expected for lat/lng.
- Presence of `gfrom`/`gto` restores adapter path without activating POI markers.

**End.**
