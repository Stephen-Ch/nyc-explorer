# Solution Report — NYC Explorer

## Current shape
- App: ASP.NET Core MVC app in `apps/web-mvc/`.
- Home page HTML is generated in `apps/web-mvc/Program.cs` via `HomeHtmlProvider`.
- POI data is served from `content/poi.v1.json` and also via the `/content/poi.v1.json` endpoint.
- POI detail pages render at `/poi/{id}` via `PoiController`.

## Tests and gates
- E2E: Playwright suite (run `npm run e2e:auto`).
- Schema: Playwright schema spec (run `npm run schema`).
- Type safety: TypeScript typecheck (run `npm run typecheck`).

## Notes
This document is a lightweight running summary. It should be updated after significant green changes that affect architecture, entry points, contracts, or test strategy.

Last updated: 2026-01-11
