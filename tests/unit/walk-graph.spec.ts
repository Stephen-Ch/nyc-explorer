import { test, expect } from '@playwright/test';
import * as path from 'path';

// Plan 41 slice 1b step 1: walk graph builder (tools/walk-graph, CommonJS).
// eslint-disable-next-line @typescript-eslint/no-var-requires
const lib = require(path.join(__dirname, '..', '..', 'tools', 'walk-graph', 'lib.js'));

// Tiny fixture: nodes on a north-south line ~111 m apart (0.001 deg lat).
const LNG = -73.99;
const node = (id: number, lat: number, lng = LNG) => ({ type: 'node', id, lat, lon: lng });
const way = (id: number, nodes: number[], tags: Record<string, string>) => ({ type: 'way', id, nodes, tags });
const BOX = { minLat: 40.0, maxLat: 41.0, minLng: -74.5, maxLng: -73.5 };

const fixture = (elements: unknown[]) => ({ elements });

test('keeps street kinds, skips footway, service, cycleway', () => {
  const osm = fixture([
    node(1, 40.730), node(2, 40.731), node(3, 40.732), node(4, 40.733), node(5, 40.734),
    way(10, [1, 2], { highway: 'residential' }),
    way(11, [2, 3], { highway: 'footway' }),
    way(12, [3, 4], { highway: 'service' }),
    way(13, [4, 5], { highway: 'cycleway' }),
  ]);
  const g = lib.buildGraph(osm, { box: BOX });
  expect(g.edges.length).toBe(1);
  expect(g.nodes.map((n: { id: number }) => n.id).sort()).toEqual([1, 2]);
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
    node(1, 40.730), node(2, 40.731), node(3, 40.732),
    node(7, 40.735, -73.98), node(8, 40.736, -73.98),
    way(10, [1, 2, 3], { highway: 'residential' }),
    way(11, [7, 8], { highway: 'residential' }),
  ]);
  const g = lib.buildGraph(osm, { box: BOX });
  expect(g.nodes.length).toBe(3);
  expect(g.dropped.pieces).toBe(1);
  expect(g.dropped.nodes).toBe(2);
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

test('checkPlaces stops when a place is over 150 m from any street', () => {
  const osm = fixture([node(1, 40.730), node(2, 40.731), way(10, [1, 2], { highway: 'residential' })]);
  const g = lib.buildGraph(osm, { box: BOX });
  const near = [{ id: 'near', name: 'Near', lat: 40.7305, lng: LNG + 0.0005 }];
  const far = [{ id: 'far', name: 'Far', lat: 40.7305, lng: LNG + 0.003 }];
  expect(lib.checkPlaces(g, near, 150).worst.id).toBe('near');
  expect(() => lib.checkPlaces(g, far, 150)).toThrow(/far/);
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
