const { chromium } = require('@playwright/test');
const path = require('path');

(async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext({
    storageState: 'e2e-tests/state.json',
  });
  const page = await context.newPage();

  await page.goto(
    'http://localhost:8080/group/guest/~/control_panel/manage?p_p_id=com_liferay_fragment_web_portlet_FragmentPortlet'
  );
  await page.waitForLoadState('networkidle');

  // Open the menu
  const menuButton = page.locator('.management-bar button').first();
  await menuButton.click();
  await page.waitForTimeout(500);

  // Click Import
  await page.getByText('Import', { exact: true }).click();
  await page.waitForTimeout(1000);

  // Take a screenshot of the import dialog
  await page.screenshot({ path: 'import-dialog.png' });

  // Look for the file input
  const fileInput = page.locator('input[type="file"]');
  console.log('File inputs found:', await fileInput.count());

  await browser.close();
})();
