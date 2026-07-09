#!/usr/bin/env node
/**
 * Issue #66: Workspace Cleanliness Check
 *
 * Parses 'git status --porcelain' and blocks commits if untracked directories
 * exist at the repository root that are not in the allowed list. This prevents
 * accidental commits of docker data directories, heavy build outputs, and
 * local sandbox environments.
 */

'use strict';

const { execSync } = require('child_process');
const path = require('path');

// Directories and patterns that are allowed to be untracked at root level.
// These are typically gitignored but may appear in 'git status --porcelain'
// output on some systems or with certain .gitignore configurations.
const ALLOWED_UNTRACKED = new Set([
  'temp/',
  'temp_extract/',
  'temp_inspect/',
  'playwright-report/',
  'test-results/',
  'node_modules/',
  'zips/',
  '.ldm/',
  'ldm_startup.log',
  'scratch/',
]);

function checkCleanliness() {
  let statusOutput;
  try {
    statusOutput = execSync('git status --porcelain', { encoding: 'utf8' });
  } catch (e) {
    // Not a git repo or git not available — skip silently
    return;
  }

  const violations = statusOutput
    .split('\n')
    .filter((line) => line.startsWith('?? '))
    .map((line) => line.substring(3).trim())
    .filter((entry) => {
      // Only flag root-level items (no subdirectory separator, or first component is root)
      const parts = entry.split('/');
      if (parts.length > 2) return false; // Deeply nested — not a root-level item
      const rootEntry = parts[0] + (entry.includes('/') ? '/' : '');
      return !ALLOWED_UNTRACKED.has(rootEntry) && !ALLOWED_UNTRACKED.has(entry);
    });

  if (violations.length > 0) {
    console.error(
      '\x1b[31m[COMMIT BLOCKED] Untracked root-level items detected:\x1b[0m'
    );
    violations.forEach((f) =>
      console.error(`  \x1b[33m- ${f}\x1b[0m`)
    );
    console.error(
      '\x1b[31mPlease add them to .gitignore or remove them before committing.\x1b[0m'
    );
    console.error(
      '\x1b[90mHint: Bypass with: git commit --no-verify\x1b[0m'
    );
    process.exit(1);
  }
}

checkCleanliness();
