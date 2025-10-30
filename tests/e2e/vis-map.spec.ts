import { test, expect } from '@playwright/test';
import { existsSync, mkdirSync } from 'fs';

const BASE_URL = process.env.BASE_URL || 'http://localhost:5000';
const artifactDir = 'docs/artifacts/VIS-1';

test('capture map screenshot for visual smoke', async ({ page }) => {
  // Ensure artifact directory exists
  mkdirSync(artifactDir, { recursive: true });
  
  // Navigate to home page
  await page.goto(BASE_URL + '/');
  
  // Wait for map to be visible
  await expect(page.locator('#map')).toBeVisible();
  
  // Give Leaflet time to fully render tiles
  await page.waitForTimeout(1000);
  
  // Capture screenshot of map element
  await page.locator('#map').screenshot({ path: `${artifactDir}/P14-map.png` });
  
  // Verify screenshot file was created
  expect(existsSync(`${artifactDir}/P14-map.png`)).toBe(true);
});
