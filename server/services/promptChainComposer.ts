/**
 * promptChainComposer.ts
 * ============================================================
 * Prompt Chain Composer — chain prompts with branching,
 * conditional logic, merge, and parallel execution.
 *
 * Pattern: Prompt A → output → Prompt B → output → Prompt C
 * Supports: sequential, parallel, conditional, merge-at-end
 */
import { randomUUID } from 'node:crypto';
import { dispatchTextThroughFabric } from './aiFabric';
import { appendAuditEvent } from './auditLog';
import { recordUsage } from './costObservability';

// ─── Types ──────────────────────────────────────────────────────────
export type ChainNodeType = 'prompt' | 'condition' | 'parallel' | 'merge';

export interface ChainNode {
  id: string;
  name: string;
  type: ChainNodeType;
  prompt?: string;                 // For 'prompt' type
  condition?: string;               // JS expression evaluated against previousOutput
  trueBranch?: string[];            // Node IDs when condition=true
  falseBranch?: string[];           // Node IDs when condition=false
  parallelNodes?: string[];         // For 'parallel' type
  systemPrompt?: string;
  domain?: string;
  dependsOn?: string[];             // Node IDs this depends on
  temperature?: number;
  maxTokens?: number;
}

export interface ChainNodeResult {
  nodeId: string;
  nodeName: string;
  output: string;
  latencyMs: number;
  status: 'completed' | 'skipped' | 'failed' | 'condition_false';
  error?: string;
  tokensUsed: number;
  modelUsed: string;
}

export interface PromptChain {
  id: string;
  name: string;
  description: string;
  nodes: ChainNode[];
  edges: Array<{ from: string; to: string; label: string }>; // Visual edges
  version: number;
  createdAt: string;
  updatedAt: string;
}

export interface ChainExecutionRun {
  id: string;
  chainId: string;
  chainName: string;
  status: 'running' | 'completed' | 'failed';
  nodeResults: ChainNodeResult[];
  finalOutput: string;
  totalLatencyMs: number;
  totalCostUsd: number;
  startedAt: string;
  completedAt?: string;
  log: string[];
}

// ─── Storage ────────────────────────────────────────────────────────
import fs from 'fs';
import path from 'path';

const CHAINS_FILE = path.join(process.cwd(), 'prompt_chains.json');
const RUNS_FILE = path.join(process.cwd(), 'chain_runs.json');

let chains: PromptChain[] = [];
let execRuns: ChainExecutionRun[] = [];

async function loadAll(): Promise<void> {
  try {
    if (fs.existsSync(CHAINS_FILE)) chains = JSON.parse(await fs.promises.readFile(CHAINS_FILE, 'utf8'));
    if (fs.existsSync(RUNS_FILE)) execRuns = JSON.parse(await fs.promises.readFile(RUNS_FILE, 'utf8'));
  } catch { }
}
loadAll().catch(() => undefined);

async function saveChains(): Promise<void> {
  await fs.promises.writeFile(CHAINS_FILE, JSON.stringify(chains, null, 2), 'utf8');
}
async function saveRuns(): Promise<void> {
  await fs.promises.writeFile(RUNS_FILE, JSON.stringify(execRuns.slice(-50), null, 2), 'utf8');
}

// ─── Chain CRUD ─────────────────────────────────────────────────────

export function createChain(input: { name: string; description?: string; nodes?: ChainNode[] }): PromptChain {
  const chain: PromptChain = {
    id: `chain_${Date.now()}_${randomUUID().slice(0, 6)}`,
    name: input.name.slice(0, 100),
    description: input.description || '',
    nodes: input.nodes || [],
    edges: [],
    version: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  chains.push(chain);
  saveChains().catch(() => undefined);
  return chain;
}

export function addNode(chainId: string, node: Omit<ChainNode, 'id'>): ChainNode | undefined {
  const chain = chains.find(c => c.id === chainId);
  if (!chain) return undefined;

  const newNode: ChainNode = { ...node, id: `node_${Date.now()}_${randomUUID().slice(0, 4)}` };
  chain.nodes.push(newNode);
  chain.updatedAt = new Date().toISOString();
  saveChains().catch(() => undefined);
  return newNode;
}

export function updateNode(chainId: string, nodeId: string, patch: Partial<ChainNode>): boolean {
  const chain = chains.find(c => c.id === chainId);
  if (!chain) return false;
  const idx = chain.nodes.findIndex(n => n.id === nodeId);
  if (idx < 0) return false;
  chain.nodes[idx] = { ...chain.nodes[idx], ...patch };
  chain.updatedAt = new Date().toISOString();
  saveChains().catch(() => undefined);
  return true;
}

export function deleteNode(chainId: string, nodeId: string): boolean {
  const chain = chains.find(c => c.id === chainId);
  if (!chain) return false;
  const idx = chain.nodes.findIndex(n => n.id === nodeId);
  if (idx < 0) return false;
  chain.nodes.splice(idx, 1);
  // Clean up edges referencing this node
  chain.edges = chain.edges.filter(e => e.from !== nodeId && e.to !== nodeId);
  chain.updatedAt = new Date().toISOString();
  saveChains().catch(() => undefined);
  return true;
}

export function addEdge(chainId: string, from: string, to: string, label = ''): boolean {
  const chain = chains.find(c => c.id === chainId);
  if (!chain) return false;
  if (!chain.nodes.find(n => n.id === from) || !chain.nodes.find(n => n.id === to)) return false;
  if (chain.edges.find(e => e.from === from && e.to === to)) return true; // Already exists
  chain.edges.push({ from, to, label });
  chain.updatedAt = new Date().toISOString();
  saveChains().catch(() => undefined);
  return true;
}

export function getChain(id: string): PromptChain | undefined { return chains.find(c => c.id === id); }
export function listChains(): PromptChain[] { return [...chains].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()); }
export function deleteChain(id: string): boolean {
  const idx = chains.findIndex(c => c.id === id);
  if (idx < 0) return false;
  chains.splice(idx, 1);
  saveChains().catch(() => undefined);
  return true;
}

