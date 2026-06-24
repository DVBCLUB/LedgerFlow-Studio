/**
 * agenticLoopEngine.ts
 * ============================================================
 * Agentic Loop Engine — vòng lặp tự hành Plan→Do→Observe→Replan.
 * Biến Control Plane từ "chạy một lần" thành "agent tự suy nghĩ,
 * thực thi, quan sát và điều chỉnh" với giới hạn an toàn.
 */
import { randomUUID } from 'node:crypto';
import { dispatchTextThroughFabric, type FabricRun } from './aiFabric';
import { appendAuditEvent } from './auditLog';
import { recordObservation } from './compoundMemory';
import { createSandboxSession, executeInSandbox, completeSandboxSession, autoTestAndRepair, type SandboxResult } from './sandboxCodeExecutor';
import { recordUsage } from './costObservability';
import { upsertNode, addEdge } from './knowledgeGraph';
import type { ChatMessage } from './aiClient';

// ─── Types ──────────────────────────────────────────────────────────
export type LoopStatus = 'planning' | 'executing' | 'observing' | 'replanning' | 'completed' | 'failed' | 'stopped';

export interface AgenticLoopStep {
  id: string;
  index: number;
  phase: LoopStatus;
  goal: string;
  plan: string;
  result?: FabricRun;
  observation: {
    success: boolean;
    summary: string;
    error?: string;
    evidence?: Record<string, unknown>;
    filesChanged?: string[];
    testsPassed?: boolean;
  };
  repairAttempts: number;
  startedAt: string;
  completedAt?: string;
  durationMs: number;
}

