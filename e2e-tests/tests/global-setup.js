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

  // Fill in credentials. LDM default for Omni Admin is test@liferay.com / test
  await page.fill('input[name*="login"]', 'test@liferay.com');
  await page.fill('input[name*="password"]', 'test');

  // Click the sign-in button
  await page.click('button[type="submit"]');

  // Wait for navigation or a known element on the dashboard to confirm login
  await page.waitForSelector('.control-menu', {
    state: 'visible',
    timeout: 30000,
  });

  // Save the authentication state
  await page.context().storageState({ path: storageState });
  console.log('Successfully logged in and saved state.');
  await browser.close();

  // ----- PHASE 5: DYNAMIC PAGE GENERATION VIA HEADLESS API -----
  console.log('Programmatically generating test pages for fragments...');

  const apiContext = await request.newContext({
    baseURL,
    storageState,
  });

  // 1. Fetch the default Site (Guest)
  const siteResp = await apiContext.get('/o/headless-admin-site/v1.0/sites');
  if (!siteResp.ok()) {
    throw new Error(
      `Failed to fetch sites: ${siteResp.status()} ${siteResp.statusText()}`
    );
  }
  const siteData = await siteResp.json();
  const guestSite =
    siteData.items.find(
      (s) =>
        s.name === 'Guest' ||
        s.name === 'Liferay' ||
        s.friendlyUrlPath === '/guest'
    ) || siteData.items[0];
  const siteId = guestSite.id;
  const siteERC = guestSite.externalReferenceCode;
  console.log(`Using Site: ${guestSite.name} (ID: ${siteId}, ERC: ${siteERC})`);

  // 2. Fetch Fragment Collections
  const collResp = await apiContext.get(
    `/o/headless-admin-fragment/v1.0/sites/${siteId}/fragment-collections`
  );
  if (!collResp.ok()) {
    throw new Error('Failed to fetch fragment collections');
  }
  const collData = await collResp.json();
  const collections = collData.items || [];

  // We write the generated pages mapping to a file so the spec can read it
  const testPagesMap = [];

  for (const collection of collections) {
    console.log(`Processing Collection: ${collection.name}`);

    const fragResp = await apiContext.get(
      `/o/headless-admin-fragment/v1.0/fragment-collections/${collection.id}/fragments`
    );
    if (!fragResp.ok()) continue;

    const fragData = await fragResp.json();
    const fragments = fragData.items || [];

    for (const fragment of fragments) {
      const fragmentKey = fragment.key;
      const pageTitle = `Test: ${fragment.name}`;
      const pageERC = `test-page-${fragmentKey}`;
      const friendlyUrl = `/test-${fragmentKey}`;

      console.log(
        `  -> Creating page for ${fragment.name} (${fragmentKey})...`
      );

      // payload based on Liferay AI Hub diff
      const payload = {
        type: 'ContentPage',
        name_i18n: { 'en-US': pageTitle },
        friendlyUrlPath_i18n: { 'en-US': friendlyUrl },
        pageSpecifications: [
          {
            type: 'ContentPageSpecification',
            status: 'Approved',
            pageExperiences: [
              {
                key: 'DEFAULT',
                priority: 0,
                pageElements: [
                  {
                    definition: {
                      layout: {
                        widthType: 'Fluid',
                      },
                    },
                    pageElements: [
                      {
                        definition: {
                          layout: {
                            widthType: 'Fixed',
                          },
                        },
                        pageElements: [
                          {
                            definition: {
                              numberOfColumns: 1,
                            },
                            pageElements: [
                              {
                                definition: {
                                  size: 12,
                                },
                                pageElements: [
                                  {
                                    definition: {
                                      fragment: {
                                        key: fragmentKey,
                                      },
                                    },
                                    type: 'Fragment',
                                  },
                                ],
                                type: 'Column',
                              },
                            ],
                            type: 'Row',
                          },
                        ],
                        type: 'Section',
                      },
                    ],
                    type: 'Section',
                  },
                ],
              },
            ],
          },
        ],
      };

      // To prevent duplicates, we might want to PATCH or DELETE first. Since LDM is fresh, POST is fine.
      // But just in case, we do POST. If it fails due to duplicate, we could ignore.
      const createResp = await apiContext.post(
        `/o/headless-admin-site/v1.0/sites/${siteERC}/site-pages?privateLayout=false&nestedFields=pageSpecifications`,
        {
          data: payload,
        }
      );

      if (!createResp.ok()) {
        const body = await createResp.text();
        if (!body.includes('Duplicate')) {
          console.error(
            `     Failed to create page for ${fragment.name}: ${createResp.status()} - ${body}`
          );
        }
      }

      testPagesMap.push({
        collectionName: collection.name,
        fragmentName: fragment.name,
        url: friendlyUrl,
      });
    }
  }

  // Save the mapping for the test spec
  const fs = require('fs');
  const path = require('path');
  fs.writeFileSync(
    path.join(__dirname, '..', 'generated-test-pages.json'),
    JSON.stringify(testPagesMap, null, 2)
  );
  console.log('Finished generating test pages.');
}

module.exports = globalSetup;
