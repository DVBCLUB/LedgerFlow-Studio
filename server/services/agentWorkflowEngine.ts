/**
 * agentWorkflowEngine.ts
 * ──────────────────────────────────────────────────────────────────
 * Multi-agent workflow execution engine for LedgerFlow Studio.
 *
 * Supports:
 *  - Sequential and parallel step execution
 *  - Agent-role-based step assignment
 *  - Conditional branching (IF condition THEN skip/escalate)
 *  - Workflow templates (audit_cycle, product_launch, etc.)
 *  - Approval-gated steps
 *  - Local encrypted storage (gitignored)
 * ──────────────────────────────────────────────────────────────────
 */

import { randomUUID } from 'node:crypto';
import path from 'node:path';
import { appendAuditEvent } from './auditLog.ts';
import { callAI } from './aiClient.ts';
import { getAgentRole } from './agentRoles.ts';
import { readSecureJson, writeSecureJson } from './secureJsonStore.ts';

// ─── Types ────────────────────────────────────────────────────────────────────

export type WorkflowStepStatus = 'pending' | 'running' | 'waiting_approval' | 'completed' | 'failed' | 'skipped';
export type WorkflowStatus = 'pending' | 'running' | 'waiting_approval' | 'completed' | 'failed' | 'stopped';
export type WorkflowStepMode = 'sequential' | 'parallel';

export interface WorkflowCondition {
  /** Field in the previous step output to inspect */
  field: string;
  /** Operator */
  operator: 'contains' | 'equals' | 'not_equals' | 'exists';
  /** Value to compare against */
  value?: string;
  /** Action when condition is true */
  onTrue: 'continue' | 'skip_next' | 'escalate' | 'stop';
}

export interface WorkflowStep {
  id: string;
  index: number;
  name: string;
  agentRole: string;
  prompt: string;
  mode: WorkflowStepMode;
  status: WorkflowStepStatus;
  requiresApproval: boolean;
  condition?: WorkflowCondition;
  /** Only set when mode is 'parallel' — steps in the same parallelGroup run together */
  parallelGroup?: string;
  output?: string;
  error?: string;
  startedAt?: string;
  completedAt?: string;
}

export interface AgentWorkflow {
  id: string;
  templateId: string;
  name: string;
  description: string;
  status: WorkflowStatus;
  userId: string;
  input: Record<string, unknown>;
  steps: WorkflowStep[];
  output?: string;
  stoppedReason?: string;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
}

// ─── Workflow Templates ────────────────────────────────────────────────────────

export type WorkflowTemplateId =
  | 'product_launch'
  | 'ai_audit'
  | 'customer_onboarding'
  | 'competitor_research'
  | 'daily_ops';

interface WorkflowStepDefinition {
  name: string;
  agentRole: string;
  buildPrompt: (input: Record<string, unknown>, previousOutputs: string[]) => string;
  requiresApproval: boolean;
  mode: WorkflowStepMode;
  parallelGroup?: string;
  condition?: WorkflowCondition;
}

interface WorkflowTemplate {
  id: WorkflowTemplateId;
  name: string;
  description: string;
  steps: WorkflowStepDefinition[];
}

