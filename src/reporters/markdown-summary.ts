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

interface TestRecord {
  name: string;
  suite: string;
  status: string;
  duration: number;
  error?: string;
  screenshots: string[];
  annotations: { type: string; description?: string }[];
}

class MarkdownSummaryReporter implements Reporter {
  private outputDir: string;
  private tests: TestRecord[] = [];
  private startTime: number = 0;

  constructor(options: { outputDir?: string } = {}) {
    this.outputDir = options.outputDir || 'reports/markdown';
  }

  onBegin(_config: FullConfig, _suite: Suite): void {
    this.startTime = Date.now();
  }

  onTestEnd(test: TestCase, result: TestResult): void {
    this.tests.push({
      name: test.title,
      suite: test.parent?.title || 'Unknown Suite',
      status: result.status,
      duration: result.duration,
      error: result.errors.length > 0
        ? result.errors.map(e => e.message || e.toString()).join('\n')
        : undefined,
      screenshots: result.attachments
        .filter(a => a.contentType?.startsWith('image/'))
        .map(a => a.path || ''),
      annotations: test.annotations,
    });
  }

  async onEnd(result: FullResult): Promise<void> {
    const totalDuration = Date.now() - this.startTime;
    const date = new Date().toISOString().split('T')[0];
    const time = new Date().toLocaleTimeString('en-US', { hour12: true });

    const passed = this.tests.filter(t => t.status === 'passed').length;
    const failed = this.tests.filter(t => t.status === 'failed' || t.status === 'timedOut').length;
    const skipped = this.tests.filter(t => t.status === 'skipped').length;
    const flaky = this.tests.filter(t => t.status === 'passed' && t.annotations.some(a => a.type === 'retry')).length;
    const total = this.tests.length;

    const passRate = total > 0 ? ((passed / total) * 100).toFixed(1) : '0';

    let md = '';

    // Header
    md += `# Dermalogica.com QA Report\n\n`;
    md += `**Date:** ${date} at ${time}\n`;
    md += `**Duration:** ${this.formatDuration(totalDuration)}\n`;
    md += `**Overall Status:** ${failed === 0 ? 'PASS' : 'ISSUES FOUND'}\n\n`;

    // Summary table
    md += `## Summary\n\n`;
    md += `| Metric | Value |\n`;
    md += `|--------|-------|\n`;
    md += `| Total Tests | ${total} |\n`;
    md += `| Passed | ${passed} |\n`;
    md += `| Failed | ${failed} |\n`;
    md += `| Skipped | ${skipped} |\n`;
    md += `| Pass Rate | ${passRate}% |\n\n`;

    // Suite breakdown
    md += `## Results by Suite\n\n`;
    md += `| Suite | Passed | Failed | Skipped | Duration |\n`;
    md += `|-------|--------|--------|---------|----------|\n`;

    const suiteGroups = this.groupBySuite();
    for (const [suite, tests] of suiteGroups) {
      const suitePassed = tests.filter(t => t.status === 'passed').length;
      const suiteFailed = tests.filter(t => t.status === 'failed' || t.status === 'timedOut').length;
      const suiteSkipped = tests.filter(t => t.status === 'skipped').length;
      const suiteDuration = tests.reduce((sum, t) => sum + t.duration, 0);
      const statusIcon = suiteFailed > 0 ? '🔴' : suiteSkipped > 0 ? '🟡' : '🟢';
      md += `| ${statusIcon} ${suite} | ${suitePassed} | ${suiteFailed} | ${suiteSkipped} | ${this.formatDuration(suiteDuration)} |\n`;
    }
    md += '\n';

    // Failures section
    const failures = this.tests.filter(t => t.status === 'failed' || t.status === 'timedOut');
    if (failures.length > 0) {
      md += `## Failures\n\n`;
      md += `> ${failures.length} test(s) failed and require attention.\n\n`;

      for (const failure of failures) {
        md += `### ${failure.suite} — ${failure.name}\n\n`;
        if (failure.error) {
          // Truncate long errors
          const errorMsg = failure.error.length > 500
            ? failure.error.slice(0, 500) + '...'
            : failure.error;
          md += `**Error:**\n\`\`\`\n${errorMsg}\n\`\`\`\n\n`;
        }
        if (failure.screenshots.length > 0) {
          md += `**Screenshots:** ${failure.screenshots.map(s => `\`${path.basename(s)}\``).join(', ')}\n\n`;
        }
      }
    }

    // Skipped tests (captcha-related)
    const captchaSkipped = this.tests.filter(t =>
      t.annotations.some(a => a.type === 'captcha-blocked')
    );
    if (captchaSkipped.length > 0) {
      md += `## Captcha-Blocked Tests\n\n`;
      md += `The following tests were skipped due to captcha detection:\n\n`;
      for (const test of captchaSkipped) {
        md += `- **${test.name}** (${test.suite})\n`;
      }
      md += '\n';
    }

    // Performance metrics
    const perfMetrics = this.tests.flatMap(t =>
      t.annotations
        .filter(a => a.type === 'metric')
        .map(a => ({ test: t.name, metric: a.description || '' }))
    );
    if (perfMetrics.length > 0) {
      md += `## Performance Metrics\n\n`;
      md += `| Test | Metric |\n`;
      md += `|------|--------|\n`;
      for (const m of perfMetrics) {
        md += `| ${m.test} | ${m.metric} |\n`;
      }
      md += '\n';
    }

    // SEO findings
    const seoAnnotations = this.tests.flatMap(t =>
      t.annotations
        .filter(a => a.type === 'seo')
        .map(a => ({ test: t.name, finding: a.description || '' }))
    );
    if (seoAnnotations.length > 0) {
      md += `## SEO Findings\n\n`;
      for (const s of seoAnnotations) {
        md += `- ${s.finding}\n`;
      }
      md += '\n';
    }

    // Accessibility findings
    const a11yAnnotations = this.tests.flatMap(t =>
      t.annotations
        .filter(a => a.type === 'a11y')
        .map(a => ({ test: t.name, finding: a.description || '' }))
    );
    if (a11yAnnotations.length > 0) {
      md += `## Accessibility Findings\n\n`;
      for (const a of a11yAnnotations) {
        md += `- ${a.finding}\n`;
      }
      md += '\n';
    }

    // Warnings
    const warnings = this.tests.flatMap(t =>
      t.annotations
        .filter(a => a.type === 'warning')
        .map(a => ({ test: t.name, warning: a.description || '' }))
    );
    if (warnings.length > 0) {
      md += `## Warnings\n\n`;
      for (const w of warnings) {
        md += `- **${w.test}:** ${w.warning}\n`;
      }
      md += '\n';
    }

    // Recommendations
    md += `## Recommendations\n\n`;
    if (failed === 0) {
      md += `All tests passed. The site is functioning as expected.\n\n`;
    } else {
      md += `${failed} test(s) failed. Recommended actions:\n\n`;
      if (failures.some(f => f.suite.includes('Performance'))) {
        md += `- **Performance:** Review page load times and optimize assets\n`;
      }
      if (failures.some(f => f.suite.includes('Accessibility'))) {
        md += `- **Accessibility:** Fix critical WCAG violations for compliance\n`;
      }
      if (failures.some(f => f.suite.includes('Cart') || f.suite.includes('Checkout'))) {
        md += `- **E-commerce (Critical):** Cart/checkout issues directly impact revenue — prioritize fixes\n`;
      }
      if (failures.some(f => f.suite.includes('SEO'))) {
        md += `- **SEO:** Fix meta tag and structured data issues for search visibility\n`;
      }
      if (failures.some(f => f.suite.includes('Mobile'))) {
        md += `- **Mobile:** Fix responsive layout issues — majority of traffic is mobile\n`;
      }
      md += '\n';
    }

    // Footer
    md += `---\n`;
    md += `*Report generated by Dermalogica QA Agent (Playwright)*\n`;
    md += `*View detailed HTML report: \`npx playwright show-report reports/html\`*\n`;

    // Write the report
    fs.mkdirSync(this.outputDir, { recursive: true });
    const outputPath = path.join(this.outputDir, `qa-report-${date}.md`);
    fs.writeFileSync(outputPath, md);
  }

  private groupBySuite(): Map<string, TestRecord[]> {
    const groups = new Map<string, TestRecord[]>();
    for (const test of this.tests) {
      const existing = groups.get(test.suite) || [];
      existing.push(test);
      groups.set(test.suite, existing);
    }
    return groups;
  }

  private formatDuration(ms: number): string {
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    const mins = Math.floor(ms / 60000);
    const secs = Math.floor((ms % 60000) / 1000);
    return `${mins}m ${secs}s`;
  }
}

export default MarkdownSummaryReporter;
