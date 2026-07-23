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
    test(`Verify: ${pageInfo.collectionFolder || pageInfo.collectionName} > ${pageInfo.fragmentName}`, async ({
      page,
      baseURL,
    }) => {
      // ─── Unified Failure Accumulator ─────────────────────────────────────────
      // ALL failure signals push to failures[]. No signal is silently swallowed.
      // The screenshot is always attempted so the gallery captures the broken state
      // as evidence. A single expect at the end reports the full list.
      const failures = [];

      // Capture all browser console errors (not just TypeError/ReferenceError).
      // Filter only benign noise (favicon 404s, expected Liferay resource 404s).
      page.on('pageerror', (err) => {
        failures.push(`JS exception: ${err.message}`);
      });
      page.on('console', (msg) => {
        if (msg.type() === 'error') {
          const text = msg.text();
          if (!text.includes('favicon') && !text.includes('status of 404')) {
            failures.push(`Console error: ${text}`);
          }
        }
      });

      // 1. Navigate to the generated test page
      const base = baseURL || process.env.BASE_URL || 'http://localhost:8080';
      const response = await page.goto(base + pageInfo.url);

      // HTTP 4xx/5xx — push to failures (do not throw early, so screenshot still runs)
      if (response) {
        const status = response.status();
        if (status >= 400) {
          failures.push(
            `Page navigation failed with HTTP ${status} for URL: ${pageInfo.url}`
          );
        }
      }

      // 2. Wait for network idle (best-effort — timeout is non-fatal)
      try {
        const idleTimeout = process.env.CI ? 15000 : 5000;
        await page.waitForLoadState('networkidle', { timeout: idleTimeout });
      } catch (e) {
        // Ignore networkidle timeouts — background requests must not block completion
      }

      // 3. Inject CSS to hide Liferay chrome (navigation, footer, control menu)
      const isHeaderComponent =
        pageInfo.collectionFolder === 'header-components' ||
        pageInfo.collectionName === 'Header Components';
      await page.addStyleTag({
        content: `
          ${isHeaderComponent ? '' : '#banner, #wrapper header, .navbar, .site-navigation,'}
          #controlMenu, .control-menu, #productMenu, .product-menu,
          .lfr-product-menu-panel, .sidenav, .sidenav-slider, .sidenav-menu,
          #sidenav-slider-productMenu, .c-admin-user-personal-bar,
          #footer, footer, .footer, #wrapper footer,
          [role="contentinfo"], .powered-by, [id*="footer"], [class*="footer"] {
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
          /* Limit menu items inside responsive menus to prevent screenshot bloating */
          .fragment-menu .navbar-nav > li:nth-child(n+6),
          .fragment-menu .navbar-nav > .nav-item:nth-child(n+6),
          .fragment-menu .navbar-nav > .lfr-nav-item:nth-child(n+6),
          .fragment-menu ul > li:nth-child(n+6) { display: none !important; }
          /* Do not hide nested navbars inside page fragments */
          div[id^="fragment-"] .navbar {
            display: flex !important;
            visibility: visible !important;
            opacity: 1 !important;
            width: auto !important;
            height: auto !important;
          }
        `,
      });

      // 4. Locate fragment element and wrapper
      const fragmentSelector =
        'div[id^="fragment-"], .lfr-layout-structure-item-fragment, .lfr-fragment-entry';
      const wrapper = page.locator('#wrapper, .portlet-layout');

      // Main wrapper must be visible — hard prerequisite
      await expect(wrapper.first()).toBeVisible({ timeout: 15000 });

      // "Fragment is unavailable" — Liferay-rendered error
      const failureText = page.locator(
        'text=/Fragment (is unavailable|not found)/i'
      );
      if ((await failureText.count()) > 0) {
        failures.push(
          `Fragment '${pageInfo.fragmentName}' failed to render — Liferay reported "Fragment is unavailable or not found"`
        );
      }

      // ─── Capture Visual Snapshot ──────────────────────────────────────────────
      if (pageInfo.excludeFromGallery) {
        console.log(
          `[SKIP] Skipping screenshot for ${pageInfo.fragmentName} (excludeFromGallery: true)`
        );
      } else {
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

        // Locate the primary fragment element to screenshot
        let fragmentElement;
        const fragmentCount = await page.locator(fragmentSelector).count();
        if (fragmentCount === 0) {
          failures.push(
            `Fragment '${pageInfo.fragmentName}' was not found on the page (selector: ${fragmentSelector} returned 0 elements)`
          );
        } else {
          if (pageInfo.fragmentName === 'Master Page Header') {
            fragmentElement = page.locator('#wrapper, .portlet-layout').first();
          } else if (fragmentCount > 1) {
            fragmentElement = page
              .locator('.lfr-layout-structure-item-row, .row')
              .first();
          } else {
            fragmentElement = page.locator(fragmentSelector).first();
          }
        }

        if (fragmentElement) {
          // ─── Phase 1: Content-Quality Assertions ───────────────────────────
          // All checks accumulate to failures[]. We do NOT throw early so that
          // every failure is reported and the screenshot is still captured.

          await expect(fragmentElement).toBeVisible({ timeout: 5000 });
          await fragmentElement.scrollIntoViewIfNeeded();

          // Loading spinners — wait for them to disappear
          const loaders = fragmentElement.locator(
            '.loading-animation, .loading-animation-squares, .spinner, ' +
            '.loading-animation-bounce, .loading-animation-dots, ' +
            '[class*="loading-animation"], [class*="spinner"]'
          );
          const loaderCount = await loaders.count();
          for (let i = 0; i < loaderCount; i++) {
            const loader = loaders.nth(i);
            if (await loader.isVisible()) {
              try {
                await expect(loader).toBeHidden({ timeout: 10000 });
              } catch {
                failures.push(
                  `Fragment '${pageInfo.fragmentName}' is stuck in a loading state — spinner remains visible after 10s`
                );
              }
            }
          }

          // Loading text — wait for it to disappear
          const loadingTexts = fragmentElement.locator('text=/Loading/i');
          const loadingTextCount = await loadingTexts.count();
          for (let i = 0; i < loadingTextCount; i++) {
            const loader = loadingTexts.nth(i);
            if (await loader.isVisible()) {
              try {
                await expect(loader).toBeHidden({ timeout: 15000 });
              } catch {
                failures.push(
                  `Fragment '${pageInfo.fragmentName}' is stuck in a loading state — "${await loader.textContent()}" remains visible after 15s`
                );
              }
            }
          }

          // Let rendering settle (leaflet maps, chart animations)
          await page.waitForTimeout(500);

          // Fragment-specific interaction before screenshot
          if (pageInfo.fragmentName === 'Content Map') {
            const marker = page.locator('.leaflet-marker-icon').first();
            await expect(marker).toBeVisible({ timeout: 5000 });
            await marker.click();
            const popup = page.locator('.leaflet-popup-content-wrapper');
            await expect(popup).toBeVisible({ timeout: 5000 });
            await page.waitForTimeout(500);
          }

          if (
            pageInfo.fragmentName === 'Search Bar' ||
            pageInfo.fragmentName === 'Master Page Header'
          ) {
            const btn = page.locator('.btn-search').first();
            if ((await btn.count()) > 0) {
              await btn.click();
              await page.waitForTimeout(500);
            } else {
              await page.evaluate(() => {
                const sb = document.querySelector('#searchBar');
                if (sb) { sb.classList.add('show'); sb.style.display = 'block'; }
              });
            }
            if (pageInfo.fragmentName !== 'Master Page Header') {
              fragmentElement = page
                .locator('.lfr-layout-structure-item-row, .row')
                .first();
            }
          }

          if (pageInfo.fragmentName === 'Search Overlay') {
            const triggerEl = page.locator('.search-trigger').first();
            if ((await triggerEl.count()) > 0) {
              await triggerEl.click();
              await page.waitForTimeout(500);
            }
            fragmentElement = page.locator('#wrapper, .portlet-layout').first();
          }

          // Generic: empty state (applies to all fragments using renderEmptyState)
          // Must run before bounding box — CSS min-height keeps height > 10px even when empty
          const emptyState = fragmentElement.locator('.c-empty-state');
          if (
            (await emptyState.count()) > 0 &&
            (await emptyState.first().isVisible())
          ) {
            failures.push(
              `Fragment '${pageInfo.fragmentName}' rendered an empty state instead of content — ` +
              `data was not loaded (check collection seeding, API permissions, or fragment configuration)`
            );
          }

          // Generic: bounding box height
          const box = await fragmentElement.boundingBox();
          if (!box || box.height <= 10) {
            failures.push(
              `Fragment '${pageInfo.fragmentName}' rendered with insufficient height (${
                box ? box.height : 0
              }px) — it may be empty or failing to render content`
            );
          }

          // ─── Phase 1b: Per-Fragment Verification Block ──────────────────────
          // Each fragment can declare custom success criteria in test-data.json
          // under a "verification" key. This is passed through to pageInfo by
          // global-setup.js. Generic checks above are always applied in addition.
          //
          // Schema:
          //   verification.requiredSelectors: [{ selector, minCount, description }]
          //   verification.forbiddenSelectors: [{ selector, description }]
          const verification = pageInfo.verification;
          if (verification) {
            // Required selectors — must be present and meet minCount threshold
            for (const req of verification.requiredSelectors || []) {
              const found = await fragmentElement
                .locator(req.selector)
                .count();
              const min = req.minCount ?? 1;
              if (found < min) {
                failures.push(
                  `Verification failed — ${req.description}: ` +
                  `required selector '${req.selector}' found ${found} element(s), expected ≥ ${min}`
                );
              }
            }

            // Forbidden selectors — must not be visible
            for (const forb of verification.forbiddenSelectors || []) {
              const el = fragmentElement.locator(forb.selector).first();
              if (
                (await fragmentElement.locator(forb.selector).count()) > 0 &&
                (await el.isVisible())
              ) {
                failures.push(
                  `Verification failed — ${forb.description}: ` +
                  `forbidden selector '${forb.selector}' is visible`
                );
              }
            }
          }

          // ─── Phase 2: Screenshot Capture ────────────────────────────────────
          // Always attempt the screenshot — even if Phase 1 found failures —
          // so the gallery shows the broken state as evidence for diagnosis.
          try {
            await fragmentElement.screenshot({
              path: snapshotPath,
              timeout: 5000,
            });
            const htmlContent = await fragmentElement.evaluate(
              (el) => el.outerHTML
            );
            fs.writeFileSync(htmlPath, htmlContent, 'utf8');
          } catch (e) {
            // Fallback to full wrapper screenshot if element capture fails
            console.warn(
              `[WARN] Element screenshot failed for ${pageInfo.fragmentName}, falling back to wrapper. Reason: ${e.message}`
            );
            try {
              await wrapper.first().screenshot({ path: snapshotPath, timeout: 5000 });
              const fallbackHtml = await wrapper.first().evaluate((el) => el.outerHTML);
              fs.writeFileSync(htmlPath, fallbackHtml, 'utf8');
            } catch (wrapperErr) {
              failures.push(
                `Screenshot capture failed entirely for '${pageInfo.fragmentName}': ${wrapperErr.message}`
              );
            }
          }
        }
      }

      // ─── Final Unified Assertion ──────────────────────────────────────────────
      // Report every accumulated failure in one place so Playwright marks the test
      // as 'failed' and the gallery shows 🔴 Failed (Test) with the full detail.
      if (failures.length > 0) {
        const report =
          `Fragment '${pageInfo.fragmentName}' failed verification with ${failures.length} issue(s):\n` +
          failures.map((f, i) => `  ${i + 1}. ${f}`).join('\n');
        throw new Error(report);
      }
    });
  }
});
