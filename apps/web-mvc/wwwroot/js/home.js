const map = L.map('map').setView([40.7359, -73.9911], 15);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '© OpenStreetMap contributors'
}).addTo(map);

const CFG_ROUTE = { BLOCK_CAP: 3 };

let pois = [];
let poiMarkers = [];
let currentEra = 'today';
const overlay = document.getElementById('poi-overlay');
const routeSteps = document.getElementById('route-steps');
const eraListeners = [];

const eraTitleEl = document.querySelector('h1');
if (eraTitleEl) {
  const eraPicker = document.createElement('div');
  eraPicker.setAttribute('data-testid', 'era-picker');
  eraPicker.setAttribute('role', 'group');
  eraPicker.setAttribute('aria-label', 'Era');
  eraPicker.setAttribute('style', 'display:flex; gap:0.5rem; margin:0.5rem 0 1rem;');

  const createEraButton = (era, label) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.setAttribute('data-testid', 'era-option');
    button.setAttribute('data-era', era);
    button.textContent = label;
    button.setAttribute('aria-pressed', String(era === currentEra));
    button.addEventListener('click', () => window.__nycSetEra(era));
    return button;
  };

  const todayButton = createEraButton('today', 'Today');
  const storyButton = createEraButton('1877', '1877');
  eraPicker.appendChild(todayButton);
  eraPicker.appendChild(storyButton);
  eraTitleEl.insertAdjacentElement('afterend', eraPicker);
  window.__nycEraButtons = [todayButton, storyButton];
}

window.__nycMap = map;
window.__nycGetEra = () => currentEra;
window.__nycOnEra = (fn) => {
  eraListeners.push(fn);
  return () => {
    const index = eraListeners.indexOf(fn);
    if (index >= 0) {
      eraListeners.splice(index, 1);
    }
  };
};
window.__nycSetEra = (era) => {
  const nextEra = era === '1877' ? '1877' : 'today';
  currentEra = nextEra;

  if (window.__nycEraButtons) {
    window.__nycEraButtons.forEach((button) => {
      const isSelected = button.getAttribute('data-era') === currentEra;
      button.setAttribute('aria-pressed', String(isSelected));
    });
  }

  erasForMarkers();
  placeButtons();

  eraListeners.forEach((listener) => {
    try {
      listener(currentEra);
    } catch (error) {
      console.error('[era-listener]', error);
    }
  });
};

const buildRoute = (list) => {
  const seen = new Map();
  return [...list]
    .sort((a, b) => {
      const routeA = a.route_id ?? 'zzz';
      const routeB = b.route_id ?? 'zzz';
      if (routeA !== routeB) return routeA.localeCompare(routeB);
      const orderA = typeof a.order === 'number' ? a.order : 999999;
      const orderB = typeof b.order === 'number' ? b.order : 999999;
      if (orderA !== orderB) return orderA - orderB;
      return (a.name ?? '').localeCompare(b.name ?? '');
    })
    .filter((poi) => {
      const block = typeof poi.block === 'string' ? poi.block : '';
      const count = seen.get(block) ?? 0;
      if (count >= CFG_ROUTE.BLOCK_CAP) return false;
      seen.set(block, count + 1);
      return true;
    });
};

const renderRoute = (list) => {
  if (!routeSteps) {
    return;
  }

  routeSteps.innerHTML = '';
  list.forEach((poi) => {
    const li = document.createElement('li');
    li.setAttribute('data-testid', 'route-step');
    li.textContent = poi.name;
    routeSteps.appendChild(li);
  });
};

const erasForMarkers = () => {
  poiMarkers.forEach((marker) => {
    if (currentEra === '1877') {
      map.removeLayer(marker);
      return;
    }

    if (!map.hasLayer(marker)) {
      marker.addTo(map);
    }
  });
};

function placeButtons() {
  if (!overlay) {
    return;
  }

  overlay.innerHTML = '';

  if (currentEra === '1877') {
    return;
  }

  pois.forEach((poi) => {
    const point = map.latLngToContainerPoint([poi.coords.lat, poi.coords.lng]);
    const btn = document.createElement('button');
    btn.setAttribute('data-testid', 'poi-marker');
    btn.setAttribute('data-poi-id', poi.id);
    btn.setAttribute('data-id', poi.id);
    btn.setAttribute('aria-label', poi.name);
    btn.setAttribute('role', 'button');
    btn.tabIndex = 0;
    btn.style.cssText = `position:absolute; left:${point.x - 14}px; top:${point.y - 14}px; width:28px; height:28px; border:none; border-radius:50%; background:transparent; pointer-events:auto; cursor:pointer; z-index:651;`;
    btn.addEventListener('click', () => window.location.assign(`/poi/${poi.id}`));
    overlay.appendChild(btn);
  });
}

function render(listData) {
  const list = document.getElementById('poi-list');
  if (!list) {
    return;
  }

  list.innerHTML = '';
  listData.forEach((poi) => {
    const li = document.createElement('li');
    li.setAttribute('data-testid', 'poi-item');
    const a = document.createElement('a');
    a.setAttribute('data-testid', 'poi-link');
    a.href = `/poi/${poi.id}`;
    a.textContent = poi.name;
    li.appendChild(a);
    list.appendChild(li);
  });
}

const poiErrorEl = document.querySelector('[data-testid="poi-error"]');

fetch('/content/poi.v1.json')
  .then((res) => res.json())
  .then((data) => {
    pois = data;
    render(pois);

    poiMarkers = pois.map((poi) => {
      return L.marker([poi.coords.lat, poi.coords.lng]).bindPopup(poi.name);
    });

    erasForMarkers();
    placeButtons();
    ['move', 'zoom', 'resize'].forEach((evt) => map.on(evt, placeButtons));
    renderRoute(buildRoute(pois));

    document.getElementById('search-input')?.addEventListener('input', (e) => {
      const q = e.target.value.toLowerCase();
      const filtered = pois.filter((p) => p.name.toLowerCase().includes(q));
      render(filtered);
      renderRoute(buildRoute(filtered));
    });
  })
  .catch((error) => {
    console.error('[poi-fetch]', error);
    if (poiErrorEl) {
      poiErrorEl.textContent = 'Unable to load POIs.';
      poiErrorEl.style.removeProperty('display');
    }
  });

const storyScript = document.createElement('script');
storyScript.src = '/js/stories.js';
storyScript.async = false;
document.body.appendChild(storyScript);

window.__nycSetEra(currentEra);
