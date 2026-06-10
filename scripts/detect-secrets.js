const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { execSync } = require('child_process');

const BASELINE_FILE = '.secrets.baseline';
const GITLEAKS_IGNORE_FILE = '.gitleaksignore';

const EXCLUDED_DIRS = [
  'node_modules',
  '.git',
  '.gradle',
  'build',
  'dist',
  'zips',
  'temp',
  'playwright-report',
  'test-results',
];

const EXCLUDED_FILES = [
  'package-lock.json',
  BASELINE_FILE,
  GITLEAKS_IGNORE_FILE,
  '.DS_Store',
  'fragments-ui.png',
];

const EXCLUDED_EXTENSIONS = [
  '.png',
  '.jpg',
  '.jpeg',
  '.gif',
  '.ico',
  '.pdf',
  '.zip',
  '.jar',
  '.war',
  '.tgz',
  '.mov',
  '.mp4',
];

const RULES = [
  {
    name: 'Private Key',
    regex: /-----BEGIN[ A-Z0-9_-]+PRIVATE KEY-----/i,
    extractSecret: (match) => match[0],
  },
  {
    name: 'AWS API Key',
    regex:
      /(?:A3T[A-Z0-9]|AKIA|AGPA|AIDA|AROA|AIPA|ANPA|ANVA|ASIA)[A-Z0-9]{16}/,
    extractSecret: (match) => match[0],
  },
  {
    name: 'Slack Webhook',
    regex:
      /https:\/\/hooks\.slack\.com\/services\/T[A-Z0-9_]{8}\/B[A-Z0-9_]{8}\/[A-Za-z0-9_]{24}/,
    extractSecret: (match) => match[0],
  },
  {
    name: 'High Entropy Key/Secret',
    regex:
      /(?:key|secret|token|password|passwd|auth|credential|private|api_?key|pwd)(?:\s*[:=]\s*["'])([a-zA-Z0-9_\-\.\~\+\/]{16,})(["'])/i,
    extractSecret: (match) => match[1],
    isEntropyRule: true,
  },
];

function calculateShannonEntropy(str) {
  if (!str) return 0;
  const len = str.length;
  const frequencies = {};
  for (let i = 0; i < len; i++) {
    const char = str[i];
    frequencies[char] = (frequencies[char] || 0) + 1;
  }
  let entropy = 0;
  for (const char in frequencies) {
    const p = frequencies[char] / len;
    entropy -= p * Math.log2(p);
  }
  return entropy;
}

function hashSecret(secret) {
  return crypto.createHash('sha1').update(secret).digest('hex');
}

let cachedIgnores = null;
function getGitLeaksIgnores() {
  if (cachedIgnores === null) {
    cachedIgnores = new Set();
    if (fs.existsSync(GITLEAKS_IGNORE_FILE)) {
      try {
        const content = fs.readFileSync(GITLEAKS_IGNORE_FILE, 'utf8');
        content.split(/\r?\n/).forEach((line) => {
          const trimmed = line.trim();
          if (trimmed && !trimmed.startsWith('#')) {
            cachedIgnores.add(trimmed);
          }
        });
      } catch (e) {
        console.warn(
          `Warning: Could not read ${GITLEAKS_IGNORE_FILE}:`,
          e.message
        );
      }
    }
  }
  return cachedIgnores;
}

function shouldScanFile(filePath) {
  const parts = filePath.split(path.sep);
  if (parts.some((part) => EXCLUDED_DIRS.includes(part))) {
    return false;
  }
  const basename = path.basename(filePath);
  if (EXCLUDED_FILES.includes(basename)) {
    return false;
  }
  const ext = path.extname(filePath).toLowerCase();
  if (EXCLUDED_EXTENSIONS.includes(ext)) {
    return false;
  }
  try {
    const stat = fs.statSync(filePath);
    return stat.isFile();
  } catch (e) {
    return false;
  }
}

function scanFile(filePath) {
  const findings = [];
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split(/\r?\n/);

    lines.forEach((line, index) => {
      // Check for inline allowlist comment
      if (line.includes('pragma: allowlist secret')) {
        return;
      }

      RULES.forEach((rule) => {
        const match = line.match(rule.regex);
        if (match) {
          const secret = rule.extractSecret(match);

          // Check if secret or its hash is ignored in .gitleaksignore
          const ignores = getGitLeaksIgnores();
          const hashed = hashSecret(secret);
          if (ignores.has(secret) || ignores.has(hashed)) {
            return;
          }

          if (rule.isEntropyRule) {
            const entropy = calculateShannonEntropy(secret);
            // Ignore if entropy is low (usually less than 3.0 for hex/random strings)
            if (entropy < 3.0) {
              return;
            }
          }

          findings.push({
            type: rule.name,
            line_number: index + 1,
            hashed_secret: hashSecret(secret),
          });
        }
      });
    });
  } catch (err) {
    console.error(`Error reading ${filePath}:`, err.message);
  }
  return findings;
}

function getStagedFiles() {
  try {
    const output = execSync('git diff --cached --name-only --diff-filter=ACM', {
      encoding: 'utf8',
    });
    return output
      .split('\n')
      .map((f) => f.trim())
      .filter((f) => f.length > 0);
  } catch (err) {
    console.error('Error getting staged files from git:', err.message);
    return [];
  }
}

function getAllFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  files.forEach((file) => {
    const filePath = path.join(dir, file);
    const relativePath = path.relative(process.cwd(), filePath);

    const parts = relativePath.split(path.sep);
    if (parts.some((part) => EXCLUDED_DIRS.includes(part))) {
      return;
    }

    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
      getAllFiles(filePath, fileList);
    } else {
      if (shouldScanFile(relativePath)) {
        fileList.push(relativePath);
      }
    }
  });
  return fileList;
}

