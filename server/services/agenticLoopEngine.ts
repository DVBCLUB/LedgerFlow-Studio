/**
 * agenticLoopEngine.ts
 * ============================================================
 * Agentic Loop Engine — vòng lặp tự hành Plan→Do→Observe→Replan.
 * Biến Control Plane từ "chạy một lần" thành "agent tự suy nghĩ,
 * thực thi, quan sát và điều chỉnh" với giới hạn an toàn.
 */
import { dispatchTextThroughFabric } from './aiFabric.ts';
import { appendAuditEvent } from './auditLog.ts';
import { createSandboxSession, completeSandboxSession } from './sandboxCodeExecutor.ts';
import { recordUsage } from './costObservability.ts';
import { upsertNode, addEdge } from './knowledgeGraph.ts';
import type { ChatMessage } from './aiClient.ts';
import { appendAIWorkforceRuntimeRecord } from './aiWorkforceRuntimeStore.ts';
import {
  attemptRepair,
  executeLoopStep,
  runSandboxVerification,
  type AgentExecutionLoopRun,
  type AgentExecutionLoopStep,
} from './agentExecutionCore.ts';

// ─── Types ──────────────────────────────────────────────────────────
export type LoopStatus = 'planning' | 'executing' | 'observing' | 'replanning' | 'completed' | 'failed' | 'stopped';

export type AgenticLoopStep = AgentExecutionLoopStep;

export interface AgenticLoopRun extends AgentExecutionLoopRun {
  id: string;
  goal: string;
  domain: string;
  status: LoopStatus;
  plan: string[];                   // Kế hoạch các bước do AI lập
  steps: AgenticLoopStep[];
  currentLoop: number;
  maxLoops: number;
  maxRepairAttempts: number;
  autoRepair: boolean;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  totalDurationMs: number;
  summary?: string;
}

export interface AgenticLoopOptions {
  goal: string;
  domain?: string;
  maxLoops?: number;                // Số lần replan tối đa (default 5)
  maxRepairAttempts?: number;       // Số lần auto-repair mỗi bước (default 3)
  autoRepair?: boolean;             // Tự động sửa nếu fail (default false)
  systemInstruction?: string;
  webPlatform?: string;
  profileId?: string;
  filePaths?: string[];
  stopOnFirstError?: boolean;       // Dừng ngay khi có lỗi (default true)
  sandboxMode?: 'local' | 'docker' | 'dry_run'; // Bật sandbox để chạy test thật
  testCommand?: string;             // Lệnh test (VD: "npm run lint", "npm run build")
}

// ─── Active runs ────────────────────────────────────────────────────
const activeRuns = new Map<string, AgenticLoopRun>();
const stoppedRuns = new Set<string>();

function recordAgenticLoopSnapshot(run: AgenticLoopRun, event: string) {
  return appendAIWorkforceRuntimeRecord({
    id: `agent_execution_run_${run.id}`,
    type: 'agent_execution_run',
    createdAt: run.updatedAt,
    payload: {
      surface: 'agentic_loop',
      event,
      runId: run.id,
      status: run.status,
      goal: run.goal,
      domain: run.domain,
      createdAt: run.createdAt,
      updatedAt: run.updatedAt,
      completedAt: run.completedAt,
      stepCount: run.steps.length,
      completedStepCount: run.steps.filter((step) => step.phase === 'completed').length,
      failedStepCount: run.steps.filter((step) => step.phase === 'failed').length,
      maxLoops: run.maxLoops,
      maxRepairAttempts: run.maxRepairAttempts,
      autoRepair: run.autoRepair,
      totalDurationMs: run.totalDurationMs,
      summary: run.summary,
    },
  }).catch(() => undefined);
}

// ─── Core Loop ──────────────────────────────────────────────────────

