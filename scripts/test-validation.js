const fs = require('fs');
const path = require('path');

function getFiles(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach((file) => {
    const fullPath = path.join(dir, file);
    if (file === 'node_modules' || file === '.git') return;
    const stat = fs.statSync(fullPath);
    if (stat && stat.isDirectory()) {
      results = results.concat(getFiles(fullPath));
    } else if (file === 'configuration.json') {
      results.push(fullPath);
    }
  });
  return results;
}

try {
  const files = getFiles(process.cwd());
  for (const file of files) {
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
