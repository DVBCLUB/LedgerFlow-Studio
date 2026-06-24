import { createClient } from '@supabase/supabase-js';
import { callAI } from './aiClient';
import { getAgentRole } from './agentRoles';
import { createApprovalFingerprint } from './agentToolRegistry';
import { getLocalPipeline, saveLocalPipeline } from './pipelineStore';

export type PipelineType =
  | 'software_product'
  | 'daily_content'
  | 'game_dev'
  | 'month_end'
  | 'daily_brief';

export type PipelineStepStatus = 'pending' | 'running' | 'waiting_approval' | 'done' | 'failed' | 'skipped';

export interface PipelineStep {
  id: string;
  stepNumber: number;
  name: string;
  agentRole: string;
  prompt: string;
  context?: Record<string, unknown>;
  status: PipelineStepStatus;
  output?: string;
  requiresApproval: boolean;
  approvedAt?: string;
  approval?: {
    fingerprint: string;
    phrase: 'APPROVE PIPELINE STEP';
  };
  startedAt?: string;
  completedAt?: string;
  error?: string;
}

export interface Pipeline {
  id: string;
  userId: string;
  type: PipelineType;
  name: string;
  status: 'running' | 'waiting_approval' | 'completed' | 'failed' | 'paused';
  steps: PipelineStep[];
  input: Record<string, unknown>;
  output?: string;
  currentStepIndex: number;
  createdAt: string;
  updatedAt: string;
}

type PipelineTemplate = {
  name: string;
  steps: Array<{
    name: string;
    agentRole: string;
    buildPrompt: (input: Record<string, unknown>, prevOutputs: string[]) => string;
    requiresApproval: boolean;
  }>;
};

