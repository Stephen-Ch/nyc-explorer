# R-046 — Google Routes Proxy Contract and Mapping

**R-ID:** R-046  
**Status:** Open  
**Created:** 2026-03-05  
**Prompt commit:** P052 (docs-only)  
**Depends on:** R-045 (Google Routes API v2 integration plan)  
**Scope:** Engineering contract only — no code changes in this document

---

## 1. Repo Baseline (Evidence-First)

All claims in this document are backed by command output against HEAD `b287518`.

| Asset | Location | Key facts |
|---|---|---|
| Provider POST caller | `apps/web-mvc/wwwroot/js/adapters.js` L331 | Sends `{ from:{lat,lng}, to:{lat,lng} }` via `postJsonWithTimeout` to `providerUrl` |
| `normalizeRoutePayload` | `adapters.js` L225–238 | Handles `polyline.coordinates[].latLng` and `polyline.encodedPolyline` + `legs[].steps[]` |
| `readStep` | `adapters.js` L171–183 | Reads `navigationInstruction.instructions`, `startLocation`, `distanceMeters`, `duration` |
| `parseDuration` | `adapters.js` L160–170 | Reads `duration.seconds` / `duration.value` / `duration.text` — does **NOT** read `staticDuration` |
| `isRateLimitError` | `adapters.js` L350 | `error.status === 429` |
| `ProviderTimeoutError` | `adapters.js` L24–27 | `{ name: 'ProviderTimeoutError', code: 'TIMEOUT' }` |
| Rate-limit fallback | `adapters.js` L374–380 | Sets cooldown + calls `buildFallbackResult` (no throw) |
| Timeout propagation | `adapters.js` L367–372 | Throws `ProviderTimeoutError` after 2 attempts → `handleAdapterFailure()` in route-bootstrap |
| `handleAdapterFailure` display | `route-bootstrap.js` L571–576 | Catches `ProviderTimeoutError` / `code=TIMEOUT`, calls `handleAdapterFailure()` |
| UI route display | `data-testid="route-msg"` + `id="route-steps"` | In `home.inline.html` L43, L46 |
| Fixture interceptor keywords | `tests/helpers/provider-fixtures.ts` L13 | `ROUTE_KEYWORDS = ['/route', '/directions', 'computeroutes']` |
| Active fixture test | `tests/unit/route-adapter-real.spec.ts` test 1 | Uses `useRouteFixture`; passes today against `provider-union-to-bryant.json` |
| Skipped timeout test | `tests/unit/route-adapter-real.spec.ts` test 2 | `test.skip` — RED CONTRACT — timeout propagation pending |

### 1a. Confirmed Duration Gap

`parseDuration` (adapters.js L160–170):
```js
const direct = toNumber(step?.durationSeconds ?? step?.duration?.seconds ?? step?.duration?.value);
if (direct !== null) return direct;
const text = plainText(step?.duration?.text ?? '');
```

Google Routes v2 live response returns `staticDuration: "240s"` (protobuf Duration string).  
`parseDuration` does NOT read `staticDuration`. Without mitigation, all step durations will be `0` against a live provider.

**Resolution (mandatory before proxy goes live):** Proxy must transform `staticDuration` to `duration.seconds` (numeric) before returning to client, **or** `parseDuration` must be extended to read `staticDuration`. See Section 5D.

---

## 2. `/api/route` Proxy Request/Response Contract (MVP)

### 2a. Request (Client → Proxy)

**Method:** `POST /api/route`  
**Content-Type:** `application/json`

```json
{
  "from": { "lat": 40.7359, "lng": -73.9911 },
  "to":   { "lat": 40.7536, "lng": -73.9832 }
}
```

**Rules:**
- `from` and `to` are required; both must contain finite-number `lat` and `lng`.
- No other fields are accepted in MVP. The proxy ignores and does not forward unknown keys.
- `mode` is always `WALK` in MVP (not sent by client; hardcoded in proxy).
- Proxy must reject requests where lat/lng are missing, non-numeric, or outside plausible NYC range (lat 40–41, lng −74 to −73) with `400 Bad Request`.

**Invalid input examples (all return 400):**
```json
{ "from": { "lat": "forty", "lng": -73.9911 }, "to": { "lat": 40.75, "lng": -73.98 } }
{ "from": { "lat": 40.7359 }, "to": { "lat": 40.75, "lng": -73.98 } }
{}
```

### 2b. Response (Proxy → Client) — Success with polyline + steps

**HTTP 200** — pass-through of Google v2 shape with duration normalization applied:

