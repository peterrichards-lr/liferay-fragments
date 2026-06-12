const fs = require('fs');
const path = require('path');
const cp = require('child_process');

try {
  const files = cp
    .execSync('find . -name configuration.json')
    .toString()
    .split('\n')
    .filter(Boolean);

  for (const file of files) {
    if (file.includes('node_modules')) continue;
    const data = JSON.parse(fs.readFileSync(file, 'utf8'));
    if (!data.fieldSets) continue;

    let modified = false;
    let newProperties = [];

    // Find the fragment's language file.
    // It's usually in the fragment directory itself, or the collection root if it's shared.
    // In this repo, Language_en_US.properties is usually at the collection level (e.g. widget-modifiers/Language_en_US.properties)
    // or fragment level. Let's find the nearest one going up.
    let currentDir = path.dirname(file);
    let langFilePath = null;
    while (currentDir !== '.' && currentDir !== '/') {
      const potentialPath = path.join(currentDir, 'Language_en_US.properties');
      if (fs.existsSync(potentialPath)) {
        langFilePath = potentialPath;
        break;
      }
      currentDir = path.dirname(currentDir);
    }

    // We need to determine the prefix. It's usually `lfr.<collection-name>.`
    // Let's extract the prefix from an existing label in the configuration.json
    let prefix = 'lfr.custom.';
    for (const set of data.fieldSets) {
      if (set.label) {
        const parts = set.label.split('.');
        if (parts.length >= 2) {
          prefix = parts.slice(0, 2).join('.') + '.';
          break;
        }
      }
    }

    for (const set of data.fieldSets) {
      for (const field of set.fields) {
        if (
          field.type === 'select' &&
          field.typeOptions &&
          field.typeOptions.validValues
        ) {
          for (const val of field.typeOptions.validValues) {
            if (!val.label) {
              const newKey =
                prefix + val.value.replace(/[^a-zA-Z0-9-]/g, '-').toLowerCase();
              val.label = newKey;
              modified = true;

              // Capitalize for the english text
              const englishText = val.value
                .split('-')
                .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
                .join(' ');
              newProperties.push(`${newKey}=${englishText}`);
            }
          }
        }
      }
    }

    if (modified) {
      fs.writeFileSync(file, JSON.stringify(data, null, 2) + '\n');
      console.log(`Added missing labels to: ${file}`);

      if (langFilePath && newProperties.length > 0) {
        let langContent = fs.readFileSync(langFilePath, 'utf8');
        let langModified = false;
        for (const prop of newProperties) {
          if (!langContent.includes(prop.split('=')[0] + '=')) {
            langContent = langContent.trim() + '\n' + prop + '\n';
            langModified = true;
          }
        }
        if (langModified) {
          fs.writeFileSync(langFilePath, langContent);
          console.log(`Updated language file: ${langFilePath}`);
        }
      }
    }
  }
} catch (e) {
  console.error(e);
}
