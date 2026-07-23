// playwright.config.js
import { defineConfig, devices } from '@playwright/test';
import fs from 'fs';

let resolvedBaseUrl = process.env.BASE_URL;
if (!resolvedBaseUrl) {
  if (fs.existsSync('resolved_base_url.txt')) {
    resolvedBaseUrl = fs.readFileSync('resolved_base_url.txt', 'utf8').trim();
  } else if (fs.existsSync('e2e-tests/resolved_base_url.txt')) {
    resolvedBaseUrl = fs
      .readFileSync('e2e-tests/resolved_base_url.txt', 'utf8')
      .trim();
  }
}

export default defineConfig({
  testDir: './tests',
  // Issue #133: Global timeout cap prevents a single stuck test from hanging
  // the entire GitHub Actions job until the 6-hour runner limit is hit.
  // 90 minutes gives ample headroom above the typical ~40-minute run time.
  globalTimeout: 90 * 60 * 1000,
  // Per-test timeout increased from default 30s to 90s for slow CI runners.
  timeout: 90 * 1000,
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.PLAYWRIGHT_WORKERS
    ? parseInt(process.env.PLAYWRIGHT_WORKERS, 10)
    : process.env.CI
      ? 1
      : 2,
  reporter: [
    ['html', { open: 'never' }],
    ['list'],
    ['json', { outputFile: 'playwright-results.json' }],
  ],
  globalSetup: require.resolve('./tests/global-setup'),
  globalTeardown: require.resolve('./tests/global-teardown'),
  use: {
    baseURL: resolvedBaseUrl || 'http://localhost:8080',
    trace: 'on-first-retry',
    storageState: './state.json',
    ignoreHTTPSErrors: true,
    serviceWorkers: 'block',
  },
  projects: [
    {
      name: 'desktop',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1920, height: 1080 },
        deviceScaleFactor: 1,
      },
    },
    {
      name: 'tablet',
      use: {
        ...devices['iPad (gen 7)'],
        browserName: 'chromium',
        userAgent: devices['Desktop Chrome'].userAgent,
        viewport: { width: 768, height: 1024 },
        deviceScaleFactor: 1,
      },
    },
    {
      name: 'mobile',
      use: {
        ...devices['iPhone 13'],
        browserName: 'chromium',
        userAgent: devices['Desktop Chrome'].userAgent,
        viewport: { width: 375, height: 812 },
        deviceScaleFactor: 1,
      },
    },
  ],
});
