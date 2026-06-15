import { executeAgentTask } from './agentExecutor';
import { appendAuditEvent } from './auditLog';
import { appendIntegrationEvent } from './integrationRegistry';
import { createClient } from '@supabase/supabase-js';

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

export const PIPELINE_TEMPLATES: Record<PipelineType, {
  name: string;
  steps: Array<{
    name: string;
    agentRole: string;
    buildPrompt: (input: Record<string, unknown>, prevOutputs: string[]) => string;
    requiresApproval: boolean;
  }>;
}> = {
  software_product: {
    name: 'Software Product Factory',
    steps: [
      {
        name: 'AI PM — Viết spec',
        agentRole: 'AI PM',
        buildPrompt: (input) =>
          `Viết Product Spec cho: "${String(input.idea ?? 'undefined')}"\n` +
          `Target user: ${String(input.targetUser ?? 'SME kế toán VN')}\n` +
          'Yêu cầu: User stories, acceptance criteria, tech notes, MVP scope (max 2 tuần dev).',
        requiresApproval: true,
      },
      {
        name: 'AI Dev — Plan code',
        agentRole: 'AI Dev',
        buildPrompt: (_input, prev) =>
          `Dựa trên spec này:\n${prev[0]}\n\n` +
          'Viết Implementation Plan: file structure, components cần tạo, API endpoints, estimated hours.\n' +
          'Stack: React 19 + TypeScript + Vite + Express.js.',
        requiresApproval: true,
      },
      {
        name: 'AI QA — Test plan',
        agentRole: 'AI QA',
        buildPrompt: (_input, prev) =>
          `Dựa trên spec và implementation plan:\n${prev[0]}\n\nCHỈ viết Test Plan:\n` +
          '- Unit test cases quan trọng nhất\n- Integration test scenarios\n- Manual QA checklist',
        requiresApproval: false,
      },
      {
        name: 'AI DevOps — Deploy plan',
        agentRole: 'AI DevOps',
        buildPrompt: (input) =>
          `Viết Deployment Plan cho: "${String(input.idea ?? 'undefined')}"\n` +
          `Target: Cloud Run (hoặc Electron desktop installer)\n` +
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
          `Tìm kiếm trend hôm nay liên quan đến: ${String(input.topic ?? 'kế toán SME Việt Nam, thuế, phần mềm quản lý')}\n` +
          'Output: 3-5 angles có thể viết content, angle nào hot nhất, tại sao.',
        requiresApproval: false,
      },
      {
        name: 'AI Marketer — Draft content',
        agentRole: 'AI Marketer',
        buildPrompt: (input, prev) =>
          `Dựa trên trend research:\n${prev[0]}\n\n` +
          `Viết content cho ${String(input.platform ?? 'Zalo OA và Facebook Page')}:\n` +
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
          `Thiết kế educational game về: "${String(input.topic ?? 'undefined')}"\n` +
          `Level: ${String(input.level ?? 'kế toán cơ bản')}\n` +
          'Output: Game Design Document gồm: mechanic, learning objectives, levels, scoring, Phaser.js setup.',
        requiresApproval: true,
      },
      {
        name: 'AI Dev — Scaffold code',
        agentRole: 'AI Dev',
        buildPrompt: (_input, prev) =>
          `Dựa trên Game Design Document:\n${prev[0]}\n\n` +
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
          `Reconcile sao kê ngân hàng:\n${JSON.stringify(input.transactions ?? [], null, 2)}\n\n` +
          'Phân loại theo TK VAS: TK 111 (tiền mặt), TK 112 (tiền gửi), TK 131/331 (công nợ).\n' +
          'Output: bảng định khoản Nợ/Có + danh sách giao dịch cần clarify.',
        requiresApproval: false,
      },
      {
        name: 'AI Auditor — Review',
        agentRole: 'AI Auditor',
        buildPrompt: (_input, prev) =>
          `Review kết quả reconciliation:\n${prev[0]}\n\n` +
          'Kiểm tra: red flags, unusual patterns, missing entries, tax implications.\n' +
          'Output: Audit findings table với risk level.',
        requiresApproval: false,
      },
      {
        name: 'AI CFO — Summary report',
        agentRole: 'AI CFO',
        buildPrompt: (input, prev) =>
          `Tổng hợp báo cáo tháng ${String(input.month ?? 'hiện tại')}:\n` +
          `Reconciliation: ${prev[0]}\nAudit findings: ${prev[1]}\n\n` +
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
          `Tạo Daily Brief sáng nay cho Founder.\n` +
          `Context:\n${JSON.stringify(input.context ?? {}, null, 2)}\n\n` +
          'Bao gồm: tasks pending approval, blockers, priorities hôm nay, metrics, risks.',
        requiresApproval: false,
      },
    ],
  },
};

