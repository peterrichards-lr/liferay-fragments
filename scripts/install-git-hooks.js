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
# Auto-generated pre-commit hook for formatting and secret detection

# 1. Format staged JS, JSON, CSS, HTML, and MD files using Prettier
STAGED_FILES=\$(git diff --cached --name-only --diff-filter=ACMR | grep -E '\\.(js|json|css|html|md)\$')
if [ -n "\$STAGED_FILES" ]; then
    echo "Formatting staged files with Prettier..."
    echo "\$STAGED_FILES" | xargs npx prettier --write
    echo "\$STAGED_FILES" | xargs git add
fi

# 3. Secret Detection
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
