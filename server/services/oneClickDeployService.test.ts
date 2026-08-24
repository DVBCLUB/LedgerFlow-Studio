import test from 'node:test';
import assert from 'node:assert/strict';
import {
  deployProjectToCloud,
  rollbackDeployment,
  listDeployments,
} from './oneClickDeployService.ts';

test('oneClickDeployService - deploys project to cloud provider and generates live URL', async () => {
  const record = await deployProjectToCloud({
    projectName: 'LedgerFlow Accounting Portal',
    provider: 'vercel',
  });

  assert.ok(record.id);
  assert.equal(record.status, 'deployed');
  assert.ok(record.liveUrl.includes('vercel.app'));

  const deployments = await listDeployments();
  assert.ok(deployments.length > 0);
});

test('oneClickDeployService - rolls back deployment status', async () => {
  const record = await deployProjectToCloud({
    projectName: 'Marketing Site Mockup',
    provider: 'netlify',
  });

  const rolledBack = await rollbackDeployment(record.id);
  assert.equal(rolledBack?.status, 'rolled_back');
});

