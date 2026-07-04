export type FactoryQueueStatus = 'draft' | 'queued' | 'running' | 'review' | 'done' | 'blocked';
export type FactoryQueueKind = 'planning' | 'coding' | 'qa' | 'media' | 'launch';

export interface FactoryQueueItem {
  id: string;
  title: string;
  kind: FactoryQueueKind;
  owner: string;
  status: FactoryQueueStatus;
  inputRef: string;
  outputRef: string;
}

export const FACTORY_QUEUE_ITEMS: FactoryQueueItem[] = [
  { id: 'fq-prd', title: 'Draft PRD from founder idea', kind: 'planning', owner: 'Product Architect', status: 'queued', inputRef: 'idea brief', outputRef: 'prd.md' },
  { id: 'fq-repo-plan', title: 'Prepare repository build plan', kind: 'coding', owner: 'Coding Swarm', status: 'queued', inputRef: 'prd.md', outputRef: 'repo-plan.md' },
  { id: 'fq-prototype', title: 'Generate prototype patch set', kind: 'coding', owner: 'GitHub IDE Runner', status: 'running', inputRef: 'repo-plan.md', outputRef: 'patch.diff' },
  { id: 'fq-qa', title: 'Review build and test evidence', kind: 'qa', owner: 'QA Runner', status: 'review', inputRef: 'patch.diff', outputRef: 'qa-report.md' },
  { id: 'fq-launch', title: 'Prepare launch kit draft', kind: 'launch', owner: 'Growth Automation', status: 'draft', inputRef: 'qa-report.md', outputRef: 'launch-kit.md' },
];

export function getFactoryQueueSummary(items: FactoryQueueItem[] = FACTORY_QUEUE_ITEMS) {
  return items.reduce<Record<FactoryQueueStatus, number>>((acc, item) => {
    acc[item.status] = (acc[item.status] || 0) + 1;
    return acc;
  }, { draft: 0, queued: 0, running: 0, review: 0, done: 0, blocked: 0 });
}

export function getNextFactoryQueueItem(items: FactoryQueueItem[] = FACTORY_QUEUE_ITEMS) {
  return items.find((item) => item.status === 'running') || items.find((item) => item.status === 'queued') || items.find((item) => item.status === 'draft') || null;
}
