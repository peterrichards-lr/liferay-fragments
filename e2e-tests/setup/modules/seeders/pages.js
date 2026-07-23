const fs = require('fs');
const path = require('path');
const PicklistSeeder = require('./picklists');
const DocumentSeeder = require('./documents');
const CollectionSeeder = require('./collections');

function buildPageElementTree(
  node,
  siteERC,
  assetMap,
  defaultFragmentKey,
  defaultFragmentConfig,
  fragmentKeyToDir,
  objectDefinitions = [],
  globalSiteKey = 'L_GLOBAL'
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
              objectDefinitions,
              globalSiteKey
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
              objectDefinitions,
              globalSiteKey
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
          objectDefinitions,
          globalSiteKey
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
                objectDefinitions,
                globalSiteKey
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
            objectDefinitions,
            globalSiteKey
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
                objectDefinitions,
                globalSiteKey
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
            objectDefinitions,
            globalSiteKey
          )
        );
      }
    }

    return element;
  }
}

async function seed(ctx, apiContext) {
  const {
    siteId,
    siteERC,
    globalSiteKey,
    fragmentFiles,
    existingLayouts,
    objectDefinitions,
    fragmentKeyToDir,
  } = ctx;

  const seededAssetsPath = path.join(
    ctx.projectRoot,
    'e2e-tests',
    'seeded-assets.json'
  );
  let seededAssets = [];
  if (fs.existsSync(seededAssetsPath)) {
    try {
      seededAssets = JSON.parse(fs.readFileSync(seededAssetsPath, 'utf8'));
    } catch (e) {}
  }

  for (const file of fragmentFiles) {
    const fragmentData = JSON.parse(fs.readFileSync(file, 'utf8'));
    const fragmentName = fragmentData.name;
    const baseFragmentKey =
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

    const fragmentKey = baseFragmentKey;

    // ----- SEED TEST DATA IF PRESENT -----
    const testDataFile = path.join(
      path.dirname(path.dirname(file)),
      'test',
      'test-data.json'
    );
    let seededConfigOverrides = {};
    let testData = null;
    const assetMap = { ...ctx.commerceAssetMap };
    const assetEntryIdMap = {};
    const documentIdMap = {};

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

        // Run seeders sequentially for the current manifest
        await PicklistSeeder.seed(ctx, apiContext, testData);
        await DocumentSeeder.seed(
          ctx,
          apiContext,
          testData,
          assetMap,
          documentIdMap,
          assetEntryIdMap,
          seededAssets
        );
        await CollectionSeeder.seed(
          ctx,
          apiContext,
          testData,
          assetMap,
          assetEntryIdMap,
          seededAssets
        );

        // Extract Configuration Overrides
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
          objectDefinitions,
          globalSiteKey
        );

        if (rootPageElement && rootPageElement.type !== 'Root') {
          console.log(
            `     [INFO] Wrapping custom layout of type ${rootPageElement.type} to conform to Root -> Section -> Row -> Column schema.`
          );
          let current = rootPageElement;
          if (current.type === 'Section') {
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
              type: 'Root',
              pageElements: [current],
            };
          } else if (current.type === 'Row') {
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
      if (fragmentKeyToDir && fragmentKeyToDir[fragmentKey]) {
        const parentDir = fragmentKeyToDir[fragmentKey];
        try {
          const fragJsonPath = path.join(parentDir, 'main', 'fragment.json');
          if (fs.existsSync(fragJsonPath)) {
            const fragJson = JSON.parse(fs.readFileSync(fragJsonPath, 'utf8'));
            if (fragJson.type === 'input') {
              isInputType = true;
            }
          }
        } catch (e) {}
      }

      if (isInputType) {
        const applicantDef = objectDefinitions.find(
          (d) => d.externalReferenceCode === 'APPLICANT'
        );
        const applicantClassName = applicantDef
          ? applicantDef.className
          : 'com.liferay.object.model.ObjectDefinition#APPLICANT';

        let fieldKey = 'favoriteColor';
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
                            type: 'BasicFragment',
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

    let localExistingLayouts = [...existingLayouts];

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
              const matchedPage = localExistingLayouts.find(
                (l) => l.friendlyURL === friendlyUrl
              );
              if (matchedPage) {
                const deleteId = matchedPage.plid;
                const deleteResp = await apiContext.post(
                  `/api/jsonws/layout/delete-layout?p_auth=${ctx.pAuthToken}`,
                  {
                    form: {
                      plid: deleteId,
                    },
                  }
                );
                if (deleteResp.ok()) {
                  localExistingLayouts = localExistingLayouts.filter(
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
    ctx.testPagesMap.push({
      collectionName: collectionName,
      collectionFolder: collectionFolder,
      fragmentName: fragmentName,
      url: `/web/fragments-e2e-test-site${friendlyUrl}`,
      id: pageId,
      uuid: pageUuid,
      siteERC: siteERC,
      excludeFromGallery:
        isDeprecatedFlag || (testData ? !!testData.excludeFromGallery : false),
      // Per-fragment custom verification criteria (requiredSelectors / forbiddenSelectors).
      // Defined in each fragment's test/test-data.json under "verification".
      // Applied by fragments.spec.js after generic content-quality checks.
      verification: testData ? (testData.verification || null) : null,
    });
  }

  // Save updated seeded assets list
  try {
    fs.writeFileSync(seededAssetsPath, JSON.stringify(seededAssets, null, 2));
  } catch (e) {}
}

module.exports = { seed };
