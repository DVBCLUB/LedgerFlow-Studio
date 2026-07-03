/**
 * multiAgentOrchestrator.ts
 * ============================================================
 * Multi-Agent Orchestrator — Magentic orchestration pattern:
 * một Agent Manager phân task cho team agent chuyên biệt
 * (Agent Code + Agent Test + Agent Review + Agent Finance)
 * và tổng hợp kết quả.
 */
import { randomUUID } from 'node:crypto';
import { dispatchTextThroughFabric } from './aiFabric.ts';
import { recordObservation, searchMemory } from './compoundMemory.ts';
import { appendAuditEvent } from './auditLog.ts';
import { recordRuntimeCoreMission } from './agentRuntimeCore.ts';

// ─── Types ──────────────────────────────────────────────────────────
export type AgentRole = 'code' | 'test' | 'review' | 'finance' | 'planner' | 'general';

export interface AgentSpec {
  role: AgentRole;
  label: string;
  domain: string;
  systemPrompt: string;
  tools: string[];
}

export interface AgentTask {
  id: string;
  role: AgentRole;
  goal: string;
  context: string;
  priority: 'critical' | 'high' | 'normal';
  dependencies: string[]; // IDs of tasks this depends on
  status: 'queued' | 'running' | 'completed' | 'failed' | 'blocked';
  startedAt?: string;
  completedAt?: string;
  result?: {
    content: string;
    modelUsed: string;
    success: boolean;
    latencyMs: number;
    evidence?: Record<string, unknown>;
  };
  error?: string;
}

export interface OrchestrationPlan {
  id: string;
  goal: string;
  domain: string;
  tasks: AgentTask[];
  executionOrder: string[];
  status: 'planning' | 'executing' | 'completed' | 'failed';
  createdAt: string;
  completedAt?: string;
  summary?: string;
  totalLatencyMs: number;
}

export interface MultiAgentOptions {
  goal: string;
  domain?: string;
  parallel?: boolean;           // Chạy các task độc lập song song
  maxAgents?: number;           // Số agent tối đa
  webPlatform?: string;
  profileId?: string;
}

// ─── Agent specs ────────────────────────────────────────────────────

const AGENT_SPECS: Record<AgentRole, AgentSpec> = {
  code: {
    role: 'code',
    label: 'Developer Agent',
    domain: 'coding',
    systemPrompt: 'Bạn là Developer Agent chuyên viết và sửa code TypeScript/React. Hãy trả về code sạch, có comment, và đảm bảo type-safe.',
    tools: ['read_file', 'write_file', 'edit_file', 'run_lint'],
  },
  test: {
    role: 'test',
    label: 'QA Test Agent',
    domain: 'coding',
    systemPrompt: 'Bạn là QA Agent chuyên kiểm tra chất lượng code. Hãy xác minh tính đúng đắn, edge case, và test coverage.',
    tools: ['read_file', 'run_test', 'analyze_coverage'],
  },
  review: {
    role: 'review',
    label: 'Code Review Agent',
    domain: 'coding',
    systemPrompt: 'Bạn là Code Review Agent. Hãy review code về security, performance, readability, và best practices.',
    tools: ['read_file', 'security_scan', 'perf_analyze'],
  },
  finance: {
    role: 'finance',
    label: 'Finance Agent',
    domain: 'finance',
    systemPrompt: 'Bạn là Finance Agent chuyên phân tích số liệu tài chính, tính toán chi phí, và lập báo cáo.',
    tools: ['read_data', 'calculate', 'generate_report'],
  },
  planner: {
    role: 'planner',
    label: 'Orchestrator Agent',
    domain: 'general',
    systemPrompt: 'Bạn là Orchestrator. Hãy phân tích yêu cầu và phân công cho các agent chuyên biệt phù hợp.',
    tools: ['plan', 'delegate', 'summarize'],
  },
  general: {
    role: 'general',
    label: 'General Agent',
    domain: 'general',
    systemPrompt: 'Bạn là General Agent có thể xử lý các tác vụ đa dạng.',
    tools: ['search', 'analyze', 'respond'],
  },
};

// ─── Task decomposition ─────────────────────────────────────────────

