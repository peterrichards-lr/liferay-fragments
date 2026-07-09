const fs = require('fs');
const path = require('path');

async function seed(ctx, apiContext, testData) {
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
                listTypeDefinitionExternalReferenceCode: 'INTERESTS_PICKLIST',
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
}

module.exports = { seed };
