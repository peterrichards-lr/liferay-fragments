#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

function log(msg, type = 'info') {
  const colors = {
    info: '\x1b[34m', // Blue
    success: '\x1b[32m', // Green
    warn: '\x1b[33m', // Yellow
    error: '\x1b[31m', // Red
    reset: '\x1b[0m',
  };
  console.log(`${colors[type]}${msg}${colors.reset}`);
}

// Check dependencies
try {
  execSync('gh --version', { stdio: 'ignore' });
} catch (e) {
  log(
    'Error: GitHub CLI (gh) is not installed. Please install it and log in.',
    'error'
  );
  process.exit(1);
}

try {
  execSync('gh auth status', { stdio: 'ignore' });
} catch (e) {
  log(
    'Error: GitHub CLI is not authenticated. Please run "gh auth login".',
    'error'
  );
  process.exit(1);
}

// Parse args
const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const jsonArg = args.find((a) => a.endsWith('.json'));

if (!jsonArg) {
  log('Usage: node gh-issue-sync.cjs <issues.json> [--dry-run]', 'warn');
  process.exit(1);
}

const jsonPath = path.resolve(jsonArg);
if (!fs.existsSync(jsonPath)) {
  log(`Error: File not found at ${jsonPath}`, 'error');
  process.exit(1);
}

const config = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));

let commitHash = 'master';
try {
  commitHash = execSync('git rev-parse --short HEAD', {
    encoding: 'utf8',
  }).trim();
} catch (e) {
  // Silent fallback
}

log(`=== Reusable GitHub Issue Sync ${dryRun ? '(DRY RUN)' : ''} ===`, 'info');
log(`Referencing commit: ${commitHash}`, 'info');

// Create Epic
log(`\nCreating Epic: "${config.title}"...`, 'info');
let epicNumber = '123';

const epicLabels = (config.labels || []).map((l) => `--label "${l}"`).join(' ');
const epicCommand =
  `gh issue create --title "${config.title}" --body "${config.body}" ${epicLabels}`.trim();

if (dryRun) {
  log(`[DRY RUN] Would execute: ${epicCommand}`, 'success');
} else {
  const epicUrl = execSync(epicCommand, { encoding: 'utf8' }).trim();
  epicNumber = epicUrl.split('/').pop();
  log(
    `Epic created successfully: Issue #${epicNumber} (${epicUrl})`,
    'success'
  );
}

// Create Sub-issues
if (config.issues && config.issues.length > 0) {
  config.issues.forEach((issue, idx) => {
    log(
      `\nProcessing sub-issue [${idx + 1}/${config.issues.length}]: "${issue.title}"...`,
      'info'
    );
    const issueLabels = (issue.labels || [])
      .map((l) => `--label "${l}"`)
      .join(' ');
    const bodyText = `${issue.body}\n\n(Belongs to Epic #${epicNumber})`;
    const issueCommand =
      `gh issue create --title "${issue.title}" --body "${bodyText}" ${issueLabels}`.trim();

    if (dryRun) {
      log(`[DRY RUN] Would execute: ${issueCommand}`, 'success');
      if (issue.completed) {
        log(`[DRY RUN] Would comment and close sub-issue.`, 'success');
      }
    } else {
      const subIssueUrl = execSync(issueCommand, { encoding: 'utf8' }).trim();
      const subIssueNumber = subIssueUrl.split('/').pop();
      log(
        `Sub-issue created: Issue #${subIssueNumber} (${subIssueUrl})`,
        'success'
      );

      if (issue.completed) {
        log(`Closing completed sub-issue #${subIssueNumber}...`, 'info');
        const commentCommand = `gh issue comment ${subIssueNumber} --body "This issue was successfully implemented and verified in commit ${commitHash}. Closing."`;
        execSync(commentCommand);
        execSync(`gh issue close ${subIssueNumber}`);
        log(`Issue #${subIssueNumber} closed successfully.`, 'success');
      }
    }
  });
}

log('\nAll sync operations completed!', 'success');
