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
  const normalizeRoutePayload = (payload) => {
    const rawPath = Array.isArray(payload?.polyline) ? payload.polyline : [];
    const path = rawPath
      .map((node) => {
        const lat = toNumber(node?.latLng?.latitude);
        const lng = toNumber(node?.latLng?.longitude);
        return lat === null || lng === null ? null : { lat, lng };
      })
      .filter(Boolean);
    const rawSteps = Array.isArray(payload?.steps) ? payload.steps : [];
    const steps = rawSteps
      .map((step) => {
        const instruction = plainText(step?.navigationInstruction?.instructions);
        const lat = toNumber(step?.startLocation?.latLng?.latitude);
        const lng = toNumber(step?.startLocation?.latLng?.longitude);
        if (!instruction || lat === null || lng === null) return null;
        return { text: instruction, lat, lng };
      })
      .filter(Boolean);
    return {
      path: path.length >= 2 ? path : [],
      steps,
      // TODO: handle encoded polyline payloads when a real provider requires it.
    };
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
    const path = ensureArity(typeof route.path === 'function' ? route.path : fallbackPath);
    route = { ...route, segment, path };
    if (typeof route.walk !== 'function') route = { ...route, walk: async (from, to) => ({ nodes: [from, to], length_m: computeLength(from, to) }) };
    app.adapters.route = route;
  };

  const ensureGeo = () => {
    let geo = app.adapters.geo;
    if (geo && geo.__nycMock === undefined) geo.__nycMock = false;
  const allowMock = config.geoMock;
    if (!geo || (allowMock && geo.__nycMock !== false)) {
      const canonical = { address: { label: '666 Fifth Avenue', lat: 40.7616, lng: -73.9747 }, place: { label: 'Penn Station', lat: 40.7506, lng: -73.9935 }, intersection: { label: '45th St & 2nd Ave', lat: 40.7526, lng: -73.9718 } };
      const normalize = (value) => String(value ?? '').toLowerCase().replace(/[.]/g, ' ').replace(/&/g, ' and ').replace(/\bave?\b|\bav\b/g, 'avenue').replace(/\bst\b/g, 'street').replace(/\bblvd\b/g, 'boulevard').replace(/\s+/g, ' ').trim();
      const search = async function (query) {
        const norm = normalize(query);
        if (!norm.length) return [];
        if (norm.includes(' and ') || /\d+\s*&\s*\d+/.test(String(query ?? ''))) return [canonical.intersection];
        if (/\d/.test(norm) && (norm.includes(' street') || norm.endsWith(' street') || norm.includes(' avenue'))) return [canonical.address];
        if (norm.includes('penn') && norm.includes('station')) return [canonical.place];
        return [];
      };
      const current = async () => ({ label: 'Current location', lat: 40.758, lng: -73.9855 });
      geo = { search, current, reverse: async () => null, __nycMock: true };
    }
    if (typeof geo.search === 'function') geo.search = ensureArity(geo.search);
    if (typeof geo.current !== 'function') geo.current = Object.assign(async () => { throw new Error('Geolocation unavailable'); }, { __nycDefault: true });
    app.adapters.geo = geo;
  };

  ensureRoute();
  ensureGeo();
  app.adapters.normalizeRoutePayload = normalizeRoutePayload;
})();