export const WORKFLOW_TEMPLATES: Record<WorkflowTemplateId, WorkflowTemplate> = {
  product_launch: {
    id: 'product_launch',
    name: 'Product Launch Factory',
    description: 'Quy trình đưa tính năng từ ý tưởng đến release — PM → Dev → QA → DevOps → Marketer.',
    steps: [
      {
        name: 'AI PM — Viết Product Spec',
        agentRole: 'AI PM',
        buildPrompt: (input) =>
          `Viết Product Spec đầy đủ cho: "${input.idea || 'tính năng mới'}"\n` +
          `Target user: ${input.targetUser || 'SME kế toán VN'}\n` +
          'Bao gồm: User stories (As a/I want/So that), Acceptance criteria, MVP scope (max 2 tuần), Tech notes.',
        requiresApproval: true,
        mode: 'sequential',
      },
      {
        name: 'AI Dev — Implementation Plan',
        agentRole: 'AI Dev',
        buildPrompt: (_input, prev) =>
          `Dựa trên spec:\n${prev[0] || '(chưa có spec)'}\n\n` +
          'Viết Implementation Plan: file structure, components, API endpoints, estimated hours.\n' +
          'Stack: React 19 + TypeScript + Vite + Express.js.',
        requiresApproval: true,
        mode: 'sequential',
      },
      {
        name: 'AI QA — Test Plan',
        agentRole: 'AI QA',
        buildPrompt: (_input, prev) =>
          `Viết Test Plan dựa trên spec và implementation:\n${prev.slice(0, 2).join('\n\n---\n\n')}\n\n` +
          'Bao gồm: Unit test cases, Integration scenarios, Manual QA checklist, Edge cases.',
        requiresApproval: false,
        mode: 'parallel',
        parallelGroup: 'launch_prep',
      },
      {
        name: 'AI DevOps — Deploy Plan',
        agentRole: 'AI DevOps',
        buildPrompt: (input) =>
          `Viết Deployment Plan cho: "${input.idea || 'tính năng mới'}"\n` +
          'Target: Cloud Run / Electron desktop\n' +
          'Bao gồm: Dockerfile, GitHub Actions workflow, rollback plan, cost estimate.',
        requiresApproval: false,
        mode: 'parallel',
        parallelGroup: 'launch_prep',
      },
      {
        name: 'AI Marketer — Launch Content',
        agentRole: 'AI Marketer',
        buildPrompt: (input, prev) =>
          `Viết nội dung launch cho: "${input.idea || 'tính năng mới'}"\n` +
          `Context từ spec: ${prev[0]?.slice(0, 500) || ''}\n\n` +
          'Gồm: 1 bài post Zalo/Facebook, release note, changelog entry, 3 email subject lines.',
        requiresApproval: true,
        mode: 'sequential',
      },
    ],
  },

  ai_audit: {
    id: 'ai_audit',
    name: 'AI Audit Cycle',
    description: 'Chu kỳ kiểm toán AI: Auditor → Accountant → CFO → Legal sign-off.',
    steps: [
      {
        name: 'AI Auditor — Red Flag Scan',
        agentRole: 'AI Auditor',
        buildPrompt: (input) =>
          `Scan dữ liệu tài chính cho red flags:\n${JSON.stringify(input.data || {}, null, 2)}\n\n` +
          'Tìm: unusual patterns, missing entries, sai tài khoản, rủi ro thuế.\n' +
          'Output: Audit findings table với risk level (HIGH/MEDIUM/LOW).',
        requiresApproval: false,
        mode: 'sequential',
      },
      {
        name: 'AI Accountant — Reconcile',
        agentRole: 'AI Accountant',
        buildPrompt: (_input, prev) =>
          `Dựa trên audit findings:\n${prev[0] || ''}\n\n` +
          'Reconcile và đề xuất định khoản Nợ/Có theo VAS.\n' +
          'Output: Bảng định khoản + danh sách giao dịch cần clarify.',
        requiresApproval: false,
        mode: 'sequential',
        condition: {
          field: 'output',
          operator: 'contains',
          value: 'HIGH',
          onTrue: 'escalate',
        },
      },
      {
        name: 'AI CFO — Executive Summary',
        agentRole: 'AI CFO',
        buildPrompt: (input, prev) =>
          `Tổng hợp báo cáo tháng ${input.month || 'hiện tại'}:\n` +
          `Audit: ${prev[0] || ''}\nReconcile: ${prev[1] || ''}\n\n` +
          'Output: Executive Summary: cash position, P&L sơ bộ, next month forecast, risks.',
        requiresApproval: true,
        mode: 'sequential',
      },
      {
        name: 'AI Legal — Compliance Check',
        agentRole: 'AI Legal',
        buildPrompt: (_input, prev) =>
          `Kiểm tra compliance dựa trên báo cáo CFO:\n${prev[prev.length - 1] || ''}\n\n` +
          'Rà soát: nghĩa vụ thuế, hóa đơn điện tử, BHXH, tuân thủ VAS/TT200.\n' +
          'Output: Compliance checklist với deadline actions.',
        requiresApproval: false,
        mode: 'sequential',
      },
    ],
  },

  customer_onboarding: {
    id: 'customer_onboarding',
    name: 'Customer Onboarding Flow',
    description: 'Luồng onboarding khách hàng mới — Sales → Onboarding → Support → Analyst.',
    steps: [
      {
        name: 'AI Sales — Welcome Package',
        agentRole: 'AI Sales',
        buildPrompt: (input) =>
          `Tạo welcome package cho khách hàng mới: ${input.customerName || 'Khách hàng'}\n` +
          `Ngành: ${input.industry || 'SME kế toán'}\n` +
          'Gồm: email chào mừng, quick start guide, lịch demo gợi ý.',
        requiresApproval: true,
        mode: 'sequential',
      },
      {
        name: 'AI Onboarding — Setup Guide',
        agentRole: 'AI Onboarding',
        buildPrompt: (input, prev) =>
          `Tạo hướng dẫn setup cho: ${input.customerName || 'khách hàng'}\n` +
          `Welcome package: ${prev[0]?.slice(0, 300) || ''}\n\n` +
          'Gồm: step-by-step setup, FAQ, video links, first week checklist.',
        requiresApproval: false,
        mode: 'sequential',
      },
      {
        name: 'AI Support — Ticket Template',
        agentRole: 'AI Support',
        buildPrompt: (input) =>
          `Tạo template ticket và FAQ cho: ${input.customerName || 'khách hàng mới'}\n` +
          'Gồm: Top 10 câu hỏi thường gặp, ticket escalation rules, contact info.',
        requiresApproval: false,
        mode: 'parallel',
        parallelGroup: 'onboard_docs',
      },
      {
        name: 'AI Analyst — Onboarding Metrics',
        agentRole: 'AI Analyst',
        buildPrompt: (input) =>
          `Thiết kế onboarding success metrics cho: ${input.customerName || 'khách hàng'}\n` +
          'Gồm: KPI theo dõi (activation rate, time-to-value), 30/60/90 day milestones.',
        requiresApproval: false,
        mode: 'parallel',
        parallelGroup: 'onboard_docs',
      },
    ],
  },

  competitor_research: {
    id: 'competitor_research',
    name: 'Competitor Research Workflow',
    description: 'Phân tích đối thủ toàn diện — Research → Analyst → Marketer → PM.',
    steps: [
      {
        name: 'AI Research — Market Scan',
        agentRole: 'AI Research',
        buildPrompt: (input) =>
          `Phân tích đối thủ cạnh tranh trong: ${input.market || 'phần mềm kế toán SME Việt Nam'}\n` +
          `Focus: ${input.competitors || 'MISA, Fast, Bravo, AMIS, 1C'}\n` +
          'Output: Bảng so sánh tính năng, giá, kênh phân phối, điểm yếu.',
        requiresApproval: false,
        mode: 'sequential',
      },
      {
        name: 'AI Analyst — Gap Analysis',
        agentRole: 'AI Analyst',
        buildPrompt: (_input, prev) =>
          `Phân tích gap giữa LedgerFlow và đối thủ:\n${prev[0] || ''}\n\n` +
          'Output: Top 5 cơ hội (white space), top 3 rủi ro, suggested positioning statement.',
        requiresApproval: false,
        mode: 'sequential',
      },
      {
        name: 'AI Marketer — Positioning Brief',
        agentRole: 'AI Marketer',
        buildPrompt: (_input, prev) =>
          `Tạo positioning brief dựa trên gap analysis:\n${prev[1] || ''}\n\n` +
          'Gồm: 1-sentence value prop, 3 key messages, suggested tagline VN, channel priority.',
        requiresApproval: true,
        mode: 'sequential',
      },
      {
        name: 'AI PM — Feature Priority',
        agentRole: 'AI PM',
        buildPrompt: (_input, prev) =>
          `Dựa trên competitor research và positioning:\n${prev.join('\n\n---\n\n')}\n\n` +
          'Recommend: Top 3 features để bắt kịp/vượt đối thủ trong Q1, effort estimate.',
        requiresApproval: true,
        mode: 'sequential',
      },
    ],
  },

  daily_ops: {
    id: 'daily_ops',
    name: 'Daily Operations Check',
    description: 'Kiểm tra daily operations — Chief of Staff → CFO → DevOps (parallel) → Summary.',
    steps: [
      {
        name: 'Chief of Staff — Priority Review',
        agentRole: 'Chief of Staff',
        buildPrompt: (input) =>
          `Tóm tắt priorities hôm nay (${new Date().toLocaleDateString('vi-VN')}).\n` +
          `Context:\n${JSON.stringify(input.context || {}, null, 2)}\n\n` +
          'Output: Top 3 việc cần làm, blockers cần giải quyết, agents nào đang chạy.',
        requiresApproval: false,
        mode: 'sequential',
      },
      {
        name: 'AI CFO — Cash Check',
        agentRole: 'AI CFO',
        buildPrompt: (input) =>
          `Kiểm tra cash position hôm nay: ${new Date().toLocaleDateString('vi-VN')}\n` +
          `Dữ liệu: ${JSON.stringify(input.finance || {}, null, 2)}\n` +
          'Output: Cash available, burn rate ngày, projected runway.',
        requiresApproval: false,
        mode: 'parallel',
        parallelGroup: 'daily_checks',
      },
      {
        name: 'AI DevOps — System Health',
        agentRole: 'AI DevOps',
        buildPrompt: () =>
          `Kiểm tra system health hôm nay: ${new Date().toLocaleDateString('vi-VN')}\n` +
          'Checklist: CI status, error rates, deployment queue, pending PRs.\n' +
          'Output: Health score (0-100), issues cần fix ngay.',
        requiresApproval: false,
        mode: 'parallel',
        parallelGroup: 'daily_checks',
      },
      {
        name: 'AI Analyst — KPI Snapshot',
        agentRole: 'AI Analyst',
        buildPrompt: (_input, prev) =>
          `Tổng hợp KPI snapshot từ daily checks:\n${prev.join('\n\n---\n\n')}\n\n` +
          'Output: 1-page dashboard text: revenue, users, errors, priorities. Dưới 150 words.',
        requiresApproval: false,
        mode: 'sequential',
      },
    ],
  },
};

