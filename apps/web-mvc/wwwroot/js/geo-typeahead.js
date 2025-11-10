(function (global) {
  const namespace = global.NYCExplorer || (global.NYCExplorer = {});
  const helpers = namespace.Typeahead || (namespace.Typeahead = {});
  const DEFAULT_DEBOUNCE_MS = 250;

  helpers.initGeoTypeahead = function initGeoTypeahead(options) {
    const config = options ?? {};
    const geoFromInput = config.geoFromInput;
    const geoFromList = config.geoFromList;
    const geoToInput = config.geoToInput;
    const geoToList = config.geoToList;
    const geoStatus = config.geoStatus;
    const geoCurrentButton = config.geoCurrentButton;
    const geoCurrentToButton = config.geoCurrentToButton;
    const fromInput = config.fromInput;
    const toInput = config.toInput;
    const debounceMs = typeof config.debounceMs === 'number' && Number.isFinite(config.debounceMs)
      ? config.debounceMs
      : DEFAULT_DEBOUNCE_MS;
    const messageConfig = config.messages && typeof config.messages === 'object' ? config.messages : {};
    const messages = {
      locating: typeof messageConfig.locating === 'string' && messageConfig.locating.length
        ? messageConfig.locating
        : 'Locating…',
      usingCurrentLocation: typeof messageConfig.usingCurrentLocation === 'string' && messageConfig.usingCurrentLocation.length
        ? messageConfig.usingCurrentLocation
        : 'Using current location.',
      locationUnavailable: typeof messageConfig.locationUnavailable === 'string' && messageConfig.locationUnavailable.length
        ? messageConfig.locationUnavailable
        : 'Location unavailable.',
    };

    if (!geoFromInput || !geoFromList || !geoStatus || !geoCurrentButton || !geoToInput || !geoToList || !geoCurrentToButton || !fromInput || !toInput) {
      return null;
    }

    const app = global.App = global.App || {};
    app.adapters = app.adapters || {};

    const fetchGeoResults = async (query) => {
      const adapter = app.adapters.geo;
      if (!adapter) return [];
      if (typeof adapter.search === 'function') return adapter.search(query);
      if (typeof adapter.suggest === 'function') return adapter.suggest(query);
      return [];
    };

    const fallbackRenderTypeaheadList = () => [];
    const fallbackUpdateTypeaheadActiveOption = () => -1;
    const fallbackApplyGeoSelection = () => '';

    const renderTypeaheadList = typeof helpers.renderTypeaheadList === 'function'
      ? helpers.renderTypeaheadList
      : fallbackRenderTypeaheadList;
    const updateTypeaheadActiveOption = typeof helpers.updateTypeaheadActiveOption === 'function'
      ? helpers.updateTypeaheadActiveOption
      : fallbackUpdateTypeaheadActiveOption;
    const applyGeoSelection = typeof helpers.applyGeoSelection === 'function'
      ? helpers.applyGeoSelection
      : fallbackApplyGeoSelection;

    if (renderTypeaheadList === fallbackRenderTypeaheadList) {
      console.error('Typeahead helpers missing; geo typeahead functionality is degraded.');
    }

    const setStatus = (text) => {
      const next = text ?? '';
      if (geoStatus.textContent !== next) geoStatus.textContent = next;
    };
    const setFromExpanded = (state) => {
      geoFromInput.setAttribute('aria-expanded', state ? 'true' : 'false');
      if (!state) geoFromInput.removeAttribute('aria-activedescendant');
    };
    const setToExpanded = (state) => {
      geoToInput.setAttribute('aria-expanded', state ? 'true' : 'false');
      if (!state) geoToInput.removeAttribute('aria-activedescendant');
    };

    let geoQueryId = 0;
    let currentOptions = [];
    let activeIndex = -1;
    let geoSearchTimer = 0;

    const hideFromList = (clearStatus = false) => {
      geoFromList.innerHTML = '';
      geoFromList.style.display = 'none';
      currentOptions = [];
      activeIndex = -1;
      setFromExpanded(false);
      if (clearStatus) setStatus('');
    };
    hideFromList();

    geoCurrentButton.addEventListener('click', async () => {
      const adapter = app.adapters?.geo;
      if (!adapter || typeof adapter.current !== 'function' || adapter.current.__nycDefault) {
        setStatus(messages.locationUnavailable);
        return;
      }
      geoCurrentButton.disabled = true;
      setStatus(messages.locating);
      try {
        const result = await adapter.current();
        if (!result || typeof result.lat !== 'number' || typeof result.lng !== 'number' || typeof result.label !== 'string') throw new Error('Invalid current location result');
        geoFromInput.value = result.label;
        geoFromInput.dataset.geoLat = String(result.lat);
        geoFromInput.dataset.geoLng = String(result.lng);
        geoFromInput.dataset.geoLabel = result.label;
        fromInput.value = result.label;
        hideFromList();
        setStatus(messages.usingCurrentLocation);
      } catch (error) {
        setStatus(messages.locationUnavailable);
      } finally {
        geoCurrentButton.disabled = false;
      }
    });

    const setActiveFromOption = (index) => {
      if (!currentOptions.length) return;
      activeIndex = updateTypeaheadActiveOption(currentOptions, geoFromInput, index);
    };

    const selectFromOption = (node) => {
      if (!node) return;
      const label = applyGeoSelection(geoFromInput, fromInput, node);
      setStatus(`Selected: ${label}`);
      hideFromList();
    };

    const renderGeoFromOptions = (items) => {
      geoToList.removeAttribute('data-testid');
      if (!Array.isArray(items) || !items.length) {
        hideFromList();
        setStatus('No results');
        return;
      }
      const decorated = items.map((item, index) => ({ ...(item ?? {}), __domId: `geo-from-option-${geoQueryId}-${index}` }));
      activeIndex = -1;
      currentOptions = renderTypeaheadList(
        geoFromList,
        setFromExpanded,
        setStatus,
        decorated,
        geoFromInput,
        (node) => { selectFromOption(node); }
      );
    };

    const runGeoFromSearch = async (value, requestId) => {
      try {
        const results = await fetchGeoResults(value);
        if (requestId !== geoQueryId) return;
        if (!Array.isArray(results) || !results.length) {
          hideFromList();
          setStatus('No results');
          return;
        }
        renderGeoFromOptions(results);
      } catch (error) {
        if (requestId !== geoQueryId) return;
        hideFromList();
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
      if (geoSearchTimer) {
        global.clearTimeout(geoSearchTimer);
        geoSearchTimer = 0;
      }
      if (value.length < 2) {
        geoQueryId++;
        hideFromList(true);
        return;
      }
      hideFromList();
      setStatus('Searching…');
      geoSearchTimer = global.setTimeout(() => {
        geoSearchTimer = 0;
        const requestId = ++geoQueryId;
        void runGeoFromSearch(value, requestId);
      }, debounceMs);
    });

    geoFromInput.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') {
        hideFromList(true);
        return;
      }
      if (!currentOptions.length) return;
      if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
        event.preventDefault();
        const isDown = event.key === 'ArrowDown';
        setActiveFromOption(activeIndex === -1 ? (isDown ? 0 : currentOptions.length - 1) : activeIndex + (isDown ? 1 : -1));
        return;
      }
      if (event.key === 'Enter') {
        event.preventDefault();
        if (currentOptions[activeIndex]) selectFromOption(currentOptions[activeIndex]);
      }
    });

    let geoToQueryId = 0;
    let geoToOptions = [];
    let geoToActiveIndex = -1;
    let geoToSearchTimer = 0;

    const hideToList = (clearStatus = false) => {
      geoToList.innerHTML = '';
      geoToList.style.display = 'none';
      geoToList.removeAttribute('data-testid');
      geoToOptions = [];
      geoToActiveIndex = -1;
      setToExpanded(false);
      if (clearStatus) setStatus('');
    };
    hideToList();

    geoCurrentToButton.addEventListener('click', async () => {
      const adapter = app.adapters?.geo;
      if (!adapter || typeof adapter.current !== 'function' || adapter.current.__nycDefault) {
        setStatus(messages.locationUnavailable);
        return;
      }
      geoCurrentToButton.disabled = true;
      setStatus(messages.locating);
      try {
        const result = await adapter.current();
        if (!result || typeof result.lat !== 'number' || typeof result.lng !== 'number' || typeof result.label !== 'string') throw new Error('Invalid current location result');
        geoToInput.value = result.label;
        geoToInput.dataset.geoLat = String(result.lat);
        geoToInput.dataset.geoLng = String(result.lng);
        geoToInput.dataset.geoLabel = result.label;
        toInput.value = result.label;
        hideToList();
        setStatus(messages.usingCurrentLocation);
      } catch (error) {
        setStatus(messages.locationUnavailable);
      } finally {
        geoCurrentToButton.disabled = false;
      }
    });

    const setActiveToOption = (index) => {
      if (!geoToOptions.length) return;
      geoToActiveIndex = updateTypeaheadActiveOption(
        geoToOptions,
        geoToInput,
        index,
        (idx, total) => { setStatus(`Option ${idx + 1} of ${total}`); }
      );
    };

    const selectToOption = (node) => {
      if (!node) return;
      applyGeoSelection(geoToInput, toInput, node);
      hideToList(true);
    };

    const renderGeoToOptions = (items) => {
      geoFromList.removeAttribute('data-testid');
      if (!Array.isArray(items) || !items.length) {
        hideToList();
        setStatus('No results');
        return;
      }
      const decorated = items.map((item, index) => ({ ...(item ?? {}), __domId: `geo-to-option-${geoToQueryId}-${index}` }));
      geoToActiveIndex = -1;
      geoToOptions = renderTypeaheadList(
        geoToList,
        setToExpanded,
        setStatus,
        decorated,
        geoToInput,
        (node) => { selectToOption(node); }
      );
    };

    const runGeoToSearch = async (value, requestId) => {
      try {
        const results = await fetchGeoResults(value);
        if (requestId !== geoToQueryId) return;
        if (!Array.isArray(results) || !results.length) {
          hideToList();
          setStatus('No results');
          return;
        }
        renderGeoToOptions(results);
      } catch (error) {
        if (requestId !== geoToQueryId) return;
        hideToList();
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
        hideToList(true);
        return;
      }
      hideToList();
      setStatus('Searching…');
      geoToSearchTimer = global.setTimeout(() => {
        geoToSearchTimer = 0;
        const requestId = ++geoToQueryId;
        void runGeoToSearch(value, requestId);
      }, debounceMs);
    });

    geoToInput.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') {
        hideToList(true);
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

    return {
      hideFromList,
      hideToList,
      setStatus,
    };
  };
}(window));
