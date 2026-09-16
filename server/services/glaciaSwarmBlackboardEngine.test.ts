import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  loadSwarmBlackboardState,
  executeSwarmConsensusRun,
  createDefaultSwarmSession,
} from './glaciaSwarmBlackboardEngine.ts';

describe('glaciaSwarmBlackboardEngine - Level 4 International Standard Multi-Agent Swarm', () => {
  it('creates and loads swarm session state with 5 specialized agents', () => {
    const session = loadSwarmBlackboardState();
    assert.equal(session.agents.length, 5);
    assert.ok(session.agents.some((a) => a.role === 'lead_architect'));
    assert.ok(session.agents.some((a) => a.role === 'webgl_game'));
    assert.ok(session.agents.some((a) => a.role === 'cgi_vfx'));
    assert.ok(session.agents.some((a) => a.role === 'fullstack_code'));
    assert.ok(session.agents.some((a) => a.role === 'qa_benchmarking'));
  });

  it('contains DAG task nodes and blackboard artifacts', () => {
    const session = createDefaultSwarmSession('Test Goal', 'game');
    assert.ok(session.dagNodes.length >= 5);
    assert.ok(session.blackboardArtifacts.length >= 2);
    assert.ok(session.isConsensusReached);
    assert.ok(session.consensusRate >= 80);
  });

  it('executes swarm consensus run and calculates consensus score', () => {
    const result = executeSwarmConsensusRun({ projectGoal: 'Galaxy Conqueror 3D' });
    assert.equal(result.projectGoal, 'Galaxy Conqueror 3D');
    assert.ok(result.consensusRate >= 90);
    assert.ok(result.glaciaMasterOrchestrationNote.includes('Galaxy Conqueror 3D'));
  });
});