export interface AgenticLoopRun {
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
    const plan = await generatePlan(options.goal, options.domain, options.systemInstruction);
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
        const testResult = await runSandboxVerification(sandboxId, options.testCommand, step);
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
    evidence: { runId, status: run.status, steps: run.steps.length, planLength: plan.length },
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

async function executeLoopStep(
  run: AgenticLoopRun,
  stepGoal: string,
  index: number,
  options: AgenticLoopOptions
): Promise<AgenticLoopStep> {
  const step: AgenticLoopStep = {
    id: randomUUID(),
    index,
    phase: 'executing',
    goal: stepGoal,
    plan: run.plan.join(' → '),
    observation: { success: false, summary: '' },
    repairAttempts: 0,
    startedAt: new Date().toISOString(),
    durationMs: 0,
  };

  const stepStart = Date.now();

  try {
    // Dispatch qua AI Fabric — tự động fallback API→Web→Local
    const result = await dispatchTextThroughFabric(
      `Bước ${index + 1}/${run.plan.length}: ${stepGoal}\n\nMục tiêu tổng thể: ${run.goal}`,
      undefined,
      {
        domain: run.domain as any,
        task: run.domain,
        webPlatform: options.webPlatform,
        profileId: options.profileId,
        localFallback: true,
        filePath: options.filePaths?.[0],
      }
    );

    step.result = result;
    step.durationMs = Date.now() - stepStart;
    step.completedAt = new Date().toISOString();

    if (result.status === 'completed') {
      step.observation = {
        success: true,
        summary: result.winner?.contentPreview?.slice(0, 300) || 'Step completed.',
        evidence: {
          modelUsed: result.modelUsed,
          route: result.winner?.route,
          steps: result.steps.length,
          latencyMs: result.totalLatencyMs,
        },
      };

      // Ghi observation vào compound memory
      recordObservation(
        run.domain,
        `Step ${index + 1}: ${stepGoal.slice(0, 80)}`,
        step.observation.summary,
        0.75,
        `agentic-loop:${run.id}:step:${index}`,
        true,
      ).catch(() => undefined);
    } else {
      step.observation = {
        success: false,
        summary: 'AI Fabric failed to complete this step.',
        error: `All routes exhausted. Steps: ${result.steps.map(s => `${s.route}=${s.status}`).join(', ')}`,
      };

      // Ghi failure vào memory
      recordObservation(
        run.domain,
        `FAILED Step ${index + 1}: ${stepGoal.slice(0, 80)}`,
        step.observation.error || 'Fabric exhausted',
        0.3,
        `agentic-loop:${run.id}:step:${index}`,
        false,
      ).catch(() => undefined);
    }
  } catch (err: any) {
    step.durationMs = Date.now() - stepStart;
    step.completedAt = new Date().toISOString();
    step.observation = {
      success: false,
      summary: 'Step execution threw an exception.',
      error: err.message?.slice(0, 300),
    };

    recordObservation(
      run.domain,
      `CRASH Step ${index + 1}`,
      err.message?.slice(0, 300) || 'Unknown',
      0.1,
      `agentic-loop:${run.id}:step:${index}`,
      false,
    ).catch(() => undefined);
  }

  run.steps.push(step);
  run.updatedAt = new Date().toISOString();
  return step;
}

// ─── Sandbox verification ─────────────────────────────────────────

async function runSandboxVerification(
  sandboxId: string,
  testCommand: string,
  step: AgenticLoopStep,
): Promise<SandboxResult> {
  return executeInSandbox(sandboxId, testCommand).catch(err => ({
    ok: false, exitCode: -1, stdout: '', stderr: err.message,
    durationMs: 0, command: testCommand, mode: 'local',
  }));
}

// ─── Auto-repair ────────────────────────────────────────────────────

async function attemptRepair(
  run: AgenticLoopRun,
  failedStep: AgenticLoopStep,
  options: AgenticLoopOptions,
  sandboxId?: string,
): Promise<boolean> {
  const attempt = failedStep.repairAttempts + 1;
  failedStep.repairAttempts = attempt;
  failedStep.phase = 'replanning';

  const sandboxError = failedStep.observation.evidence?.sandboxOutput as string || '';
  const repairGoal = `SỬA LỖI (lần ${attempt}/${run.maxRepairAttempts}): ${failedStep.goal}\n\nLỖI: ${failedStep.observation.error || 'Không rõ lỗi'}\n${sandboxError ? 'SANDBOX OUTPUT:\n' + sandboxError : ''}\n\nHãy đề xuất cách sửa cụ thể.`;

  try {
    const result = await dispatchTextThroughFabric(
      repairGoal,
      undefined,
      { domain: run.domain as any, task: 'coding', localFallback: true }
    );

    if (result.status === 'completed') {
      // Run sandbox test again to verify repair
      let testsPassed = false;
      let sandboxExitCode = -1;
      if (sandboxId && options.testCommand) {
        const testResult = await runSandboxVerification(sandboxId, options.testCommand, failedStep);
        testsPassed = testResult.ok;
        sandboxExitCode = testResult.exitCode;
      }

      failedStep.observation = {
        success: true,
        summary: `Đã sửa sau ${attempt} lần thử: ${result.winner?.contentPreview?.slice(0, 200)}`,
        evidence: {
          modelUsed: result.modelUsed,
          repairAttempt: attempt,
          sandboxTest: testsPassed,
          sandboxExitCode,
        },
        testsPassed,
      };

      recordObservation(
        run.domain,
        `REPAIRED Step: ${failedStep.goal.slice(0, 80)}`,
        `Đã sửa trong ${attempt} lần thử. Test: ${testsPassed ? 'PASS' : 'FAIL'}`,
        testsPassed ? 0.7 : 0.4,
        `agentic-loop:${run.id}:repair`,
        testsPassed,
      ).catch(() => undefined);

      return true;
    }

    return false;
  } catch {
    return false;
  }
}

// ─── Stop / Query ───────────────────────────────────────────────────

export function stopAgenticLoop(runId: string, reason?: string): boolean {
  const run = activeRuns.get(runId);
  if (!run) return false;
  stoppedRuns.add(runId);
  run.status = 'stopped';
  run.updatedAt = new Date().toISOString();
  run.completedAt = run.updatedAt;
  run.summary = `Stopped by user: ${reason || 'manual stop'}`;
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
