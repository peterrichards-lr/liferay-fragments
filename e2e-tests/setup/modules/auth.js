const { chromium } = require('@playwright/test');

async function login(ctx) {
  const browser = await chromium.launch();
  const context = await browser.newContext({ ignoreHTTPSErrors: true });
  const page = await context.newPage();

  console.log('Logging into Liferay as Admin...');
  await page.goto(ctx.baseURL + '/c/portal/login');

  // Wait for the login form to be available
  await page.waitForSelector('form.sign-in-form', { state: 'visible' });

  // Fill in credentials
  await page
    .locator('input[name*="login"]:not([type="hidden"])')
    .first()
    .fill(ctx.liferayUser);
  await page
    .locator('input[name*="password"]:not([type="hidden"])')
    .first()
    .fill(ctx.liferayPassword);

  // Click the sign-in button
  await page.click('form.sign-in-form button[type="submit"]');
  try {
    await page.waitForURL(
      (url) => !url.href.includes('login') && !url.href.includes('sign-in'),
      { timeout: 60000 }
    );
  } catch (err) {
    if (page.url().includes('login') || page.url().includes('sign-in')) {
      const errorAlert = page.locator('.alert-danger');
      let errorText = 'Unknown login failure';
      if ((await errorAlert.count()) > 0) {
        errorText = await errorAlert.first().innerText();
      }
      await page.screenshot({ path: 'login-failure.png' });
      throw new Error(
        `Login failed or timed out! Still on login page. Error message: ${errorText.trim()}. Screenshot saved to login-failure.png`
      );
    }
    throw err;
  }

  // Handle "Terms of Use" page if it appears
  try {
    if (page.url().includes('update_terms_of_use')) {
      console.log('Terms of Use page detected. Attempting to accept...');
      const agreeButton = page.locator(
        'button:has-text("I Agree"), input[value="I Agree"]'
      );
      if ((await agreeButton.count()) > 0) {
        await Promise.all([
          page.waitForNavigation({ waitUntil: 'load' }),
          agreeButton.first().click(),
        ]);
        console.log('Terms of Use accepted.');
      }
    }
  } catch (e) {
    console.warn('Error while trying to accept Terms of Use:', e);
  }

  // Wait for navigation or a known element on the dashboard to confirm login
  try {
    await page.waitForSelector('.control-menu, .c-admin-user-personal-bar', {
      state: 'visible',
      timeout: 15000,
    });

    // Check for and dismiss the Liferay Enterprise Search (LES) Terms of Use popup
    try {
      const termsDoneButton = page.locator(
        'div.modal-footer button.btn.btn-primary'
      );
      await termsDoneButton.waitFor({ state: 'visible', timeout: 5000 });
      await termsDoneButton.click();
      console.log('LES Terms of Use popup detected and accepted.');

      const modalBackdrop = page.locator('div.modal-backdrop');
      await modalBackdrop.waitFor({ state: 'detached', timeout: 5000 });
    } catch (modalError) {
      console.log('No LES Terms of Use popup displayed.');
    }
  } catch (e) {
    console.warn(
      'Could not find standard Liferay admin toolbar, but login appeared successful based on URL.'
    );
  }

  // Save the authentication state
  await page.context().storageState({ path: ctx.storageState });

  // Extract CSRF token to use for JSON WS calls
  ctx.pAuthToken = await page.evaluate(() =>
    window.Liferay ? Liferay.authToken : ''
  );
  console.log(
    `Successfully logged in and saved state. (CSRF Token: ${ctx.pAuthToken ? 'Found' : 'Missing'})`
  );

  return { browser, page };
}

module.exports = { login };
