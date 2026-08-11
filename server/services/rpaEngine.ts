/**
 * rpaEngine.ts
 * ============================================================
 * RPA Engine — Robotic Process Automation engine.
 * Tự động hóa thao tác: file, shell, HTTP, file-watch, schedule.
 *
 * Robot scripts có thể chạy tuần tự hoặc song song,
 * với retry, timeout, và error recovery.
 */
import { randomUUID } from 'node:crypto';
import { execSync, exec } from 'child_process';
import fs from 'node:fs';
import path from 'node:path';
import { appendAuditEvent } from './auditLog.ts';
import { ensureRuntimeRootSync, resolveRuntimePathFromEnv, resolveRuntimeReadPathFromEnv } from './runtimePaths.ts';

// ─── Types ──────────────────────────────────────────────────────────
export type RPAActionType = 'shell' | 'copy_file' | 'move_file' | 'delete_file' | 'http_request' | 'wait' | 'notify';

export interface RPAAction {
  id: string;
  type: RPAActionType;
  description: string;
  params: Record<string, string>;
  retries: number;
  timeoutMs: number;
  continueOnError: boolean;
}

export interface RPAActionResult {
  actionId: string;
  description: string;
  status: 'completed' | 'failed' | 'skipped' | 'timed_out';
  output: string;
  error?: string;
  latencyMs: number;
  retriesUsed: number;
}

export interface RPAScript {
  id: string;
  name: string;
  description: string;
  actions: RPAAction[];
  parallel: boolean;            // Chạy song song hay tuần tự
  maxConcurrency: number;
  cronExpression?: string;
  enabled: boolean;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  lastRunAt?: string;
}

export interface RPAExecution {
  id: string;
  scriptId: string;
  scriptName: string;
  status: 'running' | 'completed' | 'failed';
  results: RPAActionResult[];
  startedAt: string;
  completedAt?: string;
  totalLatencyMs: number;
  trigger: 'manual' | 'cron' | 'webhook' | 'watcher';
  log: string[];
}

// ─── Storage ────────────────────────────────────────────────────────
const SCRIPTS_FILE = resolveRuntimePathFromEnv('RPA_SCRIPTS_FILE', 'rpa_scripts.json');
const EXEC_FILE = resolveRuntimePathFromEnv('RPA_EXECUTIONS_FILE', 'rpa_executions.json');

let scripts: RPAScript[] = [];
let executions: RPAExecution[] = [];
const cronTimers = new Map<string, ReturnType<typeof setInterval>>();

async function loadAll(): Promise<void> {
  try {
    const scriptsFile = resolveRuntimeReadPathFromEnv('RPA_SCRIPTS_FILE', 'rpa_scripts.json');
    const execFile = resolveRuntimeReadPathFromEnv('RPA_EXECUTIONS_FILE', 'rpa_executions.json');
    if (fs.existsSync(scriptsFile)) scripts = JSON.parse(await fs.promises.readFile(scriptsFile, 'utf8'));
    if (fs.existsSync(execFile)) executions = JSON.parse(await fs.promises.readFile(execFile, 'utf8'));
  } catch { }
}
loadAll().catch(() => undefined);

async function saveScripts(): Promise<void> {
  ensureRuntimeRootSync();
  await fs.promises.writeFile(SCRIPTS_FILE, JSON.stringify(scripts, null, 2), 'utf8');
}
async function saveExecs(): Promise<void> {
  ensureRuntimeRootSync();
  await fs.promises.writeFile(EXEC_FILE, JSON.stringify(executions.slice(-100), null, 2), 'utf8');
}

// ─── Script CRUD ────────────────────────────────────────────────────

