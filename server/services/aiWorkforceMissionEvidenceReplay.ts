import { createHash } from 'node:crypto';
import type { AutomationSafetyDecision } from './automationSafetyEnvelope.ts';
import type { MissionExecutionQueue, MissionExecutionQueueStep } from './aiWorkforceMissionExecutionQueue.ts';

export interface MissionEvidenceReplayArtifact {
  id: string;
  queueId: string;
  stepId: string;
  missionStepId: string;
  title: string;
  status: 'preview' | 'executed' | 'blocked';
  requestedToolId: string;
  adapterToolId: string;
  fingerprint: string;
  safetyMode: AutomationSafetyDecision['mode'];
  safetyApproved: boolean;
  timeline: Array<{ index: number; action: string; summary: string; evidenceRequired: string }>;
  artifacts: Array<{ id: string; title: string; kind: 'operator_note' | 'artifact' | 'metric' | 'approval' | 'audit' | 'replay'; value: string; createdAt: string }>;
  summary: {
    evidenceItems: number;
    replaySteps: number;
    approvalsCaptured: number;
    expectedEvidence: number;
    missingExpectedEvidence: string[];
  };
  createdAt: string;
}

function stableId(prefix: string, value: unknown) {
  return `${prefix}_${createHash('sha256').update(JSON.stringify(value)).digest('hex').slice(0, 16)}`;
}

function normalize(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

function evidenceMatches(expected: string, evidence: Array<{ title: string; value: string }>) {
  const target = normalize(expected);
  return evidence.some((item) => `${normalize(item.title)} ${normalize(item.value)}`.includes(target.split(' ')[0] || target));
}

export function buildMissionEvidenceReplayArtifact(options: {
  queue: MissionExecutionQueue;
  step: MissionExecutionQueueStep;
  requestedToolId: string;
  adapterToolId: string;
  mode: 'dry_run' | 'simulation';
  fingerprint: string;
  safetyDecision: AutomationSafetyDecision;
  generatedEvidence: Array<{ title: string; value: string }>;
  createdAt?: string;
}): MissionEvidenceReplayArtifact {
  const createdAt = options.createdAt || new Date().toISOString();
  const combinedEvidence = [...options.step.evidence, ...options.generatedEvidence.map((item) => ({
    id: stableId('generated_evidence', { stepId: options.step.id, title: item.title, value: item.value, createdAt }),
    title: item.title,
    kind: 'replay' as const,
    value: item.value,
    createdAt,
  }))];
  const missingExpectedEvidence = options.step.expectedEvidence.filter((expected) => !evidenceMatches(expected, combinedEvidence));

  return {
    id: stableId('evidence_replay', { queueId: options.queue.id, stepId: options.step.id, fingerprint: options.fingerprint, createdAt }),
    queueId: options.queue.id,
    stepId: options.step.id,
    missionStepId: options.step.missionStepId,
    title: `${options.step.title} evidence replay`,
    status: options.safetyDecision.approved ? (options.mode === 'simulation' ? 'executed' : 'preview') : 'blocked',
    requestedToolId: options.requestedToolId,
    adapterToolId: options.adapterToolId,
    fingerprint: options.fingerprint,
    safetyMode: options.safetyDecision.mode,
    safetyApproved: options.safetyDecision.approved,
    timeline: options.safetyDecision.replay.map((item) => ({
      index: item.index,
      action: item.actionId,
      summary: item.summary,
      evidenceRequired: item.evidenceRequired,
    })),
    artifacts: combinedEvidence,
    summary: {
      evidenceItems: combinedEvidence.length,
      replaySteps: options.safetyDecision.replay.length,
      approvalsCaptured: options.step.approval ? 1 : 0,
      expectedEvidence: options.step.expectedEvidence.length,
      missingExpectedEvidence,
    },
    createdAt,
  };
}