export async function runAgenticLoop(options: AgenticLoopOptions): Promise<AgenticLoopRun> {
  const runId = `loop_${Date.now()}_${Math.random().toString(16).slice(2, 6)}`;
  const now = new Date().toISOString();
  const started = Date.now();

  const maxLoops = Math.min(options.maxLoops ?? 5, 10);
  const maxRepairAttempts = Math.min(options.maxRepairAttempts ?? 3, 5);

  const run: AgenticLoopRun = {
    id: runId,
    goal: options.goal,
    domain: options.domain || 'coding',
    status: 'planning',
    plan: [],
    steps: [],
    currentLoop: 0,
    maxLoops,
    maxRepairAttempts,
    autoRepair: options.autoRepair ?? false,
    createdAt: now,
    updatedAt: now,
    totalDurationMs: 0,
  };

  activeRuns.set(runId, run);
  await recordAgenticLoopSnapshot(run, 'started');

  await appendAuditEvent({
    actor: 'system',
    workspace: 'Agentic Loop',
    action: 'agentic_loop.start',
    target: options.goal.slice(0, 80),
    risk: 'MEDIUM',
    status: 'executed',
    summary: `Agentic loop ${runId} started: ${options.goal.slice(0, 60)}`,
    connectorId: 'agentic-loop',
    evidence: { runId, maxLoops, autoRepair: options.autoRepair },
  }).catch(() => undefined);

  try {
    // ── Phase: Planning ───────────────────────────────────────────
    const plan = await generatePlan(options.goal, options.domain || "general", options.systemInstruction || "");
    run.plan = plan;
    run.status = 'executing';
    run.updatedAt = new Date().toISOString();

    // ── Phase: Execute each step ──────────────────────────────────
    // Create sandbox session if test command is specified
    let sandboxId: string | undefined;
    if (options.sandboxMode && options.testCommand) {
      const sandbox = createSandboxSession({ mode: options.sandboxMode, timeoutMs: 180_000 });
      sandboxId = sandbox.id;
    }

    for (let i = 0; i < plan.length; i++) {
      if (stoppedRuns.has(runId)) {
        run.status = 'stopped';
        break;
      }

      const stepGoal = plan[i];
      const step = await executeLoopStep(run, stepGoal, i, options);

      // Run sandbox test after each step if enabled
      if (sandboxId && options.testCommand) {
        const testResult = await runSandboxVerification(sandboxId, options.testCommand);
        step.observation.evidence = {
          ...(step.observation.evidence || {}),
          sandboxTest: testResult.ok,
          sandboxExitCode: testResult.exitCode,
          sandboxOutput: testResult.stdout.slice(0, 300),
        };
        step.observation.testsPassed = testResult.ok;
      }

      if (!step.observation.success && options.stopOnFirstError !== false) {
        // Attempt auto-repair
        if (options.autoRepair && step.repairAttempts < maxRepairAttempts) {
          const repaired = await attemptRepair(run, step, options, sandboxId);
          if (repaired) continue;
        }
        run.status = 'failed';
        break;
      }

      if (i === plan.length - 1) {
        run.status = 'completed';
      }
    }

    // Complete sandbox session
    if (sandboxId) {
      const sandboxSummary = await completeSandboxSession(sandboxId).catch(() => undefined);
      if (sandboxSummary) {
        run.summary = `${run.summary || ''} | Sandbox: ${sandboxSummary.summary}`;
      }
    }

    if (run.status !== 'stopped' && run.status !== 'failed' && run.steps.every(s => s.observation.success)) {
      run.status = 'completed';
    }
  } catch (err: any) {
    run.status = 'failed';
    run.summary = `Fatal error: ${err.message}`;
  } finally {
    run.completedAt = new Date().toISOString();
    run.updatedAt = run.completedAt;
    run.totalDurationMs = Date.now() - started;

    if (run.steps.length > 0) {
      const successCount = run.steps.filter(s => s.observation.success).length;
      run.summary = run.status === 'completed'
        ? `${successCount}/${run.steps.length} steps completed successfully.`
        : `${successCount}/${run.steps.length} steps done, loop ${run.status}.`;
    }

    await appendAuditEvent({
    actor: 'system',
    workspace: 'Agentic Loop',
    action: 'agentic_loop.complete',
    target: options.goal.slice(0, 80),
    risk: run.status === 'failed' ? 'HIGH' : 'MEDIUM',
    status: run.status === 'completed' ? 'executed' : 'failed',
    summary: `Agentic loop ${runId} ${run.status}: ${run.summary?.slice(0, 80)}`,
    connectorId: 'agentic-loop',
    evidence: { runId, status: run.status, steps: run.steps.length, planLength: run.plan.length },
  }).catch(() => undefined);

  // Track cost & knowledge graph
  try {
    recordUsage({
      agent: 'agentic-loop',
      model: run.steps.find(s => s.result?.modelUsed)?.result?.modelUsed || 'fabric',
      route: run.steps.find(s => s.result?.winner?.route)?.result?.winner?.route || 'api',
      domain: run.domain,
      completionText: run.summary || '',
      latencyMs: run.totalDurationMs,
      success: run.status === 'completed',
      taskSummary: options.goal.slice(0, 150),
    });
    // Graph: link loop to its domain node
    const loopNode = upsertNode('agent_loop', runId, options.goal.slice(0, 200), { status: run.status, steps: run.steps.length }, 0.8);
    const domainNode = upsertNode('memory', `domain_${run.domain}`, run.domain, {}, 1);
    addEdge(loopNode.id, domainNode.id, 'belongs_to', 1);
  } catch { /* non-critical */ }

  await recordAgenticLoopSnapshot(run, 'completed');
  }

  return run;
}

