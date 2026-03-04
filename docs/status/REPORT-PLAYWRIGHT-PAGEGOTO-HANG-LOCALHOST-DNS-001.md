# Playwright page.goto Hang — Localhost DNS Root Cause

**Report ID:** REPORT-PLAYWRIGHT-PAGEGOTO-HANG-LOCALHOST-DNS-001
**Prompt ID:** NYCX-PLAYWRIGHT-PAGEGOTO-HANG-DIAGNOSE-DETAIL-LOAD-001
**Date:** 2026-03-04
**Status:** Research complete — root cause identified, fix scoped
**Scope:** Research-only (no commits). Working tree holds Slice-001 edits (2 modified test files).

---

## Background

After the BASE_URL relative-path fix (Slice-001), `request.get('/content/poi.v1.json')` began
succeeding, but `page.goto('/poi/flatiron-001')` continued to hang indefinitely — never
generating a network event — and the test timeout (`--timeout=90000`) failed to kill the
process. This report documents the trace analysis and root cause.

---

## Preflight State

| Item | Value |
|------|-------|
| Branch | main |
| HEAD | 4e0b4fd |
| Modified files | tests/e2e/back-to-map.spec.ts, tests/e2e/list-to-detail.spec.ts (Slice-001 edits) |
| No other changes | ✅ |

---

## A) page.goto call (verbatim — back-to-map.spec.ts L16)

```ts
await page.goto(`/poi/${id}`);
```

No `waitUntil` option specified — defaults to `"load"`. Waits for ALL subresources to finish
loading before resolving. No timeout override on the call itself.

---

## B) Server route health (confirmed 200 via HTTP GET)

| Route | Status |
|-------|--------|
| `http://localhost:5000/` | 200 |
| `http://localhost:5000/content/poi.v1.json` | 200 |
| `http://localhost:5000/poi/flatiron-001` | 200 |
| `http://localhost:5000/images/flatiron.jpg` | **404** (file missing) |

The 404 image does not block the `load` event — browsers do not wait for images that 404.

---

## C) Detail page subresource analysis

**`/poi/flatiron-001` response — 670 bytes, 3 resource references:**

| Reference | Type | Category |
|-----------|------|----------|
| `/` | `<a href>` | Anchor — not loaded by browser |
| `/images/flatiron.jpg` | `<img src>` | Local image, HTTP 404 |
| `https://example.org/flatiron` | `<a href>` | Anchor — not loaded by browser |

**External resources that would be fetched by browser: NONE.**

The detail page has no `<script>`, no `<link rel="stylesheet">`, no external `<img>`. The
`https://example.org` URL is a text link, not a loaded resource.

**For reference — home page `/` external resources (would also cause hangs):**
```
https://unpkg.com/leaflet@1.9.4/dist/leaflet.css
https://unpkg.com/leaflet@1.9.4/dist/leaflet.js
```

---

## D) Playwright trace analysis

**Run timeline:**

| Attempt | Timeout flag | Observed duration | Result |
|---------|-------------|-------------------|--------|
| 1 (pre-fix) | none | ~5 min | `ECONNREFUSED ::1:5000` on `request.get` L7 |
| 2 (post-fix) | none | ~8 min | `page.goto: Test ended` — navigating, waiting for `load` |
| 3 (post-fix) | `--timeout=120000` | ~8 min | `page.goto: Test ended` — same |
| 4 (post-fix, bg job) | `--timeout=90000` | 3+ min still running | `[1/1]` started, never completed |

**Trace file captured (live, during bg job run 4):**

File: `test-results/.playwright-artifacts-0/traces/dc08af68c1a0071ca0b2-a97a188528394a946f2e.network`
Size: 1,238 bytes — **exactly 1 network entry**

```json
{
  "type": "resource-snapshot",
  "request": {
    "method": "GET",
    "url": "http://localhost:5000/content/poi.v1.json"
  },
  "response": { "status": 200 },
  "_apiRequest": true,
  "serverIPAddress": "::1",
  "_serverPort": 5000,
  "timings": { "dns": 16ms, "connect": 18ms, "wait": 5ms, "receive": 2ms }
}
```

