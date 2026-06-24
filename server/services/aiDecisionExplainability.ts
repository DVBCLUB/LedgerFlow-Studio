/**
 * aiDecisionExplainability.ts
 * ============================================================
 * AI Decision Explainability — ghi lại và giải thích mọi
 * quyết định của AI: tại sao chọn model này, route này,
 * confidence này, và evidence dẫn đến quyết định đó.
 */
import { randomUUID } from 'node:crypto';
import fs from 'fs';
import path from 'path';

// ─── Types ──────────────────────────────────────────────────────────
export interface DecisionNode {
  id: string;
  type: 'model_selection' | 'route_selection' | 'tool_call' | 'memory_injection' | 'prompt_construction' | 'output_generation';
  timestamp: string;
  input: { query: string; context: string; candidates: string[] };
  decision: { chosen: string; reason: string; confidence: number };
  rejected: Array<{ option: string; reason: string }>;
  evidence: Record<string, unknown>;
  parentId?: string;
}

export interface ExplainabilityTrace {
  id: string;
  sessionId: string;
  task: string;
  nodes: DecisionNode[];
  summary: string;
  totalConfidence: number;
  bottleneck?: { node: string; reason: string; suggestion: string };
  startedAt: string;
  completedAt?: string;
}

// ─── Storage ────────────────────────────────────────────────────────
const TRACES_FILE = path.join(process.cwd(), 'decision_traces.json');
let traces: ExplainabilityTrace[] = [];
const activeSessions = new Map<string, ExplainabilityTrace>();

async function load(): Promise<void> {
  try { if (fs.existsSync(TRACES_FILE)) traces = JSON.parse(await fs.promises.readFile(TRACES_FILE, 'utf8')); } catch { }
}
load().catch(() => undefined);

async function save(): Promise<void> {
  await fs.promises.writeFile(TRACES_FILE, JSON.stringify(traces.slice(-100), null, 2), 'utf8');
}

// ─── Core API ───────────────────────────────────────────────────────

export function startTrace(sessionId: string, task: string): ExplainabilityTrace {
  const trace: ExplainabilityTrace = {
    id: `xtrace_${Date.now()}`,
    sessionId: sessionId || `sess_${randomUUID().slice(0, 6)}`,
    task: task.slice(0, 200),
    nodes: [],
    summary: '',
    totalConfidence: 0,
    startedAt: new Date().toISOString(),
  };
  activeSessions.set(trace.sessionId, trace);
  return trace;
}

export function recordDecision(
  sessionId: string,
  type: DecisionNode['type'],
  input: { query?: string; context?: string; candidates?: string[] },
  decision: { chosen: string; reason: string; confidence: number },
  rejected: Array<{ option: string; reason: string }> = [],
  evidence: Record<string, unknown> = {},
  parentId?: string,
): DecisionNode | undefined {
  const trace = activeSessions.get(sessionId);
  if (!trace) return undefined;

  const node: DecisionNode = {
    id: `dec_${Date.now()}_${randomUUID().slice(0, 4)}`,
    type,
    timestamp: new Date().toISOString(),
    input: {
      query: input.query || trace.task,
      context: input.context || '',
      candidates: input.candidates || [],
    },
    decision,
    rejected,
    evidence,
    parentId,
  };

  trace.nodes.push(node);
  return node;
}

export function completeTrace(sessionId: string): ExplainabilityTrace | undefined {
  const trace = activeSessions.get(sessionId);
  if (!trace) return undefined;

  trace.completedAt = new Date().toISOString();

  // Calculate total confidence
  if (trace.nodes.length > 0) {
    trace.totalConfidence = +(trace.nodes.reduce((s, n) => s + n.decision.confidence, 0) / trace.nodes.length).toFixed(2);
  }

  // Detect bottleneck
  const selectionNodes = trace.nodes.filter(n =>
    n.type === 'model_selection' || n.type === 'route_selection'
  );
  const lowConfidenceNodes = selectionNodes.filter(n => n.decision.confidence < 0.5);

  if (lowConfidenceNodes.length > 0) {
    const worst = lowConfidenceNodes.sort((a, b) => a.decision.confidence - b.decision.confidence)[0];
    trace.bottleneck = {
      node: worst.type,
      reason: worst.decision.reason,
      suggestion: worst.rejected.length > 0
        ? `Considered alternatives: ${worst.rejected.map(r => r.option).join(', ')} but rejected because ${worst.rejected.map(r => r.reason).join('; ')}.`
        : 'No alternatives were considered. Expand model/route pool.',
    };
  }

  // Generate summary
  trace.summary = generateTraceSummary(trace);

  // Store
  traces.push(trace);
  activeSessions.delete(sessionId);
  if (traces.length % 5 === 0) save().catch(() => undefined);

  return trace;
}

