// scripts/inspect-batch-logs.js
const { execSync } = require('child_process');

try {
  console.log('=== Searching Liferay Logs for Batch / Structure Import ===');
  const logs = execSync(
    'ldm logs e2e-test-env liferay -n 1000 -g "batch|structure|slider-slide-struct|error|fail" --grep-i',
    {
      encoding: 'utf8',
    }
  );
  const lines = logs.split('\n');
  const filtered = lines.filter((line) => line.trim().length > 0);

  console.log(`Found ${filtered.length} matching log lines. Showing last 50:`);
  console.log(filtered.slice(-50).join('\n'));
} catch (e) {
  console.error('Failed to inspect logs:', e.message);
}
