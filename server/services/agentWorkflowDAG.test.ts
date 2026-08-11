import { describe, it, expect } from 'vitest';
import {
  validateAndSortDAG,
  createDAGWorkflow,
  exportDAGMermaid,
  type DAGNodeDefinition,
} from './agentWorkflowDAG.ts';

describe('agentWorkflowDAG', () => {
  const validNodes: DAGNodeDefinition[] = [
    { id: 'spec', name: 'Write Spec', agentRole: 'AI PM', dependsOn: [], promptTemplate: 'Write spec' },
    { id: 'dev', name: 'Code Dev', agentRole: 'AI Dev', dependsOn: ['spec'], promptTemplate: 'Write code' },
    { id: 'test', name: 'QA Test', agentRole: 'AI QA', dependsOn: ['spec'], promptTemplate: 'Write test' },
    { id: 'review', name: 'Code Review', agentRole: 'AI Reviewer', dependsOn: ['dev', 'test'], promptTemplate: 'Review code' },
  ];

  it('validates and topologically sorts DAG nodes', () => {
    const sort = validateAndSortDAG(validNodes);
    expect(sort.valid).toBe(true);
    expect(sort.order.indexOf('spec')).toBeLessThan(sort.order.indexOf('dev'));
    expect(sort.order.indexOf('dev')).toBeLessThan(sort.order.indexOf('review'));
    expect(sort.order.indexOf('test')).toBeLessThan(sort.order.indexOf('review'));
  });

  it('detects cycles in invalid DAG nodes', () => {
    const cyclicNodes: DAGNodeDefinition[] = [
      { id: 'nodeA', name: 'Node A', agentRole: 'roleA', dependsOn: ['nodeB'], promptTemplate: 'pA' },
      { id: 'nodeB', name: 'Node B', agentRole: 'roleB', dependsOn: ['nodeA'], promptTemplate: 'pB' },
    ];

    const sort = validateAndSortDAG(cyclicNodes);
    expect(sort.valid).toBe(false);
    expect(sort.cycleError).toContain('Cycle detected');
  });

  it('creates workflow execution and exports Mermaid diagram', async () => {
    const wf = await createDAGWorkflow({
      name: 'Product Feature DAG',
      nodes: validNodes,
    });

    expect(wf.id).toBeDefined();
    expect(Object.keys(wf.nodes).length).toBe(4);

    const diagram = exportDAGMermaid(validNodes);
    expect(diagram).toContain('flowchart TD');
    expect(diagram).toContain('spec --> dev');
    expect(diagram).toContain('dev --> review');
  });
});
