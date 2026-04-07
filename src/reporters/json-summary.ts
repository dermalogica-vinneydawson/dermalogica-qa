import type {
  FullConfig,
  FullResult,
  Reporter,
  Suite,
  TestCase,
  TestResult,
} from '@playwright/test/reporter';
import * as fs from 'fs';
import * as path from 'path';

// ─── Taxonomy Maps ───
// Maps suite names / test titles → the Page/Area your team uses in the spreadsheet
const PAGE_AREA_MAP: Record<string, string> = {
  'Homepage': 'Homepage',
  'Navigation': 'Global',
  'Mobile Navigation': 'Global',
  'Mobile Responsiveness': 'Global',
  'Announcement': 'Announcement Bar',
  'Global Elements': 'Global',
  'Footer': 'Footer',
  'Collection': 'Collection',
  'Product Discovery': 'Collection',
  'Product Detail': 'PDP',
  'PDP': 'PDP',
  'Shopping Cart': 'Cart',
  'Cart': 'Cart',
  'Checkout': 'Cart',
  'Account': 'Login',
  'Login': 'Login',
  'Recharge': 'Login',
  'Rewards': 'Login',
  'Landing': 'Landing Page',
  'Face Mapping': 'Landing Page',
  'Store Locator': 'Landing Page',
  'Content Pages': 'Landing Page',
  'SEO': 'Global',
  'Accessibility': 'Global',
  'Performance': 'Global',
};

// Maps test title keywords → Feature/Functionality (matching the team's spreadsheet)
const FEATURE_MAP: Record<string, string> = {
  'announcement bar': 'Slider',
  'threshold': 'Threshold',
  'zendesk': 'Zendesk Chat Now',
  'chat widget': 'Zendesk Chat Now',
  'offer popup': 'Current Offer Popup',
  'promo': 'Current Offer Popup',
  'hero banner': 'Banner Carousel',
  'banner': 'Banner Carousel',
  'carousel': 'Collection Carousel',
  'collection.*nav': 'Collection Carousel - Nav Btn',
  'variant selector': 'Variant Selectors',
  'variant': 'Variant Selectors',
  'add to cart': 'Add to Cart',
  'atc': 'Add to Cart',
  'firework': 'Firework',
  'klaviyo': 'Klaviyo Email Signup',
  'newsletter': 'Klaviyo Email Signup',
  'sms': 'SMS Signup',
  'filter': 'Filter',
  'sort': 'Sort Preferences',
  'gallery': 'Gallery',
  'image gallery': 'Gallery',
  'yotpo': 'Yotpo Star Reviews',
  'review': 'Yotpo Customer Reviews',
  'afterpay': 'Afterpay / Klarna',
  'klarna': 'Afterpay / Klarna',
  'recharge.*subscription': 'Recharge - Subscription',
  'recharge.*one': 'Recharge - One time',
  'subscription': 'Recharge - Subscription',
  'quantity': 'Quantity Input',
  'fenix': 'Fenix Delivery Estimate',
  'delivery estimate': 'Fenix Delivery Estimate',
  'frequently bought': 'Frequently Bought With',
  'recommendations': 'Frequently Bought With',
  'accordion': 'Accordion',
  'skeepers': 'ClearStart - Skeepers - Video Carousel',
  'gwp': 'GWP',
  'gift': 'Easy Gift App',
  'offer code': 'Offer Code ( WELCOME )',
  'dynamic checkout': 'Dynamic Checkout Option',
  'employee discount': 'Employee Discount',
  'rewards.*redeem': 'Rewards Page - Redeem Products',
  'rewards.*history': 'Rewards Page - Rewards History',
  'rewards.*cart': 'Rewards Page - Add Cart',
  'rewards.*points': 'Display Rewards Points & Tier',
  'rewards': 'Rewards Page',
  'face mapping.*quiz': 'Face Mapping - Quiz',
  'face mapping': 'Face Mapping - Image Analysis',
  'store locator': 'Store Locator',
  'clearstart': 'ClearStart - Carousel',
  'clearcompany': 'Current Opportunity - ClearCompany',
  'pro treatment': 'Pro Treatment',
  'hamburger': 'Mobile Navigation',
  'mobile menu': 'Mobile Navigation',
  'mobile nav': 'Mobile Navigation',
  'logo': 'Header Logo',
  'header': 'Header Navigation',
  'nav links': 'Header Navigation',
  'menu items': 'Header Navigation',
  'footer links': 'Footer Links',
  'footer': 'Footer Links',
  'social': 'Social Links',
  'search': 'Search',
  'cookie': 'Cookie Consent',
  'breadcrumb': 'Breadcrumb Navigation',
  'checkout button': 'Dynamic Checkout Option',
  'checkout.*email': 'Checkout Form',
  'checkout.*shipping': 'Checkout Form',
  'checkout.*order': 'Checkout Form',
  'checkout': 'Checkout Flow',
  'cart.*persist': 'Cart Persistence',
  'cart.*remove': 'Cart Item Removal',
  'cart.*subtotal': 'Cart Subtotal',
  'cart.*image': 'Cart Product Image',
  'cart.*price': 'Cart Product Price',
  'cart.*empty': 'Empty Cart State',
  'login.*form': 'Login Form',
  'login.*error': 'Login Validation',
  'login.*password': 'Password Reset',
  'login.*element': 'Login Form',
  'register': 'Registration Form',
  'title tag': 'SEO Title Tags',
  'meta description': 'SEO Meta Descriptions',
  'heading': 'SEO Heading Structure',
  'open graph': 'SEO Open Graph Tags',
  'sitemap': 'SEO Sitemap',
  'noindex': 'SEO Indexing',
  'canonical': 'SEO Canonical URLs',
  'robots': 'SEO Robots.txt',
  'json-ld': 'SEO Structured Data',
  'alt attribute': 'Accessibility - Alt Text',
  'alt text': 'Accessibility - Alt Text',
  'axe-core': 'Accessibility - WCAG Scan',
  'accessibility': 'Accessibility - WCAG Scan',
  'broken image': 'Broken Images',
  'page load': 'Page Load Performance',
  'performance': 'Page Load Performance',
  'product card': 'Product Card Display',
  'product.*load': 'Product Page Load',
  'product.*title': 'Product Title Display',
  'product.*price': 'Product Price Display',
  'product.*image': 'Product Image Display',
};

