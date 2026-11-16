import { test, expect } from '@playwright/test';
import * as path from 'path';
import * as fs from 'fs';

// Plan 41 slice 1b step 1: walk graph builder (tools/walk-graph, CommonJS).
// eslint-disable-next-line @typescript-eslint/no-var-requires
const lib = require(path.join(__dirname, '..', '..', 'tools', 'walk-graph', 'lib.js'));

// Tiny fixture: nodes on a north-south line ~111 m apart (0.001 deg lat).
const LNG = -73.99;
const node = (id: number, lat: number, lng = LNG) => ({ type: 'node', id, lat, lon: lng });
const way = (id: number, nodes: number[], tags: Record<string, string>) => ({ type: 'way', id, nodes, tags });
const BOX = { minLat: 40.0, maxLat: 41.0, minLng: -74.5, maxLng: -73.5 };

const fixture = (elements: unknown[]) => ({ elements });

test('keeps every D10 street kind, drops footway, service, cycleway, secondary_link', () => {
  const kept = ['residential', 'primary', 'secondary', 'tertiary', 'living_street', 'unclassified', 'pedestrian'];
  const dropped = ['footway', 'service', 'cycleway', 'secondary_link'];
  for (const kind of kept) {
    const g = lib.buildGraph(fixture([node(1, 40.730), node(2, 40.731), way(10, [1, 2], { highway: kind })]), { box: BOX });
    expect(g.edges.length, kind).toBe(1);
  }
  for (const kind of dropped) {
    const g = lib.buildGraph(fixture([node(1, 40.730), node(2, 40.731), way(10, [1, 2], { highway: kind })]), { box: BOX });
    expect(g.edges.length, kind).toBe(0);
  }
  expect([...lib.KINDS].sort()).toEqual([...kept].sort());
});

test('skips pedestrian plaza outlines tagged area=yes, keeps plain pedestrian', () => {
  const osm = fixture([
    node(1, 40.730), node(2, 40.731), node(3, 40.732),
    way(10, [1, 2], { highway: 'pedestrian' }),
    way(11, [2, 3], { highway: 'pedestrian', area: 'yes' }),
  ]);
  const g = lib.buildGraph(osm, { box: BOX });
  expect(g.edges.length).toBe(1);
});

test('splits a way into one edge per node pair and joins ways at shared nodes', () => {
  const osm = fixture([
    node(1, 40.730), node(2, 40.731), node(3, 40.732), node(4, 40.731, -73.989),
    way(10, [1, 2, 3], { highway: 'primary' }),
    way(11, [2, 4], { highway: 'residential' }),
  ]);
  const g = lib.buildGraph(osm, { box: BOX });
  expect(g.edges.length).toBe(3);
  const deg2 = g.edges.filter((e: { a: number; b: number }) => e.a === 2 || e.b === 2).length;
  expect(deg2).toBe(3);
});

test('drops edges with an end outside the box', () => {
  const osm = fixture([
    node(1, 40.730), node(2, 40.731), node(3, 41.5),
    way(10, [1, 2, 3], { highway: 'secondary' }),
  ]);
  const g = lib.buildGraph(osm, { box: BOX });
  expect(g.edges.length).toBe(1);
  expect(g.nodes.find((n: { id: number }) => n.id === 3)).toBeUndefined();
});

test('keeps only the largest connected piece and reports what was dropped', () => {
  const osm = fixture([
    node(7, 40.735, -73.98), node(8, 40.736, -73.98),
    way(11, [7, 8], { highway: 'residential' }),
    node(1, 40.730), node(2, 40.731), node(3, 40.732),
    way(10, [1, 2, 3], { highway: 'residential' }),
  ]);
  const g = lib.buildGraph(osm, { box: BOX });
  expect(g.nodes.map((n: { id: number }) => n.id)).toEqual([1, 2, 3]);
  expect(g.dropped.pieces).toBe(1);
  expect(g.dropped.nodes).toBe(2);
  expect(g.dropped.list).toEqual([{ size: 2, sampleNodeId: 7 }]);
});

test('edge length is real distance: 0.001 deg latitude is about 111 m', () => {
  const osm = fixture([node(1, 40.730), node(2, 40.731), way(10, [1, 2], { highway: 'residential' })]);
  const g = lib.buildGraph(osm, { box: BOX });
  expect(Math.abs(g.edges[0].m - 111.2)).toBeLessThan(2);
});

