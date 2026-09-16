import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  discoverSwarmPeers,
  offloadDistributedJob,
  syncCryptographicMemoryLedger,
  getSwarmMeshTopology,
} from './glaciaSwarmSyncMesh.ts';

describe('Glacia P2P Multi-Device Swarm Sync Mesh (Epoch 9)', () => {
  it('discovers mesh peer nodes across Desktop, Laptop and Cloud VPS', () => {
    const peers = discoverSwarmPeers();

    assert.ok(peers.length >= 2);
    assert.ok(peers.some(p => p.deviceType === 'windows_desktop'));
    assert.ok(peers.some(p => p.deviceType === 'linux_vps'));
  });

  it('offloads heavy distributed computation tasks to remote peer nodes', () => {
    const job = offloadDistributedJob('peer-cloud-vps', '3d_render_batch');

    assert.ok(job.jobId.startsWith('job-'));
    assert.equal(job.assignedPeerId, 'peer-cloud-vps');
    assert.equal(job.status, 'processing');
  });

  it('synchronizes cryptographic memory ledgers between swarm peers', () => {
    const sync = syncCryptographicMemoryLedger('peer-mac-mobile');

    assert.equal(sync.synced, true);
    assert.ok(sync.ledgerHash.startsWith('sha256-'));
    assert.ok(sync.syncedMemoriesCount > 0);
  });

  it('returns full swarm mesh topology with aggregate compute capacity', () => {
    const topology = getSwarmMeshTopology();

    assert.ok(topology.activePeerCount >= 2);
    assert.ok(topology.totalSwarmComputeCapacity.includes('TFLOPS'));
  });
});