// ─── Storage ──────────────────────────────────────────────────────────────────

type WorkflowStore = { workflows: Record<string, AgentWorkflow> };
let writeQueue = Promise.resolve();

function storageFile() {
  return path.resolve(process.cwd(), process.env.WORKFLOW_STORE_FILE || 'agent_workflows.local.enc');
}

async function readStore(): Promise<WorkflowStore> {
  const parsed = await readSecureJson<WorkflowStore>(storageFile(), { workflows: {} });
  return { workflows: parsed.workflows || {} };
}

async function mutate<T>(operation: (store: WorkflowStore) => T | Promise<T>): Promise<T> {
  let result!: T;
  const task = async () => {
    const store = await readStore();
    result = await operation(store);
    await writeSecureJson(storageFile(), store);
  };
  const queued = writeQueue.then(task, task);
  writeQueue = queued.catch(() => undefined);
  await queued;
  return result;
}

// ─── Execution ─────────────────────────────────────────────────────────────────

async function executeAgentStep(step: WorkflowStep, workflow: AgentWorkflow): Promise<string> {
  const role = getAgentRole(step.agentRole);
  const result = await callAI(
    [
      { role: 'system', content: role?.systemPrompt || `Bạn là ${step.agentRole} của LedgerFlow Studio.` },
      { role: 'user', content: step.prompt },
    ],
    { model: 'ai-assistant' },
  );
  return (result.content || result.text || '').trim();
}

