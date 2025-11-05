import { Page, Route } from '@playwright/test';

type FixtureOptions<T> = {
  payload: T;
  once?: boolean;
};

type Predicate = (url: string) => boolean;

const GEO_KEYWORDS = ['/geocode', '/places', 'geocoding'];
const ROUTE_KEYWORDS = ['/route', '/directions', 'computeroutes'];
const QUERY_HINT = /[?&]q=/i;

const createMatcher = (keywords: string[], extra?: RegExp): Predicate => {
  return (url: string) => {
    const lower = url.toLowerCase();
    return keywords.some((part) => lower.includes(part)) || (extra ? extra.test(url) : false);
  };
};

const fulfillJson = async (route: Route, payload: unknown) => {
  await route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify(payload),
  });
};

const installFixture = async <T>(page: Page, predicate: Predicate, options: FixtureOptions<T>) => {
  const { payload, once = false } = options;
  const handler = async (route: Route) => {
    const url = route.request().url();
    if (predicate(url)) {
      await fulfillJson(route, payload);
      if (once) {
        await page.unroute('**/*', handler);
      }
      return;
    }

    await route.fallback();
  };

  await page.route('**/*', handler);

  return async () => {
    try {
      await page.unroute('**/*', handler);
    } catch {
      /* ignore double unroute */
    }
  };
};

export const useGeoFixture = async <T>(page: Page, options: FixtureOptions<T>) =>
  installFixture(page, createMatcher(GEO_KEYWORDS, QUERY_HINT), options);

export const useRouteFixture = async <T>(page: Page, options: FixtureOptions<T>) =>
  installFixture(page, createMatcher(ROUTE_KEYWORDS), options);
