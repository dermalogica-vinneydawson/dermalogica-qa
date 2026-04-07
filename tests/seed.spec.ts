import { test, expect } from '@playwright/test';

import { preparePageForTesting } from '../src/helpers/navigation';
import { URLS } from '../src/config/urls';

test.describe('Automation Seed', () => {
  test('seed', async ({ page }) => {
    // This is the bootstrap environment for the AI Planner and Generator
    await preparePageForTesting(page, URLS.home);
  });
});
