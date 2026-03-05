# R-042 — PWA Installable Minimal Plan

**Date:** 2026-03-05
**Status:** Open
**Author:** Research pass — automated evidence sweep
**Builds on:** R-039 (PWA + Mobile Readiness Audit)

---

## Purpose

Translate the R-039 audit findings into a concrete, scoped plan for making the
app installable as a Progressive Web App — the minimum viable set of changes
required to pass Chrome/Edge installability criteria. This document is a
**planning reference**, not a sprint backlog. No code changes were made.

---

## Section 1 — Current State (FOUND / MISSING / GAP)

Evidence basis: `git ls-files`, `home.inline.html` head section, `Detail.cshtml`,
`Index.cshtml`, `Get-ChildItem wwwroot -Recurse -Include *.png,*.ico,*.svg,*.webmanifest`.

### 1.1 Web App Manifest

| Item | Expected path | Status |
|------|--------------|--------|
| `manifest.json` / `site.webmanifest` | `apps/web-mvc/wwwroot/` | ❌ MISSING |
| `<link rel="manifest">` in HTML | `home.inline.html` `<head>` | ❌ MISSING |
| `<link rel="manifest">` in HTML | `Detail.cshtml` `<head>` | ❌ MISSING |

Evidence: `git ls-files | Select-String "manifest(\.webmanifest|\.json)$"` → zero
results (only `docs/forGPT/forgpt.manifest.json` found — internal tooling, not a
Web App Manifest). `home.inline.html` head contains only `charset`, `title`, Leaflet CDN
link, and one inline `<style>` block.

### 1.2 Icons

| Item | Status |
|------|--------|
| `icon-192.png` (or equivalent) | ❌ MISSING |
| `icon-512.png` (or equivalent) | ❌ MISSING |
| `apple-touch-icon.png` | ❌ MISSING |
| `favicon.ico` | ❌ MISSING |

Evidence: `Get-ChildItem "apps/web-mvc/wwwroot" -Recurse -Include "*.png","*.ico","*.svg","*.webmanifest"` → empty result set.

### 1.3 `<meta name="viewport">` and `<meta name="theme-color">`

| Tag | File | Status |
|-----|------|--------|
| `<meta name="viewport">` | `home.inline.html` | ❌ MISSING |
| `<meta name="viewport">` | `Detail.cshtml` | ❌ MISSING |
| `<meta name="theme-color">` | `home.inline.html` | ❌ MISSING |
| `<meta name="theme-color">` | `Detail.cshtml` | ❌ MISSING |

Evidence: `Select-String -Path "apps/web-mvc/wwwroot/static/home.inline.html" -Pattern "viewport|manifest|theme-color"` → zero matches. `home.inline.html` `<head>` contains exactly:

```html
<head>
  <meta charset="utf-8">
  <title>NYC Explorer</title>
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <style>/* focus ring only */</style>
</head>
```

No viewport meta → mobile browsers use default (desktop-scale) viewport.
No theme-color → home screen / browser chrome uses system color, not branded.

### 1.4 Service Worker

| Item | Status |
|------|--------|
| `service-worker.js` / `sw.js` | ❌ MISSING |
| `navigator.serviceWorker.register()` call anywhere in tracked JS | ❌ MISSING |
| Workbox integration | ❌ MISSING |

Evidence: `git ls-files | Select-String "service-worker|sw\.js|workbox"` → zero results.
`Get-ChildItem "apps/web-mvc/wwwroot/js/*.js" | ForEach-Object { Select-String -Path $_.FullName -Pattern "serviceWorker" }` → empty.

### 1.5 Responsive / Mobile UI

| Capability | Status |
|------------|--------|
| `@media` queries anywhere | ❌ NONE found |
| Tracked `.css` files | ❌ NONE (`git ls-files | Select-String "\.css$"` → empty) |
| Map container height | Fixed `300px` (inline style) |
| Layout | All inline `style=""` attributes — no external stylesheet |

Evidence: `Select-String -Path "apps/web-mvc/wwwroot/static/home.inline.html" -Pattern "@media"` → zero results. Map div: `<div id="map" style="height:300px;">`.

### 1.6 Shared Layout / Per-Page Head Tags

