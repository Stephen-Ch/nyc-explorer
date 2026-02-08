# NYC Explorer — Repo Overlay

## A) Repo Identity

    Repo: Stephen-Ch/nyc-explorer
    Description: Interactive NYC historical exploration app (ASP.NET MVC + TypeScript + Playwright)

## B) Docs Root

    docs

## C) Integration Branch

    main

Declared at `docs/status/branches.md` line 4:
> `main` — integration branch; always expected to be green in CI.

## D) Merge Ownership

    Integration branch merge: repo owner / lead maintainer
    Feature branches: any approved contributor via PR
    Docs-only branches: any contributor (no code review required beyond docs accuracy)

## E) Canonical Build / Test Commands

Green Gate (from `docs/Start-Here-For-AI.md`):

    npm run e2e:auto       # Playwright E2E suite (tests/e2e/)
    npm run typecheck       # TypeScript type checking
    npm run meta            # Repository meta checks (tests/meta/)
    dotnet build            # Required when server code under apps/web-mvc/ changes

## F) Do NOT Put in Kit

The following are repo-specific and MUST NOT appear in shared kit files:

    - Branch names (main, docs/*, feature/*)
    - Person names or GitHub handles
    - Repository URLs or credentials
    - Repo-only paths (apps/web-mvc/, content/, data/historical/)
    - Repo-only hot files (poi.v1.json, route.ts, Program.cs)
