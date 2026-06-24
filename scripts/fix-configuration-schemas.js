const fs = require('fs');
const path = require('path');

function getFiles(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach((file) => {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat && stat.isDirectory()) {
      results = results.concat(getFiles(fullPath));
    } else if (file === 'configuration.json') {
      results.push(fullPath);
    }
  });
  return results;
}

const rootDir = path.resolve(__dirname, '..');
const configFiles = getFiles(rootDir);

let validationFixes = 0;
let dependencyFixes = 0;
let dataTypeFixes = 0;
let defaultValueFixes = 0;

configFiles.forEach((file) => {
  try {
    const content = fs.readFileSync(file, 'utf8');
    const json = JSON.parse(content);
    if (!json.fieldSets) return;

    let modified = false;
    json.fieldSets.forEach((fsEntry) => {
      if (!fsEntry.fields) return;
      fsEntry.fields.forEach((field) => {
        // 1. Enforce "type": "number" in validation block
        if (field.typeOptions && field.typeOptions.validation) {
          if (field.typeOptions.validation.type !== 'number') {
            console.log(
              `[VALIDATION] Enforcing "type": "number" in validation of ${path.relative(rootDir, file)} -> field "${field.name}"`
            );
            field.typeOptions.validation.type = 'number';
            modified = true;
            validationFixes++;
          }
        }

        // 2. Align dependency values with target field types
        if (field.typeOptions && field.typeOptions.dependency) {
          const dep = field.typeOptions.dependency;
          if (
            dep &&
            dep.field &&
            dep.condition &&
            dep.condition.value !== undefined
          ) {
            // Find target field
            let targetField = null;
            json.fieldSets.forEach((fsEntry2) => {
              if (fsEntry2.fields) {
                const found = fsEntry2.fields.find((f) => f.name === dep.field);
                if (found) targetField = found;
              }
            });

            if (targetField) {
              if (targetField.type === 'checkbox') {
                // Checkbox dependency values must be boolean literals false/true
                if (typeof dep.condition.value !== 'boolean') {
                  const boolVal =
                    dep.condition.value === 'true' ||
                    dep.condition.value === true;
                  console.log(
                    `[DEPENDENCY] Converting checkbox dependency value to boolean in ${path.relative(rootDir, file)} -> field "${field.name}" depends on "${dep.field}" = ${boolVal}`
                  );
                  dep.condition.value = boolVal;
                  modified = true;
                  dependencyFixes++;
                }
              } else {
                // Non-checkbox dependency values must be string representations
                if (typeof dep.condition.value !== 'string') {
                  const strVal = String(dep.condition.value);
                  console.log(
                    `[DEPENDENCY] Converting dependency value to string in ${path.relative(rootDir, file)} -> field "${field.name}" depends on "${dep.field}" = "${strVal}"`
                  );
                  dep.condition.value = strVal;
                  modified = true;
                  dependencyFixes++;
                }
              }
            }
          }
        }

        // 3. Remove dataType from non-primitive input fields (like select, colorPicker, length, itemSelector)
        const nonInputTypes = [
          'select',
          'colorPicker',
          'length',
          'itemSelector',
        ];
        if (
          nonInputTypes.includes(field.type) &&
          field.dataType !== undefined
        ) {
          console.log(
            `[DATATYPE] Removing redundant dataType "${field.dataType}" from "${field.type}" field in ${path.relative(rootDir, file)} -> field "${field.name}"`
          );
          delete field.dataType;
          modified = true;
          dataTypeFixes++;
        }

        // 4. Ensure defaultValue is a string for type "text" fields (excluding numeric fields)
        if (
          field.type === 'text' &&
          field.defaultValue !== undefined &&
          field.defaultValue !== null
        ) {
          if (
            field.dataType !== 'number' &&
            typeof field.defaultValue !== 'string'
          ) {
            const strVal = String(field.defaultValue);
            console.log(
              `[DEFAULT_VALUE] Converting defaultValue to string in ${path.relative(rootDir, file)} -> field "${field.name}" from ${field.defaultValue} to "${strVal}"`
            );
            field.defaultValue = strVal;
            modified = true;
            defaultValueFixes++;
          }
        }
      });
    });

    if (modified) {
      fs.writeFileSync(file, JSON.stringify(json, null, 2) + '\n', 'utf8');
    }
  } catch (err) {
    console.error(`Error processing ${file}:`, err.message);
  }
});

console.log(`\nConfiguration schema fixes complete:`);
console.log(`- Removed ${validationFixes} invalid validation types.`);
console.log(
  `- Converted ${dependencyFixes} boolean dependency values to strings.`
);
console.log(`- Removed ${dataTypeFixes} redundant dataType properties.`);
console.log(
  `- Converted ${defaultValueFixes} text field default values to strings.`
);