async function executeSteps(workflow: AgentWorkflow, template: WorkflowTemplate, fromIndex: number): Promise<void> {
  const prevOutputs = workflow.steps.slice(0, fromIndex).map((s) => s.output || '').filter(Boolean);

  let index = fromIndex;
  while (index < template.steps.length) {
    const stepDef = template.steps[index];
    const step = workflow.steps[index];
    if (!step) break;
    if (step.status === 'completed') { prevOutputs.push(step.output || ''); index++; continue; }
    if (step.status === 'skipped') { index++; continue; }

    // ── Parallel group: collect all steps in same group ───────────────────────
    if (step.mode === 'parallel' && step.parallelGroup) {
      const groupSteps: WorkflowStep[] = [];
      const groupDefs: WorkflowStepDefinition[] = [];
      let gi = index;
      while (gi < workflow.steps.length && workflow.steps[gi].parallelGroup === step.parallelGroup) {
        groupSteps.push(workflow.steps[gi]);
        groupDefs.push(template.steps[gi]);
        gi++;
      }

      // Mark all as running
      for (const gs of groupSteps) { gs.status = 'running'; gs.startedAt = new Date().toISOString(); }
      workflow.status = 'running'; workflow.updatedAt = new Date().toISOString();
      await mutate((store) => { store.workflows[workflow.id] = workflow; });

      // Execute in parallel
      const results = await Promise.allSettled(
        groupSteps.map((gs, gi2) => executeAgentStep(gs, workflow)),
      );

      const groupOutputs: string[] = [];
      for (let gi2 = 0; gi2 < groupSteps.length; gi2++) {
        const gs = groupSteps[gi2];
        const res = results[gi2];
        if (res.status === 'fulfilled') {
          gs.output = res.value; gs.status = 'completed'; gs.completedAt = new Date().toISOString();
          groupOutputs.push(res.value);
        } else {
          gs.status = 'failed'; gs.error = res.reason?.message || String(res.reason); gs.completedAt = new Date().toISOString();
        }
      }

      prevOutputs.push(...groupOutputs);
      workflow.updatedAt = new Date().toISOString();
      await mutate((store) => { store.workflows[workflow.id] = workflow; });

      if (groupSteps.some((gs) => gs.status === 'failed')) {
        workflow.status = 'failed'; await mutate((store) => { store.workflows[workflow.id] = workflow; }); return;
      }

      index = gi;
      continue;
    }

    // ── Sequential step ────────────────────────────────────────────────────────
    step.prompt = stepDef.buildPrompt(workflow.input, prevOutputs);
    step.status = 'running'; step.startedAt = new Date().toISOString();
    workflow.status = 'running'; workflow.updatedAt = new Date().toISOString();
    await mutate((store) => { store.workflows[workflow.id] = workflow; });

    try {
      const output = await executeAgentStep(step, workflow);
      step.output = output; prevOutputs.push(output);

      // ── Approval gate ──────────────────────────────────────────────────────
      if (step.requiresApproval) {
        step.status = 'waiting_approval'; step.completedAt = new Date().toISOString();
        workflow.status = 'waiting_approval'; workflow.output = output; workflow.updatedAt = new Date().toISOString();
        await mutate((store) => { store.workflows[workflow.id] = workflow; });
        return;
      }

      // ── Condition check ────────────────────────────────────────────────────
      if (step.condition) {
        const { field, operator, value, onTrue } = step.condition;
        const fieldValue = String(field === 'output' ? output : (workflow.input[field] ?? ''));
        const conditionMet =
          operator === 'contains' ? fieldValue.includes(value || '') :
          operator === 'equals' ? fieldValue === value :
          operator === 'not_equals' ? fieldValue !== value :
          operator === 'exists' ? Boolean(fieldValue) : false;

        if (conditionMet) {
          if (onTrue === 'stop') {
            step.status = 'completed'; step.completedAt = new Date().toISOString();
            workflow.status = 'stopped'; workflow.stoppedReason = `Condition on step "${step.name}" triggered stop.`;
            workflow.completedAt = new Date().toISOString(); workflow.updatedAt = new Date().toISOString();
            await mutate((store) => { store.workflows[workflow.id] = workflow; }); return;
          }
          if (onTrue === 'skip_next' && workflow.steps[index + 1]) {
            workflow.steps[index + 1].status = 'skipped';
          }
          if (onTrue === 'escalate') {
            await appendAuditEvent({ actor: 'workflow-engine', workspace: 'ai-ops', action: 'workflow.escalate', target: workflow.id, risk: 'HIGH', status: 'pending_approval', summary: `Condition escalation triggered at step: ${step.name}`, evidence: { workflowId: workflow.id, stepName: step.name, conditionValue: fieldValue } });
          }
        }
      }

      step.status = 'completed'; step.completedAt = new Date().toISOString();
      workflow.updatedAt = new Date().toISOString();
      await mutate((store) => { store.workflows[workflow.id] = workflow; });
    } catch (err: unknown) {
      step.status = 'failed'; step.error = err instanceof Error ? err.message : String(err); step.completedAt = new Date().toISOString();
      workflow.status = 'failed'; workflow.updatedAt = new Date().toISOString();
      await mutate((store) => { store.workflows[workflow.id] = workflow; }); return;
    }

    index++;
  }

  workflow.status = 'completed'; workflow.output = prevOutputs[prevOutputs.length - 1] || '';
  workflow.completedAt = new Date().toISOString(); workflow.updatedAt = new Date().toISOString();
  await mutate((store) => { store.workflows[workflow.id] = workflow; });
}

