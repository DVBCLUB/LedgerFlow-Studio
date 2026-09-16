import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  synthesizeAdHocAgentRole,
  orchestrateMultiAgentDebate,
  listSynthesizedRoles,
} from './glaciaSwarmRoleSynthesizer.ts';

describe('Glacia Autonomous Swarm Role Synthesizer (Epoch 10)', () => {
  it('synthesizes specialized AI roles with custom tool matrices and isolated memory partitions', () => {
    const role = synthesizeAdHocAgentRole('Đạo Diễn Âm Thanh Game 3D', 'motion_vfx');

    assert.ok(role.roleId.startsWith('role-'));
    assert.equal(role.domain, 'motion_vfx');
    assert.ok(role.memoryPartitionKey.includes('mem_partition_'));
    assert.ok(role.allowedToolMatrix.length >= 2);
  });

  it('orchestrates autonomous multi-agent debate and produces executive consensus for CEO', () => {
    const debate = orchestrateMultiAgentDebate('Chiến lược mở rộng Micro-VAS sang Đông Nam Á');

    assert.ok(debate.debateId.startsWith('debate-'));
    assert.ok(debate.participatingRoles.length >= 3);
    assert.ok(debate.rounds.length >= 3);
    assert.ok(debate.consensusSynthesis.length > 20);
    assert.ok(debate.actionableDecisionForCEO.length > 10);
  });

  it('retrieves persistent synthesized roles cleanly', () => {
    const list = listSynthesizedRoles();
    assert.ok(list.length >= 3);
  });
});
