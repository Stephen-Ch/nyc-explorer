(function () {
  const map = window.__nycMap;
  const WalkCore = window.WalkCore;
  if (!map || !WalkCore || typeof window.__nycOnEra !== 'function') {
    return;
  }

  const HIDDEN_IDS = ['route-inputs', 'geo-typeahead', 'geo-to-typeahead'];
  const previousDisplay = new Map();

  let panel = null;
  let fromSelect = null;
  let toSelect = null;
  let goButton = null;
  let showAllButton = null;
  let message = null;
  let list = null;
  let walkLine = null;
  let graph = null;
  let graphPromise = null;
  let goRunToken = 0;

  const byId = (id) => document.getElementById(id);
  const clearChildren = (element) => {
    while (element.firstChild) {
      element.removeChild(element.firstChild);
    }
  };

  const showAllPins = () => {
    if (typeof window.__nycShowOnlyStoryPins === 'function') {
      window.__nycShowOnlyStoryPins(null);
    }
    if (showAllButton) {
      showAllButton.hidden = true;
    }
  };

  const clearWalkVisuals = () => {
    showAllPins();
    if (walkLine) {
      map.removeLayer(walkLine);
      walkLine = null;
    }
    if (list) {
      clearChildren(list);
    }
  };

  const setMessage = (text) => {
    if (message) {
      message.textContent = text || '';
    }
  };

  const ensurePanel = () => {
    if (panel) {
      return panel;
    }

    const mapWrap = byId('map-wrap');
    if (!mapWrap || !mapWrap.parentNode) {
      return null;
    }

    panel = document.createElement('section');
    panel.setAttribute('data-testid', 'walk-panel');
    panel.setAttribute('aria-labelledby', 'walk-title');

    const title = document.createElement('h2');
    title.id = 'walk-title';
    title.textContent = 'Walk in 1877';
    panel.appendChild(title);

    const fromLabel = document.createElement('label');
    fromLabel.setAttribute('for', 'walk-from');
    fromLabel.textContent = 'From';
    panel.appendChild(fromLabel);

    fromSelect = document.createElement('select');
    fromSelect.id = 'walk-from';
    fromSelect.setAttribute('data-testid', 'walk-from');
    panel.appendChild(fromSelect);

    const toLabel = document.createElement('label');
    toLabel.setAttribute('for', 'walk-to');
    toLabel.textContent = 'To';
    panel.appendChild(toLabel);

    toSelect = document.createElement('select');
    toSelect.id = 'walk-to';
    toSelect.setAttribute('data-testid', 'walk-to');
    panel.appendChild(toSelect);

    goButton = document.createElement('button');
    goButton.type = 'button';
    goButton.setAttribute('data-testid', 'walk-go');
    goButton.textContent = 'Go';
    panel.appendChild(goButton);

    showAllButton = document.createElement('button');
    showAllButton.type = 'button';
    showAllButton.setAttribute('data-testid', 'walk-show-all');
    showAllButton.textContent = 'Show all places';
    showAllButton.hidden = true;
    showAllButton.addEventListener('click', () => {
      goRunToken += 1;
      if (typeof window.__nycCloseStoryCard === 'function') {
        window.__nycCloseStoryCard();
      }
      clearWalkVisuals();
      setMessage('');
      if (goButton) {
        goButton.focus();
      }
    });
    panel.appendChild(showAllButton);

    message = document.createElement('div');
    message.setAttribute('data-testid', 'walk-message');
    message.setAttribute('aria-live', 'polite');
    panel.appendChild(message);

    list = document.createElement('ol');
    list.setAttribute('data-testid', 'walk-list');
    panel.appendChild(list);

    mapWrap.parentNode.insertBefore(panel, mapWrap);

    goButton.addEventListener('click', runWalk);
    resetSelectPlaceholder(fromSelect);
    resetSelectPlaceholder(toSelect);
    return panel;
  };

  const removePanel = () => {
    if (panel && panel.parentNode) {
      panel.parentNode.removeChild(panel);
    }
    panel = null;
    fromSelect = null;
    toSelect = null;
    goButton = null;
    showAllButton = null;
    message = null;
    list = null;
  };

  const hideTodayControls = () => {
    HIDDEN_IDS.forEach((id) => {
      const element = byId(id);
      if (!element) {
        return;
      }
      if (!previousDisplay.has(id)) {
        previousDisplay.set(id, element.style.display);
      }
      element.style.display = 'none';
    });
  };

  const restoreTodayControls = () => {
    HIDDEN_IDS.forEach((id) => {
      const element = byId(id);
      if (!element) {
        return;
      }
      element.style.display = previousDisplay.has(id) ? previousDisplay.get(id) : '';
      previousDisplay.delete(id);
    });
  };

  const resetSelectPlaceholder = (select) => {
    clearChildren(select);
    const option = document.createElement('option');
    option.value = '';
    option.textContent = 'Choose a place';
    select.appendChild(option);
  };

  const fillSelects = (groups) => {
    if (!fromSelect || !toSelect || !Array.isArray(groups)) {
      return;
    }
    if (fromSelect.options.length !== 1 || toSelect.options.length !== 1) {
      return;
    }

    const sorted = [...groups].sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    sorted.forEach((group) => {
      const fromOption = document.createElement('option');
      fromOption.value = group.id;
      fromOption.textContent = group.name;
      fromSelect.appendChild(fromOption);

      const toOption = document.createElement('option');
      toOption.value = group.id;
      toOption.textContent = group.name;
      toSelect.appendChild(toOption);
    });
  };

  const getStoryGroups = () => {
    if (typeof window.__nycGetStoryGroups === 'function') {
      return window.__nycGetStoryGroups();
    }
    return null;
  };

  const ensureGraph = () => {
    if (graph) {
      return Promise.resolve(graph);
    }
    if (graphPromise) {
      return graphPromise;
    }

    graphPromise = fetch('/content/walk-graph.v1.json', { cache: 'no-store' })
      .then(async (response) => {
        if (!response.ok) {
          throw new Error(`walk graph request failed: ${response.status}`);
        }
        const payload = await response.json();
        const prepared = WalkCore.prepareGraph(payload);
        if (!prepared.edges.length) {
          throw new Error('walk graph has no streets');
        }
        graph = prepared;
        return graph;
      })
      .catch((error) => {
        console.error('[walk-graph-fetch]', error);
        graph = null;
        graphPromise = null;
        setMessage('Walks are not available right now.');
        throw error;
      });

    return graphPromise;
  };

  const drawWalk = (linePoints) => {
    walkLine = L.polyline(linePoints, {
      color: '#b5651d',
      weight: 5,
      opacity: 0.85,
      interactive: false,
    }).addTo(map);
    const element = walkLine.getElement();
    if (element) {
      element.setAttribute('data-testid', 'walk-line');
    }
  };

  const renderList = (items) => {
    if (!list) {
      return;
    }
    items.forEach((item) => {
      const li = document.createElement('li');
      const button = document.createElement('button');
      button.type = 'button';
      button.setAttribute('data-testid', 'walk-item');
      button.setAttribute('data-point-id', item.id);
      const storyCountLabel = item.count === 1 ? '1 story' : `${item.count} stories`;
      button.textContent = `${item.name}, ${storyCountLabel}`;
      button.addEventListener('click', () => {
        if (typeof window.__nycOpenStoryGroup === 'function') {
          window.__nycOpenStoryGroup(item.id, button);
        }
      });
      li.appendChild(button);
      list.appendChild(li);
    });
  };

  const runWalk = async () => {
    goRunToken += 1;
    const runToken = goRunToken;

    if (typeof window.__nycCloseStoryCard === 'function') {
      window.__nycCloseStoryCard();
    }
    clearWalkVisuals();
    setMessage('');

    if (!fromSelect || !toSelect) {
      return;
    }

    const checkChoice = () => {
      if (!fromSelect.value || !toSelect.value) {
        setMessage('Pick a From and a To place.');
        return false;
      }
      if (fromSelect.value === toSelect.value) {
        setMessage('Pick two different places.');
        return false;
      }
      return true;
    };
    if (!checkChoice()) {
      return;
    }

    let graphData = graph;
    if (!graphData) {
      try {
        await ensureGraph();
      } catch {
        if (runToken !== goRunToken) {
          return;
        }
        if (goButton) {
          goButton.focus();
        }
        return;
      }
      if (runToken !== goRunToken || !panel || window.__nycGetEra() !== '1877') {
        return;
      }
      clearWalkVisuals();
      // The walker may have changed From/To while the file loaded: use what is picked now.
      if (!checkChoice()) {
        return;
      }
      graphData = graph;
    }

    const fromId = fromSelect.value;
    const toId = toSelect.value;

    if (!graphData) {
      setMessage('Walks are not available right now.');
      if (goButton) {
        goButton.focus();
      }
      return;
    }

    const groups = getStoryGroups();
    if (!Array.isArray(groups)) {
      setMessage('Walks are not available right now.');
      if (goButton) {
        goButton.focus();
      }
      return;
    }

    const plan = WalkCore.planWalk(graphData, groups, fromId, toId, WalkCore.NEAR_METRES);
    if (!plan.ok) {
      if (plan.reason === 'no-walk') {
        setMessage('No walk found between these places.');
      } else if (plan.reason === 'same-place') {
        setMessage('Pick two different places.');
      } else {
        setMessage('Pick a From and a To place.');
      }
      if (goButton) {
        goButton.focus();
      }
      return;
    }

    // A card may have been opened from a pin while the walk file loaded; its pin may now hide.
    if (typeof window.__nycCloseStoryCard === 'function') {
      window.__nycCloseStoryCard();
    }
    drawWalk(plan.line);
    renderList(plan.list);
    if (typeof window.__nycShowOnlyStoryPins === 'function') {
      window.__nycShowOnlyStoryPins(plan.list.map((item) => item.id));
    }
    if (showAllButton) {
      showAllButton.hidden = false;
    }
    setMessage(`${plan.list.length} places on this walk`);
    if (goButton) {
      goButton.focus();
    }
  };

  const onStoriesLoaded = () => {
    if (window.__nycGetEra && window.__nycGetEra() === '1877') {
      fillSelects(getStoryGroups());
    }
  };

  const enter1877 = () => {
    if (!ensurePanel()) {
      return;
    }
    hideTodayControls();
    fillSelects(getStoryGroups());
    // Failure is already shown in the message; catch so the browser sees no unhandled rejection.
    ensureGraph().catch(() => {});
  };

  const enterToday = () => {
    goRunToken += 1; // a Go still waiting for the walk file must not draw after leaving 1877
    clearWalkVisuals();
    setMessage('');
    removePanel();
    restoreTodayControls();
  };

  window.__nycOnEra((era) => {
    if (era === '1877') {
      enter1877();
      return;
    }
    enterToday();
  });

  document.addEventListener('nyc:stories-loaded', onStoriesLoaded);

  if (window.__nycGetEra && window.__nycGetEra() === '1877') {
    enter1877();
  }
})();
