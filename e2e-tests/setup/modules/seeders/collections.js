const fs = require('fs');
const path = require('path');

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
    const checkResp = await apiContext.get(
      `/o/headless-delivery/v1.0/sites/${siteId}/content-sets/by-external-reference-code/${erc}`
    );
    if (checkResp.ok()) {
      const json = await checkResp.json();
      existingId = json.id;
      console.log(
        `       Found existing collection ${erc} -> ID: ${existingId}`
      );
    }
  } catch (e) {
    // Ignore error if it doesn't exist
  }

  // 3. If it exists, delete it first to ensure fresh seed
  if (existingId) {
    try {
      const delResp = await apiContext.delete(
        `/o/headless-delivery/v1.0/content-sets/${existingId}`
      );
      if (delResp.ok()) {
        console.log(
          `       Deleted existing collection to perform fresh seed.`
        );
        existingId = null;
      }
    } catch (e) {
      console.warn(
        `       [WARN] Failed to delete existing collection: ${e.message}`
      );
    }
  }

  // 4. Create collection via JSON WS
  try {
    const payload = {
      groupId: siteId,
      externalReferenceCode: erc,
      name: title,
      title: title,
      description: collection.description || '',
      type: 'manual',
      assetEntryIds: resolvedAssetEntryIds.join(','),
      addGuestPermissions: 'true',
    };

    const createResp = await apiContext.post(
      `/api/jsonws/assetlist.assetlistentry/add-asset-list-entry?p_auth=${pAuthToken}`,
      { form: payload }
    );

    if (createResp.ok()) {
      const json = await createResp.json();
      const newCollectionId = json.assetListEntryId;
      console.log(
        `       🟢 Successfully seeded collection ${title}. ID: ${newCollectionId}`
      );
      assetMap[erc] = newCollectionId;
    } else {
      console.warn(
        `       🔴 Failed to seed collection: ${createResp.status()} - ${await createResp.text()}`
      );
    }
  } catch (err) {
    console.error(`       🔴 Exception seeding collection:`, err.message);
  }
}

async function seed(
  ctx,
  apiContext,
  testData,
  assetMap,
  assetEntryIdMap,
  seededAssets
) {
  const pAuthToken = ctx.pAuthToken;
  const siteId = ctx.siteId;

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
                        ddmFormFieldNames: struct.fields.map((f) => f.name),
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
        const assetEntryId = await ctx.getAssetEntryId(
          apiContext,
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
          (articleResp.status() === 400 && body.includes('already in use'))
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
            const assetEntryId = await ctx.getAssetEntryId(
              apiContext,
              'com.liferay.journal.model.JournalArticle',
              existingArticleId
            );
            if (assetEntryId) {
              assetEntryIdMap[article.externalReferenceCode] = assetEntryId;
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
}

module.exports = { seed };
