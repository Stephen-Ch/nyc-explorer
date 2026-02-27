# Stack Profile — NYC Explorer

> **File Version:** 2026-02-27

## Purpose

Declares the NYC Explorer technology stack, standard commands, and environment constraints. Gates and templates read this overlay instead of hardcoding stack-specific commands.

## Overlay Review Gate

- Best next step? YES
- Confidence: 95

---

## Standard Commands

| Action | Command | Notes |
|--------|---------|-------|
| Install dependencies | `npm ci` | Node ≥20 required (package.json `engines`) |
| Build (.NET) | `dotnet build apps/web-mvc /p:BuildProjectReferences=false` | .NET 8.0, ASP.NET Core MVC |
| Test (E2E) | `npm run e2e:auto` | Playwright + auto-starts `dotnet run` via `webServer` config |
| Test (schema) | `npm run schema` | `playwright test tests/schema/poi.spec.ts` |
| Typecheck | `npm run typecheck` | `tsc -p tsconfig.json --noEmit` |
| Start (dev) | `npm run dev:api` | `dotnet watch --project apps/web-mvc run --urls http://localhost:5000` |
| Start (UI) | `npm run e2e:ui` | Playwright UI mode (chromium) |
| Dev probe | `npm run dev:probe` | `tsx scripts/dev-probe.ts` |

## Environment Constraints

| Constraint | Value |
|------------|-------|
| OS | Windows (primary dev), Linux (CI) |
| Shell minimum | PowerShell 5.1 |
| Node.js | ≥20 (package.json `engines.node`) |
| .NET SDK | 8.0.x (NYCExplorer.csproj `TargetFramework: net8.0`) |
| Secrets path | `.env` (GEO_PROVIDER, ROUTE_PROVIDER, GEO_TIMEOUT_MS) |
| Base URL | `http://localhost:5000` (playwright.config.ts `baseURL`) |

## Tech Stack Summary

- **App type:** Manhattan walking guide / curated routes (Union Square + Flatiron)
- **Backend:** ASP.NET Core 8.0 MVC (`apps/web-mvc/`)
- **Frontend:** Server-rendered HTML + vanilla JS overlays
- **Test framework:** Playwright (E2E + schema + meta tests)
- **Language:** C# (.NET 8), TypeScript (tests/scripts)
- **Database:** None (JSON content: `content/poi.v1.json`)
- **CI:** GitHub Actions (`.github/workflows/ci.yml`)
