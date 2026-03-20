const fs = require('fs');
const path = require('path');
const { globSync } = require('glob');

const ftlFiles = globSync('**/*.ftl', { ignore: 'node_modules/**' });

console.log(`Beautifying ${ftlFiles.length} FreeMarker files...`);

ftlFiles.forEach((file) => {
  let content = fs.readFileSync(file, 'utf8');
  const original = content;

  // 1. Ensure prettier-ignore is on its own line BEFORE the tag
  content = content.replace(
    /\[#-- prettier-ignore --\]\s*(\[#|\[@)/g,
    '[#-- prettier-ignore --]\n$1'
  );

  // 2. Separate back-to-back FTL tags
  // Specifically looks for ][ or }[, but ignores closing tags like /]
  content = content.replace(/\]([ \t]*)\[(?![^/]*\])/g, ']\n[');
  content = content.replace(/\}([ \t]*)\[/g, '}\n[');

  // 3. Ensure logic tags are on new lines if joined with other content
  const blockTags = [
    'if',
    'else',
    'elseif',
    'list',
    'assign',
    'attempt',
    'recover',
    'macro',
    'function',
    'switch',
    'case',
    'default',
    'break',
  ];
  blockTags.forEach((tag) => {
    // Newline BEFORE opening tag
    const openRegex = new RegExp(`([^\\n\\s])\\[#${tag}`, 'g');
    content = content.replace(openRegex, '$1\n[#' + tag);

    // Newline AFTER closing tag
    const closeRegex = new RegExp(`\\[/#${tag}\\]([^\\n\\s])`, 'g');
    content = content.replace(closeRegex, '[/#' + tag + ']\n$1');
  });

  // 4. Force multi-line [#assign] for readability
  content = content.replace(/\[#assign([\s\S]*?)\/\]/g, (match, body) => {
    if (body.includes(',') || body.length > 60) {
      const assignments = body.match(/[^=]+=[^=]+(?=,|$)/g);
      if (assignments) {
        const lines = assignments.map((a) => a.trim().replace(/,$/, ''));
        return `[#assign\n  ${lines.join(',\n  ')}\n/]`;
      }
    }
    return match;
  });

  // 5. Normalization
  content = content
    .split('\n')
    .map((line) => line.trimRight())
    .join('\n');
  content = content.replace(/\n\s*\n\s*\n/g, '\n\n');

  if (content !== original) {
    fs.writeFileSync(file, content);
    console.log(`  Formatted: ${file}`);
  }
});

console.log('FTL Beautification complete.');
