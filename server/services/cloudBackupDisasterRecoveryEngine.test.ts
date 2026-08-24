import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  createEncryptedCloudSnapshot,
  verifyAndRestoreSnapshot,
} from './cloudBackupDisasterRecoveryEngine.ts';

describe('cloudBackupDisasterRecoveryEngine - AES-256 S3/Wasabi Cold Storage & Hot Failover', () => {
  it('encrypts data payload and validates checksum SHA256 integrity', () => {
    const samplePayload = {
      customers: [{ id: 'C1', name: 'Alpha Tech' }],
      invoices: [{ id: 'INV1', amount: 50000000 }],
      auditLogs: [{ action: 'deal_closed', timestamp: '2026-08-22' }],
    };

    const snapshot = createEncryptedCloudSnapshot({
      sourceWorkspace: 'finance_accounting',
      targetCloudStorage: 'wasabi',
      dataPayload: samplePayload,
    });

    assert.ok(snapshot.snapshotId.startsWith('SNAP_'));
    assert.equal(snapshot.targetCloudStorage, 'wasabi');
    assert.equal(snapshot.status, 'replicated_to_cloud');
    assert.ok(snapshot.checksumSha256.length === 64);
    assert.ok(snapshot.encryptedDataHex.length > 0);

    // Verify and decrypt
    const restoreResult = verifyAndRestoreSnapshot(snapshot);
    assert.equal(restoreResult.valid, true);
    assert.equal(restoreResult.decryptedRecordsCount, 3);
    assert.ok(restoreResult.message.includes('Khôi phục thành công'));
  });

  it('detects tampered encrypted data with checksum mismatch', () => {
    const snapshot = createEncryptedCloudSnapshot({
      sourceWorkspace: 'product_studio',
      targetCloudStorage: 'cloudflare_r2',
      dataPayload: { test: 123 },
    });

    // Tamper with checksum
    const tamperedSnapshot = { ...snapshot, checksumSha256: 'tampered_fake_checksum_123456789' };
    const restoreResult = verifyAndRestoreSnapshot(tamperedSnapshot);

    assert.equal(restoreResult.valid, false);
    assert.ok(restoreResult.message.includes('Checksum SHA256 không khớp'));
  });
});