async function decomposeIntoAgentTasks(
  goal: string,
  domain: string,
  maxAgents: number
): Promise<AgentTask[]> {
  const decompositionPrompt = `Bạn là một AI Orchestrator. Hãy phân rã mục tiêu sau thành các task con, mỗi task giao cho một agent chuyên biệt.

MỤC TIÊU: ${goal}
DOMAIN: ${domain}
MAX AGENTS: ${maxAgents}

CÁC AGENT CÓ SẴN:
- code: viết và sửa code
- test: kiểm tra chất lượng
- review: review code
- finance: phân tích tài chính
- planner: lập kế hoạch
- general: xử lý đa dạng

TRẢ VỀ danh sách task theo format:
TASK: [role] | [priority] | [mô tả task]
Ví dụ: TASK: code | high | Viết hàm xử lý authentication

Chỉ trả về các dòng TASK, không thêm text khác.`;

  try {
    const result = await dispatchTextThroughFabric(
      decompositionPrompt,
      undefined,
      { domain: domain as any, task: 'general', localFallback: true }
    );

    if (result.status !== 'completed') return [];

    const tasks: AgentTask[] = [];
    const lines = (result.winner?.contentPreview || '')
      .split('\n')
      .map(l => l.trim())
      .filter(l => l.toUpperCase().startsWith('TASK:'));

    for (const line of lines.slice(0, maxAgents)) {
      const parts = line.replace(/^TASK:\s*/i, '').split('|').map(s => s.trim());
      if (parts.length < 2) continue;

      const role = parts[0].toLowerCase() as AgentRole;
      if (!AGENT_SPECS[role]) continue;

      const priority = (parts[1] || 'normal') as AgentTask['priority'];
      const goal = parts.slice(2).join('|') || parts[1];

      tasks.push({
        id: `task_${Date.now()}_${randomUUID().slice(0, 6)}`,
        role,
        goal: goal.slice(0, 200),
        context: '',
        priority,
        dependencies: [],
        status: 'queued',
      });
    }

    return tasks;
  } catch {
    return [];
  }
}

// ─── Execute single agent task ──────────────────────────────────────

async function executeAgentTask(task: AgentTask, options: MultiAgentOptions): Promise<AgentTask> {
  const spec = AGENT_SPECS[task.role];
  task.status = 'running';
  task.startedAt = new Date().toISOString();
  const started = Date.now();

  try {
    // Enrich context from memory
    let enrichedContext = spec.systemPrompt;
    try {
      const memories = await searchMemory(task.goal, { domain: spec.domain, limit: 3 });
      if (memories.length > 0) {
        enrichedContext += `\n\nRelevant past knowledge:\n${memories.map(m => `- ${m.title}: ${m.content.slice(0, 150)}`).join('\n')}`;
      }
    } catch { /* memory optional */ }

    const result = await dispatchTextThroughFabric(
      task.goal,
      enrichedContext,
      {
        domain: spec.domain as any,
        task: spec.domain,
        webPlatform: options.webPlatform,
        profileId: options.profileId,
        localFallback: true,
      }
    );

    task.status = result.status === 'completed' ? 'completed' : 'failed';
    task.completedAt = new Date().toISOString();
    task.result = {
      content: result.winner?.contentPreview || '',
      modelUsed: result.modelUsed || 'unknown',
      success: result.status === 'completed',
      latencyMs: Date.now() - started,
      evidence: { steps: result.steps.length, route: result.winner?.route },
    };

    // Record observation to memory
    await recordObservation(
      spec.domain,
      `Multi-agent ${task.role}: ${task.goal.slice(0, 80)}`,
      task.result.content.slice(0, 500),
      task.result.success ? 0.8 : 0.3,
      `multi-agent:${task.id}`,
      task.result.success
    ).catch(() => undefined);
  } catch (err: any) {
    task.status = 'failed';
    task.error = err.message;
    task.completedAt = new Date().toISOString();
  }

  return task;
}

// ─── Orchestrate ────────────────────────────────────────────────────

