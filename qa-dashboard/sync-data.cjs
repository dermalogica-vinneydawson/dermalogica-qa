/**
 * sync-data.cjs
 * Syncs the latest Playwright JSON report into the dashboard's public folder.
 * Transforms legacy JSON format into the enriched format with real test names,
 * Page/Area mapping, Feature classification, and human-readable error guidance.
 */
const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, '..', 'reports', 'json');
const testsDir = path.join(__dirname, '..', 'tests');
const destFile = path.join(__dirname, 'public', 'latest.json');

// ─── Taxonomy: Page/Area ───
const PAGE_AREA_MAP = {
  'Homepage': 'Homepage', 'Navigation': 'Global', 'Mobile Navigation': 'Global',
  'Mobile Responsiveness': 'Global', 'Announcement': 'Announcement Bar',
  'Global Elements': 'Global', 'Footer': 'Footer', 'Collection': 'Collection',
  'Product Discovery': 'Collection', 'Product Detail': 'PDP', 'PDP': 'PDP',
  'Shopping Cart': 'Cart', 'Cart': 'Cart', 'Checkout': 'Cart',
  'Account': 'Login', 'Login': 'Login', 'Recharge': 'Login', 'Rewards': 'Login',
  'Landing': 'Landing Page', 'Content Pages': 'Landing Page',
  'SEO': 'Global', 'Accessibility': 'Global', 'Performance': 'Global',
};

// ─── Taxonomy: Feature ───
const FEATURE_MAP = [
  [/announcement.?bar/i, 'Announcement Bar'],
  [/threshold/i, 'Threshold'],
  [/zendesk|chat.?widget/i, 'Zendesk Chat Now'],
  [/offer.?popup|promo/i, 'Current Offer Popup'],
  [/hero.?banner|banner/i, 'Banner Carousel'],
  [/variant.?selector|variant/i, 'Variant Selectors'],
  [/add.?to.?cart|atc/i, 'Add to Cart'],
  [/firework/i, 'Firework'],
  [/klaviyo|newsletter/i, 'Klaviyo Email Signup'],
  [/sms.?signup/i, 'SMS Signup'],
  [/filter/i, 'Filter'],
  [/sort/i, 'Sort Preferences'],
  [/image.?gallery|gallery|thumbnail/i, 'Gallery'],
  [/yotpo|review/i, 'Yotpo Star Reviews'],
  [/afterpay|klarna/i, 'Afterpay / Klarna'],
  [/recharge.*subscription|subscription/i, 'Recharge - Subscription'],
  [/quantity/i, 'Quantity Input'],
  [/fenix|delivery.?estimate/i, 'Fenix Delivery Estimate'],
  [/frequently.?bought|recommend/i, 'Frequently Bought With'],
  [/accordion/i, 'Accordion'],
  [/skeepers/i, 'ClearStart - Skeepers'],
  [/gwp|gift.?with/i, 'GWP'],
  [/easy.?gift/i, 'Easy Gift App'],
  [/dynamic.?checkout|checkout.?button/i, 'Dynamic Checkout Option'],
  [/rewards/i, 'Rewards Page'],
  [/face.?mapping/i, 'Face Mapping'],
  [/store.?locator/i, 'Store Locator'],
  [/hamburger|mobile.?menu|mobile.?nav/i, 'Mobile Navigation'],
  [/logo/i, 'Logo'],
  [/header.*nav|nav.*menu|menu.?item/i, 'Site Navigation'],
  [/footer.*link/i, 'Footer Links'],
  [/social/i, 'Social Links'],
  [/search/i, 'Search'],
  [/cookie/i, 'Cookie Consent'],
  [/breadcrumb/i, 'Breadcrumb'],
  [/checkout.*email|checkout.*address|checkout.*shipping/i, 'Checkout Form'],
  [/checkout/i, 'Checkout Flow'],
  [/cart.*persist/i, 'Cart Persistence'],
  [/cart.*remov/i, 'Cart Item Removal'],
  [/cart.*subtotal|subtotal/i, 'Cart Subtotal'],
  [/cart.*image/i, 'Cart Product Image'],
  [/cart.*price/i, 'Cart Product Price'],
  [/empty.?cart/i, 'Empty Cart State'],
  [/cart.*interact|third.?party.*cart/i, 'Cart Third-Party Widgets'],
  [/login.*form|login.*field|login.*load/i, 'Login Form'],
  [/login.*error|login.*invalid|login.*empty/i, 'Login Validation'],
  [/password.?reset|forgot/i, 'Password Reset'],
  [/register/i, 'Registration'],
  [/login.*secur/i, 'Login Security'],
  [/title.?tag/i, 'SEO Title Tags'],
  [/meta.?desc/i, 'SEO Meta Descriptions'],
  [/heading.*hierarch|heading.*struct/i, 'SEO Heading Structure'],
  [/open.?graph/i, 'SEO Open Graph'],
  [/sitemap/i, 'SEO Sitemap'],
  [/canonical/i, 'SEO Canonical URLs'],
  [/robots/i, 'SEO Robots.txt'],
  [/json-?ld|structured.?data/i, 'SEO Structured Data'],
  [/noindex/i, 'SEO Indexing'],
  [/alt.?attribute|alt.?text/i, 'Image Alt Text'],
  [/axe-?core|accessibility.?scan/i, 'WCAG Accessibility Scan'],
  [/broken.?image/i, 'Broken Images'],
  [/page.?load|load.*time|LCP|CLS|performance/i, 'Page Load Performance'],
  [/product.*card|card.*title|card.*price/i, 'Product Card Display'],
  [/product.*title/i, 'Product Title'],
  [/product.*price/i, 'Product Price'],
  [/product.*image|main.*image/i, 'Product Image'],
  [/product.*description/i, 'Product Description'],
  [/collection.*load|category/i, 'Collection Page Load'],
  [/product.*grid/i, 'Product Grid'],
  [/content.*page|blog|about|contact/i, 'Content Pages'],
  [/status.*code|404|broken.*link/i, 'Broken Links / 404'],
];

