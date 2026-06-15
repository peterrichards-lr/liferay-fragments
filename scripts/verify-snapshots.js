// scripts/verify-snapshots.js
// Visual verification and regression detection script using Playwright's browser canvas.

const fs = require('fs');
const path = require('path');
const { globSync } = require('glob');
const { chromium } = require('@playwright/test');

const SNAPSHOTS_DIR = path.join(process.cwd(), 'e2e-tests', 'snapshots');
const BASELINES_DIR = path.join(process.cwd(), 'e2e-tests', 'baselines');
const DIFFS_DIR = path.join(process.cwd(), 'e2e-tests', 'diffs');
const LIVE_DIFFS_DIR = path.join(process.cwd(), 'docs', 'images', 'diffs');
const REPORT_FILE = path.join(
  process.cwd(),
  'docs',
  'test-results',
  'visual-regression-report.md'
);
const ANALYSIS_JSON = path.join(
  process.cwd(),
  'e2e-tests',
  'visual-analysis.json'
);

// Thresholds for anomaly/regression detection
const ANOMALY_STD_DEV_THRESHOLD = 3.0; // Under this standard deviation, image is considered solid color
const REGRESSION_PIXEL_DIFF_THRESHOLD_PERCENT = 1.0; // Fail if > 1% pixels are different
const REGRESSION_COLOR_DIFF_THRESHOLD = 15; // RGB channel diff threshold (0-255)

// Helper to make filesystem paths safe for URLs
function getSafeName(name) {
  return name.replace(/[^a-z0-9]+/gi, '-').toLowerCase();
}

/**
 * Copies all snapshots to baselines folder
 */
function updateBaselines() {
  console.log('Promoting current E2E snapshots to baseline references...');
  if (!fs.existsSync(SNAPSHOTS_DIR)) {
    console.error('Error: No snapshots directory found. Run tests first.');
    process.exit(1);
  }

  const snapshots = globSync('**/*.png', { cwd: SNAPSHOTS_DIR });
  if (snapshots.length === 0) {
    console.error('Error: No snapshot images found in e2e-tests/snapshots/');
    process.exit(1);
  }

  snapshots.forEach((file) => {
    const src = path.join(SNAPSHOTS_DIR, file);
    const dest = path.join(BASELINES_DIR, file);
    const destDir = path.dirname(dest);

    if (!fs.existsSync(destDir)) {
      fs.mkdirSync(destDir, { recursive: true });
    }
    fs.copyFileSync(src, dest);
  });

  console.log(
    `Successfully promoted ${snapshots.length} snapshots to baselines in: ${BASELINES_DIR}`
  );
}

/**
 * Main Visual Verification Process
 */
