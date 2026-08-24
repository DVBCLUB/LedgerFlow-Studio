import test from 'node:test';
import assert from 'node:assert/strict';
import {
  listCloudBridgeEndpoints,
  getLocalHardwareTelemetry,
  offloadTaskToCloud,
} from './cloudSpecializedBridgeEngine.ts';

test('cloudSpecializedBridgeEngine - lists specialized cloud endpoints and measures local hardware telemetry', async () => {
  const endpoints = await listCloudBridgeEndpoints();
  assert.ok(endpoints.length > 0);

  const telemetry = getLocalHardwareTelemetry();
  assert.ok(telemetry.cpuUsagePercent < 5);
  assert.equal(telemetry.totalGpuSavedPercent, 100);
});

test('cloudSpecializedBridgeEngine - offloads heavy task to cloud bridge without CPU/GPU load', async () => {
  const endpoints = await listCloudBridgeEndpoints();
  const target = endpoints[0];

  const res = await offloadTaskToCloud(target.id, 'Render 4K Promo Video', { script: 'test' });
  assert.equal(res.success, true);
  assert.ok(res.cloudTaskId?.includes('cloud_job_'));
});

