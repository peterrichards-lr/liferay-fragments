const fs = require('fs');
const path = require('path');
const { globSync } = require('glob');

async function provisionSite(ctx, apiContext) {
  // 1. Reset and Create Dedicated E2E Site
  console.log(`Checking if E2E site ${ctx.siteERC} already exists...`);
  const checkSiteResp = await apiContext.get(
    `/o/headless-admin-site/v1.0/sites/${ctx.siteERC}`
  );
  if (checkSiteResp.ok()) {
    console.log(
      `  -> Existing site found. Deleting to ensure a clean slate...`
    );
    const deleteSiteResp = await apiContext.delete(
      `/o/headless-admin-site/v1.0/sites/${ctx.siteERC}`
    );
    if (deleteSiteResp.ok()) {
      console.log('  -> Delete request submitted. Waiting for completion...');
      let deleted = false;
      for (let i = 0; i < 15; i++) {
        await new Promise((resolve) => setTimeout(resolve, 2000));
        const statusResp = await apiContext.get(
          `/o/headless-admin-site/v1.0/sites/${ctx.siteERC}`
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

  console.log(`Creating new E2E site '${ctx.siteERC}'...`);
  const createSiteResp = await apiContext.post(
    '/o/headless-admin-site/v1.0/sites',
    {
      data: {
        name: 'Fragments E2E Test Site',
        friendlyUrlPath: ctx.siteFriendlyUrl,
        externalReferenceCode: ctx.siteERC,
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
  ctx.siteId = siteInfo.id;
  console.log(
    `Testing Global Fragments on Site: ${siteInfo.name} (ID: ${ctx.siteId}, ERC: ${ctx.siteERC})`
  );

  // 2. Detect Liferay Version
  ctx.realisedVersion = process.env.LIFERAY_VERSION || '';
  if (!ctx.realisedVersion) {
    try {
      const versionResp = await apiContext.post(
        `/api/jsonws/portal/get-version?p_auth=${ctx.pAuthToken}`
      );
      if (versionResp.ok()) {
        ctx.realisedVersion = (await versionResp.text())
          .replace(/"/g, '')
          .trim();
      }
    } catch (err) {
      console.warn(
        '  [WARN] Failed to query Liferay version via JSON WS:',
        err.message
      );
    }
  }
  console.log(
    `  -> Realised Liferay DXP version for page seeding: ${ctx.realisedVersion}`
  );

  // 3. Verify deployment via JSON WS
  console.log(
    'Verifying fragment deployment via JSON WS (per docs E2E exception)...'
  );
  let registeredKeys = [];
  try {
    // Issue #138 / #140: Use the company group ID extracted from Liferay.ThemeDisplay
    // during login. This is the definitive groupId where Global auto-deployed fragment
    // ZIPs land — the headless API's 'Global' site ID is different, and the company
    // JSON WS DTO does not expose groupId. ThemeDisplay.getCompanyGroupId() is the
    // canonical source set by Liferay itself.
    let querySiteId = ctx.companyGroupId || ctx.siteId;
    ctx.globalSiteKey = 'L_GLOBAL';
    if (ctx.companyGroupId) {
      console.log(
        `  -> Using company group ID from ThemeDisplay: ${querySiteId}`
      );
    } else {
      console.warn(
        `  -> Company group ID not available, falling back to test site ID (${ctx.siteId})`
      );
    }

    // Issue #134: Active deployment wait.
    // Liferay's auto-deploy scanner can take 3–5 minutes in CI to process all
    // fragment ZIPs. Poll until the expected minimum number of collections appear,
    // or until the 10-minute timeout is reached, before proceeding.
    const DEPLOY_MAX_ATTEMPTS = 30; // 30 × 20s = 10 minutes max
    const DEPLOY_POLL_MS = 20 * 1000; // 20 seconds between attempts
    const DEPLOY_MIN_COLLECTIONS = 5; // minimum expected deployed collections

    let collections = [];
    for (let attempt = 0; attempt < DEPLOY_MAX_ATTEMPTS; attempt++) {
      // Query the Global site first; fall back to Guest site if empty
      let collectionsResp = await apiContext.post(
        `/api/jsonws/fragment.fragmentcollection/get-fragment-collections?p_auth=${ctx.pAuthToken}`,
        {
          form: {
            groupId: querySiteId,
            start: -1,
            end: -1,
          },
        }
      );

      if (collectionsResp.ok()) {
        collections = await collectionsResp.json();
      }

      // If the company group returned nothing, also try the test site as a secondary check
      if (collections.length === 0 && querySiteId !== ctx.siteId) {
        const fallbackResp = await apiContext.post(
          `/api/jsonws/fragment.fragmentcollection/get-fragment-collections?p_auth=${ctx.pAuthToken}`,
          {
            form: {
              groupId: ctx.siteId,
              start: -1,
              end: -1,
            },
          }
        );
        if (fallbackResp.ok()) {
          const fallbackCollections = await fallbackResp.json();
          if (fallbackCollections.length > 0) {
            collections = fallbackCollections;
            console.log(
              `  -> [DEPLOY WAIT] Found ${collections.length} collections on test site (ID: ${ctx.siteId}) instead of company group.`
            );
          }
        }
      }

      if (collections.length >= DEPLOY_MIN_COLLECTIONS) {
        if (attempt > 0) {
          console.log(
            `  -> [DEPLOY WAIT] ${collections.length} collections found after ${(attempt * DEPLOY_POLL_MS) / 1000}s. Proceeding.`
          );
        }
        break;
      }

      const elapsed = (attempt * DEPLOY_POLL_MS) / 1000;
      const remaining =
        ((DEPLOY_MAX_ATTEMPTS - attempt - 1) * DEPLOY_POLL_MS) / 1000;
      console.log(
        `  -> [DEPLOY WAIT] Only ${collections.length}/${DEPLOY_MIN_COLLECTIONS} collections found ` +
          `(attempt ${attempt + 1}/${DEPLOY_MAX_ATTEMPTS}, ${elapsed}s elapsed, up to ${remaining}s remaining). ` +
          `Waiting for Liferay auto-deploy to complete...`
      );
      await new Promise((resolve) => setTimeout(resolve, DEPLOY_POLL_MS));
    }

    if (collections.length < DEPLOY_MIN_COLLECTIONS) {
      console.warn(
        `  -> [DEPLOY WAIT] Timed out. Only ${collections.length} collections found. ` +
          `Proceeding optimistically — some fragment tests may fail.`
      );
    }

    if (collections.length > 0) {
      for (const collection of collections) {
        const entriesResp = await apiContext.post(
          `/api/jsonws/fragment.fragmententry/get-fragment-entries?p_auth=${ctx.pAuthToken}`,
          {
            form: {
              groupId: querySiteId,
              fragmentCollectionId: collection.fragmentCollectionId,
              status: -1,
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
                let sanitizedConfig = entry.configuration || '';
                if (sanitizedConfig) {
                  try {
                    const configObj = JSON.parse(sanitizedConfig);
                    let modifications = [];
                    if (configObj.fieldSets) {
                      for (const fieldSet of configObj.fieldSets) {
                        if (fieldSet.fields) {
                          for (const field of fieldSet.fields) {
                            if (field.dataType === 'boolean') {
                              delete field.dataType;
                              modifications.push('removed "boolean"');
                            } else if (field.dataType === 'number') {
                              field.dataType = 'int';
                              modifications.push(
                                `"number"→"int" for ${field.name}`
                              );
                            }
                          }
                        }
                      }
                    }
                    if (modifications.length > 0) {
                      sanitizedConfig = JSON.stringify(configObj);
                      console.log(
                        `     [SANITIZED] ${entry.name}: ${modifications.join(', ')}`
                      );
                    }
                  } catch (parseErr) {
                    // If configuration is not valid JSON, pass it through as-is
                  }
                }

                const approveResp = await apiContext.post(
                  `/api/jsonws/fragment.fragmententry/update-fragment-entry?p_auth=${ctx.pAuthToken}`,
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
                      configuration: sanitizedConfig,
                      icon: entry.icon || '',
                      previewFileEntryId: entry.previewFileEntryId || 0,
                      readOnly:
                        entry.readOnly !== undefined ? entry.readOnly : false,
                      typeOptions: entry.typeOptions || '',
                      status: 0,
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
              ctx.dbFragmentKeyToERC[entry.fragmentEntryKey] =
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

  // 4. Cache local fragment keys to directories mapping
  const allFragmentFiles = globSync('**/main/fragment.json', {
    cwd: ctx.projectRoot,
    absolute: true,
    ignore: [
      '**/node_modules/**',
      '**/temp*/**',
      '**/zips/**',
      '**/e2e-tests/**',
    ],
  });
  for (const file of allFragmentFiles) {
    try {
      const fragmentData = JSON.parse(fs.readFileSync(file, 'utf8'));
      const baseFragmentKey =
        fragmentData.key || path.basename(path.dirname(path.dirname(file)));
      ctx.fragmentKeyToDir[baseFragmentKey] = path.dirname(path.dirname(file));
    } catch (e) {}
  }

  // 5. Scan and filter target fragment files to seed
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
          const rel = path.relative(ctx.projectRoot, proj.path);
          if (!rel.startsWith('..') && !path.isAbsolute(rel) && rel !== '') {
            ldmIgnores.push(`**/${rel}/**`);
          }
        }
      });
    }
  } catch (e) {}

  let fragmentFiles = globSync('**/main/fragment.json', {
    cwd: ctx.projectRoot,
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
  ctx.fragmentFiles = fragmentFiles;

  // 6. Fetch existing layouts to optimize duplicate check lookups
  ctx.existingLayouts = [];
  try {
    const pageSearchResp = await apiContext.post(
      `/api/jsonws/layout/get-layouts?p_auth=${ctx.pAuthToken}`,
      {
        form: {
          groupId: ctx.siteId,
          privateLayout: false,
        },
      }
    );
    if (pageSearchResp.ok()) {
      ctx.existingLayouts = await pageSearchResp.json();
      console.log(
        `  -> Retrieved ${ctx.existingLayouts.length} existing layouts to optimize lookup.`
      );
    } else {
      console.warn(
        `  -> [WARN] Failed to fetch existing layouts: ${pageSearchResp.status()}`
      );
    }
  } catch (e) {
    console.error('  -> Error fetching existing layouts:', e.message);
  }

  // 7. Resolve object definitions for scope mapping
  ctx.objectDefinitions = [];
  try {
    let currentPage = 1;
    let hasMore = true;
    while (hasMore) {
      const objDefsResp = await apiContext.get(
        `/o/object-admin/v1.0/object-definitions?page=${currentPage}&pageSize=100`
      );
      if (objDefsResp.ok()) {
        const objDefsJson = await objDefsResp.json();
        const items = objDefsJson.items || [];
        ctx.objectDefinitions.push(...items);
        if (items.length < 100) {
          hasMore = false;
        } else {
          currentPage++;
        }
      } else {
        hasMore = false;
      }
    }
    console.log(
      `  -> Retrieved ${ctx.objectDefinitions.length} object definitions for scope mapping.`
    );
  } catch (e) {
    console.warn('  -> [WARN] Failed to fetch object definitions:', e.message);
  }
}

module.exports = { provisionSite };
