import assert from 'node:assert/strict';
import test from 'node:test';
import {
  executeSoftwareRobotWorkflow,
  getSoftwareRobotWorkflow,
  listSoftwareRobotWorkflows,
} from './softwareRobotOrchestrator.ts';

test('executeSoftwareRobotWorkflow runs actions and produces visual checkpoints', async () => {
  const workflow = await executeSoftwareRobotWorkflow({
    name: 'Auto-process Invoice PDF and Fill Web Form',
    requestedBy: 'test_user',
    actions: [
      {
        id: 'act_1',
        type: 'office_file_process',
        name: 'Extract Invoice PDF',
        payload: { filePath: 'runtime/invoices/inv_001.pdf' },
      },
      {
        id: 'act_2',
        type: 'browser_form_fill',
        name: 'Fill SaaS Accounting Form',
        payload: { url: 'https://app.accounting.vn/invoices/new' },
      },
    ],
  });

  assert.ok(workflow.id.startsWith('sw_robot_'));
  assert.equal(workflow.status, 'completed');
  assert.equal(workflow.checkpoints.length, 2);
  assert.equal(workflow.checkpoints[0].status, 'passed');

  const retrieved = getSoftwareRobotWorkflow(workflow.id);
  assert.equal(retrieved?.id, workflow.id);
});

test('executeSoftwareRobotWorkflow supports dryRun mode', async () => {
  const workflow = await executeSoftwareRobotWorkflow({
    name: 'Dry Run Web Scraping Workflow',
    dryRun: true,
    actions: [
      {
        id: 'act_dry',
        type: 'browser_scrape',
        name: 'Scrape Market Competitor Prices',
        payload: { targetUrl: 'https://example.com' },
      },
    ],
  });

  assert.equal(workflow.status, 'completed');
  assert.equal(workflow.checkpoints[0].status, 'dry_run');
  assert.ok(workflow.checkpoints[0].evidenceSummary.includes('[Dry-run]'));
});

test('listSoftwareRobotWorkflows lists recent software workflows', async () => {
  const list = listSoftwareRobotWorkflows(10);
  assert.ok(list.length >= 1);
});
