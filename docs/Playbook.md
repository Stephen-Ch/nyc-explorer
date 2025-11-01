# Playbook — 10-24-25

**What this is:** A one‑page orientation to the kit. The canonical rules live in `/docs/Protocol_10-24-25.md`.

## The 6 Rules
1) Behavior‑first: write 3–6 Given/When/Then (include **edge + error**).
2) Tests‑first: stop on red; return **REVISE** with failing spec title + error.
3) Small diffs: ≤2 files, ≤60 LOC unless it’s a dedicated refactor story.
4) Decisions log: append one line to `/docs/code-review.md` using the **new format** (see `/docs/Code-Review-Guide.md`), e.g. `[2025-11-01 01:15] nyc-explorer/main DOC-SEL-S4 — active route selectors documented (docs-only)`.
5) Confirmation: assistant replies **PROCEED / REVISE / BLOCK** only after GREEN + Decisions appended.
6) Context: include the last **3 Decisions** + current Sprint Goal; link the rest.

## Where to Start
- Read `/docs/Protocol_10-24-25.md`.
- For unknown routes/selectors, use `/docs/Probe-First.md`.
- For e2e setup, see `/docs/Quickstart-Testing.md`.

**End**
