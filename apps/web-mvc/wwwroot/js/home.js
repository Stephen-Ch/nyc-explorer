const map = L.map('map').setView([40.7359, -73.9911], 15);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '© OpenStreetMap contributors'
}).addTo(map);

let pois = [];
const overlay = document.getElementById('poi-overlay');
const routeSteps = document.getElementById('route-steps');

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
      if (count >= 3) return false;
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

function placeButtons() {
  if (!overlay) {
    return;
  }

  overlay.innerHTML = '';
  pois.forEach((poi) => {
    const point = map.latLngToContainerPoint([poi.coords.lat, poi.coords.lng]);
    const btn = document.createElement('button');
    btn.setAttribute('data-testid', 'poi-marker');
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

fetch('/content/poi.v1.json')
  .then((res) => res.json())
  .then((data) => {
    pois = data;
    render(pois);

    pois.forEach((poi) => {
      const marker = L.marker([poi.coords.lat, poi.coords.lng]);
      marker.addTo(map).bindPopup(poi.name);
    });

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
  .catch(() => {
    document.body.textContent = 'Failed to load POIs';
  });
