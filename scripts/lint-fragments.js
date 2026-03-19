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
  const content = fs.readFileSync(filePath, 'utf8');
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

// 1. Find all fragments
const fragmentFiles = globSync('**/fragment.json', {
  ignore: 'node_modules/**',
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
          if (field.typeOptions?.dependency) {
            Object.keys(field.typeOptions.dependency).forEach((depField) => {
              const depFieldSetIndex = fieldToFieldSet.get(depField);
              if (
                depFieldSetIndex !== undefined &&
                depFieldSetIndex !== index
              ) {
                logError(
                  fragmentName,
                  `Field '${field.name}' in fieldset ${index} ('${set.label}') depends on '${depField}' in fieldset ${depFieldSetIndex}. Dependencies cannot cross fieldsets.`
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

      const htmlPath = path.join(dir, fragJson.htmlPath || 'index.html');
      const jsPath = path.join(dir, fragJson.jsPath || 'index.js');

      // Also check for .ftl if htmlPath is something else or just common extensions
      const extensions = ['.html', '.js', '.ftl'];
      const filesToCheck = new Set([htmlPath, jsPath]);

      // Add any specific paths from fragment.json if they weren't the defaults
      if (fragJson.htmlPath)
        filesToCheck.add(path.join(dir, fragJson.htmlPath));
      if (fragJson.jsPath) filesToCheck.add(path.join(dir, fragJson.jsPath));

      filesToCheck.forEach((f) => checkFieldReferences(f));

      // Special case: check for index.ftl if it exists but wasn't explicitly referenced
      const ftlPath = path.join(dir, 'index.ftl');
      if (fs.existsSync(ftlPath)) checkFieldReferences(ftlPath);
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
      const strippedCss = css.replace(
        /var\([^,]+,\s*#[0-9a-fA-F]{3,6}\)/g,
        'VAR_WITH_FALLBACK'
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

const normalize = (str) => str.trim().replace(/\s+/g, ' ');

if (normalize(currentGalleryContent) !== normalize(expectedGalleryContent)) {
  logError(
    'Documentation',
    "Gallery is out of sync. Please run 'npm run docs:gallery' to update it."
  );
} else {
  console.log('Gallery is in sync.\n');
}

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
