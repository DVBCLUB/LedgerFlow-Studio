export type FactoryWorkflowStatus = 'idle' | 'ready' | 'active' | 'review' | 'blocked';
export type FactoryWorkflowKind = 'intake' | 'queue' | 'route' | 'run' | 'asset' | 'review' | 'launch';

export interface FactoryWorkflowNode {
  id: string;
  kind: FactoryWorkflowKind;
  label: string;
  status: FactoryWorkflowStatus;
  input: string;
  output: string;
  nextIds: string[];
}

export const FACTORY_WORKFLOW_NODES: FactoryWorkflowNode[] = [
  { id: 'fw-intake', kind: 'intake', label: 'Intake Console', status: 'ready', input: 'Founder brief', output: 'Structured product brief', nextIds: ['fw-queue'] },
  { id: 'fw-queue', kind: 'queue', label: 'Work Queue', status: 'active', input: 'Structured product brief', output: 'Ordered work items', nextIds: ['fw-route'] },
  { id: 'fw-route', kind: 'route', label: 'Route Planner', status: 'ready', input: 'Work item', output: 'Selected work profile', nextIds: ['fw-run'] },
  { id: 'fw-run', kind: 'run', label: 'Workspace Runner', status: 'idle', input: 'Work order and work profile', output: 'Patch, build note, run log', nextIds: ['fw-asset', 'fw-review'] },
  { id: 'fw-asset', kind: 'asset', label: 'Asset Board', status: 'ready', input: 'Generated output', output: 'Stored asset records', nextIds: ['fw-review'] },
  { id: 'fw-review', kind: 'review', label: 'Review Board', status: 'review', input: 'Assets and run evidence', output: 'Decision and fix notes', nextIds: ['fw-launch'] },
  { id: 'fw-launch', kind: 'launch', label: 'Launch Kit', status: 'idle', input: 'Reviewed package', output: 'Launch assets', nextIds: [] },
];

export function getFactoryWorkflowNode(id: string, nodes: FactoryWorkflowNode[] = FACTORY_WORKFLOW_NODES) {
  return nodes.find((node) => node.id === id) || null;
}

export function getFactoryWorkflowFlow(nodes: FactoryWorkflowNode[] = FACTORY_WORKFLOW_NODES) {
  return nodes.map((node) => ({ id: node.id, label: node.label, status: node.status, nextIds: node.nextIds }));
}

export function getActiveFactoryWorkflow(nodes: FactoryWorkflowNode[] = FACTORY_WORKFLOW_NODES) {
  return nodes.filter((node) => node.status === 'active' || node.status === 'review');
}
