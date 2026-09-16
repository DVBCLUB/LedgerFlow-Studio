import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  issueZeroKnowledgeCredential,
  verifyZkProofCommitment,
  listZkProofLedger,
} from './glaciaZkProofIdentityLedger.ts';

describe('Glacia Self-Sovereign ZK-Proof Identity Ledger (Epoch 11)', () => {
  it('issues zero-knowledge credentials with SHA-256 commitment hash and masked public claims', () => {
    const cred = issueZeroKnowledgeCredential(
      'did:glacia:founder-davidbao',
      'decree13_privacy_compliance',
      { email: 'davidbao1704@gmail.com', revenueVnd: 185000000 }
    );

    assert.ok(cred.credentialId.startsWith('zk-cred-'));
    assert.equal(cred.verificationStatus, 'verified_valid');
    assert.equal(cred.zkProofCommitmentHash.length, 64);
    assert.equal(cred.maskedPublicClaims.isCompliant, true);
  });

  it('cryptographically verifies valid ZK proof commitments', () => {
    const cred = issueZeroKnowledgeCredential();
    const isValid = verifyZkProofCommitment(cred.credentialId);
    assert.equal(isValid, true);
  });

  it('retrieves persistent ZK proof ledger cleanly', () => {
    const list = listZkProofLedger();
    assert.ok(list.length >= 1);
  });
});
