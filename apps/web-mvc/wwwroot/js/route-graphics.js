/**
 * Route graphics rendering for map overlays
 * Handles SVG polylines and route markers
 */

const RouteGraphics = (function() {
  let lastSegment = [];
  let mapEventsBound = false;

  const setAttrs = (el, attrs) => {
    Object.entries(attrs).forEach(([key, value]) => el.setAttribute(key, String(value)));
  };

  const createSvgEl = (name, attrs) => {
    const el = document.createElementNS('http://www.w3.org/2000/svg', name);
    setAttrs(el, attrs);
    return el;
  };

  const hasCoords = (poi) => {
    return Boolean(poi && poi.coords && typeof poi.coords.lat === 'number' && typeof poi.coords.lng === 'number');
  };

  function clearRouteGraphics(overlayContainer) {
    if (!overlayContainer) return;
    
    overlayContainer
      .querySelectorAll('[data-testid="route-path"], [data-testid="route-node"]')
      .forEach((node) => node.remove());
    
    lastSegment = [];
  }

  function drawRouteGraphics(list, overlayContainer, mapInstance) {
    clearRouteGraphics(overlayContainer);

    const filtered = overlayContainer && Array.isArray(list)
      ? list.filter(hasCoords)
      : [];

    if (!overlayContainer || filtered.length < 2 || !mapInstance || typeof mapInstance.latLngToContainerPoint !== 'function') {
      lastSegment = [];
      return;
    }

    // Bind map events on first draw
    if (!mapEventsBound && typeof mapInstance.on === 'function') {
      ['move', 'zoom', 'resize'].forEach((evt) => {
        mapInstance.on(evt, () => {
          if (lastSegment.length >= 2) {
            drawRouteGraphics(lastSegment, overlayContainer, mapInstance);
          }
        });
      });
      mapEventsBound = true;
    }

    lastSegment = filtered.map((poi) => poi);

    const bounds = overlayContainer.getBoundingClientRect();
    const w = bounds.width || overlayContainer.clientWidth || 1;
    const h = bounds.height || overlayContainer.clientHeight || 1;
    const points = filtered.map((poi) =>
      mapInstance.latLngToContainerPoint([poi.coords.lat, poi.coords.lng])
    );

    const svg = createSvgEl('svg', {
      'data-testid': 'route-path',
      'aria-hidden': 'true',
      style: 'position:absolute; inset:0; width:100%; height:100%; pointer-events:none;',
      viewBox: `0 0 ${w} ${h}`,
      preserveAspectRatio: 'none'
    });

    // Add polyline
    svg.appendChild(createSvgEl('polyline', {
      points: points.map((pt) => `${pt.x},${pt.y}`).join(' '),
      fill: 'none',
      stroke: '#1a73e8',
      'stroke-width': '2',
      'stroke-linecap': 'round',
      'stroke-linejoin': 'round',
      'pointer-events': 'none'
    }));

    // Add nodes
    points.forEach((pt, index) => {
      svg.appendChild(createSvgEl('circle', {
        'data-testid': 'route-node',
        'data-step-index': index,
        'aria-hidden': 'true',
        cx: pt.x,
        cy: pt.y,
        r: 4,
        fill: '#ffffff',
        stroke: '#1a73e8',
        'stroke-width': '2',
        'pointer-events': 'none'
      }));
    });

    overlayContainer.appendChild(svg);
  }

  function clearActiveMarkers() {
    document.querySelectorAll('[data-testid="poi-marker-active"]').forEach((el) => {
      el.setAttribute('data-testid', 'poi-marker');
      el.removeAttribute('data-step-index');
      el.removeAttribute('aria-current');
    });
  }

  function applyActiveMarkers(list) {
    clearActiveMarkers();
    
    list.forEach((item, index) => {
      const el = document.querySelector(`[data-testid="poi-marker"][data-poi-id="${item.id}"]`);
      if (!el) return;
      
      el.setAttribute('data-testid', 'poi-marker-active');
      el.setAttribute('data-step-index', String(index));
      el.setAttribute('aria-current', 'step');
    });
  }

  return {
    clear: clearRouteGraphics,
    draw: drawRouteGraphics,
    clearActiveMarkers,
    applyActiveMarkers,
  };
})();
