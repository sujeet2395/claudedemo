const { defineConfig, devices } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './tests/e2e',
  // Quadratic tests need http:// (Chrome blocks fetch from file://).
  webServer: {
    command: 'node server.js',
    url: 'http://localhost:3100',
    env: { PORT: '3100' },
    reuseExistingServer: true,
  },
  projects: [
    {
      name: 'chrome',
      use: {
        ...devices['Desktop Chrome'],
        channel: 'chrome',   // real Google Chrome; use 'msedge' for Edge
        headless: false,     // show the browser window
        launchOptions: { slowMo: 500 }, // optional: 500 ms pause between actions
      },
    },
  ],
});