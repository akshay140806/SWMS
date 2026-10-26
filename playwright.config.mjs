import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  globalSetup: './tests/global-setup.mjs',
  fullyParallel: false,
  workers: 1, // one backend + one DB: serial execution avoids cross-test state races
  retries: 1,
  reporter: [['html', { open: 'never' }], ['list']],
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure'
  },
  webServer: [
    {
      command: 'node server.js',
      cwd: './server',
      port: 5000,
      reuseExistingServer: true,
      timeout: 120000,
      env: { ...process.env, USE_MEMORY_DB: 'true', PORT: '5000', NODE_ENV: 'test' }
    },
    {
      command: 'node ./node_modules/vite/bin/vite.js --port 5173',
      cwd: './client',
      url: 'http://localhost:5173',
      reuseExistingServer: true,
      timeout: 120000
    }
  ],
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'mobile', use: { ...devices['Pixel 5'] } }
  ]
});
