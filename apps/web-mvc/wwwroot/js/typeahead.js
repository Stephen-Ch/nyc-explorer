/**
 * Reusable typeahead component for geocoding inputs
 * Handles search, keyboard navigation, and accessibility
 */

function createTypeahead(config) {
  const {
    input,
    listbox,
    statusElement,
    currentButton,
    linkedInput,
    adapter,
    debounceMs = 250,
  } = config;

  if (!input || !listbox || !statusElement) {
    throw new Error('TypeaheadComponent requires input, listbox, and statusElement');
  }

  let queryId = 0;
  let currentOptions = [];
  let activeIndex = -1;
  let searchTimer = 0;

  const setStatus = (text) => {
    const next = text ?? '';
    if (statusElement.textContent !== next) {
      statusElement.textContent = next;
    }
  };

  const setExpanded = (state) => {
    input.setAttribute('aria-expanded', state ? 'true' : 'false');
    if (!state) {
      input.removeAttribute('aria-activedescendant');
    }
  };

  const hideList = (clearStatus = false) => {
    listbox.innerHTML = '';
    listbox.style.display = 'none';
    listbox.removeAttribute('data-testid');
    currentOptions = [];
    activeIndex = -1;
    setExpanded(false);
    if (clearStatus) setStatus('');
  };

  const setActiveOption = (index) => {
    if (!currentOptions.length) return;
    const total = currentOptions.length;
    const nextIndex = index < 0 ? 0 : index >= total ? total - 1 : index;
    activeIndex = nextIndex;

    currentOptions.forEach((node, idx) => {
      const isActive = idx === activeIndex;
      node.setAttribute('data-testid', isActive ? 'ta-option-active' : 'ta-option');
      node.setAttribute('aria-selected', isActive ? 'true' : 'false');
      if (isActive) {
        input.setAttribute('aria-activedescendant', node.id);
        setStatus(`Option ${idx + 1} of ${total}`);
      }
    });
  };

  const selectOption = (node) => {
    if (!node) return;

    input.value = node.textContent ?? '';

    if (node.dataset.geoLat && node.dataset.geoLng) {
      input.dataset.geoLat = node.dataset.geoLat;
      input.dataset.geoLng = node.dataset.geoLng;
    } else {
      delete input.dataset.geoLat;
      delete input.dataset.geoLng;
    }

    if (node.dataset.geoLabel) {
      input.dataset.geoLabel = node.dataset.geoLabel;
    } else {
      delete input.dataset.geoLabel;
    }

    if (linkedInput) {
      linkedInput.value = input.value;
    }

    hideList(true);
  };

  const renderOptions = (items) => {
    listbox.innerHTML = '';
    currentOptions = [];
    activeIndex = -1;
    input.removeAttribute('aria-activedescendant');

    if (!Array.isArray(items) || !items.length) {
      hideList();
      setStatus('No results');
      return;
    }

    items.forEach((item, index) => {
      const option = document.createElement('div');
      const optionId = `${listbox.id}-option-${queryId}-${index}`;
      option.id = optionId;
      option.setAttribute('data-testid', 'ta-option');
      option.setAttribute('role', 'option');
      option.setAttribute('aria-selected', 'false');
      option.textContent = item && typeof item.label === 'string' ? item.label : '';
      option.dataset.id = item && typeof item.id === 'string' ? item.id : '';

      if (item && typeof item.lat === 'number') option.dataset.geoLat = String(item.lat);
      if (item && typeof item.lng === 'number') option.dataset.geoLng = String(item.lng);
      if (item && typeof item.label === 'string') option.dataset.geoLabel = item.label;

      Object.assign(option.style, { padding: '4px 8px', cursor: 'pointer' });

      option.addEventListener('mousedown', (event) => {
        event.preventDefault();
        selectOption(option);
      });

      currentOptions.push(option);
      listbox.appendChild(option);
    });

    listbox.setAttribute('data-testid', 'ta-list');
    listbox.style.display = 'block';
    setExpanded(true);
    setStatus(`${currentOptions.length} results`);
  };

  const runSearch = async (value, requestId) => {
    if (!adapter || typeof adapter.search !== 'function') {
      hideList();
      setStatus('No geocoder available');
      return;
    }

    try {
      const results = await adapter.search(value);
      if (requestId !== queryId) return;

      if (!Array.isArray(results) || !results.length) {
        hideList();
        setStatus('No results');
        return;
      }

      renderOptions(results);
    } catch (error) {
      if (requestId !== queryId) return;
      hideList();
      setStatus('Error contacting geocoder');
    }
  };

  const handleInput = (event) => {
    delete input.dataset.geoLat;
    delete input.dataset.geoLng;
    delete input.dataset.geoLabel;

    const value = (event.target?.value ?? '').trim();

    if (searchTimer) {
      clearTimeout(searchTimer);
      searchTimer = 0;
    }

    if (value.length < 2) {
      queryId++;
      hideList(true);
      return;
    }

    hideList();
    setStatus('Searching…');

    searchTimer = window.setTimeout(() => {
      searchTimer = 0;
      const requestId = ++queryId;
      void runSearch(value, requestId);
    }, debounceMs);
  };

  const handleKeydown = (event) => {
    if (event.key === 'Escape') {
      hideList(true);
      return;
    }

    if (!currentOptions.length) return;

    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      const isDown = event.key === 'ArrowDown';
      const next = activeIndex === -1
        ? (isDown ? 0 : currentOptions.length - 1)
        : activeIndex + (isDown ? 1 : -1);
      setActiveOption(next);
      return;
    }

    if (event.key === 'Enter') {
      event.preventDefault();
      if (currentOptions[activeIndex]) {
        selectOption(currentOptions[activeIndex]);
      }
    }
  };

  const handleCurrentLocation = async () => {
    if (!adapter || typeof adapter.current !== 'function' || adapter.current.__nycDefault) {
      setStatus('Location unavailable.');
      return;
    }

    if (!currentButton) return;

    currentButton.disabled = true;
    setStatus('Locating…');

    try {
      const result = await adapter.current();
      if (!result || typeof result.lat !== 'number' || typeof result.lng !== 'number' || typeof result.label !== 'string') {
        throw new Error('Invalid current location result');
      }

      input.value = result.label;
      input.dataset.geoLat = String(result.lat);
      input.dataset.geoLng = String(result.lng);
      input.dataset.geoLabel = result.label;

      if (linkedInput) {
        linkedInput.value = result.label;
      }

      hideList();
      setStatus('Using current location.');
    } catch (error) {
      setStatus('Location unavailable.');
    } finally {
      currentButton.disabled = false;
    }
  };

  // Initialize
  hideList();

  // Attach event listeners
  input.addEventListener('input', handleInput);
  input.addEventListener('keydown', handleKeydown);

  if (currentButton) {
    currentButton.addEventListener('click', handleCurrentLocation);
  }

  // Public API
  return {
    hide: hideList,
  };
}
