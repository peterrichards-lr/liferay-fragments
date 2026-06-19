#!/usr/bin/env node

/**
 * scripts/check-progress.js
 * Reads the E2E State Coordinator file (.progress-signal) and prints a token-efficient summary.
 */

const fs = require('fs');
const path = require('path');

const workspaceRoot = path.join(__dirname, '..');
const progressFile = path.join(workspaceRoot, '.progress-signal');
const pwLogFile = path.join(
  workspaceRoot,
  'e2e-tests',
  'playwright_output.log'
);
const ldmStartupLog = path.join(workspaceRoot, 'ldm_startup.log');

function formatSeconds(seconds) {
  if (seconds < 0) return '0s';
  if (seconds < 60) return `${seconds}s`;
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}m ${secs}s`;
}

function getTail(filePath, numLines = 5) {
  if (!fs.existsSync(filePath)) return null;
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean);
    return lines.slice(-numLines);
  } catch (e) {
    return null;
  }
}

function main() {
  if (!fs.existsSync(progressFile)) {
    console.log(
      'No .progress-signal file found. The test runner has not started or has cleared the signal.'
    );
    return;
  }

  let content;
  try {
    content = fs.readFileSync(progressFile, 'utf8');
  } catch (err) {
    console.log(`Error reading .progress-signal: ${err.message}`);
    return;
  }

  const lines = content
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);
  if (lines.length === 0) {
    console.log('The .progress-signal file is empty.');
    return;
  }

  const status = lines[0];
  const metadata = {};
  for (let i = 1; i < lines.length; i++) {
    const eqIdx = lines[i].indexOf('=');
    if (eqIdx !== -1) {
      const key = lines[i].substring(0, eqIdx);
      const val = lines[i].substring(eqIdx + 1);
      metadata[key] = val;
    }
  }

  const percent = metadata['PROGRESS_PERCENT']
    ? `${metadata['PROGRESS_PERCENT']}%`
    : 'unknown%';
  const remainingSecs = metadata['ESTIMATED_REMAINING_SECONDS']
    ? parseInt(metadata['ESTIMATED_REMAINING_SECONDS'], 10)
    : null;
  const completionTime = metadata['ESTIMATED_COMPLETION_TIME'] || null;

  console.log(`========================================`);
  console.log(` E2E PROGRESS: ${status} (${percent})`);
  console.log(`========================================`);

  if (remainingSecs !== null && remainingSecs > 0) {
    console.log(`Remaining:   ${formatSeconds(remainingSecs)}`);
  }
  if (completionTime) {
    console.log(`Est. End:    ${completionTime}`);
  }

  // Print context-specific log tails
  if (status === 'BUILDING' || status === 'WAITING_HEALTHY') {
    const ldmTail = getTail(ldmStartupLog, 4);
    if (ldmTail && ldmTail.length > 0) {
      console.log(`\nLast LDM Startup Log Lines:`);
      ldmTail.forEach((line) => console.log(`  > ${line}`));
    } else {
      console.log(`\nWaiting for LDM startup log...`);
    }
  } else if (status === 'TESTING') {
    const pwTail = getTail(pwLogFile, 6);
    if (pwTail && pwTail.length > 0) {
      console.log(`\nLast Playwright Log Lines:`);
      pwTail.forEach((line) => console.log(`  > ${line}`));
    } else {
      console.log(`\nWaiting for Playwright output...`);
    }
  } else if (status === 'SUCCESS') {
    console.log(`\nRun completed successfully!`);
    const pwTail = getTail(pwLogFile, 3);
    if (pwTail && pwTail.length > 0) {
      console.log(`Final output:`);
      pwTail.forEach((line) => console.log(`  > ${line}`));
    }
  } else if (status === 'FAILED') {
    console.log(`\nRun FAILED!`);
    // Check both LDM and Playwright logs to find errors
    const pwTail = getTail(pwLogFile, 10);
    if (pwTail && pwTail.length > 0) {
      console.log(`Last Playwright Log Lines:`);
      pwTail.forEach((line) => console.log(`  > ${line}`));
    } else {
      const ldmTail = getTail(ldmStartupLog, 10);
      if (ldmTail && ldmTail.length > 0) {
        console.log(`Last LDM Startup Log Lines:`);
        ldmTail.forEach((line) => console.log(`  > ${line}`));
      }
    }
  }
}

// Watch / live tracking mode
const args = process.argv.slice(2);
if (args.includes('--watch') || args.includes('-w')) {
  // Simple periodic refresh
  main();
  const interval = setInterval(() => {
    // Print a separator instead of clearing the console to keep output history visible
    console.log(`\n--- Update at ${new Date().toLocaleTimeString()} ---`);
    main();

    // Stop polling if completed
    try {
      if (fs.existsSync(progressFile)) {
        const currentStatus = fs
          .readFileSync(progressFile, 'utf8')
          .split('\n')[0]
          .trim();
        if (currentStatus === 'SUCCESS' || currentStatus === 'FAILED') {
          clearInterval(interval);
        }
      }
    } catch (e) {}
  }, 5000);
} else {
  main();
}
