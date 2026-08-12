/**
 * agentWorkflowDAG.ts
 * ============================================================
 * Agent Workflow DAG (Directed Acyclic Graph) Execution Engine for LedgerFlow OS.
 *
 * Supports complex multi-agent workflows beyond linear pipelines:
 *  - Arbitrary dependency graphs (dependsOn: string[]).
 *  - Topological sorting & cycle detection.
 *  - Parallel execution of independent ready nodes.
 *  - Conditional edge branching (skip, escalate, stop).
 *  - Visual export to Mermaid format.
 *  - Local encrypted persistence.
 */

import { randomUUID } from 'node:crypto';
import { readSecureJson, writeSecureJson } from './secureJsonStore.ts';
import { resolveRuntimePathFromEnv } from './runtimePaths.ts';
import { appendAuditEvent } from './auditLog.ts';
import { getAgentRole } from './agentRoles.ts';
import { callAI } from './aiClient.ts';
import { emitTelemetryEvent } from './agentTelemetryStream.ts';

// ─── Types ────────────────────────────────────────────────────────────────────

export type DAGNodeStatus = 'pending' | 'running' | 'waiting_approval' | 'completed' | 'failed' | 'skipped';
export type DAGWorkflowStatus = 'pending' | 'running' | 'waiting_approval' | 'completed' | 'failed' | 'stopped';

export interface DAGNodeCondition {
  field: string;
  operator: 'contains' | 'equals' | 'not_equals';
  value?: string;
  onTrue: 'continue' | 'skip_children' | 'escalate' | 'stop';
}

export interface DAGNodeDefinition {
  id: string;
  name: string;
  agentRole: string;
  dependsOn: string[];             // IDs of nodes that must complete before this node can run
  promptTemplate: string;
  requiresApproval?: boolean;
  condition?: DAGNodeCondition;
  timeoutMs?: number;
  maxRetries?: number;
}

export interface DAGNodeState extends DAGNodeDefinition {
  status: DAGNodeStatus;
  output?: string;
  error?: string;
  startedAt?: string;
  completedAt?: string;
}

export interface DAGWorkflowExecution {
  id: string;
  name: string;
  description: string;
  status: DAGWorkflowStatus;
  nodes: Record<string, DAGNodeState>;
  input: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  summary?: string;
}

interface DAGStore {
  workflows: Record<string, DAGWorkflowExecution>;
}

// ─── Storage ──────────────────────────────────────────────────────────────────

let store: DAGStore = { workflows: {} };
let writeQueue = Promise.resolve();

function storageFile() {
  return resolveRuntimePathFromEnv('DAG_WORKFLOW_STORE_FILE', 'agent_dag_workflows.local.enc');
}

async function loadStore(): Promise<DAGStore> {
  const parsed = await readSecureJson<DAGStore>(storageFile(), { workflows: {} });
  store = { workflows: parsed.workflows || {} };
  return store;
}

async function saveStore(): Promise<void> {
  await writeSecureJson(storageFile(), store);
}

function queueSave(): void {
  const task = () => saveStore().catch(() => undefined);
  writeQueue = writeQueue.then(task, task);
}

loadStore().catch(() => undefined);

// ─── Topological Sort & Cycle Detection ───────────────────────────────────────

export function validateAndSortDAG(nodes: DAGNodeDefinition[]): { valid: boolean; order: string[]; cycleError?: string } {
  const inDegree = new Map<string, number>();
  const graph = new Map<string, string[]>();

  for (const n of nodes) {
    inDegree.set(n.id, 0);
    graph.set(n.id, []);
  }

  for (const n of nodes) {
    for (const dep of n.dependsOn) {
      if (!graph.has(dep)) {
        return { valid: false, order: [], cycleError: `Node "${n.id}" depends on unknown node "${dep}".` };
      }
      graph.get(dep)!.push(n.id);
      inDegree.set(n.id, (inDegree.get(n.id) || 0) + 1);
    }
  }

  const queue: string[] = [];
  for (const [id, deg] of inDegree.entries()) {
    if (deg === 0) queue.push(id);
  }

  const order: string[] = [];
  while (queue.length > 0) {
    const curr = queue.shift()!;
    order.push(curr);

    const neighbors = graph.get(curr) || [];
    for (const neighbor of neighbors) {
      inDegree.set(neighbor, (inDegree.get(neighbor) || 0) - 1);
      if (inDegree.get(neighbor) === 0) {
        queue.push(neighbor);
      }
    }
  }

  if (order.length !== nodes.length) {
    return { valid: false, order: [], cycleError: 'Cycle detected in Workflow DAG dependencies.' };
  }

  return { valid: true, order };
}

// ─── Execution Engine ─────────────────────────────────────────────────────────

export async function createDAGWorkflow(input: {
  name: string;
  description?: string;
  nodes: DAGNodeDefinition[];
  input?: Record<string, unknown>;
}): Promise<DAGWorkflowExecution> {
  const sortCheck = validateAndSortDAG(input.nodes);
  if (!sortCheck.valid) {
    throw new Error(`DAG validation failed: ${sortCheck.cycleError}`);
  }

  await writeQueue.catch(() => undefined);

  const wfId = `dag_${Date.now()}_${randomUUID().slice(0, 6)}`;
  const now = new Date().toISOString();

  const nodeStates: Record<string, DAGNodeState> = {};
  for (const n of input.nodes) {
    nodeStates[n.id] = {
      ...n,
      status: 'pending',
    };
  }

  const wf: DAGWorkflowExecution = {
    id: wfId,
    name: input.name,
    description: input.description || '',
    status: 'pending',
    nodes: nodeStates,
    input: input.input || {},
    createdAt: now,
    updatedAt: now,
  };

  store.workflows[wfId] = wf;
  queueSave();

  appendAuditEvent({
    actor: 'dag-engine',
    workspace: 'AI-Ops',
    action: 'dag.created',
    target: wfId,
    risk: 'LOW',
    status: 'executed',
    summary: `DAG Workflow "${input.name}" created with ${input.nodes.length} nodes.`,
    evidence: { wfId, nodeCount: input.nodes.length },
  }).catch(() => undefined);

  return wf;
}

