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
      'MAP_PIN',
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

      // --- STEP 1: Set Object Definition Level Permissions ---
      const defPermissionsUrl = `${ctx.baseURL}/group/control_panel/manage?p_p_id=com_liferay_portlet_configuration_web_portlet_PortletConfigurationPortlet&_com_liferay_portlet_configuration_web_portlet_PortletConfigurationPortlet_mvcPath=%2Fedit_permissions.jsp&_com_liferay_portlet_configuration_web_portlet_PortletConfigurationPortlet_modelResource=com.liferay.object.model.ObjectDefinition&_com_liferay_portlet_configuration_web_portlet_PortletConfigurationPortlet_resourcePrimKey=${objId}`;

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
      const rolePermissionsUrl = `${ctx.baseURL}/group/control_panel/manage?p_p_id=com_liferay_roles_admin_web_portlet_RolesAdminPortlet&p_p_lifecycle=0&p_p_state=maximized&p_p_mode=view&_com_liferay_roles_admin_web_portlet_RolesAdminPortlet_mvcPath=%2Fedit_role_permissions.jsp&_com_liferay_roles_admin_web_portlet_RolesAdminPortlet_cmd=edit&_com_liferay_roles_admin_web_portlet_RolesAdminPortlet_portletResource=com_liferay_object_web_internal_object_definitions_portlet_ObjectDefinitionsPortlet_${hashPart}&_com_liferay_roles_admin_web_portlet_RolesAdminPortlet_tabs1=define-permissions&_com_liferay_roles_admin_web_portlet_RolesAdminPortlet_tabs2=roles&_com_liferay_roles_admin_web_portlet_RolesAdminPortlet_accountRoleGroupScope=false&_com_liferay_roles_admin_web_portlet_RolesAdminPortlet_roleId=${roleId}`;

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
}

module.exports = { configurePermissions };
