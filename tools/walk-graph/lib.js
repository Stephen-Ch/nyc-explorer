'use strict';
// Plan 41 slice 1b step 1: build a walkable street network from OpenStreetMap streets.
// Plain CommonJS so tests/unit can require() it.

// D10: streets only. Footways (today's park paths, sidewalks), service roads and cycleways are left out.
const KINDS = new Set(['residential', 'primary', 'secondary', 'tertiary', 'living_street', 'unclassified', 'pedestrian']);

// Story area (34 places: lat 40.7312-40.7427, lng -73.9968 to -73.9863) plus about 250 m.
const DEFAULT_BOX = { minLat: 40.729, maxLat: 40.745, minLng: -73.9995, maxLng: -73.983 };

// Build stops if any story place is farther than this from a street (plan 41 slice 1b).
const MAX_PLACE_M = 150;

const R = 6371008.8;
const rad = (d) => (d * Math.PI) / 180;

function haversine(lat1, lng1, lat2, lng2) {
  const dLat = rad(lat2 - lat1);
  const dLng = rad(lng2 - lng1);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(lat1)) * Math.cos(rad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

function inBox(n, box) {
  return n.lat >= box.minLat && n.lat <= box.maxLat && n.lng >= box.minLng && n.lng <= box.maxLng;
}

function buildGraph(osm, opts) {
  const box = (opts && opts.box) || DEFAULT_BOX;
  const elements = Array.isArray(osm && osm.elements) ? osm.elements : [];
  const coords = new Map();
  for (const el of elements) {
    if (el && el.type === 'node' && Number.isFinite(el.lat) && Number.isFinite(el.lon)) {
      coords.set(el.id, { id: el.id, lat: el.lat, lng: el.lon });
    }
  }

  const edgeMap = new Map();
  for (const el of elements) {
    if (!el || el.type !== 'way' || !Array.isArray(el.nodes)) continue;
    const tags = el.tags || {};
    if (!KINDS.has(tags.highway)) continue;
    if (tags.area === 'yes') continue;
    for (let i = 0; i + 1 < el.nodes.length; i += 1) {
      const p = coords.get(el.nodes[i]);
      const q = coords.get(el.nodes[i + 1]);
      if (!p || !q || p.id === q.id) continue;
      if (!inBox(p, box) || !inBox(q, box)) continue;
      const a = Math.min(p.id, q.id);
      const b = Math.max(p.id, q.id);
      const key = `${a}-${b}`;
      if (!edgeMap.has(key)) edgeMap.set(key, { a, b, m: haversine(p.lat, p.lng, q.lat, q.lng) });
    }
  }

  // Connected pieces (union-find).
  const parent = new Map();
  const find = (x) => {
    while (parent.get(x) !== x) {
      parent.set(x, parent.get(parent.get(x)));
      x = parent.get(x);
    }
    return x;
  };
  for (const e of edgeMap.values()) {
    if (!parent.has(e.a)) parent.set(e.a, e.a);
    if (!parent.has(e.b)) parent.set(e.b, e.b);
    const ra = find(e.a);
    const rb = find(e.b);
    if (ra !== rb) parent.set(ra, rb);
  }
  const sizes = new Map();
  for (const id of parent.keys()) {
    const r = find(id);
    sizes.set(r, (sizes.get(r) || 0) + 1);
  }
  let best = null;
  for (const [r, n] of sizes) {
    if (best === null || n > sizes.get(best) || (n === sizes.get(best) && r < best)) best = r;
  }

  const keepIds = new Set();
  for (const id of parent.keys()) if (find(id) === best) keepIds.add(id);
  const nodes = [...keepIds].sort((x, y) => x - y).map((id) => coords.get(id));
  const edges = [...edgeMap.values()]
    .filter((e) => keepIds.has(e.a))
    .sort((x, y) => x.a - y.a || x.b - y.b);
  const firstNode = new Map();
  for (const id of [...parent.keys()].sort((x, y) => x - y)) {
    const r = find(id);
    if (!firstNode.has(r)) firstNode.set(r, id);
  }
  const list = [...sizes]
    .filter(([r]) => r !== best)
    .map(([r, size]) => ({ size, sampleNodeId: firstNode.get(r) }))
    .sort((x, y) => y.size - x.size || x.sampleNodeId - y.sampleNodeId);
  return {
    nodes,
    edges,
    dropped: { pieces: list.length, nodes: parent.size - keepIds.size, list },
  };
}

// Distance in metres from a point to the nearest point on any edge (local flat projection).
function distanceToGraph(graph, lat, lng) {
  const byId = new Map(graph.nodes.map((n) => [n.id, n]));
  const kx = Math.cos(rad(lat)) * (Math.PI / 180) * R;
  const ky = (Math.PI / 180) * R;
  let best = Infinity;
  for (const e of graph.edges) {
    const p = byId.get(e.a);
    const q = byId.get(e.b);
    const ax = (p.lng - lng) * kx;
    const ay = (p.lat - lat) * ky;
    const bx = (q.lng - lng) * kx;
    const by = (q.lat - lat) * ky;
    const dx = bx - ax;
    const dy = by - ay;
    const len2 = dx * dx + dy * dy;
    let t = len2 === 0 ? 0 : -(ax * dx + ay * dy) / len2;
    t = Math.max(0, Math.min(1, t));
    const d = Math.hypot(ax + t * dx, ay + t * dy);
    if (d < best) best = d;
  }
  return best;
}

// Each place's distance to the network. Throws (naming the places) if any is over maxM.
function checkPlaces(graph, places, maxM = MAX_PLACE_M) {
  const rows = places.map((p) => ({ id: p.id, name: p.name, m: distanceToGraph(graph, p.lat, p.lng) }));
  const tooFar = rows.filter((r) => !(r.m <= maxM));
  if (tooFar.length) {
    throw new Error(`Places over ${maxM} m from any street: ${tooFar.map((r) => `${r.id} (${Math.round(r.m)} m)`).join(', ')}`);
  }
  const worst = rows.reduce((w, r) => (w === null || r.m > w.m ? r : w), null);
  return { rows, worst };
}

const round6 = (x) => Math.round(x * 1e6) / 1e6;

function toOutput(graph, downloadDate) {
  return {
    version: 1,
    attribution: `Street network from OpenStreetMap data (downloaded ${downloadDate}), (c) OpenStreetMap contributors (ODbL).`,
    nodes: graph.nodes.map((n) => [n.id, round6(n.lat), round6(n.lng)]),
    edges: graph.edges.map((e) => [e.a, e.b, Math.round(e.m * 10) / 10]),
  };
}

module.exports = { KINDS, MAX_PLACE_M, DEFAULT_BOX, haversine, buildGraph, distanceToGraph, checkPlaces, toOutput };
