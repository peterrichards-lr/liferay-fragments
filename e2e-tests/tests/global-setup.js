// tests/global-setup.js
const { chromium, request } = require('@playwright/test');

async function globalSetup(config) {
  const { baseURL, storageState } = config.projects[0].use;
  const browser = await chromium.launch();
  const context = await browser.newContext({ ignoreHTTPSErrors: true });
  const page = await context.newPage();

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
    page.waitForNavigation({ waitUntil: 'load' }),
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
  await page.context().storageState({ path: storageState });

  // Extract CSRF token to use for JSON WS calls
  const pAuthToken = await page.evaluate(() =>
    window.Liferay ? Liferay.authToken : ''
  );
  console.log(
    `Successfully logged in and saved state. (CSRF Token: ${pAuthToken ? 'Found' : 'Missing'})`
  );

  // ----- CONFIGURE SERVICE ACCESS POLICY -----
  try {
    console.log('Configuring SYSTEM_DEFAULT Service Access Policy...');
    await page.goto(
      `${baseURL}/group/control_panel/manage?p_p_id=com_liferay_portal_security_service_access_policy_web_portlet_SAPPortlet`
    );
    await page.waitForLoadState('load');

    await page.click('a:has-text("SYSTEM_DEFAULT")');
    await page.waitForLoadState('load');
    await page.waitForTimeout(1000);

    const existingRules = await page.evaluate(() => {
      return Array.from(
        document.querySelectorAll('input.service-class-name')
      ).map((el) => el.value);
    });

    const targetClasses = [
      'com.liferay.headless.delivery.internal.resource.v1_0.ContentSetElementResourceImpl',
      'com.liferay.headless.delivery.resource.v1_0.ContentSetElementResource',
    ];

    let needsSave = false;

    for (const targetClass of targetClasses) {
      if (!existingRules.includes(targetClass)) {
        console.log(`  -> Adding rule for ${targetClass}...`);
        await page.locator('.add-row').last().click();
        await page.waitForTimeout(500);

        await page.locator('input.service-class-name').last().fill(targetClass);
        await page
          .locator('input.service-class-name')
          .last()
          .dispatchEvent('change');
        await page
          .locator('input.service-class-name')
          .last()
          .dispatchEvent('blur');
        await page.waitForTimeout(200);

        await page.evaluate(() => {
          const inputs = Array.from(
            document.querySelectorAll('input.action-method-name')
          );
          const lastInput = inputs[inputs.length - 1];
          if (lastInput) lastInput.removeAttribute('disabled');
        });

        await page.locator('input.action-method-name').last().fill('*');
        needsSave = true;
      }
    }

    if (needsSave) {
      console.log('  -> Saving policy...');
      await Promise.all([
        page.waitForNavigation({ waitUntil: 'load' }),
        page.click('button[type="submit"]'),
      ]);
      console.log('  -> Policy saved successfully.');
    } else {
      console.log('  -> No policy updates required.');
    }
  } catch (sapErr) {
    console.warn(
      '  -> Warning: Failed to configure Service Access Policy:',
      sapErr.message
    );
  }

  // ----- PHASE 4.5: AUTOMATE GUEST OBJECT PERMISSIONS VIA CONTROL PANEL UI -----
  try {
    console.log('Automating Guest Role Permissions for Custom Objects...');
    const objectERCs = [
      'WATER_READING',
      'SALES_REPORT',
      'COMPANY_MILESTONE',
      'PRODUCT_SHOWCASE',
      'ACTIVITY_LOG',
    ];
    const basicAuth = Buffer.from(`${liferayUser}:${liferayPassword}`).toString(
      'base64'
    );
    const headers = { Authorization: `Basic ${basicAuth}` };

    for (const erc of objectERCs) {
      console.log(`  -> Configuring Guest permissions for ${erc}...`);

      // Resolve object definition ID via Admin REST API
      const objResp = await page.request.get(
        `${baseURL}/o/object-admin/v1.0/object-definitions/by-external-reference-code/${erc}`,
        { headers }
      );

      if (!objResp.ok()) {
        console.warn(
          `     [WARN] Object Definition ${erc} not found in portal: status ${objResp.status()}`
        );
        continue;
      }

      const objJson = await objResp.json();
      const objId = objJson.id;

      // Navigate to the permissions grid page for this Object Definition
      const permissionsUrl = `${baseURL}/group/control_panel/manage?p_p_id=com_liferay_portlet_configuration_web_portlet_PortletConfigurationPortlet&_com_liferay_portlet_configuration_web_portlet_PortletConfigurationPortlet_mvcPath=%2Fedit_permissions.jsp&_com_liferay_portlet_configuration_web_portlet_PortletConfigurationPortlet_modelResource=com.liferay.object.model.ObjectDefinition&_com_liferay_portlet_configuration_web_portlet_PortletConfigurationPortlet_resourcePrimKey=${objId}`;

      await page.goto(permissionsUrl);
      await page.waitForSelector('form#fm, table', {
        state: 'visible',
        timeout: 10000,
      });

      const guestRow = page.locator('tr:has-text("Guest")');
      if ((await guestRow.count()) > 0) {
        let changed = false;

        // 1. VIEW permission checkbox
        const viewCheckbox = guestRow.locator('input[id="guest_ACTION_VIEW"]');
        if ((await viewCheckbox.count()) > 0) {
          const isChecked = await viewCheckbox.isChecked();
          if (!isChecked) {
            console.log(`     Checking VIEW checkbox for Guest...`);
            await viewCheckbox.check();
            changed = true;
          }
        }

        // 2. ADD_ENTRY permission checkbox (primarily for COMPANY_MILESTONE form submissions)
        const addCheckbox = guestRow.locator(
          'input[id="guest_ACTION_ADD_ENTRY"]'
        );
        if ((await addCheckbox.count()) > 0) {
          const isChecked = await addCheckbox.isChecked();
          if (!isChecked) {
            console.log(`     Checking ADD_ENTRY checkbox for Guest...`);
            await addCheckbox.check();
            changed = true;
          }
        }

        if (changed) {
          const saveButton = page.locator(
            'button[type="submit"]:has-text("Save"), button.btn-primary:has-text("Save")'
          );
          if ((await saveButton.count()) > 0) {
            await Promise.all([
              page.waitForNavigation({ waitUntil: 'load' }),
              saveButton.first().click(),
            ]);
            console.log(
              `     Successfully saved Guest permissions for ${erc}.`
            );
          } else {
            console.warn(`     [WARN] Save button not found for ${erc}.`);
          }
        } else {
          console.log(
            `     Guest permissions are already up-to-date for ${erc}.`
          );
        }
      } else {
        console.warn(
          `     [WARN] Guest role row not found in permissions table for ${erc}.`
        );
      }
    }
  } catch (permErr) {
    console.warn(
      '  -> Warning: Failed to automate Guest Object Permissions:',
      permErr.message
    );
  }

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
    ignoreHTTPSErrors: true,
    // Increase timeout to 60s to handle slow Liferay page-creation APIs
    // under sequential load (default 30s too short when stagger adds up)
    timeout: 60000,
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

  // ----- PHASE 5.1: VERIFY DEPLOYMENT VIA JSON WS -----
  console.log(
    'Verifying fragment deployment via JSON WS (per docs E2E exception)...'
  );
  let registeredKeys = [];
  let verificationSucceeded = false;
  try {
    // 1. Get all fragment collections using the CSRF token
    const collectionsResp = await apiContext.post(
      `/api/jsonws/fragment.fragmentcollection/get-fragment-collections?p_auth=${pAuthToken}`,
      {
        form: {
          groupId: siteId,
          start: -1,
          end: -1,
        },
      }
    );

    if (collectionsResp.ok()) {
      verificationSucceeded = true;
      const collections = await collectionsResp.json();

      // 2. Loop through each collection and get its entries
      for (const collection of collections) {
        const entriesResp = await apiContext.post(
          `/api/jsonws/fragment.fragmententry/get-fragment-entries?p_auth=${pAuthToken}`,
          {
            form: {
              groupId: siteId,
              fragmentCollectionId: collection.fragmentCollectionId,
              status: 0,
              start: -1,
              end: -1,
            },
          }
        );

        if (entriesResp.ok()) {
          const entries = await entriesResp.json();
          entries.forEach((e) => registeredKeys.push(e.fragmentEntryKey));
        }
      }

      console.log(
        `  -> Found ${collections.length} collections containing ${registeredKeys.length} approved fragments.`
      );
    } else {
      console.warn(
        `  -> JSON WS fragment verification failed (${collectionsResp.status()}). Proceeding with optimistic generation...`
      );
    }
  } catch (e) {
    console.error('  -> Error calling JSON WS for fragment verification:', e);
  }

  // 2. Discover Fragments Locally
  const fs = require('fs');
  const path = require('path');
  const { globSync } = require('glob');

  // Clear stale generated-test-pages.json immediately so that if setup aborts
  // mid-run, the teardown won't try to delete pages from the PREVIOUS run.
  const generatedPagesPath = path.join(
    __dirname,
    '..',
    'generated-test-pages.json'
  );
  if (fs.existsSync(generatedPagesPath)) {
    fs.unlinkSync(generatedPagesPath);
    console.log(
      '  -> Cleared stale generated-test-pages.json from previous run.'
    );
  }

  // IMPORTANT: Use __dirname-relative path to pin the glob to THIS project's
  // root, regardless of process.cwd(). Using a CWD-relative '../' pattern
  // escaped into sibling repos on the parent SanDisk volume.
  const projectRoot = path.resolve(__dirname, '..', '..');
  const fragmentFiles = globSync('**/fragment.json', {
    cwd: projectRoot,
    absolute: true,
    ignore: [
      '**/node_modules/**',
      '**/temp*/**',
      '**/zips/**',
      '**/e2e-tests/**',
    ],
  });

  // Fetch all existing layouts once to optimize duplicate checks
  let existingLayouts = [];
  try {
    const pageSearchResp = await apiContext.post(
      `/api/jsonws/layout/get-layouts?p_auth=${pAuthToken}`,
      {
        form: {
          groupId: siteId,
          privateLayout: false,
        },
      }
    );
    if (pageSearchResp.ok()) {
      existingLayouts = await pageSearchResp.json();
      console.log(
        `  -> Retrieved ${existingLayouts.length} existing layouts to optimize lookup.`
      );
    } else {
      console.warn(
        `  -> [WARN] Failed to fetch existing layouts to optimize lookup: ${pageSearchResp.status()}`
      );
    }
  } catch (e) {
    console.error('  -> Error fetching existing layouts:', e.message);
  }

  const testPagesMap = [];

  for (const file of fragmentFiles) {
    const fragmentData = JSON.parse(fs.readFileSync(file, 'utf8'));
    const fragmentName = fragmentData.name;

    // Liferay fragment keys are typically derived from the folder name or explicitly defined.
    let baseFragmentKey = fragmentData.key || path.basename(path.dirname(file));

    // Find the nearest collection.json
    let currentDir = path.dirname(file);
    let collectionName = 'Standalone';
    let collectionFound = false;

    while (currentDir !== '..' && currentDir !== '/' && currentDir !== '.') {
      const collectionFile = path.join(currentDir, 'collection.json');
      if (fs.existsSync(collectionFile)) {
        const collData = JSON.parse(fs.readFileSync(collectionFile, 'utf8'));
        collectionName = collData.name;
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
      }
    }

    // Correct fragment key as verified in Liferay DB
    const fragmentKey = baseFragmentKey;

    // Skip if fragment is not actually registered in the database (verified via GraphQL)
    if (verificationSucceeded && !registeredKeys.includes(fragmentKey)) {
      console.warn(
        `  [SKIP] Fragment '${fragmentName}' (${fragmentKey}) not found in database. It likely failed to deploy.`
      );
      continue;
    }

    // ----- SEED TEST DATA IF PRESENT -----
    const testDataFile = path.join(path.dirname(file), 'test-data.json');
    let seededConfigOverrides = {};

    if (fs.existsSync(testDataFile)) {
      console.log(
        `     Found E2E test data manifest at ${testDataFile}. Seeding assets...`
      );
      try {
        const testData = JSON.parse(fs.readFileSync(testDataFile, 'utf8'));
        const seededAssetsManifest = [];

        // Load existing manifest of seeded assets or start fresh
        const seededAssetsPath = path.join(
          __dirname,
          '..',
          'seeded-assets.json'
        );
        let seededAssets = [];
        if (fs.existsSync(seededAssetsPath)) {
          seededAssets = JSON.parse(fs.readFileSync(seededAssetsPath, 'utf8'));
        }

        const assetMap = {}; // Maps ERC -> Liferay ID

        // 0. Seed Documents
        if (testData.documents) {
          for (const doc of testData.documents) {
            console.log(
              `       Seeding Document: ${doc.title} (${doc.externalReferenceCode})...`
            );

            // Delete pre-existing document if it exists to ensure fresh upload and guest permissions
            try {
              const deleteResp = await apiContext.delete(
                `/o/headless-delivery/v1.0/documents/by-external-reference-code/${doc.externalReferenceCode}`
              );
              if (deleteResp.ok()) {
                console.log(
                  `       Deleted existing document with ERC ${doc.externalReferenceCode}.`
                );
              }
            } catch (err) {
              console.warn(
                `       [WARN] Error deleting existing document: ${err.message}`
              );
            }

            const absFilePath = path.isAbsolute(doc.filePath)
              ? doc.filePath
              : path.join(projectRoot, doc.filePath);
            if (!fs.existsSync(absFilePath)) {
              console.warn(
                `       [WARN] File not found at: ${absFilePath}. Skipping document seed.`
              );
              continue;
            }

            try {
              const fileBuffer = fs.readFileSync(absFilePath);
              const uploadResp = await apiContext.post(
                `/o/headless-delivery/v1.0/sites/${siteId}/documents`,
                {
                  multipart: {
                    file: {
                      name: doc.title,
                      mimeType: 'image/png',
                      buffer: fileBuffer,
                    },
                    document: JSON.stringify({
                      externalReferenceCode: doc.externalReferenceCode,
                      title: doc.title,
                      viewableBy: 'Anyone',
                    }),
                  },
                }
              );

              if (uploadResp.ok()) {
                const uploadJson = await uploadResp.json();
                const contentUrl = uploadJson.contentUrl;
                const docId = uploadJson.id;
                console.log(
                  `       Successfully uploaded document ${doc.title} -> URL: ${contentUrl}, ID: ${docId}`
                );
                assetMap[doc.externalReferenceCode] = contentUrl;
                seededAssets.push({
                  type: 'document',
                  id: docId,
                  erc: doc.externalReferenceCode,
                });
              } else if (uploadResp.status() === 409) {
                console.log(
                  `       Document ${doc.title} already exists. Resolving URL and verifying guest permissions...`
                );
                const searchResp = await apiContext.get(
                  `/o/headless-delivery/v1.0/sites/${siteId}/documents?search=${encodeURIComponent(doc.title)}`
                );
                if (searchResp.ok()) {
                  const searchJson = await searchResp.json();
                  const matched = searchJson.items.find(
                    (d) => d.title === doc.title
                  );
                  if (matched) {
                    const contentUrl = matched.contentUrl;
                    const docId = matched.id;
                    console.log(
                      `       Found existing document ${doc.title} -> URL: ${contentUrl}, ID: ${docId}`
                    );
                    assetMap[doc.externalReferenceCode] = contentUrl;

                    // Verify and patch guest permissions to Anyone
                    const patchResp = await apiContext.patch(
                      `/o/headless-delivery/v1.0/documents/${docId}`,
                      {
                        data: {
                          viewableBy: 'Anyone',
                        },
                      }
                    );
                    if (patchResp.ok()) {
                      console.log(
                        `       Successfully updated guest view permission for existing document.`
                      );
                    }
                  } else {
                    console.warn(
                      `       [WARN] Could not find document with title ${doc.title} in search results.`
                    );
                  }
                } else {
                  console.warn(
                    `       [WARN] Failed to search existing documents: ${searchResp.status()}`
                  );
                }
              } else {
                console.warn(
                  `       [WARN] Failed to upload document ${doc.title}: ${uploadResp.status()} - ${await uploadResp.text()}`
                );
              }
            } catch (err) {
              console.error(
                `       [ERROR] Exception uploading document ${doc.title}:`,
                err.message
              );
            }
          }
        }

        // 1. Seed Web Content Structures
        // Skip REST POST creation since content-structures is read-only in REST.
        // Instead, resolve the structure IDs or create them using JSON WS.
        if (testData.webContentStructures) {
          for (const struct of testData.webContentStructures) {
            console.log(
              `       Resolving Structure ID for: ${struct.name} (${struct.externalReferenceCode})...`
            );
            let structId = '';

            // Use JSON WS fetch-structure for a direct DB lookup.
            // This is immune to Elasticsearch index lag which causes the REST
            // search-based approach to miss newly created structures.
            // Returns {} when not found, full object when found.

            // First, resolve classNameId for JournalArticle
            let classNameId = '';
            const classNameResp = await apiContext.post(
              `/api/jsonws/classname/fetch-class-name?p_auth=${pAuthToken}`,
              { form: { value: 'com.liferay.journal.model.JournalArticle' } }
            );
            if (classNameResp.ok()) {
              const cnJson = await classNameResp.json();
              classNameId = cnJson.classNameId;
            }

            if (classNameId) {
              const fetchResp = await apiContext.post(
                `/api/jsonws/ddm.ddmstructure/fetch-structure?contextName=ddm&p_auth=${pAuthToken}`,
                {
                  form: {
                    groupId: siteId,
                    classNameId,
                    structureKey: struct.externalReferenceCode,
                  },
                }
              );
              if (fetchResp.ok()) {
                const fetchJson = await fetchResp.json();
                // JSON WS returns {} (empty object) when not found
                if (fetchJson && fetchJson.structureId) {
                  structId = fetchJson.structureId;
                  console.log(
                    `       Found existing structure ${struct.externalReferenceCode} -> ID ${structId}`
                  );
                }
              }
            }

            // Fallback: Programmatic creation via JSON WS
            if (!structId) {
              console.log(
                `       Structure ${struct.externalReferenceCode} not found. Creating via JSON WS...`
              );
              try {
                // A. Resolve com.liferay.journal.model.JournalArticle classNameId (reuse if already fetched above)
                if (!classNameId) {
                  const classNameResp2 = await apiContext.post(
                    `/api/jsonws/classname/fetch-class-name?p_auth=${pAuthToken}`,
                    {
                      form: {
                        value: 'com.liferay.journal.model.JournalArticle',
                      },
                    }
                  );
                  if (!classNameResp2.ok()) {
                    throw new Error(
                      `Failed to resolve classNameId: ${classNameResp2.status()} - ${await classNameResp2.text()}`
                    );
                  }
                  const classNameJson = await classNameResp2.json();
                  classNameId = classNameJson.classNameId;
                }

                // B. Map fields definition
                const ddmFormFields = struct.fields.map((f) => {
                  let dataType = 'string';
                  let type = 'text';
                  if (f.type === 'image') {
                    dataType = 'image';
                    type = 'image';
                  } else if (f.type === 'html') {
                    dataType = 'string';
                    type = 'rich_text';
                  }
                  return {
                    dataType,
                    label: { en_US: f.label || f.name },
                    localizable: true,
                    multiple: false,
                    name: f.name,
                    fieldReference: f.name,
                    required: false,
                    type,
                  };
                });

                const ddmForm = {
                  defaultLocale: 'en_US',
                  availableLocales: ['en_US'],
                  ddmFormFields,
                };

                const ddmFormLayout = {
                  defaultLocale: 'en_US',
                  availableLocales: ['en_US'],
                  ddmFormLayoutPages: [
                    {
                      ddmFormLayoutRows: [
                        {
                          ddmFormLayoutColumns: [
                            {
                              ddmFormFieldNames: struct.fields.map(
                                (f) => f.name
                              ),
                              size: 12,
                            },
                          ],
                        },
                      ],
                    },
                  ],
                };

                // C. Invoke add-structure endpoint
                const createResp = await apiContext.post(
                  `/api/jsonws/ddm.ddmstructure/add-structure?contextName=ddm&p_auth=${pAuthToken}`,
                  {
                    form: {
                      groupId: siteId,
                      parentStructureKey: '',
                      classNameId: classNameId,
                      structureKey: struct.externalReferenceCode,
                      nameMap: JSON.stringify({ en_US: struct.name }),
                      descriptionMap: JSON.stringify({
                        en_US: struct.description || '',
                      }),
                      ddmForm: JSON.stringify(ddmForm),
                      ddmFormLayout: JSON.stringify(ddmFormLayout),
                      storageType: 'default',
                      type: '0',
                      'serviceContext.languageId': 'en_US',
                    },
                  }
                );

                if (createResp.ok()) {
                  const createJson = await createResp.json();
                  structId = createJson.structureId;
                  console.log(
                    `       Successfully created structure ${struct.externalReferenceCode} -> ID ${structId}`
                  );
                  seededAssets.push({
                    type: 'structure',
                    id: structId,
                    erc: struct.externalReferenceCode,
                  });
                } else {
                  console.warn(
                    `       [WARN] Failed to create structure via JSON WS: ${createResp.status()} - ${await createResp.text()}`
                  );
                }
              } catch (err) {
                console.error(
                  `       [ERROR] Exception creating structure via JSON WS:`,
                  err.message
                );
              }
            }

            if (structId) {
              assetMap[struct.externalReferenceCode] = structId;
            } else {
              console.warn(
                `       [WARN] Could not resolve or create structure ID for ${struct.externalReferenceCode}. Creating articles may fail.`
              );
            }
          }
        }

        // 2. Seed Web Content Articles
        if (testData.webContentArticles) {
          for (const article of testData.webContentArticles) {
            console.log(
              `       Creating Article: ${article.title} (${article.externalReferenceCode})...`
            );

            // Resolve structure ID
            const structId = assetMap[article.structureERC] || '';
            const payloadFields = [];

            if (article.contentFields) {
              article.contentFields.forEach((f) => {
                let val = f.value;
                if (typeof val === 'string' && assetMap[val]) {
                  val = assetMap[val];
                  console.log(
                    `         Resolved field ${f.name} value to uploaded document path: ${val}`
                  );
                }
                payloadFields.push({
                  name: f.name,
                  fieldReference: f.name,
                  contentFieldValue: {
                    data: val,
                  },
                });
              });
            }

            const articleResp = await apiContext.post(
              `/o/headless-delivery/v1.0/sites/${siteId}/structured-contents`,
              {
                data: {
                  externalReferenceCode: article.externalReferenceCode,
                  title: article.title,
                  contentStructureId: structId,
                  contentFields: payloadFields,
                  viewableBy: 'Anyone',
                },
              }
            );

            const resStatus = articleResp.status();
            const resText = await articleResp.text();
            const isDuplicate =
              resStatus === 409 ||
              (resStatus === 400 && resText.includes('already in use'));

            if (articleResp.ok() || isDuplicate) {
              let articleId = '';
              if (articleResp.ok()) {
                const articleJson = JSON.parse(resText);
                articleId = articleJson.id;
                seededAssets.push({
                  type: 'article',
                  id: articleId,
                  erc: article.externalReferenceCode,
                });
              } else {
                console.log(
                  `       Article ${article.externalReferenceCode} already exists. Deleting and recreating to update content and permissions...`
                );
                const searchResp = await apiContext.get(
                  `/o/headless-delivery/v1.0/sites/${siteId}/structured-contents?search=${article.externalReferenceCode}`
                );
                if (searchResp.ok()) {
                  const searchJson = await searchResp.json();
                  const matched = searchJson.items.find(
                    (a) =>
                      a.externalReferenceCode === article.externalReferenceCode
                  );
                  if (matched) {
                    const deleteResp = await apiContext.delete(
                      `/o/headless-delivery/v1.0/structured-contents/${matched.id}`
                    );
                    if (deleteResp.ok()) {
                      console.log(
                        `       Successfully deleted existing article ${article.externalReferenceCode}.`
                      );
                    } else {
                      console.warn(
                        `       [WARN] Failed to delete existing article ${article.externalReferenceCode}: ${deleteResp.status()} - ${await deleteResp.text()}`
                      );
                    }
                  }
                }

                // Recreate the article fresh
                const recreateResp = await apiContext.post(
                  `/o/headless-delivery/v1.0/sites/${siteId}/structured-contents`,
                  {
                    data: {
                      externalReferenceCode: article.externalReferenceCode,
                      title: article.title,
                      contentStructureId: structId,
                      contentFields: payloadFields,
                      viewableBy: 'Anyone',
                    },
                  }
                );

                if (recreateResp.ok()) {
                  const recreateJson = await recreateResp.json();
                  articleId = recreateJson.id;
                  seededAssets.push({
                    type: 'article',
                    id: articleId,
                    erc: article.externalReferenceCode,
                  });
                  console.log(
                    `       Successfully recreated article ${article.externalReferenceCode} with ID ${articleId}`
                  );
                } else {
                  console.warn(
                    `       [WARN] Failed to recreate article ${article.externalReferenceCode}: ${recreateResp.status()} - ${await recreateResp.text()}`
                  );
                }
              }
              if (articleId) {
                assetMap[article.externalReferenceCode] = articleId;
              }
            } else {
              console.warn(
                `       [WARN] Failed to create article ${article.externalReferenceCode}: ${resStatus} - ${resText}`
              );
            }
          }
        }

        // 3. Seed Asset Collections (Content Sets) via JSON WS
        if (testData.collections) {
          for (const coll of testData.collections) {
            console.log(
              `       Creating Collection: ${coll.name} (${coll.externalReferenceCode})...`
            );

            // Resolve entry IDs for items
            const entryIds = [];
            if (coll.items) {
              for (const item of coll.items) {
                const resolvedId = assetMap[item.externalReferenceCode];
                if (resolvedId) {
                  // Retrieve AssetEntry for the article using get-entry
                  const entryResp = await apiContext.post(
                    `/api/jsonws/assetentry/get-entry?p_auth=${pAuthToken}`,
                    {
                      form: {
                        className: 'com.liferay.journal.model.JournalArticle',
                        classPK: resolvedId,
                      },
                    }
                  );

                  if (entryResp.ok()) {
                    const entryJson = await entryResp.json();
                    entryIds.push(entryJson.entryId);
                    console.log(
                      `         Resolved AssetEntryId for ${item.externalReferenceCode}: ${entryJson.entryId}`
                    );
                  } else {
                    console.warn(
                      `         [WARN] Failed to resolve AssetEntry for ${item.externalReferenceCode}: ${entryResp.status()}`
                    );
                  }
                }
              }
            }

            // Create the collection using add-manual-asset-list-entry
            // Use entryIds.join(',') since Liferay JSON WS expects a comma-separated list of longs
            const collectionResp = await apiContext.post(
              `/api/jsonws/assetlist.assetlistentry/add-manual-asset-list-entry?p_auth=${pAuthToken}`,
              {
                form: {
                  externalReferenceCode: coll.externalReferenceCode,
                  groupId: siteId,
                  title: coll.name,
                  assetEntryIds: entryIds.join(','),
                  serviceContext: JSON.stringify({
                    addGuestPermissions: true,
                    addGroupPermissions: true,
                  }),
                },
              }
            );

            if (collectionResp.ok()) {
              const collectionJson = await collectionResp.json();
              const collectionId = collectionJson.assetListEntryId;
              console.log(
                `       Successfully created Collection ${coll.name} with ID ${collectionId}`
              );
              seededAssets.push({
                type: 'collection',
                id: collectionId,
                erc: coll.externalReferenceCode,
              });
              assetMap[coll.externalReferenceCode] = collectionId;
            } else {
              // If it already exists, retrieve the existing one, delete it, and recreate it fresh to update items.
              console.log(
                `       Collection ${coll.name} already exists. Fetching to update items...`
              );
              const fetchResp = await apiContext.post(
                `/api/jsonws/assetlist.assetlistentry/get-asset-list-entry-by-external-reference-code?p_auth=${pAuthToken}`,
                {
                  form: {
                    externalReferenceCode: coll.externalReferenceCode,
                    groupId: siteId,
                  },
                }
              );

              if (fetchResp.ok()) {
                const collectionJson = await fetchResp.json();
                const collectionId = collectionJson.assetListEntryId;
                console.log(
                  `       Found existing Collection ${coll.name} with ID ${collectionId}. Deleting it to recreate with updated items: ${entryIds.join(',')}`
                );

                const deleteResp = await apiContext.post(
                  `/api/jsonws/assetlist.assetlistentry/delete-asset-list-entry?p_auth=${pAuthToken}`,
                  {
                    form: {
                      assetListEntryId: collectionId,
                    },
                  }
                );

                if (deleteResp.ok()) {
                  // Recreate the collection fresh
                  const recreateResp = await apiContext.post(
                    `/api/jsonws/assetlist.assetlistentry/add-manual-asset-list-entry?p_auth=${pAuthToken}`,
                    {
                      form: {
                        externalReferenceCode: coll.externalReferenceCode,
                        groupId: siteId,
                        title: coll.name,
                        assetEntryIds: entryIds.join(','),
                        serviceContext: JSON.stringify({
                          addGuestPermissions: true,
                          addGroupPermissions: true,
                        }),
                      },
                    }
                  );

                  if (recreateResp.ok()) {
                    const recreateJson = await recreateResp.json();
                    const newCollectionId = recreateJson.assetListEntryId;
                    console.log(
                      `       Successfully recreated Collection ${coll.name} with new ID ${newCollectionId}`
                    );
                    assetMap[coll.externalReferenceCode] = newCollectionId;
                  } else {
                    console.warn(
                      `       [WARN] Failed to recreate collection ${coll.externalReferenceCode} after deletion: ${recreateResp.status()} - ${await recreateResp.text()}`
                    );
                  }
                } else {
                  console.warn(
                    `       [WARN] Failed to delete existing collection ${coll.externalReferenceCode}: ${deleteResp.status()} - ${await deleteResp.text()}`
                  );
                }
              } else {
                console.warn(
                  `       [WARN] Failed to retrieve existing collection ${coll.externalReferenceCode}: ${fetchResp.status()} - ${await fetchResp.text()}`
                );
              }
            }
          }
        }

        // Write updated seeded assets manifest to file
        fs.writeFileSync(
          seededAssetsPath,
          JSON.stringify(seededAssets, null, 2)
        );

        // 4. Extract Configuration Overrides
        if (testData.pageConfig && testData.pageConfig.fragmentConfig) {
          seededConfigOverrides = { ...testData.pageConfig.fragmentConfig };
          // Dynamically map ERC references to actual Liferay IDs/UUIDs
          Object.keys(seededConfigOverrides).forEach((key) => {
            const val = seededConfigOverrides[key];
            if (typeof val === 'string' && assetMap[val]) {
              seededConfigOverrides[key] = assetMap[val].toString();
              console.log(
                `       Mapping config override: ${key} -> ${seededConfigOverrides[key]} (resolved from ${val})`
              );
            }
          });
        }
      } catch (err) {
        console.error(
          `     [ERROR] Exception while seeding test data for ${fragmentName}:`,
          err
        );
      }
    }

    const pageTitle = `Test: ${fragmentName}`;
    const sanitizedKey = baseFragmentKey
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
    let friendlyUrl = `/test-${sanitizedKey}`;

    console.log(
      `  -> Creating page for ${fragmentName} (${fragmentKey}) in ${collectionName}...`
    );

    // payload based on Liferay Page Management API (LPD-35443)
    // Hardened based on inspecting manually created pages on Liferay 2026.Q1
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
                indexed: true,
                layout: {},
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
                              siteKey: siteERC,
                            },
                            fragmentConfig: seededConfigOverrides,
                            fragmentFields: [],
                            indexed: true,
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
        settings: {
          colorSchemeName: '01',
          themeName: 'Classic',
        },
      },
    };

    // Use the Headless Delivery endpoint (Page Management API)
    // This is the modern standard for pageDefinitions and ERC-based management

    let success = false;
    let pageWasCreated = false;
    let attempts = 0;
    let pageId = null;
    let pageUuid = null;
    const maxAttempts = 5;

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
        pageWasCreated = true;
        const responseJson = await createResp.json();
        if (responseJson.friendlyUrlPath) {
          friendlyUrl = responseJson.friendlyUrlPath;
        }
        pageId = responseJson.id;
        pageUuid = responseJson.uuid;

        // Perform the patch to update page settings to hiddenFromNavigation: true
        try {
          const patchResp = await apiContext.patch(
            `/o/headless-admin-site/v1.0/sites/${siteERC}/site-pages/${pageUuid}`,
            {
              data: {
                pageSettings: {
                  type: 'ContentPageSettings',
                  hiddenFromNavigation: true,
                },
              },
            }
          );
          if (!patchResp.ok()) {
            const patchBody = await patchResp.text();
            console.warn(
              `     Failed to set hiddenFromNavigation for ${fragmentName}: ${patchResp.status()} - ${patchBody}`
            );
          }
        } catch (patchErr) {
          console.error(
            `     Exception while setting hiddenFromNavigation for ${fragmentName}:`,
            patchErr
          );
        }
      } else {
        const body = await createResp.text();
        if (
          body.includes('Duplicate') ||
          body.includes('LayoutFriendlyURLException') ||
          body.includes('LayoutFriendlyURLsException')
        ) {
          console.log(
            `     Page already exists for ${fragmentName} at ${friendlyUrl}. Deleting it to recreate...`
          );
          try {
            // Use in-memory cache to find duplicate layout to avoid heavy database lookups
            const matchedPage = existingLayouts.find(
              (l) => l.friendlyURL === friendlyUrl
            );
            if (matchedPage) {
              const deleteId = matchedPage.plid;
              console.log(
                `     Found existing page plid ${deleteId} for deletion.`
              );
              const deleteResp = await apiContext.post(
                `/api/jsonws/layout/delete-layout?p_auth=${pAuthToken}`,
                {
                  form: {
                    plid: deleteId,
                  },
                }
              );
              if (deleteResp.ok()) {
                console.log(
                  `     Successfully deleted existing page ${deleteId}. Will retry creation...`
                );
                // Remove deleted layout from cache
                existingLayouts = existingLayouts.filter(
                  (l) => l.plid !== deleteId
                );
                // Wait a brief moment to ensure DB consistency
                await new Promise((resolve) => setTimeout(resolve, 1500));
              } else {
                console.warn(
                  `     [WARN] Failed to delete existing page ${deleteId}: ${deleteResp.status()} - ${await deleteResp.text()}`
                );
              }
            } else {
              console.warn(
                `     Could not find page with URL ${friendlyUrl} in site layouts.`
              );
            }
          } catch (e) {
            console.warn(
              `     Failed to delete pre-existing page for ${fragmentName}:`,
              e.message
            );
          }
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
    // Only stagger if a page was actually created, saving substantial E2E setup time on duplicate runs.
    if (pageWasCreated) {
      await new Promise((resolve) => setTimeout(resolve, 5000));
    } else {
      await new Promise((resolve) => setTimeout(resolve, 50));
    }

    testPagesMap.push({
      collectionName: collectionName,
      fragmentName: fragmentName,
      url: friendlyUrl,
      id: pageId,
      uuid: pageUuid,
      siteERC: siteERC,
    });
  }

  // Deduplicate testPagesMap by (collectionName + fragmentName) to prevent
  // Playwright "duplicate test title" errors caused by multiple fragment.json
  // files matching the same logical fragment (e.g. versioned collection symlinks).
  const seenTestKeys = new Set();
  const uniqueTestPagesMap = testPagesMap.filter((entry) => {
    const key = `${entry.collectionName}|||${entry.fragmentName}`;
    if (seenTestKeys.has(key)) return false;
    seenTestKeys.add(key);
    return true;
  });
  console.log(
    `  -> Deduplicated test pages: ${testPagesMap.length} raw entries -> ${uniqueTestPagesMap.length} unique tests.`
  );

  // Save the mapping for the test spec
  fs.writeFileSync(
    path.join(__dirname, '..', 'generated-test-pages.json'),
    JSON.stringify(uniqueTestPagesMap, null, 2)
  );
  console.log('Finished generating test pages.');
}

module.exports = globalSetup;
