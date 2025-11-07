(function (global) {
  const clearTurnList = (root) => {
    if (!root) return;
    root.innerHTML = '';
  };

  const renderTurnList = (root, steps) => {
    if (!root) return;
    clearTurnList(root);
    if (!Array.isArray(steps) || !steps.length) return;
    const doc = root.ownerDocument || global.document;
    steps.forEach((step, index) => {
      const item = doc.createElement('li');
      item.setAttribute('data-testid', 'turn-item');
      item.setAttribute('data-dir-index', String(index));
      const text = typeof step?.text === 'string' && step.text.trim().length ? step.text : `Step ${index + 1}`;
      item.textContent = text;
      root.appendChild(item);
    });
  };

  const announceReady = (liveRegion, detail) => {
    if (!liveRegion) return;
    const steps = Array.isArray(detail?.steps) ? detail.steps.filter(Boolean) : [];
    const path = Array.isArray(detail?.path) ? detail.path.filter(Boolean) : [];
    const hasPath = path.length > 1;
    const hasTurns = steps.length > 0;
    const base = hasTurns && !hasPath ? 'Route ready (turns only).' : 'Route ready.';
    const suffix = hasTurns ? (steps.length === 1 ? '1 step.' : `${steps.length} steps.`) : '';
    liveRegion.textContent = suffix ? `${base} ${suffix}` : base;
    liveRegion.style.removeProperty('display');
  };

  global.App = global.App || {};
  global.App.routeUi = { clearTurnList, renderTurnList, announceReady };
})(window);