// ─── Chain Execution ────────────────────────────────────────────────

export async function executeChain(chainId: string, initialInput: string): Promise<ChainExecutionRun> {
  const chain = chains.find(c => c.id === chainId);
  if (!chain) throw new Error(`Chain "${chainId}" not found.`);

  const runId = `chainrun_${Date.now()}_${randomUUID().slice(0, 4)}`;
  const started = Date.now();
  const run: ChainExecutionRun = {
    id: runId, chainId: chain.id, chainName: chain.name,
    status: 'running', nodeResults: [], finalOutput: '',
    totalLatencyMs: 0, totalCostUsd: 0,
    startedAt: new Date().toISOString(), log: [],
  };

  run.log.push(`Starting chain "${chain.name}" with ${chain.nodes.length} nodes.`);

  // Build execution order from edges (topological sort)
  const executed = new Set<string>();
  const outputMap = new Map<string, string>(); // nodeId -> output

  try {
    // Process nodes in dependency order
    while (executed.size < chain.nodes.length) {
      const ready = chain.nodes.filter(n =>
        !executed.has(n.id) &&
        (n.dependsOn || []).every(d => executed.has(d))
      );

      if (ready.length === 0) {
        // Circular dependency or stuck
        run.log.push('WARNING: possible circular dependency detected.');
        break;
      }

      // Execute ready nodes (parallel if type=parallel)
      const sequentialNodes = ready.filter(n => n.type !== 'parallel');
      const parallelGroups = ready.filter(n => n.type === 'parallel');

      for (const node of sequentialNodes) {
        const result = await executeChainNode(node, chain, outputMap, initialInput);
        run.nodeResults.push(result);
        outputMap.set(node.id, result.output);
        run.totalCostUsd += 0.001;
        executed.add(node.id);
        run.log.push(`[${node.type}] ${node.name}: ${result.status} (${result.latencyMs}ms)`);
        if (result.status === 'failed') run.log.push(`  ERROR: ${result.error}`);
      }

      for (const group of parallelGroups) {
        if (group.parallelNodes && group.parallelNodes.length > 0) {
          run.log.push(`Parallel execution: ${group.parallelNodes.length} nodes`);
          const parallelResults = await Promise.all(
            group.parallelNodes.map(nid => {
              const n = chain.nodes.find(x => x.id === nid);
              return n ? executeChainNode(n, chain, outputMap, initialInput) : Promise.resolve(null as any);
            })
          );
          for (const r of parallelResults) {
            if (r) {
              run.nodeResults.push(r);
              outputMap.set(r.nodeId, r.output);
              run.totalCostUsd += 0.001;
              executed.add(r.nodeId);
              run.log.push(`  [parallel] ${r.nodeName}: ${r.status}`);
            }
          }
        }
        executed.add(group.id);
      }
    }

    run.status = 'completed';
    run.finalOutput = run.nodeResults[run.nodeResults.length - 1]?.output || initialInput;
    run.log.push(`Chain completed: ${run.nodeResults.filter(r => r.status === 'completed').length}/${chain.nodes.length} nodes successful.`);
  } catch (err: any) {
    run.status = 'failed';
    run.log.push(`CRASH: ${err.message}`);
    run.finalOutput = `Chain failed: ${err.message}`;
  } finally {
    run.totalLatencyMs = Date.now() - started;
    run.completedAt = new Date().toISOString();
    execRuns.push(run);
    saveRuns().catch(() => undefined);

    await appendAuditEvent({
      actor: 'system', workspace: 'Prompt Chain', action: 'chain.execute',
      target: chain.name, risk: 'MEDIUM',
      status: run.status === 'completed' ? 'executed' : 'failed',
      summary: `Chain "${chain.name}": ${run.status} in ${run.totalLatencyMs}ms`,
      connectorId: 'prompt-chain',
      evidence: { chainId, nodes: chain.nodes.length, results: run.nodeResults.length },
    }).catch(() => undefined);
  }

  return run;
}

