import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';
import { getAgentToolContract, listAgentToolContracts } from './agentToolRegistry.ts';

export type CompanyOsSource = 'founder' | 'n8n' | 'telegram' | 'openclaw' | 'dashboard' | 'system' | 'accounting' | 'documents';
export type CompanyOsRisk = 'low' | 'medium' | 'high' | 'blocked';
export type CompanyOsTaskStatus = 'inbox' | 'planning' | 'waiting_approval' | 'ready' | 'done' | 'blocked';

export interface CompanyOsEventInput {
  source: CompanyOsSource;
  eventType: string;
  title: string;
  body?: string;
  agentRole?: string;
  taskId?: string;
  risk?: CompanyOsRisk;
  payload?: Record<string, unknown>;
  userId?: string;
}

export interface CompanyOsTaskInput {
  title: string;
  description?: string;
  agentRole?: string;
  source: CompanyOsSource;
  risk?: CompanyOsRisk;
  status?: CompanyOsTaskStatus;
  payload?: Record<string, unknown>;
  userId?: string;
}

export interface CompanyOsTaskUpdateInput {
  taskId: string;
  status: CompanyOsTaskStatus;
  note?: string;
  source?: CompanyOsSource;
  userId?: string;
}

export interface OpenClawActionInput {
  action: 'read_knowledge' | 'draft_plan' | 'draft_patch' | 'browser_check' | 'terminal_check' | 'external_connector';
  title: string;
  target?: string;
  prompt?: string;
  payload?: Record<string, unknown>;
  simulate?: boolean;
  userId?: string;
}

const localStorePath = path.join(process.cwd(), 'company_os_control_plane.json');

