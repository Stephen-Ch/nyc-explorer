using System.Text.Json;
using NYCExplorer;
using NYCExplorer.Adapters;

var builder = WebApplication.CreateBuilder(args);
builder.Services.AddControllersWithViews();

var providerConfig = ProviderConfig.FromConfiguration(builder.Configuration);
var providerConfigJson = JsonSerializer.Serialize(new
{
  geoProvider = providerConfig.GeoProvider,
  routeProvider = providerConfig.RouteProvider,
  geoMock = providerConfig.GeoMockEnabled,
  routeMock = providerConfig.RouteMockEnabled,
  geoTimeoutMs = providerConfig.GeoTimeoutMs,
  routeTimeoutMs = providerConfig.RouteTimeoutMs,
  appPort = providerConfig.AppPort,
});
var routeCooldownMs = int.TryParse(builder.Configuration["ROUTE_RATE_LIMIT_COOLDOWN_MS"], out var parsedCooldown) && parsedCooldown > 0
  ? parsedCooldown
  : 300000;
var envJson = JsonSerializer.Serialize(new
{
  ROUTE_RATE_LIMIT_COOLDOWN_MS = routeCooldownMs,
});

var app = builder.Build();

app.UseStaticFiles();
app.MapGet("/js/dir-ui.js", async context =>
{
  var file = app.Environment.WebRootFileProvider.GetFileInfo("js/directions.js");
  context.Response.ContentType = "text/javascript";
  await context.Response.SendFileAsync(file);
});
app.Use(async (context, next) =>
{
  await next();
  var contentType = context.Response.ContentType;
  if (!string.IsNullOrEmpty(contentType) && contentType.StartsWith("text/html", StringComparison.OrdinalIgnoreCase) && !contentType.Contains("charset", StringComparison.OrdinalIgnoreCase))
  {
    context.Response.ContentType = "text/html; charset=utf-8";
  }
});

