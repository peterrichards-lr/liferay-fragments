// tests/global-setup.js
const globalSetupOrchestrator = require('../setup/orchestrator');
module.exports = globalSetupOrchestrator;

if (require.main === module) {
  const mockConfig = {
    projects: [
      {
        use: {
          baseURL: process.env.BASE_URL || 'http://localhost:8081',
          storageState: './state.json',
        },
      },
    ],
  };
  globalSetupOrchestrator(mockConfig)
    .then(() => {
      console.log('Setup completed successfully.');
      process.exit(0);
    })
    .catch((err) => {
      console.error('Setup failed:', err);
      process.exit(1);
    });
}
