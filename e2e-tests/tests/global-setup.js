// tests/global-setup.js
const { chromium, request } = require('@playwright/test');
const fs = require('fs');
const path = require('path');
const { globSync } = require('glob');

const projectRoot = path.join(__dirname, '..', '..');

let globalSiteKey = 'L_GLOBAL';
const dbFragmentKeyToERC = {};

function convertConfigToFieldValues(config, fragmentDir) {
  const fieldValues = {};
  if (!config) return fieldValues;

  let fieldsConfig = {};
  if (fragmentDir) {
    try {
      const configPath = path.join(fragmentDir, 'main/configuration.json');
      if (fs.existsSync(configPath)) {
        const configJson = JSON.parse(fs.readFileSync(configPath, 'utf8'));
        if (configJson.fieldSets) {
          configJson.fieldSets.forEach((set) => {
            if (set.fields) {
              set.fields.forEach((f) => {
                fieldsConfig[f.name] = f;
              });
            }
          });
        }
      }
    } catch (e) {
      // Ignore reading errors
    }
  }

  Object.keys(config).forEach((k) => {
    const val = config[k];
    const fieldDef = fieldsConfig[k] || {};
    const uiType = fieldDef.type || 'text'; // default to text
    let type = 'Text';

    if (uiType === 'checkbox') {
      type = 'Checkbox';
    } else if (uiType === 'select') {
      type = 'Select';
    } else if (uiType === 'item') {
      type = 'Item';
    } else if (uiType === 'collection') {
      type = 'Collection';
    } else if (uiType === 'url') {
      type = 'URL';
    } else if (uiType === 'video') {
      type = 'Video';
    } else if (uiType === 'colorPalette') {
      type = 'ColorPalette';
    } else if (uiType === 'colorPicker') {
      type = 'ColorPicker';
    } else if (uiType === 'length') {
      type = 'Length';
    }

    if (type === 'Checkbox') {
      fieldValues[k] = {
        type: type,
        value: typeof val === 'string' ? val === 'true' : !!val,
      };
    } else {
      fieldValues[k] = {
        type: type,
        value: val !== null && val !== undefined ? val.toString() : '',
      };
    }
  });

  return fieldValues;
}

function getFragmentERC(key, fragmentKeyToDir) {
  if (dbFragmentKeyToERC[key]) {
    return dbFragmentKeyToERC[key];
  }
  const dir = fragmentKeyToDir ? fragmentKeyToDir[key] : null;
  if (dir) {
    const grandparentDir = path.dirname(path.dirname(dir));
    const collectionFolderName = path.basename(grandparentDir);
    return `${collectionFolderName}-${key}`;
  }
  return `form-fragments-${key}`;
}

async function getAssetEntryId(apiContext, pAuthToken, className, classPK) {
  try {
    const resp = await apiContext.post(
      `/api/jsonws/assetentry/get-entry?p_auth=${pAuthToken}`,
      {
        form: {
          className: className,
          classPK: classPK.toString(),
        },
      }
    );
    if (resp.ok()) {
      const json = await resp.json();
      return json.entryId;
    } else {
      console.warn(
        `       [WARN] Failed to get asset entry for ${className} / ${classPK}: ${resp.status()}`
      );
    }
  } catch (err) {
    console.error(`       [ERROR] Exception getting asset entry:`, err.message);
  }
  return null;
}

