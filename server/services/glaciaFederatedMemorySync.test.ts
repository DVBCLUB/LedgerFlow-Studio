import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  listBrainPeerNodes,
  runFederatedSyncSession,
  saveBrainPeers,
} from './glaciaFederatedMemorySync.ts';

describe('Glacia Federated Multi-Brain Architecture (Frontier 2)', () => {
  it('loads active peer nodes with roles spanning Prime Laptop, Cloud VM and Mobile Satellite', () => {
    const peers = listBrainPeerNodes();
    assert.ok(peers.length >= 3);

    const prime = peers.find((p) => p.role === 'prime_laptop');
    const cloud = peers.find((p) => p.role === 'worker_cloud_vm');
    assert.ok(prime);
    assert.ok(cloud);
    assert.equal(prime.status, 'online');
    assert.equal(cloud.status, 'online');
  });

  it('runs a federated sync session and synchronizes memories and skills across peer nodes', () => {
    const report = runFederatedSyncSession();
    assert.ok(report.syncSessionId.startsWith('sync-fed-'));
    assert.ok(report.participatingNodes >= 2);
    assert.equal(report.status, 'success');
    assert.ok(report.memoriesSynchronized > 0);
    assert.ok(report.vectorClock['node-prime-laptop']);
  });

  it('updates and persists peer network topology changes cleanly', () => {
    const peers = listBrainPeerNodes();
    const prime = peers.find((p) => p.role === 'prime_laptop')!;
    const originalPing = prime.pingMs;

    prime.pingMs = 2;
    saveBrainPeers(peers);

    const reloaded = listBrainPeerNodes();
    const updatedPrime = reloaded.find((p) => p.role === 'prime_laptop')!;
    assert.equal(updatedPrime.pingMs, 2);

    // Restore
    updatedPrime.pingMs = originalPing;
    saveBrainPeers(reloaded);
  });
});
