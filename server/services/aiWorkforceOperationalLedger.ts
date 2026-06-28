import { createHash } from 'node:crypto';
import type { GroundedContextPack, KnowledgeGraphEdge, KnowledgeGraphNode } from './groundedContextPack.ts';
import type { AIObservabilitySummary } from './aiBenchmarkObservability.ts';
import { createJsonFileLocalStore } from './aiWorkforceLocalStore.ts';

export type AIWorkforceAuditSeverity = 'info' | 'warning' | 'critical';
export type AIWorkforceAuditAction =
  | 'context_pack_created'
  | 'context_pack_blocked'
  | 'safety_previewed'
  | 'pr_readiness_scored'
  | 'github_pr_control_scored'
  | 'mission_planned'
  | 'mission_execution_queued'
  | 'mission_execution_resumed'
  | 'mission_step_approved'
  | 'mission_step_started'
  | 'mission_step_completed'
  | 'mission_tool_previewed'
  | 'mission_tool_executed'
  | 'mission_release_gate_recorded'
  | 'mission_execution_cancelled'
  | 'runtime_snapshot_created'
  | 'tooling_catalog_exported';

export interface AIWorkforceGraphRecord {
  id: string;
  contextPackId: string;
  question: string;
  nodes: KnowledgeGraphNode[];
  edges: KnowledgeGraphEdge[];
  sourceIds: string[];
  contradictions: number;
  confidence: number;
  createdAt: string;
}

export interface AIWorkforceAuditEvent {
  id: string;
  action: AIWorkforceAuditAction;
  severity: AIWorkforceAuditSeverity;
  actor: string;
  summary: string;
  entityId?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

export interface AIWorkforceTrendSnapshot {
  id: string;
  readinessGrade: string;
  readinessScore: number;
  observability: Pick<AIObservabilitySummary, 'runs' | 'successRate' | 'blockedRate' | 'averageLatencyMs' | 'p95LatencyMs' | 'averageQualityScore' | 'estimatedCostUsd'>;
  toolingSummary: {
    total: number;
    healthy: number;
    degraded: number;
    blocked: number;
    approvalRequired: number;
    connectorTools: number;
  };
  createdAt: string;
}

interface AIWorkforceOperationalLedgerStore extends Record<string, unknown> {
  graphs: Record<string, AIWorkforceGraphRecord>;
  auditEvents: Record<string, AIWorkforceAuditEvent>;
  trendSnapshots: Record<string, AIWorkforceTrendSnapshot>;
}

function stableId(prefix: string, value: unknown) {
  return `${prefix}_${createHash('sha256').update(JSON.stringify(value)).digest('hex').slice(0, 16)}`;
}

function emptyStore(): AIWorkforceOperationalLedgerStore {
  return { graphs: {}, auditEvents: {}, trendSnapshots: {} };
}

const ledgerStore = createJsonFileLocalStore<AIWorkforceOperationalLedgerStore>({
  filePath: () => process.env.AI_WORKFORCE_OPERATIONAL_LEDGER_FILE || 'ai_workforce_operational_ledger.local.json',
  emptyState: emptyStore,
  normalizeState: (parsed) => {
    const candidate = parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed as Partial<AIWorkforceOperationalLedgerStore> : {};
    return {
      graphs: candidate.graphs && typeof candidate.graphs === 'object' ? candidate.graphs : {},
      auditEvents: candidate.auditEvents && typeof candidate.auditEvents === 'object' ? candidate.auditEvents : {},
      trendSnapshots: candidate.trendSnapshots && typeof candidate.trendSnapshots === 'object' ? candidate.trendSnapshots : {},
    };
  },
});

export function persistKnowledgeGraphFromContextPack(pack: GroundedContextPack, createdAt = new Date().toISOString()) {
  const record: AIWorkforceGraphRecord = {
    id: stableId('graph', { packId: pack.id, createdAt }),
    contextPackId: pack.id,
    question: pack.question,
    nodes: pack.graph.nodes,
    edges: pack.graph.edges,
    sourceIds: pack.sourceMap.map((source) => source.id),
    contradictions: pack.contradictions.length,
    confidence: pack.confidence,
    createdAt,
  };

  return ledgerStore.mutate((store) => {
    store.graphs[record.id] = record;
    return record;
  });
}

export function appendAIWorkforceAuditEvent(event: Omit<AIWorkforceAuditEvent, 'id' | 'createdAt'> & { id?: string; createdAt?: string }) {
  const createdAt = event.createdAt || new Date().toISOString();
  const fullEvent: AIWorkforceAuditEvent = {
    ...event,
    id: event.id || stableId('audit', { action: event.action, entityId: event.entityId, createdAt, metadata: event.metadata }),
    createdAt,
  };

  return ledgerStore.mutate((store) => {
    store.auditEvents[fullEvent.id] = fullEvent;
    return fullEvent;
  });
}

export function appendAIWorkforceTrendSnapshot(snapshot: Omit<AIWorkforceTrendSnapshot, 'id' | 'createdAt'> & { id?: string; createdAt?: string }) {
  const createdAt = snapshot.createdAt || new Date().toISOString();
  const fullSnapshot: AIWorkforceTrendSnapshot = {
    ...snapshot,
    id: snapshot.id || stableId('trend', { readinessScore: snapshot.readinessScore, runs: snapshot.observability.runs, createdAt }),
    createdAt,
  };

  return ledgerStore.mutate((store) => {
    store.trendSnapshots[fullSnapshot.id] = fullSnapshot;
    return fullSnapshot;
  });
}

export async function listAIWorkforceAuditEvents(limit = 50) {
  return Object.values((await ledgerStore.read()).auditEvents)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, limit);
}

export async function listAIWorkforceTrendSnapshots(limit = 30) {
  return Object.values((await ledgerStore.read()).trendSnapshots)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, limit);
}

export async function getAIWorkforceOperationalLedgerDashboard() {
  const store = await ledgerStore.read();
  const graphs = Object.values(store.graphs).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const auditEvents = Object.values(store.auditEvents).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const trendSnapshots = Object.values(store.trendSnapshots).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const latestTrend = trendSnapshots[0] || null;
  const previousTrend = trendSnapshots[1] || null;
  const readinessDelta = latestTrend && previousTrend ? Number((latestTrend.readinessScore - previousTrend.readinessScore).toFixed(2)) : 0;
  const blockedRateDelta = latestTrend && previousTrend ? Number((latestTrend.observability.blockedRate - previousTrend.observability.blockedRate).toFixed(3)) : 0;
  const storage = await ledgerStore.stats();
  return {
    graphStats: {
      total: graphs.length,
      totalGraphs: graphs.length,
      totalNodes: graphs.reduce((sum, graph) => sum + graph.nodes.length, 0),
      totalEdges: graphs.reduce((sum, graph) => sum + graph.edges.length, 0),
      latestGraph: graphs[0] || null,
    },
    auditStats: {
      total: auditEvents.length,
      totalEvents: auditEvents.length,
      latestEvent: auditEvents[0] || null,
    },
    trendStats: {
      total: trendSnapshots.length,
      totalSnapshots: trendSnapshots.length,
      latestTrend,
      readinessDelta,
      blockedRateDelta,
    },
    storage,
  };
}

export async function clearAIWorkforceOperationalLedgerForTest() {
  await ledgerStore.clear();
}