async function verifySnapshots() {
  console.log('Starting visual verification and regression detection...');

  // Ensure output directories exist
  [BASELINES_DIR, DIFFS_DIR, LIVE_DIFFS_DIR, path.dirname(REPORT_FILE)].forEach(
    (dir) => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    }
  );

  // Find all snapshots
  const snapshots = globSync('**/*.png', { cwd: SNAPSHOTS_DIR });
  if (snapshots.length === 0) {
    console.log('No snapshots found to verify. Skipping visual checks.');
    // Write empty results JSON
    fs.writeFileSync(
      ANALYSIS_JSON,
      JSON.stringify(
        {
          timestamp: new Date().toISOString(),
          summary: { total: 0, passed: 0, anomalies: 0, regressions: 0 },
          results: {},
        },
        null,
        2
      )
    );
    return;
  }

  console.log(
    `Found ${snapshots.length} snapshots. Launching headless browser for pixel analysis...`
  );
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  // Go to about:blank to run our canvas code
  await page.goto('about:blank');

  const results = {};
  const summary = {
    total: snapshots.length,
    passed: 0,
    anomalies: 0,
    regressions: 0,
  };

  for (const file of snapshots) {
    // Relative path, e.g. "Aura Design System/Aura - Final CTA Banner-desktop.png"
    // Parts: Collection, Fragment name + viewport
    const pathParts = file.split(/[/\\]/);
    const collection = pathParts[0];
    const filename = pathParts[1];

    // Parse fragment name and viewport from filename
    // e.g. "Aura - Final CTA Banner-desktop.png" -> "Aura - Final CTA Banner" and "desktop"
    const nameMatch = filename.match(/(.+)-(desktop|tablet|mobile)\.png$/);
    if (!nameMatch) {
      console.warn(`[WARN] Skipping file with unexpected name format: ${file}`);
      continue;
    }
    const fragmentName = nameMatch[1];
    const viewport = nameMatch[2];

    const snapshotPath = path.join(SNAPSHOTS_DIR, file);
    const baselinePath = path.join(BASELINES_DIR, file);

    const safeCollection = getSafeName(collection);
    const safeFragment = getSafeName(fragmentName);
    const liveFileName = `${safeCollection}-${safeFragment}-${viewport}.png`;
    const diffFileName = `${safeCollection}-${safeFragment}-${viewport}-diff.png`;
    const diffDestPath = path.join(LIVE_DIFFS_DIR, diffFileName);

    // Read snapshot image
    const snapshotBuffer = fs.readFileSync(snapshotPath);
    const snapshotBase64 = snapshotBuffer.toString('base64');
    const fileSize = snapshotBuffer.length;

    const fileResult = {
      collection,
      fragment: fragmentName,
      viewport,
      status: 'passed',
      issues: [],
      diffPercentage: 0,
      hasDiffImage: false,
      fileSize,
    };

    // 1. Check for basic size anomaly (very small file sizes usually mean empty or broken images)
    if (fileSize < 1000) {
      fileResult.issues.push(`Extremely small file size (${fileSize} bytes)`);
      fileResult.status = 'anomaly';
    }

    // 2. Perform pixel-level anomaly checks in the browser
    try {
      const anomalyAnalysis = await page.evaluate(
        async ({ imgBase64, stdDevThreshold }) => {
          const loadImage = (base64) =>
            new Promise((resolve, reject) => {
              const img = new Image();
              img.onload = () => resolve(img);
              img.onerror = (e) =>
                reject(new Error('Failed to load image: ' + e.message));
              img.src = 'data:image/png;base64,' + base64;
            });

          try {
            const img = await loadImage(imgBase64);
            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0);

            const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const data = imgData.data;
            const totalPixels = canvas.width * canvas.height;

            let sumR = 0,
              sumG = 0,
              sumB = 0,
              sumA = 0;
            for (let i = 0; i < data.length; i += 4) {
              sumR += data[i];
              sumG += data[i + 1];
              sumB += data[i + 2];
              sumA += data[i + 3];
            }

            const meanR = sumR / totalPixels;
            const meanG = sumG / totalPixels;
            const meanB = sumB / totalPixels;
            const meanA = sumA / totalPixels;

            let varSumR = 0,
              varSumG = 0,
              varSumB = 0,
              varSumA = 0;
            const uniqueColors = new Set();

            for (let i = 0; i < data.length; i += 4) {
              const r = data[i];
              const g = data[i + 1];
              const b = data[i + 2];
              const a = data[i + 3];

              varSumR += (r - meanR) ** 2;
              varSumG += (g - meanG) ** 2;
              varSumB += (b - meanB) ** 2;
              varSumA += (a - meanA) ** 2;

              if (uniqueColors.size < 50) {
                uniqueColors.add((r << 16) | (g << 8) | b);
              }
            }

            const stdDevR = Math.sqrt(varSumR / totalPixels);
            const stdDevG = Math.sqrt(varSumG / totalPixels);
            const stdDevB = Math.sqrt(varSumB / totalPixels);
            const stdDevA = Math.sqrt(varSumA / totalPixels);

            const isTransparent = meanA < 5;
            // An image is solid color if variance in colors is extremely low or unique color count is very low
            const isSolidColor =
              (stdDevR < stdDevThreshold &&
                stdDevG < stdDevThreshold &&
                stdDevB < stdDevThreshold) ||
              uniqueColors.size <= 1;

            return {
              width: img.width,
              height: img.height,
              isTransparent,
              isSolidColor,
              uniqueColorsCount: uniqueColors.size,
              stdDevR,
              stdDevG,
              stdDevB,
            };
          } catch (e) {
            return { error: e.message };
          }
        },
        {
          imgBase64: snapshotBase64,
          stdDevThreshold: ANOMALY_STD_DEV_THRESHOLD,
        }
      );

      if (anomalyAnalysis.error) {
        fileResult.issues.push(
          `Pixel analysis failed: ${anomalyAnalysis.error}`
        );
        fileResult.status = 'anomaly';
      } else {
        fileResult.width = anomalyAnalysis.width;
        fileResult.height = anomalyAnalysis.height;

        if (anomalyAnalysis.isTransparent) {
          fileResult.issues.push('Image is entirely transparent');
          fileResult.status = 'anomaly';
        } else if (anomalyAnalysis.isSolidColor) {
          fileResult.issues.push(
            `Image is solid/blank color (StdDev RGB: ${anomalyAnalysis.stdDevR.toFixed(1)}, ${anomalyAnalysis.stdDevG.toFixed(1)}, ${anomalyAnalysis.stdDevB.toFixed(1)})`
          );
          fileResult.status = 'anomaly';
        }
      }
    } catch (e) {
      fileResult.issues.push(`Exception running pixel checks: ${e.message}`);
      fileResult.status = 'anomaly';
    }

    // 3. Perform baseline comparison if baseline image exists
    const hasBaseline = fs.existsSync(baselinePath);
    if (hasBaseline && fileResult.status !== 'anomaly') {
      try {
        const baselineBuffer = fs.readFileSync(baselinePath);
        const baselineBase64 = baselineBuffer.toString('base64');

        const comparison = await page.evaluate(
          async ({ baseImg, newImg, thresholdRGB, regressionThreshold }) => {
            const loadImage = (base64) =>
              new Promise((resolve, reject) => {
                const img = new Image();
                img.onload = () => resolve(img);
                img.onerror = (e) =>
                  reject(new Error('Failed to load image: ' + e.message));
                img.src = 'data:image/png;base64,' + base64;
              });

            try {
              const img1 = await loadImage(baseImg);
              const img2 = await loadImage(newImg);

              const w = Math.max(img1.width, img2.width);
              const h = Math.max(img1.height, img2.height);

              const canvas1 = document.createElement('canvas');
              canvas1.width = w;
              canvas1.height = h;
              const ctx1 = canvas1.getContext('2d');
              ctx1.drawImage(img1, 0, 0);
              const data1 = ctx1.getImageData(0, 0, w, h).data;

              const canvas2 = document.createElement('canvas');
              canvas2.width = w;
              canvas2.height = h;
              const ctx2 = canvas2.getContext('2d');
              ctx2.drawImage(img2, 0, 0);
              const data2 = ctx2.getImageData(0, 0, w, h).data;

              const diffCanvas = document.createElement('canvas');
              diffCanvas.width = w;
              diffCanvas.height = h;
              const diffCtx = diffCanvas.getContext('2d');
              const diffImgData = diffCtx.createImageData(w, h);
              const diffData = diffImgData.data;

              let diffPixels = 0;
              const totalPixels = w * h;

              for (let i = 0; i < totalPixels * 4; i += 4) {
                const r1 = data1[i];
                const g1 = data1[i + 1];
                const b1 = data1[i + 2];
                const a1 = data1[i + 3];

                const r2 = data2[i];
                const g2 = data2[i + 1];
                const b2 = data2[i + 2];
                const a2 = data2[i + 3];

                const diffR = Math.abs(r1 - r2);
                const diffG = Math.abs(g1 - g2);
                const diffB = Math.abs(b1 - b2);
                const diffA = Math.abs(a1 - a2);

                const isDifferent =
                  diffR > thresholdRGB ||
                  diffG > thresholdRGB ||
                  diffB > thresholdRGB ||
                  diffA > 15;

                if (isDifferent) {
                  diffPixels++;
                  // Highlight different pixels in bright magenta
                  diffData[i] = 255;
                  diffData[i + 1] = 0;
                  diffData[i + 2] = 255;
                  diffData[i + 3] = 255;
                } else {
                  // Dim down matching pixel values for context
                  const gray = Math.round(0.3 * r1 + 0.59 * g1 + 0.11 * b1);
                  diffData[i] = gray;
                  diffData[i + 1] = gray;
                  diffData[i + 2] = gray;
                  diffData[i + 3] = Math.round(a1 * 0.15); // Fade matching parts
                }
              }

              diffCtx.putImageData(diffImgData, 0, 0);
              const diffPercentage = (diffPixels / totalPixels) * 100;
              const diffBase64 = diffCanvas
                .toDataURL('image/png')
                .split(',')[1];

              return {
                diffPercentage,
                diffBase64,
                sizeMismatch:
                  img1.width !== img2.width || img1.height !== img2.height,
              };
            } catch (e) {
              return { error: e.message };
            }
          },
          {
            baseImg: baselineBase64,
            newImg: snapshotBase64,
            thresholdRGB: REGRESSION_COLOR_DIFF_THRESHOLD,
            regressionThreshold: REGRESSION_PIXEL_DIFF_THRESHOLD_PERCENT,
          }
        );

        if (comparison.error) {
          fileResult.issues.push(
            `Baseline comparison failed: ${comparison.error}`
          );
          fileResult.status = 'anomaly';
        } else {
          fileResult.diffPercentage = comparison.diffPercentage;

          if (comparison.sizeMismatch) {
            fileResult.issues.push('Dimensions mismatch compared to baseline');
            fileResult.status = 'regression';
          }

          if (
            comparison.diffPercentage > REGRESSION_PIXEL_DIFF_THRESHOLD_PERCENT
          ) {
            fileResult.issues.push(
              `Visual drift of ${comparison.diffPercentage.toFixed(2)}% exceeds threshold of ${REGRESSION_PIXEL_DIFF_THRESHOLD_PERCENT}%`
            );
            fileResult.status = 'regression';
          }

          // If different, write out the diff image
          if (comparison.diffPercentage > 0) {
            const diffBuffer = Buffer.from(comparison.diffBase64, 'base64');
            const diffLocalPath = path.join(DIFFS_DIR, file);
            const diffLocalDir = path.dirname(diffLocalPath);
            if (!fs.existsSync(diffLocalDir)) {
              fs.mkdirSync(diffLocalDir, { recursive: true });
            }
            fs.writeFileSync(diffLocalPath, diffBuffer);
            fs.writeFileSync(diffDestPath, diffBuffer); // Copy to docs/images/diffs for GitHub page viewing
            fileResult.hasDiffImage = true;
          }
        }
      } catch (e) {
        fileResult.issues.push(
          `Exception comparing against baseline: ${e.message}`
        );
        fileResult.status = 'anomaly';
      }
    } else if (!hasBaseline && fileResult.status !== 'anomaly') {
      fileResult.issues.push(
        'No baseline image found (first run verification)'
      );
    }

    // Accumulate summary stats
    if (fileResult.status === 'anomaly') {
      summary.anomalies++;
      console.log(
        `[ANOMALY] ${collection} > ${fragmentName} (${viewport}): ${fileResult.issues.join('; ')}`
      );
    } else if (fileResult.status === 'regression') {
      summary.regressions++;
      console.log(
        `[REGRESSION] ${collection} > ${fragmentName} (${viewport}): ${fileResult.issues.join('; ')}`
      );
    } else {
      summary.passed++;
    }

    results[liveFileName] = fileResult;
  }

  await browser.close();

  // Write results JSON file
  const outputData = {
    timestamp: new Date().toISOString(),
    summary,
    results,
  };
  fs.writeFileSync(ANALYSIS_JSON, JSON.stringify(outputData, null, 2));
  console.log(`Visual analysis data saved to: ${ANALYSIS_JSON}`);

  // Generate Markdown Report
  let md = `# Visual Regression & Quality Review Report\n\n`;
  md += `**Date:** ${new Date().toLocaleString()}\n`;
  md += `**Total Checked:** ${summary.total}\n`;
  md += `**Passed:** ${summary.passed} ✅\n`;
  md += `**Anomalies Detected:** ${summary.anomalies} ⚠️\n`;
  md += `**Regressions Detected:** ${summary.regressions} ❌\n\n`;

  if (summary.anomalies > 0 || summary.regressions > 0) {
    md += `## Flags for Review\n\n`;
    md += `Below is the list of fragments requiring visual inspection. Click the links to review differences.\n\n`;
    md += `| Collection | Fragment | Viewport | Type | Issues / Mismatch % | Diff View |\n`;
    md += `| :--- | :--- | :--- | :--- | :--- | :--- |\n`;

    Object.keys(results).forEach((key) => {
      const res = results[key];
      if (res.status !== 'passed') {
        const typeBadge =
          res.status === 'anomaly' ? '⚠️ Anomaly' : '❌ Regression';
        const diffLink = res.hasDiffImage
          ? `[View Diff](../images/diffs/${getSafeName(res.collection)}-${getSafeName(res.fragment)}-${res.viewport}-diff.png)`
          : 'N/A';

        md += `| ${res.collection} | ${res.fragment} | ${res.viewport} | ${typeBadge} | ${res.issues.join('<br>')} | ${diffLink} |\n`;
      }
    });
    md += `\n`;
  } else {
    md += `## All Clear!\n\nAll captured screenshots passed visual quality analysis and match baseline references.\n`;
  }

  fs.writeFileSync(REPORT_FILE, md);
  console.log(`Markdown visual report generated at: ${REPORT_FILE}`);

  // Exit with warning (not hard error, since anomalies/regressions might be expected UI changes that just need baselines updated)
  console.log('======================================================');
  console.log(`Visual Verification Complete:`);
  console.log(` - Total: ${summary.total}`);
  console.log(` - Passed: ${summary.passed}`);
  console.log(` - Anomalies: ${summary.anomalies}`);
  console.log(` - Regressions: ${summary.regressions}`);
  if (summary.anomalies > 0 || summary.regressions > 0) {
    console.log(`\n[WARNING] Found rendering issues or layout regressions.`);
    console.log(
      `Hint: If these visual changes are intentional, promote the new snapshots to baseline by running:`
    );
    console.log(`      npm run test:visual:update`);
  } else {
    console.log(`\n[SUCCESS] Visual validation passed.`);
  }
  console.log('======================================================');
}

// Parse Command Line
const args = process.argv.slice(2);
if (args.includes('--update')) {
  updateBaselines();
} else {
  verifySnapshots().catch((err) => {
    console.error('Fatal error during visual verification:', err);
    process.exit(1);
  });
}