async function executeChainNode(
  node: ChainNode,
  chain: PromptChain,
  outputMap: Map<string, string>,
  initialInput: string,
): Promise<ChainNodeResult> {
  const start = Date.now();

  try {
    switch (node.type) {
      case 'prompt': {
        // Build context from upstream nodes
        let context = '';
        for (const [nid, output] of outputMap) {
          if (node.dependsOn?.includes(nid)) {
            context += `\n[Output from "${chain.nodes.find(n => n.id === nid)?.name || nid}"]\n${output}\n`;
          }
        }
        const fullPrompt = `${node.prompt || initialInput}\n\n${context}`.trim();

        const result = await dispatchTextThroughFabric(
          fullPrompt,
          node.systemPrompt,
          { domain: (node.domain || 'general') as any, task: node.domain, localFallback: true }
        );

        return {
          nodeId: node.id, nodeName: node.name,
          output: result.winner?.contentPreview || '',
          latencyMs: Date.now() - start,
          status: result.status === 'completed' ? 'completed' : 'failed',
          tokensUsed: Math.ceil((result.winner?.contentPreview?.length || 0) / 4),
          modelUsed: result.modelUsed || 'fabric',
        };
      }

      case 'condition': {
        // Evaluate condition against previous node output
        const prevOutput = outputMap.get(node.dependsOn?.[0] || '') || initialInput;
        try {
          // Safe evaluation: only check if string contains a pattern
          const condLower = (node.condition || '').toLowerCase();
          const outputLower = prevOutput.toLowerCase();
          let conditionResult = false;

          if (condLower.startsWith('contains:')) {
            conditionResult = outputLower.includes(condLower.replace('contains:', '').trim().toLowerCase());
          } else if (condLower.startsWith('length>')) {
            conditionResult = prevOutput.length > parseInt(condLower.replace('length>', '').trim());
          } else if (condLower.startsWith('length<')) {
            conditionResult = prevOutput.length < parseInt(condLower.replace('length<', '').trim());
          } else {
            conditionResult = outputLower.includes(condLower);
          }

          return {
            nodeId: node.id, nodeName: node.name,
            output: conditionResult ? 'CONDITION_TRUE' : 'CONDITION_FALSE',
            latencyMs: Date.now() - start,
            status: conditionResult ? 'completed' : 'condition_false',
            tokensUsed: 0,
            modelUsed: 'system',
          };
        } catch {
          return {
            nodeId: node.id, nodeName: node.name,
            output: 'CONDITION_ERROR',
            latencyMs: 0,
            status: 'failed',
            error: 'Invalid condition expression.',
            tokensUsed: 0,
            modelUsed: 'system',
          };
        }
      }

      case 'merge': {
        // Merge outputs from multiple upstream nodes
        const outputs: string[] = [];
        for (const [nid, output] of outputMap) {
          if (node.dependsOn?.includes(nid)) {
            outputs.push(`[${chain.nodes.find(n => n.id === nid)?.name || nid}]:\n${output}`);
          }
        }
        return {
          nodeId: node.id, nodeName: node.name,
          output: outputs.join('\n\n---\n\n'),
          latencyMs: 0,
          status: 'completed',
          tokensUsed: 0,
          modelUsed: 'system',
        };
      }

      default:
        return {
          nodeId: node.id, nodeName: node.name,
          output: `Unknown node type: ${node.type}`,
          latencyMs: 0,
          status: 'failed',
          error: `Unknown type: ${node.type}`,
          tokensUsed: 0,
          modelUsed: 'system',
        };
    }
  } catch (err: any) {
    return {
      nodeId: node.id, nodeName: node.name,
      output: `Error: ${err.message}`,
      latencyMs: Date.now() - start,
      status: 'failed',
      error: err.message,
      tokensUsed: 0,
      modelUsed: 'error',
    };
  }
}

export function getChainRun(id: string): ChainExecutionRun | undefined {
  return execRuns.find(r => r.id === id);
}
export function listChainRuns(): ChainExecutionRun[] {
  return [...execRuns].reverse();
}
