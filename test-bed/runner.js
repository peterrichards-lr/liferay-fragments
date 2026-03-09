const fs = require("fs");
const path = require("path");
const https = require("https");
const { chromium } = require("playwright");

/**
 * Fragment Test-Bed Runner
 * Usage: node test-bed/runner.js [fragment-path] [mode] [theme]
 */

let fragmentPath = process.argv[2];
let layoutMode = process.argv[3] || "view";
let themeName = process.argv[4];

if (!fragmentPath || !fs.existsSync(fragmentPath)) {
  console.error("Please provide a valid fragment path.");
  process.exit(1);
}

// Setup logging
const fragmentSafeName = fragmentPath.replace(/\//g, "_");
const logFile = path.resolve(__dirname, `logs/${fragmentSafeName}.log`);
fs.writeFileSync(logFile, `--- Log for ${fragmentPath} ---\n\n`);

function logToDisk(msg) {
  fs.appendFileSync(logFile, msg + "\n");
}

const metadataPath = path.join(fragmentPath, "test/metadata.json");
let metadata = {};
if (fs.existsSync(metadataPath)) {
  try {
    metadata = JSON.parse(fs.readFileSync(metadataPath, "utf8"));
    if (metadata.theme && !themeName) themeName = metadata.theme;
  } catch (e) {}
}

themeName = themeName || "meridian";

const mocksPath = path.resolve(__dirname, "mocks.js");
const mocksJs = fs.readFileSync(mocksPath, "utf8");

const themePath = path.resolve(__dirname, `themes/${themeName}.css`);
let themeCss = fs.existsSync(themePath)
  ? fs.readFileSync(themePath, "utf8")
  : "";

const SPRITEMAP_URL =
  "https://unpkg.com/clay-css@2.10.1/lib/images/lexicon/icons.svg";

function getSpritemap() {
  return new Promise((resolve) => {
    https
      .get(SPRITEMAP_URL, (res) => {
        let data = "";
        res.on("data", (chunk) => {
          data += chunk;
        });
        res.on("end", () => {
          resolve(data);
        });
      })
      .on("error", (e) => {
        console.error(`Failed to fetch spritemap: ${e.message}`);
        resolve("");
      });
  });
}

async function run() {
  const spritemapSvg = await getSpritemap();
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1200, height: 800 },
  });
  const page = await context.newPage();

  page.on("console", (msg) => {
    const text = `[Browser ${msg.type()}] ${msg.text()}`;
    console.log(text);
    logToDisk(text);
  });

  page.on("pageerror", (err) => {
    const text = `[Browser Error] ${err.message}`;
    console.error(text);
    logToDisk(text);
  });

  let htmlPath = fs.existsSync(path.join(fragmentPath, "index.html"))
    ? path.join(fragmentPath, "index.html")
    : path.join(fragmentPath, "index.ftl");
  const jsPath = path.join(fragmentPath, "index.js");
  const cssPath = path.join(fragmentPath, "index.css");
  const configPath = path.join(fragmentPath, "configuration.json");
  const fragPath = path.join(fragmentPath, "fragment.json");
  const testConfigPath = path.join(fragmentPath, "test/configuration.json");
  const testDataPath = path.join(fragmentPath, "test/data.json");
  const testCssPath = path.join(fragmentPath, "test/index.css");

  let html = fs.existsSync(htmlPath) ? fs.readFileSync(htmlPath, "utf8") : "";
  let js = fs.existsSync(jsPath) ? fs.readFileSync(jsPath, "utf8") : "";
  let css = fs.existsSync(cssPath) ? fs.readFileSync(cssPath, "utf8") : "";
  let testCss = fs.existsSync(testCssPath)
    ? fs.readFileSync(testCssPath, "utf8")
    : "";
  let config = {};
  let mockData = null;
  let fragmentName = "Fragment";

  if (fs.existsSync(fragPath)) {
    try {
      fragmentName =
        JSON.parse(fs.readFileSync(fragPath, "utf8")).name || fragmentName;
    } catch (e) {}
  }

  if (fs.existsSync(configPath)) {
    try {
      const configJson = JSON.parse(fs.readFileSync(configPath, "utf8"));
      configJson.fieldSets?.forEach((set) =>
        set.fields.forEach((f) => {
          if (f.defaultValue !== undefined) config[f.name] = f.defaultValue;
        }),
      );
    } catch (e) {}
  }

  if (fs.existsSync(testConfigPath)) {
    try {
      config = {
        ...config,
        ...JSON.parse(fs.readFileSync(testConfigPath, "utf8")),
      };
    } catch (e) {}
  }

  if (fs.existsSync(testDataPath)) {
    try {
      mockData = JSON.parse(fs.readFileSync(testDataPath, "utf8"));
    } catch (e) {}
  }

  // --- BUILD METADATA EMULATION ---
  const fragBuildFile = path.join(fragmentPath, "fragment-build.json");
  if (fs.existsSync(fragBuildFile)) {
    try {
      const buildConfig = JSON.parse(fs.readFileSync(fragBuildFile, "utf8"));
      const sharedLogicRoot = path.resolve(__dirname, "../shared-logic");

      if (buildConfig.sharedResources) {
        let concatenatedLogic = "";
        buildConfig.sharedResources.forEach((res) => {
          if (res.endsWith(".js")) {
            const resPath = path.join(sharedLogicRoot, res);
            if (fs.existsSync(resPath)) {
              console.log(`[Runner] Emulating build: prepending ${res}`);
              concatenatedLogic += fs.readFileSync(resPath, "utf8") + "\n";
            }
          }
        });
        js = concatenatedLogic + js;
      }
    } catch (e) {
      console.warn(`[Runner] Error parsing fragment-build.json: ${e.message}`);
    }
  }

  // --- IMPROVED FREE MARKER PRE-PROCESSOR ---

  const input = {
    label: "Mock Label",
    name: "mockInput",
    value: "Mock Value",
    showLabel: true,
    required: true,
    errorMessage: "",
    showHelpText: true,
    helpText: "Mock help text for testing form field layout.",
    attributes: { readOnly: false },
  };

  const resolveVar = (pathStr) => {
    if (pathStr.startsWith("configuration."))
      return config[pathStr.split(".")[1]];
    if (pathStr.startsWith("input.")) {
      const parts = pathStr.split(".");
      if (parts.length === 3) return input[parts[1]][parts[2]];
      return input[parts[1]];
    }
    if (pathStr === "layoutMode") return layoutMode;
    if (
      pathStr === "fragmentNamespace" ||
      pathStr === "fragmentEntryLinkNamespace"
    )
      return "test_ns";
    if (pathStr === "fragmentName") return fragmentName;
    return undefined;
  };

  html = html.replace(
    /\$\{([^}!]+)(?:!([^}]*))?\}/g,
    (match, pathStr, defaultVal) => {
      const val = resolveVar(pathStr.trim());
      if (val !== undefined && val !== null) return val;
      return (defaultVal || "").replace(/^['"](.*)['"]$/, "$1").trim();
    },
  );

  html = html.replace(
    /\$\{htmlUtil\.escape\(([^)]+)\)\}/g,
    (match, pathStr) => {
      const val = resolveVar(pathStr.trim());
      return val
        ? String(val).replace(
            /[&<>"']/g,
            (m) =>
              ({
                "&": "&amp;",
                "<": "&lt;",
                ">": "&gt;",
                '"': "&quot;",
                "'": "&#39;",
              })[m],
          )
        : "";
    },
  );

  html = html.replace(/\$\{languageUtil\.get\([^)]+\)\}/g, "Translated String");
  html = html
    .replace(/\$\{siteSpritemap\}/g, "#")
    .replace(
      /\$\{siteLogo\}/g,
      "https://www.liferay.com/documents/10182/0/Liferay+Logo/63620164-6362-4362-8362-636201646362",
    );

  html = html.replace(
    /\$\{([^?]+)\?then\('([^']*)',\s*'([^']*)'\)\}/g,
    (m, pathStr, p2, p3) => {
      const val = resolveVar(pathStr.trim());
      return val ? p2 : p3;
    },
  );

  html = html.replace(
    /\[#if\s+([^\]]+)\]([\s\S]*?)(\[#else\]([\s\S]*?))?\[\/#if\]/g,
    (m, conditionStr, body, elsePart, elseBody) => {
      const parts = conditionStr.trim().split(/\s+/);
      let condition = false;
      const val = resolveVar(parts[0]);

      if (parts.length === 1) condition = !!val;
      else if (parts[1] === "==" && parts[2])
        condition = val === parts[2].replace(/^['"](.*)['"]$/, "$1");
      else if (parts[1] === "has_content") condition = !!val;

      if (condition) return body;
      return elseBody || "";
    },
  );

  if (mockData) {
    html = html.replace(
      /(<[^>]*data-lfr-editable-id="([^"]*)"[^>]*>)([\s\S]*?)(<\/[^>]*>)/g,
      (m, o, id, c, cl) => (mockData[id] ? o + mockData[id] + cl : m),
    );
  }

  html = html.replace(
    /(?:xlink:)?href=['"][^'"]*#([^'"]*)['"]/g,
    'xlink:href="#$1"',
  );
  html = html.replace(
    /\[@clay\["icon"\] symbol="([^"]*)" \/\]/g,
    '<svg class="lexicon-icon"><use xlink:href="#$1"></use></svg>',
  );
  html = html
    .replace(/\[#attempt\].*?\[#recover\]/gs, "")
    .replace(/\[#assign[^\]]*\]/g, "")
    .replace(/\[#if [^\]]*\]/g, "")
    .replace(/\[\/#if\]/g, "")
    .replace(/\[#list [^\]]*\]/g, "")
    .replace(/\[\/#list\]/g, "")
    .replace(/\[#attempt\]/g, "")
    .replace(/\[\/#attempt\]/g, "")
    .replace(/\[#recover\]/g, "")
    .replace(/\[\/#recover\]/g, "");
  html = html.replace(
    /<lfr-drop-zone[^>]*><\/lfr-drop-zone>/g,
    '<div style="border:1px dashed #ccc;padding:10px;">Drop Zone</div>',
  );

  const pageContent = `
    <!DOCTYPE html>
    <html class="${themeName}-theme theme-${themeName}">
    <head>
      <link rel="stylesheet" href="https://unpkg.com/clay-css@2.10.1/lib/css/atlas.css">
      <style>${themeCss}${css}${testCss}</style>
      <style>
        body { padding: 2rem; background: var(--body-bg, #fff); color: var(--body-color, #272833); font-family: var(--font-family-base); }
        #fragment-root { position: relative; min-height: 100px; }
        .loading-animation-squares { display: none !important; }
        .show-quick-actions-on-hover .btn-group { visibility: visible !important; opacity: 1 !important; }
        .form-control { border-radius: var(--border-radius, 0.25rem) !important; border: 1px solid var(--gray-400, #ced4da) !important; padding: 0.375rem 0.75rem !important; height: auto !important; background-color: #fff !important; display: block !important; width: 100% !important; box-shadow: none !important; }
        .form-group label { font-weight: 600; margin-bottom: 0.5rem; color: var(--body-color); display: block; }
        .lexicon-icon { display: inline-block; width: 1em; height: 1em; fill: currentColor; vertical-align: middle; }
        #spritemap-container { display: none; }
      </style>
    </head>
    <body class="${themeName}-theme theme-${themeName} test-bed-active signed-in liferay-custom">
      <div id="spritemap-container">${spritemapSvg}</div>
      <div id="fragment-root" class="liferay-input-container">${html}</div>
      <script>
        ${mocksJs}
        window.themeName="${themeName}"; window.LiferayThemeSpritemap="#";
        window.layoutMode="${layoutMode}"; window.configuration=${JSON.stringify(config)}; window.LiferayMockData=${JSON.stringify(mockData)};
        window.fragmentElement=document.querySelector('#fragment-root'); window.fragmentNamespace="test_ns"; window.fragmentEntryLinkNamespace="test_ns";
        window.input = ${JSON.stringify(input)};
        console.info('[Runner] Environment initialized.');
        try { ${js} } catch(e) { console.error('[Runner] Fragment JS error:', e); }
      </script>
    </body>
    </html>
  `;

  const tempFile = path.resolve(__dirname, "../temp_test_bed/index.html");
  fs.writeFileSync(tempFile, pageContent);
  await page.goto(`file://${tempFile}`);
  await page.waitForTimeout(2000);

  try {
    const sPath = path.join(fragmentPath, "screenshot.png");
    const sEl = await page.$(metadata.screenshotSelector || "body");
    if (sEl) await sEl.screenshot({ path: sPath });
  } catch (e) {}

  try {
    const tPath = path.join(fragmentPath, "thumbnail.png");
    const tEl = await page.$(metadata.thumbnailSelector || "#fragment-root");
    if (tEl) await tEl.screenshot({ path: tPath });
  } catch (e) {}

  await browser.close();
}

run().catch(console.error);
