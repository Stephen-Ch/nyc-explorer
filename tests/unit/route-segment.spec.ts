import { test, expect } from '@playwright/test';
import { routeSegment } from '../../apps/web-mvc/route';

type Poi = {
  id: string;
  name: string;
  route_id?: string;
  order?: number;
  block?: string;
  coords?: { lat: number; lng: number };
};

const pois: Poi[] = [
  { id: 'poi-alpha', name: 'Alpha', route_id: 'USQ-core-001', order: 1, block: 'B1', coords: { lat: 0, lng: 0 } },
  { id: 'poi-bravo', name: 'Bravo', route_id: 'USQ-core-001', order: 2, block: 'B1', coords: { lat: 0, lng: 0 } },
  { id: 'poi-charlie', name: 'Charlie', route_id: 'USQ-core-001', block: 'B2', coords: { lat: 0, lng: 0 } },
  { id: 'poi-delta', name: 'Delta', route_id: 'USQ-core-001', order: 4, block: 'B2', coords: { lat: 0, lng: 0 } },
  { id: 'poi-echo', name: 'Echo', route_id: 'USQ-core-001', block: 'B3', coords: { lat: 0, lng: 0 } },
  { id: 'poi-foxtrot', name: 'Foxtrot', route_id: '', order: 6, block: 'B3', coords: { lat: 0, lng: 0 } },
  { id: 'poi-golf', name: 'Golf', route_id: 'USQ-core-001', block: 'B4' },
  { id: 'poi-hotel', name: 'Hotel', route_id: 'USQ-core-001', block: 'B4', coords: { lat: 0, lng: 0 } }
];

const ids = (list: Poi[]) => list.map((poi) => poi.id);

test('returns ascending segment when From precedes To', () => {
  const segment = routeSegment('poi-alpha', 'poi-delta', pois);
  expect(ids(segment), 'expected ids alpha→delta').toEqual(['poi-alpha', 'poi-bravo', 'poi-charlie', 'poi-delta']);
});

test('returns descending segment when From follows To', () => {
  const segment = routeSegment('poi-delta', 'poi-bravo', pois);
  expect(ids(segment), 'expected ids delta→bravo').toEqual(['poi-delta', 'poi-charlie', 'poi-bravo']);
});

test('missing order falls back to deterministic name sort', () => {
  const segment = routeSegment('poi-charlie', 'poi-hotel', pois);
  expect(ids(segment).indexOf('poi-charlie')).toBeLessThan(ids(segment).indexOf('poi-hotel'));
});

test('ignores blank route ids and coord-less POIs without throwing', () => {
  const segment = routeSegment('poi-alpha', 'poi-hotel', pois);
  expect(ids(segment), 'expected filtered ids without blanks/coordless').not.toContain('poi-foxtrot');
  expect(ids(segment)).not.toContain('poi-golf');
});
