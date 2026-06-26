const fs = require('fs');
const { globSync } = require('glob');

const configFiles = globSync('**/configuration.json', {
  ignore: ['node_modules/**', 'temp_extract/**', 'temp_inspect/**', '.ldm/**'],
});

let modifiedCount = 0;
let checkboxesFixed = 0;

configFiles.forEach((file) => {
  try {
    const data = fs.readFileSync(file, 'utf8');
    const json = JSON.parse(data);
    let modified = false;

    if (json.fieldSets) {
      json.fieldSets.forEach((fs) => {
        if (fs.fields) {
          fs.fields.forEach((field) => {
            if (field.type === 'checkbox' && field.dataType !== 'boolean') {
              field.dataType = 'boolean';
              modified = true;
              checkboxesFixed++;
            }
          });
        }
      });
    }

    if (modified) {
      fs.writeFileSync(file, JSON.stringify(json, null, 2) + '\n', 'utf8');
      modifiedCount++;
    }
  } catch (e) {
    console.error(`Error processing ${file}: ${e.message}`);
  }
});

console.log(
  `Fixed ${checkboxesFixed} checkboxes across ${modifiedCount} configuration files.`
);
