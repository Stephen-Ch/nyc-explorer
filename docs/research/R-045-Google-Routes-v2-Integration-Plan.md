# R-045 — Google Routes API v2 Integration Plan

**R-ID:** R-045  
**Status:** Open  
**Created:** 2026-05-27  
**Prompt commit:** P051 (docs-only, not committed)  
**Scope:** `computeRoutes` for `WALK` travelMode only — no DRIVE, no Transit

---

## 1. Repo Context (Evidence-First)

### 1a. What already exists

| Asset | Location | Relevance |
|---|---|---|
| Provider-agnostic POST adapter | `apps/web-mvc/wwwroot/js/adapters.js` L9–354 | No code change needed for Google v2 |
| `routeProvider` config entry | `ProviderConfig.cs` reads `ROUTE_PROVIDER` env var | Setting to `/api/route` activates proxy path |
| `normalizeRoutePayload()` | `adapters.js` L224–240 | Already handles `polyline.coordinates[].latLng` (v2 shape) AND `encodedPolyline` (v2 compressed) |
| `readStep()` | `adapters.js` (~L195) | Handles `navigationInstruction.instructions`, `distanceMeters`, `duration.{text,seconds,value}` |
| Fixture in Google v2 shape | `tests/fixtures/route/provider-union-to-bryant.json` | `routes[0].polyline.coordinates[].latLng` + `legs[0].steps[].navigationInstruction` |
| Adapter fixture test (active) | `tests/unit/route-adapter-real.spec.ts` test 1 | Passes today using `useRouteFixture` — no code change needed |
| Adapter timeout test (skipped) | `tests/unit/route-adapter-real.spec.ts` test 2 | Marked `test.skip` — "RED CONTRACT — timeout handling pending" |
| Provider POST call | `adapters.js` L331 | `postJsonWithTimeout(providerUrl, JSON.stringify({from,to}), routeTimeoutMs)` |
| Fallback on error | `adapters.js` L354 | `buildFallbackResult` fires when no `providerUrl` or cooldown active |

### 1b. What does NOT exist yet

| Missing asset | Required for |
|---|---|
| `POST /api/route` proxy endpoint in `Program.cs` | Security — API key must never reach client |
| `GOOGLE_ROUTES_API_KEY` secret / env var | Auth to Google |
| `ROUTE_PROVIDER=/api/route` in env / launchSettings | Wire client → proxy |
| Live integration test | Verify proxy → Google round-trip |

### 1c. Correction vs. session summary

The session summary placed the real-provider spec at `tests/e2e/route-adapter-real.spec.ts`.  
**Actual location:** `tests/unit/route-adapter-real.spec.ts`  
Test 1 is **active** (fixture-only, not live).  Test 2 is `test.skip` (RED CONTRACT, timeout behavior not yet implemented).

---

## 2. Google Routes API v2 — Endpoint and Auth

**Endpoint:**
```
POST https://routes.googleapis.com/directions/v2:computeRoutes
```

**Required headers:**
```
Content-Type:    application/json
X-Goog-Api-Key: {GOOGLE_ROUTES_API_KEY}
X-Goog-FieldMask: {comma-separated field paths}
```

> **Important:** `X-Goog-FieldMask` is required. Omitting it causes the API to return all available fields, which triggers higher-cost billing SKUs and bloated payloads. Always send an explicit minimal field mask.

**Official reference:** https://developers.google.com/maps/documentation/routes/reference/rest/v2/TopLevel/computeRoutes

---

## 3. Minimal WALK Request/Response

### 3a. Request body (WALK — turn-by-turn list only)

```json
{
  "origin": {
    "location": {
      "latLng": {
        "latitude": 40.7359,
        "longitude": -73.9911
      }
    }
  },
  "destination": {
    "location": {
      "latLng": {
        "latitude": 40.7536,
        "longitude": -73.9832
      }
    }
  },
  "travelMode": "WALK"
}
```

No `intermediates`, no `routeModifiers`, no `polylineQuality` override needed for MVP.

### 3b. Response shape (matches `normalizeRoutePayload` expectations)

The normalizer in `adapters.js` already handles TWO polyline variants returned by Routes v2:

**Variant A — Encoded polyline (standard API response):**
```json
{
  "routes": [{
    "polyline": {
      "encodedPolyline": "wqnwFn~ubM..."
    },
    "legs": [{
      "steps": [{
        "navigationInstruction": { "instructions": "Head north on Broadway" },
        "startLocation": { "latLng": { "latitude": 40.7359, "longitude": -73.9911 } },
        "distanceMeters": 320,
        "staticDuration": "240s"
      }]
    }]
  }]
}
```

**Variant B — Coordinate array (as in repo fixture):**
```json
{
  "routes": [{
    "polyline": {
      "coordinates": [
        { "latLng": { "latitude": 40.7359, "longitude": -73.9911 } }
      ]
    }
  }]
}
```

> `normalizeRoutePayload` tries `coordinates[]` first, then falls back to `encodedPolyline`. Both paths are covered. No adapter code change needed.

### 3c. Duration field mapping

The Google Routes v2 API returns `staticDuration` as a Duration proto string (e.g., `"240s"`).  
The step `duration` field (with `.text` like "4 min") is a response field the API may or may not include depending on `languageCode`.  
`readStep()` handles `duration.{text, seconds, value}` already — verify `staticDuration` is parsed if `.text` is absent.

**⚠ WEB-RESEARCH NOTE:** Confirm whether `duration.text` is returned for WALK mode on v2 or only `staticDuration`. See [#7 below](#7-web-research-needed).

---

## 4. Field Mask Design

### 4a. Minimal field mask — steps only (no rendered polyline)

```
X-Goog-FieldMask: routes.legs.steps.navigationInstruction,routes.legs.steps.distanceMeters,routes.legs.steps.staticDuration,routes.legs.steps.startLocation
```

Covers: instruction text, distance per step, duration per step, start coordinates.  
Does **not** include route-level polyline — lower billing SKU.

### 4b. Extended field mask — with rendered polyline for map drawing

```
X-Goog-FieldMask: routes.polyline.encodedPolyline,routes.legs.steps.navigationInstruction,routes.legs.steps.distanceMeters,routes.legs.steps.staticDuration,routes.legs.steps.startLocation
```

Adding `routes.polyline.encodedPolyline` enables `decodePolyline()` path in `adapters.js` L~185.  
This is the field mask recommended for MVP as it enables map path rendering.

### 4c. Step-level polylines (not needed for MVP)

`routes.legs.steps.polyline.encodedPolyline` allows per-step path segments.  
Deferred: adds payload + billing cost; not consumed by current `adapters.js` rendering.

**Official field mask reference:** https://developers.google.com/maps/documentation/routes/choose_fields

---

## 5. Security Model — Server Proxy Required

### 5a. Rule

> **The Google Routes API key must NEVER appear in any client-side file** (`adapters.js`, `home.inline.html`, any JS bundle, any HTML response). A server proxy is mandatory.

### 5b. Architecture

```
Browser (adapters.js)
  │  POST /api/route { from: {lat,lng}, to: {lat,lng} }
  ▼
ASP.NET Core — Program.cs  POST /api/route
  │  Reads GOOGLE_ROUTES_API_KEY from env / user-secrets
  │  Constructs Routes v2 request with X-Goog-Api-Key header
  │  POST https://routes.googleapis.com/directions/v2:computeRoutes
  ▼
Google Routes API v2
  │  Returns routes[] JSON
  ▼
ASP.NET Core (proxy passes response through as-is)
  ▼
Browser — normalizeRoutePayload() processes routes[]
```

### 5c. Config wiring

| Config key | How to set | Value for live mode |
|---|---|---|
| `ROUTE_PROVIDER` (env var) | `launchSettings.json` / CI env | `/api/route` |
| `GOOGLE_ROUTES_API_KEY` (env var) | `dotnet user-secrets` locally; CI secret store in staging/prod | `{key}` |

**Local dev:**
```powershell
dotnet user-secrets set "GoogleRoutes:ApiKey" "{YOUR_KEY}" --project apps/web-mvc
```

**Reading from `Program.cs`:**
```csharp
var googleApiKey = builder.Configuration["GoogleRoutes:ApiKey"]
    ?? Environment.GetEnvironmentVariable("GOOGLE_ROUTES_API_KEY")
    ?? throw new InvalidOperationException("GOOGLE_ROUTES_API_KEY not set");
```

> Never write the key to `appsettings.json` — that file is committed. Use user-secrets locally and environment variables in CI/staging.

### 5d. Proxy endpoint input validation

The proxy endpoint must reject non-latLng input and only accept the `{from, to}` shape already sent by `adapters.js`.  
Validate: `from.lat`, `from.lng`, `to.lat`, `to.lng` are finite numbers in plausible NYC range (lat ~40–41, lng ~ -74 to -73).  
Do not pass arbitrary JSON from the client body directly to Google.

---

## 6. Pricing Overview

> **Disclaimer:** Exact per-request prices change. Always verify at the official billing page before implementation decisions.  
> Official URL: https://developers.google.com/maps/billing/gmp-billing

### 6a. What is known with high confidence

- Google Maps Platform includes a **$200/month free credit** applied before any charges.
- The Routes API (v2) has two billing SKU tiers: **Essentials** (basic routing) and **Pro** (traffic-aware, advanced features).
- For WALK mode, traffic data is irrelevant — Essentials tier applies.
- Pricing is per API call (per request to `computeRoutes`), not per waypoint.
- NYC Explorer MVP usage volume is low (individual user sessions, ~1–10 route requests per session) — free credit will cover the expected development + early usage load entirely.

### 6b. SKU selection guidance

| Feature needed | SKU tier | Cost indicator |
|---|---|---|
| `travelMode: WALK`, `encodedPolyline`, turn-by-turn steps | Essentials | Lowest tier |
| Traffic conditions, preferred routes, toll info | Pro | Higher tier |
| Route tokens (for Navigation SDK) | Route token SKU | Not applicable to this project |

**Decision for MVP:** Essentials SKU is sufficient. Do not request Pro-only fields in FieldMask.

### 6c. Fields that trigger higher-cost SKUs

Requesting the following fields in `X-Goog-FieldMask` may escalate the SKU:
- `routes.travelAdvisory` (live traffic incidents)
- Route optimization features

**Verify at:** https://developers.google.com/maps/documentation/routes/choose_fields#optional-parameters

---

## 7. WEB-RESEARCH NEEDED

These items should be verified against live Google documentation before implementing the slice:

| # | Question | Official URL to check |
|---|---|---|
| 1 | Exact Essentials tier price per 1,000 requests for `computeRoutes` WALK mode | https://developers.google.com/maps/billing/gmp-billing |
| 2 | Does `duration.text` appear in WALK response, or only `staticDuration`? | https://developers.google.com/maps/documentation/routes/reference/rest/v2/TopLevel/computeRoutes |
| 3 | Does the `polyline.coordinates[]` shape appear in a real API response, or only `encodedPolyline`? (The repo fixture uses coordinates.) | Same reference URL |
| 4 | Are there per-second/per-day rate limits that apply during the $200 free tier? | https://developers.google.com/maps/documentation/routes/usage-and-billing |
| 5 | Does the Google Routes v2 API support `X-Goog-Api-Key` from server-side request, or is OAuth 2.0 required for server-to-server? | https://developers.google.com/maps/documentation/routes/cloud-setup |
| 6 | Google API Console: which API to enable — "Routes API" or "Directions API" for v2 endpoint? | https://console.cloud.google.com/apis/library |

---

## 7b. WEB-VERIFIED FACTS (2026-03-05)

> Facts in this section are sourced from official Google documentation and pricing pages. Do not alter numbers without re-citing the source.

### A. Pricing / Free Tier

**Source:** https://developers.google.com/maps/billing/gmp-billing (Google Maps Platform pricing list)

**Routes: Compute Routes — Essentials SKU**
- Free usage cap: **10,000 requests/month**
- Pricing (per 1,000 requests):

| Monthly volume | Price per 1,000 |
|---|---|
| 0 – 10,000 | Free |
| 10,001 – 100,000 | $5.00 |
| 100,001 – 500,000 | $4.00 |
| 500,001 – 1,000,000 | $3.00 |
| 1,000,001 – 10,000,000 | $1.50 |
| 10,000,001+ | $0.38 |

**Routes: Compute Routes — Pro SKU**
- Free usage cap: **5,000 requests/month**
- Pricing (per 1,000 requests):

| Monthly volume | Price per 1,000 |
|---|---|
| 0 – 5,000 | Free |
| 5,001 – 100,000 | $10.00 |
| 100,001 – 500,000 | $8.00 |
| 500,001 – 1,000,000 | $6.00 |
| 1,000,001 – 10,000,000 | $3.00 |
| 10,000,001+ | $0.75 |

**Decision for MVP:** Essentials SKU is sufficient for `travelMode: WALK`. First 10k/month free (Essentials) comfortably covers expected MVP + development usage.

### B. Response Fields: Duration vs Localized Text

**Source:** https://developers.google.com/maps/documentation/routes/reference/rest/v2/TopLevel/computeRoutes

- `duration` and `staticDuration` are **protobuf Duration fields** — returned as strings in the format `"123s"` (e.g., `"240s"` = 240 seconds).
- Human-readable localized text is **not** included in the default response. It is available as `localizedValues.duration.text` and `localizedValues.staticDuration.text` **only if explicitly requested via FieldMask**.
- `duration.text` (the human-readable string used in the test fixture) does **not** exist at step/route level in the v2 API — it exists only under `localizedValues`.

**Impact on `adapters.js`:**
`readStep()` currently looks for `duration.text`. For a live v2 response, the display text must be sourced from `localizedValues.staticDuration.text` (or computed from the `"240s"` duration string). This is an **implementation gap** to address in the proxy slice — see Open Question 1 (updated below).

**Updated FieldMask for human-readable text:**
```
X-Goog-FieldMask: routes.polyline.encodedPolyline,routes.legs.steps.navigationInstruction,routes.legs.steps.distanceMeters,routes.legs.steps.staticDuration,routes.legs.steps.startLocation,routes.legs.steps.localizedValues
```

### C. Required Headers

**Source:** https://developers.google.com/maps/documentation/routes/reference/rest/v2/TopLevel/computeRoutes

- `X-Goog-FieldMask` is **required** for `computeRoutes`. The API will return an error if omitted.
- `X-Goog-Api-Key` is the supported authentication header for server-to-server calls using an API key. OAuth 2.0 is an alternative but not required for API key auth.
- Per our security design (Section 5), `X-Goog-Api-Key` must originate from the **server proxy only** — never from client-side JS.

### D. What We Use Today (Repo-Verified, 2026-03-05)

**Commands run and output captured:**

**`.env.example` line 14:**
```
ROUTE_PROVIDER=mock
```

**`apps/web-mvc/Adapters/ProviderConfig.cs` (relevant lines):**
```csharp
var routeProvider = NormalizeProvider(configuration["ROUTE_PROVIDER"], "mock");
// ...
private static bool IsMock(string provider) =>
    string.Equals(provider, "mock", StringComparison.OrdinalIgnoreCase);
```

**Pattern search across entire repo for `routes.googleapis.com`, `computeRoutes`, `GOOGLE_ROUTES`:** → **0 results in any tracked file.**

**Conclusion:** The current runtime is **fixture/mock-only**. `ROUTE_PROVIDER` defaults to `"mock"` with no env-var override in any committed file. No live provider endpoint, no API key reference, and no call to `routes.googleapis.com` exists anywhere in the codebase as of HEAD `c797ea8`.

---

## 8. Integration Cut List

Ordered by dependency (add proxy before wiring config before new tests):

| # | File | Change type | Purpose |
|---|---|---|---|
| 1 | `apps/web-mvc/Program.cs` | ADD ~30 lines | `POST /api/route` proxy endpoint (reads `GoogleRoutes:ApiKey`, calls Google, passes through response) |
| 2 | Env / user-secrets | ADD | `GOOGLE_ROUTES_API_KEY` for local dev; `ROUTE_PROVIDER=/api/route` in launchSettings |
| 3 | `apps/web-mvc/Adapters/ProviderConfig.cs` | READ-ONLY verify | Reads `ROUTE_PROVIDER` env var — no change needed; setting env var is sufficient |
| 4 | `apps/web-mvc/wwwroot/js/adapters.js` | READ-ONLY verify | Already handles Google v2 response shape via `normalizeRoutePayload`; no code change needed |
| 5 | `tests/fixtures/route/provider-union-to-bryant.json` | READ-ONLY verify | Already in Google v2 shape; normalizer test (unit test 1) already passing |
| 6 | `tests/unit/route-adapter-real.spec.ts` test 2 | UN-SKIP (separate slice) | "RED CONTRACT" timeout test — unblock after implementing timeout error propagation in `adapters.js` |
| 7 | New: `tests/e2e/route-proxy.spec.ts` | CREATE (separate slice) | Live Playwright test hitting `/api/route` proxy with `ROUTE_PROVIDER=/api/route`; guards against proxy regression |

> **Note:** No changes to `apps/web-mvc/wwwroot/static/home.inline.html` are needed if routing to `/api/route` via `ROUTE_PROVIDER` env var. The `routeProvider` value is injected at startup by `Program.cs` → `HomeHtmlProvider.Configure()`. Client JS reads it from `App.config.routeProvider` already. Setting the env var is the only config change.

---

## 9. Implementation Slice (when ready to code)

Minimum viable implementation for Slice X ("Route Proxy"):

**`Program.cs` addition (~30 lines):**
1. Read `GoogleRoutes:ApiKey` from `builder.Configuration` (falls back to env var)
2. Register `HttpClient` for Routes API
3. Add `app.MapPost("/api/route", async ...)` endpoint that:
   - Deserializes `{from, to}` from request body
   - Validates lat/lng are finite numbers (rejects malformed input)
   - Builds `computeRoutes` request body with `travelMode: WALK` and extended FieldMask
   - POSTs to `https://routes.googleapis.com/directions/v2:computeRoutes` with `X-Goog-Api-Key` + `X-Goog-FieldMask` headers
   - Streams response JSON directly back to client (no re-serialization needed)

**Config entries (non-committed):**
```
dotnet user-secrets: GoogleRoutes:ApiKey = {key}
launchSettings.json: ROUTE_PROVIDER = /api/route  (for local live-mode testing only)
```

**No changes to `adapters.js`** — the existing `normalizeRoutePayload` and `postJsonWithTimeout` already handle the Google v2 response.

---

## 10. Open Questions

1. **Duration field — ANSWERED (2026-03-05):** Google Routes v2 does NOT return `duration.text` at the step level. The human-readable string lives under `localizedValues.staticDuration.text`. Current `readStep()` in `adapters.js` looks for `duration.text` — this will silently produce no display text against a live v2 response. Fix required in the proxy slice: either (a) request `routes.legs.steps.localizedValues` in FieldMask and use `localizedValues.staticDuration.text`, or (b) format `staticDuration` (`"240s"`) into a human-readable string server-side before returning to client.
2. **Error shapes** — does Google v2 return `{ error: { code, message, status } }` on failures? `buildFallbackResult` in `adapters.js` should handle this, but verify.
3. **HTTPS requirement** — the local dev server runs on `http://127.0.0.1:5000`. Google Routes API requires outbound HTTPS from server; inbound proxy call from browser to server can be HTTP locally. Confirm no constraint.
4. **API Console project** — which GCP project to enable the Routes API on; how to scope the API key to restrict to this server's IP or referrer.

---

## 11. Evidence Provenance

| Claim | Source |
|---|---|
| `routeProvider` config reads `ROUTE_PROVIDER` env var | `apps/web-mvc/Adapters/ProviderConfig.cs` L19–20 |
| `normalizeRoutePayload` handles `polyline.coordinates[].latLng` | `apps/web-mvc/wwwroot/js/adapters.js` L228–230 |
| `normalizeRoutePayload` handles `encodedPolyline` | `apps/web-mvc/wwwroot/js/adapters.js` L229 |
| Fixture is in Google v2 shape | `tests/fixtures/route/provider-union-to-bryant.json` |
| Real-provider spec is in `tests/unit/` (not `tests/e2e/`) | `git ls-files \| Select-String "route-adapter-real"` |
| First spec test uses `useRouteFixture` (not live) | `tests/unit/route-adapter-real.spec.ts` L13–31 |
| Second spec test is `test.skip` | `tests/unit/route-adapter-real.spec.ts` L33 |
| No existing API key references in codebase | `Select-String -Path apps,tests -Pattern "X-Goog\|googleRoutes\|GOOGLE_ROUTES"` → 0 results |
| No existing `/api/route` proxy endpoint | `apps/web-mvc/Program.cs` full read — no route proxy map |
| `providerUrlFromConfig` used as POST target | `apps/web-mvc/wwwroot/js/adapters.js` L275–277, L331 |