export const PIPELINE_TEMPLATES: Record<PipelineType, PipelineTemplate> = {
  software_product: {
    name: 'Software Product Factory',
    steps: [
      {
        name: 'AI PM — Viết spec',
        agentRole: 'AI PM',
        buildPrompt: (input) =>
          `Viết Product Spec cho: "${input.idea || 'feature mới'}"\n` +
          `Target user: ${input.targetUser || 'SME kế toán VN'}\n` +
          'Yêu cầu: User stories, acceptance criteria, tech notes, MVP scope (max 2 tuần dev).',
        requiresApproval: true,
      },
      {
        name: 'AI Dev — Plan code',
        agentRole: 'AI Dev',
        buildPrompt: (_input, prev) =>
          `Dựa trên spec này:\n${prev[0] || '(chưa có spec)'}\n\n` +
          'Viết Implementation Plan: file structure, components cần tạo, API endpoints, estimated hours.\n' +
          'Stack: React 19 + TypeScript + Vite + Express.js.',
        requiresApproval: true,
      },
      {
        name: 'AI QA — Test plan',
        agentRole: 'AI QA',
        buildPrompt: (_input, prev) =>
          `Dựa trên spec và implementation plan:\n${prev.join('\n\n---\n\n')}\n\n` +
          'CHỈ viết Test Plan:\n- Unit test cases quan trọng nhất\n- Integration test scenarios\n- Manual QA checklist',
        requiresApproval: false,
      },
      {
        name: 'AI DevOps — Deploy plan',
        agentRole: 'AI DevOps',
        buildPrompt: (input) =>
          `Viết Deployment Plan cho: "${input.idea || 'feature mới'}"\n` +
          'Target: Cloud Run (hoặc Electron desktop installer)\n' +
          'Bao gồm: Dockerfile, GitHub Actions workflow, environment variables cần thiết.',
        requiresApproval: true,
      },
    ],
  },

  daily_content: {
    name: 'Daily Content Marketing',
    steps: [
      {
        name: 'AI Research — Trend scan',
        agentRole: 'AI Research',
        buildPrompt: (input) =>
          `Tìm kiếm trend hôm nay liên quan đến: ${input.topic || 'kế toán SME Việt Nam, thuế, phần mềm quản lý'}\n` +
          'Output: 3-5 angles có thể viết content, angle nào hot nhất, tại sao.',
        requiresApproval: false,
      },
      {
        name: 'AI Marketer — Draft content',
        agentRole: 'AI Marketer',
        buildPrompt: (input, prev) =>
          `Dựa trên trend research:\n${prev[0] || ''}\n\n` +
          `Viết content cho ${input.platform || 'Zalo OA và Facebook Page'}:\n` +
          '- 1 bài post chính (300-400 từ)\n- 2 caption ngắn (50-80 từ)\n- 3 hashtag phù hợp\n' +
          'Tone: chuyên nghiệp nhưng thân thiện, phù hợp kế toán viên VN.',
        requiresApproval: true,
      },
    ],
  },

  game_dev: {
    name: 'Educational Game Factory',
    steps: [
      {
        name: 'AI Game Dev — Design doc',
        agentRole: 'AI Game Dev',
        buildPrompt: (input) =>
          `Thiết kế educational game về: "${input.topic || 'kế toán cơ bản'}"\n` +
          `Level: ${input.level || 'kế toán cơ bản'}\n` +
          'Output: Game Design Document gồm: mechanic, learning objectives, levels, scoring, Phaser.js setup.',
        requiresApproval: true,
      },
      {
        name: 'AI Dev — Scaffold code',
        agentRole: 'AI Dev',
        buildPrompt: (_input, prev) =>
          `Dựa trên Game Design Document:\n${prev[0] || ''}\n\n` +
          'Viết Phaser.js 3 + TypeScript starter code. Tạo file:\n' +
          '- src/games/[GameName]/index.ts (Phaser Game config)\n' +
          '- src/games/[GameName]/scenes/MainScene.ts\n' +
          '- src/games/[GameName]/ui/GameHUD.tsx (React wrapper)',
        requiresApproval: true,
      },
    ],
  },

  month_end: {
    name: 'Month-End Closing',
    steps: [
      {
        name: 'AI Accountant — Reconcile',
        agentRole: 'AI Accountant',
        buildPrompt: (input) =>
          `Reconcile sao kê ngân hàng:\n${JSON.stringify(input.transactions || [], null, 2)}\n\n` +
          'Phân loại theo TK VAS: TK 111 (tiền mặt), TK 112 (tiền gửi), TK 131/331 (công nợ).\n' +
          'Output: bảng định khoản Nợ/Có + danh sách giao dịch cần clarify.',
        requiresApproval: false,
      },
      {
        name: 'AI Auditor — Review',
        agentRole: 'AI Auditor',
        buildPrompt: (_input, prev) =>
          `Review kết quả reconciliation:\n${prev[0] || ''}\n\n` +
          'Kiểm tra: red flags, unusual patterns, missing entries, tax implications.\n' +
          'Output: Audit findings table với risk level.',
        requiresApproval: false,
      },
      {
        name: 'AI CFO — Summary report',
        agentRole: 'AI CFO',
        buildPrompt: (input, prev) =>
          `Tổng hợp báo cáo tháng ${input.month || 'hiện tại'}:\n` +
          `Reconciliation: ${prev[0] || ''}\nAudit findings: ${prev[1] || ''}\n\n` +
          'Output: Executive Summary cho Founder: cash position, P&L sơ bộ, next month forecast, risks.',
        requiresApproval: true,
      },
    ],
  },

  daily_brief: {
    name: 'Daily Morning Brief',
    steps: [
      {
        name: 'Chief of Staff — Daily brief',
        agentRole: 'Chief of Staff',
        buildPrompt: (input) =>
          'Tạo Daily Brief sáng nay cho Founder.\n' +
          `Context:\n${JSON.stringify(input.context || {}, null, 2)}\n\n` +
          'Bao gồm: tasks pending approval, blockers, priorities hôm nay, metrics, risks.',
        requiresApproval: false,
      },
    ],
  },
};