// ─── Public API ───────────────────────────────────────────────────────────────

export async function startWorkflow(
  templateId: WorkflowTemplateId,
  input: Record<string, unknown>,
  userId = 'local',
): Promise<AgentWorkflow> {
  const template = WORKFLOW_TEMPLATES[templateId];
  if (!template) throw new Error(`Unknown workflow template: ${templateId}`);

  const now = new Date().toISOString();
  const workflowId = `wf_${randomUUID()}`;

  const workflow: AgentWorkflow = {
    id: workflowId,
    templateId,
    name: template.name,
    description: template.description,
    status: 'pending',
    userId,
    input,
    steps: template.steps.map((stepDef, index) => ({
      id: `ws_${randomUUID()}`,
      index,
      name: stepDef.name,
      agentRole: stepDef.agentRole,
      prompt: '',
      mode: stepDef.mode,
      parallelGroup: stepDef.parallelGroup,
      condition: stepDef.condition,
      status: 'pending',
      requiresApproval: stepDef.requiresApproval,
    })),
    createdAt: now,
    updatedAt: now,
  };

  await mutate((store) => { store.workflows[workflowId] = workflow; });
  await appendAuditEvent({ actor: userId, workspace: 'ai-ops', action: 'workflow.started', target: workflowId, risk: 'LOW', status: 'sandbox', summary: `Workflow "${template.name}" started.`, evidence: { templateId, stepCount: template.steps.length } });

  await executeSteps(workflow, template, 0);
  return workflow;
}

