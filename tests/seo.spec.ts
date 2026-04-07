import { test, expect } from '@playwright/test';
import { SELECTORS } from '../src/config/selectors';
import { URLS } from '../src/config/urls';
import { preparePageForTesting } from '../src/helpers/navigation';

test.describe('SEO Basics @seo', () => {
  test('homepage has a title tag', async ({ page }) => {
    await preparePageForTesting(page, URLS.home);

    const title = await page.title();
    expect(title.length).toBeGreaterThan(0);
    expect(title.toLowerCase()).toContain('dermalogica');

    test.info().annotations.push({
      type: 'seo',
      description: `Homepage title: "${title}"`,
    });
  });

  test('homepage has a meta description', async ({ page }) => {
    await preparePageForTesting(page, URLS.home);

    const metaDesc = await page.locator(SELECTORS.seo.metaDescription).getAttribute('content');
    expect(metaDesc).toBeTruthy();
    expect(metaDesc!.length).toBeGreaterThan(50);

    test.info().annotations.push({
      type: 'seo',
      description: `Homepage meta description: "${metaDesc?.slice(0, 100)}..."`,
    });
  });

  test('PDP has product-specific title', async ({ page }) => {
    await preparePageForTesting(page, URLS.products.dailyMicrofoliant);

    const title = await page.title();
    expect(title.length).toBeGreaterThan(0);
    // Title should contain product name
    expect(title.toLowerCase()).toContain('microfoliant');

    test.info().annotations.push({
      type: 'seo',
      description: `PDP title: "${title}"`,
    });
  });

  test('PDP has product-specific meta description', async ({ page }) => {
    await preparePageForTesting(page, URLS.products.dailyMicrofoliant);

    const metaDesc = await page.locator(SELECTORS.seo.metaDescription).getAttribute('content');
    expect(metaDesc).toBeTruthy();
    expect(metaDesc!.length).toBeGreaterThan(20);
  });

  test('homepage has canonical URL', async ({ page }) => {
    await preparePageForTesting(page, URLS.home);

    const canonical = await page.locator(SELECTORS.seo.canonical).getAttribute('href');
    expect(canonical).toBeTruthy();
    expect(canonical).toContain('dermalogica.com');

    test.info().annotations.push({
      type: 'seo',
      description: `Homepage canonical: ${canonical}`,
    });
  });

  test('PDP has canonical URL', async ({ page }) => {
    await preparePageForTesting(page, URLS.products.dailyMicrofoliant);

    const canonical = await page.locator(SELECTORS.seo.canonical).getAttribute('href');
    expect(canonical).toBeTruthy();
    expect(canonical).toContain('daily-microfoliant');
  });

  test('homepage has Open Graph tags', async ({ page }) => {
    await preparePageForTesting(page, URLS.home);

    const ogTitle = await page.locator(SELECTORS.seo.ogTitle).getAttribute('content');
    const ogImage = await page.locator(SELECTORS.seo.ogImage).getAttribute('content').catch(() => null);
    const ogUrl = await page.locator(SELECTORS.seo.ogUrl).getAttribute('content').catch(() => null);

    expect(ogTitle, 'Missing og:title').toBeTruthy();

    test.info().annotations.push({
      type: 'seo',
      description: `OG tags — title: ${!!ogTitle}, image: ${!!ogImage}, url: ${!!ogUrl}`,
    });
  });

  test('PDP has JSON-LD structured data (Product schema)', async ({ page }) => {
    await preparePageForTesting(page, URLS.products.dailyMicrofoliant);

    const jsonLdScripts = page.locator(SELECTORS.seo.jsonLd);
    const count = await jsonLdScripts.count();
    expect(count).toBeGreaterThan(0);

    // Check if any JSON-LD contains Product schema
    let hasProductSchema = false;
    for (let i = 0; i < count; i++) {
      const content = await jsonLdScripts.nth(i).textContent();
      if (content) {
        try {
          const data = JSON.parse(content);
          if (data['@type'] === 'Product' || data['@type']?.includes?.('Product')) {
            hasProductSchema = true;
            test.info().annotations.push({
              type: 'seo',
              description: `Product schema found with name: "${data.name}"`,
            });
            break;
          }
        } catch { /* malformed JSON-LD */ }
      }
    }

    expect(hasProductSchema, 'No Product JSON-LD schema found on PDP').toBeTruthy();
  });

  test('key pages are not set to noindex', async ({ page }) => {
    const pagesToCheck = [
      { name: 'Homepage', url: URLS.home },
      { name: 'Collection', url: URLS.collections.all },
      { name: 'PDP', url: URLS.products.dailyMicrofoliant },
    ];

    for (const p of pagesToCheck) {
      await page.goto(p.url, { waitUntil: 'domcontentloaded' });

      const robotsMeta = await page.locator(SELECTORS.seo.robotsMeta).getAttribute('content').catch(() => null);

      if (robotsMeta && robotsMeta.includes('noindex')) {
        test.info().annotations.push({
          type: 'warning',
          description: `${p.name} has noindex meta tag!`,
        });
      }

      expect(
        !robotsMeta || !robotsMeta.includes('noindex'),
        `${p.name} (${p.url}) is set to noindex`
      ).toBeTruthy();
    }
  });

  test('sitemap.xml is accessible', async ({ request }) => {
    const response = await request.get('https://www.dermalogica.com/sitemap.xml');
    expect(response.status()).toBe(200);

    const contentType = response.headers()['content-type'] || '';
    const body = await response.text();

    // Should be XML content
    expect(body).toContain('<?xml');
    expect(body).toContain('urlset');

    test.info().annotations.push({
      type: 'seo',
      description: `Sitemap accessible, content-type: ${contentType}`,
    });
  });

  test('robots.txt is accessible and well-formed', async ({ request }) => {
    const response = await request.get('https://www.dermalogica.com/robots.txt');
    expect(response.status()).toBe(200);

    const body = await response.text();
    expect(body.toLowerCase()).toContain('user-agent');
    expect(body.toLowerCase()).toContain('sitemap');

    test.info().annotations.push({
      type: 'seo',
      description: `Robots.txt accessible, length: ${body.length} chars`,
    });
  });
});
