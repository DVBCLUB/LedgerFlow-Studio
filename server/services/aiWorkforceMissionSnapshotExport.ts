import { createHash } from 'node:crypto';
import type { MissionExecutionQueue } from './aiWorkforceMissionExecutionQueue.ts';
import { buildMissionOperatorRunbook, type MissionOperatorRunbook } from './aiWorkforceMissionRunbook.ts';
import { buildMissionOperatorReviewDossier, type MissionOperatorReviewDossier, type MissionOperatorReviewNoteInput } from './aiWorkforceMissionReviewNotes.ts';

export type MissionQueueSnapshotExportFormat = 'json' | 'markdown';

export interface MissionQueueSnapshotExportOptions {
  format: MissionQueueSnapshotExportFormat;
  createdAt?: string;
  includeRawQueue?: boolean;
  reviewNotes?: MissionOperatorReviewNoteInput[];
}

export interface MissionQueueSnapshotExport {
  id: string;
  queueId: string;
  missionId: string;
  format: MissionQueueSnapshotExportFormat;
  filename: string;
  checksum: string;
  content: string;
  reviewDossier: MissionOperatorReviewDossier;
  summary: {
    queueStatus: string;
    totalSteps: number;
    completedSteps: number;
    evidenceItems: number;
    approvalsCaptured: number;
    nextSafeAction: string;
    rollbackNote: string;
    reviewStatus: MissionOperatorReviewDossier['status'];
    reviewNotes: number;
    releaseReady: boolean;
  };
  createdAt: string;
}

function checksum(content: string) {
  return createHash('sha256').update(content).digest('hex');
}

function safeSlug(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 80) || 'mission-queue';
}

function queueArtifacts(queue: MissionExecutionQueue) {
  return queue.steps.flatMap((step) => step.evidence.map((item) => ({
    stepId: step.id,
    stepTitle: step.title,
    stepStatus: step.status,
    id: item.id,
    kind: item.kind,
    title: item.title,
    value: item.value,
    createdAt: item.createdAt,
  })));
}

function jsonPayload(queue: MissionExecutionQueue, runbook: MissionOperatorRunbook, reviewDossier: MissionOperatorReviewDossier, createdAt: string, includeRawQueue: boolean) {
  return {
    version: 1,
    kind: 'ai_workforce_mission_queue_snapshot',
    createdAt,
    queueId: queue.id,
    missionId: queue.missionId,
    status: queue.status,
    owner: queue.owner,
    riskTier: queue.riskTier,
    summary: queue.summary,
    nextSafeAction: runbook.nextSafeAction,
    rollbackNote: runbook.rollbackNote,
    handoffSummary: runbook.handoffSummary,
    reviewDossier,
    checklist: runbook.checklist,
    stepHandoffs: runbook.steps.map((step) => ({
      stepId: step.stepId,
      title: step.title,
      status: step.status,
      owner: step.owner,
      toolId: step.toolId,
      nextAction: step.nextAction,
      rollbackNote: step.rollbackNote,
      checklist: step.checklist,
    })),
    artifacts: queueArtifacts(queue),
    timeline: queue.timeline,
    rawQueue: includeRawQueue ? queue : undefined,
  };
}

function markdownExport(queue: MissionExecutionQueue, runbook: MissionOperatorRunbook, reviewDossier: MissionOperatorReviewDossier, createdAt: string) {
  const artifacts = queueArtifacts(queue);
  const checklist = runbook.checklist.map((item) => `- [${item.status === 'done' ? 'x' : ' '}] **${item.title}** (${item.status}, ${item.owner}) — ${item.action}\n  - Evidence: ${item.evidence}`).join('\n');
  const steps = runbook.steps.map((step, index) => `### ${index + 1}. ${step.title}\n- Status: ${step.status}\n- Owner: ${step.owner}\n- Tool: ${step.toolId}\n- Next action: ${step.nextAction}\n- Rollback: ${step.rollbackNote}`).join('\n\n');
  const evidence = artifacts.length
    ? artifacts.map((item) => `- **${item.title}** (${item.kind}) — ${item.stepTitle}: ${item.value}`).join('\n')
    : '- No evidence artifacts captured yet.';
  const timeline = queue.timeline.length
    ? queue.timeline.map((item) => `- ${item.createdAt}: ${item.event} by ${item.actor} — ${item.summary}`).join('\n')
    : '- No timeline events captured.';
  const reviewNotes = reviewDossier.notes.length
    ? reviewDossier.notes.map((note) => `- **${note.decision}** by ${note.reviewer}: ${note.summary}\n  - Requested action: ${note.requestedAction}\n  - Checksum: ${note.checksum}`).join('\n')
    : '- No operator review notes captured yet.';

  return `# AI Workforce Mission Queue Snapshot\n\nGenerated: ${createdAt}\n\nQueue: ${queue.id}\nMission: ${queue.missionId}\nOwner: ${queue.owner}\nStatus: ${queue.status}\nRisk: ${queue.riskTier}\n\n## Next safe action\n${runbook.nextSafeAction}\n\n## Owner handoff\n${runbook.handoffSummary}\n\n## Rollback note\n${runbook.rollbackNote}\n\n## Operator review notes\n- Review status: ${reviewDossier.status}\n- Release ready: ${reviewDossier.releaseReady}\n- Next reviewer action: ${reviewDossier.nextReviewerAction}\n- Dossier checksum: ${reviewDossier.checksum}\n${reviewNotes}\n\n## Queue summary\n- Total steps: ${queue.summary.totalSteps}\n- Completed steps: ${queue.summary.completedSteps}\n- Approval gates waiting: ${queue.summary.waitingApprovalSteps}\n- Approvals captured: ${queue.summary.approvalsCaptured}\n- Evidence items: ${queue.summary.evidenceItems}\n\n## Operator checklist\n${checklist}\n\n## Step handoffs\n${steps}\n\n## Evidence artifacts\n${evidence}\n\n## Timeline\n${timeline}\n`;
}

export function buildMissionQueueSnapshotExport(queue: MissionExecutionQueue, options: MissionQueueSnapshotExportOptions): MissionQueueSnapshotExport {
  const createdAt = options.createdAt || new Date().toISOString();
  const runbook = buildMissionOperatorRunbook(queue, createdAt);
  const reviewDossier = buildMissionOperatorReviewDossier(queue, options.reviewNotes || [], createdAt);
  const content = options.format === 'json'
    ? JSON.stringify(jsonPayload(queue, runbook, reviewDossier, createdAt, Boolean(options.includeRawQueue)), null, 2)
    : markdownExport(queue, runbook, reviewDossier, createdAt);
  const digest = checksum(content);
  const filename = `${safeSlug(queue.id)}-snapshot-${createdAt.slice(0, 10)}.${options.format === 'json' ? 'json' : 'md'}`;
  return {
    id: `mission_snapshot_${digest.slice(0, 16)}`,
    queueId: queue.id,
    missionId: queue.missionId,
    format: options.format,
    filename,
    checksum: digest,
    content,
    reviewDossier,
    summary: {
      queueStatus: queue.status,
      totalSteps: queue.summary.totalSteps,
      completedSteps: queue.summary.completedSteps,
      evidenceItems: queue.summary.evidenceItems,
      approvalsCaptured: queue.summary.approvalsCaptured,
      nextSafeAction: runbook.nextSafeAction,
      rollbackNote: runbook.rollbackNote,
      reviewStatus: reviewDossier.status,
      reviewNotes: reviewDossier.summary.totalNotes,
      releaseReady: reviewDossier.releaseReady,
    },
    createdAt,
  };
}
