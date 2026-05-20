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

      // 2. Wait for the page to load
      await page.waitForLoadState('networkidle');

      // 3. Verify actual fragment rendering
      // In Liferay, a successfully rendered fragment will have these markers
      const fragmentSelector =
        '.lfr-layout-structure-item-fragment, .lfr-fragment-entry';
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

      // We take a screenshot of the main wrapper area
      await wrapper.first().screenshot({ path: snapshotPath });

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
