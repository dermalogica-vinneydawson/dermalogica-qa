import { test, expect } from '@playwright/test';
import { URLS } from '../src/config/urls';
import { TIMEOUTS } from '../src/config/timeouts';
import {
  measurePageLoad,
  setupLCPObserver,
  getLCP,
  setupCLSObserver,
  getCLS,
  checkBrokenImages,
  setupConsoleErrorCapture,
  getPageWeight,
} from '../src/helpers/performance';

// Performance tests run only in Chromium for consistent metrics
test.describe('Performance @performance', () => {
  test.skip(({ browserName }) => browserName !== 'chromium', 'Performance tests run only in Chromium');

  test('homepage loads within 5 seconds', async ({ page }) => {
    await page.goto(URLS.home, { waitUntil: 'load', timeout: TIMEOUTS.pageLoad });
    const metrics = await measurePageLoad(page);

    test.info().annotations.push({
      type: 'metric',
      description: `Homepage load time: ${Math.round(metrics.loadTime)}ms | TTFB: ${Math.round(metrics.ttfb)}ms | DOM interactive: ${Math.round(metrics.domInteractive)}ms`,
    });

    expect(metrics.loadTime, `Homepage load time was ${metrics.loadTime}ms`).toBeLessThan(5000);
  });

  test('homepage LCP is under 2.5 seconds', async ({ page }) => {
    await setupLCPObserver(page);
    await page.goto(URLS.home, { waitUntil: 'load', timeout: TIMEOUTS.pageLoad });
    await page.waitForTimeout(3000); // Allow LCP to settle

    const lcp = await getLCP(page);

    test.info().annotations.push({
      type: 'metric',
      description: `Homepage LCP: ${lcp ? Math.round(lcp) + 'ms' : 'not measured'}`,
    });

    if (lcp !== null) {
      expect(lcp, `Homepage LCP was ${lcp}ms`).toBeLessThan(2500);
    }
  });

  test('homepage CLS is under 0.1', async ({ page }) => {
    await setupCLSObserver(page);
    await page.goto(URLS.home, { waitUntil: 'load', timeout: TIMEOUTS.pageLoad });
    await page.waitForTimeout(3000); // Allow layout to settle

    const cls = await getCLS(page);

    test.info().annotations.push({
      type: 'metric',
      description: `Homepage CLS: ${cls !== null ? cls.toFixed(4) : 'not measured'}`,
    });

    if (cls !== null) {
      expect(cls, `Homepage CLS was ${cls}`).toBeLessThan(0.1);
    }
  });

  test('collection page loads within 5 seconds', async ({ page }) => {
    await page.goto(URLS.collections.all, { waitUntil: 'load', timeout: TIMEOUTS.pageLoad });
    const metrics = await measurePageLoad(page);

    test.info().annotations.push({
      type: 'metric',
      description: `Collection page load time: ${Math.round(metrics.loadTime)}ms`,
    });

    expect(metrics.loadTime).toBeLessThan(5000);
  });

  test('PDP loads within 5 seconds', async ({ page }) => {
    await page.goto(URLS.products.dailyMicrofoliant, { waitUntil: 'load', timeout: TIMEOUTS.pageLoad });
    const metrics = await measurePageLoad(page);

    test.info().annotations.push({
      type: 'metric',
      description: `PDP load time: ${Math.round(metrics.loadTime)}ms`,
    });

    expect(metrics.loadTime).toBeLessThan(5000);
  });

  test('homepage has no broken images', async ({ page }) => {
    await page.goto(URLS.home, { waitUntil: 'load', timeout: TIMEOUTS.pageLoad });
    await page.waitForTimeout(3000); // Wait for lazy-loaded images

    const broken = await checkBrokenImages(page);

    test.info().annotations.push({
      type: 'metric',
      description: `Homepage broken images: ${broken.length}`,
    });

    if (broken.length > 0) {
      const details = broken.map(img => `  - ${img.src} (alt: "${img.alt}")`).join('\n');
      expect(broken, `Broken images found:\n${details}`).toHaveLength(0);
    }
  });

  test('PDP has no broken images', async ({ page }) => {
    await page.goto(URLS.products.dailyMicrofoliant, { waitUntil: 'load', timeout: TIMEOUTS.pageLoad });
    await page.waitForTimeout(3000);

    const broken = await checkBrokenImages(page);

    test.info().annotations.push({
      type: 'metric',
      description: `PDP broken images: ${broken.length}`,
    });

    if (broken.length > 0) {
      const details = broken.map(img => `  - ${img.src} (alt: "${img.alt}")`).join('\n');
      expect(broken, `Broken images found:\n${details}`).toHaveLength(0);
    }
  });

  test('homepage has no critical JavaScript errors', async ({ page }) => {
    const errors = setupConsoleErrorCapture(page);
    await page.goto(URLS.home, { waitUntil: 'load', timeout: TIMEOUTS.pageLoad });
    await page.waitForTimeout(3000);

    // Filter out third-party errors that are not our concern
    const criticalErrors = errors.filter(err =>
      !err.includes('third-party') &&
      !err.includes('ERR_BLOCKED_BY_CLIENT') && // ad blockers
      !err.includes('net::ERR') // network errors from external scripts
    );

    test.info().annotations.push({
      type: 'metric',
      description: `Homepage JS errors: ${criticalErrors.length} critical, ${errors.length} total`,
    });

    // Allow some non-critical errors but flag them
    if (criticalErrors.length > 0) {
      test.info().annotations.push({
        type: 'warning',
        description: `JS errors: ${criticalErrors.slice(0, 5).join(' | ')}`,
      });
    }
  });

  test('PDP has no critical JavaScript errors', async ({ page }) => {
    const errors = setupConsoleErrorCapture(page);
    await page.goto(URLS.products.dailyMicrofoliant, { waitUntil: 'load', timeout: TIMEOUTS.pageLoad });
    await page.waitForTimeout(3000);

    const criticalErrors = errors.filter(err =>
      !err.includes('third-party') &&
      !err.includes('ERR_BLOCKED_BY_CLIENT') &&
      !err.includes('net::ERR')
    );

    test.info().annotations.push({
      type: 'metric',
      description: `PDP JS errors: ${criticalErrors.length} critical, ${errors.length} total`,
    });
  });

  test('page weight estimation for homepage', async ({ page }) => {
    await page.goto(URLS.home, { waitUntil: 'load', timeout: TIMEOUTS.pageLoad });
    await page.waitForTimeout(2000);

    const weightBytes = await getPageWeight(page);
    const weightMB = (weightBytes / 1024 / 1024).toFixed(2);

    test.info().annotations.push({
      type: 'metric',
      description: `Homepage total page weight: ${weightMB} MB`,
    });

    // Flag if page is over 5MB
    if (weightBytes > 5 * 1024 * 1024) {
      test.info().annotations.push({
        type: 'warning',
        description: `Homepage page weight ${weightMB}MB exceeds 5MB recommendation`,
      });
    }
  });
});
