/**
 * Route finding UI logic
 * Coordinates typeahead inputs with route finding functionality
 */

(function initializeRouteUI() {
  const geoFromInput = document.querySelector('[data-testid="geo-from"]');
  const geoFromList = document.getElementById('geo-from-list');
  const geoStatus = document.querySelector('[data-testid="geo-status"]');
  const geoCurrentButton = document.querySelector('[data-testid="geo-current"][data-target="from"]');
  const fromInput = document.querySelector('[data-testid="route-from"]');
  const toInput = document.querySelector('[data-testid="route-to"]');
  const findButton = document.querySelector('[data-testid="route-find"]');
  const routeMsg = document.querySelector('[data-testid="route-msg"]');
  const routeSteps = document.getElementById('route-steps');
  const overlayContainer = document.getElementById('poi-overlay');
  const geoToInput = document.querySelector('[data-testid="geo-to"]');
  const geoToList = document.getElementById('geo-to-list');
  const geoCurrentToButton = document.querySelector('[data-testid="geo-current"][data-target="to"]');

  if (!geoFromInput || !geoFromList || !geoStatus || !geoCurrentButton || 
      !geoToInput || !geoToList || !geoCurrentToButton || 
      !fromInput || !toInput || !findButton || !routeMsg || !routeSteps) {
    return;
  }

  const app = window.App || {};
  const adapter = app.adapters?.geo;

  // Initialize typeahead components
  const fromTypeahead = createTypeahead({
    input: geoFromInput,
    listbox: geoFromList,
    statusElement: geoStatus,
    currentButton: geoCurrentButton,
    linkedInput: fromInput,
    adapter: adapter,
    debounceMs: AppConfig.TYPEAHEAD_DEBOUNCE_MS,
  });

  const toTypeahead = createTypeahead({
    input: geoToInput,
    listbox: geoToList,
    statusElement: geoStatus,
    currentButton: geoCurrentToButton,
    linkedInput: toInput,
    adapter: adapter,
    debounceMs: AppConfig.TYPEAHEAD_DEBOUNCE_MS,
  });

  let currentList = [];
  let deepLinkPending = true;
  let isPopState = false;

  const setRouteMessage = (text) => {
    const next = text ?? '';
    if (routeMsg.textContent === next) return;
    routeMsg.textContent = next;
    if (next.length) {
      routeMsg.style.removeProperty('display');
    } else {
      routeMsg.style.display = 'none';
    }
  };

  const clearSteps = () => {
    if (typeof renderRoute === 'function') {
      renderRoute([]);
    } else {
      routeSteps.innerHTML = '';
    }
  };

  const showSteps = (list) => {
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
  };

  const clearRouteUI = (message) => {
    clearSteps();
    RouteGraphics.clearActiveMarkers();
    RouteGraphics.clear(overlayContainer);
    setRouteMessage(message);
  };

  const localSegment = (list, fromValue, toValue) => {
    const fromPoi = list.find((poi) => Utils.matchesValue(poi, fromValue));
    const toPoi = list.find((poi) => Utils.matchesValue(poi, toValue));
    const fromRouteId = fromPoi ? Utils.hasRouteId(fromPoi) : null;
    const toRouteId = toPoi ? Utils.hasRouteId(toPoi) : null;

    if (!fromRouteId || !toRouteId || fromRouteId !== toRouteId) {
      return [];
    }

    const group = list
      .filter((poi) => Utils.hasRouteId(poi) === fromRouteId && Utils.hasCoords(poi))
      .sort(Utils.compareRouteOrder);

    const start = group.findIndex((poi) => Utils.matchesValue(poi, fromValue));
    const end = group.findIndex((poi) => Utils.matchesValue(poi, toValue));

    if (start === -1 || end === -1) return [];

    const lo = Math.min(start, end);
    const hi = Math.max(start, end);
    const slice = group.slice(lo, hi + 1);
    return start <= end ? slice : slice.reverse();
  };

  const getSegment = async (list, fromValue, toValue) => {
    const coordsFrom = Utils.hasGeoSelection(geoFromInput)
      ? Utils.toGeoPoint(geoFromInput)
      : undefined;

    const coordsTo = Utils.hasGeoSelection(geoToInput)
      ? Utils.toGeoPoint(geoToInput)
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
      } catch (error) {
        // Fall through to local segment
      }
    }

    return localSegment(list, fromValue, toValue);
  };

  const tryAdapterPath = async () => {
    if (!Utils.hasGeoSelection(geoFromInput) || !Utils.hasGeoSelection(geoToInput)) {
      return null;
    }

    const pathFn = window.App?.adapters?.route?.path;
    if (typeof pathFn !== 'function') return null;

    try {
      const fromGeo = Utils.toGeoPoint(geoFromInput);
      const toGeo = Utils.toGeoPoint(geoToInput);
      const raw = await pathFn(fromGeo, toGeo);
      const mapped = Array.isArray(raw)
        ? raw.filter((node) => node && typeof node.lat === 'number' && typeof node.lng === 'number')
            .map((node) => ({ coords: { lat: node.lat, lng: node.lng } }))
        : [];

      if (mapped.length < 2) {
        RouteGraphics.clear(overlayContainer);
        return null;
      }

      RouteGraphics.clearActiveMarkers();
      clearSteps();
      RouteGraphics.draw(mapped, overlayContainer, map);
      setRouteMessage(`Route path from ${fromGeo.label || 'Start'} to ${toGeo.label || 'End'}.`);
      return { from: fromGeo, to: toGeo };
    } catch (error) {
      RouteGraphics.clear(overlayContainer);
      return null;
    }
  };

  const readDeepLinkParams = () => {
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
  };

  const applyDeepLinkParams = (params) => {
    if (!params) return '';

    const fromPoi = (params.from ?? '').trim();
    const toPoi = (params.to ?? '').trim();
    const fromGeo = Utils.parseGeoTuple(params.gfrom);
    const toGeo = Utils.parseGeoTuple(params.gto);
    const fromGeoLabel = (params.gfl ?? '').trim();
    const toGeoLabel = (params.gtl ?? '').trim();
    const hasGeoParams = Boolean(fromGeo && toGeo);
    const hasPoiParams = Boolean(fromPoi && toPoi);
    const hasAnyGeoParam = Boolean(
      (params.gfrom ?? '').trim().length ||
      (params.gto ?? '').trim().length ||
      (params.gfl ?? '').trim().length ||
      (params.gtl ?? '').trim().length
    );

    fromTypeahead.hide(true);
    toTypeahead.hide(true);

    if (hasGeoParams) {
      Utils.setGeoSelection(geoFromInput, fromInput, fromGeo, fromGeoLabel);
      Utils.setGeoSelection(geoToInput, toInput, toGeo, toGeoLabel);
      return 'geo';
    }

    Utils.clearGeoInputValues(geoFromInput);
    Utils.clearGeoInputValues(geoToInput);

    if (hasPoiParams) {
      fromInput.value = fromPoi;
      toInput.value = toPoi;
      return 'poi';
    }

    fromInput.value = hasAnyGeoParam ? '' : fromPoi;
    toInput.value = hasAnyGeoParam ? '' : toPoi;
    return hasAnyGeoParam ? 'geo-invalid' : '';
  };

  const scheduleDeepLink = () => {
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
        clearRouteUI(AppConfig.MESSAGES.SELECT_FROM_TO);
      }
    };

    if (typeof queueMicrotask === 'function') {
      queueMicrotask(run);
    } else if (typeof Promise !== 'undefined') {
      Promise.resolve().then(run);
    } else {
      setTimeout(run, 0);
    }
  };

  const applySegment = async () => {
    const fromValue = (fromInput.value ?? '').trim();
    const toValue = (toInput.value ?? '').trim();
    const fromHasCoords = Utils.hasGeoSelection(geoFromInput);
    const toHasCoords = Utils.hasGeoSelection(geoToInput);

    if (!fromValue || !toValue) {
      clearRouteUI(AppConfig.MESSAGES.SELECT_FROM_TO);
      return;
    }

    const base = currentList.length
      ? currentList
      : (typeof pois !== 'undefined' && Array.isArray(pois) ? pois : []);

    const fromPoi = base.find((poi) => Utils.matchesValue(poi, fromValue));
    const toPoi = base.find((poi) => Utils.matchesValue(poi, toValue));

    if ((!fromPoi || !toPoi) && !(fromHasCoords && toHasCoords)) {
      clearRouteUI(AppConfig.MESSAGES.SELECT_FROM_TO);
      return;
    }

    const seg = await getSegment(base, fromValue, toValue);

    if (!Array.isArray(seg) || !seg.length) {
      const adapterGeo = await tryAdapterPath();
      if (adapterGeo) {
        if (!isPopState && typeof history !== 'undefined') {
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
      clearRouteUI(AppConfig.MESSAGES.NO_MATCHING_ROUTE);
      return;
    }

    const fromName = seg[0]?.name ?? seg[0]?.id ?? fromValue;
    const toName = seg[seg.length - 1]?.name ?? seg[seg.length - 1]?.id ?? toValue;
    showSteps(seg);

    if (seg.every((step) => Utils.hasCoords(step))) {
      RouteGraphics.applyActiveMarkers(seg);
      RouteGraphics.draw(seg, overlayContainer, map);
    } else {
      RouteGraphics.clearActiveMarkers();
      RouteGraphics.clear(overlayContainer);
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

  if (typeof pois !== 'undefined' && Array.isArray(pois)) {
    currentList = pois;
  }

  findButton.addEventListener('click', async (event) => {
    event.preventDefault();
    await applySegment();
  });

  window.addEventListener('popstate', () => {
    const params = readDeepLinkParams();
    const mode = applyDeepLinkParams(params);
    if (mode === 'geo' || mode === 'poi') {
      isPopState = true;
      findButton.dispatchEvent(new Event('click', { bubbles: true }));
      isPopState = false;
    } else {
      clearRouteUI(AppConfig.MESSAGES.SELECT_FROM_TO);
    }
  });
})();
