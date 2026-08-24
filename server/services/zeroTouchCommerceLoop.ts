/**
 * server/services/zeroTouchCommerceLoop.ts
 * ============================================================
 * Zero-Touch Product-to-Revenue Loop — bộ điều phối trạng thái.
 *
 * Nối các mắt xích đã có (assetFoundry, videoProductionStudioEngine,
 * monetizationOrchestrator, businessDataService, vietqrReconciler,
 * vietnameseEInvoiceEngine) thành vòng lặp tự động:
 *
 *   signal → build → market → sell → invoice → reconcile → tax → done
 *
 * Cổng phê duyệt bắt buộc (tuân AGENTS.md — không chạy tiền tự do):
 *   - sell → invoice : cần phê duyệt (chạm tiền).
 *   - reconcile → tax: cần phê duyệt (quyết toán thuế).
 *
 * Thuần (pure) + in-memory store, publish event lên mesh (non-blocking).
 */

import { randomUUID } from 'node:crypto';

export type LoopStage = 'signal' | 'build' | 'market' | 'sell' | 'invoice' | 'reconcile' | 'tax' | 'done';

export interface LoopGate {
  stage: LoopStage;
  approved: boolean;
}

export interface LoopRun {
  id: string;
  productId: string;
  stage: LoopStage;
  status: 'running' | 'awaiting_approval' | 'completed' | 'failed';
  gates: LoopGate[];
  revenueVnd: number;
  costVnd: number;
  marginVnd: number;
  log: string[];
  createdAt: string;
  updatedAt: string;
}

export const STAGE_ORDER: LoopStage[] = ['signal', 'build', 'market', 'sell', 'invoice', 'reconcile', 'tax', 'done'];

// Các chuyển tiếp bắt buộc phê duyệt.
export const GATED_TRANSITIONS: ReadonlyArray<readonly [LoopStage, LoopStage]> = [
  ['sell', 'invoice'],
  ['reconcile', 'tax'],
];

export interface StageTransition {
  next: LoopStage;
  advanced: boolean;
  requiresApproval: boolean;
}

/**
 * Pure helper — tính bước chuyển trạng thái tiếp theo.
 */
export function computeNextStage(current: LoopStage, approve: boolean): StageTransition {
  const idx = STAGE_ORDER.indexOf(current);
  const requiresApproval = GATED_TRANSITIONS.some(([from, to]) => from === current && to === STAGE_ORDER[idx + 1]);

  if (idx === STAGE_ORDER.length - 1) {
    return { next: 'done', advanced: false, requiresApproval: false };
  }
  if (requiresApproval && !approve) {
    return { next: current, advanced: false, requiresApproval: true };
  }
  return { next: STAGE_ORDER[idx + 1], advanced: true, requiresApproval };
}

// ─── In-memory store ──────────────────────────────────────────────────────────

const runs = new Map<string, LoopRun>();

function nowIso(): string {
  return new Date().toISOString();
}

function publishStageEvent(run: LoopRun): void {
  // Best-effort: mesh publish hiện đã non-blocking (P0).
  import('./agentEventBus.ts')
    .then(({ publish }) =>
      publish(
        'agent.step.done',
        { runId: run.id, stage: run.stage, productId: run.productId },
        'zero-touch-loop',
      ).catch(() => undefined),
    )
    .catch(() => undefined);
}

export function startZeroTouchLoop(productId: string): LoopRun {
  const run: LoopRun = {
    id: `loop_${Date.now().toString(36)}_${randomUUID().slice(0, 6)}`,
    productId,
    stage: 'signal',
    status: 'running',
    gates: [],
    revenueVnd: 0,
    costVnd: 0,
    marginVnd: 0,
    log: [`Bắt đầu vòng lặp zero-touch cho sản phẩm ${productId}.`],
    createdAt: nowIso(),
    updatedAt: nowIso(),
  };
  runs.set(run.id, run);
  return { ...run };
}

