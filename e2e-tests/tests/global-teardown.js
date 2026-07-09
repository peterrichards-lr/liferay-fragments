// tests/global-teardown.js
const { request } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

async function globalTeardown(config) {
  if (process.env.KEEP_ALIVE === 'true' || process.env.KEEP_ALIVE === '1') {
    console.log('KEEP_ALIVE is active: Skipping cleanup of test pages.');
    return;
  }

  // Only teardown if we have the generated pages manifest
  const dataPath = path.join(__dirname, '..', 'generated-test-pages.json');
  if (!fs.existsSync(dataPath)) {
    return;
  }

  const baseURL =
    process.env.BASE_URL ||
    config.projects[0].use?.baseURL ||
    config.use?.baseURL ||
    'http://localhost:8080';
  const { storageState } = config.projects[0].use;
  const liferayUser = process.env.LIFERAY_USER || 'test@liferay.com';
  const liferayPassword = process.env.LIFERAY_PASSWORD || 'test';
  const basicAuth = Buffer.from(`${liferayUser}:${liferayPassword}`).toString(
    'base64'
  );

  const apiContext = await request.newContext({
    baseURL,
    storageState,
    extraHTTPHeaders: {
      Authorization: `Basic ${basicAuth}`,
    },
    ignoreHTTPSErrors: true,
  });

  // Delete the dedicated E2E site to clean up all pages, layouts, and site scoped data
  try {
    console.log('Deleting dedicated E2E Site: FRAGMENTS_E2E_TEST_SITE...');
    const deleteSiteResp = await apiContext.delete(
      '/o/headless-admin-site/v1.0/sites/FRAGMENTS_E2E_TEST_SITE'
    );
    if (deleteSiteResp.ok()) {
      console.log('  -> Successfully deleted E2E Site.');
    } else {
      console.warn(
        `  -> [WARN] Failed to delete E2E Site: ${deleteSiteResp.status()} - ${await deleteSiteResp.text()}`
      );
    }
  } catch (e) {
    console.error('  -> [ERROR] Exception while deleting E2E Site:', e.message);
  }

  // Clean up the manifest file
  try {
    if (fs.existsSync(dataPath)) {
      fs.unlinkSync(dataPath);
      console.log('  -> Cleaned up generated-test-pages.json manifest.');
    }
  } catch (e) {
    console.warn(
      '  -> [WARN] Failed to delete generated-test-pages.json manifest:',
      e.message
    );
  }

  // Dispose of the request API context to release all connection pools/keep-alive handles cleanly
  await apiContext.dispose();

  console.log('Cleanup complete.');
}

module.exports = globalTeardown;
