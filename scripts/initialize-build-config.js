const fs = require("fs");
const path = require("path");
const { globSync } = require("glob");

/**
 * Initialize fragment-build.json for all fragments.
 * Intelligently detects required shared resources based on code usage.
 */

const fragments = globSync("**/fragment.json", { ignore: "node_modules/**" });

fragments.forEach((fragFile) => {
  const dir = path.dirname(fragFile);
  const buildFile = path.join(dir, "fragment-build.json");
  const jsFile = path.join(dir, "index.js");

  // Base configuration
  let config = {
    sharedResources: [],
    themeStrategy: "generic",
  };

  if (fs.existsSync(buildFile)) {
    config = JSON.parse(fs.readFileSync(buildFile, "utf8"));
  }

  if (fs.existsSync(jsFile)) {
    const js = fs.readFileSync(jsFile, "utf8");

    // 1. Validation
    if (js.includes("isValidIdentifier"))
      config.sharedResources.push("validation.js");

    // 2. Localization
    if (js.includes("getLocalizedValue"))
      config.sharedResources.push("localization.js");

    // 3. Discovery
    if (js.includes("resolveObjectPath")) {
      config.sharedResources.push("discovery.js");
      if (!config.sharedResources.includes("validation.js"))
        config.sharedResources.push("validation.js");
    }

    // 4. Assets
    if (js.includes("loadScript")) config.sharedResources.push("assets.js");
    if (js.includes("loadCSS")) config.sharedResources.push("assets.js");

    // 5. DOM
    if (js.includes("debounce")) config.sharedResources.push("dom.js");
    if (js.includes("getDataAttributes")) config.sharedResources.push("dom.js");
    if (js.includes("getCssVariable")) config.sharedResources.push("dom.js");

    // 6. Storage
    if (js.includes("getCookie") || js.includes("setCookie"))
      config.sharedResources.push("storage.js");

    // 7. Data
    if (js.includes("uuidv4")) config.sharedResources.push("data.js");
    if (js.includes("convertCase")) config.sharedResources.push("data.js");
  }

  // Deduplicate and sort
  config.sharedResources = [...new Set(config.sharedResources)].sort();

  // Remove obsolete "commons.js" if still present
  config.sharedResources = config.sharedResources.filter(
    (r) => r !== "commons.js",
  );

  console.log(`Syncing fragment-build.json for: ${path.basename(dir)}`);
  fs.writeFileSync(buildFile, JSON.stringify(config, null, 2));
});

console.log("\nShared resource dependency sync complete.");
