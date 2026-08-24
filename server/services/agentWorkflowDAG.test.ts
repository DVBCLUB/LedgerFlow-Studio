import test from 'node:test';
import assert from 'node:assert/strict';
import {
  validateAndSortDAG,
  createDAGWorkflow,
  exportDAGMermaid,
  type DAGNodeDefinition,
} from './agentWorkflowDAG.ts';

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

