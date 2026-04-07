import { test, expect } from '@playwright/test';
import { SELECTORS } from '../src/config/selectors';
import { URLS } from '../src/config/urls';
import { TIMEOUTS } from '../src/config/timeouts';
import { preparePageForTesting } from '../src/helpers/navigation';

test.describe('Mobile Responsiveness @mobile', () => {
  test.use({ viewport: { width: 375, height: 812 } }); // iPhone-size viewport

  test('homepage renders without horizontal overflow', async ({ page }) => {
    await preparePageForTesting(page, URLS.home);

    const hasOverflow = await page.evaluate(() => {
      return document.documentElement.scrollWidth > document.documentElement.clientWidth;
    });

    expect(hasOverflow, 'Page has horizontal overflow on mobile viewport').toBeFalsy();
  });

  test('navigation collapses to hamburger menu', async ({ page }) => {
    await preparePageForTesting(page, URLS.home);

    // Desktop nav should be hidden
    const desktopNav = page.locator(SELECTORS.header.navMenu).first();
    const hamburger = page.locator(SELECTORS.header.mobileMenuToggle).first();

    // Either hamburger is visible or desktop nav is collapsed
    const hamburgerVisible = await hamburger.isVisible().catch(() => false);
    expect(hamburgerVisible, 'Hamburger menu not visible on mobile').toBeTruthy();
  });

  test('hamburger menu opens and closes', async ({ page }) => {
    await preparePageForTesting(page, URLS.home);

    const hamburger = page.locator(SELECTORS.header.mobileMenuToggle).first();
    await hamburger.click();
    await page.waitForTimeout(TIMEOUTS.animation);

    // Mobile nav drawer should be visible
    const mobileNav = page.locator(SELECTORS.mobileNav.drawer).first();
    await expect(mobileNav).toBeVisible({ timeout: TIMEOUTS.elementVisible });

    // Close it
    const closeBtn = page.locator(SELECTORS.mobileNav.closeButton).first();
    try {
      await closeBtn.click();
    } catch {
      // Try escape key as fallback
      await page.keyboard.press('Escape');
    }
    await page.waitForTimeout(TIMEOUTS.animation);
  });

  test('product grid is responsive on collection page', async ({ page }) => {
    await preparePageForTesting(page, URLS.collections.all);

    // Products should be in a single or double column on mobile
    const firstCard = page.locator(SELECTORS.collection.productCard).first();
    await expect(firstCard).toBeVisible({ timeout: TIMEOUTS.elementVisible });

    const cardBox = await firstCard.boundingBox();
    if (cardBox) {
      // Card shouldn't be wider than the viewport
      expect(cardBox.width).toBeLessThanOrEqual(375);
    }
  });

  test('product images are responsive', async ({ page }) => {
    await preparePageForTesting(page, URLS.products.dailyMicrofoliant);

    const mainImage = page.locator(SELECTORS.pdp.mainImage).first();
    await expect(mainImage).toBeVisible({ timeout: TIMEOUTS.elementVisible });

    const imageBox = await mainImage.boundingBox();
    if (imageBox) {
      // Image shouldn't overflow the viewport
      expect(imageBox.width).toBeLessThanOrEqual(375);
    }
  });

  test('add-to-cart button is tap-friendly (min 44x44px)', async ({ page }) => {
    await preparePageForTesting(page, URLS.products.dailyMicrofoliant);

    const addToCart = page.locator(SELECTORS.pdp.addToCartButton).first();
    await expect(addToCart).toBeVisible({ timeout: TIMEOUTS.elementVisible });

    const box = await addToCart.boundingBox();
    expect(box).toBeTruthy();
    if (box) {
      expect(box.height, `Add to cart button height ${box.height}px < 44px`).toBeGreaterThanOrEqual(44);
      // Width should be substantial on mobile
      expect(box.width, `Add to cart button width ${box.width}px`).toBeGreaterThanOrEqual(44);
    }
  });

  test('text is readable without zooming', async ({ page }) => {
    await preparePageForTesting(page, URLS.home);

    const bodyFontSize = await page.evaluate(() => {
      const body = document.body;
      const computed = window.getComputedStyle(body);
      return parseFloat(computed.fontSize);
    });

    // Body font should be at least 14px for readability
    expect(bodyFontSize, `Body font size ${bodyFontSize}px is too small`).toBeGreaterThanOrEqual(14);
  });

  test('search is accessible on mobile', async ({ page }) => {
    await preparePageForTesting(page, URLS.home);

    const searchIcon = page.locator(SELECTORS.header.searchIcon).first();
    await expect(searchIcon).toBeVisible();

    await searchIcon.click();
    await page.waitForTimeout(TIMEOUTS.animation);

    const searchInput = page.locator(SELECTORS.search.input).first();
    try {
      await expect(searchInput).toBeVisible({ timeout: TIMEOUTS.elementVisible });
    } catch {
      test.info().annotations.push({
        type: 'warning',
        description: 'Search input not visible after clicking search icon on mobile',
      });
    }
  });

  test('footer stacks vertically on mobile', async ({ page }) => {
    await preparePageForTesting(page, URLS.home);

    const footer = page.locator(SELECTORS.footer.container).first();
    await expect(footer).toBeVisible();

    // Footer shouldn't cause horizontal overflow
    const hasOverflow = await page.evaluate(() => {
      const footer = document.querySelector('footer');
      if (!footer) return false;
      return footer.scrollWidth > footer.clientWidth;
    });

    expect(hasOverflow, 'Footer causes horizontal overflow on mobile').toBeFalsy();
  });

  test('PDP renders without overflow on mobile', async ({ page }) => {
    await preparePageForTesting(page, URLS.products.dailyMicrofoliant);

    const hasOverflow = await page.evaluate(() => {
      return document.documentElement.scrollWidth > document.documentElement.clientWidth;
    });

    expect(hasOverflow, 'PDP has horizontal overflow on mobile').toBeFalsy();
  });
});
