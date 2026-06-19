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
  const collections = globSync('*/collection.json');

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

    // Find fragments in this collection
    const fragments = globSync(`${collectionDir}/fragments/*/fragment.json`);

    if (fragments.length === 0) return;

    // Skip Widget Modifiers as they don't have a useful visual representation
    if (collectionDir.includes('widget-modifiers')) {
      return;
    }

    markdown += `## ${collectionMetadata.name}\n\n`;

    if (collectionMetadata.description) {
      markdown += `${collectionMetadata.description}\n\n`;
    }

    fragments.sort().forEach((fragFile) => {
      const fragDir = path.dirname(fragFile);
      const fragMetadata = JSON.parse(fs.readFileSync(fragFile, 'utf8'));
      const isDeprecated =
        fragMetadata.name &&
        (fragMetadata.name.includes('(Deprecated)') ||
          fragMetadata.name.includes('(DEPRECATED)'));
      if (isDeprecated) {
        return; // Skip deprecated fragments in visual gallery entirely
      }

      // Skip fragments that are explicitly excluded from the gallery (e.g. utility containers)
      const testDataFile = path.join(fragDir, 'test-data.json');
      if (fs.existsSync(testDataFile)) {
        try {
          const testData = JSON.parse(fs.readFileSync(testDataFile, 'utf8'));
          if (testData.excludeFromGallery === true) {
            return;
          }
        } catch (e) {}
      }

      const fragSafeName = path.basename(fragDir);

      markdown += `### ${fragMetadata.name}\n\n`;

      const manualImg = path.join(IMAGES_DIR, `${fragSafeName}.png`);
      const viewports = ['desktop', 'tablet', 'mobile'];
      const liveImages = {};

      if (testsPassed) {
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
            // Fall back to pre-existing live image if this fragment was not run in the current filtered test
            liveImages[vp] = `./images/live/${liveFileName}`;
          }

          if (liveImages[vp]) {
            // Attach visual verification status badge if exists
            if (
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
            }
          }
        });
      }

      let fallbackPath = '';
      if (fs.existsSync(manualImg)) {
        fallbackPath = `./images/${fragSafeName}.png`;
      } else if (fs.existsSync(path.join(fragDir, 'screenshot.png'))) {
        fallbackPath = path
          .relative(DOCS_DIR, path.join(fragDir, 'screenshot.png'))
          .replace(/\\/g, '/');
      }

      if (Object.keys(liveImages).length > 0) {
        if (fallbackPath) {
          markdown += `#### Original Design\n<img src="${fallbackPath}" width="800" alt="Original Image">\n\n`;
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
          markdown += `![${fragMetadata.name}](${fallbackPath})\n\n`;
        } else {
          markdown += `*No image available*\n\n`;
        }
      }

      const docFile = path.join(DOCS_DIR, 'fragments', `${fragSafeName}.md`);
      if (fs.existsSync(docFile)) {
        markdown += `[Detailed Documentation](./fragments/${fragSafeName}.md)\n\n`;
      } else {
        const rootDocFile = path.join(DOCS_DIR, `${fragSafeName}.md`);
        if (fs.existsSync(rootDocFile)) {
          markdown += `[Detailed Documentation](./${fragSafeName}.md)\n\n`;
        }
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