```json
{
  "routes": [
    {
      "polyline": {
        "encodedPolyline": "wqnwFn~ubM..."
      },
      "legs": [
        {
          "steps": [
            {
              "navigationInstruction": { "instructions": "Head north on Broadway" },
              "startLocation": { "latLng": { "latitude": 40.7359, "longitude": -73.9911 } },
              "distanceMeters": 320,
              "duration": { "seconds": 240, "text": "4 min" }
            },
            {
              "navigationInstruction": { "instructions": "Turn right toward Bryant Park" },
              "startLocation": { "latLng": { "latitude": 40.753, "longitude": -73.984 } },
              "distanceMeters": 120,
              "duration": { "seconds": 90, "text": "2 min" }
            }
          ]
        }
      ]
    }
  ]
}
```

> **Proxy responsibility:** Google v2 returns `staticDuration: "240s"`. The proxy must convert this to `duration: { seconds: 240, text: "4 min" }` so that `parseDuration` in `adapters.js` can read `duration.seconds` without modification.

### 2c. Response — Success without polyline (steps only)

**HTTP 200** — same shape but `polyline` key absent:

```json
{
  "routes": [
    {
      "legs": [
        {
          "steps": [
            {
              "navigationInstruction": { "instructions": "Continue toward 5th Avenue" },
              "startLocation": { "latLng": { "latitude": 40.7362, "longitude": -73.9909 } },
              "distanceMeters": 85,
              "duration": { "seconds": 60, "text": "1 min" }
            }
          ]
        }
      ]
    }
  ]
}
```

`normalizeRoutePayload` returns `{ path: [], steps: [...] }` when no polyline — UI still renders turn list. This matches the existing `provider-steps-only.json` fixture shape (after duration normalization).

### 2d. Response — Provider Timeout

**HTTP 504 Gateway Timeout**

```json
{ "error": "provider_timeout", "message": "Google Routes API did not respond in time." }
```

Client (`adapters.js` L345): catches network/AbortError from `postJsonWithTimeout` → throws `ProviderTimeoutError`.  
UI (`route-bootstrap.js` L571): catches `ProviderTimeoutError` → `handleAdapterFailure()`.

> The proxy returning 504 causes Fetch to throw an HTTP error. `postJsonWithTimeout` does not specially handle HTTP status codes — it resolves on any response. For 504, the body will not be Google v2 shape, so `normalizeRoutePayload` returns `{ path: [], steps: [] }`, which causes `providerRoutePath` to return `null` → `buildFallbackResult` path. This is acceptable for MVP.  
> **Better:** proxy should throw/abort the connection on timeout so `isTimeoutLike` fires and the cooldown is set. See Section 5D open question.

### 2e. Response — Rate Limited (429)

**HTTP 429 Too Many Requests**

```json
{ "error": "rate_limited", "message": "Google Routes API rate limit reached." }
```

Client (`adapters.js` L350): `isRateLimitError` checks `error.status === 429`. **Note:** `postJsonWithTimeout` returns the parsed JSON body, not an error with `.status` populated. The 429 handling path is only reached if the client's fetch wrapper sets `error.status`. This is a **known gap** — see Section 6, Q2.

### 2f. Response — Invalid Input (client-side validation failure)

**HTTP 400 Bad Request**

```json
{ "error": "invalid_input", "message": "from and to must be valid lat/lng coordinates." }
```

---

## 3. Google Routes v2 FieldMask Design

### 3a. MVP-Minimum FieldMask — Steps Only (no map polyline)

```
X-Goog-FieldMask: routes.legs.steps.navigationInstruction,routes.legs.steps.distanceMeters,routes.legs.steps.staticDuration,routes.legs.steps.startLocation,routes.legs.steps.localizedValues
```

Fields requested:
- `navigationInstruction` → `readStep` reads `.instructions`
- `distanceMeters` → `parseDistance` reads directly
- `staticDuration` → proxy converts to `duration.seconds` + `duration.text`
- `startLocation` → `readNode` reads `latLng.latitude/longitude`
- `localizedValues` → provides `staticDuration.text` ("4 min") for human-readable text fallback

> Without `localizedValues`, the proxy must compute the human-readable string from `staticDuration` (e.g., `"240s"` → `"4 min"`). Requesting `localizedValues` is simpler.

**Official reference:** https://developers.google.com/maps/documentation/routes/choose_fields

### 3b. MVP+Polyline FieldMask (recommended — enables map path rendering)

