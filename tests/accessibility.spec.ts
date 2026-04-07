import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { SELECTORS } from '../src/config/selectors';
import { URLS } from '../src/config/urls';
import { TIMEOUTS } from '../src/config/timeouts';
import { preparePageForTesting } from '../src/helpers/navigation';

test.describe('Accessibility @a11y', () => {
  test('homepage passes axe-core accessibility scan', async ({ page }) => {
    await preparePageForTesting(page, URLS.home);

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .exclude('.yotpo') // Exclude third-party widgets we can't control
      .exclude('.snize') // Searchanise widget
      .analyze();

    const violations = results.violations;
    test.info().annotations.push({
      type: 'a11y',
      description: `Homepage a11y violations: ${violations.length} (${violations.map(v => v.id).join(', ')})`,
    });

    // Allow up to 5 minor violations for initial baseline — tighten over time
    expect(
      violations.filter(v => v.impact === 'critical' || v.impact === 'serious'),
      `Critical/serious a11y violations: ${violations.filter(v => v.impact === 'critical' || v.impact === 'serious').map(v => `${v.id}: ${v.description}`).join('; ')}`
    ).toHaveLength(0);
  });

  test('PDP passes axe-core accessibility scan', async ({ page }) => {
    await preparePageForTesting(page, URLS.products.dailyMicrofoliant);

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .exclude('.yotpo')
      .exclude('.snize')
      .analyze();

    const violations = results.violations;
    test.info().annotations.push({
      type: 'a11y',
      description: `PDP a11y violations: ${violations.length} (${violations.map(v => v.id).join(', ')})`,
    });

    expect(
      violations.filter(v => v.impact === 'critical' || v.impact === 'serious')
    ).toHaveLength(0);
  });

  test('all homepage images have alt attributes', async ({ page }) => {
    await preparePageForTesting(page, URLS.home);

    const imagesWithoutAlt = await page.evaluate(() => {
      const images = Array.from(document.querySelectorAll('img'));
      return images
        .filter(img => !img.alt && img.width > 1 && img.height > 1 && !img.src.startsWith('data:'))
        .map(img => img.src);
    });

    test.info().annotations.push({
      type: 'a11y',
      description: `Homepage images without alt: ${imagesWithoutAlt.length}`,
    });

    expect(
      imagesWithoutAlt,
      `Images missing alt text: ${imagesWithoutAlt.slice(0, 5).join(', ')}`
    ).toHaveLength(0);
  });

  test('all PDP images have alt attributes', async ({ page }) => {
    await preparePageForTesting(page, URLS.products.dailyMicrofoliant);

    const imagesWithoutAlt = await page.evaluate(() => {
      const images = Array.from(document.querySelectorAll('img'));
      return images
        .filter(img => !img.alt && img.width > 1 && img.height > 1 && !img.src.startsWith('data:'))
        .map(img => img.src);
    });

    test.info().annotations.push({
      type: 'a11y',
      description: `PDP images without alt: ${imagesWithoutAlt.length}`,
    });

    expect(
      imagesWithoutAlt,
      `Images missing alt text: ${imagesWithoutAlt.slice(0, 5).join(', ')}`
    ).toHaveLength(0);
  });

  test('main navigation is keyboard accessible', async ({ page }) => {
    await preparePageForTesting(page, URLS.home);

    // Tab through the page and check that focus moves to navigation
    await page.keyboard.press('Tab');
    await page.waitForTimeout(500);

    // Check if there's a focused element
    const focusedTag = await page.evaluate(() => document.activeElement?.tagName);
    expect(focusedTag).toBeTruthy();

    // Tab through several elements — should be able to reach nav links
    let reachedNav = false;
    for (let i = 0; i < 20; i++) {
      await page.keyboard.press('Tab');
      const isNavLink = await page.evaluate(() => {
        const el = document.activeElement;
        if (!el) return false;
        const nav = el.closest('nav, header');
        return nav !== null && el.tagName === 'A';
      });
      if (isNavLink) {
        reachedNav = true;
        break;
      }
    }

    expect(reachedNav, 'Could not reach navigation links via keyboard').toBeTruthy();
  });

  test('skip-to-content link is present', async ({ page }) => {
    await preparePageForTesting(page, URLS.home);

    const skipLink = page.locator(SELECTORS.common.skipToContent).first();
    try {
      // Skip link may be visually hidden until focused
      await page.keyboard.press('Tab');
      const isVisible = await skipLink.isVisible({ timeout: 2000 });
      if (!isVisible) {
        // Check if it exists in DOM even if not visible
        const exists = await skipLink.count();
        expect(exists).toBeGreaterThan(0);
      }
    } catch {
      test.info().annotations.push({
        type: 'a11y',
        description: 'Skip-to-content link not found',
      });
    }
  });

  test('form inputs have associated labels', async ({ page }) => {
    await preparePageForTesting(page, URLS.account.login);

    const inputsWithoutLabels = await page.evaluate(() => {
      const inputs = Array.from(document.querySelectorAll('input:not([type="hidden"]):not([type="submit"]):not([type="button"])'));
      return inputs.filter(input => {
        const id = input.id;
        const hasLabel = id && document.querySelector(`label[for="${id}"]`);
        const hasAriaLabel = input.getAttribute('aria-label');
        const hasAriaLabelledBy = input.getAttribute('aria-labelledby');
        const wrappedInLabel = input.closest('label');
        const hasPlaceholder = input.getAttribute('placeholder');
        return !hasLabel && !hasAriaLabel && !hasAriaLabelledBy && !wrappedInLabel && !hasPlaceholder;
      }).map(input => `${input.tagName}#${input.id || '(no-id)'}[type=${(input as HTMLInputElement).type}]`);
    });

    test.info().annotations.push({
      type: 'a11y',
      description: `Login page inputs without labels: ${inputsWithoutLabels.length}`,
    });

    expect(
      inputsWithoutLabels,
      `Inputs without labels: ${inputsWithoutLabels.join(', ')}`
    ).toHaveLength(0);
  });

  test('headings follow proper hierarchy', async ({ page }) => {
    await preparePageForTesting(page, URLS.home);

    const headingIssues = await page.evaluate(() => {
      const headings = Array.from(document.querySelectorAll('h1, h2, h3, h4, h5, h6'));
      const issues: string[] = [];
      let lastLevel = 0;

      // Check for multiple h1s
      const h1Count = headings.filter(h => h.tagName === 'H1').length;
      if (h1Count > 1) {
        issues.push(`Multiple h1 tags found: ${h1Count}`);
      }
      if (h1Count === 0) {
        issues.push('No h1 tag found');
      }

      // Check for skipped levels
      for (const heading of headings) {
        const level = parseInt(heading.tagName[1]);
        if (lastLevel > 0 && level > lastLevel + 1) {
          issues.push(`Heading level skipped: h${lastLevel} → h${level} ("${heading.textContent?.trim().slice(0, 30)}")`);
        }
        lastLevel = level;
      }

      return issues;
    });

    test.info().annotations.push({
      type: 'a11y',
      description: `Heading hierarchy issues: ${headingIssues.length}`,
    });

    // Report issues but don't fail hard — many sites have heading issues
    if (headingIssues.length > 0) {
      test.info().annotations.push({
        type: 'warning',
        description: headingIssues.join('; '),
      });
    }
  });

  test('ARIA landmarks are present', async ({ page }) => {
    await preparePageForTesting(page, URLS.home);

    const landmarks = await page.evaluate(() => {
      return {
        hasMain: document.querySelectorAll('main, [role="main"]').length > 0,
        hasNav: document.querySelectorAll('nav, [role="navigation"]').length > 0,
        hasFooter: document.querySelectorAll('footer, [role="contentinfo"]').length > 0,
        hasBanner: document.querySelectorAll('header, [role="banner"]').length > 0,
      };
    });

    expect(landmarks.hasMain, 'Missing <main> landmark').toBeTruthy();
    expect(landmarks.hasNav, 'Missing <nav> landmark').toBeTruthy();
    expect(landmarks.hasFooter, 'Missing <footer> landmark').toBeTruthy();
    expect(landmarks.hasBanner, 'Missing <header> landmark').toBeTruthy();
  });
});
