import { test, expect } from '@playwright/test';

const BASE_URL = process.env.BASE_URL || 'http://localhost:5000';

test('home page loads Leaflet and renders ≥3 markers', async ({ page }) => {
  // Navigate to home page
  const response = await page.goto(BASE_URL);
  
  if (!response || !response.ok()) {
    throw new Error(`Navigation failed: ${response?.status()} at ${BASE_URL}`);
  }

  // Check if Leaflet is loaded
  const leafletLoaded = await page.evaluate(() => {
    return typeof (window as any).L === 'object';
  });

  if (!leafletLoaded) {
    throw new Error('Leaflet not loaded');
  }

  // Check for Leaflet marker icons
  const markerSelector = '.leaflet-marker-icon';
  
  try {
    const markers = page.locator(markerSelector);
    const markerCount = await markers.count();

    if (markerCount < 3) {
      throw new Error(`Expected ≥3 Leaflet markers, found ${markerCount}`);
    }

    // Verify markers are visible
    await expect(markers.first()).toBeVisible();
  } catch (error: any) {
    if (error.message.includes('Expected')) {
      throw error;
    }
    throw new Error(`Selector lookup failed for "${markerSelector}": ${error.message}`);
  }
});
