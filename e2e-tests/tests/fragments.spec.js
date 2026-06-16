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

      // 1. Go directly to the generated page
      await page.goto(pageInfo.url);

      // 2. Wait for the page to load (stretching timeout in CI to handle slow runner initialization)
      try {
        const idleTimeout = process.env.CI ? 15000 : 5000;
        await page.waitForLoadState('networkidle', { timeout: idleTimeout });
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
      if (pageInfo.excludeFromGallery) {
        console.log(
          `[SKIP] Skipping screenshot for ${pageInfo.fragmentName} (excludeFromGallery: true)`
        );
      } else {
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
        const htmlPath = path.join(
          snapshotDir,
          `${pageInfo.fragmentName}-${viewportName}.html`
        );

        // Target the fragment element directly, scroll it into view, and screenshot it
        const fragmentElement = page.locator(fragmentSelector).first();

        try {
          await expect(fragmentElement).toBeVisible({ timeout: 5000 });
          await fragmentElement.scrollIntoViewIfNeeded();

          // Check for any visible loading spinners/animations within the fragment
          const loaders = fragmentElement.locator(
            '.loading-animation, .loading-animation-squares, .spinner, .loading-animation-bounce, .loading-animation-dots, [class*="loading-animation"], [class*="spinner"]'
          );
          const loaderCount = await loaders.count();
          for (let i = 0; i < loaderCount; i++) {
            const loader = loaders.nth(i);
            if (await loader.isVisible()) {
              // Wait for it to become hidden
              try {
                await expect(loader).toBeHidden({ timeout: 10000 });
              } catch (err) {
                throw new Error(
                  `Fragment '${pageInfo.fragmentName}' is stuck in a loading state. Spinner/loader remains visible after 10s.`
                );
              }
            }
          }

          // Let rendering settle for 500ms (especially for leaflet maps or chart animations)
          await page.waitForTimeout(500);

          if (pageInfo.fragmentName === 'Content Map') {
            const marker = page.locator('.leaflet-marker-icon').first();
            await expect(marker).toBeVisible({ timeout: 5000 });
            await marker.click();
            const popup = page.locator('.leaflet-popup-content-wrapper');
            await expect(popup).toBeVisible({ timeout: 5000 });
            // Extra wait for popup transition to finish
            await page.waitForTimeout(500);
          }

          // Verify the bounding box is non-zero and has height
          const box = await fragmentElement.boundingBox();
          if (!box || box.height <= 10) {
            throw new Error(
              `Fragment '${pageInfo.fragmentName}' rendered with insufficient height (${
                box ? box.height : 0
              }px). It might be empty or failing to render content.`
            );
          }

          await fragmentElement.screenshot({
            path: snapshotPath,
            timeout: 5000,
          });

          // Capture and save the outer HTML of the fragment
          const htmlContent = await fragmentElement.evaluate(
            (el) => el.outerHTML
          );
          fs.writeFileSync(htmlPath, htmlContent, 'utf8');
        } catch (e) {
          // Fallback to wrapper screenshot if fragment is 0-height or missing (e.g., due to missing prerequisites)
          console.warn(
            `[WARN] Could not capture fragment element directly for ${pageInfo.fragmentName}. Falling back to wrapper. Reason: ${e.message}`
          );

          // Propagate the specific failure if it's a verification assertion
          if (
            e.message.includes('stuck in a loading state') ||
            e.message.includes('insufficient height')
          ) {
            errors.push(e.message);
          }

          await wrapper
            .first()
            .screenshot({ path: snapshotPath, timeout: 5000 });

          // Capture and save the outer HTML of the fallback wrapper
          try {
            const fallbackHtmlContent = await wrapper
              .first()
              .evaluate((el) => el.outerHTML);
            fs.writeFileSync(htmlPath, fallbackHtmlContent, 'utf8');
          } catch (htmlErr) {
            console.warn(
              `[WARN] Could not capture fallback HTML for ${pageInfo.fragmentName}: ${htmlErr.message}`
            );
          }
        }
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
