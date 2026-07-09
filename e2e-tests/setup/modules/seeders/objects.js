const fs = require('fs');
const path = require('path');

async function seed(ctx, apiContext) {
  const objectDefinitions = ctx.objectDefinitions;
  const siteId = ctx.siteId;

  try {
    console.log('Seeding custom showcase object entries...');
    const showcaseRoot = path.join(
      ctx.projectRoot,
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
}

module.exports = { seed };