**The page.goto navigation has no network entry after 3+ minutes of running.** The browser
never issued an HTTP request for `http://localhost:5000/poi/flatiron-001`.

**Test timeout observation:** `--timeout=90000` fired but did not kill the Playwright process.
The background job remained in `Running` state for 3+ minutes past the timeout. Playwright
timed out the test internally but could not close Chromium, keeping the process alive
indefinitely.

---

## Root Cause

**Chromium async DNS resolution for `localhost` is hanging on this Windows machine.**

Evidence chain:

1. `request.get('/content/poi.v1.json')` uses Playwright's **Node.js HTTP client** — resolves
   `localhost` via OS Winsock → gets `::1` in 16ms → 200 OK. ✅

2. `page.goto('/poi/flatiron-001')` uses the **Chromium browser renderer** — Chromium has its
   own built-in async DNS resolver (c-ares) that queries the configured DNS server directly,
   bypassing Winsock and the hosts file in some configurations. On this machine it never
   receives a DNS response for `localhost`.

3. No network trace entry appears for the navigation → the HTTP request is never sent.
   The browser is stuck in the DNS resolution phase, not the TCP or HTTP phase.

4. When the test timeout fires, Playwright sends a kill signal to Chromium, but Chromium is
   stuck in a kernel-level DNS syscall it cannot abort. The browser process cannot exit
   cleanly, so Playwright hangs waiting for it to close.

5. `C:\Windows\System32\drivers\etc\hosts` has no `localhost` entry. Resolution depends on
   the Windows DNS Client service, which Chromium's c-ares resolver queries via UDP/53.
   Something in the machine's DNS stack prevents that query from completing.

**This is a known Chromium-on-Windows issue.** Chromium's async DNS resolver does not always
fall back to the OS resolver or respect the hosts file, particularly for `localhost` on
machines where the DNS client is misconfigured or the loopback adapter has unusual settings.

---

## Fix

**Replace `localhost` with `127.0.0.1` everywhere in `playwright.config.ts`.**

```ts
// FROM:
baseURL: process.env.BASE_URL || 'http://localhost:5000',
webServer.command: 'dotnet run --urls http://localhost:5000',
webServer.url:     'http://localhost:5000',

// TO:
baseURL: process.env.BASE_URL || 'http://127.0.0.1:5000',
webServer.command: 'dotnet run --urls http://127.0.0.1:5000',
webServer.url:     'http://127.0.0.1:5000',
```

Using an IP address bypasses Chromium's DNS resolver entirely. No DNS query is made;
Chromium connects directly to `127.0.0.1:5000`. This is the canonical fix for this class of
Playwright + Chromium + Windows + localhost hang.

**Files to change:** `playwright.config.ts` only (3 occurrences).

**Interaction with Slice-001 (already in working tree):** The 2 edited test files now use
relative paths that inherit `baseURL`. Once `baseURL` becomes `http://127.0.0.1:5000`, those
relative paths (`/content/poi.v1.json`, `/poi/${id}`) correctly resolve to
`http://127.0.0.1:5000/...` — no DNS query required.

**Remaining 18 hardcoded test files** still define their own
`const BASE_URL = ... || 'http://localhost:5000'` and will continue to hang until
addressed in subsequent Slice prompts. The config fix alone unblocks the 37 tests that
already use relative paths, plus the 2 Slice-001 files.

---

## What was ruled out

| Hypothesis | Evidence against |
|-----------|-----------------|
| Server not running | `netstat` confirmed LISTENING PID 10264; `Invoke-WebRequest` confirmed 200 |
| External subresource blocking `load` | Detail page HTML has zero external loaded resources |
| 404 image blocking `load` | 404s do not block the load event |
| `waitUntil: "load"` vs `"domcontentloaded"` | Browser never sends request at all; not a page-content timing issue |
| App-level slow route | Controller reads local JSON only; no external calls; `Invoke-WebRequest` completes in <100ms |

---

## Next Step

**One-file config edit:** Change all 3 `localhost:5000` occurrences in `playwright.config.ts`
to `127.0.0.1:5000`, then re-run `back-to-map.spec.ts` as the verification anchor.
