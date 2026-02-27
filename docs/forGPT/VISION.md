# NYC Explorer — Vision

Migrated from `docs/Project.md` and repo `README.md` on 2026-01-11.

## Purpose
NYC Explorer exists to help people explore Manhattan on foot using a simple map-first experience with curated points of interest (POIs) and short walking routes. It focuses on clarity and reliability: stable data contracts, deterministic end-to-end tests, and a small set of well-defined interactions that work the same way every time.

## North Star
Over the next 1–3 years, NYC Explorer becomes a trustworthy “walkable Manhattan” guide that can expand beyond the initial Union Square + Flatiron launch area into broader neighborhoods, richer route variants, and historically grounded context. Success means the project can support deeper TimeWalk-style storytelling while staying fast, testable, and maintainable as content volume grows.

## User Promise
Users can pick a starting point and destination, see a clean route experience, and browse POIs from a consistent, validated dataset. The interface stays accessible and predictable: key actions are discoverable, navigation is stable via deep links, and failures (missing content, timeouts, provider limits) degrade gracefully with clear messages.

## Non-Goals
- We are not building an editor-facing CMS or production authoring pipeline in the v0.1 milestone.
- We are not attempting multi-borough coverage, offline packs, payments, AR/VR, or social features before the Manhattan MVP is stable.

Last updated: 2026-01-11
