import { createHash } from 'node:crypto';
import type { MissionExecutionQueue } from './aiWorkforceMissionExecutionQueue.ts';
import type { MissionOperatorReviewDossier } from './aiWorkforceMissionReviewNotes.ts';

export type MissionOperatorReleaseGateDecision = 'ready' | 'hold' | 'not_ready';

export interface MissionOperatorReleaseEvidence {
  ciStatus?: 'success' | 'pending' | 'failed' | 'unknown';
  approvals?: number;
  requiredApprovals?: number;
  snapshotChecksum?: string;
  releaseLabel?: boolean;
  rollbackConfirmed?: boolean;
  operatorConfirmed?: boolean;
  notes?: string[];
}

export interface MissionOperatorReleaseGate {
  id: string;
  queueId: string;
  missionId: string;
  decision: MissionOperatorReleaseGateDecision;
  releaseReady: boolean;
  score: number;
  missingEvidence: string[];
  warnings: string[];
  criteria: string[];
  finalAction: string;
  checksum: string;
  createdAt: string;
  evidence: Required<MissionOperatorReleaseEvidence>;
}

function digest(value: unknown) {
  return createHash('sha256').update(JSON.stringify(value)).digest('hex');
}

function normalizeEvidence(input: MissionOperatorReleaseEvidence = {}): Required<MissionOperatorReleaseEvidence> {
  return {
    ciStatus: input.ciStatus || 'unknown',
    approvals: Number(input.approvals || 0),
    requiredApprovals: Math.max(1, Number(input.requiredApprovals || 1)),
    snapshotChecksum: String(input.snapshotChecksum || ''),
    releaseLabel: Boolean(input.releaseLabel),
    rollbackConfirmed: Boolean(input.rollbackConfirmed),
    operatorConfirmed: Boolean(input.operatorConfirmed),
    notes: Array.isArray(input.notes) ? input.notes.map(String) : [],
  };
}

export function buildMissionOperatorReleaseGate(queue: MissionExecutionQueue, reviewDossier: MissionOperatorReviewDossier, evidence: MissionOperatorReleaseEvidence = {}, createdAt = new Date().toISOString()): MissionOperatorReleaseGate {
  const normalized = normalizeEvidence(evidence);
  const missingEvidence: string[] = [];
  const warnings: string[] = [];
  const criteria = [
    'CI status is success.',
    'Review dossier is release ready.',
    'Required approvals are captured.',
    'Snapshot checksum is present.',
    'Rollback path is confirmed.',
    'Operator final confirmation is captured.',
  ];

  if (normalized.ciStatus !== 'success') missingEvidence.push(`CI status is ${normalized.ciStatus}.`);
  if (!reviewDossier.releaseReady) missingEvidence.push(`Review dossier is ${reviewDossier.status}.`);
  if (normalized.approvals < normalized.requiredApprovals) missingEvidence.push(`Approvals ${normalized.approvals}/${normalized.requiredApprovals}.`);
  if (!normalized.snapshotChecksum) missingEvidence.push('Snapshot checksum is missing.');
  if (!normalized.rollbackConfirmed) missingEvidence.push('Rollback confirmation is missing.');
  if (!normalized.operatorConfirmed) missingEvidence.push('Operator final confirmation is missing.');

  if (!normalized.releaseLabel) warnings.push('Release label is not present.');
  if (queue.status !== 'completed') warnings.push(`Mission queue status is ${queue.status}; this gate is a handoff readiness gate.`);
  if (queue.summary.blockedSteps > 0) warnings.push('Mission queue has unresolved blocked steps.');
  if (queue.summary.cancelledSteps > 0) warnings.push('Mission queue has cancelled steps.');
  if (reviewDossier.summary.totalNotes === 0) warnings.push('No operator review notes are attached.');

  const score = Math.max(0, 100 - missingEvidence.length * 16 - warnings.length * 4);
  const decision: MissionOperatorReleaseGateDecision = missingEvidence.length === 0 ? 'ready' : normalized.ciStatus === 'failed' || queue.summary.blockedSteps > 0 ? 'not_ready' : 'hold';
  const releaseReady = decision === 'ready';
  const finalAction = releaseReady
    ? 'Ready: proceed with release handoff after recording this gate checksum.'
    : decision === 'not_ready'
      ? 'Not ready: resolve required evidence before handoff.'
      : 'Hold: collect the missing evidence and rerun the release gate.';
  const body = { queueId: queue.id, missionId: queue.missionId, decision, releaseReady, score, missingEvidence, warnings, criteria, finalAction, evidence: normalized, createdAt };
  const checksum = digest(body);
  return { id: `mission_release_gate_${checksum.slice(0, 16)}`, checksum, ...body };
}
