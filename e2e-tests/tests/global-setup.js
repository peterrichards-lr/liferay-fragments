// tests/global-setup.js
const { chromium, request } = require('@playwright/test');

async function globalSetup(config) {
  const { baseURL, storageState } = config.projects[0].use;
  const browser = await chromium.launch();
  const page = await browser.newPage();

  console.log('Logging into Liferay as Admin...');
  await page.goto(baseURL + '/c/portal/login');

  // Wait for the login form to be available
  await page.waitForSelector('form.sign-in-form', { state: 'visible' });

  // Get credentials from environment or use LDM defaults
  const liferayUser = process.env.LIFERAY_USER || 'test@liferay.com';
  const liferayPassword = process.env.LIFERAY_PASSWORD || 'test';

  // Fill in credentials
  await page
    .locator('input[name*="login"]:not([type="hidden"])')
    .first()
    .fill(liferayUser);
  await page
    .locator('input[name*="password"]:not([type="hidden"])')
    .first()
    .fill(liferayPassword);

  // Click the sign-in button
  await Promise.all([
    page.waitForNavigation({ waitUntil: 'networkidle' }),
    page.click('button[type="submit"]'),
  ]);

  // Check if we are still on the login page (indicates failure)
  if (page.url().includes('login') || page.url().includes('sign-in')) {
    const errorAlert = page.locator('.alert-danger');
    let errorText = 'Unknown login failure';
    if ((await errorAlert.count()) > 0) {
      errorText = await errorAlert.first().innerText();
    }
    await page.screenshot({ path: 'login-failure.png' });
    throw new Error(
      `Login failed! Still on login page. Error message: ${errorText.trim()}. Screenshot saved to login-failure.png`
    );
  }

  // Wait for navigation or a known element on the dashboard to confirm login
  try {
    await page.waitForSelector('.control-menu, .c-admin-user-personal-bar', {
      state: 'visible',
      timeout: 15000,
    });
  } catch (e) {
    console.warn(
      'Could not find standard Liferay admin toolbar, but login appeared successful based on URL.'
    );
  }

  // Save the authentication state
  await page.context().storageState({ path: storageState });
  console.log('Successfully logged in and saved state.');
  await browser.close();

  // ----- PHASE 5: DYNAMIC PAGE GENERATION VIA HEADLESS API -----
  console.log('Programmatically generating test pages for fragments...');

  const basicAuth = Buffer.from(`${liferayUser}:${liferayPassword}`).toString(
    'base64'
  );

  const apiContext = await request.newContext({
    baseURL,
    storageState,
    extraHTTPHeaders: {
      Authorization: `Basic ${basicAuth}`,
    },
  });

  // 1. Fetch the Target Site for Page Generation (Guest/Liferay)
  // Fragments are deployed to 'Global' but we verify them on the 'Guest' site
  // because the Global site often restricts Headless Page creation.
  const siteResp = await apiContext.get('/o/headless-admin-site/v1.0/sites');
  if (!siteResp.ok()) {
    throw new Error(
      `Failed to fetch sites: ${siteResp.status()} ${siteResp.statusText()}`
    );
  }
  const siteData = await siteResp.json();
  const targetSite =
    siteData.items.find(
      (s) =>
        s.name === 'Guest' ||
        s.name === 'Liferay' ||
        s.friendlyUrlPath === '/guest'
    ) || siteData.items[0];
  const siteId = targetSite.id;
  const siteERC = targetSite.externalReferenceCode;
  console.log(
    `Testing Global Fragments on Site: ${targetSite.name} (ID: ${siteId}, ERC: ${siteERC})`
  );

  // 2. Discover Fragments Locally
  const fs = require('fs');
  const path = require('path');
  const { globSync } = require('glob');

  const fragmentFiles = globSync('../**/fragment.json', {
    ignore: [
      '../node_modules/**',
      '../temp*/**',
      '../zips/**',
      '../e2e-tests/**',
    ],
  });

  const testPagesMap = [];

  for (const file of fragmentFiles) {
    const fragmentData = JSON.parse(fs.readFileSync(file, 'utf8'));
    const fragmentName = fragmentData.name;
    // Liferay fragment keys are typically derived from the folder name or explicitly defined.
    let baseFragmentKey = fragmentData.key || path.basename(path.dirname(file));

    // Find the nearest collection.json
    let currentDir = path.dirname(file);
    let collectionName = 'Standalone';
    let collectionDirName = '';
    let collectionFound = false;

    while (currentDir !== '..' && currentDir !== '/' && currentDir !== '.') {
      const collectionFile = path.join(currentDir, 'collection.json');
      if (fs.existsSync(collectionFile)) {
        const collData = JSON.parse(fs.readFileSync(collectionFile, 'utf8'));
        collectionName = collData.name;
        collectionDirName = path.basename(currentDir);
        collectionFound = true;
        break;
      }
      const parent = path.dirname(currentDir);
      if (parent === currentDir) break;
      currentDir = parent;
    }

    if (!collectionFound) {
      // Fallback: use the name of the folder two levels up if it's not 'fragments'
      const parentDirName = path.basename(path.dirname(path.dirname(file)));
      if (parentDirName !== 'fragments' && parentDirName !== '..') {
        collectionName = parentDirName;
        collectionDirName = parentDirName;
      }
    }

    // Crucial Fix: Liferay prefixes the fragment key with the collection's directory name when importing ZIPs
    let fragmentKey = baseFragmentKey;
    if (
      collectionDirName &&
      collectionDirName !== 'Standalone' &&
      collectionDirName !== '.'
    ) {
      fragmentKey = `${collectionDirName}-${baseFragmentKey}`;
    }

    const pageTitle = `Test: ${fragmentName}`;
    const friendlyUrl = `/test-${baseFragmentKey}`;

    console.log(
      `  -> Creating page for ${fragmentName} (${fragmentKey}) in ${collectionName}...`
    );

    // payload based on Liferay Page Management API (LPD-35443)
    // Reverted to Capitalized types to match Liferay official schema and docs
    const payload = {
      title: pageTitle,
      friendlyUrlPath: friendlyUrl,
      pageType: 'content',
      pageDefinition: {
        pageElement: {
          type: 'Root',
          pageElements: [
            {
              type: 'Section',
              definition: {
                layout: {
                  widthType: 'Fluid',
                },
              },
              pageElements: [
                {
                  type: 'Row',
                  definition: {
                    gutters: true,
                    columnsSpacing: true,
                    numberOfColumns: 1,
                  },
                  pageElements: [
                    {
                      type: 'Column',
                      definition: {
                        size: 12,
                      },
                      pageElements: [
                        {
                          type: 'Fragment',
                          definition: {
                            fragment: {
                              key: fragmentKey,
                            },
                          },
                        },
                      ],
                    },
                  ],
                },
              ],
            },
          ],
        },
      },
    };

    // Use the Headless Delivery endpoint (Page Management API)
    // This is the modern standard for pageDefinitions and ERC-based management

    let success = false;
    let attempts = 0;
    const maxAttempts = 3;

    while (attempts < maxAttempts && !success) {
      attempts++;
      const createResp = await apiContext.post(
        `/o/headless-delivery/v1.0/sites/${siteId}/site-pages`,
        {
          data: payload,
        }
      );

      if (createResp.ok()) {
        success = true;
      } else {
        const body = await createResp.text();
        if (body.includes('Duplicate')) {
          success = true; // Count duplicate as success
        } else {
          console.warn(
            `     [Attempt ${attempts}] Failed to create page for ${fragmentName}: ${createResp.status()} - ${body}`
          );
          if (attempts < maxAttempts) {
            console.log(`     Retrying in 2 seconds...`);
            await new Promise((resolve) => setTimeout(resolve, 2000));
          }
        }
      }
    }

    // Stagger page creation strictly to reduce DB contention on PortalPreferenceValue
    // Increased to 1s based on forensic log analysis
    await new Promise((resolve) => setTimeout(resolve, 1000));

    testPagesMap.push({
      collectionName: collectionName,
      fragmentName: fragmentName,
      url: friendlyUrl,
    });
  }

  // Save the mapping for the test spec
  fs.writeFileSync(
    path.join(__dirname, '..', 'generated-test-pages.json'),
    JSON.stringify(testPagesMap, null, 2)
  );
  console.log('Finished generating test pages.');
}

module.exports = globalSetup;
