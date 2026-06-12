const fs = require('fs');
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

    for (const set of data.fieldSets) {
      for (const field of set.fields) {
        // Remove dataType: "boolean" from checkboxes as it causes Liferay 2026.Q1 schema violations
        if (field.type === 'checkbox' && field.dataType === 'boolean') {
          delete field.dataType;
          modified = true;
        }
      }
    }

    if (modified) {
      fs.writeFileSync(file, JSON.stringify(data, null, 2) + '\n');
      console.log(`Removed invalid dataType:boolean from: ${file}`);
    }
  }
} catch (e) {
  console.error(e);
}
