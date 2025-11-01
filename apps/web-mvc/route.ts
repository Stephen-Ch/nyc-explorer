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
