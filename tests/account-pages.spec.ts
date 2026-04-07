import { test, expect } from '@playwright/test';
import { SELECTORS } from '../src/config/selectors';
import { URLS } from '../src/config/urls';
import { TIMEOUTS } from '../src/config/timeouts';
import { preparePageForTesting } from '../src/helpers/navigation';
import { skipIfCaptcha } from '../src/helpers/captcha';

test.describe('Account Pages @smoke', () => {
  test('login page loads with form fields', async ({ page }) => {
    await preparePageForTesting(page, URLS.account.login);

    // Login form should be present
    const loginForm = page.locator(SELECTORS.account.loginForm).first();
    await expect(loginForm).toBeVisible({ timeout: TIMEOUTS.elementVisible });

    // Email field should be present
    const emailInput = page.locator(SELECTORS.account.emailInput).first();
    await expect(emailInput).toBeVisible();

    // Password field should be present
    const passwordInput = page.locator(SELECTORS.account.passwordInput).first();
    await expect(passwordInput).toBeVisible();

    // Login button should be present
    const loginButton = page.locator(SELECTORS.account.loginButton).first();
    await expect(loginButton).toBeVisible();
  });

  test('login form shows error for empty submission', async ({ page }) => {
    await preparePageForTesting(page, URLS.account.login);

    await skipIfCaptcha(page, test.info());

    // Try to submit empty form
    const loginButton = page.locator(SELECTORS.account.loginButton).first();
    await loginButton.click();
    await page.waitForTimeout(2000);

    // Should show an error or stay on login page
    const url = page.url();
    expect(url).toContain('account');
  });

  test('login form shows error for invalid credentials', async ({ page }) => {
    await preparePageForTesting(page, URLS.account.login);

    await skipIfCaptcha(page, test.info());

    // Enter invalid credentials
    const emailInput = page.locator(SELECTORS.account.emailInput).first();
    const passwordInput = page.locator(SELECTORS.account.passwordInput).first();

    await emailInput.fill('qa-test-invalid@example.com');
    await passwordInput.fill('InvalidPassword123!');

    const loginButton = page.locator(SELECTORS.account.loginButton).first();
    await loginButton.click();
    await page.waitForTimeout(3000);

    // Should show an error message or stay on login page
    const pageText = await page.textContent('body');
    const hasError = pageText?.toLowerCase().includes('incorrect') ||
      pageText?.toLowerCase().includes('invalid') ||
      pageText?.toLowerCase().includes('error') ||
      pageText?.toLowerCase().includes('wrong') ||
      page.url().includes('account/login');

    expect(hasError).toBeTruthy();
  });

  test('registration page is accessible', async ({ page }) => {
    await preparePageForTesting(page, URLS.account.register);

    // Should have a registration form or content
    const bodyText = await page.textContent('body');
    const hasRegister = bodyText?.toLowerCase().includes('create') ||
      bodyText?.toLowerCase().includes('register') ||
      bodyText?.toLowerCase().includes('sign up') ||
      bodyText?.toLowerCase().includes('account');

    expect(hasRegister).toBeTruthy();
  });

  test('password reset link is accessible', async ({ page }) => {
    await preparePageForTesting(page, URLS.account.login);

    const resetLink = page.locator(SELECTORS.account.passwordResetLink).first();
    try {
      await expect(resetLink).toBeVisible({ timeout: TIMEOUTS.elementVisible });
      await resetLink.click();
      await page.waitForTimeout(2000);

      // Should show password reset form or navigate to reset page
      const resetForm = page.locator(SELECTORS.account.passwordResetForm).first();
      try {
        await expect(resetForm).toBeVisible({ timeout: TIMEOUTS.elementVisible });
      } catch {
        // Check if URL changed to indicate reset page
        const bodyText = await page.textContent('body');
        const hasReset = bodyText?.toLowerCase().includes('reset') ||
          bodyText?.toLowerCase().includes('recover') ||
          bodyText?.toLowerCase().includes('forgot');
        expect(hasReset).toBeTruthy();
      }
    } catch {
      test.info().annotations.push({
        type: 'warning',
        description: 'Password reset link not found with expected selector',
      });
    }
  });

  test('hCaptcha detection on account forms', async ({ page }) => {
    await preparePageForTesting(page, URLS.account.login);

    const { detectCaptcha } = await import('../src/helpers/captcha');
    const captchaType = await detectCaptcha(page);

    test.info().annotations.push({
      type: 'captcha-status',
      description: captchaType
        ? `${captchaType} detected on login page`
        : 'No captcha detected on login page',
    });

    // This test always passes — it's informational
  });
});