There is **no `_Layout.cshtml` or `Views/Shared/` directory** tracked in git.
Each view independently owns its own `<html>/<head>` block:

- `home.inline.html` — served as a static file from `wwwroot/static/`; this is the **real app UI**
- `Detail.cshtml` — Razor view, minimal head (`<title>` only)
- `Index.cshtml` — stub Razor view, `Layout = null`, used only for e2e probe

Any head-tag changes must be made **per-file** — there is no single shared template.

### 1.7 Audit Summary

| Category | Items Audited | FOUND | MISSING | GAP |
|----------|--------------|-------|---------|-----|
| Manifest | 1 | 0 | 1 | — |
| Icons | 4 | 0 | 4 | — |
| Head meta (viewport, theme-color) | 4 | 0 | 4 | — |
| Service worker | 3 | 0 | 3 | — |
| CSS / responsive | 2 | 0 | 2 | — |
| **Total** | **14** | **0** | **14** | **0** |

**PWA installability baseline: 0 / 14 items present.**

---

## Section 2 — "Installable PWA" Minimal Requirements Checklist

Chrome/Edge installability requires at minimum:

| # | Requirement | MVP? | Notes |
|---|------------|------|-------|
| 1 | Served over HTTPS (or localhost) | Required | localhost OK for dev |
| 2 | Web App Manifest with `name`, `short_name`, `start_url`, `display: standalone` | Required | Single JSON file |
| 3 | Manifest linked from HTML `<head>` with `<link rel="manifest">` | Required | Must be in `home.inline.html` |
| 4 | At least one icon ≥ 192×192 in manifest `icons[]` | Required | PNG preferred |
| 5 | Icon for maskable (512×512) recommended for full install UX | Recommended | Can use same image |
| 6 | `<meta name="viewport" content="width=device-width, initial-scale=1">` | Required | Without this, mobile install is broken UX |
| 7 | `<meta name="theme-color">` | Strongly recommended | Affects install banner color |
| 8 | Service worker registered | Required for "Add to Home Screen" banner trigger | Minimal fetch handler acceptable |
| 9 | Offline fallback page | Optional | NOT promised in MVP (see §2.2) |

### 2.1 What we WILL deliver in a minimal PWA MVP

- Manifest file at `wwwroot/manifest.json` with `display: standalone`, `start_url: /`, name, colors
- Two icons (192 + 512) as PNG, stored at `wwwroot/icons/`
- `<link rel="manifest">` + `<meta name="viewport">` + `<meta name="theme-color">` added to `home.inline.html` and `Detail.cshtml`
- A minimal service worker (`wwwroot/sw.js`) that registers successfully (can be a passthrough / network-only worker — no offline caching required)
- SW registered from `home.inline.html` (or `app-bootstrap.js`) on DOMContentLoaded

### 2.2 What we will NOT promise in this MVP

| Item | Why excluded |
|------|------------|
| Offline tile serving | Leaflet tiles from CDN; caching map tiles is complex and bandwidth-heavy |
| Leaflet CDN → local bundled | Large refactor; out of MVP scope |
| Background sync | No CRUD write operations in MVP |
| Push notifications | No server subscription infrastructure |
| App store listing | Requires full TWA wrapper — post-MVP |
| Full responsive layout overhaul | Map `height:300px` fix is included; full layout redesign is not |
| iOS-specific splash screens | Nice-to-have, not MVP |

---

## Section 3 — Minimal Implementation Plan (no code)

### 3.1 Target files to EDIT (add head tags)

| File | Change |
|------|--------|
| `apps/web-mvc/wwwroot/static/home.inline.html` | Add `<meta name="viewport">`, `<meta name="theme-color">`, `<link rel="manifest">`, SW registration script |
| `apps/web-mvc/Views/Poi/Detail.cshtml` | Add `<meta name="viewport">`, `<meta name="theme-color">`, `<link rel="manifest">` |

No change needed to `Index.cshtml` (e2e stub only; not a real page).

### 3.2 New files to CREATE

| File | Location | Purpose |
|------|---------|---------|
| `manifest.json` | `apps/web-mvc/wwwroot/manifest.json` | Web App Manifest |
| `sw.js` | `apps/web-mvc/wwwroot/sw.js` | Service worker (minimal passthrough) |
| `icon-192.png` | `apps/web-mvc/wwwroot/icons/icon-192.png` | Installability icon (≥192×192) |
| `icon-512.png` | `apps/web-mvc/wwwroot/icons/icon-512.png` | Maskable icon (512×512) |