function getSupabaseServiceClient() {
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

async function buildCompanyMemoryContext(userId: string): Promise<string> {
  if (!userId || userId === 'local' || !isUuid(userId)) return '';
  const sb = getSupabaseServiceClient();
  if (!sb) return '';
  const nowIso = new Date().toISOString();

  const { data, error } = await sb
    .from('company_memory')
    .select('memory_type, title, content, agent_author, importance, tags')
    .eq('user_id', userId)
    .eq('is_active', true)
    .in('importance', ['critical', 'high'])
    .or(`expires_at.is.null,expires_at.gt.${nowIso}`)
    .order('created_at', { ascending: false })
    .limit(8);

  if (error || !data?.length) return '';

  return '\n\n---\nCOMPANY CONTEXT (luôn nhớ trước khi trả lời):\n' +
    data.map((memory: any) => {
      const tags = Array.isArray(memory.tags) && memory.tags.length ? ` #${memory.tags.join(' #')}` : '';
      return `[${String(memory.memory_type).toUpperCase()} · ${memory.importance}] ${memory.title}: ${memory.content}${tags}`;
    }).join('\n') +
    '\n---\n';
}

async function executeAgentPrompt(agentRole: string, prompt: string): Promise<string> {
  const role = getAgentRole(agentRole);
  const result = await callAI([
    { role: 'system', content: role?.systemPrompt || `Bạn là ${agentRole} của LedgerFlow Studio.` },
    { role: 'user', content: prompt },
  ], { model: 'ai-assistant' });
  return result.content || result.text || '';
}

async function persistPipeline(pipeline: Pipeline) {
  await saveLocalPipeline(pipeline);
  const sb = getSupabaseServiceClient();
  if (!sb) return;
  await sb.from('agent_pipelines').upsert({
    id: pipeline.id,
    user_id: pipeline.userId,
    type: pipeline.type,
    name: pipeline.name,
    status: pipeline.status,
    steps: pipeline.steps,
    input: pipeline.input,
    output: pipeline.output,
    current_step_index: pipeline.currentStepIndex,
    created_at: pipeline.createdAt,
    updated_at: pipeline.updatedAt,
  });
}

export async function startPipeline(
  pipelineType: PipelineType,
  input: Record<string, unknown>,
  userId = 'local',
): Promise<Pipeline> {
  const template = PIPELINE_TEMPLATES[pipelineType];
  if (!template) throw new Error(`Invalid pipeline type: ${pipelineType}`);

  const now = new Date().toISOString();
  const pipelineId = `pipeline-${Date.now()}`;
  const pipeline: Pipeline = {
    id: pipelineId,
    userId,
    type: pipelineType,
    name: template.name,
    status: 'running',
    steps: template.steps.map((step, index) => ({
      id: `step-${pipelineId}-${index}`,
      stepNumber: index,
      name: step.name,
      agentRole: step.agentRole,
      prompt: '',
      status: 'pending',
      requiresApproval: step.requiresApproval,
    })),
    input,
    currentStepIndex: 0,
    createdAt: now,
    updatedAt: now,
  };

  await persistPipeline(pipeline);
  await executePipelineSteps(pipeline, template, 0);
  return pipeline;
}

async function executePipelineSteps(pipeline: Pipeline, template: PipelineTemplate, startIndex = 0) {
  const prevOutputs = pipeline.steps
    .slice(0, startIndex)
    .map((step) => step.output || '')
    .filter(Boolean);
  const memoryContext = await buildCompanyMemoryContext(pipeline.userId).catch(() => '');

  for (let index = startIndex; index < template.steps.length; index += 1) {
    const stepDef = template.steps[index];
    const step = pipeline.steps[index];

    if (!step) break;
    if (step.status === 'done' && step.output) {
      prevOutputs.push(step.output);
      continue;
    }

    const taskPrompt = stepDef.buildPrompt(pipeline.input, prevOutputs);
    step.prompt = memoryContext ? `${memoryContext}\n\n${taskPrompt}` : taskPrompt;
    step.context = {
      ...(step.context || {}),
      memoryInjected: Boolean(memoryContext),
      pipelineType: pipeline.type,
    };
    step.status = 'running';
    step.startedAt = new Date().toISOString();
    step.error = undefined;
    pipeline.status = 'running';
    pipeline.currentStepIndex = index;
    pipeline.updatedAt = new Date().toISOString();
    await persistPipeline(pipeline);

    try {
      const output = await executeAgentPrompt(step.agentRole, step.prompt);
      step.output = output;
      prevOutputs.push(output);

      if (step.requiresApproval) {
        step.status = 'waiting_approval';
        step.completedAt = new Date().toISOString();
        pipeline.status = 'waiting_approval';
        pipeline.output = output;
        step.approval = {
          fingerprint: createApprovalFingerprint({ pipelineId: pipeline.id, stepId: step.id, output }),
          phrase: 'APPROVE PIPELINE STEP',
        };
        pipeline.updatedAt = new Date().toISOString();
        await persistPipeline(pipeline);
        return;
      }

      step.status = 'done';
      step.completedAt = new Date().toISOString();
      pipeline.updatedAt = new Date().toISOString();
      await persistPipeline(pipeline);
    } catch (err: any) {
      step.status = 'failed';
      step.error = err?.message || String(err);
      pipeline.status = 'failed';
      pipeline.updatedAt = new Date().toISOString();
      await persistPipeline(pipeline);
      return;
    }
  }

  pipeline.status = 'completed';
  pipeline.output = prevOutputs[prevOutputs.length - 1] || pipeline.output || '';
  pipeline.updatedAt = new Date().toISOString();
  await persistPipeline(pipeline);
}

export async function resumePipeline(
  pipelineId: string,
  userId = 'local',
  approval?: { stepId?: string; fingerprint?: string; phrase?: string },
): Promise<Pipeline> {
  const pipeline = await getPipelineById(pipelineId);
  if (!pipeline) throw new Error('Pipeline not found or Supabase service key is not configured.');
  if (pipeline.userId !== userId && userId !== 'local') throw new Error('Pipeline does not belong to this user.');
  if (pipeline.status !== 'waiting_approval') throw new Error(`Pipeline is not waiting for approval. Current status: ${pipeline.status}`);

  const template = PIPELINE_TEMPLATES[pipeline.type];
  if (!template) throw new Error(`Invalid pipeline type: ${pipeline.type}`);

  const approvalIndex = pipeline.currentStepIndex;
  const step = pipeline.steps[approvalIndex];
  if (!step || step.status !== 'waiting_approval') throw new Error('No step is currently waiting for approval.');
  if (!step.approval) throw new Error('This pipeline was created before secure approval was enabled. Restart it to continue.');
  if (approval?.stepId !== step.id || approval?.fingerprint !== step.approval.fingerprint || approval?.phrase !== step.approval.phrase) {
    throw new Error('Approval does not match the current pipeline step and output fingerprint.');
  }

  step.status = 'done';
  step.approvedAt = new Date().toISOString();
  step.completedAt = step.completedAt || step.approvedAt;
  pipeline.status = 'running';
  pipeline.updatedAt = new Date().toISOString();
  await persistPipeline(pipeline);

  await executePipelineSteps(pipeline, template, approvalIndex + 1);
  return pipeline;
}

export async function getPipelineById(id: string): Promise<Pipeline | null> {
  const sb = getSupabaseServiceClient();
  if (!sb) return getLocalPipeline(id);
  const { data, error } = await sb.from('agent_pipelines').select('*').eq('id', id).maybeSingle();
  if (error || !data) return getLocalPipeline(id);
  return {
    id: data.id,
    userId: data.user_id,
    type: data.type,
    name: data.name,
    status: data.status,
    steps: data.steps || [],
    input: data.input || {},
    output: data.output || undefined,
    currentStepIndex: data.current_step_index || 0,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
}

export function listPipelineTypes() {
  return Object.entries(PIPELINE_TEMPLATES).map(([id, template]) => ({
    id,
    name: template.name,
    steps: template.steps.map((step) => ({
      name: step.name,
      agentRole: step.agentRole,
      requiresApproval: step.requiresApproval,
    })),
  }));
}
