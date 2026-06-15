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
      { type: 'Fragment', key: 'login-and-user-menu' },
    ],
  },
  form: {
    fragments: [
      'customer-registration',
      'interactive-wizard',
      'masthead-call-to-action-form-header',
      'meta-object-form',
      'aura-scoped-container',
    ],
    children: [
      {
        type: 'Fragment',
        key: 'user-field',
        fragmentConfig: { label: 'Full Name', fieldName: 'name' },
      },
      {
        type: 'Fragment',
        key: 'user-field',
        fragmentConfig: { label: 'Email Address', fieldName: 'email' },
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
        key: 'radial-kpi-gauge',
        fragmentConfig: { title: 'Completion Rate', value: '85%' },
      },
      { type: 'Fragment', key: 'activity-heatmap' },
    ],
  },
  general: {
    // Default for any container not caught by the above (e.g., zone-layout, overlay-background, linear-gradient)
    children: [
      {
        type: 'Fragment',
        key: 'primary-card',
        fragmentConfig: { title: 'Semantic Layout' },
      }, // pragma: allowlist secret
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

  if (isContainer && !utilityFragments.includes(fragmentKey)) {
    let targetChildren = mappings.general.children;

    if (mappings.header.fragments.includes(fragmentKey))
      targetChildren = mappings.header.children;
    else if (mappings.form.fragments.includes(fragmentKey))
      targetChildren = mappings.form.children;
    else if (mappings.dashboard.fragments.includes(fragmentKey))
      targetChildren = mappings.dashboard.children;

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
