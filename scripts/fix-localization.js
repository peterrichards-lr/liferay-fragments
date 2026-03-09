const fs = require("fs");
const path = require("path");
const { globSync } = require("glob");

// --- UTILS ---
const parseProps = (filePath) => {
  if (!fs.existsSync(filePath)) return new Map();
  const content = fs.readFileSync(filePath, "utf8");
  const lines = content.split("\n");
  const props = new Map();
  lines.forEach((line) => {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) props.set(match[1].trim(), match[2].trim());
  });
  return props;
};

const writeProps = (filePath, propsMap) => {
  const sortedKeys = Array.from(propsMap.keys()).sort();
  const content =
    sortedKeys.map((k) => `${k}=${propsMap.get(k)}`).join("\n") + "\n";
  fs.writeFileSync(filePath, content, "utf8");
};

const formatKey = (key) => {
  // Convert lfr.category.field-name to "Field Name"
  const parts = key.split(".");
  const lastPart = parts[parts.length - 1];
  return lastPart
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

// --- MAIN ---
const fragmentFiles = globSync("**/fragment.json", {
  ignore: "node_modules/**",
});
let totalFixed = 0;

fragmentFiles.forEach((file) => {
  const dir = path.dirname(file);
  const configPath = path.join(dir, "configuration.json");
  const propPath = path.join(dir, "Language_en_US.properties");

  if (!fs.existsSync(configPath)) return;

  try {
    const config = JSON.parse(fs.readFileSync(configPath, "utf8"));
    let props = parseProps(propPath);
    let changed = false;

    const addKey = (key) => {
      if (key && key.includes(".") && !props.has(key)) {
        props.set(key, formatKey(key));
        changed = true;
        totalFixed++;
      }
    };

    config.fieldSets?.forEach((set) => {
      addKey(set.label);
      set.fields?.forEach((field) => {
        addKey(field.label);
        addKey(field.description);
      });
    });

    if (changed) {
      console.log(`Updating localization for: ${path.basename(dir)}`);
      writeProps(propPath, props);
    }
  } catch (e) {
    console.error(`Error processing ${dir}: ${e.message}`);
  }
});

console.log(`\nSuccessfully added ${totalFixed} missing localization keys.`);
