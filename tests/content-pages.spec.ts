import { test, expect } from '@playwright/test';
import { URLS } from '../src/config/urls';
import { TIMEOUTS } from '../src/config/timeouts';
import { preparePageForTesting } from '../src/helpers/navigation';

test.describe('Content Pages @smoke', () => {
  test('blog page loads with article listings', async ({ page }) => {
    await preparePageForTesting(page, URLS.content.blog);

    // Page should have content
    const bodyText = await page.textContent('body');
    expect(bodyText?.trim().length).toBeGreaterThan(100);

    // Should have article links
    const articleLinks = page.locator('article a, .blog-post a, .article-card a, main a');
    const count = await articleLinks.count();
    expect(count).toBeGreaterThan(0);
  });

  test('about us page loads with content', async ({ page }) => {
    await preparePageForTesting(page, URLS.content.aboutUs);

    const bodyText = await page.textContent('main, body');
    expect(bodyText?.trim().length).toBeGreaterThan(100);
  });

  test('contact us page loads with form', async ({ page }) => {
    await preparePageForTesting(page, URLS.content.contactUs);

    const bodyText = await page.textContent('body');
    expect(bodyText?.trim().length).toBeGreaterThan(50);

    // Look for contact form elements
    const hasForm = await page.locator('form').count();
    const hasContactInfo = bodyText?.toLowerCase().includes('contact') ||
      bodyText?.toLowerCase().includes('email') ||
      bodyText?.toLowerCase().includes('phone');

    expect(hasForm > 0 || hasContactInfo).toBeTruthy();
  });

  test('privacy policy page loads', async ({ page }) => {
    await preparePageForTesting(page, URLS.content.privacyPolicy);

    const bodyText = await page.textContent('body');
    const hasPrivacyContent = bodyText?.toLowerCase().includes('privacy') ||
      bodyText?.toLowerCase().includes('personal information') ||
      bodyText?.toLowerCase().includes('data');
    expect(hasPrivacyContent).toBeTruthy();
  });

  test('terms of service page loads', async ({ page }) => {
    await preparePageForTesting(page, URLS.content.termsOfService);

    const bodyText = await page.textContent('body');
    const hasTermsContent = bodyText?.toLowerCase().includes('terms') ||
      bodyText?.toLowerCase().includes('conditions') ||
      bodyText?.toLowerCase().includes('agreement');
    expect(hasTermsContent).toBeTruthy();
  });

  test('shipping policy page loads', async ({ page }) => {
    await preparePageForTesting(page, URLS.content.shippingPolicy);

    const bodyText = await page.textContent('body');
    const hasShippingContent = bodyText?.toLowerCase().includes('shipping') ||
      bodyText?.toLowerCase().includes('delivery') ||
      bodyText?.toLowerCase().includes('order');
    expect(hasShippingContent).toBeTruthy();
  });

  test('refund policy page loads', async ({ page }) => {
    await preparePageForTesting(page, URLS.content.refundPolicy);

    const bodyText = await page.textContent('body');
    const hasRefundContent = bodyText?.toLowerCase().includes('refund') ||
      bodyText?.toLowerCase().includes('return') ||
      bodyText?.toLowerCase().includes('exchange');
    expect(hasRefundContent).toBeTruthy();
  });

  test('404 page handles non-existent URL gracefully', async ({ page }) => {
    const response = await page.goto(URLS.notFound, {
      waitUntil: 'domcontentloaded',
      timeout: TIMEOUTS.pageLoad,
    });

    // Should return 404 status
    if (response) {
      expect(response.status()).toBe(404);
    }

    // Page should still render with helpful content
    const bodyText = await page.textContent('body');
    expect(bodyText?.trim().length).toBeGreaterThan(0);

    // Should have navigation to get back to the site
    const hasNav = await page.locator('nav, header a, a[href="/"]').count();
    expect(hasNav).toBeGreaterThan(0);
  });
});
