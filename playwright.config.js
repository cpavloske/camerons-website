// Local test script for the Uptime O's redesign (DESIGN.md section 16).
// Run: npm test   (first time: npm run test:install)
const { defineConfig, devices } = require('@playwright/test');

const PORT = 8000;

module.exports = defineConfig({
  testDir: './tests',
  timeout: 30_000,
  fullyParallel: true,
  reporter: [['list']],
  use: {
    baseURL: `http://localhost:${PORT}`,
    ...devices['Desktop Chrome'],
  },
  projects: [{ name: 'chromium', use: { browserName: 'chromium' } }],
  webServer: {
    command: `python3 -m http.server ${PORT}`,
    url: `http://localhost:${PORT}/`,
    reuseExistingServer: true,
    timeout: 15_000,
  },
});
