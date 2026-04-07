import { Page, TestInfo } from '@playwright/test';
import { SELECTORS } from '../config/selectors';

/**
 * Detect whether an hCaptcha or reCAPTCHA is present on the page.
 */
export async function detectCaptcha(page: Page): Promise<'hcaptcha' | 'recaptcha' | null> {
  const hCaptcha = page.locator(SELECTORS.captcha.hCaptcha).first();
  const reCaptcha = page.locator(SELECTORS.captcha.recaptcha).first();

  try {
    if (await hCaptcha.isVisible({ timeout: 2000 })) return 'hcaptcha';
  } catch { /* not visible */ }

  try {
    if (await reCaptcha.isVisible({ timeout: 2000 })) return 'recaptcha';
  } catch { /* not visible */ }

  return null;
}

/**
 * If a captcha is detected, skip the test with an annotation.
 * Call this before interacting with captcha-protected forms.
 * Returns true if captcha was found (test should stop).
 */
export async function skipIfCaptcha(page: Page, testInfo: TestInfo): Promise<boolean> {
  const captchaType = await detectCaptcha(page);

  if (captchaType) {
    testInfo.annotations.push({
      type: 'captcha-blocked',
      description: `Test skipped: ${captchaType} detected. Cannot automate captcha solving.`,
    });
    testInfo.skip(true, `${captchaType} detected — cannot automate`);
    return true;
  }

  return false;
}
