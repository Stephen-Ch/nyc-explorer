# Merge Commands — NYC Explorer

> **File Version:** 2026-02-27

## Purpose

Defines the exact Build Gate and Test Gate commands for NYC Explorer's merge workflow. The merge prompt template reads these commands instead of hardcoding stack-specific invocations.

## Overlay Review Gate

- Best next step? YES
- Confidence: 95

---

## Test Gate

Run before merge and again after merge on main:

```
npm run e2e:auto
```

Must be GREEN (all tests pass). If any test fails, STOP.

## Build Gate

Run before merge and again after merge on main:

```
npm run typecheck
```

Must be GREEN. Classify warnings as NEW or PRE-EXISTING. NEW warnings = STOP.

## Additional Gates

.NET build (CI also runs this implicitly via Playwright `webServer`):

```
dotnet build apps/web-mvc /p:BuildProjectReferences=false
```

CI-specific meta gate (runs in GitHub Actions):

```
npx playwright test tests/meta --reporter=list
```

Overlay freeze guard (CI enforces — blocks edits to `apps/web-mvc/Program.cs` and `apps/web-mvc/wwwroot/js/route-overlay.js` unless explicitly authorized).