test('a duplicate edge from two overlapping ways is kept once', () => {
  const osm = fixture([
    node(1, 40.730), node(2, 40.731),
    way(10, [1, 2], { highway: 'residential' }),
    way(11, [2, 1], { highway: 'residential' }),
  ]);
  const g = lib.buildGraph(osm, { box: BOX });
  expect(g.edges.length).toBe(1);
});

test('place distance is measured to the nearest point on a street, not the nearest corner', () => {
  const osm = fixture([node(1, 40.730), node(2, 40.732), way(10, [1, 2], { highway: 'residential' })]);
  const g = lib.buildGraph(osm, { box: BOX });
  // Midway along the street, 0.0003 deg of longitude east (~25 m), ~111 m from either end node.
  const d = lib.distanceToGraph(g, 40.731, LNG + 0.0003);
  expect(Math.abs(d - 25.3)).toBeLessThan(2);
});

test('checkPlaces: 150 m limit is a named setting; about 140 m passes, about 160 m stops', () => {
  expect(lib.MAX_PLACE_M).toBe(150);
  const osm = fixture([node(1, 40.728), node(2, 40.734), way(10, [1, 2], { highway: 'residential' })]);
  const g = lib.buildGraph(osm, { box: BOX });
  const mPerDegLng = 111195 * Math.cos((40.731 * Math.PI) / 180);
  const at = (m: number, id: string) => ({ id, name: id, lat: 40.731, lng: LNG + m / mPerDegLng });
  const ok = lib.checkPlaces(g, [at(140, 'p140')], lib.MAX_PLACE_M);
  expect(Math.abs(ok.worst.m - 140)).toBeLessThan(1);
  expect(() => lib.checkPlaces(g, [at(140, 'p140'), at(160, 'p160')], lib.MAX_PLACE_M)).toThrow(/p160/);
});

test('output file has version, attribution and rounded coordinates, no secrets', () => {
  const osm = fixture([node(1, 40.7301234567, -73.9901234567), node(2, 40.731, LNG), way(10, [1, 2], { highway: 'residential' })]);
  const g = lib.buildGraph(osm, { box: BOX });
  const out = lib.toOutput(g, 'Mon Nov 16 15:11:26 UTC 2026');
  expect(out.version).toBe(1);
  expect(out.attribution).toMatch(/OpenStreetMap contributors/);
  expect(out.attribution).toMatch(/ODbL/);
  expect(out.nodes[0]).toEqual([1, 40.730123, -73.990123]);
  expect(out.edges[0][2]).toBe(Math.round(out.edges[0][2] * 10) / 10);
  expect(JSON.stringify(out)).not.toMatch(/password|token|apikey|secret/i);
});

test('committed content/walk-graph.v1.json: ends exist, one piece, all 34 places within the limit', () => {
  const root = path.join(__dirname, '..', '..');
  const out = JSON.parse(fs.readFileSync(path.join(root, 'content', 'walk-graph.v1.json'), 'utf8'));
  const stories = JSON.parse(fs.readFileSync(path.join(root, 'content', 'stories.v1.json'), 'utf8'));
  const ids = new Set(out.nodes.map((n: number[]) => n[0]));
  expect(ids.size).toBe(out.nodes.length);
  const seen = new Set<string>();
  const adj = new Map<number, number[]>();
  for (const [a, b, m] of out.edges as number[][]) {
    expect(ids.has(a) && ids.has(b)).toBe(true);
    expect(a).not.toBe(b);
    expect(m).toBeGreaterThan(0);
    const key = `${Math.min(a, b)}-${Math.max(a, b)}`;
    expect(seen.has(key)).toBe(false);
    seen.add(key);
    adj.set(a, [...(adj.get(a) || []), b]);
    adj.set(b, [...(adj.get(b) || []), a]);
  }
  const start = out.nodes[0][0];
  const reached = new Set<number>([start]);
  const queue = [start];
  while (queue.length) {
    const cur = queue.pop() as number;
    for (const nxt of adj.get(cur) || []) if (!reached.has(nxt)) { reached.add(nxt); queue.push(nxt); }
  }
  expect(reached.size).toBe(out.nodes.length);
  const graph = {
    nodes: out.nodes.map((n: number[]) => ({ id: n[0], lat: n[1], lng: n[2] })),
    edges: out.edges.map((e: number[]) => ({ a: e[0], b: e[1], m: e[2] })),
  };
  expect(stories.groups.length).toBe(34);
  const res = lib.checkPlaces(graph, stories.groups, lib.MAX_PLACE_M);
  expect(res.rows.length).toBe(34);
});
