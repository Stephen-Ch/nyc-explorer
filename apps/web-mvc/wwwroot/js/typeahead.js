(function () {
  const app = window.App = window.App || {};
  const DEBOUNCE_MS = 250;
  const applyData = (input, detail = {}) => {
    const label = detail.label ?? '';
    input.value = label;
    const lat = detail.lat, lng = detail.lng;
    if (lat != null && !Number.isNaN(lat)) input.dataset.geoLat = String(lat); else delete input.dataset.geoLat;
    if (lng != null && !Number.isNaN(lng)) input.dataset.geoLng = String(lng); else delete input.dataset.geoLng;
    if (label) input.dataset.geoLabel = label; else delete input.dataset.geoLabel;
  };
  const ensureList = (root) => {
    const list = (root.ownerDocument || document).createElement('ol');
    Object.assign(list.style, { margin: '0', padding: '0', listStyle: 'none' });
    root.innerHTML = '';
    root.appendChild(list);
    return list;
  };
  const createCombobox = (cfg) => {
    const { target, input, list, peer, mirror, search, setStatus, onSelect } = cfg;
    const notify = typeof onSelect === 'function' ? onSelect : () => {};
    let options = [], active = -1, timer = 0, seed = 0;
    const setExpanded = (state) => { input.setAttribute('aria-expanded', state ? 'true' : 'false'); if (!state) input.removeAttribute('aria-activedescendant'); };
    const hide = (clear) => { list.innerHTML = ''; list.style.display = 'none'; options = []; active = -1; setExpanded(false); if (clear) setStatus(''); };
    const setActive = (index) => { if (!options.length) return; const next = index < 0 ? 0 : index >= options.length ? options.length - 1 : index; active = next; options.forEach((node, idx) => { const isActive = idx === active; node.setAttribute('data-testid', isActive ? 'ta-option-active' : 'ta-option'); node.setAttribute('aria-selected', isActive ? 'true' : 'false'); if (isActive) input.setAttribute('aria-activedescendant', node.id); }); };
    const commit = (node) => { if (!node) return; const detail = { label: node.textContent ?? '', lat: node.dataset.geoLat != null ? Number(node.dataset.geoLat) : undefined, lng: node.dataset.geoLng != null ? Number(node.dataset.geoLng) : undefined }; applyData(input, detail); mirror.value = detail.label; notify(target, detail); setStatus(`Selected: ${detail.label}`); hide(); };
    const render = (items, idSeed) => { const listEl = ensureList(list); options = []; active = -1; input.removeAttribute('aria-activedescendant'); if (!Array.isArray(items) || !items.length) { hide(); setStatus('No results'); return; } const prefix = target === 'from' ? 'geo-from-option' : 'geo-to-option'; if (peer) peer.removeAttribute('data-testid'); list.setAttribute('data-testid', 'ta-list'); list.style.display = 'block'; setExpanded(true); items.forEach((item, idx) => { const option = listEl.ownerDocument.createElement('li'); option.id = `${prefix}-${idSeed}-${idx}`; option.setAttribute('role', 'option'); option.setAttribute('data-testid', 'ta-option'); option.setAttribute('aria-selected', 'false'); option.textContent = typeof item?.label === 'string' ? item.label : ''; if (typeof item?.lat === 'number') option.dataset.geoLat = String(item.lat); if (typeof item?.lng === 'number') option.dataset.geoLng = String(item.lng); if (typeof item?.label === 'string') option.dataset.geoLabel = item.label; Object.assign(option.style, { padding: '4px 8px', cursor: 'pointer' }); option.addEventListener('mousedown', (event) => { event.preventDefault(); commit(option); }); options.push(option); listEl.appendChild(option); }); setStatus(`${options.length} results`); };
    const runSearch = async (value, idSeed) => { try { const results = await search(value); if (idSeed !== seed) return; if (!Array.isArray(results) || !results.length) { hide(); setStatus('No results'); return; } render(results, idSeed); } catch (error) { hide(); const timeout = Boolean(error && (error.name === 'AbortError' || error.code === 'TIMEOUT')); setStatus(timeout ? 'Unable to search locations (timeout)' : 'Error contacting geocoder'); } };
    const schedule = (raw) => { if (timer) window.clearTimeout(timer); const value = typeof raw === 'string' ? raw.trim() : ''; if (!value.length) { hide(true); return; } setStatus('Searching…'); seed += 1; const idSeed = seed; timer = window.setTimeout(() => runSearch(value, idSeed), DEBOUNCE_MS); };
    input.addEventListener('input', (event) => { applyData(input, { label: input.value }); mirror.value = input.value; schedule(event.target.value); });
    input.addEventListener('keydown', (event) => { if (event.key === 'ArrowDown') { if (!options.length) return; event.preventDefault(); setActive(active + 1); } else if (event.key === 'ArrowUp') { if (!options.length) return; event.preventDefault(); setActive(active - 1); } else if (event.key === 'Enter') { if (active >= 0 && options[active]) { event.preventDefault(); commit(options[active]); } } else if (event.key === 'Escape') { hide(true); } });
    input.addEventListener('focus', () => { if (options.length) { list.style.display = 'block'; setExpanded(true); } });
    input.addEventListener('blur', () => { window.setTimeout(() => hide(), 150); });
    return { setManual(detail) { applyData(input, detail || {}); mirror.value = detail?.label ?? ''; notify(target, detail || { label: mirror.value }); hide(); }, hide(clear) { hide(Boolean(clear)); } };
  };
  app.typeahead = {
    init(opts) {
      if (!opts?.fromEl || !opts?.toEl || !opts?.listEl) return null;
      const geo = opts.adapters?.geo || {};
      const search = (query) => { if (!geo) return []; if (typeof geo.search === 'function') return geo.search(query); if (typeof geo.suggest === 'function') return geo.suggest(query); return []; };
      const setStatus = typeof opts.setStatus === 'function' ? opts.setStatus : () => {};
      const from = createCombobox({ target: 'from', input: opts.fromEl, list: opts.listEl.from, peer: opts.listEl.to, mirror: opts.fromMirror || opts.fromEl, search, setStatus, onSelect: opts.onSelect });
      const to = createCombobox({ target: 'to', input: opts.toEl, list: opts.listEl.to, peer: opts.listEl.from, mirror: opts.toMirror || opts.toEl, search, setStatus, onSelect: opts.onSelect });
      return { setManual(target, detail) { (target === 'from' ? from : to)?.setManual(detail); }, hide(target) { (target === 'from' ? from : to)?.hide(true); } };
    }
  };
})();
