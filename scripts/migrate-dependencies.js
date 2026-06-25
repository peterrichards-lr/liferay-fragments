const fs = require('fs');
const path = require('path');

function getFiles(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach((file) => {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat && stat.isDirectory()) {
      if (
        file !== 'node_modules' &&
        file !== '.git' &&
        file !== 'temp_extract' &&
        file !== 'temp_inspect' &&
        file !== 'temp_inspect_zip'
      ) {
        results = results.concat(getFiles(fullPath));
      }
    } else if (file === 'configuration.json') {
      results.push(fullPath);
    }
  });
  return results;
}

const configFiles = getFiles('D:\\repos\\liferay-fragments');

configFiles.forEach((file) => {
  const content = fs.readFileSync(file, 'utf8');
  try {
    const json = JSON.parse(content);
    let modified = false;

    if (json.fieldSets) {
      json.fieldSets.forEach((set) => {
        if (set.fields) {
          set.fields.forEach((field) => {
            if (field.typeOptions && field.typeOptions.dependency) {
              const dep = field.typeOptions.dependency;
              // Check if it is using the old format (having 'field' and 'condition' keys)
              if (dep.field && dep.condition) {
                const depField = dep.field;
                const condType = dep.condition.type || 'equal';
                const condVal = String(dep.condition.value);

                field.typeOptions.dependency = {
                  [depField]: {
                    type: condType,
                    value: condVal,
                  },
                };
                modified = true;
                const relPath = path.relative(
                  'D:\\repos\\liferay-fragments',
                  file
                );
                console.log(
                  `Migrated: [${relPath}] Field: ${field.name} depends on ${depField} = ${condVal}`
                );
              }
            }
          });
        }
      });
    }

    if (modified) {
      fs.writeFileSync(file, JSON.stringify(json, null, 2) + '\n', 'utf8');
    }
  } catch (e) {
    console.error(`Failed to parse/migrate ${file}:`, e.message);
  }
});
console.log('Migration complete!');
