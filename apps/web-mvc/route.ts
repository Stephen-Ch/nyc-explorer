
export type RouteOptions = {
  tags?: string[];
  era?: string | null;
};

export function buildRoute(pois: any[], opts: RouteOptions = {}) {
  const { tags } = opts;
  const tagSet = tags && tags.length > 0 ? new Set(tags) : null;

  const filtered = tagSet
    ? pois.filter(poi => Array.isArray(poi.tags) && poi.tags.some((tag: string) => tagSet.has(tag)))
    : [...pois];

  const sorted = filtered.sort((a, b) => {
    const routeA = a.route_id ?? 'zzz';
    const routeB = b.route_id ?? 'zzz';
    if (routeA !== routeB) {
      return routeA.localeCompare(routeB);
    }

    const orderA = typeof a.order === 'number' ? a.order : 999999;
    const orderB = typeof b.order === 'number' ? b.order : 999999;
    if (orderA !== orderB) {
      return orderA - orderB;
    }

    const nameA = (a.name ?? '').toString();
    const nameB = (b.name ?? '').toString();
    return nameA.localeCompare(nameB);
  });

  const capped: any[] = [];
  const seen = new Map<string, number>();

  for (const poi of sorted) {
    const block = typeof poi.block === 'string' ? poi.block : '';
    const count = seen.get(block) ?? 0;
    if (count >= 3) {
      continue;
    }

    seen.set(block, count + 1);
    capped.push(poi);
  }

  return capped;
}

export type RouteItem = {
  id: string;
  name: string;
  coords?: { lat: number; lng: number } | null;
  route_id?: string | null;
  order?: number | null;
};

const getRouteId = (poi: RouteItem) => {
  const value = typeof poi.route_id === 'string' ? poi.route_id.trim() : '';
  return value.length ? value : null;
};

const hasCoords = (poi: RouteItem) => {
  const coords = poi.coords;
  if (!coords) {
    return false;
  }

  return typeof coords.lat === 'number' && typeof coords.lng === 'number';
};

const compareRouteOrder = (a: RouteItem, b: RouteItem) => {
  const orderA = typeof a.order === 'number' ? a.order : null;
  const orderB = typeof b.order === 'number' ? b.order : null;
  if (orderA !== null && orderB !== null && orderA !== orderB) {
    return orderA - orderB;
  }

  const nameA = (a.name ?? '').toString();
  const nameB = (b.name ?? '').toString();
  return nameA.localeCompare(nameB);
};

export function routeSegment<T extends RouteItem>(fromId: string, toId: string, items: ReadonlyArray<T>): T[] {
  const from = items.find(poi => poi.id === fromId);
  const to = items.find(poi => poi.id === toId);
  const fromRouteId = from ? getRouteId(from) : null;
  const toRouteId = to ? getRouteId(to) : null;
  if (!fromRouteId || !toRouteId || toRouteId !== fromRouteId) {
    return [];
  }

  const routeList = items
    .filter((poi): poi is T => getRouteId(poi) === fromRouteId && hasCoords(poi))
    .slice()
    .sort((a, b) => compareRouteOrder(a, b));

  const start = routeList.findIndex(poi => poi.id === fromId);
  const end = routeList.findIndex(poi => poi.id === toId);

  if (start === -1 || end === -1) {
    return [];
  }

  const lo = Math.min(start, end);
  const hi = Math.max(start, end);
  const slice = routeList.slice(lo, hi + 1);
  return start <= end ? slice : slice.reverse();
}