### 3.3 Manifest minimum viable content

```json
{
  "name": "NYC Explorer",
  "short_name": "NYC Explorer",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#1a73e8",
  "icons": [
    { "src": "/icons/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icons/icon-512.png", "sizes": "512x512", "type": "image/png", "purpose": "any maskable" }
  ]
}
```

### 3.4 Service worker: caching scope

**Recommended scope: app shell only (network-first, no map tiles).**

Minimal SW strategy:
- Install: pre-cache `home.inline.html`, `manifest.json`, `/icons/` (app shell)
- Fetch handler: network-first, fall back to cache for shell assets only
- Explicitly **exclude**: Leaflet CDN requests, `/api/` routes, route provider calls
- No `workbox` dependency required for this scope — vanilla `cache.addAll()` is sufficient for MVP

Caching the Leaflet CDN would require either hosting Leaflet locally or using
Workbox's StaleWhileRevalidate strategy — both are out of MVP scope.

### 3.5 Map height: mobile fix (in scope)

The map container has `height:300px` inline — too small on mobile.
Fix: change to `height: 50dvh` (or `height: calc(100vh - 200px)`) in
`home.inline.html`. This is a 1-line inline-style change on the `#map` div.
This requires no CSS file, just editing the inline attribute.

---

## Section 4 — Risks and Sequencing

### 4.1 HTTPS / dev-cert implications

| Environment | HTTPS | Impact |
|-------------|-------|--------|
| `http://127.0.0.1:5000` (local dev) | Localhost — SW allowed | Service workers work on `localhost` per spec |
| Playwright e2e tests | Localhost only | No impact — tests run on localhost |
| Production deploy | Must be HTTPS | If deployed over HTTP, SW will not register; manifest will still link fine |

**Action:** No dev-cert changes needed for local development. For any cloud deployment, HTTPS is required (standard).

### 4.2 `home.inline.html` is the critical file

All user-facing head tags live here. `Detail.cshtml` is secondary (POI detail page only). `Index.cshtml` is an e2e stub — do NOT add PWA tags there.

### 4.3 Service worker registration placement

Options (both viable):
1. Inline `<script>` at bottom of `home.inline.html` — simplest, no new file
2. Add to existing `app-bootstrap.js` — cleaner separation

Risk of option 2: `app-bootstrap.js` is already loaded in `home.inline.html`; adding SW registration there pulls a test-sensitive file. Option 1 (inline) is lower risk for e2e tests.

### 4.4 What to keep OUT of MVP to avoid churn

| Item | Reason to exclude |
|------|-----------------|
| Workbox | Adds a build step / bundler dependency we don't have yet |
| Offline tile caching | Scope-creep; Leaflet tiles from CDN are versioned anyway |
| iOS-specific `apple-mobile-web-app-*` meta tags | Not required for installability; add in polish pass |
| Changing Leaflet from CDN to local bundle | Requires a build pipeline change |
| `background_color` matching map tiles | Cosmetic; not required for installability |

### 4.5 Recommended sequencing

1. Create icons (192/512 PNG) — can use any minimal design; no SVG toolchain needed
2. Create `manifest.json`
3. Edit `home.inline.html` head (viewport + theme-color + manifest link)
4. Create `sw.js` (minimal passthrough + app-shell pre-cache)
5. Add SW registration inline to `home.inline.html`
6. Edit `Detail.cshtml` head (viewport + theme-color + manifest link)
7. Verify in Chrome DevTools → Application → Manifest: installability criteria met

---

## Decisions Needed

| # | Question |
|---|---------|
| D1 | Icon design: use placeholder monogram or commission a real icon? |
| D2 | SW registration: inline `<script>` in `home.inline.html` or added to `app-bootstrap.js`? |
| D3 | SW caching scope: network-only (simplest) or app-shell pre-cache (resilience)? |
| D4 | `theme_color` value: pick brand color now or placeholder `#1a73e8`? |
| D5 | Should `Detail.cshtml` have its own `start_url` deep-link, or always route through `/`? |
