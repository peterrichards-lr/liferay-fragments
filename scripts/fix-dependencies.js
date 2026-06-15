const fs = require('fs');
const path = require('path');
const { globSync } = require('glob');

// Find all configuration.json files
const configFiles = globSync('**/configuration.json', {
  ignore: ['node_modules/**', 'zips/**', 'e2e-tests/**'],
});

console.log(`Found ${configFiles.length} configuration files.`);

let fixedCount = 0;

configFiles.forEach((file) => {
  let content = fs.readFileSync(file, 'utf8');
  let json = JSON.parse(content);
  let modified = false;

  if (json.fieldSets) {
    json.fieldSets.forEach((set) => {
      set.fields?.forEach((field) => {
        if (field.typeOptions && field.typeOptions.dependency) {
          const dep = field.typeOptions.dependency;

          // Case 1: Old nested format (no 'field' key at root, but has a nested field key)
          // e.g. dependency: { "integerReading": { "type": "equal", "value": false } }
          const keys = Object.keys(dep);
          if (
            keys.length === 1 &&
            keys[0] !== 'field' &&
            keys[0] !== 'condition'
          ) {
            const depFieldName = keys[0];
            const depRule = dep[depFieldName];
            if (depRule && typeof depRule === 'object') {
              field.typeOptions.dependency = {
                field: depFieldName,
                condition: {
                  type: depRule.type || 'equal',
                  value: depRule.value !== undefined ? depRule.value : true,
                },
              };
              modified = true;
            }
          }
          // Case 2: Flat format (has 'field', 'type', and 'value' at the root of dependency)
          // e.g. dependency: { "field": "integerReading", "type": "equal", "value": false }
          else if (
            dep.field &&
            dep.type &&
            dep.value !== undefined &&
            !dep.condition
          ) {
            const depFieldName = dep.field;
            const depType = dep.type;
            const depValue = dep.value;
            field.typeOptions.dependency = {
              field: depFieldName,
              condition: {
                type: depType,
                value: depValue,
              },
            };
            modified = true;
          }
        }
      });
    });
  }

  if (modified) {
    fs.writeFileSync(file, JSON.stringify(json, null, 2) + '\n', 'utf8');
    console.log(`Fixed dependency format in ${file}`);
    fixedCount++;
  }
});

console.log(`Successfully fixed dependency formats in ${fixedCount} files.`);