export async function startPipeline(
  pipelineType: PipelineType,
  input: Record<string, unknown>,
  userId: string,
): Promise<Pipeline> {
  const template = PIPELINE_TEMPLATES[pipelineType];
  const pipelineId = `pipeline-${Date.now()}`;

  const steps: PipelineStep[] = template.steps.map((step, i) => ({
    id: `step-${pipelineId}-${i}`,
    stepNumber: i,
    name: step.name,
    agentRole: step.agentRole,
    prompt: '',
    status: 'pending',
    requiresApproval: step.requiresApproval,
  }));

  const pipeline: Pipeline = {
    id: pipelineId,
    userId,
    type: pipelineType,
    name: template.name,
    status: 'running',
    steps,
    input,
    currentStepIndex: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const sb = createClient<any, any>(
    process.env.SUPABASE_URL || '',
    process.env.SUPABASE_SERVICE_KEY || '',
  );

  await sb.from('agent_pipelines').insert({
    id: pipeline.id,
    user_id: userId,
    type: pipeline.type,
    name: pipeline.name,
    status: pipeline.status,
    steps: JSON.stringify(pipeline.steps),
    input: JSON.stringify(pipeline.input),
    current_step_index: pipeline.currentStepIndex,
    created_at: pipeline.createdAt,
    updated_at: pipeline.updatedAt,
  });

  // start execution from step 0
  await executePipelineSteps(pipeline, template, sb, userId, 0);
  return pipeline;
}

async function executePipelineSteps(
  pipeline: Pipeline,
  template: typeof PIPELINE_TEMPLATES[keyof typeof PIPELINE_TEMPLATES],
  sb: any,
  userId: string,
  startIndex = 0,
): Promise<void> {
  const prevOutputs: string[] = [];

  // Preserve any existing outputs so resuming pipeline keeps context
  for (let j = 0; j < pipeline.steps.length; j += 1) {
    if (pipeline.steps[j].output) prevOutputs.push(pipeline.steps[j].output || '');
  }

  for (let i = startIndex; i < template.steps.length; i += 1) {
    const stepDef = template.steps[i];
    const step = pipeline.steps[i];
    const prompt = stepDef.buildPrompt(pipeline.input, prevOutputs);
    step.prompt = prompt;
    step.status = 'running';
    step.startedAt = new Date().toISOString();

    await updatePipelineStep(sb, pipeline.id, pipeline.steps);

    try {
      const result = await executeAgentTask({
        taskId: step.id,
        agentRole: step.agentRole as any,
        prompt,
        context: { pipelineId: pipeline.id, stepNumber: i, input: pipeline.input },
        userId,
        onChunk: async (chunk: string) => {
          // append chunk to step.output and persist
          step.output = (step.output || '') + chunk;
          // also update DB so front-end sees streaming output
          await updatePipelineStep(sb, pipeline.id, pipeline.steps, undefined, i);
        },
      });

      if (!result.success) {
        step.status = 'failed';
        step.error = result.error;
        pipeline.status = 'failed';
        break;
      }

      step.output = result.output;
      prevOutputs.push(result.output || '');

      if (step.requiresApproval) {
        step.status = 'waiting_approval';
        pipeline.status = 'waiting_approval';
        pipeline.currentStepIndex = i;
        await updatePipelineStep(sb, pipeline.id, pipeline.steps, pipeline.status, i);
        // Emit an integration event to surface notification for waiting approval
        try {
          await appendIntegrationEvent({ connectorId: 'pipeline', type: 'status', level: 'warning', message: `Pipeline ${pipeline.id} waiting approval at step ${i}: ${step.name}` });
        } catch (e) {
          // ignore integration event failures
        }
        return;
      }

      step.status = 'done';
      step.completedAt = new Date().toISOString();
    } catch (err: unknown) {
      step.status = 'failed';
      step.error = String(err);
      pipeline.status = 'failed';
      break;
    }
  }

  const allDone = pipeline.steps.every((s) => s.status === 'done');
  if (allDone) pipeline.status = 'completed';

  await updatePipelineStep(sb, pipeline.id, pipeline.steps, pipeline.status, pipeline.currentStepIndex);
  await appendAuditEvent({
    actor: 'system',
    workspace: 'Pipeline Orchestrator',
    action: 'pipeline_completed',
    target: pipeline.id,
    risk: 'LOW',
    status: pipeline.status === 'completed' ? 'approved' : 'failed',
    summary: `Pipeline ${pipeline.id} completed with status ${pipeline.status}`,
    evidence: { type: pipeline.type, status: pipeline.status },
  }).catch(() => undefined);
}

async function updatePipelineStep(
  sb: any,
  pipelineId: string,
  steps: PipelineStep[],
  status?: string,
  currentStep?: number,
): Promise<void> {
  await sb.from('agent_pipelines').update({
    steps: JSON.stringify(steps),
    ...(status ? { status } : {}),
    ...(currentStep !== undefined ? { current_step_index: currentStep } : {}),
    updated_at: new Date().toISOString(),
  } as any).eq('id', pipelineId);
}

export async function resumePipeline(pipelineId: string, userId: string): Promise<void> {
  const sb = createClient<any, any>(
    process.env.SUPABASE_URL || '',
    process.env.SUPABASE_SERVICE_KEY || '',
  );

  const { data, error } = await sb.from('agent_pipelines').select('*').eq('id', pipelineId).single();
  if (error || !data) throw new Error(error?.message || 'Pipeline not found');

  const pipeline: Pipeline = {
    id: data.id,
    userId: data.user_id,
    type: data.type,
    name: data.name,
    status: data.status,
    steps: Array.isArray(data.steps) ? (data.steps as PipelineStep[]) : JSON.parse(data.steps || '[]'),
    input: typeof data.input === 'object' ? data.input : JSON.parse(data.input || '{}'),
    currentStepIndex: data.current_step_index || 0,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };

  const template = PIPELINE_TEMPLATES[pipeline.type as PipelineType];
  await executePipelineSteps(pipeline, template, sb, userId, pipeline.currentStepIndex ?? 0);
}
