/**
 * server/services/bftConsensus.ts
 * ============================================================
 * PBFT-lite Byzantine Fault Tolerant consensus for high-risk decisions.
 *
 * agentConsensusEngine.ts là weighted vote (chịu lỗi crash, KHÔNG chịu lỗi
 * Byzantine). Module này bổ sung lớp PBFT-lite chạy trên mesh in-process cho
 * các quyết định rủi ro cao (tài chính, bảo mật, refactor):
 *   - An toàn (safety) đòi hỏi n >= 3f+1 bản sao.
 *   - Quyết định cần đồng thời: đủ quorum theo SỐ LƯỢNG (2f+1 replica)
 *     VÀ siêu đa số theo TRỌNG SỐ danh tiếng (>= 2/3 tổng trọng số).
 *   - Slashing danh tiếng khi replica bỏ phiếu mâu thuẫn giữa các vòng.
 */

import { performance } from 'node:perf_hooks';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface BftReplica {
  id: string;
  role: string;
  weight: number; // reputation, 0..1
}

export type BftVoteValue = 'approve' | 'reject';

export interface BftVote {
  replicaId: string;
  value: BftVoteValue;
  confidence: number; // 0..1
}

export type BftDecisionValue = BftVoteValue | 'no_quorum';

export interface BftDecision {
  proposalId: string;
  decided: boolean;
  value: BftDecisionValue;
  faultsTolerated: number; // f
  replicaCount: number;     // n
  quorum: number;           // 2f+1
  approveCount: number;
  rejectCount: number;
  approveWeight: number;
  rejectWeight: number;
  totalWeight: number;
  commitLatencyMs: number;
  viewChanges: number;
}

export interface BftOptions {
  proposalId?: string;
  majorityRatio?: number; // default 2/3
}

// ─── Pure math ────────────────────────────────────────────────────────────────

export function computeFaultTolerance(replicaCount: number): number {
  return Math.max(0, Math.floor((replicaCount - 1) / 3));
}

export function computeQuorum(replicaCount: number): number {
  return 2 * computeFaultTolerance(replicaCount) + 1;
}

export function detectConflictingVoters(rounds: BftVote[][]): Set<string> {
  const firstValue = new Map<string, BftVoteValue>();
  const conflicting = new Set<string>();
  for (const round of rounds) {
    for (const vote of round) {
      const prev = firstValue.get(vote.replicaId);
      if (prev === undefined) {
        firstValue.set(vote.replicaId, vote.value);
      } else if (prev !== vote.value) {
        conflicting.add(vote.replicaId);
      }
    }
  }
  return conflicting;
}

export function applyReputationSlash(replicas: BftReplica[], conflicting: Set<string>, slashFactor = 0.5): BftReplica[] {
  return replicas.map((r) =>
    conflicting.has(r.id) ? { ...r, weight: Math.max(0, r.weight * slashFactor) } : r,
  );
}

// ─── Core engine ──────────────────────────────────────────────────────────────

/**
 * Chạy một vòng PBFT-lite đồng bộ (in-process).
 * Yêu cầu đủ cả hai điều kiện để "decided":
 *   1. Số replica đồng thuận >= quorum (2f+1).
 *   2. Trọng số đồng thuận >= majorityRatio (mặc định 2/3) tổng trọng số.
 */
export function runPBFTLite(
  replicas: BftReplica[],
  votes: BftVote[],
  options: BftOptions = {},
): BftDecision {
  const start = performance.now();
  const n = replicas.length;
  const f = computeFaultTolerance(n);
  const quorum = computeQuorum(n);
  const majorityRatio = options.majorityRatio ?? 2 / 3;

  const weightById = new Map(replicas.map((r) => [r.id, Math.max(0, r.weight)]));
  const totalWeight = replicas.reduce((s, r) => s + Math.max(0, r.weight), 0);

  let approveCount = 0;
  let rejectCount = 0;
  let approveWeight = 0;
  let rejectWeight = 0;

  for (const vote of votes) {
    if (!weightById.has(vote.replicaId)) continue; // unknown replica → ignore
    const weight = weightById.get(vote.replicaId)! * Math.max(0, Math.min(1, vote.confidence));
    if (vote.value === 'approve') {
      approveCount += 1;
      approveWeight += weight;
    } else {
      rejectCount += 1;
      rejectWeight += weight;
    }
  }

  const threshold = majorityRatio * totalWeight;
  let value: BftDecisionValue = 'no_quorum';
  if (approveCount >= quorum && approveWeight >= threshold) {
    value = 'approve';
  } else if (rejectCount >= quorum && rejectWeight >= threshold) {
    value = 'reject';
  }

  return {
    proposalId: options.proposalId ?? `proposal_${Date.now().toString(36)}`,
    decided: value !== 'no_quorum',
    value,
    faultsTolerated: f,
    replicaCount: n,
    quorum,
    approveCount,
    rejectCount,
    approveWeight,
    rejectWeight,
    totalWeight,
    commitLatencyMs: performance.now() - start,
    viewChanges: 0,
  };
}

/**
 * Tạo tập replica mặc định (4 replica → f=1) từ danh sách vai trò.
 * Trọng số khởi tạo bằng nhau (danh tiếng sẽ điều chỉnh qua slashing).
 */
export function assembleDefaultReplicas(roles: string[] = ['finance', 'security', 'architecture', 'planner']): BftReplica[] {
  return roles.map((role, i) => ({ id: `replica_${i}_${role}`, role, weight: 1 }));
}

/**
 * Demo votes (cho UI/kiểm thử khi chưa có phiếu từ vòng tranh luận thật):
 * mọi replica approve theo trọng số, riêng replica trọng số thấp nhất bỏ
 * reject để chứng minh 1 Byzantine node KHÔNG thể phá vỡ quorum.
 */
export function deriveDemoVotes(replicas: BftReplica[]): BftVote[] {
  const sorted = [...replicas].sort((a, b) => a.weight - b.weight);
  const dissenterId = sorted[0]?.id;
  return replicas.map((r) => ({
    replicaId: r.id,
    value: r.id === dissenterId ? 'reject' : 'approve',
    confidence: 1,
  }));
}