async function seedCollection(
  apiContext,
  pAuthToken,
  siteId,
  collection,
  assetMap,
  assetEntryIdMap
) {
  const erc = collection.externalReferenceCode;
  const title = collection.name;

  // 1. Resolve assetEntryIds of items
  const resolvedAssetEntryIds = [];
  if (collection.items) {
    for (const item of collection.items) {
      if (
        item.externalReferenceCode &&
        assetEntryIdMap[item.externalReferenceCode]
      ) {
        resolvedAssetEntryIds.push(assetEntryIdMap[item.externalReferenceCode]);
      } else {
        console.warn(
          `       [WARN] Item ERC ${item.externalReferenceCode} not found in assetEntryIdMap. Skipping item.`
        );
      }
    }
  }

  console.log(
    `       Seeding Asset Collection ${title} (${erc}) with ${resolvedAssetEntryIds.length} item(s)...`
  );

  // 2. Check if the collection already exists
  let existingId = null;
  try {
    const checkResp = await apiContext.post(
      `/api/jsonws/assetlist.assetlistentry/get-asset-list-entry-by-external-reference-code?p_auth=${pAuthToken}`,
      {
        form: {
          externalReferenceCode: erc,
          groupId: siteId.toString(),
        },
      }
    );
    if (checkResp.ok()) {
      const json = await checkResp.json();
      if (json && json.assetListEntryId) {
        existingId = json.assetListEntryId;
      }
    }
  } catch (err) {
    // Ignore error if it doesn't exist
  }

  // 3. If it exists, delete it first to ensure fresh seed
  if (existingId) {
    console.log(
      `       Existing collection found with ID ${existingId}. Deleting...`
    );
    try {
      await apiContext.post(
        `/api/jsonws/assetlist.assetlistentry/delete-asset-list-entry?p_auth=${pAuthToken}`,
        {
          form: {
            assetListEntryId: existingId.toString(),
          },
        }
      );
    } catch (err) {
      console.warn(
        `       [WARN] Failed to delete existing collection:`,
        err.message
      );
    }
  }

  // 4. Create collection via JSON WS
  try {
    const createResp = await apiContext.post(
      `/api/jsonws/assetlist.assetlistentry/add-manual-asset-list-entry?contextName=assetlist&p_auth=${pAuthToken}`,
      {
        form: {
          externalReferenceCode: erc,
          groupId: siteId.toString(),
          title: title,
          assetEntryIds: JSON.stringify(resolvedAssetEntryIds),
          'serviceContext.addGuestPermissions': 'true',
          'serviceContext.addGroupPermissions': 'true',
        },
      }
    );
    if (createResp.ok()) {
      const createdJson = await createResp.json();
      console.log(
        `       Successfully seeded Asset Collection ${title} -> ID: ${createdJson.assetListEntryId}`
      );
      assetMap[erc] = createdJson.assetListEntryId;
      return createdJson.assetListEntryId;
    } else {
      console.error(
        `       [ERROR] Failed to seed collection: ${createResp.status()} - ${await createResp.text()}`
      );
    }
  } catch (err) {
    console.error(`       [ERROR] Exception seeding collection:`, err.message);
  }
  return null;
}

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
  else if (type.toLowerCase() === 'formcontainer') type = 'FormContainer';
  else if (type.toLowerCase() === 'formfragment') type = 'FormFragment';
  else if (type.toLowerCase() === 'widget') type = 'Widget';

  if (type === 'Fragment') {
    let key = node.key || defaultFragmentKey;
    if (key === 'rich-text') {
      key = 'BASIC_COMPONENT-html'; // pragma: allowlist secret
    }
    const config =
      node.fragmentConfig ||
      (key === defaultFragmentKey ? defaultFragmentConfig : {});

    // Resolve configuration references
    const resolvedConfig = {};
    Object.keys(config).forEach((k) => {
      const val = config[k];
      if (typeof val === 'string') {
        let replacedStr = val;
        // Check exact match first
        if (assetMap[val]) {
          resolvedConfig[k] = assetMap[val];
        } else {
          let replacedStr = val;
          // Check substring matches for stringified JSON (like optionsJSON in image-choice)
          Object.keys(assetMap).forEach((assetKey) => {
            if (replacedStr.includes(assetKey)) {
              // Note: using string split/join to support all environments for replaceAll
              replacedStr = replacedStr
                .split(assetKey)
                .join(assetMap[assetKey].toString());
            }
          });
          resolvedConfig[k] = replacedStr;
        }
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
        const resolvedField = resolveValues(field);
        if (key === 'BASIC_COMPONENT-html' && resolvedField.id === 'text') {
          resolvedField.id = 'element-html';
          if (resolvedField.value && resolvedField.value.text) {
            resolvedField.value.html = resolvedField.value.text;
            delete resolvedField.value.text;
          }
        }
        resolvedFields.push(resolvedField);
      });
    }

    // Resolve if it is an input fragment
    const parentDir = fragmentKeyToDir ? fragmentKeyToDir[key] : null;
    let isInputType = false;

    const definition = {
      type: 'BasicFragment',
      fragment: {
        key: key,
        siteKey: globalSiteKey,
      },
      fragmentConfig: resolvedConfig,
      fragmentFields: resolvedFields,
      indexed: true,
    };
    const element = {
      type: 'Fragment',
      definition: definition,
    };

    if (node.dropZones) {
      element.pageElements = node.dropZones.map((dz) => {
        const uniqueDropZoneId = Math.random().toString(36).substring(7);
        const definition = {
          type: 'FragmentDropZone',
          fragmentDropZoneId: dz.id || '1',
        };
        return {
          type: 'FragmentDropZone',
          id: uniqueDropZoneId,
          definition: definition,
          pageElements: dz.children.map((child) =>
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
        };
      });
    } else if (node.children && node.children.length > 0) {
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

      const uniqueDropZoneId = Math.random().toString(36).substring(7);
      const dropZoneDefinition = {
        type: 'FragmentDropZone',
        fragmentDropZoneId: dropZoneId,
      };
      element.pageElements = [
        {
          type: 'FragmentDropZone',
          id: uniqueDropZoneId,
          definition: dropZoneDefinition,
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
  } else if (type === 'FormFragment') {
    const key = node.key || defaultFragmentKey;
    const config =
      node.fragmentConfig ||
      (key === defaultFragmentKey ? defaultFragmentConfig : {});

    // Resolve configuration references
    const resolvedConfig = {};
    Object.keys(config).forEach((k) => {
      const val = config[k];
      if (typeof val === 'string') {
        let replacedStr = val;
        // Check exact match first
        if (assetMap[val]) {
          resolvedConfig[k] = assetMap[val];
        } else {
          let replacedStr = val;
          // Check substring matches for stringified JSON (like optionsJSON in image-choice)
          Object.keys(assetMap).forEach((assetKey) => {
            if (replacedStr.includes(assetKey)) {
              // Note: using string split/join to support all environments for replaceAll
              replacedStr = replacedStr
                .split(assetKey)
                .join(assetMap[assetKey].toString());
            }
          });
          resolvedConfig[k] = replacedStr;
        }
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

    const parentDir = fragmentKeyToDir ? fragmentKeyToDir[key] : null;
    const fieldKey =
      node.fieldKey ||
      (node.fragmentConfig && node.fragmentConfig.inputFieldId) ||
      'emailAddress';

    const definition = {
      type: 'FormFragment',
      fieldKey: fieldKey.startsWith('ObjectField_')
        ? fieldKey
        : `ObjectField_${fieldKey}`,
      fragment: {
        key: key,
        siteKey: globalSiteKey,
      },
      fragmentConfig: {
        ...resolvedConfig,
        inputFieldId: fieldKey.startsWith('ObjectField_')
          ? fieldKey
          : `ObjectField_${fieldKey}`,
      },
      fragmentFields: resolvedFields,
    };
    const element = {
      type: 'FormFragment',
      definition: definition,
    };
    return element;
  } else if (type === 'Form' || type === 'FormContainer') {
    // Build FormContainer
    let className = 'com.liferay.object.model.ObjectDefinition#APPLICANT';
    if (
      node.definition &&
      node.definition.formConfig &&
      node.definition.formConfig.formReference
    ) {
      className =
        node.definition.formConfig.formReference.className || className;
    } else if (
      node.definition &&
      node.definition.formContainerConfig &&
      node.definition.formContainerConfig.formContainerReference
    ) {
      className =
        node.definition.formContainerConfig.formContainerReference.className ||
        className;
    }
    // Resolve className from ERC if present
    if (className.includes('#')) {
      const erc = className.split('#')[1];
      const def = objectDefinitions.find(
        (d) => d.externalReferenceCode === erc
      );
      if (def) {
        className = def.className;
        console.log(
          `       Resolved Form className for ERC ${erc}: ${def.className}`
        );
      }
    }

    const definition = {
      type: 'FormContainer',
      formConfig: {
        formReference: {
          className: className,
          type: 'FormClassSubtypeReference',
        },
        formType: 'simple',
        numberOfSteps: 1,
      },
      indexed: true,
      layout: {},
    };

    const element = {
      type: 'FormContainer',
      definition: definition,
    };

    if (node.pageElements) {
      element.pageElements = node.pageElements.map((child) =>
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
    } else if (node.children && node.children.length > 0) {
      const flattenFormElements = (childrenList) => {
        let list = [];
        for (let child of childrenList) {
          if (typeof child === 'string') {
            child = { type: 'FormFragment', key: child };
          }
          const cType = child.type || 'Fragment';
          if (cType === 'Section' || cType === 'Row' || cType === 'Column') {
            if (child.children) {
              list.push(...flattenFormElements(child.children));
            }
          } else {
            let leaf = child;
            if (!leaf.type || leaf.type === 'Fragment') {
              leaf = { ...leaf, type: 'FormFragment' };
            }
            list.push(
              buildPageElementTree(
                leaf,
                siteERC,
                assetMap,
                defaultFragmentKey,
                defaultFragmentConfig,
                fragmentKeyToDir,
                objectDefinitions
              )
            );
          }
        }
        return list;
      };

      const firstChild = node.children[0];
      const fcType =
        typeof firstChild === 'object' && firstChild !== null
          ? firstChild.type || ''
          : '';
      if (fcType === 'FormStepContainer' || fcType === 'FormStep') {
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
      } else {
        const stepElements = flattenFormElements(node.children);
        element.pageElements = [
          {
            type: 'FormStepContainer',
            definition: {
              type: 'FormStepContainer',
              indexed: true,
            },
            pageElements: [
              {
                type: 'FormStep',
                definition: {
                  type: 'FormStep',
                  indexed: true,
                },
                pageElements: stepElements,
              },
            ],
          },
        ];
      }
    }
    return element;
  } else if (type === 'Widget') {
    const definition = node.definition
      ? { ...node.definition }
      : {
          widgetInstance: {
            widgetConfig: {},
            widgetName:
              node.key ||
              'com_liferay_portal_search_web_search_bar_portlet_SearchBarPortlet',
          },
        };
    definition.type = 'Widget';
    return {
      type: 'Widget',
      definition: definition,
      id: node.id || Math.random().toString(36).substring(7),
    };
  } else {
    // Root, Section, Row, Column, CollectionDisplay
    const definition = node.definition ? { ...node.definition } : {};
    let definitionType = type;
    if (type === 'Section') definitionType = 'Container';
    else if (type === 'Row') definitionType = 'Grid';
    else if (type === 'Column') definitionType = 'Grid';
    definition.type = definitionType;

    const element = {
      type: type,
      definition: definition,
    };

    if (type === 'Column' && element.definition.size === undefined) {
      element.definition.size = 12;
    }

    if (type === 'Row') {
      if (element.definition.numberOfColumns === undefined) {
        element.definition.numberOfColumns = node.children
          ? node.children.length
          : 1;
      }
      if (element.definition.gutters === undefined) {
        element.definition.gutters = true;
      }
      if (element.definition.columnsSpacing === undefined) {
        element.definition.columnsSpacing = true;
      }
    }

    if (node.children && node.children.length > 0) {
      if (type === 'CollectionDisplay') {
        const uniqueId = Math.random().toString(36).substring(7);
        element.pageElements = [
          {
            type: 'CollectionItem',
            id: uniqueId,
            definition: {
              type: 'CollectionItem',
            },
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
      } else {
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
    }

    return element;
  }
}

function findObjectDefinitionPayload(erc, rootPath) {
  const { globSync } = require('glob');
  const fs = require('fs');
  const path = require('path');

  const files = globSync('**/*object-definition*.json', {
    cwd: rootPath,
    absolute: true,
    ignore: ['**/node_modules/**', '**/temp*/**', '**/zips/**'],
  });

  for (const file of files) {
    try {
      const data = JSON.parse(fs.readFileSync(file, 'utf8'));
      if (data.items && Array.isArray(data.items)) {
        const item = data.items.find((i) => i.externalReferenceCode === erc);
        if (item) return item;
      }
    } catch (e) {}
  }
  return null;
}

async function globalSetup(config) {
  if (process.env.SKIP_GLOBAL_SETUP === 'true') {
    console.log(
      '  -> SKIP_GLOBAL_SETUP is true. Skipping global setup execution.'
    );
    return;
  }
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
    const testDataFiles = globSync('**/test/test-data.json', {
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
        const testDir = path.dirname(file);
        const parentDir = path.dirname(testDir); // fragment root folder
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
        if (attempts === 1) {
          console.log(
            `     Object Definition ${erc} not found on initial check. Attempting programmatic bootstrap...`
          );
          const payload = findObjectDefinitionPayload(erc, projectRoot);
          if (payload) {
            const createResp = await page.request.post(
              `${baseURL}/o/object-admin/v1.0/object-definitions`,
              {
                headers,
                data: payload,
              }
            );
            if (createResp.ok()) {
              console.log(
                `     Successfully created Object Definition for ${erc}. Waiting for Liferay activation...`
              );
            } else {
              console.warn(
                `     [WARN] Programmatic creation failed for ${erc}: ${createResp.status()} - ${await createResp.text().catch(() => '')}`
              );
            }
          } else {
            console.warn(
              `     [WARN] Could not find local JSON definition file for ${erc}`
            );
          }
        }
        if (attempts < maxAttempts) {
          console.log(
            `     Object Definition ${erc} not found yet. Retrying in 3 seconds (Attempt ${attempts}/${maxAttempts})...`
          );
          await new Promise((resolve) => setTimeout(resolve, 3000));
        }
      }

      if (!objResp.ok()) {
        const bodyText = await objResp.text().catch(() => '');
        const msg = `Object Definition ${erc} not found in portal: status ${objResp.status()} - ${bodyText}`;
        console.error(`     [ERROR] ${msg}`);
        throw new Error(msg);
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
      }
      console.log(
        `     Object ${erc} setup complete. Cooldown for 3 seconds...`
      );
      await new Promise((resolve) => setTimeout(resolve, 3000));
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

  // 1. Reset and Create Dedicated E2E Site
  const targetSiteERC = 'FRAGMENTS_E2E_TEST_SITE';
  const targetSiteName = 'Fragments E2E Test Site';
  const targetSiteFriendlyUrl = '/fragments-e2e-test-site';

  console.log(`Checking if E2E site ${targetSiteERC} already exists...`);
  const checkSiteResp = await apiContext.get(
    `/o/headless-admin-site/v1.0/sites/${targetSiteERC}`
  );
  if (checkSiteResp.ok()) {
    console.log(
      `  -> Existing site found. Deleting to ensure a clean slate...`
    );
    const deleteSiteResp = await apiContext.delete(
      `/o/headless-admin-site/v1.0/sites/${targetSiteERC}`
    );
    if (deleteSiteResp.ok()) {
      console.log('  -> Delete request submitted. Waiting for completion...');
      let deleted = false;
      for (let i = 0; i < 15; i++) {
        await new Promise((resolve) => setTimeout(resolve, 2000));
        const statusResp = await apiContext.get(
          `/o/headless-admin-site/v1.0/sites/${targetSiteERC}`
        );
        if (statusResp.status() === 404) {
          deleted = true;
          break;
        }
      }
      if (!deleted) {
        console.warn('  -> [WARN] Site deletion timed out. Proceeding anyway.');
      } else {
        console.log('  -> Site successfully deleted.');
      }
    } else {
      console.warn(
        `  -> [WARN] Failed to delete existing site: ${deleteSiteResp.status()} - ${await deleteSiteResp.text()}`
      );
    }
  }

  console.log(
    `Creating new E2E site '${targetSiteName}' (${targetSiteERC})...`
  );
  const createSiteResp = await apiContext.post(
    '/o/headless-admin-site/v1.0/sites',
    {
      data: {
        name: targetSiteName,
        friendlyUrlPath: targetSiteFriendlyUrl,
        externalReferenceCode: targetSiteERC,
        membershipType: 'open',
      },
    }
  );

  if (!createSiteResp.ok()) {
    throw new Error(
      `Failed to create E2E site: ${createSiteResp.status()} - ${await createSiteResp.text()}`
    );
  }

  const siteInfo = await createSiteResp.json();
  const siteId = siteInfo.id;
  const siteERC = siteInfo.externalReferenceCode;
  console.log(
    `Testing Global Fragments on Site: ${siteInfo.name} (ID: ${siteId}, ERC: ${siteERC})`
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
    // Fetch sites to find the Global site ID
    const sitesResp = await apiContext.get('/o/headless-admin-site/v1.0/sites');
    if (!sitesResp.ok()) {
      throw new Error(`Failed to fetch sites: ${sitesResp.status()}`);
    }
    const siteData = await sitesResp.json();
    const globalSite = siteData.items.find(
      (s) => s.name === 'Global' || s.externalReferenceCode === 'GLOBAL'
    ) || { id: siteId };
    let querySiteId = globalSite.id;
    globalSiteKey = globalSite.key || 'L_GLOBAL';

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
              status: -1, // Get all statuses to auto-approve drafts/pending
              start: -1,
              end: -1,
            },
          }
        );

        if (entriesResp.ok()) {
          const entries = await entriesResp.json();
          for (const entry of entries) {
            let approved = entry.status === 0;
            if (!approved) {
              console.log(
                `  -> [PENDING/DRAFT] Fragment "${entry.name}" (${entry.fragmentEntryKey}) has status ${entry.status}. Approving...`
              );
              try {
                const approveResp = await apiContext.post(
                  `/api/jsonws/fragment.fragmententry/update-fragment-entry?p_auth=${pAuthToken}`,
                  {
                    form: {
                      fragmentEntryId: entry.fragmentEntryId,
                      fragmentCollectionId: entry.fragmentCollectionId,
                      name: entry.name,
                      css: entry.css || '',
                      html: entry.html || '',
                      js: entry.js || '',
                      cacheable:
                        entry.cacheable !== undefined ? entry.cacheable : true,
                      configuration: entry.configuration || '',
                      icon: entry.icon || '',
                      previewFileEntryId: entry.previewFileEntryId || 0,
                      readOnly:
                        entry.readOnly !== undefined ? entry.readOnly : false,
                      typeOptions: entry.typeOptions || '',
                      status: 0, // Approve
                    },
                  }
                );
                if (approveResp.ok()) {
                  approved = true;
                  console.log(
                    `     🟢 Successfully approved fragment: ${entry.name}`
                  );
                } else {
                  console.warn(
                    `     🔴 Failed to approve fragment: ${entry.name} - ${approveResp.status()}`
                  );
                }
              } catch (err) {
                console.error(
                  `     🔴 Exception during fragment approval: ${entry.name}`,
                  err.message
                );
              }
            }
            if (approved) {
              registeredKeys.push(entry.fragmentEntryKey);
              dbFragmentKeyToERC[entry.fragmentEntryKey] =
                entry.externalReferenceCode;
            }
          }
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
  const allFragmentFiles = globSync('**/main/fragment.json', {
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
        fragmentData.key || path.basename(path.dirname(path.dirname(file)));
      fragmentKeyToDir[baseFragmentKey] = path.dirname(path.dirname(file));
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

  let fragmentFiles = globSync('**/main/fragment.json', {
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
        fragmentData.key || path.basename(path.dirname(path.dirname(file)));

      let currentDir = path.dirname(file);
      let collectionName = '';
      let collectionFolder = '';
      let collectionFound = false;
      while (currentDir !== '..' && currentDir !== '/' && currentDir !== '.') {
        const collectionFile = path.join(currentDir, 'collection.json');
        if (fs.existsSync(collectionFile)) {
          const collData = JSON.parse(fs.readFileSync(collectionFile, 'utf8'));
          collectionName = collData.name || '';
          collectionFolder = path.basename(currentDir);
          collectionFound = true;
          break;
        }
        const parent = path.dirname(currentDir);
        if (parent === currentDir) break;
        currentDir = parent;
      }
      if (!collectionFound) {
        const parentDirName = path.basename(path.dirname(path.dirname(file)));
        if (parentDirName !== 'fragments' && parentDirName !== '..') {
          collectionName = parentDirName;
          collectionFolder = parentDirName;
        }
      }

      return (
        filterRegex.test(collectionName) ||
        filterRegex.test(collectionFolder) ||
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

  // Search OpenAPI layout definitions to resolve site-scoped API paths
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

  // ----- PHASE 4.75: SEED COMMERCE CHANNEL -----
  let e2eChannelId = null;
  try {
    console.log('Verifying Liferay Commerce channels for the E2E site...');
    const channelsResp = await apiContext.get(
      '/o/headless-commerce-admin-channel/v1.0/channels'
    );
    if (channelsResp.ok()) {
      const channelsJson = await channelsResp.json();
      const existingChannel =
        channelsJson.items &&
        channelsJson.items.find((c) => c.siteGroupId === siteId);
      if (existingChannel) {
        e2eChannelId = existingChannel.id;
        console.log(
          `  -> Commerce Channel already exists for E2E site. ID: ${existingChannel.id}`
        );
      } else {
        console.log('  -> No Channel found for E2E site. Creating one...');
        const createChannelResp = await apiContext.post(
          '/o/headless-commerce-admin-channel/v1.0/channels',
          {
            data: {
              currencyCode: 'USD',
              name: `Commerce Channel for ${targetSiteName}`,
              type: 'site',
              siteGroupId: siteId,
            },
          }
        );
        if (createChannelResp.ok()) {
          const newChannel = await createChannelResp.json();
          e2eChannelId = newChannel.id;
          console.log(
            `  -> Successfully created Commerce Channel. ID: ${newChannel.id}`
          );
        } else {
          console.warn(
            '  -> [WARN] Failed to create Commerce Channel:',
            await createChannelResp.text()
          );
        }
      }
    }
  } catch (channelErr) {
    console.warn(
      '  -> [WARN] Error setting up Commerce Channel:',
      channelErr.message
    );
  }

  // ----- PHASE 4.8: SEED COMMERCE PRODUCTS -----
  const commerceAssetMap = {};
  try {
    console.log('Seeding Liferay Commerce products...');
    let catalogId = 33837; // Default fallback catalog ID
    const catalogResp = await apiContext.get(
      '/o/headless-commerce-admin-catalog/v1.0/catalogs'
    );
    if (catalogResp.ok()) {
      const catalogsJson = await catalogResp.json();
      if (catalogsJson.items && catalogsJson.items.length > 0) {
        catalogId = catalogsJson.items[0].id;
      }
    }
    console.log(`  -> Using Catalog ID: ${catalogId}`);

    const productsToSeed = [
      { key: 'COMMERCE_PRODUCT_1', name: 'Timing Belt', sku: 'MIN93023' }, // pragma: allowlist secret
      { key: 'COMMERCE_PRODUCT_2', name: 'Master Cylinder', sku: 'MIN93024' }, // pragma: allowlist secret
      {
        key: 'COMMERCE_PRODUCT_3', // pragma: allowlist secret
        name: 'Alternator Assembly',
        sku: 'MIN93025',
      },
      {
        key: 'COMMERCE_PRODUCT_4', // pragma: allowlist secret
        name: 'Power Steering Pump',
        sku: 'MIN93026',
      },
    ];

    const prodListResp = await apiContext.get(
      '/o/headless-commerce-admin-catalog/v1.0/products'
    );
    const existingProducts = prodListResp.ok()
      ? (await prodListResp.json()).items || []
      : [];

    for (const prodData of productsToSeed) {
      let productId;
      const matched = existingProducts.find(
        (p) => p.name && p.name.en_US === prodData.name
      );

      if (matched) {
        productId = matched.productId;
        console.log(
          `  -> Product "${prodData.name}" already exists. ID: ${productId}`
        );
      } else {
        const createResp = await apiContext.post(
          '/o/headless-commerce-admin-catalog/v1.0/products',
          {
            data: {
              catalogId,
              name: { en_US: prodData.name },
              productType: 'simple',
              active: true,
            },
          }
        );

        if (createResp.ok()) {
          const created = await createResp.json();
          productId = created.productId;
          console.log(
            `  -> Successfully created product "${prodData.name}". ID: ${productId}`
          );
        } else {
          console.warn(
            `  -> [WARN] Failed to create product "${prodData.name}":`,
            await createResp.text()
          );
          continue;
        }
      }

      // Link product to the E2E channel if present
      if (productId && e2eChannelId) {
        const linkResp = await apiContext.patch(
          `/o/headless-commerce-admin-catalog/v1.0/products/${productId}`,
          {
            data: {
              productChannels: [
                {
                  channelId: e2eChannelId,
                },
              ],
            },
          }
        );
        if (linkResp.ok()) {
          console.log(
            `  -> Successfully linked product ${productId} to channel ${e2eChannelId}`
          );
        } else {
          console.warn(
            `  -> [WARN] Failed to link product ${productId} to channel ${e2eChannelId}:`,
            await linkResp.text()
          );
        }
      }

      // Add product ID to assetMap so test-data.json can resolve it
      commerceAssetMap[prodData.key] = productId;

      // Create SKU and Base Price for the product
      if (productId) {
        const skuResp = await apiContext.post(
          `/o/headless-commerce-admin-catalog/v1.0/products/${productId}/skus`,
          {
            data: {
              sku: prodData.sku,
              published: true,
              purchasable: true,
            },
          }
        );
        if (skuResp.ok()) {
          const skuData = await skuResp.json();
          console.log(
            `  -> Successfully created SKU ${prodData.sku} (ID: ${skuData.id})`
          );

          // Set a mock price and promo price so it registers as an offer
          const priceResp = await apiContext.patch(
            `/o/headless-commerce-admin-catalog/v1.0/skus/${skuData.id}`,
            {
              data: {
                price: 150.0,
                promoPrice: 99.0,
              },
            }
          );
          if (priceResp.ok()) {
            console.log(
              `  -> Successfully set pricing for SKU ${prodData.sku}`
            );
          }
        } else {
          console.warn(
            `  -> [WARN] Failed to create SKU ${prodData.sku}:`,
            await skuResp.text()
          );
        }
      }
    }
  } catch (commErr) {
    console.warn(
      '  -> [WARN] Error seeding commerce products:',
      commErr.message
    );
  }

  const testPagesMap = [];

  for (const file of fragmentFiles) {
    const fragmentData = JSON.parse(fs.readFileSync(file, 'utf8'));
    const fragmentName = fragmentData.name;

    // Liferay fragment keys are typically derived from the folder name or explicitly defined.
    let baseFragmentKey =
      fragmentData.key || path.basename(path.dirname(path.dirname(file)));

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

    let collectionFolder = '';
    if (collectionFound) {
      collectionFolder = path.basename(currentDir);
    } else {
      const parentDirName = path.basename(path.dirname(path.dirname(file)));
      if (parentDirName !== 'fragments' && parentDirName !== '..') {
        collectionName = parentDirName;
        collectionFolder = parentDirName;
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
    const testDataFile = path.join(
      path.dirname(path.dirname(file)),
      'test',
      'test-data.json'
    );
    let seededConfigOverrides = {};
    let testData = null;
    const assetMap = { ...commerceAssetMap }; // Maps ERC -> Liferay ID
    const assetEntryIdMap = {}; // Maps ERC -> AssetEntry ID
    const documentIdMap = {}; // Maps ERC -> DLFileEntry ID

    if (fs.existsSync(testDataFile)) {
      console.log(
        `     Found E2E test data manifest at ${testDataFile}. Seeding assets...`
      );
      try {
        testData = JSON.parse(fs.readFileSync(testDataFile, 'utf8'));

        const testConfigPath = path.join(
          path.dirname(testDataFile),
          'test-fragment-config.json'
        );
        if (fs.existsSync(testConfigPath)) {
          console.log(
            `     Found fragment configuration override at ${testConfigPath}.`
          );
          try {
            const testConfig = JSON.parse(
              fs.readFileSync(testConfigPath, 'utf8')
            );
            if (!testData.pageConfig) testData.pageConfig = {};
            testData.pageConfig.fragmentConfig = testConfig;
          } catch (e) {
            console.error(`     [ERROR] Failed to parse ${testConfigPath}:`, e);
          }
        }

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

        // -1. Seed Picklists
        if (testData.requiredPicklists) {
          for (const pl of testData.requiredPicklists) {
            console.log(`       Seeding Picklist: ${pl.name} (${pl.erc})...`);

            let picklistId = null;
            try {
              const fetchResp = await apiContext.get(
                `/o/headless-admin-list-type/v1.0/list-type-definitions/by-external-reference-code/${pl.erc}`
              );
              if (fetchResp.ok()) {
                const json = await fetchResp.json();
                picklistId = json.id;
                console.log(`       Found existing picklist ${pl.erc}`);
              }
            } catch (e) {}

            if (!picklistId) {
              const createResp = await apiContext.post(
                `/o/headless-admin-list-type/v1.0/list-type-definitions`,
                {
                  data: {
                    externalReferenceCode: pl.erc,
                    name: pl.name,
                    name_i18n: { en_US: pl.name },
                  },
                }
              );
              if (createResp.ok()) {
                const json = await createResp.json();
                picklistId = json.id;
                console.log(`       Successfully created picklist ${pl.erc}`);
              } else {
                console.warn(
                  `       [WARN] Failed to create picklist ${pl.erc} : ${createResp.status()}`
                );
              }
            }

            if (picklistId && pl.items) {
              const entriesResp = await apiContext.get(
                `/o/headless-admin-list-type/v1.0/list-type-definitions/${picklistId}/list-type-entries`
              );
              let existingEntries = [];
              if (entriesResp.ok()) {
                existingEntries = (await entriesResp.json()).items || [];
              }

              for (const item of pl.items) {
                if (!existingEntries.find((e) => e.name === item)) {
                  const postEntryResp = await apiContext.post(
                    `/o/headless-admin-list-type/v1.0/list-type-definitions/${picklistId}/list-type-entries`,
                    {
                      data: {
                        externalReferenceCode:
                          pl.erc +
                          '_' +
                          item.toUpperCase().replace(/[^A-Z0-9]/g, '_'),
                        key: item.toLowerCase().replace(/[^a-z0-9]/g, '-'),
                        name: item,
                        name_i18n: { en_US: item },
                      },
                    }
                  );
                  if (postEntryResp.ok()) {
                    console.log(`       Added picklist entry: ${item}`);
                  } else {
                    console.warn(`       [WARN] Failed to add entry ${item}`);
                  }
                }
              }
            }
          }
        }

        // -1.5 Patch APPLICANT Object with Picklist (if seeded)
        if (
          testData.requiredPicklists &&
          testData.requiredPicklists.find((p) => p.erc === 'INTERESTS_PICKLIST')
        ) {
          console.log(
            `       Patching APPLICANT object definition to bind INTERESTS_PICKLIST...`
          );
          try {
            const getFieldsResp = await apiContext.get(
              `/o/object-admin/v1.0/object-definitions/by-external-reference-code/APPLICANT/object-fields`
            );
            if (getFieldsResp.ok()) {
              const fieldsJson = await getFieldsResp.json();
              const interestsField = (fieldsJson.items || []).find(
                (f) => f.externalReferenceCode === 'INTERESTS'
              );
              if (interestsField) {
                const patchResp = await apiContext.patch(
                  `/o/object-admin/v1.0/object-fields/${interestsField.id}`,
                  {
                    data: {
                      listTypeDefinitionExternalReferenceCode:
                        'INTERESTS_PICKLIST',
                    },
                  }
                );
                if (patchResp.ok()) {
                  console.log(
                    `       Successfully bound INTERESTS_PICKLIST to APPLICANT.interests`
                  );
                } else {
                  console.warn(
                    `       [WARN] Failed to bind picklist to field: ${patchResp.status()}`
                  );
                }
              }
            }
          } catch (e) {
            console.warn(
              `       [WARN] Error patching APPLICANT object: ${e.message}`
            );
          }
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
                documentIdMap[doc.externalReferenceCode] = docId;
                seededAssets.push({
                  type: 'document',
                  id: docId,
                  erc: doc.externalReferenceCode,
                });

                // Resolve and store assetEntryId
                const assetEntryId = await getAssetEntryId(
                  apiContext,
                  pAuthToken,
                  'com.liferay.document.library.kernel.model.DLFileEntry',
                  docId
                );
                if (assetEntryId) {
                  assetEntryIdMap[doc.externalReferenceCode] = assetEntryId;
                }
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
                    documentIdMap[doc.externalReferenceCode] = docId;

                    // Resolve and store assetEntryId
                    const assetEntryId = await getAssetEntryId(
                      apiContext,
                      pAuthToken,
                      'com.liferay.document.library.kernel.model.DLFileEntry',
                      docId
                    );
                    if (assetEntryId) {
                      assetEntryIdMap[doc.externalReferenceCode] = assetEntryId;
                    }

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

              // Resolve and store assetEntryId
              const assetEntryId = await getAssetEntryId(
                apiContext,
                pAuthToken,
                'com.liferay.journal.model.JournalArticle',
                articleJson.id
              );
              if (assetEntryId) {
                assetEntryIdMap[article.externalReferenceCode] = assetEntryId;
              }
            } else {
              const body = await articleResp.text();
              if (
                articleResp.status() === 409 ||
                (articleResp.status() === 400 &&
                  body.includes('already in use'))
              ) {
                console.log(
                  `       Article ${article.title} already exists. Resolving ID by ERC...`
                );
                const getResp = await apiContext.get(
                  `/o/headless-delivery/v1.0/sites/${siteId}/structured-contents/by-external-reference-code/${article.externalReferenceCode}`
                );
                if (getResp.ok()) {
                  const getJson = await getResp.json();
                  const existingArticleId = getJson.id;
                  assetMap[article.externalReferenceCode] = existingArticleId;
                  console.log(
                    `       Resolved existing article ID: ${existingArticleId}`
                  );

                  // Resolve and store assetEntryId
                  const assetEntryId = await getAssetEntryId(
                    apiContext,
                    pAuthToken,
                    'com.liferay.journal.model.JournalArticle',
                    existingArticleId
                  );
                  if (assetEntryId) {
                    assetEntryIdMap[article.externalReferenceCode] =
                      assetEntryId;
                  }
                } else {
                  console.warn(
                    `       [WARN] Failed to retrieve existing article by ERC: ${getResp.status()}`
                  );
                }
              } else {
                console.error(
                  `       [ERROR] Failed to create article ${article.title}: ${articleResp.status()} - ${body}`
                );
              }
            }
          }
        }

        // 3. Seed Collections (Content Sets)
        if (testData.collections) {
          for (const collection of testData.collections) {
            await seedCollection(
              apiContext,
              pAuthToken,
              siteId,
              collection,
              assetMap,
              assetEntryIdMap
            );
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

          const resolveValue = (val) => {
            if (typeof val === 'string') {
              let replacedStr = val;
              if (assetMap[val]) {
                return assetMap[val];
              } else {
                Object.keys(assetMap).forEach((assetKey) => {
                  if (replacedStr.includes(assetKey)) {
                    replacedStr = replacedStr
                      .split(assetKey)
                      .join(assetMap[assetKey].toString());
                  }
                });
              }
              if (replacedStr.includes('/o/c/')) {
                let cleanPath = replacedStr.trim().replace(/\/$/, '');
                const def = objectDefinitions.find(
                  (d) => d.restContextPath === cleanPath
                );
                if (def && def.scope === 'site') {
                  replacedStr = `${cleanPath}/scopes/${siteId}${replacedStr.endsWith('/') ? '/' : ''}`;
                }
              }
              return replacedStr;
            } else if (Array.isArray(val)) {
              return val.map(resolveValue);
            } else if (val && typeof val === 'object') {
              const res = {};
              Object.keys(val).forEach((k) => {
                if (
                  k === 'url' &&
                  typeof val[k] === 'string' &&
                  assetMap[val[k]]
                ) {
                  res[k] = assetMap[val[k]];
                } else if (
                  k === 'fileEntryId' &&
                  typeof val[k] === 'string' &&
                  documentIdMap[val[k]]
                ) {
                  res[k] = documentIdMap[val[k]].toString();
                } else {
                  res[k] = resolveValue(val[k]);
                }
              });
              return res;
            }
            return val;
          };

          Object.keys(seededConfigOverrides).forEach((key) => {
            seededConfigOverrides[key] = resolveValue(
              seededConfigOverrides[key]
            );
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

        // Ensure rootPageElement conforms to Liferay's strict layout schema: Root -> Section -> Row -> Column
        if (rootPageElement && rootPageElement.type !== 'Root') {
          console.log(
            `     [INFO] Wrapping custom layout of type ${rootPageElement.type} to conform to Root -> Section -> Row -> Column schema.`
          );
          let current = rootPageElement;

          if (current.type === 'Section') {
            current = {
              type: 'Root',
              pageElements: [current],
            };
          } else if (current.type === 'Row') {
            if (!current.definition) current.definition = {};
            current.definition.gutters = true;
            current.definition.columnsSpacing = true;
            if (current.definition.numberOfColumns === undefined) {
              current.definition.numberOfColumns = current.pageElements
                ? current.pageElements.length
                : 1;
            }

            current = {
              type: 'Section',
              definition: { indexed: true, layout: {} },
              pageElements: [current],
            };
            current = {
              type: 'Root',
              pageElements: [current],
            };
          } else if (current.type === 'Column') {
            current = {
              type: 'Row',
              definition: {
                gutters: true,
                columnsSpacing: true,
                numberOfColumns: 1,
              },
              pageElements: [current],
            };
            current = {
              type: 'Section',
              definition: { indexed: true, layout: {} },
              pageElements: [current],
            };
            current = {
              type: 'Root',
              pageElements: [current],
            };
          } else if (current.type === 'FormFragment') {
            const applicantDef = objectDefinitions.find(
              (d) => d.externalReferenceCode === 'APPLICANT'
            );
            const applicantClassName = applicantDef
              ? applicantDef.className
              : 'com.liferay.object.model.ObjectDefinition#APPLICANT';

            // Wrap FormFragment in FormContainer -> FormFragments (no nested Section/Row/Column)
            current = {
              type: 'FormContainer',
              definition: {
                formContainerConfig: {
                  formContainerReference: {
                    className: applicantClassName,
                    type: 'FormContainerClassSubtypeReference',
                  },
                  formContainerType: 'Simple',
                  numberOfSteps: 0,
                },
                indexed: true,
                layout: {},
              },
              pageElements: [
                current,
                {
                  type: 'FormFragment',
                  definition: {
                    fieldKey: '',
                    fragmentConfig:
                      testData.pageConfig && testData.pageConfig.fragmentConfig
                        ? testData.pageConfig.fragmentConfig
                        : {},
                    fragmentFields: [],
                  },
                },
              ],
            };
            current = {
              type: 'Root',
              pageElements: [current],
            };
          } else if (current.type === 'FormContainer') {
            current = {
              type: 'Root',
              pageElements: [current],
            };
          } else {
            // Fragment, Widget, etc.
            current = {
              type: 'Column',
              definition: { size: 12, width: '12' },
              pageElements: [current],
            };
            current = {
              type: 'Row',
              definition: {
                gutters: true,
                columnsSpacing: true,
                numberOfColumns: 1,
              },
              pageElements: [current],
            };
            current = {
              type: 'Section',
              definition: { indexed: true, layout: {} },
              pageElements: [current],
            };
            current = {
              type: 'Root',
              pageElements: [current],
            };
          }
          rootPageElement = current;
        }
      } catch (e) {
        console.warn(
          `     [WARN] Failed to build custom pageLayout:`,
          e.message
        );
      }
    }

    if (!rootPageElement) {
      let isInputType = false;
      const parentDir = fragmentKeyToDir ? fragmentKeyToDir[fragmentKey] : null;
      if (parentDir) {
        try {
          const fragJsonPath = path.join(parentDir, 'main', 'fragment.json');
          if (fs.existsSync(fragJsonPath)) {
            const fragJson = JSON.parse(fs.readFileSync(fragJsonPath, 'utf8'));
            if (fragJson.type === 'input') {
              isInputType = true;
            }
          }
        } catch (e) {
          // Ignore reading errors
        }
      }

      if (isInputType) {
        const applicantDef = objectDefinitions.find(
          (d) => d.externalReferenceCode === 'APPLICANT'
        );
        const applicantClassName = applicantDef
          ? applicantDef.className
          : 'com.liferay.object.model.ObjectDefinition#APPLICANT';

        let fieldKey = 'favoriteColor'; // Fallback for color swatches / other inputs
        if (fragmentKey === 'listbox-multiselect') {
          fieldKey = 'interests';
        }

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
                        size: 12,
                        width: '100%',
                      },
                      pageElements: [
                        {
                          type: 'FormContainer',
                          definition: {
                            type: 'FormContainer',
                            formConfig: {
                              formReference: {
                                className: applicantClassName,
                                type: 'FormClassSubtypeReference',
                              },
                              formType: 'simple',
                              numberOfSteps: 1,
                            },
                            indexed: true,
                            layout: {},
                          },
                          pageElements: [
                            {
                              type: 'FormStepContainer',
                              definition: {
                                type: 'FormStepContainer',
                                indexed: true,
                              },
                              pageElements: [
                                {
                                  type: 'FormStep',
                                  definition: {
                                    type: 'FormStep',
                                    indexed: true,
                                  },
                                  pageElements: [
                                    {
                                      type: 'FormFragment',
                                      definition: {
                                        type: 'FormFragment',
                                        fieldKey: fieldKey.startsWith(
                                          'ObjectField_'
                                        )
                                          ? fieldKey
                                          : `ObjectField_${fieldKey}`,
                                        fragment: {
                                          key: fragmentKey,
                                          siteKey: globalSiteKey,
                                        },
                                        fragmentConfig:
                                          testData &&
                                          testData.pageConfig &&
                                          testData.pageConfig.fragmentConfig
                                            ? testData.pageConfig.fragmentConfig
                                            : {},
                                        fragmentFields: [],
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
                        size: 12,
                        width: '12',
                      },
                      pageElements: [
                        {
                          type: 'Fragment',
                          definition: {
                            fragment: {
                              key: fragmentKey,
                              siteKey: globalSiteKey,
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

    const normalizePageElementTypes = (element) => {
      if (!element) return;
      if (element.type === 'FormContainer') {
        element.type = 'Form';
        if (element.definition && !element.definition.type) {
          element.definition.type = 'FormContainer';
        }
      } else if (element.type === 'FormFragment') {
        element.type = 'Fragment';
        if (element.definition && !element.definition.type) {
          element.definition.type = 'FormFragment';
        }
      } else if (element.type === 'CollectionDisplay') {
        element.type = 'Collection';
        if (element.definition && !element.definition.type) {
          element.definition.type = 'CollectionDisplay';
        }
      }
      if (element.pageElements) {
        element.pageElements.forEach(normalizePageElementTypes);
      }
    };
    normalizePageElementTypes(rootPageElement);

    const payload = {
      title: pageTitle,
      friendlyUrlPath: friendlyUrl,
      pageType: 'content',
      pageDefinition: {
        pageElement: rootPageElement,
        settings: {
          colorSchemeName: '01',
          themeName: 'Classic',
          themeSettings: {
            'lfr-theme:regular:show-header': 'false',
            'lfr-theme:regular:show-footer': 'false',
            'lfr-theme:regular:show-header-search': 'false',
            'lfr-theme:regular:wrap-widget-page-content': 'false',
            ...(testData &&
            testData.pageConfig &&
            testData.pageConfig.settings &&
            testData.pageConfig.settings.themeSettings
              ? testData.pageConfig.settings.themeSettings
              : {}),
          },
          ...(testData && testData.pageConfig && testData.pageConfig.settings
            ? (() => {
                const { themeSettings, ...rest } = testData.pageConfig.settings;
                return rest;
              })()
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
            console.warn(
              `     Request Payload: ${JSON.stringify(payload, null, 2)}`
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

    if (!success) {
      throw new Error(
        `Failed to create page for fragment '${fragmentName}' (${fragmentKey}) after ${maxAttempts} attempts.`
      );
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
      collectionFolder: collectionFolder,
      fragmentName: fragmentName,
      url: `/web/fragments-e2e-test-site${friendlyUrl}`,
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

if (require.main === module) {
  const mockConfig = {
    projects: [
      {
        use: {
          baseURL: process.env.BASE_URL || 'http://localhost:8081',
          storageState: './state.json',
        },
      },
    ],
  };
  globalSetup(mockConfig)
    .then(() => {
      console.log('Setup completed successfully.');
      process.exit(0);
    })
    .catch((err) => {
      console.error('Setup failed:', err);
      process.exit(1);
    });
}