export async function orchestrateMultiAgent(options: MultiAgentOptions): Promise<OrchestrationPlan> {
  const planId = `orch_${Date.now()}_${randomUUID().slice(0, 6)}`;
  const now = new Date().toISOString();
  const started = Date.now();
  const maxAgents = Math.min(options.maxAgents ?? 5, 10);

  const plan: OrchestrationPlan = {
    id: planId,
    goal: options.goal,
    domain: options.domain || 'general',
    tasks: [],
    executionOrder: [],
    status: 'planning',
    createdAt: now,
    totalLatencyMs: 0,
  };

  await appendAuditEvent({
    actor: 'system',
    workspace: 'Multi-Agent Orchestrator',
    action: 'multi_agent.plan',
    target: options.goal.slice(0, 80),
    risk: 'MEDIUM',
    status: 'executed',
    summary: `Multi-agent orchestration ${planId} started: ${options.goal.slice(0, 60)}`,
    connectorId: 'multi-agent',
    evidence: { planId, maxAgents, parallel: options.parallel },
  }).catch(() => undefined);

  try {
    // Step 1: Decompose into tasks
    const tasks = await decomposeIntoAgentTasks(options.goal, options.domain || 'general', maxAgents);

    if (tasks.length === 0) {
      // Fallback: single general agent
      tasks.push({
        id: `task_${Date.now()}_fallback`,
        role: 'general',
        goal: options.goal,
        context: '',
        priority: 'high',
        dependencies: [],
        status: 'queued',
      });
    }

    plan.tasks = tasks;
    plan.executionOrder = tasks.map(t => t.id);
    plan.status = 'executing';

    // Step 2: Execute tasks (parallel or sequential)
    if (options.parallel) {
      // Run all independent tasks in parallel
      const independent = tasks.filter(t => t.dependencies.length === 0);
      const dependent = tasks.filter(t => t.dependencies.length > 0);

      await Promise.all(independent.map(t => executeAgentTask(t, options)));

      // Wait for dependencies
      for (const t of dependent) {
        const allDepsDone = t.dependencies.every(depId => {
          const dep = plan.tasks.find(t2 => t2.id === depId);
          return dep?.status === 'completed';
        });
        if (allDepsDone) {
          await executeAgentTask(t, options);
        } else {
          t.status = 'blocked';
        }
      }
    } else {
      // Sequential execution
      for (const task of plan.tasks) {
        await executeAgentTask(task, options);
        if (task.status === 'failed' && task.priority === 'critical') {
          plan.status = 'failed';
          break;
        }
      }
    }

    // Determine final status
    if (plan.status !== 'failed') {
      const allDone = plan.tasks.every(t => t.status === 'completed' || t.status === 'failed');
      const criticalOk = plan.tasks.filter(t => t.priority === 'critical').every(t => t.status === 'completed');
      plan.status = allDone && criticalOk ? 'completed' : 'completed'; // completed even with non-critical failures
    }
  } catch (err: any) {
    plan.status = 'failed';
    plan.summary = `Orchestration error: ${err.message}`;
  } finally {
    plan.completedAt = new Date().toISOString();
    plan.totalLatencyMs = Date.now() - started;
    plan.summary = `${plan.tasks.filter(t => t.status === 'completed').length}/${plan.tasks.length} agents completed.`;

    await appendAuditEvent({
      actor: 'system',
      workspace: 'Multi-Agent Orchestrator',
      action: 'multi_agent.complete',
      target: options.goal.slice(0, 80),
      risk: plan.status === 'failed' ? 'HIGH' : 'MEDIUM',
      status: plan.status === 'completed' ? 'executed' : 'failed',
      summary: `Orchestration ${planId} ${plan.status}: ${plan.summary}`,
      connectorId: 'multi-agent',
      evidence: { planId, taskCount: plan.tasks.length, parallel: options.parallel },
    }).catch(() => undefined);

    storePlan(plan);
    await recordRuntimeCoreMission({
      source: 'multi_agent_orchestrator',
      missionId: plan.id,
      goal: plan.goal,
      domain: plan.domain,
      status: plan.status === 'failed' ? 'failed' : 'completed',
      createdAt: plan.createdAt,
      updatedAt: plan.completedAt,
      completedAt: plan.completedAt,
      summary: plan.summary,
      stepCount: plan.tasks.length,
      completedStepCount: plan.tasks.filter((task) => task.status === 'completed').length,
      failedStepCount: plan.tasks.filter((task) => task.status === 'failed' || task.status === 'blocked').length,
      waitingApprovalCount: 0,
      totalDurationMs: plan.totalLatencyMs,
      metadata: {
        executionOrder: plan.executionOrder,
        parallel: Boolean(options.parallel),
        taskRoles: plan.tasks.map((task) => task.role),
      },
    }).catch(() => undefined);
  }

  return plan;
}

// ─── Active plans ───────────────────────────────────────────────────
const activePlans = new Map<string, OrchestrationPlan>();

export function storePlan(plan: OrchestrationPlan): void {
  activePlans.set(plan.id, plan);
}

export function getPlan(id: string): OrchestrationPlan | undefined {
  return activePlans.get(id);
}

export function listPlans(): OrchestrationPlan[] {
  return Array.from(activePlans.values()).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

export function getAgentSpecs(): AgentSpec[] {
  return Object.values(AGENT_SPECS);
}
