import { describe, it, expect } from 'vitest';
import {
  listCloudBridgeEndpoints,
  getLocalHardwareTelemetry,
  offloadTaskToCloud,
} from './cloudSpecializedBridgeEngine.ts';

describe('cloudSpecializedBridgeEngine', () => {
  it('lists specialized cloud endpoints and measures local hardware telemetry', async () => {
    const endpoints = await listCloudBridgeEndpoints();
    expect(endpoints.length).toBeGreaterThan(0);

    const telemetry = getLocalHardwareTelemetry();
    expect(telemetry.cpuUsagePercent).toBeLessThan(5);
    expect(telemetry.totalGpuSavedPercent).toBe(100);
  });

  it('offloads heavy task to cloud bridge without CPU/GPU load', async () => {
    const endpoints = await listCloudBridgeEndpoints();
    const target = endpoints[0];

    const res = await offloadTaskToCloud(target.id, 'Render 4K Promo Video', { script: 'test' });
    expect(res.success).toBe(true);
    expect(res.cloudTaskId).toContain('cloud_job_');
  });
});