```
X-Goog-FieldMask: routes.polyline.encodedPolyline,routes.legs.steps.navigationInstruction,routes.legs.steps.distanceMeters,routes.legs.steps.staticDuration,routes.legs.steps.startLocation,routes.legs.steps.localizedValues
```

Adds `routes.polyline.encodedPolyline` — consumed by `decodePolyline()` in `adapters.js` L185.  
This is the **recommended FieldMask for MVP** as it enables both map path rendering and turn-by-turn list.

### 3c. Why `localizedValues.staticDuration.text` is Required

Per R-045 web-verified facts (Section 7b-B):
- Google Routes v2 does **not** return `duration.text` at the step level
- Human-readable text is only available under `localizedValues.staticDuration.text`
- `parseDuration` parses `duration.text` (text like "4 min") — without it, text-based duration falls to `return 0`

**Proxy strategy (chosen):** Request `localizedValues`, extract `localizedValues.staticDuration.text`, inject as `duration.text` and convert `staticDuration` string to `duration.seconds`. No change needed to `adapters.js`.

**Alternative (deferred):** Extend `parseDuration` to handle `staticDuration: "240s"`. Requires code change + regression test.

---

## 4. Mapping Table: Google v2 → Normalized → Consumer

| Google v2 response path | Proxy transforms to | Normalized field | Used by |
|---|---|---|---|
| `routes[0].polyline.encodedPolyline` | Pass through | `rawPath` via `decodePolyline()` | `normalizeRoutePayload` → `path[]` → map rendering |
| `routes[0].polyline.coordinates[].latLng` | Pass through | `rawPath` via coord map | `normalizeRoutePayload` → `path[]` → map rendering |
| `routes[0].legs[].steps[].navigationInstruction.instructions` | Pass through | `step.text` | `readStep` L173; rendered in `[data-testid="route-step"]` |
| `routes[0].legs[].steps[].startLocation.latLng.{latitude,longitude}` | Pass through | `step.lat`, `step.lng` | `readNode` L140–142; `readStep` L174; used by `route-bootstrap.js` for map node pinning |
| `routes[0].legs[].steps[].distanceMeters` | Pass through | `step.distance` | `parseDistance` (adapters.js); displayed in step UI |
| `routes[0].legs[].steps[].staticDuration` (e.g., `"240s"`) | **Convert** → `duration: { seconds: 240, text: "4 min" }` | `step.duration` (seconds) | `parseDuration` L161; route-bootstrap ETA display |
| `routes[0].legs[].steps[].localizedValues.staticDuration.text` (e.g., `"4 min"`) | Inject as `duration.text` | `step.duration` text fallback | `parseDuration` L163 |

**Source evidence:**
- `normalizeRoutePayload`: `adapters.js` L225–238
- `readStep` / `parseDuration` / `readNode`: `adapters.js` L140–183
- `[data-testid="route-step"]`: `route-bootstrap.js` L183; `nav-bootstrap.js` L181
- `[data-testid="route-msg"]`: `home.inline.html` L43

---

## 5. Error & Timeout Semantics

### 5a. Error flow summary

| Condition | Google returns | Proxy returns | Client `adapters.js` behavior | UI displayed |
|---|---|---|---|---|
| Success | 200 + routes[] | 200 + routes[] (duration-normalized) | `normalizeRoutePayload` → path + steps | Steps rendered in `#route-steps` |
| No route found | 200 + empty routes[] | 200 + `{ "routes": [] }` | `path: [], steps: []` → `null` → `buildFallbackResult` | Fallback straight-line route shown |
| Provider timeout | Connection timeout | 504 or connection dropped | `isTimeoutLike` fires → `ProviderTimeoutError` → cooldown set | `handleAdapterFailure()` called |
| Rate limited | 429 | 429 | `isRateLimitError(error)` — **see gap Q2** | Fallback route + cooldown |
| Invalid input | N/A (rejected before Google call) | 400 | `normalizeRoutePayload` on 400 body fails → fallback | Fallback route |
| Google error (500+) | 500 | 502 Bad Gateway | `normalizeRoutePayload` fails → `null` → `buildFallbackResult` | Fallback route |

### 5b. Cooldown behavior (adapters.js L381)

After 2 consecutive `ProviderTimeoutError`s or rate-limit hits:
- `routeCooldownUntil = Date.now() + routeCooldownMs` is set
- All subsequent `path()` calls return `buildFallbackResult` until cooldown expires
- Cooldown is reset to 0 on any successful provider response

### 5c. `handleAdapterFailure` (route-bootstrap.js L571–576)

