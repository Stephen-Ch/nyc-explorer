import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright configuration for NYC Explorer
 * Auto-starts ASP.NET Core server on http://localhost:5000
 */
export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'list',

  use: {
    baseURL: process.env.BASE_URL || 'http://localhost:5000',
    viewport: { width: 1280, height: 800 },
    trace: 'on-first-retry',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  webServer: {
    command: 'dotnet run --urls http://localhost:5000',
    url: 'http://localhost:5000',
    reuseExistingServer: true,
    timeout: 120000,
    cwd: 'apps/web-mvc',
  },
});
