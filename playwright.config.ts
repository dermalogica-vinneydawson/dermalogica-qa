import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 1,
  workers: 2,
  timeout: 60_000,
  expect: {
    timeout: 15_000,
  },

  reporter: [
    ['html', { outputFolder: 'reports/html', open: 'never' }],
    ['./src/reporters/json-summary.ts', { outputDir: 'reports/json' }],
    ['./src/reporters/markdown-summary.ts', { outputDir: 'reports/markdown' }],
  ],

  use: {
    baseURL: 'https://www.dermalogica.com',
    trace: 'retain-on-failure',
    screenshot: 'on',
    video: 'retain-on-failure',
    actionTimeout: 30_000,
    navigationTimeout: 60_000,
    extraHTTPHeaders: {
      'Accept-Language': 'en-US,en;q=0.9',
      'Sec-Ch-Ua': '"Google Chrome";v="123", "Not:A-Brand";v="8", "Chromium";v="123"',
      'Sec-Fetch-Site': 'none',
    },
    launchOptions: {
      args: ['--disable-blink-features=AutomationControlled'],
    },
  },

  projects: [
    {
      name: 'setup',
      testMatch: /.*\.setup\.ts/,
    },
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
      dependencies: ['setup'],
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    {
      name: 'mobile-chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'mobile-safari',
      use: { ...devices['iPhone 13'] },
    },
  ],

  outputDir: 'test-results',
});
