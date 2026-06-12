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
        // Check for checkbox without dataType boolean
        if (field.type === 'checkbox' && field.dataType !== 'boolean') {
          field.dataType = 'boolean';
          modified = true;
        }

        // Check for number/range without dataType number
        if (
          (field.type === 'number' || field.type === 'range') &&
          field.dataType !== 'number'
        ) {
          field.dataType = 'number';
          modified = true;
        }
      }
    }

    if (modified) {
      fs.writeFileSync(file, JSON.stringify(data, null, 2) + '\n');
      console.log(`Fixed dataType validation issues in: ${file}`);
    }
  }
} catch (e) {
  console.error(e);
}
