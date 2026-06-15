const fs = require('fs');
const path = require('path');
const { globSync } = require('glob');

const fixLazyKeys = (filePath) => {
  if (!fs.existsSync(filePath)) return;

  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  const newLines = lines.map((line) => {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (!match) return line;

    const key = match[1].trim();
    const value = match[2].trim();

    if (key === value && key.startsWith('lfr.')) {
      // Transform lfr.collection.some-key into "Some Key"
      let newValue = key.replace(/^lfr\.[^.]+\./, ''); // Remove lfr.namespace.
      if (newValue === key) newValue = key.replace(/^lfr\./, ''); // Fallback if only one dot

      newValue = newValue
        .split('-')
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');

      console.log(`  [FIXED] ${key} -> ${newValue}`);
      return `${key}=${newValue}`;
    }

    return line;
  });

  fs.writeFileSync(filePath, newLines.join('\n'));
};

// Dynamically ignore any local LDM sandbox project directories to avoid scanning them
const ldmIgnores = [];
try {
  const os = require('os');
  const registryPath = path.join(os.homedir(), '.ldm', 'registry.json');
  if (fs.existsSync(registryPath)) {
    const registry = JSON.parse(fs.readFileSync(registryPath, 'utf8'));
    Object.values(registry).forEach((proj) => {
      if (proj.path) {
        const rel = path.relative(process.cwd(), proj.path);
        if (!rel.startsWith('..') && !path.isAbsolute(rel) && rel !== '') {
          ldmIgnores.push(`${rel}/**`);
        }
      }
    });
  }
} catch (e) {}

const propFiles = globSync('**/Language_en_US.properties', {
  ignore: ['node_modules/**', ...ldmIgnores],
});

console.log(
  `Found ${propFiles.length} localization files. Checking for lazy keys...\n`
);

propFiles.forEach((file) => {
  console.log(`Processing ${file}...`);
  fixLazyKeys(file);
});

console.log('\nLocalization clean-up complete.');
