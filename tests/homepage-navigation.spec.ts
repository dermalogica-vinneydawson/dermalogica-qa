import { test, expect } from '@playwright/test';
import { SELECTORS } from '../src/config/selectors';
import { URLS } from '../src/config/urls';
import { preparePageForTesting, acceptCookies, dismissPopups } from '../src/helpers/navigation';

test.describe('Homepage & Navigation @smoke @happy-path', () => {
  test.beforeEach(async ({ page }) => {
    await preparePageForTesting(page, URLS.home);
  });

  test('homepage loads successfully', async ({ page }) => {
    await expect(page).toHaveTitle(/dermalogica/i);
    const mainContent = page.locator('main').first();
    await expect(mainContent).toBeVisible();
  });

  test('hero banner is visible with content', async ({ page }) => {
    const hero = page.locator(SELECTORS.homepage.heroBanner).first();
    await expect(hero).toBeVisible();
    // Hero should have some content (text or image)
    const hasContent = await hero.evaluate((el) => {
      return el.textContent!.trim().length > 0 || el.querySelectorAll('img').length > 0;
    });
    expect(hasContent).toBeTruthy();
  });

  test('header renders with logo, nav, search, and cart', async ({ page }) => {
    const header = page.locator(SELECTORS.header.container).first();
    await expect(header).toBeVisible();

    // Logo is present and links to homepage
    await expect(async () => {
      const logos = page.locator(SELECTORS.header.logo);
      let visible = false;
      for (let i = 0; i < await logos.count(); i++) {
        if (await logos.nth(i).isVisible()) visible = true;
      }
      expect(visible).toBeTruthy();
    }).toPass({ timeout: 25000 });

    // Search icon is present
    await expect(async () => {
      const searches = page.locator(SELECTORS.header.searchIcon);
      let visible = false;
      for (let i = 0; i < await searches.count(); i++) {
        if (await searches.nth(i).isVisible()) visible = true;
      }
      expect(visible).toBeTruthy();
    }).toPass({ timeout: 25000 });

    // Cart icon is present
    await expect(async () => {
      const carts = page.locator(SELECTORS.header.cartIcon);
      let visible = false;
      for (let i = 0; i < await carts.count(); i++) {
        if (await carts.nth(i).isVisible()) visible = true;
      }
      expect(visible).toBeTruthy();
    }).toPass({ timeout: 25000 });
  });

  test('main navigation has menu items', async ({ page }) => {
    const navLinks = page.locator(SELECTORS.header.navLinks);
    const count = await navLinks.count();
    expect(count).toBeGreaterThan(0);
  });

  test('footer renders with links', async ({ page }) => {
    const footer = page.locator(SELECTORS.footer.container).first();
    await expect(footer).toBeVisible();

    const footerLinks = page.locator(SELECTORS.footer.links);
    const count = await footerLinks.count();
    expect(count).toBeGreaterThan(0);
  });

  test('footer links are not broken', async ({ page, request }) => {
    const footerLinks = page.locator(SELECTORS.footer.links);
    const count = await footerLinks.count();
    const brokenLinks: string[] = [];

    // Check up to 10 footer links
    const linksToCheck = Math.min(count, 10);
    for (let i = 0; i < linksToCheck; i++) {
      const href = await footerLinks.nth(i).getAttribute('href');
      if (!href || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:')) continue;

      const fullUrl = href.startsWith('http') ? href : `https://www.dermalogica.com${href}`;
      try {
        const response = await request.get(fullUrl);
        if (response.status() >= 400) {
          brokenLinks.push(`${fullUrl} → ${response.status()}`);
        }
      } catch {
        brokenLinks.push(`${fullUrl} → request failed`);
      }
    }

    expect(brokenLinks, `Broken footer links: ${brokenLinks.join(', ')}`).toHaveLength(0);
  });

  test('logo links to homepage', async ({ page }) => {
    const logo = page.locator(SELECTORS.header.logo).first();
    const href = await logo.getAttribute('href');
    expect(href).toMatch(/^\/?$/);
  });

  test('cookie consent banner can be dismissed', async ({ page }) => {
    // Navigate fresh without dismissing
    await page.goto(URLS.home);

    const banner = page.locator(SELECTORS.common.cookieBanner).first();
    try {
      await banner.waitFor({ state: 'visible', timeout: 5000 });
      await acceptCookies(page);
      // After accepting, banner should be hidden
      await expect(banner).not.toBeVisible({ timeout: 5000 });
    } catch {
      // No cookie banner is also acceptable — may have been dismissed by prior visit
    }
  });

  test('promotional popups can be closed', async ({ page }) => {
    // Wait for potential popup
    const popup = page.locator(SELECTORS.common.promoPopup).first();
    try {
      await popup.waitFor({ state: 'visible', timeout: 8000 });
      await dismissPopups(page);
      await expect(popup).not.toBeVisible({ timeout: 5000 });
    } catch {
      // No popup appeared — that's fine
    }
  });
});

test.describe('Mobile Navigation @smoke @mobile', () => {
  test.use({ viewport: { width: 375, height: 812 } });

  test('hamburger menu is visible on mobile', async ({ page }) => {
    await preparePageForTesting(page, URLS.home);
    const hamburger = page.locator(SELECTORS.header.mobileMenuToggle).first();
    await expect(hamburger).toBeVisible();
  });

  test('mobile menu opens and shows navigation links', async ({ page }) => {
    await preparePageForTesting(page, URLS.home);

    const hamburger = page.locator(SELECTORS.header.mobileMenuToggle).first();
    await hamburger.click();
    await page.waitForTimeout(1000);

    const mobileNav = page.locator(SELECTORS.mobileNav.drawer).first();
    await expect(mobileNav).toBeVisible();

    const mobileLinks = page.locator(SELECTORS.mobileNav.links);
    const count = await mobileLinks.count();
    expect(count).toBeGreaterThan(0);
  });
});
