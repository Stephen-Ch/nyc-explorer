/**
 * Adapter initialization for route and geocoding providers
 * Handles both mock and real adapters based on environment configuration
 */

(function initializeAdapters() {
  const w = window;
  w.App = w.App || {};
  w.App.adapters = w.App.adapters || {};

  // Initialize Route Adapter
  initializeRouteAdapter();
  
  // Initialize Geocoding Adapter
  initializeGeoAdapter();

  function initializeRouteAdapter() {
    let routeAdapters = w.App.adapters.route;
    const hadExistingRoute = Boolean(routeAdapters);
    
    if (!routeAdapters) routeAdapters = {};

    const routeProvider = (w.__ENV__ && w.__ENV__.ROUTE_PROVIDER) || 'mock';
    const providerAllowsMock = routeProvider === 'mock';
    const wantsMockRoute = Boolean(w.__nycMock && w.__nycMock.route === true);

    if (hadExistingRoute && routeAdapters.__nycMock === undefined) {
      routeAdapters.__nycMock = false;
    }

    if (providerAllowsMock && wantsMockRoute && (!hadExistingRoute || routeAdapters.__nycMock !== false)) {
      routeAdapters = { ...routeAdapters, ...createMockRouteEngine() };
    }

    w.App.adapters.route = routeAdapters;

    // Ensure required methods exist
    ensureRouteMethod('segment', routeAdapters);
    ensureRouteMethod('path', routeAdapters);

    // Add walk method if missing
    if (typeof routeAdapters.walk !== 'function') {
      routeAdapters.walk = createWalkMethod();
    }
  }

  function createMockRouteEngine() {
    const isPoint = (point) => point && typeof point.lat === 'number' && typeof point.lng === 'number';
    
    const clonePoint = (point) => {
      if (!isPoint(point)) return null;
      const node = { lat: Number(point.lat), lng: Number(point.lng) };
      if (typeof point.label === 'string') node.label = point.label;
      return node;
    };

    return {
      path(payload) {
        const start = clonePoint(payload?.from);
        const end = clonePoint(payload?.to);
        if (!start || !end) return [];
        const corner = { lat: start.lat, lng: end.lng };
        return [start, corner, end];
      },
      segment(payload) {
        const from = payload?.from;
        const to = payload?.to;
        if (!isPoint(from) || !isPoint(to)) return [];
        
        const startLabel = typeof from.label === 'string' && from.label.trim().length
          ? from.label
          : 'starting point';
        const endLabel = typeof to.label === 'string' && to.label.trim().length
          ? to.label
          : 'destination';
        
        return [
          `Start at ${startLabel}`,
          'Walk across the Manhattan grid',
          `Arrive at ${endLabel}`
        ];
      },
      __nycMock: true,
    };
  }

  function ensureRouteMethod(methodName, adapters) {
    if (typeof adapters[methodName] !== 'function') {
      adapters[methodName] = async function (payload) { return null; };
    } else if (adapters[methodName].length < 1) {
      const impl = adapters[methodName];
      adapters[methodName] = function (payload, ...rest) {
        return impl.apply(this, [payload, ...rest]);
      };
    }
  }

  function createWalkMethod() {
    const computeLength = (from, to) => {
      const rad = (deg) => deg * Math.PI / 180;
      const R = 6371000;
      const fromLat = rad(from?.lat ?? 0);
      const toLat = rad(to?.lat ?? 0);
      const dLat = rad((to?.lat ?? 0) - (from?.lat ?? 0));
      const dLng = rad((to?.lng ?? 0) - (from?.lng ?? 0));
      const a = Math.sin(dLat / 2) ** 2 + Math.cos(fromLat) * Math.cos(toLat) * Math.sin(dLng / 2) ** 2;
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      const length = R * c;
      return Number.isFinite(length) && length > 0 ? length : 1;
    };

    return async (from, to) => ({
      nodes: [from, to],
      length_m: computeLength(from, to),
    });
  }

  function initializeGeoAdapter() {
    const MockGeocoder = createMockGeocoder();
    MockGeocoder.__nycMock = true;

    const existingGeo = w.App.adapters.geo;
    
    if (existingGeo && existingGeo.__nycMock === undefined) {
      existingGeo.__nycMock = false;
    }

    const geoProvider = (w.__ENV__ && w.__ENV__.GEO_PROVIDER) || 'mock';
    
    if (!existingGeo || (geoProvider === 'mock' && existingGeo.__nycMock !== false)) {
      w.App.adapters.geo = MockGeocoder;
    }

    // Ensure search method has correct arity
    if (typeof w.App.adapters.geo.search === 'function' && w.App.adapters.geo.search.length < 1) {
      const searchImpl = w.App.adapters.geo.search;
      w.App.adapters.geo.search = async function (query, ...rest) {
        return searchImpl.apply(this, [query, ...rest]);
      };
    }

    // Ensure current method exists
    if (typeof w.App.adapters.geo.current !== 'function') {
      const unavailable = Object.assign(
        async () => { throw new Error('Geolocation unavailable'); },
        { __nycDefault: true }
      );
      w.App.adapters.geo.current = unavailable;
    }
  }

  function createMockGeocoder() {
    const canonical = {
      address: { label: '666 Fifth Avenue', lat: 40.7616, lng: -73.9747 },
      place: { label: 'Penn Station', lat: 40.7506, lng: -73.9935 },
      intersection: { label: '45th St & 2nd Ave', lat: 40.7526, lng: -73.9718 },
    };

    const normalize = (value) => String(value ?? '')
      .toLowerCase()
      .replace(/[.]/g, ' ')
      .replace(/&/g, ' and ')
      .replace(/\bave?\b/g, 'avenue')
      .replace(/\bav\b/g, 'avenue')
      .replace(/\bst\b/g, 'street')
      .replace(/\bblvd\b/g, 'boulevard')
      .replace(/\s+/g, ' ')
      .trim();

    const search = async function (query) {
      const norm = normalize(query);
      if (!norm.length) return [];
      
      if (norm.includes(' and ') || /\d+\s*&\s*\d+/.test(String(query ?? ''))) {
        return [canonical.intersection];
      }
      
      if (/\d/.test(norm) && (norm.includes(' street') || norm.endsWith(' street') || norm.includes(' avenue'))) {
        return [canonical.address];
      }
      
      if (norm.includes('penn') && norm.includes('station')) {
        return [canonical.place];
      }
      
      return [];
    };

    const current = async () => ({
      label: 'Current location',
      lat: 40.758,
      lng: -73.9855
    });

    const reverse = async () => null;

    return { search, current, reverse };
  }
})();
