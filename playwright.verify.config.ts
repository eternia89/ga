import { defineConfig, devices } from '@playwright/test';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config({ path: path.resolve(__dirname, '.env.local') });

/**
 * Standalone Playwright config for seed verification.
 * No global setup, no auth state files — tests log in fresh.
 * Usage: npm run verify:seed
 */
export default defineConfig({
  testDir: 'e2e/tests/seed-verify',
  fullyParallel: false, // run sequentially to avoid auth conflicts
  retries: 1,
  timeout: 60_000,
  reporter: [['list'], ['html', { open: 'on-failure', outputFolder: 'playwright-report-verify' }]],

  use: {
    baseURL: 'http://localhost:3000',
    viewport: { width: 1440, height: 900 },
    screenshot: 'only-on-failure',
    trace: 'on-first-retry',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: true, // don't start a new server if one is already running
    timeout: 30_000,
    cwd: __dirname,
  },
});
