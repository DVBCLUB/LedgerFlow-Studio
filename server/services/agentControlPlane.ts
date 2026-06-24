/**
 * agentControlPlane.ts
 * ============================================================
 * Agent Control Plane — lớp điều phối thống nhất giữa AI Fabric,
 * IDE Bridge và các Connector. Đây là "bộ não trung tâm" để
 * một tác vụ có thể bắt đầu ở AI, chuyển sang IDE, rồi kết
 * thúc ở GitHub connector mà vẫn có audit trail thống nhất.
 */
import { dispatchThroughFabric, dispatchTextThroughFabric, type FabricRun, type AIFabricOptions } from "./aiFabric";
import { generateHandoffPrompt, openIDE, type IDETarget } from "./ideBridge";
import { appendAuditEvent } from "./auditLog";
import type { ChatMessage } from "./aiClient";

// ─── Types ──────────────────────────────────────────────────────────
export type ControlPlanePhase =
  | "analyze"       // AI phân tích yêu cầu
  | "plan"          // AI lập kế hoạch
  | "handoff_ide"   // Handoff sang IDE
  | "execute"       // Thực thi qua connector
  | "review"        // Review kết quả
  | "replan";       // Lập lại kế hoạch nếu fail

export type ControlPlaneStatus = "planned" | "running" | "waiting_handoff" | "completed" | "failed";

export interface ControlPlaneStep {
  phase: ControlPlanePhase;
  status: "queued" | "running" | "completed" | "failed" | "skipped";
  startedAt?: string;
  completedAt?: string;
  result?: FabricRun;
  handoffPrompt?: ReturnType<typeof generateHandoffPrompt>;
  evidence?: Record<string, unknown>;
  error?: string;
}

export interface ControlPlaneRun {
  id: string;
  goal: string;
  status: ControlPlaneStatus;
  phases: ControlPlanePhase[];
  steps: ControlPlaneStep[];
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  summary?: string;
}

export interface AgentControlPlaneOptions {
  goal: string;
  domain?: AIFabricOptions["domain"];
  systemInstruction?: string;
  webPlatform?: string;
  profileId?: string;
  autoHandoff?: boolean;       // Tự động handoff sang IDE sau khi AI phân tích
  handoffTarget?: IDETarget;   // IDE mặc định để handoff
  filePaths?: string[];        // File liên quan
  connectorIds?: string[];     // Connector sẽ dùng
  maxPhases?: number;          // Giới hạn số phase
}

// ─── Active runs (in-memory) ────────────────────────────────────────
const activeRuns = new Map<string, ControlPlaneRun>();

