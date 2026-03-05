# R-039 — PWA + Mobile Readiness Audit

**Date:** 2026-03-05  
**Status:** Open  
**Author:** Research pass — automated evidence sweep  

---

## Purpose

Determine whether the current codebase meets any baseline for Progressive Web App
(PWA) installability and mobile-first usability, so the team can scope what
infrastructure is necessary before the Eric MVP release.

---

## Scope

- Manifest + service worker installability prerequisites  
- `<head>` meta tags: viewport, theme-color, apple-touch-icon  
- Responsive map/UI sizing  
- CSS framework presence  
- Service worker registration in JS  

Files examined:  
- `apps/web-mvc/Views/Home/Index.cshtml`  
- `apps/web-mvc/Views/Poi/Detail.cshtml`  
- `apps/web-mvc/wwwroot/static/home.inline.html` ← real HTML entry point  
- `apps/web-mvc/wwwroot/js/*.js` (all tracked JS)  
- `git ls-files` (full manifest/SW/icon search)  

---

## Evidence

### B10 — PWA artifact scan (git ls-files)

Command: `git ls-files | Select-String "manifest|service.worker|sw\.js|workbox|apple.touch|192|512"`

**Result: NOTHING FOUND.**

| Artifact | Expected path | Found |
|----------|--------------|-------|
| Web App Manifest | `wwwroot/manifest.json` or `wwwroot/site.webmanifest` | ❌ Absent |
| Service Worker | `wwwroot/service-worker.js` or `wwwroot/sw.js` | ❌ Absent |
| Workbox | any `workbox-*.js` | ❌ Absent |
| Icon 192×192 | `wwwroot/icons/icon-192.png` (or similar) | ❌ Absent |
| Icon 512×512 | `wwwroot/icons/icon-512.png` (or similar) | ❌ Absent |
| apple-touch-icon | `wwwroot/apple-touch-icon.png` | ❌ Absent |

### B11 — Shared layout scan

Command: `git ls-files | Select-String "_Layout\.cshtml|Views/Shared|App\.razor"`

**Result: NOTHING FOUND.**

- No `_Layout.cshtml` tracked  
- No `Views/Shared/` directory tracked  
- Every view uses `@{ Layout = null; }` — fully self-contained HTML  

### B12 — Head-tag audit per file

#### `apps/web-mvc/Views/Home/Index.cshtml`

12-line **stub view** — contains only:  
```cshtml
@{ Layout = null; }
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>NYC Explorer View Check</title>
</head>
<body>
  <div data-testid="view-ok">view-ok</div>
</body>
</html>
```

| Tag | Present |
|-----|---------|
| `<meta name="viewport">` | ❌ |
| `<link rel="manifest">` | ❌ |
| `<meta name="theme-color">` | ❌ |
| `<link rel="apple-touch-icon">` | ❌ |

This view is a test fixture only — the single `data-testid="view-ok"` div exists
solely for the `view-ok` e2e test.

#### `apps/web-mvc/Views/Poi/Detail.cshtml`

```html
<html>
<head><title>@Model.Name - NYC Explorer</title></head>
...
```

Minimal head — no `<meta charset>`, no viewport, no manifest link, nothing.

| Tag | Present |
|-----|---------|
| `<meta name="viewport">` | ❌ |
| `<link rel="manifest">` | ❌ |
| `<meta name="theme-color">` | ❌ |
| `<link rel="apple-touch-icon">` | ❌ |

#### `apps/web-mvc/wwwroot/static/home.inline.html` — REAL ENTRY POINT

This file is the actual HTML served to browsers. Its `<head>`:

```html
<head>
  <meta charset="utf-8">
  <title>NYC Explorer</title>
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <style>
    /* explicit, accessible focus ring for overlay marker buttons */
    [data-testid="poi-marker"]:focus-visible {
      outline: 2px solid #222;
      outline-offset: 2px;
    }
  </style>
</head>
```

