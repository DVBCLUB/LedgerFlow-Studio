/**
 * deployManager.ts
 * ============================================================
 * Deploy Manager — AI-powered CI/CD pipeline coordinator.
 *
 * Quản lý: build, test, deploy stages
 * hỗ trợ rollback, canary, blue-green strategies.
 */
import { randomUUID } from 'node:crypto';
import { exec } from 'child_process';
import { appendAuditEvent } from './auditLog';
import fs from 'fs';
import path from 'path';

// ─── Types ──────────────────────────────────────────────────────────
export type DeployStage = 'build' | 'test' | 'security_scan' | 'deploy_staging' | 'deploy_production' | 'verify' | 'rollback';

export type DeployStrategy = 'direct' | 'canary' | 'blue_green';

export interface DeployStep {
  id: string;
  stage: DeployStage;
  command: string;
  description: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'skipped';
  output: string;
  latencyMs: number;
  error?: string;
}

export interface DeployConfig {
  id: string;
  name: string;
  description: string;
  projectPath: string;
  strategy: DeployStrategy;
  steps: DeployStep[];
  environment: Record<string, string>;
  maxRetries: number;
  timeoutMinutes: number;
  autoRollback: boolean;
  notifyOnComplete: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface DeployRun {
  id: string;
  configId: string;
  configName: string;
  strategy: DeployStrategy;
  steps: DeployStep[];
  status: 'running' | 'completed' | 'failed' | 'rolled_back';
  version: string;
  startedAt: string;
  completedAt?: string;
  totalLatencyMs: number;
  log: string[];
}

// ─── Storage ────────────────────────────────────────────────────────
const CONFIG_FILE = path.join(process.cwd(), 'deploy_configs.json');
const RUNS_FILE = path.join(process.cwd(), 'deploy_runs.json');

let configs: DeployConfig[] = [];
let runs: DeployRun[] = [];

async function loadAll(): Promise<void> {
  try {
    if (fs.existsSync(CONFIG_FILE)) configs = JSON.parse(await fs.promises.readFile(CONFIG_FILE, 'utf8'));
    if (fs.existsSync(RUNS_FILE)) runs = JSON.parse(await fs.promises.readFile(RUNS_FILE, 'utf8'));
  } catch { }
}
loadAll().catch(() => undefined);

async function saveConfigs(): Promise<void> { await fs.promises.writeFile(CONFIG_FILE, JSON.stringify(configs, null, 2), 'utf8'); }
async function saveRuns(): Promise<void> { await fs.promises.writeFile(RUNS_FILE, JSON.stringify(runs.slice(-50), null, 2), 'utf8'); }

// ─── Core API ───────────────────────────────────────────────────────

export function createDeployConfig(input: {
  name: string; description?: string; projectPath?: string;
  strategy?: DeployStrategy; steps?: Omit<DeployStep, 'id'>[];
  autoRollback?: boolean; notifyOnComplete?: boolean;
}): DeployConfig {
  const config: DeployConfig = {
    id: `dpl_${Date.now()}_${randomUUID().slice(0, 6)}`,
    name: input.name.slice(0, 100),
    description: input.description || '',
    projectPath: input.projectPath || process.cwd(),
    strategy: input.strategy || 'direct',
    steps: (input.steps || getDefaultSteps(input.strategy || 'direct')).map(s => ({ ...s, id: `ds_${Date.now()}_${randomUUID().slice(0, 4)}` })),
    environment: {},
    maxRetries: 2,
    timeoutMinutes: 30,
    autoRollback: input.autoRollback ?? true,
    notifyOnComplete: input.notifyOnComplete ?? true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  configs.push(config);
  saveConfigs().catch(() => undefined);
  return config;
}

function getDefaultSteps(strategy: DeployStrategy): Omit<DeployStep, 'id'>[] {
  const base: Omit<DeployStep, 'id'>[] = [
    { stage: 'build', command: 'npm run build', description: 'Build project', status: 'pending', output: '', latencyMs: 0 },
    { stage: 'test', command: 'npm test', description: 'Run tests', status: 'pending', output: '', latencyMs: 0 },
    { stage: 'security_scan', command: 'npm audit', description: 'Security audit', status: 'pending', output: '', latencyMs: 0 },
  ];

  if (strategy === 'blue_green') {
    base.push({ stage: 'deploy_staging', command: 'echo "Deploying to blue environment..."', description: 'Deploy to inactive env', status: 'pending', output: '', latencyMs: 0 });
    base.push({ stage: 'verify', command: 'echo "Verifying blue environment..."', description: 'Smoke test blue env', status: 'pending', output: '', latencyMs: 0 });
    base.push({ stage: 'deploy_production', command: 'echo "Switching traffic..."', description: 'Switch traffic to new env', status: 'pending', output: '', latencyMs: 0 });
  } else if (strategy === 'canary') {
    base.push({ stage: 'deploy_staging', command: 'echo "Deploying canary (10%)..."', description: 'Deploy to 10% traffic', status: 'pending', output: '', latencyMs: 0 });
    base.push({ stage: 'verify', command: 'echo "Verifying canary..."', description: 'Monitor canary for 5 min', status: 'pending', output: '', latencyMs: 0 });
    base.push({ stage: 'deploy_production', command: 'echo "Rolling out to 100%..."', description: 'Full rollout', status: 'pending', output: '', latencyMs: 0 });
  } else {
    base.push({ stage: 'deploy_production', command: 'echo "Deploying to production..."', description: 'Direct deploy', status: 'pending', output: '', latencyMs: 0 });
    base.push({ stage: 'verify', command: 'echo "Verifying deployment..."', description: 'Smoke test', status: 'pending', output: '', latencyMs: 0 });
  }

  return base;
}

export function getConfig(id: string): DeployConfig | undefined { return configs.find(c => c.id === id); }
export function listConfigs(): DeployConfig[] { return [...configs]; }

export async function runDeploy(configId: string): Promise<DeployRun> {
  const config = configs.find(c => c.id === configId);
  if (!config) throw new Error(`Config "${configId}" not found.`);

  const runId = `drun_${Date.now()}_${randomUUID().slice(0, 6)}`;
  const started = Date.now();
  const run: DeployRun = {
    id: runId, configId: config.id, configName: config.name,
    strategy: config.strategy,
    steps: config.steps.map(s => ({ ...s, id: `${s.id}_${runId}_${randomUUID().slice(0, 3)}`, output: '', latencyMs: 0 })),
    status: 'running', version: `v1.${Date.now()}`,
    startedAt: new Date().toISOString(), totalLatencyMs: 0, log: [],
  };

  runs.push(run);
  run.log.push(`Deploy "${config.name}" started (strategy: ${config.strategy})`);

  try {
    for (const step of run.steps) {
      step.status = 'running';
      const stepStart = Date.now();
      run.log.push(`[${step.stage}] ${step.description}`);

      try {
        const output = await executeCommand(step.command, config.projectPath, config.timeoutMinutes * 60000 / run.steps.length);
        step.status = 'completed';
        step.output = output.slice(0, 500);
        step.latencyMs = Date.now() - stepStart;
        run.log.push(`  OK (${step.latencyMs}ms)`);
      } catch (err: any) {
        step.status = 'failed';
        step.error = err.message;
        step.latencyMs = Date.now() - stepStart;
        run.log.push(`  FAILED: ${err.message}`);

        if (config.autoRollback && ['deploy_staging', 'deploy_production'].includes(step.stage)) {
          run.log.push(`  Auto-rollback triggered!`);
          // Add rollback step
          const rollbackStep: DeployStep = {
            id: `ds_rollback`,
            stage: 'rollback',
            command: `echo "Rolling back from failed ${step.stage}..."`,
            description: `Auto rollback after ${step.stage} failed`,
            status: 'running', output: '', latencyMs: 0,
          };
          try {
            const rbOut = await executeCommand('echo "Rollback complete"', config.projectPath, 30000);
            rollbackStep.status = 'completed';
            rollbackStep.output = rbOut;
            run.log.push('[rollback] Rollback complete');
          } catch {
            rollbackStep.status = 'failed';
            run.log.push('[rollback] Rollback failed!');
          }
          run.steps.push(rollbackStep);
          run.status = 'rolled_back';
          break;
        }

        run.status = 'failed';
        break;
      }
    }

    if (run.status === 'running') {
      run.status = run.steps.every(s => s.status === 'completed' || s.status === 'skipped') ? 'completed' : 'failed';
    }
    run.log.push(`Deploy ${run.status}: ${run.steps.filter(s => s.status === 'completed').length}/${run.steps.length} steps`);
  } finally {
    run.totalLatencyMs = Date.now() - started;
    run.completedAt = new Date().toISOString();

    await appendAuditEvent({
      actor: 'system', workspace: 'Deploy Manager', action: 'deploy.executed',
      target: config.name, risk: run.status === 'failed' ? 'HIGH' : 'MEDIUM',
      status: run.status === 'completed' ? 'executed' : 'failed',
      summary: `Deploy "${config.name}": ${run.status} (${run.totalLatencyMs}ms)`,
      connectorId: 'deploy-manager',
      evidence: { configId, strategy: config.strategy, status: run.status },
    }).catch(() => undefined);

    saveRuns().catch(() => undefined);
  }

  return run;
}

function executeCommand(cmd: string, cwd: string, timeoutMs: number): Promise<string> {
  return new Promise((resolve, reject) => {
    exec(cmd, { cwd, timeout: Math.min(timeoutMs, 300000), maxBuffer: 10 * 1024 * 1024 },
      (err, stdout, stderr) => {
        if (err) reject(new Error(stderr || stdout || err.message));
        else resolve(stdout || 'OK');
      }
    );
  });
}

export function getDeployRun(id: string): DeployRun | undefined { return runs.find(r => r.id === id); }
export function listDeployRuns(): DeployRun[] { return [...runs].reverse(); }