// ─── Resolve Functions ───
function resolvePageArea(suite, test) {
  const combined = `${suite} ${test}`.toLowerCase();
  for (const [keyword, area] of Object.entries(PAGE_AREA_MAP)) {
    if (combined.includes(keyword.toLowerCase())) return area;
  }
  return 'Global';
}

function resolveFeature(testTitle) {
  for (const [regex, feature] of FEATURE_MAP) {
    if (regex.test(testTitle)) return feature;
  }
  // Clean up the test title as a feature name
  return testTitle.replace(/^(should|test|verify|check|ensure)\s+/i, '').replace(/(successfully|correctly|properly)$/i, '').trim();
}

function resolveViewport(suite, test) {
  const c = `${suite} ${test}`.toLowerCase();
  if (c.includes('mobile') || c.includes('@mobile')) return 'Mobile';
  return 'Desktop';
}

// ─── Error Classification ───
function classifyError(error) {
  const clean = (error || '').replace(/\u001b\[[0-9;]*m/g, '');

  // Accessibility-specific
  if (clean.includes('a11y violation') || clean.includes('axe-core') || (clean.includes('toHaveLength') && (clean.includes('aria-') || clean.includes('color-contrast') || clean.includes('link-name') || clean.includes('button-name')))) {
    // Extract specific violations
    const violationMatches = clean.match(/"id":\s*"([^"]+)"/g);
    const violations = violationMatches ? [...new Set(violationMatches.map(m => m.match(/"id":\s*"([^"]+)"/)[1]))].join(', ') : '';
    return {
      type: 'accessibility',
      humanError: `Accessibility violations detected: ${violations || 'WCAG standard checks failed'}.`,
      recommendation: 'Review the specific ARIA/WCAG rules flagged. Common fixes include: adding aria-label to buttons/links, ensuring color contrast ratios meet 4.5:1, and adding alt text to images.',
      priority: 'medium',
    };
  }

  // Alt text
  if (clean.includes('alt text') || clean.includes('alt attribute') || clean.includes('Images missing alt')) {
    const countMatch = clean.match(/Received length:\s*(\d+)/);
    const count = countMatch ? countMatch[1] : 'multiple';
    return {
      type: 'assertion_failed',
      humanError: `${count} images are missing alt text on this page. Visitors using screen readers cannot understand these images.`,
      recommendation: 'Add descriptive alt text to every image in the Shopify theme editor or media library. Alt text should describe the image content concisely.',
      priority: 'medium',
    };
  }

  // Broken images
  if (clean.includes('broken image') || clean.includes('Broken images') || (clean.includes('naturalWidth') && clean.includes('0'))) {
    return {
      type: 'assertion_failed',
      humanError: 'Broken images detected — visitors will see empty placeholders.',
      recommendation: 'Verify all image URLs are correct in the Shopify CDN. Re-upload any missing assets.',
      priority: 'high',
    };
  }

  // Timeout
  if (clean.includes('Test timeout') || clean.includes('Timeout') || clean.includes('exceeded')) {
    const m = clean.match(/(\d+)ms/);
    const s = m ? (parseInt(m[1]) / 1000).toFixed(0) : '60';
    return {
      type: 'timeout',
      humanError: `The page or a specific element took longer than ${s} seconds to load.`,
      recommendation: 'This can happen if the page has heavy scripts, slow third-party widgets, or the element no longer exists after a design change. Check the page load speed and verify the UI component is still present.',
      priority: 'high',
    };
  }

  // Element not found
  if (clean.includes('element(s) not found') || clean.includes('waiting for locator') || clean.includes('not found')) {
    const selectorMatch = clean.match(/locator\('([^']+)'\)/);
    const selector = selectorMatch ? selectorMatch[1].substring(0, 60) : '';
    return {
      type: 'selector_not_found',
      humanError: `A UI element could not be found on the page${selector ? ` (looking for: ${selector})` : ''}.`,
      recommendation: 'This usually means the website HTML was updated. Check if the feature was removed, renamed, or restyled. The QA test selectors may need updating.',
      priority: 'critical',
    };
  }

  // SEO
  if (clean.includes('meta description') || clean.includes('title tag') || clean.includes('canonical')) {
    return {
      type: 'assertion_failed',
      humanError: 'An SEO check failed — this page may have missing or incorrect metadata.',
      recommendation: 'Review the page\'s meta tags in the Shopify theme. Ensure title tags, meta descriptions, and canonical URLs are properly set.',
      priority: 'medium',
    };
  }

  // Performance
  if (clean.includes('LCP') || clean.includes('CLS') || clean.includes('load time') || clean.includes('performance')) {
    return {
      type: 'assertion_failed',
      humanError: 'This page did not meet performance benchmarks (Core Web Vitals).',
      recommendation: 'Optimize page speed by reducing image sizes, minimizing third-party scripts, and enabling lazy loading.',
      priority: 'medium',
    };
  }

  // Generic assertion
  if (clean.includes('toBeTruthy') || clean.includes('toHaveLength') || clean.includes('toContain') || clean.includes('toBeVisible') || clean.includes('toMatch') || clean.includes('expect')) {
    return {
      type: 'assertion_failed',
      humanError: 'A quality check did not pass — the page behavior or content doesn\'t match expectations.',
      recommendation: 'Compare the test expectation with the current live website. The feature may work differently now.',
      priority: 'medium',
    };
  }

  // Page crash
  if (clean.includes('Target page') && clean.includes('closed')) {
    return {
      type: 'page_crashed',
      humanError: 'The page crashed or closed unexpectedly during testing.',
      recommendation: 'Check for JavaScript errors on this page using browser DevTools.',
      priority: 'high',
    };
  }

  return { type: 'unknown', humanError: 'An unexpected error occurred.', recommendation: 'Review the raw error details.', priority: 'medium' };
}

// ─── Extract test titles from spec files ───
function extractTestNames() {
  const testsByFile = new Map(); // suiteName → [testTitle, ...]
  if (!fs.existsSync(testsDir)) return testsByFile;

  const specFiles = fs.readdirSync(testsDir).filter(f => f.endsWith('.spec.ts'));
  for (const file of specFiles) {
    const content = fs.readFileSync(path.join(testsDir, file), 'utf8');
    // Match test.describe and test blocks
    const describeMatches = [...content.matchAll(/test\.describe\(['"`]([^'"`]+)['"`]/g)];
    const testMatches = [...content.matchAll(/\btest\(['"`]([^'"`]+)['"`]/g)];

    for (const dm of describeMatches) {
      const suiteName = dm[1];
      if (!testsByFile.has(suiteName)) testsByFile.set(suiteName, []);
      // Find tests within each describe block — simplified approach
      for (const tm of testMatches) {
        testsByFile.get(suiteName).push(tm[1]);
      }
    }
  }
  return testsByFile;
}

// ─── Transform legacy JSON ───
function transformLegacy(data) {
  if (data.tests && Array.isArray(data.tests) && data.tests.length > 0 && data.tests[0].pageArea) return data;

  const tests = [];
  let id = 0;
  const specTests = extractTestNames();

  // Process failures first (these have real test names)
  const failureKeys = new Set();
  const deduped = [];
  if (data.failures) {
    for (const f of data.failures) {
      const key = `${f.suite}::${f.test}`;
      if (failureKeys.has(key)) continue;
      failureKeys.add(key);
      deduped.push(f);
    }
  }

  // Track which suite tests are failures
  const failedPerSuite = new Map();
  for (const f of deduped) {
    if (!failedPerSuite.has(f.suite)) failedPerSuite.set(f.suite, new Set());
    failedPerSuite.get(f.suite).add(f.test);
  }

  // Create tests from suites — try to find real test names from spec files
  if (data.suites) {
    for (const suite of data.suites) {
      if (suite.name === 'global.setup.ts') continue;
      const area = resolvePageArea(suite.name, '');
      const viewport = resolveViewport(suite.name, '');

      // Try to match suite name to spec file tests
      let realTests = null;
      for (const [sName, sTests] of specTests) {
        if (suite.name.includes(sName) || sName.includes(suite.name.split('@')[0].trim())) {
          const failedTests = failedPerSuite.get(suite.name) || new Set();
          realTests = sTests.filter(t => !failedTests.has(t));
          break;
        }
      }

      // Add passed tests
      if (realTests && realTests.length > 0) {
        for (const testName of realTests.slice(0, suite.passed)) {
          tests.push({
            id: `T${++id}`, test: testName, suite: suite.name,
            pageArea: area, feature: resolveFeature(testName), viewport,
            status: 'passed', duration: Math.round(suite.duration / Math.max(suite.passed + suite.failed, 1)),
          });
        }
      } else {
        // Fallback: generate named passed tests based on suite name
        for (let i = 0; i < suite.passed; i++) {
          const testName = `${suite.name.split('@')[0].trim()} — test ${i + 1} of ${suite.passed}`;
          tests.push({
            id: `T${++id}`, test: testName, suite: suite.name,
            pageArea: area, feature: resolveFeature(suite.name), viewport,
            status: 'passed', duration: Math.round(suite.duration / Math.max(suite.passed + suite.failed, 1)),
          });
        }
      }
    }
  }

  // Add failure tests (deduplicated, with real names)
  for (const f of deduped) {
    const area = resolvePageArea(f.suite, f.test);
    const cls = classifyError(f.error);
    tests.push({
      id: `T${++id}`, test: f.test, suite: f.suite,
      pageArea: area, feature: resolveFeature(f.test), viewport: resolveViewport(f.suite, f.test),
      status: 'failed', duration: 0,
      errorType: cls.type, rawError: f.error, humanError: cls.humanError,
      recommendation: cls.recommendation, priority: cls.priority,
      screenshots: f.screenshots || [], annotations: f.annotations || [],
    });
  }

  const enriched = {
    timestamp: data.timestamp, duration: data.duration, totals: data.totals,
    suites: (data.suites || []).filter(s => s.name !== 'global.setup.ts').map(s => ({ ...s, pageArea: resolvePageArea(s.name, '') })),
    tests,
    pageAreas: [...new Set(tests.map(t => t.pageArea))].sort(),
    features: [...new Set(tests.map(t => t.feature))].sort(),
  };

  return enriched;
}

// ─── Main ───
if (!fs.existsSync(path.join(__dirname, 'public'))) {
  fs.mkdirSync(path.join(__dirname, 'public'), { recursive: true });
}

try {
  if (!fs.existsSync(srcDir)) {
    console.log('No reports directory found, creating empty shell.');
    fs.writeFileSync(destFile, JSON.stringify({
      timestamp: new Date().toISOString(), duration: 0,
      totals: { passed: 0, failed: 0, skipped: 0, flaky: 0, total: 0 },
      suites: [], tests: [], pageAreas: [], features: [],
    }));
    process.exit(0);
  }

  const files = fs.readdirSync(srcDir)
    .filter(f => f.endsWith('.json'))
    .map(f => ({ name: f, time: fs.statSync(path.join(srcDir, f)).mtime.getTime() }))
    .sort((a, b) => b.time - a.time);

  if (files.length > 0) {
    const raw = JSON.parse(fs.readFileSync(path.join(srcDir, files[0].name), 'utf8'));
    const enriched = transformLegacy(raw);
    fs.writeFileSync(destFile, JSON.stringify(enriched, null, 2));
    console.log(`✅ Synced ${files[0].name} → latest.json`);
    console.log(`   ${enriched.tests.length} tests | ${enriched.pageAreas.length} page areas | ${enriched.features.length} features`);
    console.log(`   Areas: ${enriched.pageAreas.join(', ')}`);
  }
} catch (e) {
  console.error('Error syncing data:', e);
}
