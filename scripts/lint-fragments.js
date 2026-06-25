const fs = require('fs');
const path = require('path');
const Ajv = require('ajv');
const { globSync } = require('glob');
const { generateGallery } = require('./generate-gallery');

const ajv = new Ajv({ allErrors: true });

// --- SCHEMAS ---
const fragmentSchema = {
  type: 'object',
  required: [
    'name',
    'type',
    'htmlPath',
    'jsPath',
    'cssPath',
    'configurationPath',
  ],
  properties: {
    name: { type: 'string' },
    type: { type: 'string' },
    htmlPath: { type: 'string' },
    jsPath: { type: 'string' },
    cssPath: { type: 'string' },
    configurationPath: { type: 'string' },
  },
};

const configurationSchema = {
  type: 'object',
  properties: {
    fieldSets: {
      type: 'array',
      items: {
        type: 'object',
        required: ['fields'],
        properties: {
          fields: {
            type: 'array',
            items: {
              type: 'object',
              required: ['name', 'type', 'label'],
              properties: {
                name: { type: 'string' },
                type: { type: 'string' },
                label: { type: 'string' },
                description: { type: 'string' },
              },
            },
          },
        },
      },
    },
  },
};

const validateFragment = ajv.compile(fragmentSchema);
const validateConfiguration = ajv.compile(configurationSchema);

// --- UTILS ---
const getLangKeys = (dir) => {
  const keys = new Map();
  let currentDir = path.resolve(dir);
  const rootDir = process.cwd();

  while (true) {
    const propFile = path.join(currentDir, 'Language_en_US.properties');
    if (fs.existsSync(propFile)) {
      const folderKeys = parseProps(propFile);
      folderKeys.forEach((v, k) => {
        if (!keys.has(k)) keys.set(k, v);
      });
    }

    if (currentDir === rootDir) break;
    const nextDir = path.dirname(currentDir);
    if (nextDir === currentDir) break;
    currentDir = nextDir;
  }
  return keys;
};

const parseProps = (filePath) => {
  const content = fs.readFileSync(filePath, 'utf8').replace(/\r/g, '');
  const keys = new Map();
  content.split('\n').forEach((line) => {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) keys.set(match[1].trim(), match[2].trim());
  });
  return keys;
};

// --- AUDIT ---
const audit = {
  errors: 0,
  warnings: 0,
  total: 0,
};

const logError = (fragment, msg) => {
  console.error(`[\x1b[31mERROR\x1b[0m] ${fragment}: ${msg}`);
  audit.errors++;
};

const logWarn = (fragment, msg) => {
  console.warn(`[\x1b[33mWARN\x1b[0m] ${fragment}: ${msg}`);
  audit.warnings++;
};

// Dynamically ignore any local LDM sandbox project directories to avoid scanning them
const ldmIgnores = [];
try {
  const os = require('os');
  const registryPath = path.join(os.homedir(), '.ldm', 'registry.json');
  if (fs.existsSync(registryPath)) {
    const registry = JSON.parse(fs.readFileSync(registryPath, 'utf8'));
    Object.values(registry).forEach((proj) => {
      if (proj.path) {
        const rel = path.relative(process.cwd(), proj.path);
        if (!rel.startsWith('..') && !path.isAbsolute(rel) && rel !== '') {
          ldmIgnores.push(`${rel}/**`);
        }
      }
    });
  }
} catch (e) {}

// 1. Find all fragments
const fragmentFiles = globSync('**/fragment.json', {
  ignore: [
    'node_modules/**',
    'temp_extract/**',
    'temp_inspect/**',
    'temp_inspect_zip/**',
    'temp_extract_zip/**',
    ...ldmIgnores,
  ],
});
audit.total = fragmentFiles.length;

console.log(`Starting audit of ${audit.total} fragments...\n`);

