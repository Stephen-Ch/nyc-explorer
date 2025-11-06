(function () {
  const w = window, app = w.App = w.App || {}, cfg = app.config || {};
  const pick = (value, fallback) => typeof value === 'string' && value.trim().length ? value.trim() : fallback;
  const coerceBool = (value, fallback) => (typeof value === 'boolean' ? value : fallback);
  const coercePositive = (value, fallback) => {
    const num = Number(value);
    return Number.isFinite(num) && num > 0 ? num : fallback;
  };
  const geoProvider = pick(cfg.geoProvider, 'mock');
  const routeProvider = pick(cfg.routeProvider, 'mock');
  const config = {
    geoProvider,
    routeProvider,
    geoTimeoutMs: coercePositive(cfg.geoTimeoutMs, 3200),
    routeTimeoutMs: coercePositive(cfg.routeTimeoutMs, 3200),
    geoMock: coerceBool(cfg.geoMock, geoProvider === 'mock'),
    routeMock: coerceBool(cfg.routeMock, routeProvider === 'mock'),
  };
  const env = w.ENV || {};
  const routeCooldownMs = Number.isFinite(Number(env.ROUTE_RATE_LIMIT_COOLDOWN_MS)) && Number(env.ROUTE_RATE_LIMIT_COOLDOWN_MS) > 0
    ? Number(env.ROUTE_RATE_LIMIT_COOLDOWN_MS)
    : 300000;
  let routeCooldownUntil = 0;
  const createProviderTimeoutError = () => {
    const error = new Error('Route provider timed out');
    error.name = 'ProviderTimeoutError';
    error.code = 'TIMEOUT';
    return error;
  };
  const isTimeoutLike = (error) => {
    if (!error) return false;
    if (error.name === 'AbortError' || error.code === 'TIMEOUT' || error.name === 'TimeoutError') return true;
    if (typeof error.message !== 'string') return false;
    const lower = error.message.toLowerCase();
    return lower.includes('err_failed') || lower.includes('failed to fetch') || lower.includes('timeout');
  };
  const fetchJsonWithTimeout = async (url, ms) => {
    const timeoutMs = Number(ms);
  const supportsAbort = typeof AbortController === 'function' || typeof AbortController === 'object';
  const shouldTimeout = supportsAbort && Number.isFinite(timeoutMs) && timeoutMs > 0;
    if (!shouldTimeout) {
      const direct = await fetch(url, { method: 'GET' });
      if (!direct?.ok) throw new Error('HTTP_ERROR');
      return await direct.json();
    }
    const controller = new AbortController();
    const timeoutError = new Error('timeout');
    timeoutError.name = 'AbortError';
    timeoutError.code = 'TIMEOUT';
    let timerId = 0;
    try {
      const response = await Promise.race([
        fetch(url, { method: 'GET', signal: controller.signal }),
        new Promise((_, reject) => {
          timerId = w.setTimeout(() => {
            controller.abort();
            reject(timeoutError);
          }, timeoutMs);
        }),
      ]);
      if (!response?.ok) throw new Error('HTTP_ERROR');
      return await response.json();
    } catch (error) {
      if (error && (error.name === 'AbortError' || error.code === 'TIMEOUT')) throw timeoutError;
      throw error;
    } finally {
      if (timerId) w.clearTimeout(timerId);
    }
  };
  const postJsonWithTimeout = async (url, body, ms) => {
    const timeoutMs = Number(ms);
    const supportsAbort = typeof AbortController === 'function' || typeof AbortController === 'object';
    const shouldTimeout = supportsAbort && Number.isFinite(timeoutMs) && timeoutMs > 0;
    if (!shouldTimeout) {
      const response = await fetch(url, { method: 'POST', headers: JSON_HEADERS, body });
      if (!response?.ok) {
        const httpError = new Error('HTTP_ERROR');
        httpError.status = response?.status ?? 0;
        throw httpError;
      }
      return await response.json();
    }
    const controller = new AbortController();
    const timeoutError = new Error('timeout');
    timeoutError.name = 'AbortError';
    timeoutError.code = 'TIMEOUT';
    let timerId = 0;
    try {
      const response = await Promise.race([
        fetch(url, { method: 'POST', headers: JSON_HEADERS, body, signal: controller.signal }),
        new Promise((_, reject) => {
          timerId = w.setTimeout(() => {
            controller.abort();
            reject(timeoutError);
          }, timeoutMs);
        }),
      ]);
      if (!response?.ok) {
        const httpError = new Error('HTTP_ERROR');
        httpError.status = response?.status ?? 0;
        throw httpError;
      }
      return await response.json();
    } finally {
      if (timerId) w.clearTimeout(timerId);
    }
  };
  app.adapters = app.adapters || {};
  const ensureArity = (fn) => (typeof fn === 'function' && fn.length < 1 ? function (payload, ...rest) { return fn.apply(this, [payload, ...rest]); } : fn);
  const computeLength = (from, to) => {
    const rad = (deg) => deg * Math.PI / 180, R = 6371000;
    const fromLat = rad(from?.lat ?? 0), toLat = rad(to?.lat ?? 0);
    const dLat = rad((to?.lat ?? 0) - (from?.lat ?? 0)), dLng = rad((to?.lng ?? 0) - (from?.lng ?? 0));
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(fromLat) * Math.cos(toLat) * Math.sin(dLng / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const length = R * c;
    return Number.isFinite(length) && length > 0 ? length : 1;
  };

  const toNumber = (value) => {
    const num = Number(value);
    return Number.isFinite(num) ? num : null;
  };
  const plainText = (value) => typeof value === 'string' ? value.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim() : '';
  const JSON_HEADERS = { 'Content-Type': 'application/json' };
  const normalizeGeoResults = (payload) => {
    if (!Array.isArray(payload)) return [];
    return payload
      .map((item) => {
        const label = plainText(item?.label ?? item?.name ?? '');
        const lat = toNumber(item?.lat ?? item?.latitude ?? item?.location?.lat ?? item?.location?.latitude);
        const lng = toNumber(item?.lng ?? item?.longitude ?? item?.location?.lng ?? item?.location?.longitude);
        if (!label || lat === null || lng === null) return null;
        return { label, lat, lng };
      })
      .filter(Boolean);
  };
  const clamp = (value, min, max) => Math.min(Math.max(value, min), max);
  const readNode = (node) => {
    if (!node) return null;
    const lat = toNumber(node.lat ?? node.latitude ?? node.latLng?.latitude ?? node.location?.lat ?? node.location?.latitude);
    const lng = toNumber(node.lng ?? node.longitude ?? node.latLng?.longitude ?? node.location?.lng ?? node.location?.longitude);
    if (lat === null || lng === null) return null;
    const clampedLat = clamp(lat, 40.4774, 40.9178);
    const clampedLng = clamp(lng, -74.2591, -73.7004);
    return { lat: clampedLat, lng: clampedLng };
  };
  const parseDistance = (step) => {
    const direct = toNumber(step?.distanceMeters ?? step?.distance?.meters ?? step?.distance?.value);
    if (direct !== null) return direct;
    const text = plainText(step?.distance?.text ?? '');
    const value = Number.parseFloat(text);
    if (!Number.isFinite(value)) return 0;
    const lower = text.toLowerCase();
    if (lower.includes('km')) return Math.round(value * 1000);
    if (lower.includes('mi')) return Math.round(value * 1609.34);
    if (lower.includes('ft')) return Math.round(value * 0.3048);
    return Math.round(value);
  };
  const parseDuration = (step) => {
    const direct = toNumber(step?.durationSeconds ?? step?.duration?.seconds ?? step?.duration?.value);
    if (direct !== null) return direct;
    const text = plainText(step?.duration?.text ?? '');
    const value = Number.parseFloat(text);
    if (!Number.isFinite(value)) return 0;
    const lower = text.toLowerCase();
    if (lower.includes('hour')) return Math.round(value * 3600);
    if (lower.includes('min')) return Math.round(value * 60);
    return Math.round(value);
  };
  const readStep = (step) => {
    if (!step) return null;
    const text = plainText(step.navigationInstruction?.instructions ?? step.text ?? step.instruction);
    const node = readNode(step.startLocation ?? step.origin ?? step.position ?? step);
    if (!text) return null;
    const distance = parseDistance(step);
    const duration = parseDuration(step);
    const normalized = { text, distance, duration };
    if (node) {
      normalized.lat = node.lat;
      normalized.lng = node.lng;
    }
    return normalized;
  };
  const decodePolyline = (value) => {
    if (typeof value !== 'string' || !value.length) return [];
    let index = 0, lat = 0, lng = 0;
    const coordinates = [];
    while (index < value.length) {
      let result = 0, shift = 0, byte;
      do {
        byte = value.charCodeAt(index++) - 63;
        result |= (byte & 0x1f) << shift;
        shift += 5;
      } while (byte >= 0x20);
      const deltaLat = (result & 1) ? ~(result >> 1) : (result >> 1);
      lat += deltaLat;
      result = 0;
      shift = 0;
      do {
        byte = value.charCodeAt(index++) - 63;
        result |= (byte & 0x1f) << shift;
        shift += 5;
      } while (byte >= 0x20);
      const deltaLng = (result & 1) ? ~(result >> 1) : (result >> 1);
      lng += deltaLng;
      coordinates.push({ lat: lat / 1e5, lng: lng / 1e5 });
    }
    return coordinates;
  };
  const pickRoute = (payload) => {
    if (Array.isArray(payload?.routes) && payload.routes.length) return payload.routes[0];
    return payload || {};
  };
  const collectSteps = (route) => {
    const steps = [];
    if (Array.isArray(route?.legs)) {
      route.legs.forEach((leg) => {
        if (Array.isArray(leg?.steps)) steps.push(...leg.steps);
      });
    }
    if (Array.isArray(route?.steps)) steps.push(...route.steps);
    return steps;
  };
  const normalizeRoutePayload = (payload) => {
    const route = pickRoute(payload);
    let rawPath = [];
    const polyline = route?.polyline ?? {};
    if (Array.isArray(polyline?.coordinates)) rawPath = polyline.coordinates.map((coord) => coord?.latLng ?? coord);
    else if (typeof polyline?.encodedPolyline === 'string') rawPath = decodePolyline(polyline.encodedPolyline);
    else if (Array.isArray(route?.polyline)) rawPath = route.polyline;
    else if (Array.isArray(route?.path)) rawPath = route.path;
    else if (Array.isArray(route?.points)) rawPath = route.points;
    const path = rawPath.map((node) => readNode(node?.latLng ?? node)).filter(Boolean);
    const rawSteps = collectSteps(route);
    const steps = rawSteps.map(readStep).filter(Boolean);
    return { path: path.length >= 2 ? path : [], steps };
  };

  const ensureRoute = () => {
    let route = app.adapters.route;
    const had = Boolean(route);
    if (!route) route = {};
    if (had && route.__nycMock === undefined) route.__nycMock = false;
  const allowMock = config.routeMock;
    const wantsMock = !w.__nycMock || w.__nycMock.route !== false;
    if (allowMock && wantsMock && (!had || route.__nycMock !== false)) {
      const isPoint = (pt) => pt && typeof pt.lat === 'number' && typeof pt.lng === 'number';
      const clone = (pt) => {
        if (!isPoint(pt)) return null;
        const node = { lat: Number(pt.lat), lng: Number(pt.lng) };
        if (typeof pt.label === 'string') node.label = pt.label;
        return node;
      };
      route = {
        ...route,
        path(payload) {
          const start = clone(payload?.from), end = clone(payload?.to);
          if (!start || !end) return [];
          return [start, { lat: start.lat, lng: end.lng }, end];
        },
        segment(payload) {
          const from = payload?.from, to = payload?.to;
          if (!isPoint(from) || !isPoint(to)) return [];
          const startLabel = typeof from.label === 'string' && from.label.trim().length ? from.label : 'starting point';
          const endLabel = typeof to.label === 'string' && to.label.trim().length ? to.label : 'destination';
          return [`Start at ${startLabel}`, 'Walk across the Manhattan grid', `Arrive at ${endLabel}`];
        },
        __nycMock: true,
      };
    }
    const fallbackSegment = async () => null, fallbackPath = async () => null;
    const segment = ensureArity(typeof route.segment === 'function' ? route.segment : fallbackSegment);
    let pathImpl = typeof route.path === 'function' ? route.path : fallbackPath;
    const providerUrlFromConfig = typeof config.routeProvider === 'string' ? config.routeProvider.trim() : '';
    const providerUrl = providerUrlFromConfig && providerUrlFromConfig !== 'mock' ? providerUrlFromConfig : 'https://fake-provider.example/directions';
    const shouldUseProvider = !config.routeMock || !wantsMock;
    if (shouldUseProvider) {
      const fallbackRoutePath = ensureArity(pathImpl);
      const toGeoPayload = (point) => {
        if (!point) return null;
        const lat = toNumber(point.lat);
        const lng = toNumber(point.lng);
        return lat === null || lng === null ? null : { lat, lng, label: point.label };
      };
      const clonePoint = (point) => {
        if (!point || typeof point.lat !== 'number' || typeof point.lng !== 'number') return null;
        return { lat: Number(point.lat), lng: Number(point.lng) };
      };
      const labelOr = (value, fallback) => typeof value === 'string' && value.trim().length ? value.trim() : fallback;
      const buildFallbackResult = async (from, to) => {
        let nodes = [];
        try {
          nodes = await fallbackRoutePath(from, to);
        } catch {
          nodes = [];
        }
        if (!Array.isArray(nodes) || !nodes.length) {
          const origin = clonePoint(toGeoPayload(from));
          const dest = clonePoint(toGeoPayload(to));
          if (origin && dest) {
            nodes = [origin, { lat: origin.lat, lng: dest.lng }, dest];
          } else {
            nodes = [];
          }
        }
        const cleaned = Array.isArray(nodes)
          ? nodes.map((node) => (node && typeof node.lat === 'number' && typeof node.lng === 'number'
            ? { lat: Number(node.lat), lng: Number(node.lng) }
            : null)).filter(Boolean)
          : [];
        const fromLabel = labelOr(from?.label, 'starting point');
        const toLabel = labelOr(to?.label, 'destination');
        const distance = typeof from?.lat === 'number' && typeof to?.lat === 'number' ? Math.round(computeLength(from, to)) : 0;
        const baseStep = { text: `Continue to ${toLabel}.`, distance, duration: 0 };
        if (typeof from?.lat === 'number' && typeof from?.lng === 'number') {
          baseStep.lat = from.lat;
          baseStep.lng = from.lng;
        }
        const result = cleaned.length ? cleaned : [];
        result.__nycSteps = [baseStep].map((step) => {
          const copy = { text: step.text, distance: step.distance, duration: step.duration };
          if (typeof step.lat === 'number') copy.lat = step.lat;
          if (typeof step.lng === 'number') copy.lng = step.lng;
          return copy;
        });
        return result;
      };
      const fetchProviderRouteOnce = async (origin, dest) => {
        try {
          const payload = await postJsonWithTimeout(providerUrl, JSON.stringify({
            from: { lat: origin.lat, lng: origin.lng },
            to: { lat: dest.lat, lng: dest.lng },
          }), config.routeTimeoutMs);
          const normalized = normalizeRoutePayload(payload);
          const nodes = Array.isArray(normalized.path)
            ? normalized.path.map((node) => ({ lat: node.lat, lng: node.lng }))
            : [];
          const steps = Array.isArray(normalized.steps) ? normalized.steps : [];
          if (!nodes.length && !steps.length) return null;
          const result = nodes.length ? nodes : [];
          result.__nycSteps = steps;
          return result;
        } catch (error) {
          if (isTimeoutLike(error)) throw createProviderTimeoutError();
          throw error;
        }
      };
      const isProviderTimeoutError = (error) => Boolean(error && error.name === 'ProviderTimeoutError');
      const isRateLimitError = (error) => Boolean(error && error.status === 429);
      pathImpl = async function providerRoutePath(from, to) {
        const origin = toGeoPayload(from);
        const dest = toGeoPayload(to);
        if (!origin || !dest || !providerUrl) return await buildFallbackResult(from, to);
        if (Date.now() < routeCooldownUntil) return await buildFallbackResult(from, to);
        let attempt = 0;
        while (attempt < 2) {
          attempt += 1;
          try {
            const result = await fetchProviderRouteOnce(origin, dest);
            if (result) {
              routeCooldownUntil = 0;
              return result;
            }
            return result;
          } catch (error) {
            if (isProviderTimeoutError(error)) {
              if (attempt >= 2) {
                routeCooldownUntil = Date.now() + routeCooldownMs;
                throw error;
              }
              continue;
            }
            if (isRateLimitError(error)) {
              if (attempt >= 2) {
                routeCooldownUntil = Date.now() + routeCooldownMs;
                return await buildFallbackResult(from, to);
              }
              continue;
            }
            return null;
          }
        }
        routeCooldownUntil = Date.now() + routeCooldownMs;
        return await buildFallbackResult(from, to);
      };
    }
    const path = ensureArity(pathImpl);
    route = { ...route, segment, path };
    if (typeof route.walk !== 'function') route = { ...route, walk: async (from, to) => ({ nodes: [from, to], length_m: computeLength(from, to) }) };
    app.adapters.route = route;
  };

  const ensureGeo = () => {
    let geo = app.adapters.geo;
    if (geo && geo.__nycMock === undefined) geo.__nycMock = false;
  const allowMock = config.geoMock;
    if (!geo || (allowMock && geo.__nycMock !== false)) {
      const canonical = {
        address: { label: '666 Fifth Avenue', lat: 40.7616, lng: -73.9747 },
        place: { label: 'Penn Station', lat: 40.7506, lng: -73.9935 },
        intersection: { label: '45th St & 2nd Ave', lat: 40.7526, lng: -73.9718 },
        union: { label: 'Union Square', lat: 40.7359, lng: -73.9911 },
        bryant: { label: 'Bryant Park', lat: 40.7536, lng: -73.9832 },
      };
      const normalize = (value) => String(value ?? '').toLowerCase().replace(/[.]/g, ' ').replace(/&/g, ' and ').replace(/\bave?\b|\bav\b/g, 'avenue').replace(/\bst\b/g, 'street').replace(/\bblvd\b/g, 'boulevard').replace(/\s+/g, ' ').trim();
      const search = async function (query) {
        const norm = normalize(query);
        if (!norm.length) return [];
  if (norm.includes(' and ') || /\d+\s*&\s*\d+/.test(String(query ?? ''))) return [canonical.intersection];
  if (/\d/.test(norm) && (norm.includes(' street') || norm.endsWith(' street') || norm.includes(' avenue'))) return [canonical.address];
  if (norm.includes('union') && norm.includes('square')) return [canonical.union];
  if (norm.includes('bryant') && norm.includes('park')) return [canonical.bryant];
  if (norm.includes('penn') && norm.includes('station')) return [canonical.place];
        return [];
      };
      const current = async () => ({ label: 'Current location', lat: 40.758, lng: -73.9855 });
      geo = { search, current, reverse: async () => null, __nycMock: true };
    }
  const wantsMock = Boolean(w.__nycMock && w.__nycMock.geo === true);
  const existingSearch = typeof geo.search === 'function' ? ensureArity(geo.search) : null;
  if (existingSearch) geo = { ...geo, search: existingSearch };
  const fallbackSearch = existingSearch ?? (async () => []);
  const hasCustomGeo = Boolean(geo && geo.__nycMock === false && (typeof geo.search === 'function' || typeof geo.suggest === 'function'));
    const shouldUseProvider = !hasCustomGeo && (!allowMock || !wantsMock || (typeof config.geoProvider === 'string' && config.geoProvider !== 'mock'));
    if (shouldUseProvider) {
      const realSearch = async function realGeocoderSearch(query) {
        const raw = typeof query === 'string' ? query.trim() : '';
        if (!raw) return [];
        try {
          const payload = await fetchJsonWithTimeout(`/geocode?q=${encodeURIComponent(raw)}`, config.geoTimeoutMs);
          const normalized = normalizeGeoResults(payload);
          return normalized.length ? normalized : await fallbackSearch(query);
        } catch (error) {
          if (error && (error.name === 'AbortError' || error.code === 'TIMEOUT')) throw error;
          return await fallbackSearch(query);
        }
      };
      geo = { ...geo, search: ensureArity(realSearch), __nycMock: false };
    }
    if (typeof geo.current !== 'function') geo.current = Object.assign(async () => { throw new Error('Geolocation unavailable'); }, { __nycDefault: true });
    app.adapters.geo = geo;
  };

  ensureRoute();
  ensureGeo();
  app.adapters.normalizeRoutePayload = normalizeRoutePayload;
})();
