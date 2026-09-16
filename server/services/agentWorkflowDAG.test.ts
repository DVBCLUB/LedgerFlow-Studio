import test from 'node:test';
import assert from 'node:assert/strict';
import {
  validateAndSortDAG,
  createDAGWorkflow,
  exportDAGMermaid,
  approveDAGNode,
  rejectDAGNode,
  advanceDAGWorkflow,
  type DAGNodeDefinition,
} from './agentWorkflowDAG.ts';
import { loadAutonomyState, saveAutonomyState } from './glaciaAutonomyGate.ts';

const validNodes: DAGNodeDefinition[] = [
  { id: 'spec', name: 'Write Spec', agentRole: 'AI PM', dependsOn: [], promptTemplate: 'Write spec' },
  { id: 'dev', name: 'Code Dev', agentRole: 'AI Dev', dependsOn: ['spec'], promptTemplate: 'Write code' },
  { id: 'test', name: 'QA Test', agentRole: 'AI QA', dependsOn: ['spec'], promptTemplate: 'Write test' },
  { id: 'review', name: 'Code Review', agentRole: 'AI Reviewer', dependsOn: ['dev', 'test'], promptTemplate: 'Review code' },
];

test('agentWorkflowDAG - validates and topologically sorts DAG nodes', () => {
  const sort = validateAndSortDAG(validNodes);
  assert.equal(sort.valid, true);
  assert.ok(sort.order.indexOf('spec') < sort.order.indexOf('dev'));
  assert.ok(sort.order.indexOf('dev') < sort.order.indexOf('review'));
  assert.ok(sort.order.indexOf('test') < sort.order.indexOf('review'));
});

test('agentWorkflowDAG - detects cycles in invalid DAG nodes', () => {
  const cyclicNodes: DAGNodeDefinition[] = [
    { id: 'nodeA', name: 'Node A', agentRole: 'roleA', dependsOn: ['nodeB'], promptTemplate: 'pA' },
    { id: 'nodeB', name: 'Node B', agentRole: 'roleB', dependsOn: ['nodeA'], promptTemplate: 'pB' },
  ];

  const sort = validateAndSortDAG(cyclicNodes);
  assert.equal(sort.valid, false);
  assert.ok(sort.cycleError?.includes('Cycle detected'));
});

test('agentWorkflowDAG - creates workflow execution and exports Mermaid diagram', async () => {
  const wf = await createDAGWorkflow({
    name: 'Product Feature DAG',
    nodes: validNodes,
  });

  assert.ok(wf.id);
  assert.equal(Object.keys(wf.nodes).length, 4);

  const diagram = exportDAGMermaid(validNodes);
  assert.ok(diagram.includes('flowchart TD'));
  assert.ok(diagram.includes('spec --> dev'));
  assert.ok(diagram.includes('dev --> review'));
});

test('agentWorkflowDAG - handles approval and rejection with trust score adjustments', async () => {
  const approvalNodes: DAGNodeDefinition[] = [
    { id: 'step1', name: 'Plan', agentRole: 'AI PM', dependsOn: [], promptTemplate: 'Plan' },
    { id: 'step2', name: 'Execute', agentRole: 'AI Dev', dependsOn: ['step1'], promptTemplate: 'Execute', requiresApproval: true },
  ];

  const wf = await createDAGWorkflow({
    name: 'Approval Workflow',
    nodes: approvalNodes,
  });

  // Manually set step1 completed and step2 to waiting_approval
  wf.nodes['step1'].status = 'completed';
  wf.nodes['step2'].status = 'waiting_approval';
  wf.status = 'waiting_approval';

  const baseTrust = loadAutonomyState().trustScore;

  // Approve step2
  await approveDAGNode(wf.id, 'step2');
  const approvedTrust = loadAutonomyState().trustScore;
  assert.ok(approvedTrust > baseTrust, 'Trust score should increase after approval');

  // Test reject on another workflow
  const wfReject = await createDAGWorkflow({
    name: 'Reject Workflow',
    nodes: approvalNodes,
  });
  wfReject.nodes['step2'].status = 'waiting_approval';
  wfReject.status = 'waiting_approval';

  await rejectDAGNode(wfReject.id, 'step2', 'Security violation detected');
  assert.equal(wfReject.nodes['step2'].status, 'failed');
  assert.equal(wfReject.status, 'failed');
  const rejectedTrust = loadAutonomyState().trustScore;
  assert.ok(rejectedTrust < approvedTrust, 'Trust score should decrease after rejection');
});