fragmentFiles.forEach((file) => {
  const dir = path.dirname(file);
  const fragmentName = path.basename(dir);
  let fragJson;

  try {
    fragJson = JSON.parse(fs.readFileSync(file, 'utf8'));
    if (!validateFragment(fragJson)) {
      logError(
        fragmentName,
        `fragment.json schema mismatch: ${ajv.errorsText(validateFragment.errors)}`
      );
    }

    // Validate that detailed documentation markdown file exists in docs/fragments/
    if (fragJson.name) {
      const fragSafeName = fragJson.name
        .replace(/[^a-z0-9]+/gi, '-')
        .toLowerCase();
      const folderName = path.basename(dir);
      const folderSafeName = folderName
        .replace(/[^a-z0-9]+/gi, '-')
        .toLowerCase();

      const docPath1 = path.join(
        process.cwd(),
        'docs',
        'fragments',
        `${fragSafeName}.md`
      );
      const docPath2 = path.join(
        process.cwd(),
        'docs',
        'fragments',
        `${folderSafeName}.md`
      );
      const docPath3 = path.join(
        process.cwd(),
        'docs',
        'fragments',
        `${folderName}.md`
      );

      if (
        !fs.existsSync(docPath1) &&
        !fs.existsSync(docPath2) &&
        !fs.existsSync(docPath3)
      ) {
        logError(
          fragmentName,
          `Missing detailed documentation file. Expected at: docs/fragments/${fragSafeName}.md`
        );
      }
    }
  } catch (e) {
    logError(fragmentName, `Could not parse fragment.json: ${e.message}`);
    return;
  }

  const configPath = path.join(
    dir,
    fragJson.configurationPath || 'configuration.json'
  );
  if (fs.existsSync(configPath)) {
    try {
      const configJson = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      if (!validateConfiguration(configJson)) {
        logError(
          fragmentName,
          `configuration.json schema mismatch: ${ajv.errorsText(validateConfiguration.errors)}`
        );
      }

      const langKeys = getLangKeys(dir);
      const fieldToFieldSet = new Map();
      configJson.fieldSets?.forEach((fs, index) => {
        fs.fields?.forEach((field) => {
          fieldToFieldSet.set(field.name, index);
        });
      });

      configJson.fieldSets?.forEach((set, index) => {
        if (set.label) {
          if (!langKeys.has(set.label)) {
            logError(
              fragmentName,
              `Missing localization for fieldset: ${set.label}`
            );
          } else if (langKeys.get(set.label) === set.label) {
            logError(
              fragmentName,
              `Lazy localization found for fieldset (key equals value): ${set.label}`
            );
          }
        }

        set.fields?.forEach((field) => {
          // 1. Strict dataType constraints
          if (field.dataType !== undefined && field.dataType !== null) {
            const allowedDataTypes = ['string', 'int', 'object'];
            if (!allowedDataTypes.includes(field.dataType)) {
              logError(
                fragmentName,
                `Field '${field.name}' has invalid dataType '${field.dataType}'. Must be one of: ${allowedDataTypes.join(', ')}`
              );
            }
          }

          // 1.1 Strict UI type constraints (blocking unsupported types like 'number')
          if (field.type !== undefined && field.type !== null) {
            const allowedTypes = [
              'text',
              'textarea',
              'select',
              'checkbox',
              'colorPicker',
              'colorPalette',
              'length',
              'item',
              'itemSelector',
              'url',
              'navigationMenuSelector',
            ];
            if (!allowedTypes.includes(field.type)) {
              logError(
                fragmentName,
                `Field '${field.name}' has invalid UI input type '${field.type}'. Must be one of: ${allowedTypes.join(', ')}`
              );
            }
          }

          // 2. Strict type vs dataType alignment
          if (field.type === 'checkbox') {
            if (field.dataType !== undefined) {
              logError(
                fragmentName,
                `Field '${field.name}' of type 'checkbox' must omit dataType (found '${field.dataType}')`
              );
            }
          } else if (field.type === 'select') {
            if (field.dataType !== undefined && field.dataType !== 'string') {
              logError(
                fragmentName,
                `Field '${field.name}' of type 'select' must have dataType: 'string' or omit it (found '${field.dataType}')`
              );
            }
          }

          // 3. Strict defaultValue type constraints
          if (field.defaultValue !== undefined && field.defaultValue !== null) {
            if (field.dataType === 'int') {
              if (typeof field.defaultValue !== 'string') {
                logError(
                  fragmentName,
                  `Field '${field.name}' has numeric dataType but defaultValue is not a string: ${JSON.stringify(field.defaultValue)} (type: ${typeof field.defaultValue}). Numeric fields must use string-based default values.`
                );
              }
            } else if (
              field.dataType === 'boolean' ||
              field.type === 'checkbox'
            ) {
              if (typeof field.defaultValue !== 'boolean') {
                logError(
                  fragmentName,
                  `Field '${field.name}' has boolean dataType/type but defaultValue is not a boolean: ${JSON.stringify(field.defaultValue)} (type: ${typeof field.defaultValue})`
                );
              }
            } else {
              // String fields (text, select, colorPicker, length, etc.)
              // Skip object/array values (e.g. for image fields)
              if (
                typeof field.defaultValue !== 'string' &&
                typeof field.defaultValue !== 'object'
              ) {
                logError(
                  fragmentName,
                  `Field '${field.name}' has string type but defaultValue is not a string: ${JSON.stringify(field.defaultValue)} (type: ${typeof field.defaultValue})`
                );
              }
            }
          }

          if (field.typeOptions?.dependency) {
            const depFields = [];
            if (field.typeOptions.dependency.field) {
              depFields.push(field.typeOptions.dependency.field);
            } else {
              depFields.push(...Object.keys(field.typeOptions.dependency));
            }
            depFields.forEach((depField) => {
              const depFieldSetIndex = fieldToFieldSet.get(depField);
              if (
                depFieldSetIndex !== undefined &&
                depFieldSetIndex !== index
              ) {
                logError(
                  fragmentName,
                  `Field '${field.name}' in fieldset ${index} depends on '${depField}' in fieldset ${depFieldSetIndex}. Dependencies cannot cross fieldsets.`
                );
              }
            });
          }

          if (field.label) {
            if (!langKeys.has(field.label)) {
              logError(
                fragmentName,
                `Missing localization for label: ${field.label}`
              );
            } else if (langKeys.get(field.label) === field.label) {
              logError(
                fragmentName,
                `Lazy localization found for label (key equals value): ${field.label}`
              );
            }
          } else {
            logError(fragmentName, `Field '${field.name}' is missing a label.`);
          }

          if (field.description) {
            if (!langKeys.has(field.description)) {
              logError(
                fragmentName,
                `Missing localization for description: ${field.description}`
              );
            } else if (langKeys.get(field.description) === field.description) {
              logError(
                fragmentName,
                `Lazy localization found for description (key equals value): ${field.description}`
              );
            }
          } else {
            logError(
              fragmentName,
              `Field '${field.name}' is missing a description.`
            );
          }

          if (field.typeOptions?.validValues) {
            field.typeOptions.validValues.forEach((val) => {
              if (val.label) {
                if (!langKeys.has(val.label)) {
                  logError(
                    fragmentName,
                    `Missing localization for validValue label: ${val.label}`
                  );
                } else if (langKeys.get(val.label) === val.label) {
                  logError(
                    fragmentName,
                    `Lazy localization found for validValue label (key equals value): ${val.label}`
                  );
                }
              }
            });
          }
        });
      });

      // --- FIELD REFERENCE CHECK ---
      const fieldNames = new Set();
      configJson.fieldSets?.forEach((fs) => {
        fs.fields?.forEach((f) => fieldNames.add(f.name));
      });

      const checkFieldReferences = (filePath) => {
        if (!fs.existsSync(filePath)) return;
        const content = fs.readFileSync(filePath, 'utf8');
        const regex = /configuration\.([a-zA-Z0-9_-]+)/g;
        let match;
        while ((match = regex.exec(content)) !== null) {
          const fieldName = match[1];
          if (!fieldNames.has(fieldName)) {
            logError(
              fragmentName,
              `Reference to 'configuration.${fieldName}' in ${path.basename(filePath)} not found in configuration.json`
            );
          }
        }
      };

      const validateFreeMarker = (filePath) => {
        if (!fs.existsSync(filePath) || !filePath.endsWith('.ftl')) return;
        const content = fs.readFileSync(filePath, 'utf8');
        const fragmentName = path.basename(path.dirname(filePath));

        // 1. Basic Square Bracket Balance Check
        const openBrackets =
          (content.match(/\[#/g) || []).length +
          (content.match(/\[@/g) || []).length;
        const closeBrackets =
          (content.match(/\[\/#/g) || []).length +
          (content.match(/\/\]/g) || []).length;

        // Note: This is a loose check because some tags are self-closing [ @clay... / ]
        // but we can check for common Liferay FTL patterns.

        const ifCount = (content.match(/\[#if/g) || []).length;
        const endifCount = (content.match(/\[\/#if\]/g) || []).length;
        if (ifCount !== endifCount) {
          logError(
            fragmentName,
            `Mismatched FreeMarker [#if] tags in ${path.basename(filePath)}. Found ${ifCount} open, ${endifCount} closed.`
          );
        }

        const listCount = (content.match(/\[#list/g) || []).length;
        const endlistCount = (content.match(/\[\/#list\]/g) || []).length;
        if (listCount !== endlistCount) {
          logError(
            fragmentName,
            `Mismatched FreeMarker [#list] tags in ${path.basename(filePath)}. Found ${listCount} open, ${endlistCount} closed.`
          );
        }

        const assignCount = (content.match(/\[#assign/g) || []).length;
        const endassignCount = (content.match(/\[\/#assign\]/g) || []).length;
        // Assign doesn't always need a closing tag if it's a single line, but usually does in Liferay fragments for blocks

        // 2. Check for common siteSpritemap / clay icon errors
        if (
          content.includes('siteSpritemap') &&
          !content.includes('${siteSpritemap}')
        ) {
          logWarn(
            fragmentName,
            `Suspicious usage of 'siteSpritemap' in ${path.basename(filePath)}. Did you mean \${siteSpritemap}?`
          );
        }
      };

      const htmlPath = path.join(dir, fragJson.htmlPath || 'index.html');
      const jsPath = path.join(dir, fragJson.jsPath || 'index.js');

      // Also check for .ftl if htmlPath is something else or just common extensions
      const filesToCheck = new Set();

      // Add any specific paths from fragment.json
      if (fragJson.htmlPath)
        filesToCheck.add(path.join(dir, fragJson.htmlPath));
      if (fragJson.jsPath) filesToCheck.add(path.join(dir, fragJson.jsPath));
      if (fragJson.cssPath) filesToCheck.add(path.join(dir, fragJson.cssPath));

      // Always check standard names if they exist
      ['index.html', 'index.ftl', 'index.js', 'index.css'].forEach((name) => {
        const p = path.join(dir, name);
        if (fs.existsSync(p)) filesToCheck.add(p);
      });

      filesToCheck.forEach((f) => {
        checkFieldReferences(f);
        validateFreeMarker(f);
      });
    } catch (e) {
      logError(
        fragmentName,
        `Could not parse configuration.json: ${e.message}`
      );
    }
  }

  const cssPath = path.join(dir, fragJson.cssPath || 'index.css');
  if (fs.existsSync(cssPath)) {
    const css = fs.readFileSync(cssPath, 'utf8');
    const allHexMatches = css.match(/#[0-9a-fA-F]{3,6}\b/g) || [];
    const hardcodedHex = allHexMatches.filter((hex) => {
      const strippedCss = css
        .replace(/var\([^,]+,\s*#[0-9a-fA-F]{3,6}\)/g, 'VAR_WITH_FALLBACK')
        .replace(
          /\[style\*=["'][^\]]*#[0-9a-fA-F]{3,6}[^\]]*["']\]/g,
          'ATTR_SELECTOR_WITH_HEX'
        );
      return strippedCss.includes(hex);
    });

    if (hardcodedHex.length > 0) {
      logWarn(
        fragmentName,
        `Hardcoded colors found in CSS: ${[...new Set(hardcodedHex)].join(', ')}. Use var() tokens.`
      );
    }
  }

  const jsPath = path.join(dir, fragJson.jsPath || 'index.js');
  if (fs.existsSync(jsPath)) {
    const js = fs.readFileSync(jsPath, 'utf8');
    if (
      /^return\s+|[;{]\s*return\s+/m.test(js) &&
      !js.includes('function') &&
      !js.includes('=>')
    ) {
      logError(
        fragmentName,
        `Illegal top-level return statement found in index.js.`
      );
    }
  }
});

// --- GALLERY DRIFT CHECK ---
console.log(`Checking for Gallery drift...`);
const GALLERY_FILE = path.join(process.cwd(), 'docs', 'gallery.md');
const currentGalleryContent = fs.existsSync(GALLERY_FILE)
  ? fs.readFileSync(GALLERY_FILE, 'utf8')
  : '';
const expectedGalleryContent = generateGallery();

const normalize = (str) =>
  str
    .trim()
    .replace(/\(<([^>]+)>\)/g, '($1)')
    .replace(/-{3,}/g, '---')
    .replace(/\s+/g, ' ');

if (normalize(currentGalleryContent) !== normalize(expectedGalleryContent)) {
  logWarn(
    'Documentation',
    "Gallery is out of sync. Please run 'node scripts/generate-gallery.js' to update it."
  );
} else {
  console.log('Gallery is in sync.\n');
}

// --- MARKDOWN BROKEN LINK CHECKER ---
console.log(`Checking Markdown files for broken local links...`);
const mdFiles = globSync('**/*.md', {
  ignore: ['node_modules/**', '**/node_modules/**', '.git/**'],
});

mdFiles.forEach((mdFile) => {
  const content = fs.readFileSync(mdFile, 'utf8');
  const mdDir = path.dirname(mdFile);

  const checkLink = (rawPath, type) => {
    // Skip template variables (e.g. {{contactInformation.website}}) and absolute file scheme URLs
    if (
      rawPath.includes('{') ||
      rawPath.includes('}') ||
      rawPath.startsWith('file:///')
    ) {
      return;
    }

    const linkPath = decodeURIComponent(rawPath.split('#')[0]);
    if (!linkPath) return;

    const resolvedPath = path.resolve(mdDir, linkPath);
    if (!fs.existsSync(resolvedPath)) {
      // Missing live images (under docs/images/live) should be warnings, not errors
      // since they are generated dynamically on successful test runs
      if (rawPath.includes('images/live/')) {
        logWarn(
          mdFile,
          `Missing live snapshot reference: "${rawPath}" (Expected: ${path.relative(process.cwd(), resolvedPath)})`
        );
      } else {
        logError(
          mdFile,
          `Broken ${type} reference to "${rawPath}" (Resolved: ${path.relative(process.cwd(), resolvedPath)})`
        );
      }
    }
  };

  // 1. Standard markdown links: [text](path) or ![alt](path)
  // Handles standard paths and paths enclosed in angle brackets <path> to escape parentheses
  const mdLinkRegex =
    /!?\[[^\]]*\]\(\s*(?:<([^>]+)>|((?!https?:\/\/|mailto:|#|file:\/\/\/)[^\s]+))\)/g;
  let match;
  while ((match = mdLinkRegex.exec(content)) !== null) {
    const rawPath = match[1] || match[2];
    if (rawPath) checkLink(rawPath, 'markdown link');
  }

  // 2. HTML <img> tags: <img src="path">
  const imgTagRegex =
    /<img\s+[^>]*src=["'](?!https?:\/\/|file:\/\/\/)([^"']+)["'][^>]*>/g;
  while ((match = imgTagRegex.exec(content)) !== null) {
    checkLink(match[1], 'image src');
  }

  // 3. HTML <a> tags: <a href="path">
  const aTagRegex =
    /<a\s+[^>]*href=["'](?!https?:\/\/|mailto:|#|file:\/\/\/)([^"']+)["'][^>]*>/g;
  while ((match = aTagRegex.exec(content)) !== null) {
    checkLink(match[1], 'HTML anchor href');
  }
});
console.log('Markdown local link validation complete.\n');

console.log(`\nAudit Complete!`);
console.log(`---------------------------------`);
console.log(`Total Fragments: ${audit.total}`);
console.log(`Errors:          \x1b[31m${audit.errors}\x1b[0m`);
console.log(`Warnings:        \x1b[33m${audit.warnings}\x1b[0m`);
console.log(`---------------------------------`);

if (audit.errors > 0) {
  process.exit(1);
}
process.exit(0);