export async function advanceDAGWorkflow(workflowId: string): Promise<DAGWorkflowExecution> {
  await writeQueue.catch(() => undefined);
  const wf = store.workflows[workflowId];
  if (!wf) throw new Error(`DAG Workflow "${workflowId}" not found.`);

  if (['completed', 'failed', 'stopped'].includes(wf.status)) return wf;

  wf.status = 'running';
  wf.updatedAt = new Date().toISOString();

  const nodeValues = Object.values(wf.nodes);

  // Find ready nodes: status === 'pending' AND all dependsOn nodes have status === 'completed' or 'skipped'
  const readyNodes = nodeValues.filter((node) => {
    if (node.status !== 'pending') return false;
    return node.dependsOn.every((depId) => {
      const parent = wf.nodes[depId];
      return parent && (parent.status === 'completed' || parent.status === 'skipped');
    });
  });

  if (readyNodes.length === 0) {
    // Check terminal conditions
    const allDone = nodeValues.every((n) => ['completed', 'skipped', 'failed'].includes(n.status));
    if (allDone) {
      const anyFailed = nodeValues.some((n) => n.status === 'failed');
      wf.status = anyFailed ? 'failed' : 'completed';
      wf.completedAt = new Date().toISOString();
      wf.summary = `DAG workflow ${wf.status}: ${nodeValues.filter((n) => n.status === 'completed').length}/${nodeValues.length} nodes completed.`;
      queueSave();
    }
    return wf;
  }

  // Execute ready nodes in parallel
  await Promise.all(
    readyNodes.map(async (node) => {
      if (node.requiresApproval && node.status !== 'waiting_approval') {
        node.status = 'waiting_approval';
        wf.status = 'waiting_approval';
        emitTelemetryEvent({
          category: 'agent_runtime',
          eventType: 'dag_node_approval_required',
          source: `dag:${wf.id}:${node.id}`,
          summary: `DAG Node "${node.name}" requires founder approval.`,
        });
        return;
      }

      node.status = 'running';
      node.startedAt = new Date().toISOString();

      try {
        // Collect parent outputs for prompt context
        const parentOutputs = node.dependsOn
          .map((depId) => wf.nodes[depId]?.output)
          .filter(Boolean)
          .join('\n\n---\n\n');

        const role = getAgentRole(node.agentRole);
        const systemPrompt = role?.systemPrompt || `Bạn là ${node.agentRole} của LedgerFlow OS.`;
        const prompt = `${node.promptTemplate}\n\nContext từ các bước trước:\n${parentOutputs}\n\nInput params:\n${JSON.stringify(wf.input)}`;

        const res = await callAI(
          [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: prompt },
          ],
          { model: 'ai-assistant' }
        );

        node.output = (res.content || res.text || '').trim();
        node.status = 'completed';
        node.completedAt = new Date().toISOString();

        // Handle Node Condition
        if (node.condition) {
          const { field, operator, value, onTrue } = node.condition;
          const fieldValue = String(field === 'output' ? node.output : (wf.input[field] ?? ''));
          const met =
            operator === 'contains' ? fieldValue.includes(value || '') :
            operator === 'equals' ? fieldValue === value :
            operator === 'not_equals' ? fieldValue !== value : false;

          if (met) {
            if (onTrue === 'stop') {
              wf.status = 'stopped';
              wf.summary = `DAG stopped by condition on node "${node.name}".`;
            } else if (onTrue === 'skip_children') {
              // Skip child nodes depending on this node
              for (const child of nodeValues) {
                if (child.dependsOn.includes(node.id)) {
                  child.status = 'skipped';
                }
              }
            }
          }
        }
      } catch (err: any) {
        node.status = 'failed';
        node.error = err.message;
        node.completedAt = new Date().toISOString();
      }
    })
  );

  // Re-check terminal condition
  const updatedValues = Object.values(wf.nodes);
  const allDone = updatedValues.every((n) => ['completed', 'skipped', 'failed'].includes(n.status));
  if (allDone) {
    const anyFailed = updatedValues.some((n) => n.status === 'failed');
    wf.status = anyFailed ? 'failed' : 'completed';
    wf.completedAt = new Date().toISOString();
    wf.summary = `DAG workflow ${wf.status}: ${updatedValues.filter((n) => n.status === 'completed').length}/${updatedValues.length} nodes completed.`;
  }

  wf.updatedAt = new Date().toISOString();
  queueSave();
  return wf;
}

export function exportDAGMermaid(nodes: DAGNodeDefinition[]): string {
  const lines = ['flowchart TD'];
  for (const n of nodes) {
    lines.push(`    ${n.id}["${n.name} (${n.agentRole})"]`);
    for (const dep of n.dependsOn) {
      lines.push(`    ${dep} --> ${n.id}`);
    }
  }
  return lines.join('\n');
}

export async function getDAGWorkflow(id: string): Promise<DAGWorkflowExecution | null> {
  await writeQueue.catch(() => undefined);
  return store.workflows[id] || null;
}

export async function listDAGWorkflows(limit = 20): Promise<DAGWorkflowExecution[]> {
  await writeQueue.catch(() => undefined);
  return Object.values(store.workflows)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, limit);
}