export function createScript(input: {
  name: string; description?: string; actions?: RPAAction[];
  parallel?: boolean; cronExpression?: string; tags?: string[];
}): RPAScript {
  const script: RPAScript = {
    id: `rpa_${Date.now()}_${randomUUID().slice(0, 6)}`,
    name: input.name.slice(0, 100),
    description: input.description || '',
    actions: input.actions || [],
    parallel: input.parallel || false,
    maxConcurrency: input.parallel ? 4 : 1,
    cronExpression: input.cronExpression,
    enabled: true,
    tags: input.tags || [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  scripts.push(script);
  saveScripts().catch(() => undefined);
  if (script.cronExpression && script.enabled) startCron(script);
  return script;
}

export function addAction(scriptId: string, action: Omit<RPAAction, 'id'>): RPAAction | undefined {
  const script = scripts.find(s => s.id === scriptId);
  if (!script) return undefined;
  const newAction: RPAAction = { ...action, id: `ract_${Date.now()}_${randomUUID().slice(0, 4)}` };
  script.actions.push(newAction);
  script.updatedAt = new Date().toISOString();
  saveScripts().catch(() => undefined);
  return newAction;
}

export function getScript(id: string): RPAScript | undefined { return scripts.find(s => s.id === id); }
export function listScripts(): RPAScript[] { return [...scripts]; }
export function deleteScript(id: string): boolean {
  const timer = cronTimers.get(id);
  if (timer) { clearInterval(timer); cronTimers.delete(id); }
  const idx = scripts.findIndex(s => s.id === id);
  if (idx < 0) return false;
  scripts.splice(idx, 1);
  saveScripts().catch(() => undefined);
  return true;
}

// ─── Script Execution ───────────────────────────────────────────────

export async function executeScript(
  scriptId: string,
  trigger: RPAExecution['trigger'] = 'manual',
): Promise<RPAExecution> {
  const script = scripts.find(s => s.id === scriptId);
  if (!script) throw new Error(`Script "${scriptId}" not found.`);

  const execId = `rpax_${Date.now()}_${randomUUID().slice(0, 6)}`;
  const started = Date.now();
  const exec: RPAExecution = {
    id: execId, scriptId: script.id, scriptName: script.name,
    status: 'running', results: [], startedAt: new Date().toISOString(),
    totalLatencyMs: 0, trigger, log: [],
  };

  exec.log.push(`RPA "${script.name}" started (${script.actions.length} actions, trigger: ${trigger})`);

  try {
    if (script.parallel) {
      // Parallel execution with concurrency limit
      const chunks: RPAAction[][] = [];
      for (let i = 0; i < script.actions.length; i += script.maxConcurrency) {
        chunks.push(script.actions.slice(i, i + script.maxConcurrency));
      }
      for (const chunk of chunks) {
        const chunkResults = await Promise.all(chunk.map(a => executeAction(a)));
        for (const r of chunkResults) {
          exec.results.push(r);
          exec.log.push(`[${r.status}] ${r.description} (${r.latencyMs}ms)`);
          if (r.status === 'failed' && !chunk.find(a => a.id === r.actionId)?.continueOnError) {
            exec.log.push(`  STOPPED: continuing despite error (continueOnError=false)`);
          }
        }
      }
    } else {
      // Sequential execution
      for (const action of script.actions) {
        const result = await executeAction(action);
        exec.results.push(result);
        exec.log.push(`[${result.status}] ${result.description} (${result.latencyMs}ms)`);
        if (result.status === 'failed' && !action.continueOnError) {
          exec.log.push(`STOPPED: action failed and continueOnError=false`);
          break;
        }
      }
    }

    exec.status = exec.results.every(r => r.status === 'completed' || r.status === 'skipped')
      ? 'completed' : 'failed';
    exec.log.push(`RPA ${exec.status}: ${exec.results.filter(r => r.status === 'completed').length}/${script.actions.length} OK`);
  } catch (err: any) {
    exec.status = 'failed';
    exec.log.push(`CRASH: ${err.message}`);
  } finally {
    exec.totalLatencyMs = Date.now() - started;
    exec.completedAt = new Date().toISOString();
    executions.push(exec);
    script.lastRunAt = exec.completedAt;
    saveExecs().catch(() => undefined);
    saveScripts().catch(() => undefined);

    appendAuditEvent({
      actor: 'system', workspace: 'RPA Engine', action: 'rpa.execute',
      target: script.name, risk: exec.status === 'failed' ? 'MEDIUM' : 'LOW',
      status: exec.status === 'completed' ? 'executed' : 'failed',
      summary: `RPA "${script.name}": ${exec.status} in ${exec.totalLatencyMs}ms`,
      connectorId: 'rpa-engine',
      evidence: { scriptId, actions: script.actions.length, status: exec.status },
    }).catch(() => undefined);
  }

  return exec;
}

async function executeAction(action: RPAAction): Promise<RPAActionResult> {
  const start = Date.now();
  let retriesUsed = 0;

  for (let attempt = 0; attempt <= action.retries; attempt++) {
    try {
      let output = '';

      switch (action.type) {
        case 'shell': {
          const cmd = action.params.command || action.params.cmd || '';
          if (!cmd) throw new Error('No command specified');
          const cwd = action.params.cwd || process.cwd();
          const timeout = Math.min(action.timeoutMs || 30000, 120000);
          output = await executeShell(cmd, cwd, timeout);
          break;
        }
        case 'copy_file': {
          const src = action.params.source || action.params.src || '';
          const dst = action.params.destination || action.params.dst || '';
          if (!src || !dst) throw new Error('Missing source/destination');
          await fs.promises.cp(src, dst, { recursive: true });
          output = `Copied ${src} → ${dst}`;
          break;
        }
        case 'move_file': {
          const src = action.params.source || action.params.src || '';
          const dst = action.params.destination || action.params.dst || '';
          if (!src || !dst) throw new Error('Missing source/destination');
          await fs.promises.rename(src, dst);
          output = `Moved ${src} → ${dst}`;
          break;
        }
        case 'delete_file': {
          const target = action.params.path || action.params.file || '';
          if (!target) throw new Error('No path specified');
          if (fs.existsSync(target)) {
            const stat = fs.statSync(target);
            if (stat.isDirectory()) await fs.promises.rm(target, { recursive: true });
            else await fs.promises.unlink(target);
            output = `Deleted ${target}`;
          } else {
            output = `Skipped: ${target} not found`;
          }
          break;
        }
        case 'http_request': {
          const url = action.params.url || '';
          const method = (action.params.method || 'GET').toUpperCase();
          if (!url) throw new Error('No URL specified');
          const body = action.params.body;
          const headers: Record<string, string> = {};
          if (action.params.headers) {
            try { Object.assign(headers, JSON.parse(action.params.headers)); } catch { }
          }
          const fetchOptions: RequestInit = { method };
          if (body && method !== 'GET') { fetchOptions.body = body; fetchOptions.headers = { 'Content-Type': 'application/json', ...headers }; }
          else if (Object.keys(headers).length > 0) fetchOptions.headers = headers;
          const res = await fetch(url, fetchOptions);
          const text = await res.text();
          output = `HTTP ${res.status}: ${text.slice(0, 500)}`;
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          break;
        }
        case 'wait': {
          const ms = parseInt(action.params.durationMs || action.params.ms || '1000');
          await new Promise(r => setTimeout(r, Math.min(ms, 60000)));
          output = `Waited ${ms}ms`;
          break;
        }
        case 'notify': {
          output = `Notification: ${action.params.message || action.description}`;
          break;
        }
        default:
          throw new Error(`Unknown action type: ${action.type}`);
      }

      return {
        actionId: action.id, description: action.description,
        status: 'completed', output, latencyMs: Date.now() - start, retriesUsed,
      };
    } catch (err: any) {
      retriesUsed = attempt + 1;
      if (attempt >= action.retries) {
        return {
          actionId: action.id, description: action.description,
          status: 'failed', output: err.message, error: err.message,
          latencyMs: Date.now() - start, retriesUsed,
        };
      }
      await new Promise(r => setTimeout(r, 1000 * (attempt + 1)));
    }
  }

  return {
    actionId: action.id, description: action.description,
    status: 'failed', output: 'Max retries', error: 'Max retries exceeded',
    latencyMs: Date.now() - start, retriesUsed,
  };
}

function executeShell(cmd: string, cwd: string, timeoutMs: number): Promise<string> {
  return new Promise((resolve, reject) => {
    const proc = exec(cmd, { cwd, timeout: timeoutMs, maxBuffer: 10 * 1024 * 1024 }, (err, stdout, stderr) => {
      if (err) reject(new Error(stderr || err.message));
      else resolve(stdout || 'OK');
    });
  });
}

// ─── Cron Scheduler ─────────────────────────────────────────────────

function startCron(script: RPAScript): void {
  if (!script.cronExpression || !script.enabled) return;
  if (cronTimers.has(script.id)) return;

  const parts = script.cronExpression.split(/\s+/);
  if (parts.length < 2) return;
  const minute = parts[0] === '*' ? -1 : parseInt(parts[0]);
  const hour = parts[1] === '*' ? -1 : parseInt(parts[1]);

  const check = () => {
    const now = new Date();
    if ((minute === -1 || now.getMinutes() === minute) && (hour === -1 || now.getHours() === hour)) {
      executeScript(script.id, 'cron').catch(() => undefined);
    }
  };
  const timer = setInterval(check, 60000);
  cronTimers.set(script.id, timer);
}

export function getExecution(id: string): RPAExecution | undefined { return executions.find(e => e.id === id); }
export function listExecutions(limit = 50): RPAExecution[] { return executions.slice(-limit).reverse(); }
export function getStats(): { scripts: number; cronActive: number; totalExecutions: number } {
  return { scripts: scripts.length, cronActive: cronTimers.size, totalExecutions: executions.length };
}
