const fs = require('fs');
const path = require('path');

async function seed(
  ctx,
  apiContext,
  testData,
  assetMap,
  documentIdMap,
  assetEntryIdMap,
  seededAssets
) {
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
        : path.join(ctx.projectRoot, doc.filePath);
      if (!fs.existsSync(absFilePath)) {
        console.warn(
          `       [WARN] File not found at: ${absFilePath}. Skipping document seed.`
        );
        continue;
      }

      try {
        const fileBuffer = fs.readFileSync(absFilePath);
        const uploadResp = await apiContext.post(
          `/o/headless-delivery/v1.0/sites/${ctx.siteId}/documents`,
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
          const assetEntryId = await ctx.getAssetEntryId(
            apiContext,
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
            `/o/headless-delivery/v1.0/sites/${ctx.siteId}/documents?search=${encodeURIComponent(doc.title)}`
          );
          if (searchResp.ok()) {
            const searchJson = await searchResp.json();
            const matched = searchJson.items.find((d) => d.title === doc.title);
            if (matched) {
              const contentUrl = matched.contentUrl;
              const docId = matched.id;
              console.log(
                `       Found existing document ${doc.title} -> URL: ${contentUrl}, ID: ${docId}`
              );
              assetMap[doc.externalReferenceCode] = contentUrl;
              documentIdMap[doc.externalReferenceCode] = docId;

              // Resolve and store assetEntryId
              const assetEntryId = await ctx.getAssetEntryId(
                apiContext,
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
}

module.exports = { seed };
