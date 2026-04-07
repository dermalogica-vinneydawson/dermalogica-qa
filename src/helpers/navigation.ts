import { Page } from '@playwright/test';
import { SELECTORS } from '../config/selectors';
import { TIMEOUTS } from '../config/timeouts';

/**
 * Navigate to a page and wait for it to be fully loaded.
 */
export async function goToPage(page: Page, path: string): Promise<void> {
  await page.goto(path, {
    waitUntil: 'domcontentloaded',
    timeout: TIMEOUTS.pageLoad,
  });
  await waitForPageReady(page);
}

/**
 * Wait for the page to be interactive — DOM loaded and no active network requests.
 */
export async function waitForPageReady(page: Page): Promise<void> {
  try {
    await page.waitForLoadState('networkidle', { timeout: TIMEOUTS.networkIdle });
  } catch {
    // Network idle timeout is acceptable — third-party scripts may keep connections open.
    // The page is still usable at this point.
  }
}

/**
 * Accept the cookie consent banner if present.
 */
export async function acceptCookies(page: Page): Promise<void> {
  try {
    const acceptButton = page.locator(SELECTORS.common.cookieAccept).first();
    await acceptButton.waitFor({ state: 'visible', timeout: TIMEOUTS.popupDelay });
    await acceptButton.click();
    await page.waitForTimeout(TIMEOUTS.animation);
  } catch {
    // No cookie banner — that's fine
  }
}

/**
 * Dismiss promotional popups, newsletter modals, and other overlays.
 * Should be called after page load before interacting with elements.
 */
export async function dismissPopups(page: Page): Promise<void> {
  // Wait a moment for popups to appear (they often have a delay)
  await page.waitForTimeout(TIMEOUTS.animation);

  // Try multiple close strategies
  const closeSelectors = [
    SELECTORS.common.promoPopupClose,
    'button[aria-label="Close"]',
    'button[aria-label="Close dialog"]',
    '.modal__close',
    '.popup__close',
    '[data-modal-close]',
    '.klaviyo-close-form',
  ];

  for (const selector of closeSelectors) {
    try {
      const closeButton = page.locator(selector).first();
      if (await closeButton.isVisible({ timeout: 1000 })) {
        await closeButton.click();
        await page.waitForTimeout(TIMEOUTS.animation);
      }
    } catch {
      // This close button doesn't exist — try the next
    }
  }

  // Also try pressing Escape as a fallback
  try {
    await page.keyboard.press('Escape');
    await page.waitForTimeout(500);
  } catch {
    // Escape didn't do anything — that's fine
  }
}

/**
 * Full page preparation: navigate, accept cookies, dismiss popups.
 */
export async function preparePageForTesting(page: Page, path: string): Promise<void> {
  await goToPage(page, path);
  await acceptCookies(page);
  await dismissPopups(page);
}