export function getTrace(traceId: string): ExplainabilityTrace | undefined {
  return traces.find(t => t.id === traceId) || Array.from(activeSessions.values()).find(t => t.id === traceId);
}

export function listTraces(limit = 50): ExplainabilityTrace[] {
  const all = [...traces, ...Array.from(activeSessions.values())];
  return all.sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime()).slice(0, limit);
}

export function getDecisionStats(): {
  totalTraces: number;
  avgConfidence: number;
  topDecisions: Record<string, number>;
  commonBottlenecks: Array<{ node: string; count: number }>;
} {
  const topDecisions: Record<string, number> = {};
  const bottleneckCounts: Record<string, number> = {};

  for (const trace of traces) {
    for (const node of trace.nodes) {
      topDecisions[node.decision.chosen] = (topDecisions[node.decision.chosen] || 0) + 1;
    }
    if (trace.bottleneck) {
      bottleneckCounts[trace.bottleneck.node] = (bottleneckCounts[trace.bottleneck.node] || 0) + 1;
    }
  }

  const avgConfidence = traces.length > 0
    ? +(traces.reduce((s, t) => s + t.totalConfidence, 0) / traces.length).toFixed(2)
    : 0;

  const commonBottlenecks = Object.entries(bottleneckCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([node, count]) => ({ node, count }));

  return {
    totalTraces: traces.length,
    avgConfidence,
    topDecisions,
    commonBottlenecks,
  };
}

export function getTraceTree(traceId: string): {
  root: DecisionNode | null;
  children: Record<string, DecisionNode[]>;
} {
  const trace = traces.find(t => t.id === traceId) || Array.from(activeSessions.values()).find(t => t.id === traceId);
  if (!trace) return { root: null, children: {} };

  const root = trace.nodes.find(n => !n.parentId) || trace.nodes[0] || null;
  const children: Record<string, DecisionNode[]> = {};

  for (const node of trace.nodes) {
    const pid = node.parentId || 'root';
    if (!children[pid]) children[pid] = [];
    children[pid].push(node);
  }

  return { root, children };
}

// ─── Helpers ────────────────────────────────────────────────────────

function generateTraceSummary(trace: ExplainabilityTrace): string {
  const parts: string[] = [];

  const modelNodes = trace.nodes.filter(n => n.type === 'model_selection');
  const routeNodes = trace.nodes.filter(n => n.type === 'route_selection');
  const toolNodes = trace.nodes.filter(n => n.type === 'tool_call');
  const memNodes = trace.nodes.filter(n => n.type === 'memory_injection');

  if (modelNodes.length > 0) {
    parts.push(`Model: ${modelNodes[modelNodes.length - 1].decision.chosen}`);
  }
  if (routeNodes.length > 0) {
    parts.push(`Route: ${routeNodes[routeNodes.length - 1].decision.chosen}`);
  }
  if (toolNodes.length > 0) {
    parts.push(`Tools used: ${toolNodes.map(n => n.decision.chosen).join(', ')}`);
  }
  if (memNodes.length > 0) {
    parts.push(`Memory injections: ${memNodes.length}`);
  }
  if (trace.bottleneck) {
    parts.push(`Bottleneck: ${trace.bottleneck.node} (${trace.bottleneck.reason})`);
  }

  return parts.join(' | ') || `Trace with ${trace.nodes.length} decision nodes.`;
}