```js
if (error && (error.name === 'ProviderTimeoutError' || error.code === 'TIMEOUT')) {
  handleAdapterFailure();
  return true;
}
```

`handleAdapterFailure` (not shown in evidence above) is presumed to update `[data-testid="route-msg"]`. To be confirmed during implementation.

### 5d. Open Implementation Decisions

1. **Proxy timeout → client signal:** For the proxy to trigger `ProviderTimeoutError` on the client, the proxy must either:
   - Return 504 and the client must treat non-2xx as timeout (requires adapters.js change), **or**
   - Close the connection / take longer than `routeTimeoutMs` (3200ms default) so `postJsonWithTimeout` fires its `AbortController` timeout and `isTimeoutLike` catches it.
   - **Recommended for MVP:** Proxy applies its own 3000ms timeout to the Google API call. If exceeded, proxy closes connection without response → client Fetch aborts → `isTimeoutLike` → `ProviderTimeoutError`. This requires no `adapters.js` changes.

2. **Rate-limit propagation gap (Q2 from evidence):** `isRateLimitError` checks `error.status === 429`, but `postJsonWithTimeout` resolves the response JSON, not rejects with status. Currently 429 would resolve, and `normalizeRoutePayload` on `{ error: "rate_limited" }` returns `{ path: [], steps: [] }` → fallback. The cooldown is NOT set via the `isRateLimitError` path. **Defer** to a follow-up slice or accept fallback-without-cooldown for MVP.

---

## 6. Deterministic Test Plan (No Live HTTP in CI)

### 6a. How fixture interception already works

`tests/helpers/provider-fixtures.ts` L13:
```ts
const ROUTE_KEYWORDS = ['/route', '/directions', 'computeroutes'];
```

`useRouteFixture` intercepts **any** request whose URL contains `/route`, `/directions`, or `computeroutes`.  
When `ROUTE_PROVIDER=/api/route`, the client calls `POST /api/route` → url contains `/route` → fixture intercepts before the network call reaches the proxy.

**This means all existing fixture-based tests continue to work unchanged when the proxy is wired up.** No modification to `route-adapter-real.spec.ts` test 1 is needed.

### 6b. New fixture needed: duration-normalized shape

Current fixtures (`provider-union-to-bryant.json`, `provider-steps-only.json`) use `duration: { text: "4 min" }`.  
A live proxy response would use `duration: { seconds: 240, text: "4 min" }` after normalization.

**Action:** Create `tests/fixtures/route/provider-proxy-normalized.json` containing a proxy-normalized response (with both `duration.seconds` and `duration.text`) to test the proxy output contract.

```json
{
  "routes": [{
    "polyline": { "encodedPolyline": "wqnwFn~ubM..." },
    "legs": [{
      "steps": [
        {
          "navigationInstruction": { "instructions": "Head north on Broadway" },
          "startLocation": { "latLng": { "latitude": 40.7359, "longitude": -73.9911 } },
          "distanceMeters": 320,
          "duration": { "seconds": 240, "text": "4 min" }
        }
      ]
    }]
  }]
}
```

### 6c. New test: proxy contract unit test (no live HTTP)

Add to `tests/unit/route-adapter-real.spec.ts` (or a new `route-proxy-contract.spec.ts`):

```ts
// ROUTE-PROXY-1a — proxy-normalized duration is parsed correctly
test('ROUTE-PROXY-1a — duration.seconds from proxy-normalized response', async ({ page }) => {
  await page.addInitScript(() => { const w = window as any; w.__nycMock = { ...(w.__nycMock || {}), route: false }; });
  const dispose = await useRouteFixture(page, { payload: proxyNormalized, once: true });
  await page.goto('/');
  const result = await page.evaluate(async ({ from, to }) => {
    const adapters = (window as any).App?.adapters;
    const path = await adapters.route.path(from, to);
    return { steps: path?.__nycSteps };
  }, { from, to });
  await dispose();
  expect(result?.steps?.[0]?.duration).toBe(240); // seconds from duration.seconds
  expect(result?.steps?.[0]?.text).toBe('Head north on Broadway');
});
```

### 6d. Un-quarantine plan for test 2 (timeout RED CONTRACT)

`tests/unit/route-adapter-real.spec.ts` test 2 (`test.skip`) expects:
```ts
expect(error).toEqual({ name: 'ProviderTimeoutError', code: 'TIMEOUT' });
```

