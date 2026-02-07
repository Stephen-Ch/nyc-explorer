# Overlay Recovery Review — 2025-11-11

**Generated:** 2025-11-11T06:04:06-05:00
**Requester Context:** Third-party review to diagnose six-hour automation hang and regression in overlay E2E flow.
**Branch:** overlay-drift-20251108-155953
**Head Commit:** 594db22 — "Document overlay route helpers and fixtures"

## 1. Current Status Snapshot
- `dotnet build` (apps/web-mvc): ✅
- `npm run typecheck`: ✅ (last successful run prior to hang; no changes since)
- `npx playwright test e2e/overlay.smoke.spec.ts:21 --workers=1`: ❌ (exit code 1; run hung earlier in session, current failure persists)
- Outstanding local artifacts: `apps/web-mvc/build-errors.json`, `route-inline-trimmed.js` (not tracked in git)
- Overlay Playwright suite still pending revalidation after server binding fix

## 2. Key Changes Since Sprint 06 Retro
1. **594db22** — Added `apps/web-mvc/wwwroot/js/route-bootstrap.js` plus overlay test fixtures (`tests/fixtures/overlay/route-*.json`) and updated `docs/CODE-SMELL-ANALYSIS.md` to reflect current remediation status.
2. **ab3d44a** — Removed hard-coded `app.Run("http://localhost:5000")`; Playwright servers now bind dynamically. Builds are green, overlay E2E still needs rerun.
3. **68ad28d / 8c31a34 / 42f1194** — Progressively extracted `ProcessTemplate`, `InjectEnvScript`, and `WithOverlayScripts` from `HomeHtmlProvider` into `HomeHtmlCore`, reducing Program.cs complexity and centralising overlay boot logic.

## 3. Known Issues & Suspicions
- **Overlay smoke E2E:** Repeated hangs followed by failure at spec `e2e/overlay.smoke.spec.ts:21`. Root cause unresolved; last attempt ran under `--workers=1` and still failed.
- **Route bootstrap parity:** Newly introduced `wwwroot/js/route-bootstrap.js` (672 lines) consolidates inline logic, but parity with the prior inline script has not been validated in the browser. Manual regression checklist is outstanding.
- **Stale tooling artifacts:** `build-errors.json` (SARIF snapshot) and `route-inline-trimmed.js` (trimmed inline script) hint that prior debugging steps were mid-flight. Neither file is referenced or committed.

## 4. Investigation Log (UTC-05)
| Time | Event |
| --- | --- |
| ~2025-11-10 13:00 | Overlay Playwright smoke run hung; automation blocked for ~6 hours. |
| 2025-11-10 15:38 | `route-bootstrap.js` fingerprint emitted via static assets (per obj cache). |
| 2025-11-10 Evening | Series of HomeHtmlCore extractions landed (commits 42f1194 → 68ad28d). |
| 2025-11-10 23:XX | Hard-coded port removed (`ab3d44a`). Builds succeeded; Playwright rerun still pending. |
| 2025-11-11 06:04 | This report generated; overlay smoke still failing at spec line 21. |

*Note:* Exact earlier timestamps are approximate; check git history or CI logs for precise times.

## 5. Immediate Next Steps for Reviewer
1. **Stabilise overlay E2E:** Re-run `npx playwright test e2e/overlay.smoke.spec.ts` end-to-end (no `:21` filter) after confirming server startup uses dynamic port. Capture trace/video for failures.
2. **Audit route bootstrap migration:** Compare `route-inline-trimmed.js` with inlined template to ensure behaviour parity (typeahead wiring, adapter fallbacks, deep-link handling).
3. **Triage local artifacts:** Determine whether `build-errors.json` represents new compiler issues or stale capture; decide on deletion or integration. Remove or document `route-inline-trimmed.js`.
4. **Cross-check docs:** `docs/CODE-SMELL-ANALYSIS.md` now reflects current extraction work; verify if additional playbook updates are required for third-party onboarding.

## 6. Supporting Artifacts
- **Playwright logs:** Prior run invoked `npx playwright test e2e/overlay.smoke.spec.ts:21 --workers=1` (exit 1). No trace file captured.
- **Static asset caches:** `apps/web-mvc/obj/Debug/net8.0/staticwebassets*.json` show fingerprint `r2ui7130i5` for the new route bootstrap.
- **Documentation:** `docs/CODE-SMELL-ANALYSIS.md` details the refactor timeline and remaining work (including pending Playwright rerun).

## 7. Open Questions for Follow-up
- Do we have baseline metrics to confirm overlay responsiveness post-refactor?
- Should `route-bootstrap.js` be unit-tested or covered via Playwright fixtures before deployment?
- Is there CI evidence that the port fix resolves hangs when a clean environment runs the suite?

---
Prepared for handoff to external reviewers. Please append findings or decisions directly to this file with new timestamped sections.
