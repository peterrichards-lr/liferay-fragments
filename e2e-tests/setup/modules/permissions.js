const fs = require('fs');
const path = require('path');
const { globSync } = require('glob');

async function configurePermissions(ctx, page) {
  // ----- CONFIGURE SERVICE ACCESS POLICY -----
  try {
    console.log('Configuring SYSTEM_DEFAULT Service Access Policy...');
    await page.goto(
      `${ctx.baseURL}/group/control_panel/manage?p_p_id=com_liferay_portal_security_service_access_policy_web_portlet_SAPPortlet`
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
      'com.liferay.portal.service.impl.ResourcePermissionServiceImpl',
      'com.liferay.asset.list.service.impl.AssetListEntryServiceImpl',
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

  // ----- AUTOMATE GUEST OBJECT PERMISSIONS VIA CONTROL PANEL UI -----
  try {
    console.log('Automating Guest Role Permissions for Custom Objects...');

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

    const testDataFiles = globSync('**/test/test-data.json', {
      cwd: ctx.projectRoot,
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
        const parentDir = path.dirname(testDir);
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
    const headers = { Authorization: `Basic ${ctx.basicAuth}` };

    for (const erc of objectERCs) {
      console.log(`  -> Configuring Guest permissions for ${erc}...`);

      let objResp;
      let attempts = 0;
      const maxAttempts = 5;
      while (attempts < maxAttempts) {
        objResp = await page.request.get(
          `${ctx.baseURL}/o/object-admin/v1.0/object-definitions/by-external-reference-code/${erc}`,
          { headers }
        );
        if (objResp.ok()) break;
        attempts++;
        if (attempts === 1) {
          console.log(
            `     Object Definition ${erc} not found on initial check. Attempting programmatic bootstrap...`
          );
          const payload = ctx.findObjectDefinitionPayload(erc);
          if (payload) {
            const createResp = await page.request.post(
              `${ctx.baseURL}/o/object-admin/v1.0/object-definitions`,
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

      const companyId = String(objJson.companyId || ctx.companyId);

      // Use page.evaluate/fetch() to run within the browser context, ensuring
      // the full session cookies and p_auth token are sent correctly for portal
      // JSON-WS services that require a live authenticated session.
      const pAuth = ctx.pAuthToken;
      const baseURL = ctx.baseURL;

      const permResults = await page.evaluate(
        async ({ baseURL, pAuth, companyId, objId, hashPart }) => {
          const jsonWsPost = async (endpoint, params) => {
            const body = new URLSearchParams(params);
            const resp = await fetch(`${baseURL}${endpoint}?p_auth=${pAuth}`, {
              method: 'POST',
              credentials: 'include',
              headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
              body: body.toString(),
            });
            return { status: resp.status, ok: resp.ok, body: await resp.text() };
          };

          const results = [];

          // Step 1: ObjectDefinition individual VIEW (scope=4)
          results.push({
            step: 1,
            label: 'ObjectDefinition VIEW (individual)',
            ...(await jsonWsPost('/api/jsonws/resourcepermission/add-resource-permission', {
              groupId: '0', companyId, name: 'com.liferay.object.model.ObjectDefinition',
              scope: '4', primKey: String(objId), roleId: '20106', actionId: 'VIEW',
            })),
          });

          // Step 2: Object ADD_OBJECT_ENTRY (scope=1, company level)
          results.push({
            step: 2,
            label: 'Object ADD_OBJECT_ENTRY (company)',
            ...(await jsonWsPost('/api/jsonws/resourcepermission/add-resource-permission', {
              groupId: '0', companyId, name: `com.liferay.object#${objId}`,
              scope: '1', primKey: companyId, roleId: '20106', actionId: 'ADD_OBJECT_ENTRY',
            })),
          });

          // Step 3: ObjectDefinition#hash VIEW (scope=1, company level)
          results.push({
            step: 3,
            label: `ObjectDefinition#${hashPart} VIEW (company)`,
            ...(await jsonWsPost('/api/jsonws/resourcepermission/add-resource-permission', {
              groupId: '0', companyId, name: `com.liferay.object.model.ObjectDefinition#${hashPart}`,
              scope: '1', primKey: companyId, roleId: '20106', actionId: 'VIEW',
            })),
          });

          // Step 4: Portlet VIEW + ACCESS_IN_CONTROL_PANEL (scope=1)
          const portletName = `com_liferay_object_web_internal_object_definitions_portlet_ObjectDefinitionsPortlet_${hashPart}`;
          results.push({
            step: 4,
            label: 'Portlet VIEW+ACCESS_IN_CONTROL_PANEL (company)',
            ...(await jsonWsPost('/api/jsonws/resourcepermission/set-individual-resource-permissions', {
              groupId: '0', companyId, name: portletName,
              primKey: companyId, roleId: '20106',
              'actionIds[0]': 'VIEW', 'actionIds[1]': 'ACCESS_IN_CONTROL_PANEL',
            })),
          });

          return results;
        },
        { baseURL, pAuth, companyId, objId: String(objId), hashPart }
      );

      for (const r of permResults) {
        if (r.ok) {
          console.log(`     [API] Step ${r.step} OK: ${r.label}`);
        } else {
          console.warn(`     [API][WARN] Failed Step ${r.step} (${r.label}): HTTP ${r.status} - ${r.body.substring(0, 200)}`);
        }
      }

      console.log(`     Object ${erc} setup complete.`);
    }
  } catch (permErr) {
    console.warn(
      '  -> Warning: Failed to automate Guest Object Permissions:',
      permErr.message
    );
  }
}

module.exports = { configurePermissions };
