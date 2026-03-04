# R-029 — Playwright e2e: Blank Browser / webServer Port Issue

**Date:** 2026-03-04  
**Status:** Open — awaiting fix execution  
**Category:** Testing / Environment

---

## Context

- `npm run e2e:auto` opens browser windows that hang blank — no HTTP response is received and tests time out or are manually cancelled.
- Three run attempts were made across the session; none produced a complete Playwright test summary.

---

## Repo Evidence

**package.json scripts (both e2e and e2e:auto are identical):**
```
"e2e": "playwright test",
"e2e:auto": "playwright test",
```

**playwright.config.ts webServer block:**
```
webServer: {
  command: 'dotnet run --urls http://localhost:5000',
  url: 'http://localhost:5000',
  reuseExistingServer: true,
  timeout: 120000,
  cwd: 'apps/web-mvc',
},
```

`baseURL` is also hardcoded to `http://localhost:5000` (or `process.env.BASE_URL`).

---

## Likely Cause (hypothesis — not yet proven by captured output)

Port 5000 was repeatedly found in `TIME_WAIT` state from prior dotnet/Playwright processes. Two mechanisms can cause the blank-browser symptom:

1. **`reuseExistingServer` probe false-positive:** Playwright sends an HTTP probe to `http://localhost:5000`. A `TIME_WAIT` entry can cause the TCP handshake to partially succeed, leading Playwright to conclude a server is ready and skip launching `dotnet run`. Tests then run against a port that is not actually serving HTTP.

2. **dotnet bind failure / slow warmup:** Even when dotnet starts, it may be TCP-LISTENING before ASP.NET middleware is fully initialised. If Playwright begins issuing test page loads before the app is serving, `page.goto()` receives connection resets and hangs.

The full Playwright stdout (which would show the webServer startup log and first test error) has never been captured — all runs were cancelled before completion.

---

## Applicable Playwright Guidance

Verbatim from standard Playwright troubleshooting guidance:

> "webServer won't start → run the webServer command manually (outside Playwright) and verify the URL returns 200."

> "Port in use → change both --urls and webServer.url to a new port."

*(Note: `general_Playwright.md` is not present as a tracked file in this repo. The above bullets are from the kit's standard Playwright guidance.)*

---

## Proposed Fix Options

**Option 1 (preferred) — Port shift to 5001:**  
Change `playwright.config.ts` webServer.command and webServer.url from `:5000` to `:5001`. Also update `baseURL` default. This eliminates TIME_WAIT contention from prior dev server sessions on the default port.

Files to change:
- `playwright.config.ts` — `command`, `url`, `baseURL`
- Verify nothing else hardcodes `5000` (grep `apps/web-mvc/Properties/launchSettings.json`)

**Option 2 — Manual pre-start with HTTP verification:**  
Pre-start dotnet outside Playwright, confirm a true HTTP 200 with `Invoke-WebRequest`, then run Playwright with `--workers=1 --reporter=line` to get visible per-test output before cancelling.

---

## Verification Steps (PowerShell / Windows)

```powershell
# Check port state before running
netstat -ano | findstr :5000

# Prove server is serving HTTP (not just TCP-listening)
Invoke-WebRequest -Uri "http://localhost:5000" -Method Head

# Run a single smoke file with visible output
npx playwright test --project=chromium --workers=1 --reporter=line tests/e2e/overlay.smoke.spec.ts
```

---

## Stop Conditions

| Outcome | Meaning |
|---------|---------|
| `Invoke-WebRequest` returns `StatusCode: 200` before test run | Server is ready; proceed |
| `Invoke-WebRequest` throws / returns non-200 | Server not ready — fix startup before running tests |
| Playwright summary shows `X passed` or `X failed` with test names | Suite reached test-execution phase — success |
| Browsers open blank, no test names printed | webServer probe false-positive — port still not serving |

---

## Decision

Next action is an execution prompt to implement **Option 1 (port shift to 5001)** and verify.