export function advanceLoopStage(runId: string, approve = false): LoopRun | undefined {
  const run = runs.get(runId);
  if (!run) return undefined;
  if (run.status === 'completed' || run.status === 'failed') return { ...run };

  const transition = computeNextStage(run.stage, approve);

  if (!transition.advanced) {
    if (transition.requiresApproval) {
      run.status = 'awaiting_approval';
      run.gates.push({ stage: transition.next, approved: false });
      run.log.push(`Chờ phê duyệt để chuyển ${run.stage} → ${transition.next}.`);
    }
    run.updatedAt = nowIso();
    return { ...run };
  }

  run.stage = transition.next;
  if (transition.requiresApproval) run.gates.push({ stage: transition.next, approved: true });
  run.status = run.stage === 'done' ? 'completed' : 'running';
  run.log.push(`Chuyển ${STAGE_ORDER[STAGE_ORDER.indexOf(transition.next) - 1]} → ${transition.next}.`);
  run.updatedAt = nowIso();
  publishStageEvent(run);
  return { ...run };
}

export function recordLoopRevenue(runId: string, revenueVnd: number, costVnd: number): LoopRun | undefined {
  const run = runs.get(runId);
  if (!run) return undefined;
  run.revenueVnd = revenueVnd;
  run.costVnd = costVnd;
  run.marginVnd = revenueVnd - costVnd;
  run.updatedAt = nowIso();
  return { ...run };
}

export function getLoopRun(runId: string): LoopRun | undefined {
  const run = runs.get(runId);
  return run ? { ...run } : undefined;
}

export function listLoopRuns(): LoopRun[] {
  return [...runs.values()].map((r) => ({ ...r }));
}

// ─── Business persistence (best-effort, lazy import) ──────────────────────

const persistedStages = new Map<string, Set<string>>();

/**
 * Ghi entity nghiệp vụ khi vòng lặp chạm tiền (best-effort):
 *   - stage >= 'sell'   → ghi `deal` (nguồn AI → pending_approval).
 *   - stage >= 'invoice' + có doanh thu → ghi `invoice` (accountCode 131).
 * Idempotent: mỗi stage chỉ ghi một lần cho mỗi run.
 */
export async function persistLoopBusiness(run: LoopRun): Promise<{ deal?: boolean; invoice?: boolean }> {
  const done = persistedStages.get(run.id) ?? new Set<string>();
  const result: { deal?: boolean; invoice?: boolean } = {};
  try {
    const { persistAgentResult } = await import('./aiBusinessBridge.ts');
    const stageIdx = STAGE_ORDER.indexOf(run.stage);
    const sellIdx = STAGE_ORDER.indexOf('sell');
    const invoiceIdx = STAGE_ORDER.indexOf('invoice');

    if (stageIdx >= sellIdx && !done.has('deal')) {
      persistAgentResult({
        type: 'deal',
        data: { productId: run.productId, amountVnd: run.revenueVnd, stage: run.stage, loopId: run.id },
        source: 'ai',
      });
      done.add('deal');
      result.deal = true;
    }

    if (stageIdx >= invoiceIdx && run.revenueVnd > 0 && !done.has('invoice')) {
      persistAgentResult({
        type: 'invoice',
        data: { accountCode: 131, productId: run.productId, amountVnd: run.revenueVnd, loopId: run.id },
        source: 'ai',
      });
      done.add('invoice');
      result.invoice = true;
    }

    persistedStages.set(run.id, done);
  } catch {
    /* business store unavailable — non-fatal */
  }
  return result;
}

export function getLoopStats(): { total: number; completed: number; awaitingApproval: number; running: number } {
  const all = [...runs.values()];
  return {
    total: all.length,
    completed: all.filter((r) => r.status === 'completed').length,
    awaitingApproval: all.filter((r) => r.status === 'awaiting_approval').length,
    running: all.filter((r) => r.status === 'running').length,
  };
}