// ─── Execute a control plane run ────────────────────────────────────
export async function executeControlPlaneRun(
  options: AgentControlPlaneOptions
): Promise<ControlPlaneRun> {
  const runId = `cp_${Date.now()}_${Math.random().toString(16).slice(2, 6)}`;
  const now = new Date().toISOString();

  const defaultPhases: ControlPlanePhase[] = ["analyze", ...(options.autoHandoff ? ["handoff_ide" as ControlPlanePhase] : [])];
  const phases = options.maxPhases ? defaultPhases.slice(0, options.maxPhases) : defaultPhases;

  const run: ControlPlaneRun = {
    id: runId,
    goal: options.goal,
    status: "running",
    phases,
    steps: [],
    createdAt: now,
    updatedAt: now,
  };

  activeRuns.set(runId, run);

  await appendAuditEvent({
    actor: "founder",
    workspace: "Agent Control Plane",
    action: "agent_control_plane.run",
    target: options.goal.slice(0, 80),
    risk: "MEDIUM",
    status: "executed",
    summary: `Control Plane run ${runId} started: ${options.goal.slice(0, 60)}`,
    connectorId: "agent-control-plane",
    evidence: { runId, phases, autoHandoff: options.autoHandoff },
  }).catch(() => undefined);

  try {
    // ── Phase 1: Analyze ────────────────────────────────────────────
    const analyzeStep: ControlPlaneStep = { phase: "analyze", status: "running", startedAt: new Date().toISOString() };
    run.steps.push(analyzeStep);

    try {
      const fabricResult = await dispatchTextThroughFabric(
        options.goal,
        options.systemInstruction,
        {
          domain: options.domain,
          task: options.domain || "general",
          webPlatform: options.webPlatform,
          profileId: options.profileId,
          localFallback: true,
        }
      );

      if (fabricResult.status === "completed") {
        analyzeStep.status = "completed";
        analyzeStep.result = fabricResult;
        analyzeStep.evidence = {
          modelUsed: fabricResult.modelUsed,
          route: fabricResult.winner?.route,
          steps: fabricResult.steps.length,
        };
      } else {
        analyzeStep.status = "failed";
        analyzeStep.error = `AI Fabric exhausted all routes. Steps: ${fabricResult.steps.map(s => `${s.route}=${s.status}`).join(", ")}`;
        run.status = "failed";
      }
    } catch (err: any) {
      analyzeStep.status = "failed";
      analyzeStep.error = err.message;
      run.status = "failed";
    }
    analyzeStep.completedAt = new Date().toISOString();

    // ── Phase 2: Handoff to IDE (nếu autoHandoff) ───────────────────
    if (options.autoHandoff && analyzeStep.status === "completed" && options.handoffTarget) {
      const handoffStep: ControlPlaneStep = { phase: "handoff_ide", status: "running", startedAt: new Date().toISOString() };
      run.steps.push(handoffStep);

      try {
        const fabricContent = analyzeStep.result?.winner?.contentPreview || "";
        const fullContent = analyzeStep.result?.steps
          .find(s => s.status === "success")?.contentPreview || fabricContent;

        const prompt = generateHandoffPrompt(
          options.handoffTarget,
          options.goal,
          options.filePaths,
          `AI phân tích: ${fullContent}`
        );

        handoffStep.status = "completed";
        handoffStep.handoffPrompt = prompt;
        handoffStep.evidence = {
          target: prompt.target,
          risk: prompt.risk,
          safeCommands: prompt.safeCommands,
          checklist: prompt.testChecklist,
        };

        // Thử mở IDE nếu có file cụ thể
        if (options.filePaths?.length) {
          try {
            openIDE(options.handoffTarget, options.filePaths[0]);
            handoffStep.evidence.ideOpened = true;
          } catch {
            handoffStep.evidence.ideOpened = false;
          }
        }

        run.status = "waiting_handoff";
      } catch (err: any) {
        handoffStep.status = "failed";
        handoffStep.error = err.message;
      }
      handoffStep.completedAt = new Date().toISOString();
    }

    // Đánh dấu hoàn thành nếu không có phase nào fail
    if (run.status === "running") {
      run.status = "completed";
    }

    run.completedAt = new Date().toISOString();
    run.updatedAt = run.completedAt;

    const winnerStep = run.steps.find(s => s.status === "completed");
    run.summary = winnerStep?.result?.winner?.contentPreview?.slice(0, 150)
      || `Control plane completed with ${run.steps.filter(s => s.status === "completed").length} successful steps.`;

    await appendAuditEvent({
      actor: "system",
      workspace: "Agent Control Plane",
      action: "agent_control_plane.complete",
      target: options.goal.slice(0, 80),
      risk: run.status === "failed" ? "HIGH" : "MEDIUM",
      status: run.status === "completed" ? "executed" : "failed",
      summary: `Control Plane run ${runId} ${run.status}: ${run.summary?.slice(0, 80)}`,
      connectorId: "agent-control-plane",
      evidence: { runId, status: run.status, steps: run.steps.length },
    }).catch(() => undefined);

    return run;
  } catch (err: any) {
    run.status = "failed";
    run.completedAt = new Date().toISOString();
    run.updatedAt = run.completedAt;
    run.summary = `Fatal error: ${err.message}`;

    await appendAuditEvent({
      actor: "system",
      workspace: "Agent Control Plane",
      action: "agent_control_plane.error",
      target: options.goal.slice(0, 80),
      risk: "HIGH",
      status: "failed",
      summary: `Control Plane run ${runId} crashed: ${err.message?.slice(0, 80)}`,
      connectorId: "agent-control-plane",
      evidence: { runId, error: err.message },
    }).catch(() => undefined);

    return run;
  }
}

// ─── Query active/get run ───────────────────────────────────────────
export function getControlPlaneRun(id: string): ControlPlaneRun | undefined {
  return activeRuns.get(id);
}

export function listControlPlaneRuns(): ControlPlaneRun[] {
  return Array.from(activeRuns.values()).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

export function getControlPlaneMetrics(): {
  totalRuns: number;
  completed: number;
  failed: number;
  waitingHandoff: number;
  averageSteps: number;
} {
  const runs = Array.from(activeRuns.values());
  return {
    totalRuns: runs.length,
    completed: runs.filter(r => r.status === "completed").length,
    failed: runs.filter(r => r.status === "failed").length,
    waitingHandoff: runs.filter(r => r.status === "waiting_handoff").length,
    averageSteps: runs.length > 0
      ? Math.round(runs.reduce((sum, r) => sum + r.steps.length, 0) / runs.length)
      : 0,
  };
}

export function cleanupStaleRuns(maxAgeMs = 30 * 60 * 1000): number {
  const now = Date.now();
  let cleaned = 0;
  for (const [id, run] of activeRuns) {
    if (now - new Date(run.createdAt).getTime() > maxAgeMs) {
      activeRuns.delete(id);
      cleaned++;
    }
  }
  return cleaned;
}
