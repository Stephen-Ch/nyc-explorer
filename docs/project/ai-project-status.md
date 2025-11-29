# AI Project Status – NYC Explorer

## 1. Project Overview
- **Goal:** A Manhattan-only, map-based walking guide—launching around Union Square + Flatiron—with curated walking routes that cap density at ≤3 POIs per block frontage.
- **Tech Stack:** ASP.NET Core MVC, Playwright, Leaflet.

## 2. Hot Files (Analysis-First)
*Before editing these, run an analysis prompt.*
- `apps/web-mvc/Controllers/PoiController.cs`
- `apps/web-mvc/wwwroot/js/map.js`
- `apps/web-mvc/wwwroot/js/route-engine.js`

## 3. Architecture Summary
- **App:** ASP.NET Core 8 MVC + TypeScript UI (Leaflet + OSM tiles)
- **Data:** `content/poi.v1.json` (JSON) + optional routing fields
- **Tests:** Playwright (Chromium) for e2e; TS/Zod for schema
- **Adapters:** `window.App.adapters = { geo, route }` for geocoding and routing

## 4. Current State
- Sprint 06 complete
- Full test suite: ~94 tests passing
- Selectors: v0.7
