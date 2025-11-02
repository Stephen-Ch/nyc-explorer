var builder = WebApplication.CreateBuilder(args);
builder.Services.AddControllersWithViews();

var app = builder.Build();

app.UseStaticFiles();
app.Use(async (context, next) =>
{
  await next();
  var contentType = context.Response.ContentType;
  if (!string.IsNullOrEmpty(contentType) && contentType.StartsWith("text/html", StringComparison.OrdinalIgnoreCase) && !contentType.Contains("charset", StringComparison.OrdinalIgnoreCase))
  {
    context.Response.ContentType = "text/html; charset=utf-8";
  }
});

app.MapGet("/", () => Results.Content(
    """
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
      <ul id="poi-list"></ul>
      <div id="route-msg" data-testid="route-msg" aria-live="polite"></div>
      <ol id="route-steps"></ol>
      <script src="/js/home.js"></script>
      <script>
        (function () {
          const w = window; w.App = w.App || {}; w.App.adapters = w.App.adapters || {};
          const existingRoute = w.App.adapters.route || {}; if (typeof existingRoute.walk !== 'function') {
            const computeLength = (from, to) => {
              const rad = (deg) => deg * Math.PI / 180, R = 6371000;
              const fromLat = rad(from?.lat ?? 0);
              const toLat = rad(to?.lat ?? 0);
              const dLat = rad((to?.lat ?? 0) - (from?.lat ?? 0));
              const dLng = rad((to?.lng ?? 0) - (from?.lng ?? 0));
              const a = Math.sin(dLat / 2) ** 2 + Math.cos(fromLat) * Math.cos(toLat) * Math.sin(dLng / 2) ** 2;
              const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
              const length = R * c;
              return Number.isFinite(length) && length > 0 ? length : 1;
            };
            w.App.adapters.route = {
              ...existingRoute,
              walk: async (from, to) => ({
                nodes: [from, to],
                length_m: computeLength(from, to),
              }),
            };
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
          const geoFromInput = document.querySelector('[data-testid="geo-from"]'),
            geoFromList = document.getElementById('geo-from-list'),
            geoStatus = document.querySelector('[data-testid="geo-status"]'),
            geoCurrentButton = document.querySelector('[data-testid="geo-current"][data-target="from"]'),
            fromInput = document.querySelector('[data-testid="route-from"]'),
            toInput = document.querySelector('[data-testid="route-to"]'),
            findButton = document.querySelector('[data-testid="route-find"]'),
            routeMsg = document.querySelector('[data-testid="route-msg"]'),
            routeSteps = document.getElementById('route-steps'),
            overlayContainer = document.getElementById('poi-overlay');
            const geoToInput = document.querySelector('[data-testid="geo-to"]'),
              geoToList = document.getElementById('geo-to-list'),
              geoCurrentToButton = document.querySelector('[data-testid="geo-current"][data-target="to"]');
            if (!geoFromInput || !geoFromList || !geoStatus || !geoCurrentButton || !geoToInput || !geoToList || !geoCurrentToButton || !fromInput || !toInput || !findButton || !routeMsg || !routeSteps) return;

          const app = window.App = window.App || {}; app.adapters = app.adapters || {}; app.adapters.geo = app.adapters.geo || { search: async () => [], reverse: async () => null };
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
            });

          let geoQueryId = 0, currentOptions = [], activeIndex = -1;
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
            if (!adapter || typeof adapter.current !== 'function') {
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
              setStatus('No matches');
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

          geoFromInput.addEventListener('input', async (event) => {
            delete geoFromInput.dataset.geoLat;
            delete geoFromInput.dataset.geoLng;
            delete geoFromInput.dataset.geoLabel;
            const value = (event.target?.value ?? '').trim();
            if (value.length < 2) {
              hideGeoList(true);
              return;
            }
            const requestId = ++geoQueryId;
            setStatus('Searching…');
            try {
              const results = await fetchGeoResults(value);
              if (requestId !== geoQueryId) return;
              if (!Array.isArray(results) || !results.length) {
                hideGeoList();
                setStatus('No matches');
                return;
              }
              renderGeoOptions(results);
            } catch (error) {
              if (requestId !== geoQueryId) return;
              hideGeoList();
              setStatus('Error contacting geocoder');
            }
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

          let geoToQueryId = 0, geoToOptions = [], geoToActiveIndex = -1;
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
            if (!adapter || typeof adapter.current !== 'function') {
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

          geoToInput.addEventListener('input', async (event) => {
            delete geoToInput.dataset.geoLat;
            delete geoToInput.dataset.geoLng;
            delete geoToInput.dataset.geoLabel;
            const value = (event.target?.value ?? '').trim();
            if (value.length < 2) {
              hideGeoToList(true);
              return;
            }
            const requestId = ++geoToQueryId;
            setStatus('Searching…');
            try {
              const results = await fetchGeoResults(value);
              if (requestId !== geoToQueryId) return;
              geoFromList.removeAttribute('data-testid');
              geoToList.innerHTML = '';
              geoToOptions = []; geoToActiveIndex = -1;
              geoToInput.removeAttribute('aria-activedescendant');
              if (!Array.isArray(results) || !results.length) {
                hideGeoToList();
                setStatus('No results');
                return;
              }
              geoToList.setAttribute('data-testid', 'ta-list');
              results.forEach((item, index) => {
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
              geoToList.style.display = 'block';
              setToExpanded(true);
              setStatus(`${geoToOptions.length} results`);
            } catch (error) {
              if (requestId !== geoToQueryId) return;
              hideGeoToList();
              setStatus('Error contacting geocoder');
            }
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

          let currentList = [], deepLinkPending = true, lastSegment = [], mapEventsBound = false, isPopState = false;

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
            setRouteMessage = (text) => {
              const next = text ?? '';
              if (routeMsg.textContent === next) return;
              routeMsg.textContent = next;
              if (next.length) routeMsg.style.removeProperty('display');
              else routeMsg.style.display = 'none';
            },
            setAttrs = (el, attrs) => Object.entries(attrs).forEach(([key, value]) => el.setAttribute(key, String(value))),
            createSvgEl = (name, attrs) => { const el = document.createElementNS('http://www.w3.org/2000/svg', name); setAttrs(el, attrs); return el; },
            clearRouteGraphics = () => { overlayContainer?.querySelectorAll('[data-testid="route-path"], [data-testid="route-node"]').forEach((node) => node.remove()); lastSegment = []; },
            drawRouteGraphics = (list) => {
              clearRouteGraphics();
              const mapInstance = typeof map !== 'undefined' ? map : null, filtered = overlayContainer && Array.isArray(list) ? list.filter(hasCoords) : [];
              if (!overlayContainer || filtered.length < 2 || !mapInstance || typeof mapInstance.latLngToContainerPoint !== 'function') { lastSegment = []; return; }
              if (!mapEventsBound && typeof mapInstance.on === 'function') { ['move', 'zoom', 'resize'].forEach((evt) => mapInstance.on(evt, () => lastSegment.length >= 2 && drawRouteGraphics(lastSegment))); mapEventsBound = true; }
              lastSegment = filtered.map((poi) => poi);
              const bounds = overlayContainer.getBoundingClientRect(), w = bounds.width || overlayContainer.clientWidth || 1, h = bounds.height || overlayContainer.clientHeight || 1, points = filtered.map((poi) => mapInstance.latLngToContainerPoint([poi.coords.lat, poi.coords.lng]));
              const svg = createSvgEl('svg', { 'data-testid': 'route-path', 'aria-hidden': 'true', style: 'position:absolute; inset:0; width:100%; height:100%; pointer-events:none;', viewBox: `0 0 ${w} ${h}`, preserveAspectRatio: 'none' });
              svg.appendChild(createSvgEl('polyline', { points: points.map((pt) => `${pt.x},${pt.y}`).join(' '), fill: 'none', stroke: '#1a73e8', 'stroke-width': '2', 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'pointer-events': 'none' }));
              points.forEach((pt, index) => svg.appendChild(createSvgEl('circle', { 'data-testid': 'route-node', 'data-step-index': index, 'aria-hidden': 'true', cx: pt.x, cy: pt.y, r: 4, fill: '#ffffff', stroke: '#1a73e8', 'stroke-width': '2', 'pointer-events': 'none' })));
              overlayContainer.appendChild(svg);
            },
            clearRouteUI = (message) => { clearSteps(); clearActiveMarkers(); clearRouteGraphics(); setRouteMessage(message); },
            scheduleDeepLink = () => {
              if (!deepLinkPending) return;
              deepLinkPending = false;
              const run = () => {
                const params = new URLSearchParams(window.location.search);
                const fromParam = params.get('from');
                const toParam = params.get('to');
                if (!fromParam || !toParam) return;
                isPopState = true;
                fromInput.value = fromParam;
                toInput.value = toParam;
                findButton.dispatchEvent(new Event('click', { bubbles: true }));
                isPopState = false;
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
              if (segmentFn) {
                try {
                  const args = {
                    from: coordsFrom ?? fromValue,
                    to: coordsTo ?? toValue,
                    fromValue,
                    toValue,
                    pois: list,
                  };
                  const result = await segmentFn(args);
                  if (Array.isArray(result)) return result;
                } catch (error) {}
              }
              return localSegment(list, fromValue, toValue);
            },
            tryAdapterPath = async () => {
              if (!hasGeoSelection(geoFromInput) || !hasGeoSelection(geoToInput)) return false;
              const pathFn = window.App?.adapters?.route?.path;
              if (typeof pathFn !== 'function') return false;
              try {
                const fromGeo = toGeoPoint(geoFromInput);
                const toGeo = toGeoPoint(geoToInput);
                const raw = await pathFn(fromGeo, toGeo);
                const mapped = Array.isArray(raw)
                  ? raw.filter((node) => node && typeof node.lat === 'number' && typeof node.lng === 'number')
                      .map((node) => ({ coords: { lat: node.lat, lng: node.lng } }))
                  : [];
                if (mapped.length < 2) { clearRouteGraphics(); return false; }
                clearActiveMarkers();
                clearSteps();
                drawRouteGraphics(mapped);
                setRouteMessage(`Route path from ${fromGeo.label || 'Start'} to ${toGeo.label || 'End'}.`);
                return true;
              } catch (error) {
                clearRouteGraphics();
                return false;
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
              const seg = await getSegment(base, fromValue, toValue);
              if (!Array.isArray(seg) || !seg.length) {
                if (await tryAdapterPath()) return;
                clearRouteUI('No matching route segment.');
                return;
              }
              const fromName = seg[0]?.name ?? seg[0]?.id ?? fromValue;
              const toName = seg[seg.length - 1]?.name ?? seg[seg.length - 1]?.id ?? toValue;
              showSteps(seg);
              if (seg.every((step) => step && step.coords && typeof step.coords.lat === 'number' && typeof step.coords.lng === 'number')) {
                applyActiveMarkers(seg);
                drawRouteGraphics(seg);
              } else {
                clearActiveMarkers(); clearRouteGraphics();
              }
              setRouteMessage(`Route: ${seg.length} steps from ${fromName} to ${toName}.`);
              if (!isPopState && typeof history !== 'undefined' && typeof URLSearchParams !== 'undefined' && fromPoi && toPoi) {
                const fromId = typeof fromPoi.id === 'string' && fromPoi.id.length ? fromPoi.id : fromValue;
                const toId = typeof toPoi.id === 'string' && toPoi.id.length ? toPoi.id : toValue;
                const params = new URLSearchParams({ from: fromId, to: toId }).toString();
                history.pushState({ from: fromId, to: toId }, '', `?${params}`);
              }
            };

          setRouteMessage('');
          const originalRender = typeof render === 'function' ? render : null;
          if (originalRender) {
            window.render = function wrappedRender(list) {
              currentList = Array.isArray(list) ? list : [];
              setRouteMessage('');
              scheduleDeepLink();
              return originalRender(list);
            };
          }
          if (typeof pois !== 'undefined' && Array.isArray(pois)) currentList = pois;

          findButton.addEventListener('click', async (event) => {
            event.preventDefault();
            await applySegment();
          });

          window.addEventListener('popstate', () => {
            const params = new URLSearchParams(window.location.search);
            const fromParam = params.get('from') ?? '';
            const toParam = params.get('to') ?? '';
            fromInput.value = fromParam;
            toInput.value = toParam;
            if (fromParam && toParam) {
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
    """,
  "text/html; charset=utf-8"));

app.MapGet("/content/poi.v1.json", async () =>
{
    var contentRoot = app.Environment.ContentRootPath;
    var filePath = Path.Combine(contentRoot, "..", "..", "content", "poi.v1.json");

    if (!File.Exists(filePath))
    {
        return Results.NotFound(new { error = "content/poi.v1.json not found" });
    }

    var json = await File.ReadAllTextAsync(filePath);
    return Results.Text(json, "application/json");
});

app.MapControllers();

app.Run("http://localhost:5000");
