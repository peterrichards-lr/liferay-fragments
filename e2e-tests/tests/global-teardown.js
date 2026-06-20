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

  const { baseURL, storageState } = config.projects[0].use;
  const testPages = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

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

  console.log('Retrieving CSRF token for layout deletion...');
  let pAuthToken = '';
  try {
    const tokenResp = await apiContext.get('/api/jsonws');
    if (tokenResp.ok()) {
      const tokenHtml = await tokenResp.text();
      const tokenMatch = tokenHtml.match(/authToken:\s*['"](.*?)['"]/);
      if (tokenMatch) {
        pAuthToken = tokenMatch[1];
        console.log(`  -> Retrieved CSRF Token: ${pAuthToken}`);
      }
    }
  } catch (e) {
    console.warn(
      '  [WARN] Failed to retrieve CSRF token from /api/jsonws:',
      e.message
    );
  }

  console.log('Cleaning up programmatically created test pages...');

  for (const pageInfo of testPages) {
    if (!pageInfo.id) continue;

    try {
      const deleteResp = await apiContext.post(
        `/api/jsonws/layout/delete-layout?p_auth=${pAuthToken}`,
        {
          form: {
            plid: pageInfo.id,
          },
        }
      );

      if (deleteResp.ok()) {
        console.log(
          `  -> Deleted page: ${pageInfo.fragmentName} (${pageInfo.id})`
        );
      } else {
        const body = await deleteResp.text();
        console.warn(
          `  [WARN] Failed to delete page ${pageInfo.id}: ${deleteResp.status()} - ${body}`
        );
      }
    } catch (e) {
      console.error(
        `  [ERROR] Exception while deleting page ${pageInfo.id}:`,
        e
      );
    }

    // Tiny delay to avoid flooding the API
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

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

  // Dispose of the request API context to release all connection pools/keep-alive handles cleanly
  await apiContext.dispose();

  console.log('Cleanup complete.');
}

module.exports = globalTeardown;
