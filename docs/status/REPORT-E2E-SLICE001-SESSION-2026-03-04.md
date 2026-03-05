# E2E Slice-001 Session Status Report — 2026-03-04

**Report ID:** REPORT-E2E-SLICE001-SESSION-2026-03-04
**Date:** 2026-03-04
**Branch:** main
**HEAD at close:** `5a8d2a6`
**Scope:** e2e suite diagnosis and Slice-001 fix (back-to-map + list-to-detail)
**Operator:** GitHub Copilot (automated) + Stephen (manual intervention required — see §6)

---

## 1. Executive Summary

This session diagnosed and partially fixed the broken `npm run e2e:auto` suite. The root cause
was two independent problems:

1. **20 test files** define `const BASE_URL = 'http://localhost:5000'` and pass absolute URLs
   to `request.get()` and `page.goto()`, bypassing Playwright's `baseURL` entirely.
2. **Chromium async DNS** hangs resolving `localhost` on this machine (no hosts file entry),
   causing `page.goto('http://localhost:…')` to stall indefinitely pre-HTTP.
3. **`waitUntil: 'load'` default** on `page.goto` caused the browser to hang even after the
   DNS fix — the exact mechanism is still unconfirmed (likely related to Kestrel connection
   behavior with Chromium's HTTP stack).

Slice-001 fixed 2 of the 20 affected spec files (`back-to-map.spec.ts` and
`list-to-detail.spec.ts`). The `playwright.config.ts` was updated to use `127.0.0.1:5000`.
`back-to-map.spec.ts` was further patched with `waitUntil: 'commit'`.

**The back-to-map test passed — but required 2 manual "Resume" clicks in the Playwright
inspector window before it completed. This is a significant qualification; see §6.**

---

## 2. Story / Admin Work Completed

| Story / Task | Commit | Status |
|---|---|---|
| NYCX-DOCS-STD-002 hygiene (ResearchIndex date, link audit) | `27704fe` | ✅ DONE |
| NEXT.md advance (close STD-002) | `d0ebd50` | ✅ DONE |
| OR-08A freeze-lift approval + CI-Policy update | `271a612` | ✅ DONE |
| Start-Here kit version drift fix (v7.1.5 → v7.2.37) + forGPT resync | `fd17f33` | ✅ DONE |
| R-029 research doc (blank browser / webServer port) | `6132f0a` | ✅ DONE |
| Scope plan: 20 hardcoded BASE_URL files identified | `4e0b4fd` | ✅ DONE |
| Slice-001: remove BASE_URL from back-to-map + list-to-detail | `c7aec98` | ✅ DONE |
| DNS hang root cause report | `c6ed519` | ✅ DONE |
| forGPT resync commit | `ab5dd0c` | ✅ DONE |
| playwright.config.ts: localhost → 127.0.0.1 (3 occurrences) | `5a8d2a6` | ✅ DONE |
| back-to-map: add `waitUntil: 'commit'` to page.goto | `5a8d2a6` | ✅ DONE |

---

## 3. Commit Chain (this session)

```
5a8d2a6  fix(e2e): use 127.0.0.1 and waitUntil:commit to fix Chromium detail page hang
ab5dd0c  docs(forGPT): resync generated packet
c6ed519  docs(status): add Playwright localhost DNS hang trace report
c7aec98  test(e2e): remove hardcoded BASE_URL from back-to-map and list-to-detail
4e0b4fd  docs(status): add Playwright hardcoded :5000 scope plan report
6132f0a  docs(research): add R-029 Playwright e2e blank-browser webServer/port fix
fd17f33  docs: update Start-Here kit version to v7.2.37; resync forGPT
271a612  docs: approve OR-08A freeze-lift (checklist) and update CI policy
d0ebd50  docs: advance NEXT (close STD-002; set overlay freeze-lift approval active)
27704fe  docs: NYCX-DOCS-STD-002 hygiene (branches, ignore/untracked, ResearchIndex date, link fixes)
```

---

## 4. Technical Findings

### 4a. Root cause 1 — Hardcoded BASE_URL (20 files)

Each of 20 e2e spec files contains:
```ts
const BASE_URL = process.env.BASE_URL || 'http://localhost:5000';
```
and uses it for `request.get(BASE_URL + '/...')` or `page.goto(BASE_URL + '/...')`.
This completely bypasses Playwright's `baseURL` in `playwright.config.ts`, so any port
change to the config has no effect on these tests.

**Fix applied (Slice-001):** Remove `const BASE_URL`, replace all usages with relative paths
(`'/content/poi.v1.json'`, `\`/poi/${id}\``, `'/'`).

**18 files still pending** (Slice-002 through N — see §7).

### 4b. Root cause 2 — Chromium async DNS hang on `localhost`

Chromium uses its own async DNS resolver (c-ares), which does **not** fall back to Winsock on
Windows when the system `hosts` file has no `localhost` entry. `page.goto('http://localhost:…')`
never sent an HTTP request — it stalled indefinitely at DNS resolution. Node.js `request.get()`
works because it uses the OS Winsock stack.

**Fix applied:** `playwright.config.ts` — all 3 occurrences of `localhost:5000` →
`127.0.0.1:5000` (baseURL, webServer.command, webServer.url). Committed `5a8d2a6`.

### 4c. Root cause 3 — `waitUntil: 'load'` hang (mechanism unconfirmed)

After the DNS fix, `page.goto('/poi/flatiron-001')` still hung indefinitely waiting for the
`load` event. The detail page HTML is 670 bytes with no `<script>` or `<link rel=stylesheet>`.
The only subresources are:

| Resource | Type | Status |
|---|---|---|
| `/images/flatiron.jpg` | `<img src>` | 404 (instant) |
| `https://example.org/flatiron` | `<a href>` | anchor — does not block load |

A 404 image should not block `load`. The exact mechanism was not confirmed (trace could not
be captured before session timeouts). The fix was empirically applied.

**Fix applied:** `page.goto(\`/poi/${id}\`, { waitUntil: 'commit' })` — fires as soon as
response headers arrive, before any subresource settlement. Committed `5a8d2a6`.

---

## 5. Test Result — back-to-map.spec.ts

```
Running 1 test using 1 worker
  1 passed (29.2s)
```

**Qualification — manual "Resume" clicks required (see §6).**

---

## 6. ⚠️ Manual Intervention Required — Playwright Inspector

**The test did NOT pass autonomously.**

When Playwright ran `back-to-map.spec.ts`, the **Playwright Inspector window** opened and
paused execution. Stephen had to manually click **"Resume" twice** in the Inspector UI before
the test proceeded and completed.

### What this means

- Playwright is running in **headed/debug mode** for this test, not fully headless.
- The `--debug` flag or `PWDEBUG=1` environment variable may be set globally (e.g., in a
  shell profile or `.env`), causing Inspector to intercept every run.
- The test result (`1 passed`) is **not reproducible in CI** under current conditions —
  CI cannot click "Resume".

### Recommended investigation

1. Check for `PWDEBUG` in environment:
   ```powershell
   [System.Environment]::GetEnvironmentVariable("PWDEBUG", "User")
   [System.Environment]::GetEnvironmentVariable("PWDEBUG", "Machine")
   ```
2. Check for `--debug` or `--headed` in `playwright.config.ts` or `package.json` test scripts.
3. Check for `page.pause()` calls in any spec or helper file.
4. The fix: ensure `PWDEBUG` is unset (or `PWDEBUG=0`) before running `npm run e2e:auto`.

**This is a blocking issue for the e2e green gate. The suite cannot be considered passing
until at least one run completes without manual intervention.**

---

## 7. Pending Work

### Immediate blocker
- [ ] Diagnose and remove the condition causing Playwright Inspector to open and pause
      (likely `PWDEBUG=1` env var) — **required before e2e gate can pass in CI**

### Slice-002+: remaining 18 hardcoded BASE_URL spec files
Each needs: remove `const BASE_URL`, replace absolute URLs with relative paths.

| File | Notes |
|---|---|
| `tests/e2e/detail-images.spec.ts` | has `page.goto(BASE_URL + '/poi/...')` — needs `waitUntil: 'commit'` too |
| `tests/e2e/detail-page.spec.ts` | same |
| `tests/e2e/form-a11y.spec.ts` | |
| `tests/e2e/leaflet.spec.ts` | |
| `tests/e2e/map.spec.ts` | |
| `tests/e2e/marker-a11y.spec.ts` | |
| `tests/e2e/marker-focus.spec.ts` | |
| `tests/e2e/marker-to-detail.spec.ts` | has detail page goto — needs `waitUntil: 'commit'` |
| `tests/e2e/path-helper.spec.ts` | |
| `tests/e2e/placeholder-encoding.spec.ts` | |
| `tests/e2e/poi-endpoint.spec.ts` | |
| `tests/e2e/probe.spec.ts` | |
| `tests/e2e/route-detail.spec.ts` | has detail page goto — needs `waitUntil: 'commit'` |
| `tests/e2e/route-filter.spec.ts` | |
| `tests/e2e/route-inputs.spec.ts` | |
| `tests/e2e/route-ui.spec.ts` | |
| `tests/e2e/search.spec.ts` | |
| `tests/e2e/vis-map.spec.ts` | |

### After all 20 files fixed
- [ ] Run `npm run e2e:auto` full suite (without Inspector pausing) to establish green baseline
- [ ] Advance NEXT.md (e2e gate complete → open EPIC-001/003 runtime work)

---

## 8. Working Tree at Session Close

```
HEAD: 5a8d2a6 (main, origin/main)
Status: CLEAN
```

---

## 9. Open Questions / Risks

| # | Question | Risk |
|---|---|---|
| 1 | Is `PWDEBUG=1` set in user/machine env or shell profile? | **HIGH** — blocks CI and autonomous runs |
| 2 | Why does `waitUntil: 'load'` hang on a 670-byte page with no blocking resources? | MEDIUM — needs trace confirmation; the `waitUntil: 'commit'` workaround is in place but the root cause is unknown |
| 3 | Do any of the 18 remaining specs also navigate to detail pages? | MEDIUM — those will also need `waitUntil: 'commit'` |
