# Sprint 03 Plan — Archived

This file has been archived to reduce clutter in `docs/`.

Current location:
- `docs/archive/2026-01-11/sprints/Sprint-03-Plan.md`
# Sprint 03 — Plan (v0.1)

**Goal:** Implement navigation from list/map to detail pages, expand POI content, add CI automation, and document setup.

---

## Ordered Backlog

1. **LIST-1** — Click POI list item navigates to detail page
2. **MAP-2** — Click map marker navigates to detail page  
3. **DATA-10** — Expand to 10 total POIs (add 5 more Union Square + Flatiron locations)
4. **VIS-1b** — Capture detail page screenshot artifact for visual smoke
5. **CI-1** — Add GitHub Actions workflow to run Playwright tests on PR
6. **DOC-3** — Update README with setup instructions and project status

---

## Working Agreements

- **Scope:** Manhattan-only POIs; desktop viewport (1280×800)
- **Constraints:** ≤60 LOC / ≤2 files per story; one commit per story (not per batch)
- **Selectors:** Add to `/docs/selectors.md` before using in code
- **Story Size:** Pre-split anything estimated >50 LOC

---

## Story Size Estimates

| Story | Est. LOC | Confidence | Notes |
|-------|----------|------------|-------|
| LIST-1 | 20-30 | High | Existing detail route |
| MAP-2 | 25-35 | Medium | Leaflet click handlers |
| DATA-10 | 40-50 | High | Schema validation |
| VIS-1b | 15-20 | High | VIS-1 pattern |
| CI-1 | 30-40 | Medium | Playwright config |
| DOC-3 | 10-20 | High | README update |

**Total:** 140-190 LOC across 6 stories | **Velocity:** ~8-10 stories/sprint (Sprint 02 baseline)

---

## Cycle Time Tracking (record as we go)

| Story | RED (min) | GREEN (min) | Total | Notes |
|-------|-----------|-------------|-------|-------|
| LIST-1 | - | - | - | - |
| MAP-2 | - | - | - | - |
| DATA-10 | - | - | - | - |

**Target:** <60 min average per story

---

## Definition of Done (each story)

- ✅ All e2e tests pass (`npm run e2e:auto`) + TypeScript typecheck (`npm run typecheck`)
- ✅ Visual smoke for visible UI changes (screenshot artifact)
- ✅ One-line entry in `/docs/code-review.md` + micro-entry in `/docs/project-history.md`
- ✅ README updated if behavior or setup changes
- ✅ **PAUSE** — await explicit user cue before next story

---

## Notes

**CI-1:** GitHub Actions will run Playwright with webServer on push/PR.

---

**End of Sprint 03 Plan**


