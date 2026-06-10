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
# Auto-generated pre-commit hook for secret detection
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
