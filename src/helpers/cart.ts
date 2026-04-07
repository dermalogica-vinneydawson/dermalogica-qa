import { Page, expect } from '@playwright/test';
import { SELECTORS } from '../config/selectors';
import { URLS } from '../config/urls';
import { TIMEOUTS } from '../config/timeouts';
import { preparePageForTesting } from './navigation';

/**
 * Add a product to the cart by navigating to its PDP and clicking Add to Cart.
 * Returns the product name for verification.
 */
export async function addProductToCart(
  page: Page,
  productPath: string = URLS.products.dailyMicrofoliant
): Promise<string> {
  await preparePageForTesting(page, productPath);

  // Get the product title for verification
  const titleElement = page.locator(SELECTORS.pdp.title).first();
  await titleElement.waitFor({ state: 'visible', timeout: TIMEOUTS.elementVisible });
  const productName = (await titleElement.textContent())?.trim() || 'Unknown Product';

  // Click add to cart
  const addToCartBtn = page.locator(SELECTORS.pdp.addToCartButton).first();
  await addToCartBtn.waitFor({ state: 'visible', timeout: TIMEOUTS.elementVisible });
  await addToCartBtn.click();

  // Wait for cart to update
  await page.waitForTimeout(TIMEOUTS.cartUpdate);

  return productName;
}

/**
 * Clear all items from the cart.
 */
export async function clearCart(page: Page): Promise<void> {
  await page.goto(URLS.cart, {
    waitUntil: 'domcontentloaded',
    timeout: TIMEOUTS.pageLoad,
  });

  // Remove items one by one
  let attempts = 0;
  while (attempts < 10) {
    const removeButtons = page.locator(SELECTORS.cart.removeButton);
    const count = await removeButtons.count();
    if (count === 0) break;

    try {
      await removeButtons.first().click();
      await page.waitForTimeout(TIMEOUTS.cartUpdate);
    } catch {
      break;
    }
    attempts++;
  }
}

/**
 * Get the current cart item count from the header badge.
 */
export async function getCartCount(page: Page): Promise<number> {
  try {
    const countElement = page.locator(SELECTORS.header.cartCount).first();
    const text = await countElement.textContent({ timeout: 3000 });
    const count = parseInt(text?.trim() || '0', 10);
    return isNaN(count) ? 0 : count;
  } catch {
    return 0;
  }
}

/**
 * Navigate to the cart page and verify it loaded.
 */
export async function goToCart(page: Page): Promise<void> {
  await page.goto(URLS.cart, {
    waitUntil: 'domcontentloaded',
    timeout: TIMEOUTS.pageLoad,
  });
  await page.waitForLoadState('networkidle', { timeout: TIMEOUTS.networkIdle }).catch(() => {});
}
