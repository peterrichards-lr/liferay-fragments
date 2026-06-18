// tests/global-setup.js
const { chromium, request } = require('@playwright/test');
const fs = require('fs');
const path = require('path');
const { globSync } = require('glob');

const projectRoot = path.join(__dirname, '..', '..');

function buildPageElementTree(
  node,
  siteERC,
  assetMap,
  defaultFragmentKey,
  defaultFragmentConfig,
  fragmentKeyToDir,
  objectDefinitions = []
) {
  if (typeof node === 'string') {
    node = { type: 'Fragment', key: node };
  }

  let type = node.type || 'Fragment';
  // Enforce correct capitalization
  if (type.toLowerCase() === 'root') type = 'Root';
  else if (type.toLowerCase() === 'section') type = 'Section';
  else if (type.toLowerCase() === 'row') type = 'Row';
  else if (type.toLowerCase() === 'column') type = 'Column';
  else if (type.toLowerCase() === 'fragment') type = 'Fragment';
  else if (type.toLowerCase() === 'form') type = 'Form';
  else if (type.toLowerCase() === 'widget') type = 'Widget';

  if (type === 'Fragment') {
    const key = node.key || defaultFragmentKey;
    const config =
      node.fragmentConfig ||
      (key === defaultFragmentKey ? defaultFragmentConfig : {});

    // Resolve configuration references
    const resolvedConfig = {};
    Object.keys(config).forEach((k) => {
      const val = config[k];
      if (typeof val === 'string' && assetMap[val]) {
        resolvedConfig[k] = assetMap[val].toString();
      } else {
        resolvedConfig[k] = val;
      }
    });

    // Resolve fragmentFields references
    const resolvedFields = [];
    if (node.fragmentFields) {
      const resolveValues = (obj) => {
        if (typeof obj === 'string') {
          if (assetMap[obj]) {
            return assetMap[obj].toString();
          }
          return obj;
        } else if (Array.isArray(obj)) {
          return obj.map(resolveValues);
        } else if (obj !== null && typeof obj === 'object') {
          const newObj = {};
          Object.keys(obj).forEach((key) => {
            newObj[key] = resolveValues(obj[key]);
          });
          return newObj;
        }
        return obj;
      };
      node.fragmentFields.forEach((field) => {
        resolvedFields.push(resolveValues(field));
      });
    }

    // Resolve if it is an input fragment
    const parentDir = fragmentKeyToDir ? fragmentKeyToDir[key] : null;
    let isInputType = false;
    if (parentDir) {
      try {
        const fragJsonPath = path.join(parentDir, 'fragment.json');
        if (fs.existsSync(fragJsonPath)) {
          const fragJson = JSON.parse(fs.readFileSync(fragJsonPath, 'utf8'));
          if (fragJson.type === 'input') {
            isInputType = true;
          }
        }
      } catch (e) {}
    }

    if (isInputType) {
      const element = {
        type: 'Fragment',
        definition: {
          fragment: {
            key: key,
            siteKey: siteERC,
          },
          fragmentConfig: {
            ...resolvedConfig,
            inputFieldId: node.fieldKey
              ? `ObjectField_${node.fieldKey}`
              : 'ObjectField_emailAddress',
          },
          fragmentFields: resolvedFields,
          indexed: true,
        },
      };
      return element;
    }

    const element = {
      type: 'Fragment',
      definition: {
        fragment: {
          key: key,
          siteKey: siteERC,
        },
        fragmentConfig: resolvedConfig,
        fragmentFields: resolvedFields,
        indexed: true,
      },
    };

    if (node.children && node.children.length > 0) {
      const parentDir = fragmentKeyToDir ? fragmentKeyToDir[key] : null;
      let dropZoneId = node.dropZoneId || '1';

      if (!node.dropZoneId && parentDir) {
        let content = '';
        const ftlPath = path.join(parentDir, 'index.ftl');
        const htmlPath = path.join(parentDir, 'index.html');
        if (fs.existsSync(ftlPath)) {
          content = fs.readFileSync(ftlPath, 'utf8');
        } else if (fs.existsSync(htmlPath)) {
          content = fs.readFileSync(htmlPath, 'utf8');
        }

        if (content) {
          const match = content.match(
            /<lfr-drop-zone[^>]+(?:id|data-lfr-drop-zone-id)=["']([^"']+)["']/i
          );
          if (match) {
            dropZoneId = match[1];
          } else {
            const tagMatch = content.match(/<lfr-drop-zone/i);
            if (tagMatch) {
              dropZoneId = '1';
            }
          }
        }
      }

      element.pageElements = [
        {
          type: 'FragmentDropZone',
          id: dropZoneId,
          pageElements: node.children.map((child) =>
            buildPageElementTree(
              child,
              siteERC,
              assetMap,
              defaultFragmentKey,
              defaultFragmentConfig,
              fragmentKeyToDir,
              objectDefinitions
            )
          ),
        },
      ];
    }

    return element;
  } else if (type === 'Form') {
    const definition = node.definition || {
      formConfig: {
        formReference: {
          className: 'com.liferay.object.model.ObjectDefinition#APPLICANT',
          classType: 0,
        },
        formType: 'simple',
        numberOfSteps: 0,
      },
      indexed: true,
      layout: {},
    };

    // Resolve className from ERC if present
    if (
      definition.formConfig &&
      definition.formConfig.formReference &&
      definition.formConfig.formReference.className &&
      definition.formConfig.formReference.className.includes('#')
    ) {
      const erc = definition.formConfig.formReference.className.split('#')[1];
      const def = objectDefinitions.find(
        (d) => d.externalReferenceCode === erc
      );
      if (def) {
        definition.formConfig.formReference.className = def.className;
        console.log(
          `       Resolved Form className for ERC ${erc}: ${def.className}`
        );
      }
    }

    const element = {
      type: 'Form',
      definition: definition,
    };

    if (node.children && node.children.length > 0) {
      element.pageElements = node.children.map((child) =>
        buildPageElementTree(
          child,
          siteERC,
          assetMap,
          defaultFragmentKey,
          defaultFragmentConfig,
          fragmentKeyToDir,
          objectDefinitions
        )
      );
    }
    return element;
  } else if (type === 'Widget') {
    return {
      type: 'Widget',
      definition: node.definition || {
        widgetInstance: {
          widgetConfig: {},
          widgetName:
            node.key ||
            'com_liferay_portal_search_web_search_bar_portlet_SearchBarPortlet',
        },
      },
      id: node.id || Math.random().toString(36).substring(7),
    };
  } else {
    // Root, Section, Row, Column
    const element = {
      type: type,
      definition: node.definition || {},
    };

    if (node.children && node.children.length > 0) {
      element.pageElements = node.children.map((child) =>
        buildPageElementTree(
          child,
          siteERC,
          assetMap,
          defaultFragmentKey,
          defaultFragmentConfig,
          fragmentKeyToDir,
          objectDefinitions
        )
      );
    }

    return element;
  }
}

