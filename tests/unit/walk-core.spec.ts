import { test, expect } from '@playwright/test';
import * as path from 'path';
import * as fs from 'fs';

// Plan 41 slice 1b step 2: pure walk functions (apps/web-mvc/wwwroot/js/walk-core.js).
// walk-core.js ends with `if (typeof module !== 'undefined') module.exports = {...}`, so it loads here with require().
// eslint-disable-next-line @typescript-eslint/no-var-requires
const W = require(path.join(__dirname, '..', '..', 'apps', 'web-mvc', 'wwwroot', 'js', 'walk-core.js'));

// Local flat metres around a centre point, turned into lat/lng (same idea as the app's own projection).
const R = 6371008.8;
const LAT0 = 40.7359;
const LNG0 = -73.9906;
const ll = (x: number, y: number): [number, number] => [
  LAT0 + (y / R) * (180 / Math.PI),
  LNG0 + (x / (R * Math.cos((LAT0 * Math.PI) / 180))) * (180 / Math.PI),
];

type Pt = [number, number];
// Builds a walk-graph JSON ({ nodes: [id, lat, lng][], edges: [a, b, metres][] }) from points in metres.
const graphJson = (pts: Record<number, Pt>, links: [number, number][]) => ({
  version: 1,
  attribution: 'unit fixture',
  nodes: Object.entries(pts).map(([id, [x, y]]) => [Number(id), ...ll(x, y)]),
  edges: links.map(([a, b]) => [a, b, Math.hypot(pts[a][0] - pts[b][0], pts[a][1] - pts[b][1])]),
});
const place = (id: string, name: string, x: number, y: number, count = 1) => {
  const [lat, lng] = ll(x, y);
  return { id, name, lat, lng, approx: false, stories: Array.from({ length: count }, (_, i) => ({ id: `${id}-${i}` })) };
};
const names = (r: { list: { name: string }[] }) => r.list.map((p) => p.name);

// A straight street from (0,0) to (0,400) in 4 blocks of 100 m.
const LINE = graphJson(
  { 1: [0, 0], 2: [0, 100], 3: [0, 200], 4: [0, 300], 5: [0, 400] },
  [[1, 2], [2, 3], [3, 4], [4, 5]],
);

test('exports the named settings: near = 50 m (D9), tie = 1 m', () => {
  expect(W.NEAR_METRES).toBe(50);
  expect(W.TIE_METRES).toBe(1);
});

test('snap goes to the nearest point on a street, not the nearest corner', () => {
  const g = W.prepareGraph(LINE);
  const [lat, lng] = ll(20, 150); // 20 m east of the street, halfway between corners 2 and 3
  const s = W.snap(g, lat, lng);
  expect(s.metres).toBeGreaterThan(19);
  expect(s.metres).toBeLessThan(21);
  const [elat, elng] = ll(0, 150);
  expect(Math.abs(s.lat - elat)).toBeLessThan(0.00002);
  expect(Math.abs(s.lng - elng)).toBeLessThan(0.00002);
  expect([s.a, s.b].sort()).toEqual([2, 3]);
  expect(s.t).toBeGreaterThan(0.45);
  expect(s.t).toBeLessThan(0.55);
});

test('pin just inside 50 m is listed, just outside is not', () => {
  const g = W.prepareGraph(LINE);
  const groups = [
    place('a', 'Start', 0, 10),
    place('in', 'Inside', 45, 200),
    place('out', 'Outside', 55, 200),
    place('b', 'End', 0, 390),
  ];
  const r = W.planWalk(g, groups, 'a', 'b');
  expect(r.ok).toBe(true);
  expect(names(r)).toEqual(['Start', 'Inside', 'End']);
});

test('list is in walk order, From first and To last', () => {
  const g = W.prepareGraph(LINE);
  const groups = [
    place('late', 'Aaa Late', 10, 300),
    place('a', 'Start', 0, 10),
    place('early', 'Zzz Early', -10, 100),
    place('b', 'End', 0, 390),
  ];
  const r = W.planWalk(g, groups, 'a', 'b');
  expect(names(r)).toEqual(['Start', 'Zzz Early', 'Aaa Late', 'End']);
  // Reversed walk reverses the order.
  const back = W.planWalk(g, groups, 'b', 'a');
  expect(names(back)).toEqual(['End', 'Aaa Late', 'Zzz Early', 'Start']);
});

test('places at the same spot along the walk (within 1 m): nearer first (whole metres), then by name', () => {
  const g = W.prepareGraph(LINE);
  const groups = [
    place('a', 'Start', 0, 10),
    place('far2', 'Bravo', -30, 200),
    place('far1', 'Alpha', 30, 200),
    place('near', 'Zulu', 10, 200.5),
    place('b', 'End', 0, 390),
  ];
  const r = W.planWalk(g, groups, 'a', 'b');
  expect(names(r)).toEqual(['Start', 'Zulu', 'Alpha', 'Bravo', 'End']);
});

