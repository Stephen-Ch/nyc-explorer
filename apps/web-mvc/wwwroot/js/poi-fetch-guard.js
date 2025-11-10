(function () {
  // Guard POI fetch calls with a timeout and surface error state to listeners.
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
      try {
        fn(detail);
      } catch (error) {
        /* no-op */
      }
    });
  };

  window.__nycOnPoiError = (handler) => {
    if (typeof handler === 'function') handlers.push(handler);
  };

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
