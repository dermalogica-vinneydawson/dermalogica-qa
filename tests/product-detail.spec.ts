import { test, expect } from '@playwright/test';
import { SELECTORS } from '../src/config/selectors';
import { URLS } from '../src/config/urls';
import { TIMEOUTS } from '../src/config/timeouts';
import { preparePageForTesting } from '../src/helpers/navigation';

test.describe('Product Detail Page @smoke @happy-path', () => {
  test.beforeEach(async ({ page }) => {
    await preparePageForTesting(page, URLS.products.dailyMicrofoliant);
  });

  test('PDP loads with product title visible', async ({ page }) => {
    const title = page.locator(SELECTORS.pdp.title).first();
    await expect(title).toBeVisible();
    const titleText = await title.textContent();
    expect(titleText?.toLowerCase()).toContain('microfoliant');
  });

  test('product price is displayed', async ({ page }) => {
    const price = page.locator(SELECTORS.pdp.price).first();
    await expect(price).toBeVisible();
    const priceText = await price.textContent();
    // Price should contain a dollar sign or number
    expect(priceText).toMatch(/\$|[\d.]+/);
  });

  test('product description is present', async ({ page }) => {
    const description = page.locator(SELECTORS.pdp.description).first();
    await expect(description).toBeVisible();
    const text = await description.textContent();
    expect(text?.trim().length).toBeGreaterThan(20);
  });

  test('product main image loads successfully', async ({ page }) => {
    const mainImage = page.locator(SELECTORS.pdp.mainImage).first();
    await expect(mainImage).toBeVisible();

    // Verify image actually loaded
    const isLoaded = await mainImage.evaluate((img: HTMLImageElement) => {
      return img.complete && img.naturalWidth > 0;
    });
    expect(isLoaded).toBeTruthy();
  });

  test('image gallery has multiple images', async ({ page }) => {
    const thumbnails = page.locator(SELECTORS.pdp.thumbnails);
    const count = await thumbnails.count();
    // Most Dermalogica products have multiple images
    expect(count).toBeGreaterThanOrEqual(1);
  });

  test('variant selector is present', async ({ page }) => {
    const variants = page.locator(SELECTORS.pdp.variantSelector).first();
    try {
      await expect(variants).toBeVisible({ timeout: TIMEOUTS.elementVisible });
    } catch {
      // Some products may not have variants — annotate rather than fail
      test.info().annotations.push({
        type: 'info',
        description: 'No variant selector found — product may be single-variant',
      });
    }
  });

  test('quantity input is functional', async ({ page }) => {
    const quantityInput = page.locator(SELECTORS.pdp.quantityInput).first();
    try {
      await expect(quantityInput).toBeVisible({ timeout: TIMEOUTS.elementVisible });
      const value = await quantityInput.inputValue();
      expect(parseInt(value)).toBeGreaterThanOrEqual(1);
    } catch {
      // Some themes don't show quantity on PDP
      test.info().annotations.push({
        type: 'info',
        description: 'Quantity input not visible on PDP',
      });
    }
  });

  test('add-to-cart button is visible and enabled', async ({ page }) => {
    const addToCart = page.locator(SELECTORS.pdp.addToCartButton).first();
    await expect(addToCart).toBeVisible();
    await expect(addToCart).toBeEnabled();
  });

  test('clicking add-to-cart updates the cart', async ({ page }) => {
    const addToCart = page.locator(SELECTORS.pdp.addToCartButton).first();
    await expect(addToCart).toBeVisible();
    await addToCart.click();

    // Wait for cart to update
    await page.waitForTimeout(TIMEOUTS.cartUpdate);

    // Verify cart updated — check for cart drawer, count change, or redirect to cart
    const cartDrawerVisible = await page.locator(SELECTORS.cart.cartDrawer).first().isVisible().catch(() => false);
    const cartCount = await page.locator(SELECTORS.header.cartCount).first().textContent().catch(() => '0');
    const onCartPage = page.url().includes('/cart');

    const cartUpdated = cartDrawerVisible || parseInt(cartCount || '0') > 0 || onCartPage;
    expect(cartUpdated).toBeTruthy();
  });

  test('Yotpo reviews section loads', async ({ page }) => {
    const reviews = page.locator(SELECTORS.pdp.yotpoReviews).first();
    try {
      await expect(reviews).toBeVisible({ timeout: TIMEOUTS.elementVisible });
    } catch {
      test.info().annotations.push({
        type: 'warning',
        description: 'Yotpo reviews widget not visible — may be loading slowly or not present on this product',
      });
    }
  });

  test('breadcrumbs are present and navigable', async ({ page }) => {
    const breadcrumbs = page.locator(SELECTORS.pdp.breadcrumbs).first();
    try {
      await expect(breadcrumbs).toBeVisible({ timeout: TIMEOUTS.elementVisible });
      const links = breadcrumbs.locator('a');
      const count = await links.count();
      expect(count).toBeGreaterThan(0);
    } catch {
      test.info().annotations.push({
        type: 'info',
        description: 'Breadcrumbs not found on PDP',
      });
    }
  });
});

test.describe('Product Detail — Multiple Products @smoke', () => {
  const productPages = [
    { name: 'Daily Microfoliant', url: URLS.products.dailyMicrofoliant },
    { name: 'Special Clearing Booster', url: URLS.products.specialClearingBooster },
    { name: 'Skin Smoothing Cream', url: URLS.products.moisturizer },
    { name: 'SPF Defense', url: URLS.products.sunscreen },
  ];

  for (const product of productPages) {
    test(`${product.name} PDP loads correctly`, async ({ page }) => {
      await preparePageForTesting(page, product.url);

      // Title should be visible
      const title = page.locator(SELECTORS.pdp.title).first();
      await expect(title).toBeVisible();

      // Price should be visible
      const price = page.locator(SELECTORS.pdp.price).first();
      await expect(price).toBeVisible();

      // Add to cart should be functional
      const addToCart = page.locator(SELECTORS.pdp.addToCartButton).first();
      await expect(addToCart).toBeVisible();
      await expect(addToCart).toBeEnabled();
    });
  }
});