test('shortest of two paths is chosen', () => {
  // Square loop: west side short (straight), east side a long detour.
  const g = W.prepareGraph(
    graphJson(
      { 1: [0, 0], 2: [0, 200], 3: [300, 0], 4: [300, 200] },
      [[1, 2], [1, 3], [3, 4], [4, 2]],
    ),
  );
  const groups = [place('a', 'South', 0, 5), place('b', 'North', 0, 195), place('east', 'East Side', 300, 100)];
  const r = W.planWalk(g, groups, 'a', 'b');
  expect(r.ok).toBe(true);
  expect(r.metres).toBeGreaterThan(185);
  expect(r.metres).toBeLessThan(195);
  expect(names(r)).toEqual(['South', 'North']);
});

test('no path between two street pieces returns no-walk', () => {
  const g = W.prepareGraph(
    graphJson({ 1: [0, 0], 2: [0, 100], 3: [500, 0], 4: [500, 100] }, [[1, 2], [3, 4]]),
  );
  const groups = [place('a', 'West', 0, 50), place('b', 'East', 500, 50)];
  expect(W.planWalk(g, groups, 'a', 'b')).toEqual({ ok: false, reason: 'no-walk' });
});

test('same place twice returns same-place; unknown id returns unknown-place', () => {
  const g = W.prepareGraph(LINE);
  const groups = [place('a', 'Start', 0, 10), place('b', 'End', 0, 390)];
  expect(W.planWalk(g, groups, 'a', 'a')).toEqual({ ok: false, reason: 'same-place' });
  expect(W.planWalk(g, groups, 'a', 'nope')).toEqual({ ok: false, reason: 'unknown-place' });
});

test('From and To on the same street block walk straight between them (no detour to a corner)', () => {
  const g = W.prepareGraph(LINE);
  const groups = [place('a', 'Lower', 5, 130), place('b', 'Upper', -5, 170)];
  const r = W.planWalk(g, groups, 'a', 'b');
  expect(r.ok).toBe(true);
  expect(r.metres).toBeGreaterThan(38);
  expect(r.metres).toBeLessThan(42);
  expect(r.line.length).toBe(2);
});

test('From and To are listed even when more than 50 m from the street', () => {
  const g = W.prepareGraph(LINE);
  const groups = [place('a', 'Far Start', 70, 20), place('b', 'Far End', -80, 380)];
  const r = W.planWalk(g, groups, 'a', 'b');
  expect(r.ok).toBe(true);
  expect(names(r)).toEqual(['Far Start', 'Far End']);
});

test('line starts and ends at the snapped points and follows the corners between', () => {
  const g = W.prepareGraph(LINE);
  const groups = [place('a', 'Start', 6, 50), place('b', 'End', -6, 250)];
  const r = W.planWalk(g, groups, 'a', 'b');
  expect(r.line.length).toBe(4); // snapped start, corner 2, corner 3, snapped end
  const [s0lat] = ll(0, 50);
  const [e0lat] = ll(0, 250);
  expect(Math.abs(r.line[0][0] - s0lat)).toBeLessThan(0.00002);
  expect(Math.abs(r.line[3][0] - e0lat)).toBeLessThan(0.00002);
});

test('list items carry id, name and story count', () => {
  const g = W.prepareGraph(LINE);
  const groups = [place('a', 'Start', 0, 10, 2), place('mid', 'Middle', 10, 200, 3), place('b', 'End', 0, 390)];
  const r = W.planWalk(g, groups, 'a', 'b');
  expect(r.list.map((p: { id: string; count: number }) => [p.id, p.count])).toEqual([
    ['a', 2],
    ['mid', 3],
    ['b', 1],
  ]);
});

test('node ids bigger than 2^31 work (real OSM ids reach 14,349,754,185)', () => {
  const big = 14349754185;
  const g = W.prepareGraph(
    graphJson({ [big]: [0, 0], [big + 1]: [0, 100], [big + 2]: [0, 200] } as Record<number, Pt>, [
      [big, big + 1],
      [big + 1, big + 2],
    ]),
  );
  const groups = [place('a', 'Start', 0, 10), place('b', 'End', 0, 190)];
  const r = W.planWalk(g, groups, 'a', 'b');
  expect(r.ok).toBe(true);
  expect(r.line.length).toBe(3);
});

test('real walk-graph file: every pair of the first 5 real 1877 places has a walk', () => {
  const root = path.join(__dirname, '..', '..');
  const g = W.prepareGraph(JSON.parse(fs.readFileSync(path.join(root, 'content', 'walk-graph.v1.json'), 'utf8')));
  const groups = JSON.parse(fs.readFileSync(path.join(root, 'content', 'stories.v1.json'), 'utf8')).groups.slice(0, 5);
  for (const a of groups) {
    for (const b of groups) {
      if (a.id === b.id) continue;
      const r = W.planWalk(g, groups, a.id, b.id);
      expect(r.ok, `${a.id} -> ${b.id}`).toBe(true);
      expect(r.list[0].id).toBe(a.id);
      expect(r.list[r.list.length - 1].id).toBe(b.id);
    }
  }
});
