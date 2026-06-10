// scripts/monitor-e2e.js
const fs = require('fs');
const path = require('path');

const logFile = path.join(
  __dirname,
  '..',
  'e2e-tests',
  'playwright_output.log'
);
console.log('Monitoring E2E test log:', logFile);

let lastSize = 0;
let checkInterval = 2000; // 2 seconds

// Clear/reset file size if it doesn't exist yet
if (fs.existsSync(logFile)) {
  lastSize = fs.statSync(logFile).size;
}

const intervalId = setInterval(() => {
  if (!fs.existsSync(logFile)) {
    return;
  }

  const stats = fs.statSync(logFile);
  if (stats.size > lastSize) {
    const stream = fs.createReadStream(logFile, {
      start: lastSize,
      end: stats.size - 1,
      encoding: 'utf8',
    });

    stream.on('data', (chunk) => {
      const lines = chunk.split('\n');
      lines.forEach((line) => {
        const lower = line.toLowerCase();
        // Print lines of interest (slider, seeding, errors, progress, completions)
        if (
          lower.includes('slider') ||
          lower.includes('seed') ||
          lower.includes('structure') ||
          lower.includes('article') ||
          lower.includes('collection') ||
          lower.includes('warn') ||
          lower.includes('failed to create') ||
          lower.includes('test run complete') ||
          lower.includes('tests passed') ||
          lower.includes('tests failed') ||
          lower.includes('error') ||
          (lower.includes('running') && lower.includes('tests'))
        ) {
          console.log(`[MONITOR] ${line}`);
        }
      });
    });

    stream.on('end', () => {
      lastSize = stats.size;
    });
  }

  // Check if E2E run is completed to terminate monitoring
  if (fs.existsSync(logFile)) {
    const content = fs.readFileSync(logFile, 'utf8');
    if (
      content.includes('Test run complete') ||
      content.includes('Some tests failed')
    ) {
      console.log('[MONITOR] E2E test suite has completed. Exiting monitor.');
      clearInterval(intervalId);
      process.exit(0);
    }
  }
}, checkInterval);
