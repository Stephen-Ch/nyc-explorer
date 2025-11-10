(function (global) {
  const namespace = global.NYCExplorer || (global.NYCExplorer = {});
  const helpers = namespace.Typeahead || (namespace.Typeahead = {});

  helpers.renderTypeaheadList = function renderTypeaheadList(listEl, setExpandedFn, statusFn, options, inputEl, onPick) {
    const nodes = [];
    if (!listEl || typeof setExpandedFn !== 'function' || typeof statusFn !== 'function' || !inputEl) return nodes;
    listEl.setAttribute('data-testid', 'ta-list');
    listEl.innerHTML = '';
    if (!Array.isArray(options) || !options.length) {
      listEl.style.display = 'none';
      setExpandedFn(false);
      statusFn('No results');
      return nodes;
    }
    inputEl.removeAttribute('aria-activedescendant');
    options.forEach((item, index) => {
      const option = document.createElement('div');
      const optionId = typeof item?.__domId === 'string' ? item.__domId : `ta-option-${index}`;
      option.id = optionId;
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
        if (typeof onPick === 'function') onPick(option);
      });
      nodes.push(option);
      listEl.appendChild(option);
    });
    listEl.style.display = 'block';
    setExpandedFn(true);
    statusFn(`${nodes.length} results`);
    return nodes;
  };

  helpers.updateTypeaheadActiveOption = function updateTypeaheadActiveOption(nodes, inputEl, requestedIndex, onActive) {
    if (!Array.isArray(nodes) || !nodes.length || !inputEl) return -1;
    const total = nodes.length;
    const nextIndex = requestedIndex < 0 ? 0 : requestedIndex >= total ? total - 1 : requestedIndex;
    nodes.forEach((node, idx) => {
      const isActive = idx === nextIndex;
      node.setAttribute('data-testid', isActive ? 'ta-option-active' : 'ta-option');
      node.setAttribute('aria-selected', isActive ? 'true' : 'false');
      if (isActive) {
        inputEl.setAttribute('aria-activedescendant', node.id);
        if (typeof onActive === 'function') onActive(idx, total);
      }
    });
    return nextIndex;
  };

  helpers.applyGeoSelection = function applyGeoSelection(inputEl, targetInput, node) {
    if (!inputEl || !targetInput || !node) return '';
    const label = node.textContent ?? '';
    inputEl.value = label;
    if (node.dataset.geoLat && node.dataset.geoLng) {
      inputEl.dataset.geoLat = node.dataset.geoLat;
      inputEl.dataset.geoLng = node.dataset.geoLng;
    } else {
      delete inputEl.dataset.geoLat;
      delete inputEl.dataset.geoLng;
    }
    if (node.dataset.geoLabel) inputEl.dataset.geoLabel = node.dataset.geoLabel;
    else delete inputEl.dataset.geoLabel;
    targetInput.value = label;
    return label;
  };
}(window));
