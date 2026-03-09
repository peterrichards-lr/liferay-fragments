const fs = require("fs");
const path = require("path");
const { globSync } = require("glob");

/**
 * Initialize fragment-build.json for all fragments.
 * Intelligently detects required shared resources.
 */

const fragments = globSync("**/fragment.json", { ignore: "node_modules/**" });

fragments.forEach((fragFile) => {
  const dir = path.dirname(fragFile);
  const buildFile = path.join(dir, "fragment-build.json");
  const jsFile = path.join(dir, "index.js");

  // Default config
  const config = {
    sharedResources: [],
    themeStrategy: "generic",
  };

  if (fs.existsSync(jsFile)) {
    const js = fs.readFileSync(jsFile, "utf8");

    // Detect dependencies
    if (js.includes("isValidIdentifier"))
      config.sharedResources.push("validation.js");
    if (js.includes("getLocalizedValue"))
      config.sharedResources.push("localization.js");
    if (js.includes("resolveObjectPath")) {
      // Discovery depends on validation, but we can list both for clarity or just discovery
      config.sharedResources.push("discovery.js");
      if (!config.sharedResources.includes("validation.js")) {
        config.sharedResources.push("validation.js");
      }
    }
  }

  // Deduplicate and sort
  config.sharedResources = [...new Set(config.sharedResources)].sort();

  if (!fs.existsSync(buildFile)) {
    console.log(`Creating fragment-build.json for: ${path.basename(dir)}`);
    fs.writeFileSync(buildFile, JSON.stringify(config, null, 2));
  } else {
    // Update existing ones to the new modular names if they were using commons.js
    const existing = JSON.parse(fs.readFileSync(buildFile, "utf8"));
    if (existing.sharedResources.includes("commons.js")) {
      console.log(`Updating modular dependencies for: ${path.basename(dir)}`);
      existing.sharedResources = config.sharedResources;
      fs.writeFileSync(buildFile, JSON.stringify(existing, null, 2));
    }
  }
});

console.log("\nBuild configuration initialization complete.");
