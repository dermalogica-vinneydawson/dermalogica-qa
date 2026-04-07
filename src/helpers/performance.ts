import { Page } from '@playwright/test';

export interface PageLoadMetrics {
  /** Total time from navigation start to load event end (ms) */
  loadTime: number;
  /** DOM content loaded time (ms) */
  domContentLoaded: number;
  /** Time to first byte (ms) */
  ttfb: number;
  /** DOM interactive time (ms) */
  domInteractive: number;
}

export interface WebVitals {
  /** Largest Contentful Paint (ms) */
  lcp: number | null;
  /** Cumulative Layout Shift (unitless) */
  cls: number | null;
}

export interface BrokenImage {
  src: string;
  alt: string;
}

/**
 * Measure page load timing using the Navigation Timing API.
 */
export async function measurePageLoad(page: Page): Promise<PageLoadMetrics> {
  return await page.evaluate(() => {
    const entries = performance.getEntriesByType('navigation') as PerformanceNavigationTiming[];
    if (entries.length === 0) {
      return { loadTime: 0, domContentLoaded: 0, ttfb: 0, domInteractive: 0 };
    }
    const nav = entries[0];
    return {
      loadTime: nav.loadEventEnd - nav.startTime,
      domContentLoaded: nav.domContentLoadedEventEnd - nav.startTime,
      ttfb: nav.responseStart - nav.startTime,
      domInteractive: nav.domInteractive - nav.startTime,
    };
  });
}

/**
 * Measure Largest Contentful Paint (LCP).
 * Must be called BEFORE navigating — it sets up a PerformanceObserver.
 */
export async function setupLCPObserver(page: Page): Promise<void> {
  await page.evaluate(() => {
    (window as any).__lcp_value = null;
    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      if (entries.length > 0) {
        (window as any).__lcp_value = entries[entries.length - 1].startTime;
      }
    });
    observer.observe({ type: 'largest-contentful-paint', buffered: true });
  });
}

/**
 * Get the LCP value after the page has loaded.
 */
export async function getLCP(page: Page): Promise<number | null> {
  return await page.evaluate(() => (window as any).__lcp_value ?? null);
}

/**
 * Measure Cumulative Layout Shift (CLS).
 * Must be called BEFORE navigating.
 */
export async function setupCLSObserver(page: Page): Promise<void> {
  await page.evaluate(() => {
    (window as any).__cls_value = 0;
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (!(entry as any).hadRecentInput) {
          (window as any).__cls_value += (entry as any).value;
        }
      }
    });
    observer.observe({ type: 'layout-shift', buffered: true });
  });
}

/**
 * Get the CLS value after the page has loaded.
 */
export async function getCLS(page: Page): Promise<number | null> {
  return await page.evaluate(() => (window as any).__cls_value ?? null);
}

/**
 * Check for broken images on the current page.
 * Returns an array of broken image details.
 */
export async function checkBrokenImages(page: Page): Promise<BrokenImage[]> {
  return await page.evaluate(() => {
    const images = Array.from(document.querySelectorAll('img'));
    const broken: { src: string; alt: string }[] = [];

    for (const img of images) {
      // Skip tracking pixels and tiny images
      if (img.width < 2 && img.height < 2) continue;
      if (!img.src || img.src.startsWith('data:')) continue;

      if (!img.complete || img.naturalWidth === 0) {
        broken.push({
          src: img.src,
          alt: img.alt || '(no alt text)',
        });
      }
    }
    return broken;
  });
}

/**
 * Collect JavaScript console errors from the page.
 * Call this BEFORE navigating to start capturing.
 */
export function setupConsoleErrorCapture(page: Page): string[] {
  const errors: string[] = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      errors.push(msg.text());
    }
  });
  page.on('pageerror', (error) => {
    errors.push(error.message);
  });
  return errors;
}

/**
 * Get total page weight from Resource Timing API (approximate).
 */
export async function getPageWeight(page: Page): Promise<number> {
  return await page.evaluate(() => {
    const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
    return resources.reduce((total, r) => total + (r.transferSize || 0), 0);
  });
}
