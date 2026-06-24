export type FactoryLaneStatus = 'idle' | 'queued' | 'running' | 'review' | 'done';

export interface FactoryRuntimeLane {
  id: string;
  label: string;
  owner: string;
  status: FactoryLaneStatus;
  output: string;
}

export const FACTORY_RUNTIME_LANES: FactoryRuntimeLane[] = [
  { id: 'planning', label: 'Planning', owner: 'Product Architect', status: 'queued', output: 'PRD, scope, roadmap, acceptance criteria' },
  { id: 'coding', label: 'Coding', owner: 'Coding Swarm', status: 'queued', output: 'Source tree, patch set, tests, README' },
  { id: 'qa', label: 'QA', owner: 'QA Runner', status: 'review', output: 'Test result, issue list, release confidence' },
  { id: 'media', label: 'Media', owner: 'Game and Media Cell', status: 'idle', output: 'Video script, thumbnail prompts, asset list' },
  { id: 'launch', label: 'Launch', owner: 'Growth Automation', status: 'review', output: 'Landing copy, ads, store listing, release note' },
];

export function countFactoryLaneStatuses(lanes: FactoryRuntimeLane[] = FACTORY_RUNTIME_LANES) {
  return lanes.reduce<Record<FactoryLaneStatus, number>>((acc, lane) => {
    acc[lane.status] = (acc[lane.status] || 0) + 1;
    return acc;
  }, { idle: 0, queued: 0, running: 0, review: 0, done: 0 });
}
