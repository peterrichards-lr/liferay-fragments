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
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.PLAYWRIGHT_WORKERS
    ? parseInt(process.env.PLAYWRIGHT_WORKERS, 10)
    : process.env.CI
      ? 1
      : 2,
  reporter: [['html', { open: 'never' }], ['list']],
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
        deviceScaleFactor: 2,
      },
    },
    {
      name: 'tablet',
      use: {
        ...devices['iPad (gen 7)'],
        browserName: 'chromium',
        userAgent: devices['Desktop Chrome'].userAgent,
        viewport: { width: 768, height: 1024 },
        deviceScaleFactor: 2,
      },
    },
    {
      name: 'mobile',
      use: {
        ...devices['iPhone 13'],
        browserName: 'chromium',
        userAgent: devices['Desktop Chrome'].userAgent,
        viewport: { width: 375, height: 812 },
        deviceScaleFactor: 2,
      },
    },
  ],
});