To un-skip:
1. Proxy must be live and wired to `ROUTE_PROVIDER=/api/route`
2. Test must route `**/api/route` to abort: `await page.route('**/api/route', (route) => route.abort('failed'));`
3. Update the `page.route` pattern from `'**/directions'` to `'**/api/route'`
4. Remove `test.skip` → run as part of green gate

### 6e. GREEN Gate Checklist for Implementation Slice

When the proxy slice is implemented, run:

```powershell
# 1. Type check (no new type errors)
npm run typecheck

# 2. Unit tests including fixture-backed route adapter tests
npx playwright test tests/unit/route-adapter-real.spec.ts --reporter=list

# 3. E2e smoke — route UI still works on mock
npx playwright test tests/e2e/route-ui.spec.ts --reporter=list

# 4. Full e2e suite
npm run e2e:auto

# 5. Dead-wiring verification: confirm ROUTE_PROVIDER=mock still works
# (no env override → mock path → test suite unchanged)
```

**Expected outcomes:**
- `npm run typecheck` → 0 errors
- `route-adapter-real.spec.ts` test 1 → PASS (fixture intercept still works for `/api/route`)
- `route-adapter-real.spec.ts` test 2 → PASS (after un-skip, with pattern update)
- `route-ui.spec.ts` → PASS (buildRoute output unchanged)
- `npm run e2e:auto` → all previously passing tests still pass

---

## 7. Implementation Slice Summary (Deferred — Reference)

This section documents what code must change when the proxy slice is implemented. **No code changes in this document.**

| File | Change | Notes |
|---|---|---|
| `apps/web-mvc/Program.cs` | Add `POST /api/route` endpoint | Validate input, call Google v2, convert `staticDuration` to `duration.{seconds,text}`, return JSON |
| `GOOGLE_ROUTES_API_KEY` / user-secrets | Add secret | Never in committed files |
| `ROUTE_PROVIDER` env/launchSettings | Set to `/api/route` for live-mode dev | Defaults to `mock`; no code change needed |
| `tests/fixtures/route/provider-proxy-normalized.json` | Create | Proxy-normalized fixture for new unit tests |
| `tests/unit/route-adapter-real.spec.ts` test 2 | Un-skip + update route pattern | From `**/directions` → `**/api/route` |
| `apps/web-mvc/wwwroot/js/adapters.js` | **No change** | `normalizeRoutePayload` already handles proxy output shape |

---

## 8. Official Citation Index

| Topic | URL |
|---|---|
| `computeRoutes` endpoint + required headers | https://developers.google.com/maps/documentation/routes/reference/rest/v2/TopLevel/computeRoutes |
| FieldMask field selection | https://developers.google.com/maps/documentation/routes/choose_fields |
| `staticDuration` / `localizedValues` response fields | https://developers.google.com/maps/documentation/routes/reference/rest/v2/TopLevel/computeRoutes |
| Pricing (Essentials/Pro SKUs, free caps) | https://developers.google.com/maps/billing/gmp-billing |
| Usage and billing | https://developers.google.com/maps/documentation/routes/usage-and-billing |
| API key setup | https://developers.google.com/maps/documentation/routes/cloud-setup |

Pricing facts verified in R-045 Section 7b-A (2026-03-05):
- Essentials: first 10k/month free; then $5.00/$4.00/$3.00/$1.50/$0.38 per 1k
- Pro: first 5k/month free; then $10.00/$8.00/$6.00/$3.00/$0.75 per 1k

---

## 9. Evidence Provenance

| Claim | Source |
|---|---|
| `parseDuration` reads `duration.seconds/value/text` not `staticDuration` | `adapters.js` L160–170 (read 2026-03-05) |
| `isRateLimitError` checks `error.status === 429` | `adapters.js` L350 |
| `ProviderTimeoutError` shape `{ name, code: 'TIMEOUT' }` | `adapters.js` L24–27 |
| `handleAdapterFailure` called on timeout | `route-bootstrap.js` L571–576 |
| Fixture interceptor matches `computeroutes` | `tests/helpers/provider-fixtures.ts` L13 |
| Both existing fixtures use `duration: { text: "..." }` | `provider-union-to-bryant.json`, `provider-steps-only.json` (read 2026-03-05) |
| No `staticDuration` in any tracked file | `Select-String` across all tracked files → 0 results |
| `ROUTE_PROVIDER` defaults to `mock` | `.env.example` L14; `ProviderConfig.cs` L23 |
| test 2 is `test.skip` with pattern `**/directions` | `tests/unit/route-adapter-real.spec.ts` L33–55 |
| `[data-testid="route-msg"]` location | `home.inline.html` L43 |
