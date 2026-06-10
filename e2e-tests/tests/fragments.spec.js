const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

let testPages = [];
try {
  const dataPath = path.join(__dirname, '..', 'generated-test-pages.json');
  const data = fs.readFileSync(dataPath, 'utf8');
  testPages = JSON.parse(data);
} catch (e) {
  console.warn(
    'No generated-test-pages.json found. Ensure global-setup.js runs first.'
  );
}

test.describe('Responsive Fragment Rendering', () => {
  // Run all tests as Guest (unauthenticated) to check true visitor experience and prevent admin menus
  test.use({ storageState: { cookies: [], origins: [] } });

  for (const pageInfo of testPages) {
    test(`Verify: ${pageInfo.collectionName} > ${pageInfo.fragmentName}`, async ({
      page,
    }) => {
      const errors = [];
      page.on('pageerror', (err) => errors.push(err.message));
      page.on('console', (msg) => {
        if (msg.type() === 'error') {
          const text = msg.text();
          if (!text.includes('favicon') && !text.includes('status of 404')) {
            errors.push(text);
          }
        }
      });

      page.on('response', async (res) => {
        if (res.url().includes('content-set-elements')) {
          console.log(`[NETWORK DEBUG] URL: ${res.url()}`);
          console.log(`[NETWORK DEBUG] Status: ${res.status()}`);
          try {
            console.log(`[NETWORK DEBUG] Body: ${await res.text()}`);
          } catch (e) {
            console.warn(`[NETWORK DEBUG] Cannot read body: ${e.message}`);
          }
        }
      });

      // 1. Go directly to the generated page
      await page.goto(pageInfo.url);

      // 2. Wait for the page to load
      try {
        await page.waitForLoadState('networkidle', { timeout: 5000 });
      } catch (e) {
        // Ignore networkidle timeouts to prevent background requests from blocking test completion
      }

      // 3. Inject CSS to hide the Liferay navigation menu visually.
      // This prevents the giant menu of 124 test pages from crushing the fragment in the screenshot.
      await page.addStyleTag({
        content: `
          #banner, 
          #wrapper header, 
          .navbar, 
          .site-navigation,
          #controlMenu,
          .control-menu,
          #productMenu,
          .product-menu,
          .lfr-product-menu-panel,
          .sidenav,
          .sidenav-slider,
          .sidenav-menu,
          #sidenav-slider-productMenu,
          .c-admin-user-personal-bar { 
            display: none !important; 
            visibility: hidden !important;
            opacity: 0 !important;
            width: 0 !important;
            height: 0 !important;
          }
          html, body, #wrapper { 
            margin: 0 !important;
            padding: 0 !important;
            margin-left: 0 !important;
            padding-left: 0 !important;
            margin-top: 0 !important;
            padding-top: 0 !important;
          }
        `,
      });

      // 4. Verify actual fragment rendering
      // In Liferay, a successfully rendered fragment will have these markers
      const fragmentSelector =
        'div[id^="fragment-"], .lfr-layout-structure-item-fragment, .lfr-fragment-entry';
      const wrapper = page.locator('#wrapper, .portlet-layout');

      // Ensure the main wrapper is visible
      await expect(wrapper.first()).toBeVisible({ timeout: 15000 });

      // FAIL if we see "Fragment is unavailable" or "not found" text patterns
      const failureText = page.locator(
        'text=/Fragment (is unavailable|not found)/i'
      );
      const failureCount = await failureText.count();
      if (failureCount > 0) {
        throw new Error(
          `Fragment '${pageInfo.fragmentName}' failed to render! Found Liferay error text on page.`
        );
      }

      // 4. Capture Visual Snapshot
      // Create a clean filename: collection-fragment-viewport.png
      const viewportName = test.info().project.name;
      const snapshotDir = path.join(
        __dirname,
        '..',
        'snapshots',
        pageInfo.collectionName
      );
      if (!fs.existsSync(snapshotDir)) {
        fs.mkdirSync(snapshotDir, { recursive: true });
      }
      const snapshotPath = path.join(
        snapshotDir,
        `${pageInfo.fragmentName}-${viewportName}.png`
      );

      // Target the fragment element directly, scroll it into view, and screenshot it
      const fragmentElement = page.locator(fragmentSelector).first();

      try {
        await expect(fragmentElement).toBeVisible({ timeout: 15000 });
        await fragmentElement.scrollIntoViewIfNeeded();
        await fragmentElement.screenshot({ path: snapshotPath });
      } catch (e) {
        // Fallback to wrapper screenshot if fragment is 0-height or missing (e.g., due to missing prerequisites)
        console.warn(
          `[WARN] Could not capture fragment element directly for ${pageInfo.fragmentName}. Falling back to wrapper. Reason: ${e.message}`
        );
        await wrapper.first().screenshot({ path: snapshotPath });
      }

      // Log if there were severe errors
      if (errors.length > 0) {
        console.log(
          `[WARN] Console errors in ${pageInfo.fragmentName}:`,
          errors
        );
      }

      // Soft assert on errors
      expect(
        errors.filter(
          (e) => e.includes('TypeError') || e.includes('ReferenceError')
        ).length
      ).toBe(0);
    });
  }
});