// ─── Plan generation ────────────────────────────────────────────────

async function generatePlan(
  goal: string,
  domain: string,
  systemInstruction?: string
): Promise<string[]> {
  const messages: ChatMessage[] = [];
  if (systemInstruction) messages.push({ role: 'system', content: systemInstruction });

  const planPrompt = `Bạn là một AI Task Planner. Hãy chia nhỏ mục tiêu sau thành các bước cụ thể, tuần tự. Mỗi bước phải là một hành động cụ thể có thể thực thi được.

MỤC TIÊU: ${goal}
DOMAIN: ${domain}

QUY TẮC:
1. Trả về DANH SÁCH các bước, mỗi bước trên một dòng, bắt đầu bằng dấu gạch ngang "- "
2. Mỗi bước phải CỤ THỂ - không mơ hồ
3. Sắp xếp theo thứ tự thực thi
4. Tối đa 7 bước
5. Mỗi bước nên tự kiểm chứng được (có tiêu chí thành công rõ ràng)

Ví dụ cho coding task:
- Đọc file server/services/aiClient.ts để hiểu cấu trúc hiện tại
- Thêm hàm mới "validateResponse" vào aiClient.ts
- Cập nhật các file gọi aiClient để dùng hàm mới
- Chạy npm run lint để kiểm tra type
- Sửa các lỗi type nếu có`;

  try {
    const result = await dispatchTextThroughFabric(
      planPrompt,
      undefined,
      { domain: domain as any, task: 'general', localFallback: true }
    );

    if (result.status !== 'completed' || !result.winner?.contentPreview) {
      // Fallback: return simple plan
      return [goal];
    }

    const content = result.winner.contentPreview;
    const lines = content
      .split('\n')
      .map(l => l.trim())
      .filter(l => l.startsWith('- ') || l.startsWith('* ') || l.startsWith('1.') || l.startsWith('2.') || l.startsWith('3.'))
      .map(l => l.replace(/^[-*\d.]+\s*/, '').trim())
      .filter(Boolean);

    return lines.length > 0 ? lines.slice(0, 7) : [goal];
  } catch {
    return [goal];
  }
}

// ─── Step execution ─────────────────────────────────────────────────

export function stopAgenticLoop(runId: string, reason?: string): boolean {
  const run = activeRuns.get(runId);
  if (!run) return false;
  stoppedRuns.add(runId);
  run.status = 'stopped';
  run.updatedAt = new Date().toISOString();
  run.completedAt = run.updatedAt;
  run.summary = `Stopped by user: ${reason || 'manual stop'}`;
  recordAgenticLoopSnapshot(run, 'stopped').catch(() => undefined);
  return true;
}

export function getAgenticLoopRun(id: string): AgenticLoopRun | undefined {
  return activeRuns.get(id);
}

export function listAgenticLoopRuns(): AgenticLoopRun[] {
  return Array.from(activeRuns.values()).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

export function getAgenticLoopMetrics(): {
  total: number; running: number; completed: number; failed: number; stopped: number;
  averageSteps: number; averageDurationMs: number;
} {
  const runs = Array.from(activeRuns.values());
  const completed = runs.filter(r => r.status === 'completed');
  return {
    total: runs.length,
    running: runs.filter(r => r.status === 'planning' || r.status === 'executing' || r.status === 'replanning').length,
    completed: completed.length,
    failed: runs.filter(r => r.status === 'failed').length,
    stopped: runs.filter(r => r.status === 'stopped').length,
    averageSteps: runs.length > 0 ? Math.round(runs.reduce((s, r) => s + r.steps.length, 0) / runs.length) : 0,
    averageDurationMs: completed.length > 0
      ? Math.round(completed.reduce((s, r) => s + r.totalDurationMs, 0) / completed.length)
      : 0,
  };
}

export function cleanupStaleLoops(maxAgeMs = 60 * 60 * 1000): number {
  const now = Date.now();
  let cleaned = 0;
  for (const [id, run] of activeRuns) {
    if (now - new Date(run.createdAt).getTime() > maxAgeMs) {
      activeRuns.delete(id);
      stoppedRuns.delete(id);
      cleaned++;
    }
  }
  return cleaned;
}
