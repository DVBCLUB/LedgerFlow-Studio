import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  parseHtmlContent,
  runAutonomousWebResearch,
  trackCompetitor,
  getWebResearchReports,
  getCompetitorAlerts,
} from './glaciaWebAgent.ts';

describe('glaciaWebAgent - Autonomous Web Agent & Spider', () => {
  it('parses HTML content into structured headings, snippets, links and text', () => {
    const sampleHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>LedgerFlow Architecture Overview</title>
          <meta name="description" content="Software Company OS architecture and AI Robot design.">
        </head>
        <body>
          <h1>Introduction</h1>
          <p>Glacia is a digital human software robot for LedgerFlow Studio.</p>
          <h2>Code Sample</h2>
          <pre><code>const glacia = new Glacia();</code></pre>
          <a href="https://example.com/docs">Documentation</a>
        </body>
      </html>
    `;

    const parsed = parseHtmlContent('https://example.com', sampleHtml);
    assert.equal(parsed.title, 'LedgerFlow Architecture Overview');
    assert.equal(parsed.description, 'Software Company OS architecture and AI Robot design.');
    assert.ok(parsed.headings.includes('Introduction'));
    assert.ok(parsed.headings.includes('Code Sample'));
    assert.ok(parsed.codeSnippets.some(s => s.includes('const glacia = new Glacia()')));
    assert.ok(parsed.links.includes('https://example.com/docs'));
  });

  it('runs autonomous research and generates synthesized reports', async () => {
    const report = await runAutonomousWebResearch({
      topic: 'AI Agent Architecture Trends',
      autoSaveToMemory: false,
    });

    assert.ok(report.id.startsWith('rep_'));
    assert.equal(report.topic, 'AI Agent Architecture Trends');
    assert.ok(report.keyFindings.length > 0);
    assert.ok(report.suggestedActions.length > 0);

    const allReports = getWebResearchReports();
    assert.ok(allReports.length > 0);
  });

  it('tracks competitor snapshots and triggers change alerts on differences', async () => {
    const first = await trackCompetitor({
      competitorName: 'AcmeAccounting',
      url: 'https://example.com/acme',
      pricingSummary: 'Gia khoi diem 500k/thang',
    });
    assert.ok(first.snapshot);

    const second = await trackCompetitor({
      competitorName: 'AcmeAccounting',
      url: 'https://example.com/acme',
      pricingSummary: 'Gia moi 700k/thang (Tang 40%)',
    });

    assert.ok(second.alert);
    assert.equal(second.alert.changeType, 'pricing_shift');
    assert.ok(second.alert.details.includes('Tang 40%'));

    const alerts = getCompetitorAlerts();
    assert.ok(alerts.length > 0);
  });
});