export async function approveWorkflowStep(
  workflowId: string,
  stepId: string,
  userId = 'local',
): Promise<AgentWorkflow> {
  return mutate(async (store) => {
    const workflow = store.workflows[workflowId];
    if (!workflow) throw new Error('Workflow not found.');
    if (workflow.status !== 'waiting_approval') throw new Error('Workflow is not waiting for approval.');
    const step = workflow.steps.find((s) => s.id === stepId);
    if (!step || step.status !== 'waiting_approval') throw new Error('Step is not waiting for approval.');

    step.status = 'completed'; step.completedAt = new Date().toISOString();
    workflow.status = 'running'; workflow.updatedAt = new Date().toISOString();

    await appendAuditEvent({ actor: userId, workspace: 'ai-ops', action: 'workflow.step.approved', target: stepId, risk: 'MEDIUM', status: 'approved', summary: `Step "${step.name}" approved in workflow ${workflowId}.`, evidence: { workflowId, stepId } });

    const template = WORKFLOW_TEMPLATES[workflow.templateId as WorkflowTemplateId];
    if (template) await executeSteps(workflow, template, step.index + 1);
    return store.workflows[workflowId];
  });
}

export async function stopWorkflow(workflowId: string, reason: string): Promise<AgentWorkflow> {
  return mutate((store) => {
    const workflow = store.workflows[workflowId];
    if (!workflow) throw new Error('Workflow not found.');
    workflow.status = 'stopped'; workflow.stoppedReason = reason;
    workflow.completedAt = new Date().toISOString(); workflow.updatedAt = new Date().toISOString();
    workflow.steps.filter((s) => ['pending', 'running', 'waiting_approval'].includes(s.status)).forEach((s) => { s.status = 'failed'; s.error = reason; });
    return workflow;
  });
}

export async function listWorkflows(limit = 50): Promise<AgentWorkflow[]> {
  await writeQueue.catch(() => undefined);
  const store = await readStore();
  return Object.values(store.workflows).sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, limit);
}

export async function getWorkflow(id: string): Promise<AgentWorkflow | null> {
  await writeQueue.catch(() => undefined);
  const store = await readStore();
  return store.workflows[id] || null;
}

export function listWorkflowTemplates() {
  return Object.values(WORKFLOW_TEMPLATES).map(({ id, name, description, steps }) => ({
    id, name, description,
    stepCount: steps.length,
    steps: steps.map(({ name: sName, agentRole, requiresApproval, mode }) => ({ name: sName, agentRole, requiresApproval, mode })),
  }));
}
