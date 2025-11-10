(function () {
  const doc = window.document;
  const readMessages = () => {
    try {
      const script = doc?.getElementById('nyc-error-messages');
      if (!script) return {};
      const raw = script.textContent || script.innerText || '';
      return raw ? JSON.parse(raw) : {};
    } catch (error) {
      return {};
    }
  };
  const FALLBACK_MESSAGES = {
    locating: 'Locating…',
    usingCurrentLocation: 'Using current location.',
    locationUnavailable: 'Location unavailable.',
  };
  const messages = readMessages();
  const getMessage = (key) => {
    const value = typeof key === 'string' ? messages[key] : undefined;
    const fallback = FALLBACK_MESSAGES[key] ?? '';
    return typeof value === 'string' && value.length ? value : fallback;
  };

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
    dirList = document.querySelector('[data-testid="turn-list"]') || document.querySelector('[data-testid="dir-list"]'),
    routeSteps = document.getElementById('route-steps'),
    overlayContainer = document.getElementById('poi-overlay'),
    poiError = document.querySelector('[data-testid="poi-error"]'),
    poiListContainer = document.querySelector('[data-testid="poi-list"]');
    const geoToInput = document.querySelector('[data-testid="geo-to"]'),
      geoToList = document.getElementById('geo-to-list'),
      geoCurrentToButton = document.querySelector('[data-testid="geo-current"][data-target="to"]');
    if (!geoFromInput || !geoFromList || !geoStatus || !geoCurrentButton || !geoToInput || !geoToList || !geoCurrentToButton || !fromInput || !toInput || !findButton || !shareButton || !routeMsg || !dirStatus || !dirList || !routeSteps) return;
  
  if (poiError) poiError.style.display = 'none';
  if (overlayContainer) overlayContainer.style.zIndex = String(CFG_PATH.Z);
  
  const app = window.App = window.App || {};
  app.adapters = app.adapters || {};
  if (app.dir && typeof app.dir.init === 'function') {
    app.dir.init();
  }
  
  const typeaheadNamespace = window.NYCExplorer?.Typeahead ?? {};
  const initGeoTypeahead = typeof typeaheadNamespace.initGeoTypeahead === 'function'
    ? typeaheadNamespace.initGeoTypeahead
    : null;
  const geoTypeaheadApi = initGeoTypeahead
    ? initGeoTypeahead({
        geoFromInput,
        geoFromList,
        geoToInput,
        geoToList,
        geoStatus,
        geoCurrentButton,
        geoCurrentToButton,
        fromInput,
        toInput,
        messages: {
          locating: getMessage('locating'),
          usingCurrentLocation: getMessage('usingCurrentLocation'),
          locationUnavailable: getMessage('locationUnavailable'),
        },
      })
    : null;
  if (!geoTypeaheadApi) {
    console.error('Geo typeahead initializer missing; geo typeahead functionality is degraded.');
  }
  const setStatus = geoTypeaheadApi?.setStatus ?? ((text) => {
    if (!geoStatus) return;
    const next = text ?? '';
    if (geoStatus.textContent !== next) geoStatus.textContent = next;
  });
  const hideGeoList = geoTypeaheadApi?.hideFromList ?? ((clearStatus = false) => {
    geoFromList.innerHTML = '';
    geoFromList.style.display = 'none';
    geoFromInput.setAttribute('aria-expanded', 'false');
    geoFromInput.removeAttribute('aria-activedescendant');
    if (clearStatus) setStatus('');
  });
  const hideGeoToList = geoTypeaheadApi?.hideToList ?? ((clearStatus = false) => {
    geoToList.innerHTML = '';
    geoToList.style.display = 'none';
    geoToList.removeAttribute('data-testid');
    geoToInput.setAttribute('aria-expanded', 'false');
    geoToInput.removeAttribute('aria-activedescendant');
    if (clearStatus) setStatus('');
  });
  const hasGeoSelection = (input) => Boolean(input?.dataset?.geoLat && input?.dataset?.geoLng);
  const toGeoPoint = (input) => ({
    lat: +(input?.dataset?.geoLat ?? NaN),
    lng: +(input?.dataset?.geoLng ?? NaN),
    label: input?.dataset?.geoLabel ?? input?.value ?? '',
  });
  const hidePoiError = () => {
    if (!poiError) return;
    poiError.textContent = '';
    poiError.style.display = 'none';
  };
  const showPoiError = (message) => {
    if (!poiError) return;
    const next = typeof message === 'string' && message.length ? message : 'Unable to load POIs.';
    if (poiError.textContent !== next) poiError.textContent = next;
    poiError.style.removeProperty('display');
  };
  
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
    setRouteMessage = (text) => {
      const next = text ?? '';
      if (routeMsg.textContent === next) return;
      routeMsg.textContent = next;
      if (next.length) routeMsg.style.removeProperty('display');
      else routeMsg.style.display = 'none';
    },
    clearDirections = (reason) => {
      const dir = window.App?.dir;
      if (dir && typeof dir.clear === 'function') {
        dir.clear(reason);
        return;
      }
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
      if (dir && typeof dir.render === 'function') {
        dir.render(steps);
        return;
      }
      if (!Array.isArray(steps) || !dirList) {
        clearDirections('No steps.');
        return;
      }
      dirList.innerHTML = '';
      steps.forEach((step, index) => {
        const li = document.createElement('li');
        li.setAttribute('data-testid', 'turn-item');
        li.setAttribute('data-dir-index', String(index));
        const text = typeof step?.text === 'string' ? step.text.trim() : '';
        li.textContent = text.length ? text : `Step ${index + 1}`;
        dirList.appendChild(li);
      });
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
    clearRouteGraphics = () => { overlayContainer?.querySelectorAll('[data-testid="route-path"], [data-testid="route-node"], [data-testid="route-node-active"]').forEach((node) => node.remove()); lastSegment = []; },
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
    clearRouteUI = (message) => { clearSteps(); clearActiveMarkers(); clearRouteGraphics(); clearDirections('No steps.'); setRouteMessage(message); shareActive = false; syncShareState(); },
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
    sanitizeRouteStep = (step) => {
      if (!step || typeof step !== 'object') return null;
      const rawText = typeof step.text === 'string' ? step.text : '';
      const text = rawText.replace(/[<>]/g, '').trim();
      if (!text.length) return null;
      const entry = { text };
      const distance = Number(step.distance);
      if (Number.isFinite(distance) && distance >= 0) entry.distance = distance;
      const duration = Number(step.duration);
      if (Number.isFinite(duration) && duration >= 0) entry.duration = duration;
      if (typeof step.lat === 'number' && Number.isFinite(step.lat)) entry.lat = step.lat;
      if (typeof step.lng === 'number' && Number.isFinite(step.lng)) entry.lng = step.lng;
      if (step.active === true || step.current === true) entry.active = true;
      return entry;
    },
    toRoutePoint = (node) => {
      if (!node || typeof node !== 'object') return null;
      const lat = typeof node.lat === 'number' ? node.lat
        : typeof node.latitude === 'number' ? node.latitude
        : typeof node?.coords?.lat === 'number' ? node.coords.lat
        : null;
      const lng = typeof node.lng === 'number' ? node.lng
        : typeof node.longitude === 'number' ? node.longitude
        : typeof node?.coords?.lng === 'number' ? node.coords.lng
        : null;
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
      return { lat: Number(lat), lng: Number(lng) };
    },
    normalizeRouteResult = (raw) => {
      if (!raw) return null;
      if (Array.isArray(raw)) {
        const path = raw.map(toRoutePoint).filter(Boolean);
        const steps = Array.isArray(raw.__nycSteps) ? raw.__nycSteps.map(sanitizeRouteStep).filter(Boolean) : [];
        return { path, steps };
      }
      if (typeof raw === 'object') {
        const pathSource = Array.isArray(raw.path) ? raw.path : [];
        const stepsSource = Array.isArray(raw.steps) ? raw.steps : [];
        return {
          path: pathSource.map(toRoutePoint).filter(Boolean),
          steps: stepsSource.map(sanitizeRouteStep).filter(Boolean),
        };
      }
      return null;
    },
    pushGeoHistory = (fromGeo, toGeo) => {
      if (isPopState || typeof history === 'undefined' || typeof URLSearchParams === 'undefined') return;
      const params = new URLSearchParams();
      params.set('gfrom', `${fromGeo.lat},${fromGeo.lng}`);
      params.set('gto', `${toGeo.lat},${toGeo.lng}`);
      const fromLabel = typeof fromGeo.label === 'string' ? fromGeo.label.trim() : '';
      const toLabel = typeof toGeo.label === 'string' ? toGeo.label.trim() : '';
      if (fromLabel.length) params.set('gfl', fromLabel);
      if (toLabel.length) params.set('gtl', toLabel);
      history.pushState({
        geo: {
          from: { lat: fromGeo.lat, lng: fromGeo.lng, label: fromLabel },
          to: { lat: toGeo.lat, lng: toGeo.lng, label: toLabel },
        },
      }, '', `?${params.toString()}`);
    },
    renderProviderRoute = (routePayload, fromGeo, toGeo) => {
      const steps = Array.isArray(routePayload?.steps) ? routePayload.steps : [];
      if (steps.length) {
        const message = steps.length === 1 ? '1 step.' : `${steps.length} steps.`;
        renderDirections(steps);
        setDirectionsStatus(message);
      } else {
        clearDirections('No steps.');
      }
      clearSteps();
      clearActiveMarkers();
      const pathPoints = Array.isArray(routePayload?.path) ? routePayload.path : [];
      if (pathPoints.length > 1) {
        const overlayPoints = pathPoints.map((point, index) => ({
          coords: { lat: point.lat, lng: point.lng },
          id: `route-provider-${index}`,
        }));
        drawRouteGraphics(overlayPoints);
        setRouteMessage('Route ready.');
      } else {
        clearRouteGraphics();
        setRouteMessage(steps.length ? 'Route ready (turns only).' : 'Route ready.');
      }
      shareActive = true;
      syncShareState();
      pushGeoHistory(fromGeo, toGeo);
      return true;
    },
    attemptProviderRoute = async () => {
      if (!hasGeoSelection(geoFromInput) || !hasGeoSelection(geoToInput)) return false;
      const adapter = window.App?.adapters?.route;
      const findFn = typeof adapter?.find === 'function' ? adapter.find : null;
      const pathFn = typeof adapter?.path === 'function' ? adapter.path : null;
      if (!findFn && !pathFn) return false;
      const fromGeo = toGeoPoint(geoFromInput);
      const toGeo = toGeoPoint(geoToInput);
      if (!fromGeo || !toGeo) return false;
      try {
        const raw = findFn
          ? await (findFn.length >= 1 ? findFn({ from: fromGeo, to: toGeo }) : findFn(fromGeo, toGeo))
          : await (pathFn.length >= 2 ? pathFn(fromGeo, toGeo) : pathFn({ from: fromGeo, to: toGeo }));
        const normalized = normalizeRouteResult(raw);
        if (!normalized || (!normalized.path.length && !normalized.steps.length)) return false;
        return renderProviderRoute(normalized, fromGeo, toGeo);
      } catch (error) {
        if (error && (error.name === 'ProviderTimeoutError' || error.code === 'TIMEOUT')) {
          handleAdapterFailure();
          return true;
        }
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
      const segmentResult = await getSegment(base, fromValue, toValue);
      const seg = Array.isArray(segmentResult?.steps) ? segmentResult.steps : [];
      const providerHandled = await attemptProviderRoute();
      if (providerHandled) return;
      if (!seg.length) {
        if (segmentResult?.adapterFailed) {
          handleAdapterFailure();
          return;
        }
        clearRouteUI('No matching route segment.');
        return;
      }
      const fromName = seg[0]?.name ?? seg[0]?.id ?? fromValue;
      const toName = seg[seg.length - 1]?.name ?? seg[seg.length - 1]?.id ?? toValue;
      showSteps(seg);
      clearDirections('No steps.');
      const segHasCoords = seg.every((step) => step && step.coords && typeof step.coords.lat === 'number' && typeof step.coords.lng === 'number');
      if (segHasCoords) {
        applyActiveMarkers(seg);
        drawRouteGraphics(seg);
      } else {
        clearActiveMarkers(); clearRouteGraphics();
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
