const fs = require('fs');
const path = require('path');
const { globSync } = require('glob');

const files = globSync('gemini-generated/fragments/**/test-data.json');

files.forEach((file) => {
  console.log(`\n=========================================`);
  console.log(`File: ${file}`);
  try {
    const data = JSON.parse(fs.readFileSync(file, 'utf8'));
    const keys = Object.keys(data);
    console.log(`Keys: ${keys.join(', ')}`);
    if (data.webContentStructures) {
      console.log(
        `- Web Content Structures: ${data.webContentStructures.map((s) => s.externalReferenceCode).join(', ')}`
      );
    }
    if (data.webContentArticles) {
      console.log(
        `- Web Content Articles: ${data.webContentArticles.map((a) => a.externalReferenceCode).join(', ')}`
      );
    }
    if (data.collections) {
      console.log(
        `- Collections: ${data.collections.map((c) => c.externalReferenceCode).join(', ')}`
      );
    }
  } catch (err) {
    console.error(`Error parsing ${file}: ${err.message}`);
  }
});