| Tag | Present |
|-----|---------|
| `<meta charset="utf-8">` | ✅ |
| `<meta name="viewport">` | ❌ |
| `<link rel="manifest">` | ❌ |
| `<meta name="theme-color">` | ❌ |
| `<link rel="apple-touch-icon">` | ❌ |
| CSS framework (Bootstrap, Tailwind) | ❌ |
| Leaflet CSS (CDN unpkg) | ✅ |

**Map container sizing:**  
```html
<div id="map" style="height:300px;"></div>
```
Fixed `300px` — not responsive. No `vh`, `vw`, `%`, or media queries found.

### B13 — Service worker registration in JS

Command: `Select-String -Path "apps/web-mvc/wwwroot/js/*.js" -Pattern "serviceWorker|navigator\.serviceWorker|register\("`

**Result: ZERO MATCHES.**  
No JS file registers or references a service worker.

### B14 — CSS / responsive / Bootstrap audit

Command: `git ls-files | Select-String "\.css$"` → **No `.css` files tracked.**

Command (JS pattern search for bootstrap/tailwind/@media/vh/vw/viewport):
- `viewport` appears only in `route-bootstrap.js` and `nav-bootstrap.js` as an overlay
  canvas size variable (`const viewport = { width, height }`) — unrelated to HTML meta viewport.
- No Bootstrap CSS, Tailwind, or `@media` queries found anywhere.
- Only CSS present: inline `<style>` block in `home.inline.html` (11 lines, focus ring only).

---

## Summary

| Category | Finding | PWA/Mobile Impact |
|----------|---------|-------------------|
| Web App Manifest | Absent | ❌ Not installable |
| Service Worker | Absent | ❌ No offline, no caching |
| Icon set (192/512) | Absent | ❌ Not installable |
| apple-touch-icon | Absent | ❌ iOS home screen bookmark broken |
| Viewport meta tag | Absent from all files | ❌ Mobile layout will zoom out by default |
| Theme-color meta | Absent | ❌ No browser chrome color |
| CSS framework | None | ⚠️ No responsive grid available |
| Map container height | Fixed 300px | ⚠️ Not responsive |
| Shared layout | None (`Layout = null`) | ❌ Every file needs its own `<head>` |

**Installability verdict:** Does NOT meet Chrome Installability Criteria.  
Missing: manifest, service worker (fetch handler), at least one icon.

**Mobile-first verdict:** Not mobile-optimized.  
Missing: viewport meta (critical — without it, mobile browsers render desktop
layout and allow user scaling). Map is fixed 300 px, not fluid.

---

## Gaps → Tasks

| # | Gap | Effort | Priority |
|---|-----|--------|----------|
| G1 | Add `<meta name="viewport" content="width=device-width, initial-scale=1">` to `home.inline.html` and `Detail.cshtml` | XS (2 lines) | P0 — mobile baseline |
| G2 | Author `manifest.json` with name/short_name/icons/start_url/display:standalone | S (20 lines) | P1 — installability |
| G3 | Create icon set: 192×192 and 512×512 PNG | S | P1 — installability |
| G4 | Register a minimal service worker (fetch cache for shells + POI JSON) | M | P2 — offline |
| G5 | Replace map `height:300px` with fluid height (`height: 50vh; min-height: 260px`) | XS | P1 — mobile UX |
| G6 | Establish shared `_Layout.cshtml` or extract `<head>` partial to avoid divergence | M | P2 — maintenance |

---

## Decisions Needed

| # | Question |
|---|---------|
| D1 | Is PWA installability in MVP scope? (G2–G4 are ~1 day; if no → defer to Sprint 07+) |
| D2 | Viewport meta (G1) and map fluid height (G5) are zero-risk — ship in MVP? |
| D3 | Should a shared `_Layout.cshtml` be introduced now, or keep `Layout = null` pattern? |