async function globalSetup(config) {
  const { baseURL, storageState } = config.projects[0].use;
  // projectRoot is defined at top level

  // Get credentials from environment or use LDM defaults
  const liferayUser = process.env.LIFERAY_USER || 'test@liferay.com';
  const liferayPassword = process.env.LIFERAY_PASSWORD || 'test';
  const basicAuth = Buffer.from(`${liferayUser}:${liferayPassword}`).toString(
    'base64'
  );

  const browser = await chromium.launch();
  const context = await browser.newContext({ ignoreHTTPSErrors: true });
  const page = await context.newPage();

  console.log('Logging into Liferay as Admin...');
  await page.goto(baseURL + '/c/portal/login');

  // Wait for the login form to be available
  await page.waitForSelector('form.sign-in-form', { state: 'visible' });

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
      'com.liferay.object.rest.internal.resource.v1_0.ObjectEntryResourceImpl',
      'com.liferay.object.rest.resource.v1_0.ObjectEntryResource',
      'com.liferay.object.rest.internal.resource.v1_0.ObjectEntryRelatedObjectsResourceImpl',
      'com.liferay.object.rest.resource.v1_0.ObjectEntryRelatedObjectsResource',
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

    // Dynamically aggregate requiredObjects from test-data.json manifests
    const fs = require('fs');
    const path = require('path');
    const { globSync } = require('glob');

    const dynamicERCs = new Set([
      'WATER_READING',
      'SALES_REPORT',
      'COMPANY_MILESTONE',
      'PRODUCT_SHOWCASE',
      'ACTIVITY_LOG',
      'TICKET_COMMENT',
      'TICKET',
      'HEART_RATE',
      'BLOOD_PRESSURE',
      'STEPS',
      'WEIGHT',
      'APPLICANT',
      'CAMPAIGN',
      'CAMPAIGN_INTERACTION',
      'AUDIT_ENTRY',
      'LOAN_APPLICATION',
      'OTP_VERIFICATION',
    ]);

    // projectRoot is defined at top level
    const testDataFiles = globSync('**/test-data.json', {
      cwd: projectRoot,
      absolute: true,
      ignore: [
        '**/node_modules/**',
        '**/e2e-tests/**',
        '**/zips/**',
        '**/temp*/**',
      ],
    });

    let filteredTestDataFiles = testDataFiles;
    if (process.env.TEST_FILTER) {
      let filterRegex;
      try {
        filterRegex = new RegExp(process.env.TEST_FILTER, 'i');
      } catch (e) {
        const escaped = process.env.TEST_FILTER.replace(
          /[-\/\\^$*+?.()|[\]{}]/g,
          '\\$&'
        );
        filterRegex = new RegExp(escaped, 'i');
      }
      filteredTestDataFiles = testDataFiles.filter((file) => {
        const parentDir = path.dirname(file);
        const fragmentFolder = path.basename(parentDir);
        let collectionFolder = '';
        let currentDir = parentDir;
        while (
          currentDir !== '..' &&
          currentDir !== '/' &&
          currentDir !== '.'
        ) {
          const collectionFile = path.join(currentDir, 'collection.json');
          if (fs.existsSync(collectionFile)) {
            collectionFolder = path.basename(currentDir);
            break;
          }
          const parent = path.dirname(currentDir);
          if (parent === currentDir) break;
          currentDir = parent;
        }
        return (
          filterRegex.test(fragmentFolder) || filterRegex.test(collectionFolder)
        );
      });
    }

    filteredTestDataFiles.forEach((file) => {
      try {
        const data = JSON.parse(fs.readFileSync(file, 'utf8'));
        if (data.requiredObjects && Array.isArray(data.requiredObjects)) {
          data.requiredObjects.forEach((erc) => dynamicERCs.add(erc));
        }
      } catch (e) {}
    });

    const objectERCs = Array.from(dynamicERCs);

    const basicAuth = Buffer.from(`${liferayUser}:${liferayPassword}`).toString(
      'base64'
    );
    const headers = { Authorization: `Basic ${basicAuth}` };

    for (const erc of objectERCs) {
      console.log(`  -> Configuring Guest permissions for ${erc}...`);

      // Resolve object definition ID via Admin REST API (with retry to handle asynchronous Liferay deployment)
      let objResp;
      let attempts = 0;
      const maxAttempts = 5;
      while (attempts < maxAttempts) {
        objResp = await page.request.get(
          `${baseURL}/o/object-admin/v1.0/object-definitions/by-external-reference-code/${erc}`,
          { headers }
        );
        if (objResp.ok()) break;
        attempts++;
        if (attempts < maxAttempts) {
          console.log(
            `     Object Definition ${erc} not found yet. Retrying in 3 seconds (Attempt ${attempts}/${maxAttempts})...`
          );
          await new Promise((resolve) => setTimeout(resolve, 3000));
        }
      }

      if (!objResp.ok()) {
        console.warn(
          `     [WARN] Object Definition ${erc} not found in portal: status ${objResp.status()}`
        );
        continue;
      }

      const objJson = await objResp.json();
      const objId = objJson.id;
      const className = objJson.className;
      const hashPart = className ? className.split('#')[1] : null;

      if (!hashPart) {
        console.warn(
          `     [WARN] Could not parse className hash suffix from: ${className}`
        );
        continue;
      }

      // --- STEP 1: Set Object Definition Level Permissions ---
      const defPermissionsUrl = `${baseURL}/group/control_panel/manage?p_p_id=com_liferay_portlet_configuration_web_portlet_PortletConfigurationPortlet&_com_liferay_portlet_configuration_web_portlet_PortletConfigurationPortlet_mvcPath=%2Fedit_permissions.jsp&_com_liferay_portlet_configuration_web_portlet_PortletConfigurationPortlet_modelResource=com.liferay.object.model.ObjectDefinition&_com_liferay_portlet_configuration_web_portlet_PortletConfigurationPortlet_resourcePrimKey=${objId}`;

      await page.goto(defPermissionsUrl);
      await page.waitForSelector('form#fm, table', {
        state: 'visible',
        timeout: 10000,
      });

      const guestRow = page.locator('tr:has-text("Guest")');
      if ((await guestRow.count()) > 0) {
        const viewCheckbox = guestRow.locator('input[id="guest_ACTION_VIEW"]');
        if ((await viewCheckbox.count()) > 0) {
          const isChecked = await viewCheckbox.isChecked();
          if (!isChecked) {
            console.log(
              `     Checking VIEW checkbox for Guest on ObjectDefinition...`
            );
            await viewCheckbox.check();
            const saveButton = page.locator(
              'button[type="submit"]:has-text("Save"), button.btn-primary:has-text("Save")'
            );
            if ((await saveButton.count()) > 0) {
              await Promise.all([
                page.waitForNavigation({ waitUntil: 'load' }),
                saveButton.first().click(),
              ]);
              console.log(
                `     Successfully saved Guest ObjectDefinition VIEW permission for ${erc}.`
              );
            }
          } else {
            console.log(
              `     Guest VIEW permission on ObjectDefinition already up-to-date for ${erc}.`
            );
          }
        }
      }

      // --- STEP 2: Set Object Entry Level Permissions in Guest Role ---
      const roleId = '20106'; // Guest Role ID
      const rolePermissionsUrl = `${baseURL}/group/control_panel/manage?p_p_id=com_liferay_roles_admin_web_portlet_RolesAdminPortlet&p_p_lifecycle=0&p_p_state=maximized&p_p_mode=view&_com_liferay_roles_admin_web_portlet_RolesAdminPortlet_mvcPath=%2Fedit_role_permissions.jsp&_com_liferay_roles_admin_web_portlet_RolesAdminPortlet_cmd=edit&_com_liferay_roles_admin_web_portlet_RolesAdminPortlet_portletResource=com_liferay_object_web_internal_object_definitions_portlet_ObjectDefinitionsPortlet_${hashPart}&_com_liferay_roles_admin_web_portlet_RolesAdminPortlet_tabs1=define-permissions&_com_liferay_roles_admin_web_portlet_RolesAdminPortlet_tabs2=roles&_com_liferay_roles_admin_web_portlet_RolesAdminPortlet_accountRoleGroupScope=false&_com_liferay_roles_admin_web_portlet_RolesAdminPortlet_roleId=${roleId}`;

      await page.goto(rolePermissionsUrl);
      await page.waitForSelector('form, table', {
        state: 'visible',
        timeout: 10000,
      });

      const targetCheckboxes = [
        `com.liferay.object#${objId}ADD_OBJECT_ENTRY`,
        `com.liferay.object.model.ObjectDefinition#${hashPart}VIEW`,
        `com_liferay_object_web_internal_object_definitions_portlet_ObjectDefinitionsPortlet_${hashPart}VIEW`,
      ];

      let entryChanged = false;
      for (const value of targetCheckboxes) {
        const checkbox = page.locator(
          `input[type="checkbox"][value="${value}"]`
        );
        if ((await checkbox.count()) > 0) {
          const isChecked = await checkbox.isChecked();
          if (!isChecked) {
            console.log(
              `     Checking Guest role checkbox for value: ${value}`
            );
            await checkbox.check();
            entryChanged = true;
          }
        } else {
          console.warn(`     [WARN] Checkbox not found for value: ${value}`);
        }
      }

      if (entryChanged) {
        const saveButton = page
          .locator(
            'button[type="submit"]:has-text("Save"), button.btn-primary:has-text("Save")'
          )
          .first();
        if ((await saveButton.count()) > 0) {
          await Promise.all([
            page.waitForNavigation({ waitUntil: 'load' }),
            saveButton.click(),
          ]);
          console.log(
            `     Successfully saved Guest entry permissions for ${erc}.`
          );
        } else {
          console.warn(
            `     [WARN] Guest role save button not found for ${erc}.`
          );
        }
      } else {
        console.log(
          `     Guest entry permissions are already up-to-date for ${erc}.`
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

  // ----- PHASE 5.05: DETECT LIFERAY VERSION & SCHEMA COMPATIBILITY -----
  let realisedVersion = process.env.LIFERAY_VERSION || '';
  let useStringForNumbers = true;

  if (!realisedVersion) {
    try {
      const versionResp = await apiContext.post(
        `/api/jsonws/portal/get-version?p_auth=${pAuthToken}`
      );
      if (versionResp.ok()) {
        realisedVersion = (await versionResp.text()).replace(/"/g, '').trim();
      }
    } catch (err) {
      console.warn(
        '  [WARN] Failed to query Liferay version via JSON WS:',
        err.message
      );
    }
  }

  console.log(
    `  -> Realised Liferay DXP version for page seeding: ${realisedVersion}`
  );
  console.log(
    `  -> Page seeding dataType:number overrides will use: ${useStringForNumbers ? 'String' : 'Number'}`
  );

  // ----- PHASE 5.1: VERIFY DEPLOYMENT VIA JSON WS -----
  console.log(
    'Verifying fragment deployment via JSON WS (per docs E2E exception)...'
  );
  let registeredKeys = [];
  let verificationSucceeded = false;
  try {
    // Find the Global site to query fragment collections since they are auto-deployed globally
    const globalSite =
      siteData.items.find(
        (s) => s.name === 'Global' || s.externalReferenceCode === 'GLOBAL'
      ) || targetSite;
    let querySiteId = globalSite.id;

    // 1. Get all fragment collections using the CSRF token
    let collectionsResp = await apiContext.post(
      `/api/jsonws/fragment.fragmentcollection/get-fragment-collections?p_auth=${pAuthToken}`,
      {
        form: {
          groupId: querySiteId,
          start: -1,
          end: -1,
        },
      }
    );

    let collections = [];
    if (collectionsResp.ok()) {
      collections = await collectionsResp.json();
    }

    // Fallback to Guest site if no collections found on Global
    if (collections.length === 0 && querySiteId !== siteId) {
      console.log(
        `  -> No collections found on Global site (ID: ${querySiteId}). Trying Guest site (ID: ${siteId})...`
      );
      querySiteId = siteId;
      collectionsResp = await apiContext.post(
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
        collections = await collectionsResp.json();
      }
    }

    if (collections.length > 0) {
      verificationSucceeded = true;

      // 2. Loop through each collection and get its entries
      for (const collection of collections) {
        const entriesResp = await apiContext.post(
          `/api/jsonws/fragment.fragmententry/get-fragment-entries?p_auth=${pAuthToken}`,
          {
            form: {
              groupId: querySiteId,
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
        `  -> JSON WS fragment verification returned 0 collections. Proceeding with optimistic generation...`
      );
    }
  } catch (e) {
    console.error('  -> Error calling JSON WS for fragment verification:', e);
  }

  // Build a comprehensive map of all fragment keys to their directory paths (unfiltered)
  const allFragmentFiles = globSync('**/fragment.json', {
    cwd: projectRoot,
    absolute: true,
    ignore: [
      '**/node_modules/**',
      '**/temp*/**',
      '**/zips/**',
      '**/e2e-tests/**',
    ],
  });
  const fragmentKeyToDir = {};
  for (const file of allFragmentFiles) {
    try {
      const fragmentData = JSON.parse(fs.readFileSync(file, 'utf8'));
      const baseFragmentKey =
        fragmentData.key || path.basename(path.dirname(file));
      fragmentKeyToDir[baseFragmentKey] = path.dirname(file);
    } catch (e) {}
  }

  // Dynamically ignore any local LDM sandbox project directories to avoid scanning them
  const ldmIgnores = [];
  try {
    const registryPath = path.join(
      require('os').homedir(),
      '.ldm',
      'registry.json'
    );
    if (fs.existsSync(registryPath)) {
      const registry = JSON.parse(fs.readFileSync(registryPath, 'utf8'));
      Object.values(registry).forEach((proj) => {
        if (proj.path) {
          const rel = path.relative(projectRoot, proj.path);
          if (!rel.startsWith('..') && !path.isAbsolute(rel) && rel !== '') {
            ldmIgnores.push(`**/${rel}/**`);
          }
        }
      });
    }
  } catch (e) {}

  let fragmentFiles = globSync('**/fragment.json', {
    cwd: projectRoot,
    absolute: true,
    ignore: [
      '**/node_modules/**',
      '**/temp*/**',
      '**/zips/**',
      '**/e2e-tests/**',
      ...ldmIgnores,
    ],
  });

  if (process.env.TEST_FILTER) {
    let filterRegex;
    try {
      filterRegex = new RegExp(process.env.TEST_FILTER, 'i');
    } catch (e) {
      const escaped = process.env.TEST_FILTER.replace(
        /[-\/\\^$*+?.()|[\]{}]/g,
        '\\$&'
      );
      filterRegex = new RegExp(escaped, 'i');
    }
    fragmentFiles = fragmentFiles.filter((file) => {
      const fragmentData = JSON.parse(fs.readFileSync(file, 'utf8'));
      const fragmentName = fragmentData.name || '';
      const baseFragmentKey =
        fragmentData.key || path.basename(path.dirname(file));

      let currentDir = path.dirname(file);
      let collectionName = '';
      while (currentDir !== '..' && currentDir !== '/' && currentDir !== '.') {
        const collectionFile = path.join(currentDir, 'collection.json');
        if (fs.existsSync(collectionFile)) {
          const collData = JSON.parse(fs.readFileSync(collectionFile, 'utf8'));
          collectionName = collData.name || '';
          break;
        }
        const parent = path.dirname(currentDir);
        if (parent === currentDir) break;
        currentDir = parent;
      }
      if (!collectionName) {
        const parentDirName = path.basename(path.dirname(path.dirname(file)));
        if (parentDirName !== 'fragments' && parentDirName !== '..') {
          collectionName = parentDirName;
        }
      }

      return (
        filterRegex.test(collectionName) ||
        filterRegex.test(fragmentName) ||
        filterRegex.test(baseFragmentKey)
      );
    });
    console.log(
      `  -> Test filter '${process.env.TEST_FILTER}' applied: Seeding ${fragmentFiles.length} matching pages.`
    );
  }

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

  // Fetch all object definitions to resolve site-scoped API paths
  let objectDefinitions = [];
  try {
    const objDefsResp = await apiContext.get(
      `/o/object-admin/v1.0/object-definitions?pageSize=100`
    );
    if (objDefsResp.ok()) {
      const objDefsJson = await objDefsResp.json();
      objectDefinitions = objDefsJson.items || [];
      console.log(
        `  -> Retrieved ${objectDefinitions.length} object definitions for scope mapping.`
      );
    }
  } catch (e) {
    console.warn('  -> [WARN] Failed to fetch object definitions:', e.message);
  }

  // ----- SEED CUSTOM SHOWCASE OBJECT ENTRIES -----
  try {
    console.log('Seeding custom showcase object entries...');
    const showcaseRoot = path.join(
      __dirname,
      '..',
      '..',
      'other-resources',
      'showcase-data'
    );
    if (fs.existsSync(showcaseRoot)) {
      const dirs = fs.readdirSync(showcaseRoot);
      for (const dirName of dirs) {
        const dirPath = path.join(showcaseRoot, dirName);
        if (!fs.statSync(dirPath).isDirectory()) continue;

        const defFile = path.join(
          dirPath,
          'batch',
          '01-object-definition.batch-engine-data.json'
        );
        const entryFile = path.join(
          dirPath,
          'batch',
          '02-object-entry.batch-engine-data.json'
        );

        if (fs.existsSync(defFile) && fs.existsSync(entryFile)) {
          const defJson = JSON.parse(fs.readFileSync(defFile, 'utf8'));
          const entryJson = JSON.parse(fs.readFileSync(entryFile, 'utf8'));

          if (defJson.items && defJson.items[0] && entryJson.items) {
            const objERC = defJson.items[0].externalReferenceCode;
            // Look up definition
            const matchedDef = objectDefinitions.find(
              (d) => d.externalReferenceCode === objERC
            );
            if (matchedDef) {
              const restContextPath = matchedDef.restContextPath;
              const isSiteScoped = matchedDef.scope === 'site';
              const baseEndpoint = isSiteScoped
                ? `${restContextPath}/scopes/${siteId}`
                : restContextPath;

              console.log(
                `  -> Seeding entries for Object ${objERC} using endpoint ${baseEndpoint}...`
              );

              for (const entry of entryJson.items) {
                const erc = entry.externalReferenceCode;
                if (!erc) continue;

                // Check if entry already exists
                let exists = false;
                try {
                  const checkResp = await apiContext.get(
                    `${restContextPath}/by-external-reference-code/${erc}`
                  );
                  if (checkResp.ok()) {
                    exists = true;
                  }
                } catch (e) {}

                if (!exists) {
                  const postResp = await apiContext.post(baseEndpoint, {
                    data: entry,
                  });
                  if (postResp.ok()) {
                    console.log(
                      `     Successfully seeded entry ${erc} for ${objERC}`
                    );
                  } else {
                    console.warn(
                      `     [WARN] Failed to seed entry ${erc} for ${objERC}: ${postResp.status()} - ${await postResp.text()}`
                    );
                  }
                } else {
                  console.log(
                    `     Entry ${erc} already exists for ${objERC}. Skipping.`
                  );
                }
              }
            } else {
              console.warn(
                `  -> [WARN] Object definition not found in Liferay for ERC: ${objERC}`
              );
            }
          }
        }
      }
    }
  } catch (shErr) {
    console.warn(
      '  -> [WARN] Error during custom showcase object entry seeding:',
      shErr.message
    );
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
    let testData = null;
    const assetMap = {}; // Maps ERC -> Liferay ID

    if (fs.existsSync(testDataFile)) {
      console.log(
        `     Found E2E test data manifest at ${testDataFile}. Seeding assets...`
      );
      try {
        testData = JSON.parse(fs.readFileSync(testDataFile, 'utf8'));

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
        if (testData.webContentStructures) {
          for (const struct of testData.webContentStructures) {
            console.log(
              `       Resolving Structure ID for: ${struct.name} (${struct.externalReferenceCode})...`
            );
            let structId = '';

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
                if (fetchJson && fetchJson.structureId) {
                  structId = fetchJson.structureId;
                  console.log(
                    `       Found existing structure ${struct.externalReferenceCode} -> ID ${structId}`
                  );
                }
              }
            }

            if (!structId) {
              console.log(
                `       Structure ${struct.externalReferenceCode} not found. Creating via JSON WS...`
              );
              try {
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
                  seededAssets.push({
                    type: 'structure',
                    id: structId,
                    erc: struct.externalReferenceCode,
                  });
                }
              } catch (err) {}
            }

            if (structId) {
              assetMap[struct.externalReferenceCode] = structId;
            }
          }
        }

        // 2. Seed Web Content Articles
        if (testData.webContentArticles) {
          for (const article of testData.webContentArticles) {
            console.log(
              `       Creating Article: ${article.title} (${article.externalReferenceCode})...`
            );

            const structId = assetMap[article.structureERC] || '';
            const payloadFields = [];

            if (article.contentFields) {
              article.contentFields.forEach((f) => {
                let val = f.value;
                if (typeof val === 'string' && assetMap[val]) {
                  val = assetMap[val];
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

            if (articleResp.ok()) {
              const articleJson = await articleResp.json();
              assetMap[article.externalReferenceCode] = articleJson.id;
              seededAssets.push({
                type: 'article',
                id: articleJson.id,
                erc: article.externalReferenceCode,
              });
            } else if (articleResp.status() === 409) {
              // Re-use article id for assetMap mapping even if it was not created this turn.
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
          Object.keys(seededConfigOverrides).forEach((key) => {
            const val = seededConfigOverrides[key];
            if (typeof val === 'string') {
              if (assetMap[val]) {
                seededConfigOverrides[key] = assetMap[val].toString();
              } else if (val.includes('/o/c/')) {
                let cleanPath = val.trim().replace(/\/$/, '');
                const def = objectDefinitions.find(
                  (d) => d.restContextPath === cleanPath
                );
                if (def && def.scope === 'site') {
                  seededConfigOverrides[key] =
                    `${cleanPath}/scopes/${siteId}${val.endsWith('/') ? '/' : ''}`;
                }
              }
            }
          });
        }
      } catch (err) {
        console.error(`     [ERROR] Exception while seeding test data:`, err);
      }
    }

    const pageTitle = `Test: ${fragmentName}`;
    const sanitizedKey = baseFragmentKey
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
    const sanitizedCollection = collectionName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
    let friendlyUrl = `/test-${sanitizedCollection}-${sanitizedKey}`;

    console.log(
      `  -> Creating page for ${fragmentName} (${fragmentKey}) in ${collectionName}...`
    );

    let rootPageElement = null;

    if (testData && testData.pageLayout) {
      try {
        rootPageElement = buildPageElementTree(
          testData.pageLayout,
          siteERC,
          assetMap,
          fragmentKey,
          seededConfigOverrides,
          fragmentKeyToDir,
          objectDefinitions
        );
      } catch (e) {
        console.warn(
          `     [WARN] Failed to build custom pageLayout:`,
          e.message
        );
      }
    }

    if (!rootPageElement) {
      if (fragmentData.type === 'input') {
        const applicantDef = objectDefinitions.find(
          (d) => d.externalReferenceCode === 'APPLICANT'
        );
        const applicantClassName = applicantDef
          ? applicantDef.className
          : 'com.liferay.object.model.ObjectDefinition#O0U8';

        rootPageElement = {
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
                        width: '100%',
                      },
                      pageElements: [
                        {
                          type: 'Fragment',
                          definition: {
                            fragment: {
                              key: fragmentKey,
                              siteKey: siteERC,
                            },
                            fragmentConfig: {
                              ...seededConfigOverrides,
                              inputFieldId: 'ObjectField_emailAddress',
                            },
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
        };
      } else {
        rootPageElement = {
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
                        width: '100%',
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
        };
      }
    }

    const payload = {
      title: pageTitle,
      friendlyUrlPath: friendlyUrl,
      pageType: 'content',
      pageDefinition: {
        pageElement: rootPageElement,
        settings: {
          colorSchemeName: '01',
          themeName: 'Classic',
          ...(testData && testData.pageConfig && testData.pageConfig.settings
            ? testData.pageConfig.settings
            : {}),
        },
      },
    };

    let success = false;
    let pageWasCreated = false;
    let attempts = 0;
    let pageId = null;
    let pageUuid = null;
    const maxAttempts = 5;

    while (attempts < maxAttempts && !success) {
      attempts++;
      try {
        const createResp = await apiContext.post(
          `/o/headless-delivery/v1.0/sites/${siteId}/site-pages`,
          {
            data: payload,
            timeout: 30000,
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

          // Hide from nav
          try {
            await apiContext.patch(
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
          } catch (patchErr) {}
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
              const matchedPage = existingLayouts.find(
                (l) => l.friendlyURL === friendlyUrl
              );
              if (matchedPage) {
                const deleteId = matchedPage.plid;
                const deleteResp = await apiContext.post(
                  `/api/jsonws/layout/delete-layout?p_auth=${pAuthToken}`,
                  {
                    form: {
                      plid: deleteId,
                    },
                  }
                );
                if (deleteResp.ok()) {
                  existingLayouts = existingLayouts.filter(
                    (l) => l.plid !== deleteId
                  );
                  await new Promise((resolve) => setTimeout(resolve, 2000));
                }
              }
            } catch (e) {}
          } else {
            console.warn(
              `     [Attempt ${attempts}] Failed to create page for ${fragmentName}: ${createResp.status()} - ${body}`
            );
            if (attempts < maxAttempts) {
              await new Promise((resolve) => setTimeout(resolve, 3000));
            }
          }
        }
      } catch (err) {
        if (attempts < maxAttempts) {
          await new Promise((resolve) => setTimeout(resolve, 5000));
        }
      }
    }

    if (pageWasCreated) {
      await new Promise((resolve) => setTimeout(resolve, 2000));
    } else {
      await new Promise((resolve) => setTimeout(resolve, 50));
    }

    const isDeprecatedFlag =
      fragmentName &&
      (fragmentName.includes('(Deprecated)') ||
        fragmentName.includes('(DEPRECATED)'));
    testPagesMap.push({
      collectionName: collectionName,
      fragmentName: fragmentName,
      url: friendlyUrl,
      id: pageId,
      uuid: pageUuid,
      siteERC: siteERC,
      excludeFromGallery:
        isDeprecatedFlag || (testData ? !!testData.excludeFromGallery : false),
    });
  }

  const seenTestKeys = new Set();
  const uniqueTestPagesMap = testPagesMap.filter((entry) => {
    const key = `${entry.collectionName}|||${entry.fragmentName}`;
    if (seenTestKeys.has(key)) return false;
    seenTestKeys.add(key);
    return true;
  });

  fs.writeFileSync(
    path.join(__dirname, '..', 'generated-test-pages.json'),
    JSON.stringify(uniqueTestPagesMap, null, 2)
  );

  await apiContext.dispose();
  console.log('Finished generating test pages.');
}

module.exports = globalSetup;
