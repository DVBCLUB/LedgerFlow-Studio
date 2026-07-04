export type FactoryIdeTarget = 'github' | 'vscode' | 'cursor' | 'claude_code' | 'antigravity' | 'google_ai_studio';
export type FactoryRunnerStepStatus = 'planned' | 'ready' | 'running' | 'review' | 'complete';

export interface FactoryIdeRunnerStep {
  id: string;
  target: FactoryIdeTarget;
  title: string;
  status: FactoryRunnerStepStatus;
  input: string;
  output: string;
}

export const FACTORY_IDE_RUNNER_STEPS: FactoryIdeRunnerStep[] = [
  { id: 'git-branch', target: 'github', title: 'Create working branch', status: 'ready', input: 'repo plan', output: 'branch name and commit base' },
  { id: 'write-patch', target: 'github', title: 'Write code patch', status: 'planned', input: 'work order', output: 'changed files and patch summary' },
  { id: 'local-check', target: 'vscode', title: 'Run local check command', status: 'planned', input: 'package scripts', output: 'terminal summary' },
  { id: 'cursor-review', target: 'cursor', title: 'Review implementation in IDE', status: 'planned', input: 'diff and failing notes', output: 'review notes' },
  { id: 'release-pr', target: 'github', title: 'Open release pull request', status: 'review', input: 'checked patch', output: 'pull request draft' },
];

export function getFactoryRunnerStepsByTarget(target: FactoryIdeTarget, steps: FactoryIdeRunnerStep[] = FACTORY_IDE_RUNNER_STEPS) {
  return steps.filter((step) => step.target === target);
}

export function getFactoryRunnerProgress(steps: FactoryIdeRunnerStep[] = FACTORY_IDE_RUNNER_STEPS) {
  const complete = steps.filter((step) => step.status === 'complete').length;
  return { complete, total: steps.length, percent: steps.length ? Math.round((complete / steps.length) * 100) : 0 };
}
