var builder = WebApplication.CreateBuilder(args);
builder.Services.AddControllersWithViews();

var app = builder.Build();

app.UseStaticFiles();

app.MapGet("/", () => Results.Content(
    """
    <html>
    <head>
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
      <div id="route-inputs" style="margin-bottom:1rem; display:flex; gap:0.5rem;">
        <input id="route-from" data-testid="route-from" placeholder="From…" />
        <input id="route-to" data-testid="route-to" placeholder="To…" />
        <button data-testid="route-find">Find Route</button>
      </div>
      <div id="map-wrap" style="position:relative;"><div id="map" style="height:300px;"></div><div id="poi-overlay" style="position:absolute; inset:0; z-index:650; pointer-events:none;"></div></div>
      <input id="search-input" data-testid="search-input" placeholder="Search POIs…" />
      <ul id="poi-list"></ul>
      <div id="route-msg" data-testid="route-msg" aria-live="polite"></div>
      <ol id="route-steps"></ol>
      <script src="/js/home.js"></script>
      <script>
        (function () {
          const fromInput = document.querySelector('[data-testid="route-from"]'),
            toInput = document.querySelector('[data-testid="route-to"]'),
            findButton = document.querySelector('[data-testid="route-find"]'),
            routeMsg = document.querySelector('[data-testid="route-msg"]'),
            routeSteps = document.getElementById('route-steps');
          if (!fromInput || !toInput || !findButton || !routeMsg || !routeSteps) return;

          let currentList = [];
          let deepLinkPending = true;

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
            updateMessage = (text) => {
              routeMsg.textContent = text ?? '';
            },
            scheduleDeepLink = () => {
              if (!deepLinkPending) return;
              deepLinkPending = false;
              const run = () => {
                const params = new URLSearchParams(window.location.search);
                const fromParam = params.get('from');
                const toParam = params.get('to');
                if (!fromParam || !toParam) return;
                fromInput.value = fromParam;
                toInput.value = toParam;
                findButton.dispatchEvent(new Event('click', { bubbles: true }));
              };
              if (typeof queueMicrotask === 'function') queueMicrotask(run);
              else if (typeof Promise !== 'undefined') Promise.resolve().then(run);
              else setTimeout(run, 0);
            },
            segment = (list, fromValue, toValue) => {
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
            applySegment = () => {
              const base = currentList.length ? currentList : (typeof pois !== 'undefined' && Array.isArray(pois) ? pois : []);
              const seg = segment(base, fromInput.value, toInput.value);
              if (!seg.length) {
                clearSteps();
                updateMessage('No matching route segment.');
                clearActiveMarkers();
                return;
              }
              updateMessage('');
              showSteps(seg);
              applyActiveMarkers(seg);
            };

          const originalRender = typeof render === 'function' ? render : null;
          if (originalRender) {
            window.render = function wrappedRender(list) {
              currentList = Array.isArray(list) ? list : [];
              updateMessage('');
              scheduleDeepLink();
              return originalRender(list);
            };
          }
          if (typeof pois !== 'undefined' && Array.isArray(pois)) currentList = pois;

          findButton.addEventListener('click', (event) => {
            event.preventDefault();
            applySegment();
          });
        })();
      </script>
    </body>
    </html>
    """,
    "text/html"));

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
