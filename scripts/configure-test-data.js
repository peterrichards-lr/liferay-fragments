const fs = require('fs');
const path = require('path');
const { globSync } = require('glob');

const projectRoot = path.join(__dirname, '..');

// 1. Utilities (Exclude from Gallery)
const utilityFragments = [
  'form-populator',
  'form-session-id',
  'generate-form-session-id',
  'redirect-page',
  'refresh-page',
  'campaign-initialiser',
  'cookie-sniffer',
  'custom-event-listener',
  'hide-control-menu',
  'trigger-ray',
  'populate-select',
  'store-default-value',
  'store-form-field-values',
  'text-derived-value',
  'hidden-relationship',
  'url-populated-hidden-relationship',
  'alerts-modifier',
  'ping',
  'who-am-i',
  'tracker',
  'tracker-step',
];

// 2. Semantic Mappings for Containers
const mappings = {
  header: {
    fragments: [
      'upper-header-layout',
      'lower-header-layout',
      'responsive-menu',
      'responsive-side-menu',
      'logo-zone',
    ],
    children: [
      { type: 'Fragment', key: 'logo' },
      { type: 'Fragment', key: 'site-name' },
      { type: 'Fragment', key: 'login-and-user-menu' }, // pragma: allowlist secret
    ],
  },
  form: {
    fragments: [
      'customer-registration',
      'interactive-wizard',
      'masthead-call-to-action-form-header',
      'meta-object-form',
      'aura-scoped-container',
      'signature-pad',
    ],
    children: [
      {
        type: 'Fragment',
        key: 'user-field',
        fragmentConfig: { label: 'Full Name', fieldName: 'name' },
      },
      {
        type: 'Fragment',
        key: 'signature-pad',
        fragmentConfig: { label: 'Signature', fieldName: 'signature' },
      },
      { type: 'Fragment', key: 'submit-button' },
    ],
  },
  dashboard: {
    fragments: [
      'dashboard-container',
      'meta-object-table',
      'interactive-event-timeline',
    ],
    children: [
      {
        type: 'Fragment',
        key: 'radial-kpi-gauge', // pragma: allowlist secret
        fragmentConfig: { title: 'Completion Rate', value: '85%' },
      },
      { type: 'Fragment', key: 'activity-heatmap' }, // pragma: allowlist secret
    ],
  },
  general: {
    // Default for any container not caught by the above (e.g., zone-layout, overlay-background, linear-gradient)
    children: [
      {
        type: 'Fragment',
        key: 'rich-text',
        fragmentFields: [
          {
            id: 'text',
            value: {
              text: {
                value_i18n: {
                  en_US:
                    '<div class="text-center"><img src="https://images.unsplash.com/photo-1506744038136-46273834b3fb?q=80&w=400&auto=format&fit=crop" style="max-width:100%; border-radius:8px;" /><h3 class="mt-3">Showcase Content</h3><p>This is semantic content dropped into a container to demonstrate layout and transparency.</p></div>',
                },
              },
            },
          },
        ],
      },
    ],
  },
};

const fragmentFiles = globSync('**/fragment.json', {
  cwd: projectRoot,
  absolute: true,
  ignore: [
    '**/node_modules/**',
    '**/e2e-tests/**',
    '**/zips/**',
    '**/temp*/**',
  ],
});

let updatedCount = 0;

fragmentFiles.forEach((file) => {
  const dir = path.dirname(file);
  const fragmentData = JSON.parse(fs.readFileSync(file, 'utf8'));
  const fragmentKey = fragmentData.key || path.basename(dir);

  const testDataFile = path.join(dir, 'test-data.json');
  let testData = {};
  if (fs.existsSync(testDataFile)) {
    try {
      testData = JSON.parse(fs.readFileSync(testDataFile, 'utf8'));
    } catch (e) {}
  }

  let modified = false;

  // 1. Check for Utility Exclusion
  if (utilityFragments.includes(fragmentKey) && !testData.excludeFromGallery) {
    testData.excludeFromGallery = true;
    modified = true;
    console.log(`[Utility] Marked ${fragmentKey} for exclusion.`);
  }

  // 1.1 Check for Deprecated Exclusion
  const isDeprecated =
    fragmentData.name &&
    (fragmentData.name.includes('(Deprecated)') ||
      fragmentData.name.includes('(DEPRECATED)'));
  if (isDeprecated && !testData.excludeFromGallery) {
    testData.excludeFromGallery = true;
    modified = true;
    console.log(`[Deprecated] Marked ${fragmentKey} for exclusion.`);
  }

  // Determine the nearest collection
  let collectionDir = '';
  let currentDir = dir;
  while (currentDir !== '..' && currentDir !== '/' && currentDir !== '.') {
    const collectionFile = path.join(currentDir, 'collection.json');
    if (fs.existsSync(collectionFile)) {
      collectionDir = currentDir;
      break;
    }
    const parent = path.dirname(currentDir);
    if (parent === currentDir) break;
    currentDir = parent;
  }

  // 2. Identify and Process Containers
  const htmlFile = path.join(dir, 'index.html');
  const ftlFile = path.join(dir, 'index.ftl');
  let templateContent = '';
  if (fs.existsSync(htmlFile))
    templateContent = fs.readFileSync(htmlFile, 'utf8');
  else if (fs.existsSync(ftlFile))
    templateContent = fs.readFileSync(ftlFile, 'utf8');

  const isContainer =
    templateContent.includes('lfr-drop-zone') ||
    templateContent.includes('lfr-widget-');

  const isCommerce = collectionDir && collectionDir.includes('commerce');

  if ((isContainer || isCommerce) && !utilityFragments.includes(fragmentKey)) {
    let targetChildren = mappings.general.children;

    if (mappings.header.fragments.includes(fragmentKey))
      targetChildren = mappings.header.children;
    else if (mappings.form.fragments.includes(fragmentKey))
      targetChildren = mappings.form.children;
    else if (mappings.dashboard.fragments.includes(fragmentKey))
      targetChildren = mappings.dashboard.children;

    if (isCommerce) {
      targetChildren = [
        { type: 'Fragment', key: 'account-selector' },
        ...targetChildren,
      ];
    }

    // We overwrite the generic stat-card layout or add the new layout if none exists
    const currentLayoutString = testData.pageLayout
      ? JSON.stringify(testData.pageLayout)
      : ''; // pragma: allowlist secret
    const newLayout = {
      type: 'Fragment',
      key: fragmentKey,
      children: targetChildren,
    };
    const newLayoutString = JSON.stringify(newLayout); // pragma: allowlist secret

    if (currentLayoutString !== newLayoutString) {
      testData.pageLayout = newLayout;
      modified = true;
      console.log(
        `[Container] Applied semantic layout tree to ${fragmentKey}.`
      );
    }
  }

  if (modified) {
    fs.writeFileSync(testDataFile, JSON.stringify(testData, null, 2));
    updatedCount++;
  }
});

console.log(
  `\nFinished updating. Modified ${updatedCount} test-data.json files.`
);
