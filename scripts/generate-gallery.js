const fs = require('fs');
const path = require('path');
const { globSync } = require('glob');

const DOCS_DIR = path.join(process.cwd(), 'docs');
const GALLERY_FILE = path.join(DOCS_DIR, 'gallery.md');
const IMAGES_DIR = path.join(DOCS_DIR, 'images');
const LIVE_IMAGES_DIR = path.join(IMAGES_DIR, 'live');
const SNAPSHOTS_DIR = path.join(process.cwd(), 'e2e-tests', 'snapshots');
const TEST_RESULTS_DIR = path.join(DOCS_DIR, 'test-results');

/**
 * Fragment Gallery Generator Logic
 */
function generateGallery() {
  // 1. Find all collections
  const collections = globSync('*/main/collection.json');

  // Ensure live images directory exists
  if (!fs.existsSync(LIVE_IMAGES_DIR)) {
    fs.mkdirSync(LIVE_IMAGES_DIR, { recursive: true });
  }

  // Load visual verification results if available
  let visualAnalysis = null;
  try {
    const analysisPath = path.join(
      process.cwd(),
      'e2e-tests',
      'visual-analysis.json'
    );
    if (fs.existsSync(analysisPath)) {
      visualAnalysis = JSON.parse(fs.readFileSync(analysisPath, 'utf8'));
    }
  } catch (e) {
    console.warn('[WARN] Could not load visual-analysis.json:', e.message);
  }

  // Determine latest tested version and status
  let testedVersion = 'Unknown';
  let testsPassed = false;

  if (fs.existsSync(TEST_RESULTS_DIR)) {
    const resultFiles = globSync(`${TEST_RESULTS_DIR}/results-*.md`);
    if (resultFiles.length > 0) {
      // Sort by modified time descending to get the latest
      resultFiles.sort(
        (a, b) =>
          fs.statSync(b).mtime.getTime() - fs.statSync(a).mtime.getTime()
      );
      const latestResult = fs.readFileSync(resultFiles[0], 'utf8');

      const versionMatch = latestResult.match(
        /- \*\*Realised Version\*\*: (.*)/
      );
      if (versionMatch) {
        testedVersion = versionMatch[1].trim();
      }

      // Safeguard: Only use snapshots if the test suite completed successfully
      const statusMatch = latestResult.match(/- \*\*Status\*\*: (.*)/);
      if (statusMatch && statusMatch[1].trim() === 'Completed') {
        testsPassed = true;
      }
    }
  }

  let markdown = `# Fragment Visual Gallery\n\nA visual reference for the high-fidelity fragments available in this Liferay DXP repository. Generated automatically.\n\n`;
  markdown += `**Last Tested Against Liferay Version:** \`${testedVersion}\`\n`;
  if (!testsPassed) {
    markdown += `*(Note: Live snapshots disabled due to pending or failed test suite)*\n`;
  }
  markdown += `\n`;

  collections.sort().forEach((collectionFile) => {
    const collectionDir = path.dirname(collectionFile);
    const collectionMetadata = JSON.parse(
      fs.readFileSync(collectionFile, 'utf8')
    );

    // Normalize path separators for globSync on Windows
    const collectionGlobDir = collectionDir.replace(/\\/g, '/');

    // Find fragments in this collection
    const fragments = globSync(`${collectionGlobDir}/*/main/fragment.json`);

    if (fragments.length === 0) return;

    // Skip Widget Modifiers as they don't have a useful visual representation
    if (collectionDir.includes('widget-modifiers')) {
      return;
    }

    const validFragments = [];
    fragments.sort().forEach((fragFile) => {
      const fragDir = path.dirname(fragFile); // main directory
      const fragRoot = path.dirname(fragDir); // fragment root folder
      const fragMetadata = JSON.parse(fs.readFileSync(fragFile, 'utf8'));
      const isDeprecated =
        fragMetadata.name &&
        (fragMetadata.name.includes('(Deprecated)') ||
          fragMetadata.name.includes('(DEPRECATED)'));
      if (isDeprecated) {
        return; // Skip deprecated fragments in visual gallery entirely
      }

      // Skip fragments that are explicitly excluded from the gallery (e.g. utility containers)
      const testDataFile = path.join(fragRoot, 'test', 'test-data.json');
      let testData = null;
      if (fs.existsSync(testDataFile)) {
        try {
          testData = JSON.parse(fs.readFileSync(testDataFile, 'utf8'));
          if (testData.excludeFromGallery === true) {
            return;
          }
        } catch (e) {}
      }
      validFragments.push({ fragFile, fragRoot, fragMetadata, testData });
    });

    if (validFragments.length === 0) return;

    markdown += `## ${collectionMetadata.name}\n\n`;

    if (collectionMetadata.description) {
      markdown += `${collectionMetadata.description}\n\n`;
    }

    validFragments.forEach(({ fragFile, fragRoot, fragMetadata, testData }) => {
      const fragSafeName = path.basename(fragRoot);

      markdown += `### ${fragMetadata.name}\n\n`;

      if (testData) {
        const getCustomFragmentRequirements = (data, ownKey) => {
          if (!data || !data.pageLayout) return [];
          const requirements = new Set();
          const traverse = (node) => {
            if (!node) return;
            // Traverse nested definitions if type Section, Row, Column, etc.
            if (node.key && node.key !== ownKey) {
              let typeName = node.type || 'Fragment';
              let displayName = node.key;
              if (
                node.key === 'BASIC_COMPONENT-html' ||
                node.key === 'rich-text'
              ) {
                displayName = 'HTML (System Component)';
              } else if (
                node.key ===
                'com.liferay.fragment.renderer.menu.display.internal.MenuDisplayFragmentRenderer'
              ) {
                displayName = 'Menu Display (System Component)';
              }
              requirements.add(`${typeName}: \`${displayName}\``);
            }
            if (node.children && Array.isArray(node.children)) {
              node.children.forEach(traverse);
            }
            if (node.pageElements && Array.isArray(node.pageElements)) {
              node.pageElements.forEach(traverse);
            }
            // Check form container definitions/layout definitions
            if (node.definition) {
              if (
                node.definition.formContainerConfig &&
                node.definition.formContainerConfig.formContainerReference
              ) {
                const className =
                  node.definition.formContainerConfig.formContainerReference
                    .className;
                requirements.add(`Form Target: \`${className}\``);
              }
              if (
                node.definition.formConfig &&
                node.definition.formConfig.formReference
              ) {
                const className =
                  node.definition.formConfig.formReference.className;
                requirements.add(`Form Target: \`${className}\``);
              }
            }
          };
          traverse(data.pageLayout);
          return Array.from(requirements).sort();
        };

        const reqs = getCustomFragmentRequirements(
          testData,
          fragMetadata.key || fragSafeName
        );
        if (reqs.length > 0) {
          markdown += `**Snapshot Prerequisites / Layout Components:**\n`;
          reqs.forEach((r) => {
            markdown += `- ${r}\n`;
          });
          markdown += `\n`;
        }
      }

      const manualImg = path.join(IMAGES_DIR, `${fragSafeName}.png`);
      const viewports = ['desktop', 'tablet', 'mobile'];
      const liveImages = {};

      const safeCollectionName = collectionMetadata.name
        .replace(/[^a-z0-9]+/gi, '-')
        .toLowerCase();
      const safeFragmentName = fragMetadata.name
        .replace(/[^a-z0-9]+/gi, '-')
        .toLowerCase();

      viewports.forEach((vp) => {
        const liveFileName = `${safeCollectionName}-${safeFragmentName}-${vp}.png`;
        const liveDest = path.join(LIVE_IMAGES_DIR, liveFileName);
        const e2eSnapshot = path.join(
          SNAPSHOTS_DIR,
          collectionMetadata.name,
          `${fragMetadata.name}-${vp}.png`
        );

        if (fs.existsSync(e2eSnapshot)) {
          fs.copyFileSync(e2eSnapshot, liveDest);
          liveImages[vp] = `./images/live/${liveFileName}`;
        } else if (fs.existsSync(liveDest)) {
          liveImages[vp] = `./images/live/${liveFileName}`;
        }

        if (liveImages[vp]) {
          const fsPath = path.resolve(
            process.cwd(),
            'docs',
            liveImages[vp].replace(/^\.\//, '')
          );
          let is404 = false;
          if (fs.existsSync(fsPath)) {
            const size = fs.statSync(fsPath).size;
            if (
              [8736, 9822, 19110, 18252, 21912, 10367, 32360].includes(size)
            ) {
              is404 = true;
            }
          }

          // Check corresponding HTML file in snapshots for 404 markers
          const e2eHtml = e2eSnapshot.replace('.png', '.html');
          if (!is404 && fs.existsSync(e2eHtml)) {
            try {
              const htmlContent = fs.readFileSync(e2eHtml, 'utf8');
              if (
                htmlContent.includes('Page Not Found') ||
                htmlContent.includes('Page not found') ||
                htmlContent.includes('404 - Page Not Found')
              ) {
                is404 = true;
              }
            } catch (err) {
              console.warn(
                `[WARN] Failed to read HTML file ${e2eHtml}:`,
                err.message
              );
            }
          }

          if (is404) {
            liveImages[vp + '_status'] = '<br>🔴 **Failed (404 Page)**';
          } else if (
            visualAnalysis &&
            visualAnalysis.results &&
            visualAnalysis.results[liveFileName]
          ) {
            const analysisResult = visualAnalysis.results[liveFileName];
            if (analysisResult.status === 'anomaly') {
              liveImages[vp + '_status'] = '<br>⚠️ **Blank/Solid Color**';
            } else if (analysisResult.status === 'regression') {
              const diffFileName = `${safeCollectionName}-${safeFragmentName}-${vp}-diff.png`;
              liveImages[vp + '_status'] =
                `<br>❌ **Diff: ${analysisResult.diffPercentage.toFixed(1)}%**<br>[View Diff](./images/diffs/${diffFileName})`;
            } else {
              liveImages[vp + '_status'] = '<br>🟢 **Passed**';
            }
          } else if (fs.existsSync(fsPath)) {
            liveImages[vp + '_status'] = '<br>🟢 **Passed**';
          } else {
            liveImages[vp + '_status'] = '<br>⚠️ **Unverified**';
          }
        }
      });

      let fallbackPath = '';
      if (fs.existsSync(manualImg)) {
        fallbackPath = `./images/${fragSafeName}.png`;
      } else if (fs.existsSync(path.join(fragRoot, 'screenshot.png'))) {
        fallbackPath = path
          .relative(DOCS_DIR, path.join(fragRoot, 'screenshot.png'))
          .replace(/\\/g, '/');
      }

      if (Object.keys(liveImages).length > 0) {
        if (fallbackPath) {
          markdown += `#### Original Design\n<img src="${fallbackPath}" width="350" alt="Original Image">\n\n`;
        }
        if (liveImages.desktop) {
          const status = liveImages.desktop_status || '';
          markdown += `#### Desktop (1920px) ${status}\n<img src="${liveImages.desktop}" width="100%" alt="Desktop">\n\n`;
        }

        if (liveImages.tablet || liveImages.mobile) {
          markdown += `| Tablet (768px) | Mobile (375px) |\n| :---: | :---: |\n|`;
          if (liveImages.tablet) {
            const status = liveImages.tablet_status || '';
            markdown += ` <img src="${liveImages.tablet}" width="350" alt="Tablet">${status} |`;
          } else {
            markdown += ` N/A |`;
          }
          if (liveImages.mobile) {
            const status = liveImages.mobile_status || '';
            markdown += ` <img src="${liveImages.mobile}" width="175" alt="Mobile">${status} |\n\n`;
          } else {
            markdown += ` N/A |\n\n`;
          }
        }
      } else {
        if (fallbackPath) {
          markdown += `<img src="${fallbackPath}" width="350" alt="${fragMetadata.name}">\n\n`;
        } else {
          markdown += `*No image available*\n\n`;
        }
      }

      const docFile1 = path.join(DOCS_DIR, 'fragments', `${fragSafeName}.md`);
      const docFile2 = path.join(
        DOCS_DIR,
        'fragments',
        `${safeFragmentName}.md`
      );
      const rootDocFile1 = path.join(DOCS_DIR, `${fragSafeName}.md`);
      const rootDocFile2 = path.join(DOCS_DIR, `${safeFragmentName}.md`);

      if (fs.existsSync(docFile1)) {
        markdown += `[Detailed Documentation](./fragments/${fragSafeName}.md)\n\n`;
      } else if (fs.existsSync(docFile2)) {
        markdown += `[Detailed Documentation](./fragments/${safeFragmentName}.md)\n\n`;
      } else if (fs.existsSync(rootDocFile1)) {
        markdown += `[Detailed Documentation](./${fragSafeName}.md)\n\n`;
      } else if (fs.existsSync(rootDocFile2)) {
        markdown += `[Detailed Documentation](./${safeFragmentName}.md)\n\n`;
      } else {
        console.warn(
          `[WARN] No documentation file found for fragment: ${fragMetadata.name} in gallery`
        );
      }

      markdown += `--- \n\n`;
    });
  });

  return markdown.trim() + '\n';
}

// If run directly
if (require.main === module) {
  const content = generateGallery();
  fs.writeFileSync(GALLERY_FILE, content);
  console.log(`Successfully generated gallery at: ${GALLERY_FILE}`);
}

module.exports = { generateGallery };
