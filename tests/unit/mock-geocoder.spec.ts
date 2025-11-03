import { test, expect } from '@playwright/test';

test('GEO-ADAPTER-1b-a — MockGeocoder contract', async ({ page }) => {
  await page.goto('/');

  const summary = await page.evaluate(async () => {
    const w = window as any;
    const geo = w.App?.adapters?.geo;
    if (!geo || typeof geo.search !== 'function') throw new Error('Geo adapter missing');

    const safeSearch = async (value: string) => {
      const originalFetch = window.fetch;
      window.fetch = () => {
        throw new Error('GeoAdapter must not call fetch');
      };
      try {
        const results = await geo.search(value);
        return results.map((item: any) => ({
          label: item?.label,
          lat: item?.lat,
          lng: item?.lng,
        }));
      } finally {
        window.fetch = originalFetch;
      }
    };

    const current = { data: null as any, error: null as string | null };
    if (typeof geo.current === 'function') {
      try {
        current.data = await geo.current();
      } catch (error: any) {
        current.error = error?.message ?? String(error);
      }
    } else {
      current.error = 'missing';
    }

    return {
      address: await safeSearch('666 FIFTH ave'),
      place: await safeSearch('penn station'),
      intersectionAnd: await safeSearch('45th street and 2nd avenue'),
      intersectionAmp: await safeSearch('45th & 2nd'),
      blank: await safeSearch('   '),
      current,
    };
  });

  const address = [{ label: '666 Fifth Avenue', lat: 40.7616, lng: -73.9747 }];
  const place = [{ label: 'Penn Station', lat: 40.7506, lng: -73.9935 }];
  const intersection = [{ label: '45th St & 2nd Ave', lat: 40.7526, lng: -73.9718 }];
  const current = { lat: 40.758, lng: -73.9855, label: 'Current location' };

  expect(summary.address).toEqual(address);
  expect(summary.place).toEqual(place);
  expect(summary.intersectionAnd).toEqual(intersection);
  expect(summary.intersectionAmp).toEqual(intersection);
  expect(summary.blank).toEqual([]);
  expect(summary.current.error).toBeNull();
  expect(summary.current.data).toEqual(current);
});