// ─── Error Classification ───
type ErrorType = 'timeout' | 'selector_not_found' | 'assertion_failed' | 'network_error' | 'page_crashed' | 'unknown';
type Priority = 'critical' | 'high' | 'medium' | 'low';

function classifyError(error: string): { type: ErrorType; humanError: string; recommendation: string; priority: Priority } {
  const clean = error.replace(/\u001b\[[0-9;]*m/g, '');

  if (clean.includes('Test timeout') || clean.includes('Timeout')) {
    const timeoutMatch = clean.match(/(\d+)ms/);
    const timeoutSec = timeoutMatch ? (parseInt(timeoutMatch[1]) / 1000).toFixed(0) : '60';
    return {
      type: 'timeout',
      humanError: `The page or element took longer than ${timeoutSec}s to respond.`,
      recommendation: 'Check if the page is loading slowly due to heavy scripts, third-party widgets, or server issues. The element may also no longer exist on the page after a redesign.',
      priority: 'high',
    };
  }

  if (clean.includes('element(s) not found') || clean.includes('waiting for locator')) {
    const selectorMatch = clean.match(/locator\('([^']+)'\)/);
    const selector = selectorMatch ? selectorMatch[1] : 'unknown';
    return {
      type: 'selector_not_found',
      humanError: `A UI element could not be found on the page. The expected element (${selector.substring(0, 80)}) is missing.`,
      recommendation: 'This usually means the website was updated and the HTML structure changed. The dev team should check if this feature was removed, renamed, or redesigned.',
      priority: 'critical',
    };
  }

  if (clean.includes('toHaveLength') || clean.includes('toBeTruthy') || clean.includes('toContain') || clean.includes('toBeVisible') || clean.includes('toMatch')) {
    // Extract what we expected vs received
    const expectedMatch = clean.match(/Expected.*?:\s*(.+)/);
    const receivedMatch = clean.match(/Received.*?:\s*(.+)/);
    const expected = expectedMatch ? expectedMatch[1].trim() : '';
    const received = receivedMatch ? receivedMatch[1].trim() : '';

    let humanMsg = 'A quality check did not pass — the page content or behavior does not match expectations.';
    if (expected && received) {
      humanMsg = `Expected "${expected}" but found "${received.substring(0, 100)}".`;
    }

    // Check for specific violation types
    if (clean.includes('a11y') || clean.includes('axe-core') || clean.includes('accessibility')) {
      return { type: 'assertion_failed', humanError: humanMsg, recommendation: 'Accessibility violations need to be fixed for WCAG compliance. Review the specific rules flagged and update the HTML accordingly.', priority: 'medium' };
    }
    if (clean.includes('broken image') || clean.includes('Broken images')) {
      return { type: 'assertion_failed', humanError: 'Broken images were detected on the page. Visitors will see empty image placeholders.', recommendation: 'Check that all image URLs are correct and the images exist on the CDN. Re-upload any missing assets in Shopify.', priority: 'high' };
    }
    if (clean.includes('alt text') || clean.includes('alt attribute')) {
      return { type: 'assertion_failed', humanError: 'Some images are missing alt text, which hurts SEO and accessibility.', recommendation: 'Add descriptive alt text to every image in Shopify\'s media library or theme editor.', priority: 'medium' };
    }

    return { type: 'assertion_failed', humanError: humanMsg, recommendation: 'Review the specific assertion that failed and compare it against the current live website. The feature may have been modified.', priority: 'medium' };
  }

  if (clean.includes('Target page, context or browser has been closed')) {
    return {
      type: 'page_crashed',
      humanError: 'The browser tab crashed or was closed unexpectedly during the test.',
      recommendation: 'This often indicates the page has a JavaScript error or memory issue. Check the browser console on the affected page for errors.',
      priority: 'high',
    };
  }

  if (clean.includes('net::') || clean.includes('ERR_')) {
    return {
      type: 'network_error',
      humanError: 'A network request failed — the page or resource could not be reached.',
      recommendation: 'Check if the website or specific URLs are down, unreachable, or blocked.',
      priority: 'critical',
    };
  }

  return {
    type: 'unknown',
    humanError: 'An unexpected error occurred during testing.',
    recommendation: 'Review the raw error details below for more context.',
    priority: 'medium',
  };
}

function resolvePageArea(suiteName: string, testTitle: string): string {
  const combined = `${suiteName} ${testTitle}`.toLowerCase();
  for (const [keyword, area] of Object.entries(PAGE_AREA_MAP)) {
    if (combined.toLowerCase().includes(keyword.toLowerCase())) return area;
  }
  return 'Global';
}

function resolveFeature(testTitle: string): string {
  const lower = testTitle.toLowerCase();
  for (const [keyword, feature] of Object.entries(FEATURE_MAP)) {
    if (keyword.includes('.*')) {
      const regex = new RegExp(keyword, 'i');
      if (regex.test(lower)) return feature;
    } else if (lower.includes(keyword)) {
      return feature;
    }
  }
  return testTitle; // Fall back to test title as feature name
}

function resolveViewport(suiteName: string, testTitle: string): 'Desktop' | 'Mobile' | 'Both' {
  const combined = `${suiteName} ${testTitle}`.toLowerCase();
  if (combined.includes('mobile') || combined.includes('@mobile')) return 'Mobile';
  return 'Desktop';
}

// ─── Interfaces ───
interface TestDetail {
  id: string;
  test: string;
  suite: string;
  pageArea: string;
  feature: string;
  viewport: 'Desktop' | 'Mobile' | 'Both';
  status: 'passed' | 'failed' | 'skipped' | 'flaky';
  duration: number;
  // Only present for failures
  errorType?: ErrorType;
  rawError?: string;
  humanError?: string;
  recommendation?: string;
  priority?: Priority;
  screenshots?: string[];
  annotations?: Array<{ type: string; description: string }>;
}

interface SuiteSummary {
  name: string;
  pageArea: string;
  passed: number;
  failed: number;
  skipped: number;
  flaky: number;
  duration: number;
}

interface QASummary {
  timestamp: string;
  duration: number;
  totals: { passed: number; failed: number; skipped: number; flaky: number; total: number };
  suites: SuiteSummary[];
  tests: TestDetail[];
  pageAreas: string[];
  features: string[];
}

class JsonSummaryReporter implements Reporter {
  private outputDir: string;
  private summary: QASummary;
  private suiteMap: Map<string, SuiteSummary>;
  private startTime: number = 0;
  private testIdCounter: number = 0;

  constructor(options: { outputDir?: string } = {}) {
    this.outputDir = options.outputDir || 'reports/json';
    this.suiteMap = new Map();
    this.summary = {
      timestamp: new Date().toISOString(),
      duration: 0,
      totals: { passed: 0, failed: 0, skipped: 0, flaky: 0, total: 0 },
      suites: [],
      tests: [],
      pageAreas: [],
      features: [],
    };
  }

  onBegin(_config: FullConfig, _suite: Suite): void {
    this.startTime = Date.now();
  }

  onTestEnd(test: TestCase, result: TestResult): void {
    const suiteName = test.parent?.title || 'Unknown Suite';
    const pageArea = resolvePageArea(suiteName, test.title);
    const feature = resolveFeature(test.title);
    const viewport = resolveViewport(suiteName, test.title);
    const testId = `T${++this.testIdCounter}`;

    // Suite tracking
    if (!this.suiteMap.has(suiteName)) {
      this.suiteMap.set(suiteName, {
        name: suiteName,
        pageArea,
        passed: 0,
        failed: 0,
        skipped: 0,
        flaky: 0,
        duration: 0,
      });
    }
    const suite = this.suiteMap.get(suiteName)!;
    suite.duration += result.duration;

    // Build test detail
    const detail: TestDetail = {
      id: testId,
      test: test.title,
      suite: suiteName,
      pageArea,
      feature,
      viewport,
      status: 'passed',
      duration: result.duration,
    };

    switch (result.status) {
      case 'passed':
        suite.passed++;
        this.summary.totals.passed++;
        detail.status = result.retry > 0 ? 'flaky' : 'passed';
        if (result.retry > 0) {
          suite.flaky++;
          this.summary.totals.flaky++;
        }
        break;
      case 'failed':
      case 'timedOut': {
        suite.failed++;
        this.summary.totals.failed++;
        detail.status = 'failed';
        const rawError = result.errors.map(e => e.message || e.toString()).join('\n');
        const classified = classifyError(rawError);
        detail.errorType = classified.type;
        detail.rawError = rawError;
        detail.humanError = classified.humanError;
        detail.recommendation = classified.recommendation;
        detail.priority = classified.priority;
        detail.screenshots = result.attachments
          .filter(a => a.contentType?.startsWith('image/'))
          .map(a => a.path || '');
        detail.annotations = test.annotations.map(a => ({
          type: a.type,
          description: a.description || '',
        }));
        break;
      }
      case 'skipped':
        suite.skipped++;
        this.summary.totals.skipped++;
        detail.status = 'skipped';
        break;
    }

    this.summary.totals.total++;
    this.summary.tests.push(detail);
  }

  async onEnd(_result: FullResult): Promise<void> {
    this.summary.duration = Date.now() - this.startTime;
    this.summary.suites = Array.from(this.suiteMap.values());

    // Compute unique page areas and features
    this.summary.pageAreas = [...new Set(this.summary.tests.map(t => t.pageArea))].sort();
    this.summary.features = [...new Set(this.summary.tests.map(t => t.feature))].sort();

    // Deduplicate tests (retries create duplicates — keep the last attempt)
    const seen = new Map<string, number>();
    for (let i = this.summary.tests.length - 1; i >= 0; i--) {
      const key = `${this.summary.tests[i].suite}::${this.summary.tests[i].test}`;
      if (seen.has(key)) {
        this.summary.tests.splice(i, 1);
      } else {
        seen.set(key, i);
      }
    }

    fs.mkdirSync(this.outputDir, { recursive: true });
    const date = new Date().toISOString().split('T')[0];
    const outputPath = path.join(this.outputDir, `qa-summary-${date}.json`);
    fs.writeFileSync(outputPath, JSON.stringify(this.summary, null, 2));
  }
}

export default JsonSummaryReporter;