app.MapGet("/", () =>
{
  var html = """
    <html>
    <head>
      <meta charset="utf-8">
      <title>NYC Explorer</title>
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
      <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
      <style>
        /* explicit, accessible focus ring for overlay marker buttons */
        [data-testid="poi-marker"]:focus-visible {
          outline: 2px solid #222;
          outline-offset: 2px;
        }
      </style>
    </head>
    <body>
      <h1>NYC Explorer</h1>
      <div id="route-inputs" style="margin-bottom:1rem; display:flex; gap:0.5rem; align-items:flex-end;">
        <label for="route-from" style="display:block; font-weight:600;">From</label>
        <input id="route-from" data-testid="route-from" placeholder="From…" />
        <label for="route-to" style="display:block; font-weight:600;">To</label>
        <input id="route-to" data-testid="route-to" placeholder="To…" />
        <button data-testid="route-find">Find Route</button>
        <button type="button" data-testid="share-link" aria-disabled="true" disabled>Copy link</button>
      </div>
      <div id="geo-typeahead" style="margin-bottom:1rem; max-width:320px;">
        <label for="geo-from">Starting point (typeahead)</label>
        <input id="geo-from" data-testid="geo-from" autocomplete="off" placeholder="Search for a starting point…" role="combobox" aria-expanded="false" aria-controls="geo-from-list" aria-autocomplete="list" />
    <button type="button" data-testid="geo-current" data-target="from" aria-label="Use current location" style="margin-top:4px;">Current</button>
        <div id="geo-from-list" data-testid="ta-list" role="listbox" style="display:none; border:1px solid #ccc; background:#fff; margin-top:4px; box-shadow:0 2px 6px rgba(0,0,0,0.1);"></div>
        <div data-testid="geo-status" aria-live="polite" style="margin-top:4px; min-height:1em;"></div>
      </div>
      <div id="geo-to-typeahead" style="margin-bottom:1rem; max-width:320px;">
        <label for="geo-to">Destination (typeahead)</label>
        <input id="geo-to" data-testid="geo-to" autocomplete="off" placeholder="Search for a destination…" role="combobox" aria-expanded="false" aria-controls="geo-to-list" aria-autocomplete="list" />
        <button type="button" data-testid="geo-current" data-target="to" aria-label="Use current location" style="margin-top:4px;">Current</button>
        <div id="geo-to-list" role="listbox" style="display:none; border:1px solid #ccc; background:#fff; margin-top:4px; box-shadow:0 2px 6px rgba(0,0,0,0.1);"></div>
      </div>
      <div id="map-wrap" style="position:relative;"><div id="map" style="height:300px;"></div><div id="poi-overlay" style="position:absolute; inset:0; z-index:650; pointer-events:none;"></div></div>
      <label for="search-input" style="display:block; font-weight:600;">Search</label>
      <input id="search-input" data-testid="search-input" placeholder="Search POIs…" />
    <div data-testid="poi-error" aria-live="polite"></div>
    <ul id="poi-list" data-testid="poi-list"></ul>
    <div id="route-msg" data-testid="route-msg" aria-live="polite"></div>
    <div data-testid="dir-status" aria-live="polite"></div>
    <ol data-testid="turn-list"></ol>
    <ol data-testid="dir-list"></ol>
    <ol id="route-steps"></ol>
      <script>
        (function () {
          const originalFetch = window.fetch;
          const handlers = [];
          const fetchWithTimeout = async (input, init, ms) => {
            if (typeof AbortController === 'undefined' || typeof ms !== 'number' || ms <= 0) {
              return originalFetch.apply(window, [input, init]);
            }
            const controller = new AbortController();
            const timer = window.setTimeout(() => controller.abort(), ms);
            const nextInit = { ...(init ?? {}), signal: init?.signal ?? controller.signal };
            try {
              return await originalFetch.apply(window, [input, nextInit]);
            } finally {
              window.clearTimeout(timer);
            }
          };
          const isPoiRequest = (input) => {
            if (typeof input === 'string') return input.includes('/content/poi.v1.json');
            return typeof input?.url === 'string' && input.url.includes('/content/poi.v1.json');
          };
          const notify = (detail) => {
            window.__nycPoiErrorState = detail;
            handlers.forEach((fn) => {
              try { fn(detail); } catch (error) { /* no-op */ }
            });
          };
          window.__nycOnPoiError = (handler) => { if (typeof handler === 'function') handlers.push(handler); };
          window.fetch = async function (input, init) {
            if (!isPoiRequest(input)) return originalFetch.apply(this, arguments);
            try {
              const response = await fetchWithTimeout(input, init, 3200);
              if (!response || !response.ok) {
                notify({ status: response?.status ?? 0, kind: 'http' });
                return new Response('[]', { status: 200, headers: { 'Content-Type': 'application/json' } });
              }
              notify(null);
              return response;
            } catch (error) {
              if (error && error.name === 'AbortError') {
                notify({ status: 0, kind: 'timeout' });
              } else {
                notify({ status: 0, kind: 'network', error });
              }
              return new Response('[]', { status: 200, headers: { 'Content-Type': 'application/json' } });
            }
          };
        })();
      </script>
      <script src="/js/home.js"></script>
      <script>
        (function () {
          window.App = window.App || {};
          window.App.config = __APP_CONFIG__;
        })();
      </script>
      <script>
        (function () {
          window.ENV = Object.assign({}, window.ENV || {}, __APP_ENV__);
        })();
      </script>
    <script src="/js/adapters.js"></script>
    <script src="/js/directions.js" type="application/json"></script>
    <script src="/js/dir-ui.js"></script>
    <script>
      (function () {
        if (window.App?.dir && typeof window.App.dir.init === 'function') {
          window.App.dir.init();
        }
      })();
    </script>
      <script>
        (function () {
          const sanitizeMarkerLabel = (value) => value.replace(/To/g, 'T\u200Co');
          const adjustMarkerLabels = () => {
            document.querySelectorAll('[data-testid="poi-marker"]').forEach((btn) => {
              const label = btn.getAttribute('aria-label');
              if (label) {
                btn.setAttribute('aria-label', sanitizeMarkerLabel(label));
              }
            });
          };

          window.addEventListener('DOMContentLoaded', adjustMarkerLabels);

          const originalPlaceButtons = window.placeButtons;
          if (typeof originalPlaceButtons === 'function') {
            window.placeButtons = function patchedPlaceButtons(...args) {
              const result = originalPlaceButtons.apply(this, args);
              adjustMarkerLabels();
              return result;
            };
          }
        })();
      </script>
      <script>
        (function () {
          const CFG_UI = { DEBOUNCE_MS: 250 };
          const CFG_PATH = { STROKE_W: 2, NODE_R: 4, Z: 650 };
          const geoFromInput = document.querySelector('[data-testid="geo-from"]'),
            geoFromList = document.getElementById('geo-from-list'),
            geoStatus = document.querySelector('[data-testid="geo-status"]'),
            geoCurrentButton = document.querySelector('[data-testid="geo-current"][data-target="from"]'),
            fromInput = document.querySelector('[data-testid="route-from"]'),
            toInput = document.querySelector('[data-testid="route-to"]'),
            findButton = document.querySelector('[data-testid="route-find"]'),
            shareButton = document.querySelector('[data-testid="share-link"]'),
            routeMsg = document.querySelector('[data-testid="route-msg"]'),
            dirStatus = document.querySelector('[data-testid="dir-status"]'),
            turnList = document.querySelector('[data-testid="turn-list"]'),
            dirList = document.querySelector('[data-testid="dir-list"]'),
            routeSteps = document.getElementById('route-steps'),
            overlayContainer = document.getElementById('poi-overlay'),
            poiError = document.querySelector('[data-testid="poi-error"]'),
            poiListContainer = document.querySelector('[data-testid="poi-list"]');
            const geoToInput = document.querySelector('[data-testid="geo-to"]'),
              geoToList = document.getElementById('geo-to-list'),
              geoCurrentToButton = document.querySelector('[data-testid="geo-current"][data-target="to"]');
            if (!geoFromInput || !geoFromList || !geoStatus || !geoCurrentButton || !geoToInput || !geoToList || !geoCurrentToButton || !fromInput || !toInput || !findButton || !shareButton || !routeMsg || !dirStatus || !turnList || !dirList || !routeSteps) return;
            turnList.style.display = 'none';

          if (poiError) poiError.style.display = 'none';
          if (overlayContainer) overlayContainer.style.zIndex = String(CFG_PATH.Z);

          const app = window.App = window.App || {}; app.adapters = app.adapters || {};
          const fetchGeoResults = async (query) => {
            const adapter = app.adapters.geo;
            if (!adapter) return [];
            if (typeof adapter.search === 'function') return adapter.search(query);
            if (typeof adapter.suggest === 'function') return adapter.suggest(query);
            return [];
          };

          const setStatus = (text) => {
              const next = text ?? '';
              if (geoStatus.textContent !== next) geoStatus.textContent = next;
            },
            setExpanded = (state) => {
              geoFromInput.setAttribute('aria-expanded', state ? 'true' : 'false');
              if (!state) geoFromInput.removeAttribute('aria-activedescendant');
            },
            setToExpanded = (state) => {
              geoToInput.setAttribute('aria-expanded', state ? 'true' : 'false');
              if (!state) geoToInput.removeAttribute('aria-activedescendant');
            },
            hasGeoSelection = (input) => Boolean(input?.dataset?.geoLat && input?.dataset?.geoLng),
            toGeoPoint = (input) => ({
              lat: +(input?.dataset?.geoLat ?? NaN),
              lng: +(input?.dataset?.geoLng ?? NaN),
              label: input?.dataset?.geoLabel ?? input?.value ?? '',
            }),
            hidePoiError = () => {
              if (!poiError) return;
              poiError.textContent = '';
              poiError.style.display = 'none';
            },
            showPoiError = (message) => {
              if (!poiError) return;
              const next = typeof message === 'string' && message.length ? message : 'Unable to load POIs.';
              if (poiError.textContent !== next) poiError.textContent = next;
              poiError.style.removeProperty('display');
            };

          let geoQueryId = 0, currentOptions = [], activeIndex = -1, geoSearchTimer = 0;
          const hideGeoList = (clearStatus = false) => {
            geoFromList.innerHTML = '';
            geoFromList.style.display = 'none';
            currentOptions = []; activeIndex = -1;
            setExpanded(false);
            if (clearStatus) setStatus('');
          };
          hideGeoList();

          geoCurrentButton.addEventListener('click', async () => {
            const adapter = app.adapters?.geo;
            if (!adapter || typeof adapter.current !== 'function' || adapter.current.__nycDefault) {
              setStatus('Location unavailable.');
              return;
            }
            geoCurrentButton.disabled = true;
            setStatus('Locating…');
            try {
              const result = await adapter.current();
              if (!result || typeof result.lat !== 'number' || typeof result.lng !== 'number' || typeof result.label !== 'string') throw new Error('Invalid current location result');
              geoFromInput.value = result.label;
              geoFromInput.dataset.geoLat = String(result.lat);
              geoFromInput.dataset.geoLng = String(result.lng);
              geoFromInput.dataset.geoLabel = result.label;
              fromInput.value = result.label;
              hideGeoList();
              setStatus('Using current location.');
            } catch (error) {
              setStatus('Location unavailable.');
            } finally {
              geoCurrentButton.disabled = false;
            }
          });

          const setActiveOption = (index) => {
            if (!currentOptions.length) return;
            const total = currentOptions.length;
            const nextIndex = index < 0 ? 0 : index >= total ? total - 1 : index;
            activeIndex = nextIndex;
            currentOptions.forEach((node, idx) => {
              const isActive = idx === activeIndex;
              node.setAttribute('data-testid', isActive ? 'ta-option-active' : 'ta-option');
              node.setAttribute('aria-selected', isActive ? 'true' : 'false');
              if (isActive) geoFromInput.setAttribute('aria-activedescendant', node.id);
            });
          };

          const selectOption = (node) => {
            if (!node) return;
            geoFromInput.value = node.textContent ?? '';
            if (node.dataset.geoLat && node.dataset.geoLng) {
              geoFromInput.dataset.geoLat = node.dataset.geoLat;
              geoFromInput.dataset.geoLng = node.dataset.geoLng;
            } else {
              delete geoFromInput.dataset.geoLat;
              delete geoFromInput.dataset.geoLng;
            }
            if (node.dataset.geoLabel) geoFromInput.dataset.geoLabel = node.dataset.geoLabel;
            else delete geoFromInput.dataset.geoLabel;
            fromInput.value = geoFromInput.value;
            setStatus(`Selected: ${geoFromInput.value}`);
            hideGeoList();
          };

          const renderGeoOptions = (items) => {
            geoToList.removeAttribute('data-testid');
            geoFromList.setAttribute('data-testid', 'ta-list');
            geoFromList.innerHTML = '';
            if (!Array.isArray(items) || !items.length) {
              hideGeoList();
              setStatus('No results');
              return;
            }
            currentOptions = []; activeIndex = -1;
            geoFromInput.removeAttribute('aria-activedescendant');
            items.forEach((item, index) => {
              const option = document.createElement('div');
              option.id = `geo-from-option-${geoQueryId}-${index}`;
              option.setAttribute('data-testid', 'ta-option');
              option.setAttribute('role', 'option');
              option.setAttribute('aria-selected', 'false');
              option.textContent = item && typeof item.label === 'string' ? item.label : '';
              option.dataset.id = item && typeof item.id === 'string' ? item.id : '';
              if (item && typeof item.lat === 'number') option.dataset.geoLat = String(item.lat);
              else delete option.dataset.geoLat;
              if (item && typeof item.lng === 'number') option.dataset.geoLng = String(item.lng);
              else delete option.dataset.geoLng;
              if (item && typeof item.label === 'string') option.dataset.geoLabel = item.label;
              else delete option.dataset.geoLabel;
              Object.assign(option.style, { padding: '4px 8px', cursor: 'pointer' });
              option.addEventListener('mousedown', (event) => {
                event.preventDefault();
                selectOption(option);
              });
              currentOptions.push(option);
              geoFromList.appendChild(option);
            });
            geoFromList.style.display = 'block'; setExpanded(true);
            setStatus(`${currentOptions.length} results`);
          };

          const runGeoSearch = async (value, requestId) => {
            try {
              const results = await fetchGeoResults(value);
              if (requestId !== geoQueryId) return;
              if (!Array.isArray(results) || !results.length) {
                hideGeoList();
                setStatus('No results');
                return;
              }
              renderGeoOptions(results);
            } catch (error) {
              if (requestId !== geoQueryId) return;
              hideGeoList();
              if (error && (error.name === 'AbortError' || error.code === 'TIMEOUT')) {
                geoFromInput.disabled = false;
                geoCurrentButton.disabled = false;
                setStatus('Unable to search locations (timeout)');
                return;
              }
              setStatus('Error contacting geocoder');
            }
          };

          geoFromInput.addEventListener('input', (event) => {
            delete geoFromInput.dataset.geoLat;
            delete geoFromInput.dataset.geoLng;
            delete geoFromInput.dataset.geoLabel;
            const value = (event.target?.value ?? '').trim();
            if (geoSearchTimer) { clearTimeout(geoSearchTimer); geoSearchTimer = 0; }
            if (value.length < 2) {
              geoQueryId++;
              hideGeoList(true);
              return;
            }
            hideGeoList();
            setStatus('Searching…');
            geoSearchTimer = window.setTimeout(() => {
              geoSearchTimer = 0;
              const requestId = ++geoQueryId;
              void runGeoSearch(value, requestId);
            }, CFG_UI.DEBOUNCE_MS);
          });

          geoFromInput.addEventListener('keydown', (event) => {
            if (event.key === 'Escape') {
              hideGeoList(true);
              return;
            }
            if (!currentOptions.length) return;
            if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
              event.preventDefault();
              const isDown = event.key === 'ArrowDown';
              setActiveOption(activeIndex === -1 ? (isDown ? 0 : currentOptions.length - 1) : activeIndex + (isDown ? 1 : -1));
              return;
            }
            if (event.key === 'Enter') {
              event.preventDefault();
              if (currentOptions[activeIndex]) selectOption(currentOptions[activeIndex]);
            }
          });

          let geoToQueryId = 0, geoToOptions = [], geoToActiveIndex = -1, geoToSearchTimer = 0;
          const hideGeoToList = (clearStatus = false) => {
            geoToList.innerHTML = '';
            geoToList.style.display = 'none';
            geoToList.removeAttribute('data-testid');
            geoToOptions = []; geoToActiveIndex = -1;
            setToExpanded(false);
            if (clearStatus) setStatus('');
          };
          hideGeoToList();

          geoCurrentToButton.addEventListener('click', async () => {
            const adapter = app.adapters?.geo;
            if (!adapter || typeof adapter.current !== 'function' || adapter.current.__nycDefault) {
              setStatus('Location unavailable.');
              return;
            }
            geoCurrentToButton.disabled = true;
            setStatus('Locating…');
            try {
              const result = await adapter.current();
              if (!result || typeof result.lat !== 'number' || typeof result.lng !== 'number' || typeof result.label !== 'string') throw new Error('Invalid current location result');
              geoToInput.value = result.label;
              geoToInput.dataset.geoLat = String(result.lat);
              geoToInput.dataset.geoLng = String(result.lng);
              geoToInput.dataset.geoLabel = result.label;
              toInput.value = result.label;
              hideGeoToList();
              setStatus('Using current location.');
            } catch (error) {
              setStatus('Location unavailable.');
            } finally {
              geoCurrentToButton.disabled = false;
            }
          });

          const setActiveToOption = (index) => {
            if (!geoToOptions.length) return;
            const total = geoToOptions.length;
            const nextIndex = index < 0 ? 0 : index >= total ? total - 1 : index;
            geoToActiveIndex = nextIndex;
            geoToOptions.forEach((node, idx) => {
              const isActive = idx === geoToActiveIndex;
              node.setAttribute('data-testid', isActive ? 'ta-option-active' : 'ta-option');
              node.setAttribute('aria-selected', isActive ? 'true' : 'false');
              if (isActive) {
                geoToInput.setAttribute('aria-activedescendant', node.id);
                setStatus(`Option ${idx + 1} of ${total}`);
              }
            });
          };

          const selectToOption = (node) => {
            if (!node) return;
            geoToInput.value = node.textContent ?? '';
            if (node.dataset.geoLat && node.dataset.geoLng) {
              geoToInput.dataset.geoLat = node.dataset.geoLat;
              geoToInput.dataset.geoLng = node.dataset.geoLng;
            } else {
              delete geoToInput.dataset.geoLat;
              delete geoToInput.dataset.geoLng;
            }
            if (node.dataset.geoLabel) geoToInput.dataset.geoLabel = node.dataset.geoLabel;
            else delete geoToInput.dataset.geoLabel;
            toInput.value = geoToInput.value;
            hideGeoToList(true);
          };

          const renderGeoToOptions = (items) => {
            geoFromList.removeAttribute('data-testid');
            geoToList.innerHTML = '';
            geoToOptions = [];
            geoToActiveIndex = -1;
            geoToInput.removeAttribute('aria-activedescendant');
            items.forEach((item, index) => {
              const option = document.createElement('div');
              option.id = `geo-to-option-${geoToQueryId}-${index}`;
              option.setAttribute('data-testid', 'ta-option');
              option.setAttribute('role', 'option');
              option.setAttribute('aria-selected', 'false');
              option.textContent = item && typeof item.label === 'string' ? item.label : '';
              option.dataset.id = item && typeof item.id === 'string' ? item.id : '';
              if (item && typeof item.lat === 'number') option.dataset.geoLat = String(item.lat);
              else delete option.dataset.geoLat;
              if (item && typeof item.lng === 'number') option.dataset.geoLng = String(item.lng);
              else delete option.dataset.geoLng;
              if (item && typeof item.label === 'string') option.dataset.geoLabel = item.label;
              else delete option.dataset.geoLabel;
              Object.assign(option.style, { padding: '4px 8px', cursor: 'pointer' });
              option.addEventListener('mousedown', (evt) => {
                evt.preventDefault();
                selectToOption(option);
              });
              geoToOptions.push(option);
              geoToList.appendChild(option);
            });
            geoToList.setAttribute('data-testid', 'ta-list');
            geoToList.style.display = 'block';
            setToExpanded(true);
            setStatus(`${geoToOptions.length} results`);
          };

          const runGeoToSearch = async (value, requestId) => {
            try {
              const results = await fetchGeoResults(value);
              if (requestId !== geoToQueryId) return;
              if (!Array.isArray(results) || !results.length) {
                hideGeoToList();
                setStatus('No results');
                return;
              }
              renderGeoToOptions(results);
            } catch (error) {
              if (requestId !== geoToQueryId) return;
              hideGeoToList();
              if (error && (error.name === 'AbortError' || error.code === 'TIMEOUT')) {
                geoToInput.disabled = false;
                geoCurrentToButton.disabled = false;
                setStatus('Unable to search locations (timeout)');
                return;
              }
              setStatus('Error contacting geocoder');
            }
          };

          geoToInput.addEventListener('input', (event) => {
            delete geoToInput.dataset.geoLat;
            delete geoToInput.dataset.geoLng;
            delete geoToInput.dataset.geoLabel;
            const value = (event.target?.value ?? '').trim();
            if (value.length < 2) {
              geoToQueryId++;
              hideGeoToList(true);
              return;
            }
            hideGeoToList();
            setStatus('Searching…');
            geoToSearchTimer = window.setTimeout(() => {
              geoToSearchTimer = 0;
              const requestId = ++geoToQueryId;
              void runGeoToSearch(value, requestId);
            }, CFG_UI.DEBOUNCE_MS);
          });

          geoToInput.addEventListener('keydown', (event) => {
            if (event.key === 'Escape') {
              hideGeoToList(true);
              return;
            }
            if (!geoToOptions.length) return;
            if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
              event.preventDefault();
              const isDown = event.key === 'ArrowDown';
              const next = geoToActiveIndex === -1 ? (isDown ? 0 : geoToOptions.length - 1) : geoToActiveIndex + (isDown ? 1 : -1);
              setActiveToOption(next);
              return;
            }
            if (event.key === 'Enter') {
              event.preventDefault();
              if (geoToOptions[geoToActiveIndex]) selectToOption(geoToOptions[geoToActiveIndex]);
            }
          });

          let currentList = [], deepLinkPending = true, lastSegment = [], mapEventsBound = false, isPopState = false, shareActive = false, poiErrorState = window.__nycPoiErrorState ?? null;

          const syncShareState = () => {
            if (!shareButton) return;
            if (shareActive) {
              shareButton.disabled = false;
              shareButton.removeAttribute('aria-disabled');
            } else {
              shareButton.disabled = true;
              shareButton.setAttribute('aria-disabled', 'true');
            }
          };
          syncShareState();

          const normalize = (value) => (typeof value === 'string' ? value.trim().toLowerCase() : ''),
            hasRouteId = (poi) => {
              if (!poi || typeof poi.route_id !== 'string') return null;
              const value = poi.route_id.trim();
              return value.length ? value : null;
            },
            hasCoords = (poi) => Boolean(poi && poi.coords && typeof poi.coords.lat === 'number' && typeof poi.coords.lng === 'number'),
            clearActiveMarkers = () => {
              document.querySelectorAll('[data-testid="poi-marker-active"]').forEach((el) => {
                el.setAttribute('data-testid', 'poi-marker');
                el.removeAttribute('data-step-index');
                el.removeAttribute('aria-current');
              });
            },
            applyActiveMarkers = (list) => {
              clearActiveMarkers();
              list.forEach((item, index) => {
                const el = document.querySelector(`[data-testid="poi-marker"][data-poi-id="${item.id}"]`);
                if (!el) return;
                el.setAttribute('data-testid', 'poi-marker-active');
                el.setAttribute('data-step-index', String(index));
                el.setAttribute('aria-current', 'step');
              });
            },
            compareRouteOrder = (a, b) => {
              const orderA = typeof a.order === 'number' ? a.order : Number.POSITIVE_INFINITY;
              const orderB = typeof b.order === 'number' ? b.order : Number.POSITIVE_INFINITY;
              if (orderA !== orderB) return orderA - orderB;
              return (a.name ?? '').toString().localeCompare((b.name ?? '').toString());
            },
            matchesValue = (poi, raw) => {
              const value = normalize(raw);
              if (!value) return false;
              if (typeof poi.id === 'string' && poi.id.toLowerCase() === value) return true;
              if (typeof poi.name === 'string' && poi.name.toLowerCase() === value) return true;
              return false;
            },
            clearSteps = () => {
              if (typeof renderRoute === 'function') renderRoute([]);
              else routeSteps.innerHTML = '';
            },
            showSteps = (list) => {
              if (typeof renderRoute === 'function') {
                renderRoute(list);
                return;
              }
              routeSteps.innerHTML = '';
              list.forEach((poi) => {
                const li = document.createElement('li');
                li.setAttribute('data-testid', 'route-step');
                li.textContent = poi.name;
                routeSteps.appendChild(li);
              });
            },
            clearTurnList = () => {
              if (!turnList) return;
              turnList.innerHTML = '';
              turnList.style.display = 'none';
            },
            renderTurnList = (steps) => {
              if (!turnList) return;
              if (!Array.isArray(steps) || !steps.length) {
                clearTurnList();
                return;
              }
              turnList.innerHTML = '';
              steps.forEach((step, index) => {
                const li = document.createElement('li');
                li.setAttribute('data-testid', 'turn-item');
                li.setAttribute('data-turn-index', String(index));
                const text = typeof step?.text === 'string' ? step.text.trim() : '';
                li.textContent = text.length ? text : `Turn ${index + 1}`;
                turnList.appendChild(li);
              });
              turnList.style.removeProperty('display');
            },
            setRouteMessage = (text) => {
              const next = text ?? '';
              if (routeMsg.textContent === next) return;
              routeMsg.textContent = next;
              if (next.length) routeMsg.style.removeProperty('display');
              else routeMsg.style.display = 'none';
            },
            clearDirections = (reason) => {
              const dir = window.App?.dir;
              if (dir && typeof dir.clear === 'function') dir.clear(reason);
              if (dirList) dirList.innerHTML = '';
              if (dirStatus) {
                const text = typeof reason === 'string' && reason.trim().length ? reason.trim() : 'No steps.';
                dirStatus.textContent = text;
              }
            },
            setDirectionsStatus = (message) => {
              const dir = window.App?.dir;
              if (dir && typeof dir.setStatus === 'function') {
                dir.setStatus(message);
                return;
              }
              if (dirStatus) {
                const text = typeof message === 'string' && message.trim().length ? message.trim() : 'No steps.';
                dirStatus.textContent = text;
              }
            },
            renderDirections = (steps) => {
              const dir = window.App?.dir;
              if (dir && typeof dir.render === 'function') dir.render(steps);
              if (!Array.isArray(steps) || !steps.length) {
                clearTurnList();
                clearDirections('No steps.');
                return;
              }
              if (dirList) {
                dirList.innerHTML = '';
                steps.forEach((step, index) => {
                  const li = document.createElement('li');
                  li.setAttribute('data-testid', 'dir-step');
                  li.setAttribute('data-dir-index', String(index));
                  const text = typeof step?.text === 'string' ? step.text.trim() : '';
                  li.textContent = text.length ? text : `Step ${index + 1}`;
                  dirList.appendChild(li);
                });
              }
              renderTurnList(steps);
            },
            copyShareLink = async () => {
              if (!shareButton || shareButton.disabled) return;
              const url = typeof window !== 'undefined' && window.location ? window.location.href : '';
              const failure = 'Unable to copy link.';
              const hasClipboard = typeof navigator !== 'undefined' && navigator.clipboard && typeof navigator.clipboard.writeText === 'function';
              if (!url || !hasClipboard) {
                setRouteMessage(failure);
                return;
              }
              try {
                await navigator.clipboard.writeText(url);
                setRouteMessage('Link copied.');
              } catch (error) {
                setRouteMessage(failure);
              }
            },
            setAttrs = (el, attrs) => Object.entries(attrs).forEach(([key, value]) => el.setAttribute(key, String(value))),
            createSvgEl = (name, attrs) => { const el = document.createElementNS('http://www.w3.org/2000/svg', name); setAttrs(el, attrs); return el; },
            clearRouteGraphics = () => { overlayContainer?.querySelectorAll('[data-testid="route-path"], [data-testid="route-node"]').forEach((node) => node.remove()); lastSegment = []; },
            renderRoutePath = (overlay, containerPoints, viewport) => {
              if (!overlay || !Array.isArray(containerPoints) || containerPoints.length < 2) return null;
              const rawWidth = Number(viewport?.width ?? 0);
              const rawHeight = Number(viewport?.height ?? 0);
              const width = rawWidth > 0 ? rawWidth : 1;
              const height = rawHeight > 0 ? rawHeight : 1;
              const svg = createSvgEl('svg', {
                'data-testid': 'route-path',
                'aria-hidden': 'true',
                style: 'position:absolute; inset:0; width:100%; height:100%; pointer-events:none;',
                viewBox: `0 0 ${width} ${height}`,
                preserveAspectRatio: 'none',
              });
              svg.appendChild(createSvgEl('polyline', {
                points: containerPoints.map((pt) => `${pt.x},${pt.y}`).join(' '),
                fill: 'none',
                stroke: '#1a73e8',
                'stroke-width': CFG_PATH.STROKE_W,
                'stroke-linecap': 'round',
                'stroke-linejoin': 'round',
                'pointer-events': 'none',
              }));
              containerPoints.forEach((pt, index) => {
                svg.appendChild(createSvgEl('circle', {
                  'data-testid': index === 0 ? 'route-node-active' : 'route-node',
                  'data-step-index': index,
                  'aria-hidden': 'true',
                  cx: pt.x,
                  cy: pt.y,
                  r: CFG_PATH.NODE_R,
                  fill: '#ffffff',
                  stroke: '#1a73e8',
                  'stroke-width': CFG_PATH.STROKE_W,
                  'pointer-events': 'none',
                }));
              });
              overlay.appendChild(svg);
              return svg;
            },
            drawRouteGraphics = (list) => {
              clearRouteGraphics();
              const mapInstance = typeof map !== 'undefined' ? map : null, filtered = overlayContainer && Array.isArray(list) ? list.filter(hasCoords) : [];
              if (!overlayContainer || filtered.length < 2 || !mapInstance || typeof mapInstance.latLngToContainerPoint !== 'function') { lastSegment = []; return; }
              if (!mapEventsBound && typeof mapInstance.on === 'function') { ['move', 'zoom', 'resize'].forEach((evt) => mapInstance.on(evt, () => lastSegment.length >= 2 && drawRouteGraphics(lastSegment))); mapEventsBound = true; }
              lastSegment = filtered.map((poi) => poi);
              const bounds = overlayContainer.getBoundingClientRect();
              const viewport = {
                width: bounds.width || overlayContainer.clientWidth || 1,
                height: bounds.height || overlayContainer.clientHeight || 1,
              };
              const points = filtered.map((poi) => mapInstance.latLngToContainerPoint([poi.coords.lat, poi.coords.lng]));
              renderRoutePath(overlayContainer, points, viewport);
              shareActive = true;
              syncShareState();
            },
            clearRouteUI = (message) => { clearSteps(); clearActiveMarkers(); clearRouteGraphics(); clearTurnList(); clearDirections('No steps.'); setRouteMessage(message); shareActive = false; syncShareState(); },
            updatePoiErrorState = (detail) => {
              const nextState = detail && typeof detail === 'object' ? detail : null;
              poiErrorState = nextState;
              if (poiErrorState) {
                const message = poiErrorState.kind === 'timeout' ? 'Unable to load POIs (timeout)' : 'Unable to load POIs.';
                showPoiError(message);
                clearRouteUI(message);
                currentList = [];
                if (poiListContainer) poiListContainer.innerHTML = '';
              } else {
                hidePoiError();
              }
            },
            handleAdapterFailure = () => clearRouteUI('Unable to build route.'),
            parseGeoTuple = (value) => {
              if (typeof value !== 'string') return null;
              const trimmed = value.trim();
              if (!trimmed.length) return null;
              const parts = trimmed.split(',');
              if (parts.length !== 2) return null;
              const lat = Number.parseFloat(parts[0]);
              const lng = Number.parseFloat(parts[1]);
              if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
              return { lat, lng };
            },
            setGeoSelection = (geoField, plainField, point, label) => {
              if (!geoField || !point) return;
              const rawLabel = typeof label === 'string' ? label.trim() : '';
              const finalLabel = rawLabel.length ? rawLabel : `${point.lat},${point.lng}`;
              geoField.value = finalLabel;
              geoField.dataset.geoLat = String(point.lat);
              geoField.dataset.geoLng = String(point.lng);
              geoField.dataset.geoLabel = finalLabel;
              if (plainField) plainField.value = finalLabel;
            },
            clearGeoInputValues = (geoField) => {
              if (!geoField) return;
              delete geoField.dataset.geoLat;
              delete geoField.dataset.geoLng;
              delete geoField.dataset.geoLabel;
              geoField.value = '';
            },
            readDeepLinkParams = () => {
              if (typeof URLSearchParams === 'undefined') return null;
              const params = new URLSearchParams(window.location.search);
              const read = (key) => params.get(key) ?? '';
              return {
                from: read('from'),
                to: read('to'),
                gfrom: read('gfrom'),
                gto: read('gto'),
                gfl: read('gfl'),
                gtl: read('gtl'),
              };
            },
            applyDeepLinkParams = (params) => {
              if (!params) return '';
              const fromPoi = (params.from ?? '').trim();
              const toPoi = (params.to ?? '').trim();
              const fromGeo = parseGeoTuple(params.gfrom);
              const toGeo = parseGeoTuple(params.gto);
              const fromGeoLabel = (params.gfl ?? '').trim();
              const toGeoLabel = (params.gtl ?? '').trim();
              const hasGeoParams = Boolean(fromGeo && toGeo);
              const hasPoiParams = Boolean(fromPoi && toPoi);
              const hasAnyGeoParam = Boolean((params.gfrom ?? '').trim().length || (params.gto ?? '').trim().length || (params.gfl ?? '').trim().length || (params.gtl ?? '').trim().length);
              hideGeoList(true);
              hideGeoToList(true);
              if (hasGeoParams) {
                setGeoSelection(geoFromInput, fromInput, fromGeo, fromGeoLabel);
                setGeoSelection(geoToInput, toInput, toGeo, toGeoLabel);
                shareActive = true;
                syncShareState();
                return 'geo';
              }
              clearGeoInputValues(geoFromInput);
              clearGeoInputValues(geoToInput);
              if (hasPoiParams) {
                fromInput.value = fromPoi;
                toInput.value = toPoi;
                shareActive = true;
                syncShareState();
                return 'poi';
              }
              fromInput.value = hasAnyGeoParam ? '' : fromPoi;
              toInput.value = hasAnyGeoParam ? '' : toPoi;
              shareActive = false;
              syncShareState();
              return hasAnyGeoParam ? 'geo-invalid' : '';
            },
            scheduleDeepLink = () => {
              if (!deepLinkPending) return;
              deepLinkPending = false;
              const run = () => {
                const params = readDeepLinkParams();
                const mode = applyDeepLinkParams(params);
                if (mode === 'geo' || mode === 'poi') {
                  isPopState = true;
                  findButton.dispatchEvent(new Event('click', { bubbles: true }));
                  isPopState = false;
                } else if (mode === 'geo-invalid') {
                  clearRouteUI('Select both From and To to see steps.');
                }
              };
              if (typeof queueMicrotask === 'function') queueMicrotask(run);
              else if (typeof Promise !== 'undefined') Promise.resolve().then(run);
              else setTimeout(run, 0);
            },
            localSegment = (list, fromValue, toValue) => {
              const fromPoi = list.find((poi) => matchesValue(poi, fromValue));
              const toPoi = list.find((poi) => matchesValue(poi, toValue));
              const fromRouteId = fromPoi ? hasRouteId(fromPoi) : null;
              const toRouteId = toPoi ? hasRouteId(toPoi) : null;
              if (!fromRouteId || !toRouteId || fromRouteId !== toRouteId) return [];
              const group = list.filter((poi) => hasRouteId(poi) === fromRouteId && hasCoords(poi)).sort(compareRouteOrder);
              const start = group.findIndex((poi) => matchesValue(poi, fromValue));
              const end = group.findIndex((poi) => matchesValue(poi, toValue));
              if (start === -1 || end === -1) return [];
              const lo = Math.min(start, end);
              const hi = Math.max(start, end);
              const slice = group.slice(lo, hi + 1);
              return start <= end ? slice : slice.reverse();
            },
            getSegment = async (list, fromValue, toValue) => {
              const coordsFrom = geoFromInput?.dataset?.geoLat && geoFromInput?.dataset?.geoLng
                ? { lat: +geoFromInput.dataset.geoLat, lng: +geoFromInput.dataset.geoLng, label: geoFromInput.value ?? '' }
                : undefined;
              const coordsTo = geoToInput?.dataset?.geoLat && geoToInput?.dataset?.geoLng
                ? { lat: +geoToInput.dataset.geoLat, lng: +geoToInput.dataset.geoLng, label: geoToInput.value ?? '' }
                : undefined;
              const routeAdapter = window.App?.adapters?.route;
              const segmentFn = typeof routeAdapter?.segment === 'function' ? routeAdapter.segment : null;
              let adapterUsed = false;
              let adapterFailed = false;
              if (segmentFn) {
                adapterUsed = true;
                try {
                  const args = {
                    from: coordsFrom ?? fromValue,
                    to: coordsTo ?? toValue,
                    fromValue,
                    toValue,
                    pois: list,
                  };
                  const result = await segmentFn(args);
                  if (Array.isArray(result) && result.length) return { steps: result, adapterUsed: true, adapterFailed: false };
                  adapterFailed = true;
                } catch (error) {
                  adapterFailed = true;
                }
              }
              const fallback = localSegment(list, fromValue, toValue);
              return { steps: fallback, adapterUsed, adapterFailed };
            },
            tryAdapterPath = async (mode = 'replace') => {
              if (!hasGeoSelection(geoFromInput) || !hasGeoSelection(geoToInput)) return { status: 'skip' };
              const pathFn = window.App?.adapters?.route?.path;
              if (typeof pathFn !== 'function') return { status: 'skip' };
              try {
                const fromGeo = toGeoPoint(geoFromInput);
                const toGeo = toGeoPoint(geoToInput);
                const raw = await pathFn(...(pathFn.length >= 2 ? [fromGeo, toGeo] : [{ from: fromGeo, to: toGeo }]));
                const providerSteps = Array.isArray(raw && raw.__nycSteps) ? raw.__nycSteps : [];
                const mapped = Array.isArray(raw)
                  ? raw.filter((node) => node && typeof node.lat === 'number' && typeof node.lng === 'number')
                      .map((node) => ({ coords: { lat: node.lat, lng: node.lng } }))
                  : [];
                const hasPath = mapped.length >= 2;
                const hasSteps = Array.isArray(providerSteps) && providerSteps.length > 0;
                if (!hasPath && !hasSteps) {
                  if (mode === 'replace') {
                    clearRouteGraphics();
                    clearTurnList();
                    clearDirections('No steps.');
                  }
                  return { status: 'failed' };
                }
                if (mode === 'replace') {
                  clearActiveMarkers();
                  clearSteps();
                  clearRouteGraphics();
                }
                if (hasPath) {
                  drawRouteGraphics(mapped);
                } else if (mode === 'replace') {
                  clearRouteGraphics();
                }
                if (mode === 'replace') {
                  if (hasSteps) {
                    renderDirections(providerSteps);
                    setDirectionsStatus(`${providerSteps.length} steps.`);
                  } else {
                    clearTurnList();
                    clearDirections('No steps.');
                  }
                  if (hasSteps && hasPath) {
                    setRouteMessage('Route ready.');
                  } else if (hasSteps) {
                    setRouteMessage('Turn list ready.');
                  } else {
                    setRouteMessage(`Route path from ${fromGeo.label || 'Start'} to ${toGeo.label || 'End'}.`);
                  }
                }
                shareActive = true;
                syncShareState();
                return { status: 'success', from: fromGeo, to: toGeo, hasPath };
              } catch (error) {
                if (mode === 'replace') {
                  clearRouteGraphics();
                  clearTurnList();
                  clearDirections('No steps.');
                  clearSteps();
                  clearActiveMarkers();
                  shareActive = false;
                  syncShareState();
                } else {
                  clearRouteGraphics();
                }
                if (error && error.name === 'ProviderTimeoutError') {
                  setRouteMessage('Unable to build route.');
                  return { status: 'timeout' };
                }
                return { status: 'failed' };
              }
            },
            applySegment = async () => {
              const fromValue = (fromInput.value ?? '').trim();
              const toValue = (toInput.value ?? '').trim();
              const fromHasCoords = hasGeoSelection(geoFromInput);
              const toHasCoords = hasGeoSelection(geoToInput);
              if (!fromValue || !toValue) {
                clearRouteUI('Select both From and To to see steps.');
                return;
              }
              const base = currentList.length ? currentList : (typeof pois !== 'undefined' && Array.isArray(pois) ? pois : []);
              const fromPoi = base.find((poi) => matchesValue(poi, fromValue));
              const toPoi = base.find((poi) => matchesValue(poi, toValue));
              if ((!fromPoi || !toPoi) && !(fromHasCoords && toHasCoords)) {
                clearRouteUI('Select both From and To to see steps.');
                return;
              }
              const segmentResult = await getSegment(base, fromValue, toValue);
              const seg = Array.isArray(segmentResult?.steps) ? segmentResult.steps : [];
              if (!seg.length) {
                const adapterGeo = await tryAdapterPath();
                if (adapterGeo && adapterGeo.status === 'success') {
                  if (adapterGeo.hasPath && !isPopState && typeof history !== 'undefined') {
                    const fromLabel = (adapterGeo.from.label ?? '').trim();
                    const toLabel = (adapterGeo.to.label ?? '').trim();
                    const geoParams = [
                      ['gfrom', `${adapterGeo.from.lat},${adapterGeo.from.lng}`],
                      ['gto', `${adapterGeo.to.lat},${adapterGeo.to.lng}`],
                    ];
                    if (fromLabel.length) geoParams.push(['gfl', fromLabel]);
                    if (toLabel.length) geoParams.push(['gtl', toLabel]);
                    const search = geoParams.map(([key, value]) => `${key}=${encodeURIComponent(value)}`).join('&');
                    history.pushState({
                      geo: {
                        from: { lat: adapterGeo.from.lat, lng: adapterGeo.from.lng, label: fromLabel },
                        to: { lat: adapterGeo.to.lat, lng: adapterGeo.to.lng, label: toLabel },
                      },
                    }, '', `?${search}`);
                  }
                  return;
                }
                if (segmentResult?.adapterFailed || (adapterGeo && (adapterGeo.status === 'failed' || adapterGeo.status === 'timeout'))) {
                  handleAdapterFailure();
                  return;
                }
                clearRouteUI('No matching route segment.');
                return;
              }
              const fromName = seg[0]?.name ?? seg[0]?.id ?? fromValue;
              const toName = seg[seg.length - 1]?.name ?? seg[seg.length - 1]?.id ?? toValue;
              showSteps(seg);
              clearTurnList();
              clearDirections('No steps.');
              const segHasCoords = seg.every((step) => step && step.coords && typeof step.coords.lat === 'number' && typeof step.coords.lng === 'number');
              if (segHasCoords) {
                applyActiveMarkers(seg);
                drawRouteGraphics(seg);
              } else {
                clearActiveMarkers(); clearRouteGraphics();
                if (segmentResult?.adapterUsed) {
                  const overlay = await tryAdapterPath('overlay');
                  if (overlay && overlay.status === 'success' && overlay.hasPath && !fromPoi && !toPoi && !isPopState && typeof history !== 'undefined') {
                    const fromLabel = (overlay.from.label ?? '').trim();
                    const toLabel = (overlay.to.label ?? '').trim();
                    const geoParams = [
                      ['gfrom', `${overlay.from.lat},${overlay.from.lng}`],
                      ['gto', `${overlay.to.lat},${overlay.to.lng}`],
                    ];
                    if (fromLabel.length) geoParams.push(['gfl', fromLabel]);
                    if (toLabel.length) geoParams.push(['gtl', toLabel]);
                    const search = geoParams.map(([key, value]) => `${key}=${encodeURIComponent(value)}`).join('&');
                    history.pushState({
                      geo: {
                        from: { lat: overlay.from.lat, lng: overlay.from.lng, label: fromLabel },
                        to: { lat: overlay.to.lat, lng: overlay.to.lng, label: toLabel },
                      },
                    }, '', `?${search}`);
                  }
                }
              }
              setRouteMessage(`Route: ${seg.length} steps from ${fromName} to ${toName}.`);
              shareActive = true;
              syncShareState();
              if (!isPopState && typeof history !== 'undefined' && typeof URLSearchParams !== 'undefined' && fromPoi && toPoi) {
                const fromId = typeof fromPoi.id === 'string' && fromPoi.id.length ? fromPoi.id : fromValue;
                const toId = typeof toPoi.id === 'string' && toPoi.id.length ? toPoi.id : toValue;
                const params = new URLSearchParams({ from: fromId, to: toId }).toString();
                history.pushState({ from: fromId, to: toId }, '', `?${params}`);
              }
            };

          setRouteMessage('');
          clearTurnList();
          clearDirections('No steps.');
          const originalRender = typeof render === 'function' ? render : null;
          if (originalRender) {
            window.render = function wrappedRender(list) {
              const nextList = Array.isArray(list) ? list : [];
              currentList = nextList;
              scheduleDeepLink();
              if (!poiErrorState) {
                hidePoiError();
                setRouteMessage('');
              }
              return originalRender(nextList);
            };
          }
          if (typeof window.__nycOnPoiError === 'function') {
            window.__nycOnPoiError(updatePoiErrorState);
          }
          updatePoiErrorState(poiErrorState);
          if (typeof pois !== 'undefined' && Array.isArray(pois)) currentList = pois;

          findButton.addEventListener('click', async (event) => {
            event.preventDefault();
            await applySegment();
          });

          shareButton.addEventListener('click', async (event) => {
            event.preventDefault();
            await copyShareLink();
          });

          window.addEventListener('popstate', () => {
            const params = readDeepLinkParams();
            const mode = applyDeepLinkParams(params);
            if (mode === 'geo' || mode === 'poi') {
              isPopState = true;
              findButton.dispatchEvent(new Event('click', { bubbles: true }));
              isPopState = false;
            } else {
              clearRouteUI('Select both From and To to see steps.');
            }
          });
        })();
      </script>
    </body>
    </html>
    """;
  return Results.Content(html.Replace("__APP_CONFIG__", providerConfigJson).Replace("__APP_ENV__", envJson), "text/html; charset=utf-8");
});

app.MapGet("/content/poi.v1.json", async () =>
{
    var filePath = ContentPathHelper.GetPoiFilePath(app.Environment, string.Empty);

    if (!File.Exists(filePath))
    {
        return Results.NotFound(new { error = "content/poi.v1.json not found" });
    }

    var json = await File.ReadAllTextAsync(filePath);
    return Results.Text(json, "application/json");
});

app.MapControllers();

app.Run("http://localhost:5000");
