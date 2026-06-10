// scripts/inspect-batch-logs.js
const { execSync } = require('child_process');

try {
  console.log('=== Searching Liferay Logs for Batch / Structure Import ===');
  const logs = execSync('docker logs fragments-test-env', { encoding: 'utf8' });
  const lines = logs.split('\n');
  const filtered = lines.filter(
    (line) =>
      line.toLowerCase().includes('batch') ||
      line.toLowerCase().includes('structure') ||
      line.toLowerCase().includes('slider-slide-struct') ||
      line.toLowerCase().includes('error') ||
      line.toLowerCase().includes('fail')
  );

  console.log(`Found ${filtered.length} matching log lines. Showing last 50:`);
  console.log(filtered.slice(-50).join('\n'));
} catch (e) {
  console.error('Failed to inspect logs:', e.message);
}
