const fs = require("fs");
const path = require("path");

const collection = process.argv[2];
const fragmentName = process.argv[3];

if (!collection || !fragmentName) {
  console.error(
    'Usage: npm run create-fragment "[Collection Name]" "[Fragment Name]"',
  );
  process.exit(1);
}

const safeName = fragmentName.toLowerCase().replace(/\s+/g, "-");
const targetDir = path.join(process.cwd(), collection, "fragments", safeName);

if (fs.existsSync(targetDir)) {
  console.error(`Error: Fragment directory already exists at ${targetDir}`);
  process.exit(1);
}

// --- BOILERPLATE GENERATORS ---

const fragmentJson = {
  configurationPath: "configuration.json",
  jsPath: "index.js",
  htmlPath: "index.html",
  cssPath: "index.css",
  icon: "component",
  name: fragmentName,
  type: "component",
  thumbnailPath: "thumbnail.png",
};

const configurationJson = {
  fieldSets: [
    {
      fields: [
        {
          label: `lfr.${safeName}.title`,
          name: "title",
          type: "text",
          defaultValue: fragmentName,
        },
      ],
      label: `lfr.${safeName}.general`,
    },
  ],
};

const indexHtml = `
<div class="${safeName}-fragment" data-layout-mode="\${layoutMode}">
    <div class="container-fluid">
        <h2 data-lfr-editable-id="title" data-lfr-editable-type="text">
            \${configuration.title!}
        </h2>
        
        <p>New high-fidelity fragment initialized.</p>
    </div>
</div>
`;

const indexJs = `
const init${fragmentName.replace(/\s+/g, "")} = () => {
    console.info("[Fragment] ${fragmentName} Initialized.");
    
    // Use fragmentElement.querySelector for scoped selection
    const title = fragmentElement.querySelector('h2');
    
    if (title) {
        // Logic goes here
    }
};

init${fragmentName.replace(/\s+/g, "")}();
`;

const indexCss = `
.${safeName}-fragment {
    padding: var(--spacer-4, 1.5rem);
    background-color: var(--body-bg, #fff);
    color: var(--body-color, #272833);
    border-radius: var(--border-radius, 0.25rem);
}

.${safeName}-fragment h2 {
    color: var(--primary);
    margin-bottom: var(--spacer-3, 1rem);
}
`;

const languageProps = `
lfr.${safeName}.general=General
lfr.${safeName}.title=Title
`;

// --- EXECUTION ---

console.log(
  `Creating fragment "${fragmentName}" in collection "${collection}"...`,
);

fs.mkdirSync(targetDir, { recursive: true });
fs.mkdirSync(path.join(targetDir, "test"), { recursive: true });

fs.writeFileSync(
  path.join(targetDir, "fragment.json"),
  JSON.stringify(fragmentJson, null, 2),
);
fs.writeFileSync(
  path.join(targetDir, "configuration.json"),
  JSON.stringify(configurationJson, null, 2),
);
fs.writeFileSync(path.join(targetDir, "index.html"), indexHtml.trim());
fs.writeFileSync(path.join(targetDir, "index.js"), indexJs.trim());
fs.writeFileSync(path.join(targetDir, "index.css"), indexCss.trim());
fs.writeFileSync(
  path.join(targetDir, "Language_en_US.properties"),
  languageProps.trim(),
);

// Create dummy metadata for test-bed
const testMetadata = {
  theme: "meridian",
  thumbnailSelector: `.${safeName}-fragment`,
  screenshotSelector: "body",
};
fs.writeFileSync(
  path.join(targetDir, "test/metadata.json"),
  JSON.stringify(testMetadata, null, 2),
);

console.log(`\nSuccessfully created fragment at: ${targetDir}`);
console.log(`Next steps:`);
console.log(`1. Add logic to index.js`);
console.log(`2. Style the component in index.css`);
console.log(`3. Run "npm run lint" to verify compliance.`);
