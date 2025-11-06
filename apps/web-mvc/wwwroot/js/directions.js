(function () {
  const w = window;
  const app = w.App = w.App || {};
  const dir = app.dir = app.dir || {};

  const statusNode = document.querySelector('[data-testid="dir-status"]'),
    listNode = document.querySelector('[data-testid="dir-list"]'),
    stepSelector = '[data-testid="dir-step"]',
    markerSelector = '[data-testid="poi-marker-active"]',
    nodeSelector = '[data-testid="route-node"]';
  let activeIndex = 0, hasActiveStep = false, listBound = false;

  const toMessage = (value) => {
    const text = typeof value === 'string' ? value.trim() : '';
    return text.length ? text : 'No steps.';
  };

  const clearList = () => {
    if (!listNode) return;
    while (listNode.firstChild) {
      listNode.removeChild(listNode.firstChild);
    }
  };

  const getItems = () => (listNode ? Array.from(listNode.querySelectorAll(stepSelector)) : []);
  const setItemState = (items, index) => items.forEach((item, idx) => {
    if (idx === index) item.setAttribute('aria-current', 'step');
    else item.removeAttribute('aria-current');
  });
  const focusMarker = (index) => {
    const target = document.querySelector(`${markerSelector}[data-step-index="${index}"]`) ||
      document.querySelector(`${nodeSelector}[data-step-index="${index}"]`);
    if (!(target instanceof HTMLElement)) return false;
    if (target.tabIndex < 0) target.tabIndex = -1;
    target.focus({ preventScroll: true });
    return true;
  };
  dir.syncActiveMarker = function syncActiveMarker(index) {
    const match = String(index);
    const isActive = index >= 0;

    // Normalize any previously promoted route node back to the base testid
    document.querySelectorAll('[data-testid="route-node-active"]').forEach((el) => {
      try { if (el && typeof el.setAttribute === 'function') el.setAttribute('data-testid', 'route-node'); } catch (e) { /* ignore */ }
    });
  // Update aria-current on poi markers and route nodes
    [markerSelector, nodeSelector].forEach((selector) => {
      document.querySelectorAll(selector).forEach((node) => {
        try {
          if (!node || typeof node.getAttribute !== 'function') return;
          if (isActive && node.getAttribute('data-step-index') === match) node.setAttribute('aria-current', 'step');
          else node.removeAttribute('aria-current');
        } catch (e) { /* ignore */ }
      });
    });

    // Promote the matching route node element to the active testid so tests can reliably select it
    if (isActive) {
      const activeNode = document.querySelector(`${nodeSelector}[data-step-index="${match}"]`);
      try { if (activeNode && typeof activeNode.setAttribute === 'function') activeNode.setAttribute('data-testid', 'route-node-active'); } catch (e) { /* ignore */ }
    }
  };
  const setActive = (index) => {
    const items = getItems();
    if (!items.length) return;
    const normalized = ((index % items.length) + items.length) % items.length;
    activeIndex = normalized;
    hasActiveStep = true;
    setItemState(items, normalized);
    dir.syncActiveMarker(normalized);
  };
  const clearActive = () => {
    activeIndex = 0;
    hasActiveStep = false;
    setItemState(getItems(), -1);
    dir.syncActiveMarker(-1);
  };
  const reconcileActiveState = () => {
    const items = getItems();
    if (!items.length) {
      clearActive();
      return;
    }
    const preset = items.findIndex((item) => item.getAttribute('aria-current') === 'step');
    if (preset >= 0) {
      setActive(preset);
      return;
    }
    // If no step is pre-marked, select the first step by default so map/list parity is consistent.
    if (items.length) {
      setActive(0);
      return;
    }
    clearActive();
  };
  const handleKeydown = (event) => {
    if (!['ArrowDown', 'ArrowUp', 'Enter'].includes(event.key)) return;
    const items = getItems();
    if (!items.length) return;
    if (event.key === 'Enter') {
      if (hasActiveStep && focusMarker(activeIndex)) event.preventDefault();
      return;
    }
    event.preventDefault();
    if (!hasActiveStep) {
      // If the map already has a promoted route node (route-node-active), treat that as the
      // starting active index so a single Arrow press moves from the map-selected node.
      try {
        const mapActive = document.querySelector('[data-testid="route-node-active"]');
        if (mapActive && typeof mapActive.getAttribute === 'function') {
          const idx = Number.parseInt(mapActive.getAttribute('data-step-index') ?? '0', 10) || 0;
          const next = event.key === 'ArrowUp' ? idx - 1 : idx + 1;
          setActive(next);
          return;
        }
      } catch (e) { /* ignore */ }
      setActive(event.key === 'ArrowUp' ? items.length - 1 : 0);
      return;
    }
    const delta = event.key === 'ArrowDown' ? 1 : -1;
    setActive(activeIndex + delta);
  };

  dir.init = function init() {
    if (!listNode) return;
    if (!listNode.hasAttribute('tabindex')) listNode.tabIndex = 0;
    if (!listBound) {
      listNode.addEventListener('keydown', handleKeydown);
      listBound = true;
    }
    dir.getActiveIndex = () => (hasActiveStep ? activeIndex : -1);
    dir.isBound = () => listBound;
    reconcileActiveState();
  };

  dir.setStatus = function setStatus(message) {
    if (!statusNode) return;
    statusNode.textContent = toMessage(message);
  };

  dir.clear = function clear(reason) {
    clearList();
    clearActive();
    dir.setStatus(reason);
  };

  const isActiveStep = (step) => {
    if (!step || typeof step !== 'object') return false;
    if (step.active === true || step.current === true) return true;
    if (typeof step.status === 'string' && step.status.trim().toLowerCase() === 'current') return true;
    if (typeof step.state === 'string' && step.state.trim().toLowerCase() === 'current') return true;
    return false;
  };

  dir.render = function render(steps) {
    if (!Array.isArray(steps) || !listNode) {
      dir.clear('No steps.');
      return;
    }
    clearList();
    const fragment = document.createDocumentFragment();
    steps.forEach((step, index) => {
      const li = document.createElement('li');
      li.setAttribute('data-testid', 'dir-step');
      li.setAttribute('data-dir-index', String(index));
      if (isActiveStep(step)) li.setAttribute('aria-current', 'step');
      const text = typeof step?.text === 'string' ? step.text : '';
      li.textContent = text.trim().length ? text.trim() : `Step ${index + 1}`;
      fragment.appendChild(li);
    });
    listNode.appendChild(fragment);
    reconcileActiveState();
  };

  dir.clear('No steps.');
})();
