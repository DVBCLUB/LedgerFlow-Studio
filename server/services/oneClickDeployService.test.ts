import { describe, it, expect } from 'vitest';
import {
  deployProjectToCloud,
  rollbackDeployment,
  listDeployments,
} from './oneClickDeployService.ts';

describe('oneClickDeployService', () => {
  it('deploys project to cloud provider and generates live URL', async () => {
    const record = await deployProjectToCloud({
      projectName: 'LedgerFlow Accounting Portal',
      provider: 'vercel',
    });

    expect(record.id).toBeDefined();
    expect(record.status).toBe('deployed');
    expect(record.liveUrl).toContain('vercel.app');

    const deployments = await listDeployments();
    expect(deployments.length).toBeGreaterThan(0);
  });

  it('rolls back deployment status', async () => {
    const record = await deployProjectToCloud({
      projectName: 'Marketing Site Mockup',
      provider: 'netlify',
    });

    const rolledBack = await rollbackDeployment(record.id);
    expect(rolledBack?.status).toBe('rolled_back');
  });
});
