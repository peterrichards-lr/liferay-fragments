const fs = require('fs');
const path = require('path');

function installGitHooks() {
  const rootDir = path.resolve(__dirname, '..');
  const gitDir = path.join(rootDir, '.git');

  if (!fs.existsSync(gitDir)) {
    console.warn('No .git directory found. Skipping git hook installation.');
    return;
  }

  const hooksDir = path.join(gitDir, 'hooks');
  if (!fs.existsSync(hooksDir)) {
    fs.mkdirSync(hooksDir, { recursive: true });
  }

  const preCommitHookPath = path.join(hooksDir, 'pre-commit');

  const hookContent = `#!/bin/sh
# Auto-generated pre-commit hook for formatting, dependency syncing, auditing, and secret detection

# 0. Safety Guard: Check if dependencies are installed
if [ ! -d "node_modules" ]; then
    echo "[ERROR] node_modules folder is missing. Please run 'npm install' to resolve dependencies."
    echo "Hint: You can bypass this check for WIP commits using: git commit --no-verify"
    exit 1
fi

# 0.5. Workspace Cleanliness Check (Issue #66)
echo "Checking workspace cleanliness..."
node scripts/check-cleanliness.js
if [ $? -ne 0 ]; then
    exit 1
fi

# 1. Format staged JS, JSON, CSS, HTML, and MD files using Prettier
STAGED_FILES=$(git diff --cached --name-only --diff-filter=ACMR | grep -E '\\.(js|json|css|html|md)$')
if [ -n "$STAGED_FILES" ]; then
    echo "Formatting staged files with Prettier..."
    echo "$STAGED_FILES" | xargs npx prettier --write
    echo "$STAGED_FILES" | xargs git add
fi

# 2. Synchronize fragment-build.json dependencies based on code usage
echo "Syncing fragment-build.json dependencies..."
node scripts/initialize-build-config.js
git add "**/test/fragment-build.json" 2>/dev/null || true

# 2.5 Generate Visual Gallery
echo "Syncing visual gallery documentation..."
node scripts/generate-gallery.js
git add docs/gallery.md

# 3. Run Fragment Audit Quality Gate
echo "Running Fragment Audit linter..."
npm run lint
if [ $? -ne 0 ]; then
    echo "[ERROR] Fragment Audit failed. Commit aborted."
    echo "Hint: Fix the errors above or bypass this quality gate using: git commit --no-verify"
    exit 1
fi

# 4. Secret Detection
node scripts/detect-secrets.js pre-commit
`;

  try {
    fs.writeFileSync(preCommitHookPath, hookContent, {
      encoding: 'utf8',
      mode: 0o755,
    });

    // Ensure executable permissions on Unix-like systems
    try {
      fs.chmodSync(preCommitHookPath, 0o755);
    } catch (chmodErr) {
      // Ignore chmod errors on systems that don't support it (e.g. Windows)
    }

    console.log(
      'Successfully installed pre-commit hook at:',
      preCommitHookPath
    );
  } catch (err) {
    console.error('Error writing pre-commit hook:', err);
    process.exit(1);
  }
}

installGitHooks();