function getSupabaseServiceClient() {
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

function nowIso() {
  return new Date().toISOString();
}

function makeId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

async function readLocalStore(): Promise<{ events: any[]; tasks: any[]; toolRuns: any[] }> {
  try {
    if (!fs.existsSync(localStorePath)) return { events: [], tasks: [], toolRuns: [] };
    const parsed = JSON.parse(await fs.promises.readFile(localStorePath, 'utf8'));
    return {
      events: Array.isArray(parsed.events) ? parsed.events : [],
      tasks: Array.isArray(parsed.tasks) ? parsed.tasks : [],
      toolRuns: Array.isArray(parsed.toolRuns) ? parsed.toolRuns : [],
    };
  } catch {
    return { events: [], tasks: [], toolRuns: [] };
  }
}

async function writeLocalStore(store: { events: any[]; tasks: any[]; toolRuns: any[] }) {
  await fs.promises.writeFile(localStorePath, JSON.stringify(store, null, 2), 'utf8');
}

export function classifyOpenClawRisk(action: OpenClawActionInput['action']): CompanyOsRisk {
  return getAgentToolContract(action)?.risk || 'blocked';
}

export function isOpenClawActionAllowed(input: OpenClawActionInput) {
  const risk = classifyOpenClawRisk(input.action);
  const contract = getAgentToolContract(input.action);
  const simulated = input.simulate !== false;
  const allowed = Boolean(contract) && simulated && risk !== 'blocked';
  const approvalRequired = contract?.requiresApproval ?? true;
  const reason = allowed
    ? 'Action accepted in simulation mode. Real execution requires a separate approved connector.'
    : 'OpenClaw gateway only accepts simulated allowlisted actions.';
  return { allowed, risk, approvalRequired, simulated, reason };
}

export async function appendCompanyOsEvent(input: CompanyOsEventInput) {
  const createdAt = nowIso();
  const event = {
    id: makeId('event'),
    user_id: input.userId || null,
    source: input.source,
    event_type: input.eventType,
    title: input.title,
    body: input.body || '',
    agent_role: input.agentRole || null,
    task_id: input.taskId || null,
    risk: input.risk || 'low',
    payload: input.payload || {},
    created_at: createdAt,
  };

  const sb = getSupabaseServiceClient();
  if (sb && input.userId) {
    const { data, error } = await sb.from('lf_agent_events').insert(event).select('*').single();
    if (!error && data) return { event: data, storage: 'supabase' as const };
  }

  const store = await readLocalStore();
  store.events.unshift(event);
  store.events = store.events.slice(0, 500);
  await writeLocalStore(store);
  return { event, storage: 'local' as const };
}

export async function createCompanyOsTask(input: CompanyOsTaskInput) {
  const createdAt = nowIso();
  const task = {
    id: makeId('task'),
    user_id: input.userId || null,
    title: input.title,
    description: input.description || '',
    agent_role: input.agentRole || 'Chief of Staff',
    source: input.source,
    risk: input.risk || 'low',
    status: input.status || 'inbox',
    payload: input.payload || {},
    created_at: createdAt,
    updated_at: createdAt,
  };

  const sb = getSupabaseServiceClient();
  if (sb && input.userId) {
    const { data, error } = await sb.from('lf_agent_tasks').insert(task).select('*').single();
    if (!error && data) {
      await appendCompanyOsEvent({
        source: input.source,
        eventType: 'task.created',
        title: `Task created: ${input.title}`,
        taskId: data.id,
        agentRole: input.agentRole,
        risk: input.risk,
        payload: { taskId: data.id },
        userId: input.userId,
      });
      return { task: data, storage: 'supabase' as const };
    }
  }

  const store = await readLocalStore();
  store.tasks.unshift(task);
  store.tasks = store.tasks.slice(0, 300);
  await writeLocalStore(store);
  await appendCompanyOsEvent({
    source: input.source,
    eventType: 'task.created',
    title: `Task created: ${input.title}`,
    taskId: task.id,
    agentRole: input.agentRole,
    risk: input.risk,
    payload: { taskId: task.id },
    userId: input.userId,
  });
  return { task, storage: 'local' as const };
}

export async function updateCompanyOsTask(input: CompanyOsTaskUpdateInput) {
  const updatedAt = nowIso();
  const source = input.source || 'founder';

  const sb = getSupabaseServiceClient();
  if (sb && input.userId) {
    const { data, error } = await sb
      .from('lf_agent_tasks')
      .update({
        status: input.status,
        updated_at: updatedAt,
      })
      .eq('id', input.taskId)
      .eq('user_id', input.userId)
      .select('*')
      .single();
    if (!error && data) {
      await appendCompanyOsEvent({
        source,
        eventType: 'task.status_updated',
        title: `Task ${input.status}: ${data.title}`,
        body: input.note,
        taskId: data.id,
        agentRole: data.agent_role,
        risk: data.risk,
        payload: { taskId: data.id, status: input.status },
        userId: input.userId,
      });
      return { task: data, storage: 'supabase' as const };
    }
  }

  const store = await readLocalStore();
  const taskIndex = store.tasks.findIndex((task) => task.id === input.taskId);
  if (taskIndex === -1) throw new Error('Company OS task not found.');
  const task = {
    ...store.tasks[taskIndex],
    status: input.status,
    updated_at: updatedAt,
    payload: {
      ...(store.tasks[taskIndex].payload || {}),
      ...(input.note ? { founder_note: input.note } : {}),
    },
  };
  store.tasks[taskIndex] = task;
  await writeLocalStore(store);
  await appendCompanyOsEvent({
    source,
    eventType: 'task.status_updated',
    title: `Task ${input.status}: ${task.title}`,
    body: input.note,
    taskId: task.id,
    agentRole: task.agent_role,
    risk: task.risk,
    payload: { taskId: task.id, status: input.status },
    userId: input.userId,
  });
  return { task, storage: 'local' as const };
}

export async function simulateOpenClawAction(input: OpenClawActionInput) {
  const decision = isOpenClawActionAllowed(input);
  const createdAt = nowIso();
  const toolRun = {
    id: makeId('tool'),
    user_id: input.userId || null,
    connector: 'openclaw',
    action: input.action,
    title: input.title,
    target: input.target || '',
    risk: decision.risk,
    approval_required: decision.approvalRequired,
    status: decision.allowed ? 'simulated' : 'blocked',
    request: input,
    result: {
      summary: decision.allowed
        ? `Simulated OpenClaw action "${input.action}" for ${input.target || 'LedgerFlow control plane'}.`
        : decision.reason,
      nextStep: decision.approvalRequired ? 'Review in Founder Approval Gate before any real connector executes.' : 'Can be used as safe planning context.',
    },
    created_at: createdAt,
  };

  const sb = getSupabaseServiceClient();
  if (sb && input.userId) {
    const { data, error } = await sb.from('lf_tool_runs').insert(toolRun).select('*').single();
    if (!error && data) {
      await appendCompanyOsEvent({
        source: 'openclaw',
        eventType: `openclaw.${toolRun.status}`,
        title: input.title,
        risk: decision.risk,
        payload: { toolRunId: data.id, decision },
        userId: input.userId,
      });
      return { decision, toolRun: data, storage: 'supabase' as const };
    }
  }

  const store = await readLocalStore();
  store.toolRuns.unshift(toolRun);
  store.toolRuns = store.toolRuns.slice(0, 300);
  await writeLocalStore(store);
  await appendCompanyOsEvent({
    source: 'openclaw',
    eventType: `openclaw.${toolRun.status}`,
    title: input.title,
    risk: decision.risk,
    payload: { toolRunId: toolRun.id, decision },
    userId: input.userId,
  });
  return { decision, toolRun, storage: 'local' as const };
}

export async function listCompanyOsControlPlane(limit = 50) {
  const sb = getSupabaseServiceClient();
  if (sb) {
    const [events, tasks, toolRuns] = await Promise.all([
      sb.from('lf_agent_events').select('*').order('created_at', { ascending: false }).limit(limit),
      sb.from('lf_agent_tasks').select('*').order('created_at', { ascending: false }).limit(limit),
      sb.from('lf_tool_runs').select('*').order('created_at', { ascending: false }).limit(limit),
    ]);
    if (!events.error && !tasks.error && !toolRuns.error) {
      return { events: events.data || [], tasks: tasks.data || [], toolRuns: toolRuns.data || [], storage: 'supabase' as const };
    }
  }
  const local = await readLocalStore();
  return {
    events: local.events.slice(0, limit),
    tasks: local.tasks.slice(0, limit),
    toolRuns: local.toolRuns.slice(0, limit),
    storage: 'local' as const,
  };
}

export async function exportCompanyOsAuditLog(limit = 500) {
  const snapshot = await listCompanyOsControlPlane(limit);
  return {
    schema_version: 'ledgerflow_company_os_audit_v1',
    generated_at: nowIso(),
    storage: snapshot.storage,
    counts: {
      events: snapshot.events.length,
      tasks: snapshot.tasks.length,
      tool_runs: snapshot.toolRuns.length,
    },
    events: snapshot.events,
    tasks: snapshot.tasks,
    tool_runs: snapshot.toolRuns,
  };
}

export function getCompanyOsContracts() {
  return {
    tools: listAgentToolContracts(),
    toolExecution: {
      preview: 'POST /api/company-os/tools/preview',
      approve: 'POST /api/company-os/tools/approve',
      execute: 'POST /api/company-os/tools/execute',
      executionMode: 'simulation-only',
      approvalToken: 'one-time, expires in two minutes',
    },
    n8nWebhook: {
      method: 'POST',
      path: '/api/company-os/n8n/webhook',
      required: ['workflowName', 'eventType', 'title'],
    },
    telegramUpdate: {
      method: 'POST',
      path: '/api/company-os/telegram/update',
      required: ['message.text'],
    },
    openClawSimulate: {
      method: 'POST',
      path: '/api/company-os/openclaw/simulate',
      allowedActions: ['read_knowledge', 'draft_plan', 'draft_patch', 'browser_check', 'terminal_check', 'external_connector'],
      realExecution: 'blocked-by-default',
    },
    taskUpdate: {
      method: 'PATCH',
      path: '/api/company-os/tasks/:id',
      allowedStatus: ['inbox', 'planning', 'waiting_approval', 'ready', 'done', 'blocked'],
    },
    auditExport: {
      method: 'GET',
      path: '/api/company-os/audit/export',
      format: 'json',
    },
  };
}