function loadBaseline() {
  if (fs.existsSync(BASELINE_FILE)) {
    try {
      return JSON.parse(fs.readFileSync(BASELINE_FILE, 'utf8'));
    } catch (e) {
      console.warn(
        `Warning: Could not parse baseline file ${BASELINE_FILE}. Starting with empty baseline.`
      );
    }
  }
  return { version: '1.0.0', results: {} };
}

function writeBaseline(baseline) {
  fs.writeFileSync(
    BASELINE_FILE,
    JSON.stringify(baseline, null, 2) + '\n',
    'utf8'
  );
}

function run() {
  const args = process.argv.slice(2);
  const mode = args[0] || 'pre-commit';

  if (mode === 'scan') {
    console.log('Scanning entire repository to generate/update baseline...');
    const allFiles = getAllFiles(process.cwd());
    const results = {};

    allFiles.forEach((file) => {
      const findings = scanFile(file);
      if (findings.length > 0) {
        results[file] = findings;
      }
    });

    const baseline = {
      version: '1.0.0',
      generated_at: new Date().toISOString(),
      results,
    };

    writeBaseline(baseline);
    console.log(
      `Successfully generated baseline in ${BASELINE_FILE} with ${Object.keys(results).length} files containing secrets.`
    );
  } else if (mode === 'pre-commit') {
    const stagedFiles = getStagedFiles();
    const scannableFiles = stagedFiles.filter(shouldScanFile);

    if (scannableFiles.length === 0) {
      process.exit(0);
    }

    const baseline = loadBaseline();
    let newSecretsCount = 0;

    scannableFiles.forEach((file) => {
      const findings = scanFile(file);
      const baselineFindings = baseline.results[file] || [];
      const baselineHashes = new Set(
        baselineFindings.map((f) => f.hashed_secret)
      );

      findings.forEach((finding) => {
        if (!baselineHashes.has(finding.hashed_secret)) {
          console.error(
            `\x1b[31m[ERROR] Potential secret detected in file: ${file}:${finding.line_number}\x1b[0m`
          );
          console.error(`  - Type: ${finding.type}`);
          console.error(`  - Secret SHA-1 Hash: ${finding.hashed_secret}`);
          console.error(
            `  - Action: Please remove this secret from code or obfuscate it.`
          );
          console.error(
            `  - Override: If this is a false positive, add it to the baseline by running:`
          );
          console.error(`              npm run detect-secrets scan`);
          console.error(
            `              Or add it to .gitleaksignore, or use '// pragma: allowlist secret' inline.`
          );
          console.error('');
          newSecretsCount++;
        }
      });
    });

    if (newSecretsCount > 0) {
      console.error(
        `\x1b[31m[COMMIT BLOCKED] ${newSecretsCount} new secrets detected. Commit aborted.\x1b[0m`
      );
      process.exit(1);
    }

    process.exit(0);
  } else {
    console.error(`Unknown mode: ${mode}. Use 'scan' or 'pre-commit'.`);
    process.exit(1);
  }
}

run();
