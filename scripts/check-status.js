// scripts/check-status.js
const { execSync } = require('child_process');

try {
  console.log('=== Liferay Container Status ===');
  const ldmStatus = execSync('ldm list', { encoding: 'utf8' });
  console.log(ldmStatus);

  console.log('=== Running Processes ===');
  const psOutput = execSync(
    'ps aux | grep -E "playwright|node|test-runner.sh" | grep -v grep',
    { encoding: 'utf8' }
  );
  console.log(psOutput);

  console.log('=== Tail of Playwright Log ===');
  const logTail = execSync('tail -n 20 e2e-tests/playwright_output.log', {
    encoding: 'utf8',
  });
  console.log(logTail);

  console.log('=== Liferay LDM Logs Tail ===');
  try {
    const ldmLogs = execSync('ldm logs e2e-test-env liferay -n 30', {
      encoding: 'utf8',
    });
    console.log(ldmLogs);
  } catch (e) {
    console.log('Failed to fetch ldm logs:', e.message);
  }
} catch (err) {
  console.log('Error executing diagnostics:', err.message);
}
