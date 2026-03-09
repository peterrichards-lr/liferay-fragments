const fs = require("fs");
const path = require("path");
const Ajv = require("ajv");
const { globSync } = require("glob");

const ajv = new Ajv({ allErrors: true });

// --- SCHEMAS ---
const fragmentSchema = {
  type: "object",
  required: ["name", "type"],
  properties: {
    name: { type: "string" },
    type: { type: "string" },
    htmlPath: { type: "string" },
    jsPath: { type: "string" },
    cssPath: { type: "string" },
    configurationPath: { type: "string" },
  },
};

const configurationSchema = {
  type: "object",
  properties: {
    fieldSets: {
      type: "array",
      items: {
        type: "object",
        required: ["fields"],
        properties: {
          fields: {
            type: "array",
            items: {
              type: "object",
              required: ["name", "type", "label"],
              properties: {
                name: { type: "string" },
                type: { type: "string" },
                label: { type: "string" },
                description: { type: "string" },
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
  const propFile = path.join(dir, "Language_en_US.properties");
  if (!fs.existsSync(propFile)) {
    // Try parent directory (collection level)
    const parentPropFile = path.join(dir, "..", "Language_en_US.properties");
    if (fs.existsSync(parentPropFile)) {
      return parseProps(parentPropFile);
    }
    return new Set();
  }
  return parseProps(propFile);
};

const parseProps = (filePath) => {
  const content = fs.readFileSync(filePath, "utf8");
  const keys = new Set();
  content.split("\n").forEach((line) => {
    const match = line.match(/^([^=]+)=/);
    if (match) keys.add(match[1].trim());
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
const fragmentFiles = globSync("**/fragment.json", {
  ignore: "node_modules/**",
});
audit.total = fragmentFiles.length;

console.log(`Starting audit of ${audit.total} fragments...\n`);

fragmentFiles.forEach((file) => {
  const dir = path.dirname(file);
  const fragmentName = path.basename(dir);
  let fragJson;

  // A. Validate fragment.json
  try {
    fragJson = JSON.parse(fs.readFileSync(file, "utf8"));
    if (!validateFragment(fragJson)) {
      logError(
        fragmentName,
        `fragment.json schema mismatch: ${ajv.errorsText(validateFragment.errors)}`,
      );
    }
  } catch (e) {
    logError(fragmentName, `Could not parse fragment.json: ${e.message}`);
    return;
  }

  // B. Validate configuration.json & Localization
  const configPath = path.join(
    dir,
    fragJson.configurationPath || "configuration.json",
  );
  if (fs.existsSync(configPath)) {
    try {
      const configJson = JSON.parse(fs.readFileSync(configPath, "utf8"));
      if (!validateConfiguration(configJson)) {
        logError(
          fragmentName,
          `configuration.json schema mismatch: ${ajv.errorsText(validateConfiguration.errors)}`,
        );
      }

      const langKeys = getLangKeys(dir);
      configJson.fieldSets?.forEach((set) => {
        if (set.label && set.label.includes(".") && !langKeys.has(set.label)) {
          logError(
            fragmentName,
            `Missing localization for fieldset: ${set.label}`,
          );
        }
        set.fields?.forEach((field) => {
          if (
            field.label &&
            field.label.includes(".") &&
            !langKeys.has(field.label)
          ) {
            logError(
              fragmentName,
              `Missing localization for label: ${field.label}`,
            );
          }
          if (
            field.description &&
            field.description.includes(".") &&
            !langKeys.has(field.description)
          ) {
            logWarn(
              fragmentName,
              `Missing localization for description: ${field.description}`,
            );
          }
        });
      });
    } catch (e) {
      logError(
        fragmentName,
        `Could not parse configuration.json: ${e.message}`,
      );
    }
  }

  // C. Rule #9: Theme Fidelity (Safe Tokens)
  const cssPath = path.join(dir, fragJson.cssPath || "index.css");
  if (fs.existsSync(cssPath)) {
    const css = fs.readFileSync(cssPath, "utf8");
    // Find hex colors, then filter out those that are part of a var() fallback.
    const allHexMatches = css.match(/#[0-9a-fA-F]{3,6}\b/g) || [];
    const hardcodedHex = allHexMatches.filter((hex) => {
      // Strip var() fallbacks and check if hex still exists
      const strippedCss = css.replace(
        /var\([^,]+,\s*#[0-9a-fA-F]{3,6}\)/g,
        "VAR_WITH_FALLBACK",
      );
      return strippedCss.includes(hex);
    });

    if (hardcodedHex.length > 0) {
      logWarn(
        fragmentName,
        `Hardcoded colors found in CSS: ${[...new Set(hardcodedHex)].join(", ")}. Use var() tokens.`,
      );
    }
  }

  // D. Rule #4: JS Encapsulation
  const jsPath = path.join(dir, fragJson.jsPath || "index.js");
  if (fs.existsSync(jsPath)) {
    const js = fs.readFileSync(jsPath, "utf8");
    // Matches 'return' not inside a function block {}
    if (
      /^return\s+|[;{]\s*return\s+/m.test(js) &&
      !js.includes("function") &&
      !js.includes("=>")
    ) {
      logError(
        fragmentName,
        `Illegal top-level return statement found in index.js.`,
      );
    }
  }
});

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
