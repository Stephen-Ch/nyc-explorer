# NYC Explorer System Reset Brief — 2025-11-09 08:45 EST

## Project Goal (Snapshot)
- **Mission:** Deliver NYC Explorer, a Manhattan-focused walking-route research app centered on Union Square and Flatiron. Users can browse POIs, see map overlays, and review curated walking routes capped at ≤3 POIs per block.
- **MVP Scope:**
  - Leaflet-based map with POI markers and list.
  - `/poi/{id}` detail pages with imagery, sources, and shareable route context.
  - Geocoder/typeahead (fixtures) and route adapter pipelines (mock + fixture backed).
  - Full Playwright e2e suite + schema/typecheck guards.

## Current State (2025-11-09)
- **Latest clean tag:** `sprint-06-closeout-20251106` on commit `dfbf54a` (all suites green).
- **Active worktree:** `baseline/sprint06-verify` targeting Program.cs refactor, overlay deferred (Pivot A).
- **Overlay status:** BREAKDOWN declared 2025-11-09; overlay on `/` frozen until Sprint-07 RFC. CI guard blocks edits to `Program.cs` and `wwwroot/js/route-overlay.js`.
- **Docs updated:** Postmortem (`docs/postmortems/overlay-2025-11-09.md`), Recovery plan (`docs/recovery/overlay-recovery-plan.md`), Protocol & Workflow guardrails tightened.

## Workflow Rules & Guardrails
_Primary sources and rationale._

1. **Core Process** – `docs/Protocol.md`
   - **Tests-first loop (RED → GREEN → VERIFY → LOG → PAUSE)**: ensures spec-driven changes and keeps baseline green.
   - **Pre-flight plan (high-risk)** using `docs/templates/high-risk-plan.md` stored in `docs/plans/`: forces deliberate design before modifying Program.cs/overlay/adapters.
   - **Prompt/Time caps** (3 prompts / 60 minutes): prevents churn; exceeding triggers BREAKDOWN + environment reset.
   - **Baseline verification** (full Playwright + typecheck) before/after risky slices; results logged in project history and tied to the plan doc.
   - **Renderer fingerprint & script order guards**: maintain overlay parity across `/` and `/__view-home`.
   - **Overlay freeze**: CI enforced; prevents accidental overlay edits until RFC approval.
   - **Environment reset cadence**: restart tools after any BREAKDOWN to avoid stale state.
   - **Pre-prompt reading list**: Protocol, Workflow Tweaks, Postmortem, Recovery plan, relevant plan file.

2. **Workflow Enhancements** – `docs/Workflow-Tweaks-S6.md`
   - **Definition of Done chain** augmented with baseline checks and guardrail confirmation.
   - **Guardrail checklist** (overlay freeze, prompt caps, environment reset, renderer meta, session cadence).
   - **Prompt header requirement** (`Prompt X/Y — elapsed <m>`): visualizes compliance with prompt/time caps.
   - **Plan storage**: mandates using template and storing plans beneath `docs/plans/`.

3. **Assistant Instructions** – `docs/Copilot-Instructions.md`
   - Read order now includes guardrail docs and plan files.
   - **Response schema** includes prompt log line and plan link.
   - Prompt skeleton requires plan path for high-risk slices.

4. **Session Kickoff** – `docs/Session-Start.md`
   - Daily checklist to review guardrail docs, gather decision history, ensure plan creation, and note prompt log header.

5. **Reviewer Checklist** – `docs/Code-Review-Guide.md`
   - Verifies plan link, baseline evidence, overlay freeze acknowledgement, and prompt log presence.

6. **CI Guard** – `.github/workflows/ci.yml`
   - Early step fails if overlay files change while freeze active.

7. **PR Template** – `.github/pull_request_template.md`
   - Captures plan link, baseline timestamps, prompt log snippet, overlay status, and CI guard confirmation.

8. **Postmortem & Recovery Plan**
   - `docs/postmortems/overlay-2025-11-09.md`: detailed timeline, root causes, and guardrail recommendations.
   - `docs/recovery/overlay-recovery-plan.md`: outlines overlay deferral strategy, smoke suite, abort criteria, and operational reset steps.

## Reset Checklist (Use After Each Environment Reset)
1. Read this brief, then walk through `docs/Session-Start.md` checklist.
2. Re-run the baseline (full Playwright + `npm run typecheck`) on `baseline/sprint06-verify@dfbf54a` to confirm clean slate.
3. If tackling a high-risk slice, clone `docs/templates/high-risk-plan.md` into `docs/plans/<story>.md`, fill it, and reference it in your first prompt.
4. Ensure guardrails in `docs/Protocol.md` and `docs/Workflow-Tweaks-S6.md` are acknowledged and logged in prompt headers.
5. Confirm CI overlay guard remains active (no edits to freeze files without RFC).

**Prepared:** 2025-11-09 08:45 EST
