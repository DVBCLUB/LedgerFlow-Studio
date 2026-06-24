/**
 * toolUseRouter.ts
 * ============================================================
 * Tool-Use Router — agent tự chọn và gọi tool phù hợp
 * dựa trên ngữ cảnh task. Pattern: OpenAI function calling style
 * nhưng hoạt động với mọi model thông qua prompt engineering.
 *
 * Agent receives: task + available tools → AI selects tool →
 * execute tool → return result to agent → continue or finish.
 */
import { randomUUID } from 'node:crypto';
import { dispatchTextThroughFabric } from './aiFabric';
import { appendAuditEvent } from './auditLog';
import { recordUsage } from './costObservability';
import { searchCodebase } from './localSearchService';
import { searchMemory } from './compoundMemory';
import { searchKnowledgeGraph } from './knowledgeGraph';
import fs from 'fs';
import path from 'path';

// ─── Types ──────────────────────────────────────────────────────────
export interface ToolDefinition {
  name: string;
  description: string;
  category: 'file' | 'search' | 'code' | 'system' | 'external';
  parameters: Record<string, { type: string; description: string; required?: boolean }>;
  execute: (params: Record<string, string>) => Promise<string>;
  requireConfirmation: boolean;
}

export interface ToolCall {
  id: string;
  toolName: string;
  params: Record<string, string>;
  status: 'pending' | 'executing' | 'completed' | 'failed';
  result?: string;
  error?: string;
  latencyMs: number;
}

export interface ToolUseSession {
  id: string;
  task: string;
  domain: string;
  availableTools: string[];
  toolCalls: ToolCall[];
  status: 'thinking' | 'calling_tool' | 'completed' | 'failed';
  finalAnswer: string;
  maxToolCalls: number;
  startedAt: string;
  completedAt?: string;
  totalLatencyMs: number;
  log: string[];
}

// ─── Tool Registry ──────────────────────────────────────────────────
const toolRegistry = new Map<string, ToolDefinition>();

function registerDefaultTools(): void {
  // ── File Tools ──
  toolRegistry.set('read_file', {
    name: 'read_file', description: 'Read a file from the filesystem',
    category: 'file',
    parameters: { filePath: { type: 'string', description: 'Absolute path to the file', required: true } },
    execute: async (params) => {
      try { return await fs.promises.readFile(params.filePath, 'utf8'); }
      catch { return `Error: cannot read ${params.filePath}`; }
    },
    requireConfirmation: false,
  });

  toolRegistry.set('write_file', {
    name: 'write_file', description: 'Write content to a file (creates or overwrites)',
    category: 'file',
    parameters: {
      filePath: { type: 'string', description: 'Absolute path to write to', required: true },
      content: { type: 'string', description: 'Content to write', required: true },
    },
    execute: async (params) => {
      try { await fs.promises.writeFile(params.filePath, params.content, 'utf8'); return `File written: ${params.filePath}`; }
      catch (err: any) { return `Error: ${err.message}`; }
    },
    requireConfirmation: true,
  });

  toolRegistry.set('list_dir', {
    name: 'list_dir', description: 'List files in a directory',
    category: 'file',
    parameters: { dirPath: { type: 'string', description: 'Directory path', required: true } },
    execute: async (params) => {
      try { const files = await fs.promises.readdir(params.dirPath); return files.join('\n'); }
      catch { return `Error: cannot list ${params.dirPath}`; }
    },
    requireConfirmation: false,
  });

  // ── Search Tools ──
  toolRegistry.set('search_code', {
    name: 'search_code', description: 'Search codebase for a pattern',
    category: 'search',
    parameters: { query: { type: 'string', description: 'Search query', required: true } },
    execute: async (params) => {
      try {
        const results = await searchCodebase(params.query, 10);
        return results.map(r => `${r.relativePath} (score: ${r.score.toFixed(1)}): ${r.snippet?.slice(0, 100)}`).join('\n');
      } catch { return 'Search failed.'; }
    },
    requireConfirmation: false,
  });

  toolRegistry.set('search_memory', {
    name: 'search_memory', description: 'Search AI memory for past experience',
    category: 'search',
    parameters: { query: { type: 'string', description: 'What to search for', required: true } },
    execute: async (params) => {
      try {
        const mems = await searchMemory(params.query, { limit: 5 });
        return mems.map(m => `- ${m.title} (${m.domain}, conf:${(m.confidence * 100).toFixed(0)}%): ${m.content.slice(0, 150)}`).join('\n');
      } catch { return 'Memory search unavailable.'; }
    },
    requireConfirmation: false,
  });

  toolRegistry.set('search_graph', {
    name: 'search_graph', description: 'Search knowledge graph for connected concepts',
    category: 'search',
    parameters: { query: { type: 'string', description: 'Concept to search', required: true } },
    execute: async (params) => {
      const results = searchKnowledgeGraph(params.query, { maxResults: 5 });
      return results.map(r => `- ${r.node.label} (${r.node.type}, ${r.relations.length} rels)`).join('\n') || 'No results.';
    },
    requireConfirmation: false,
  });

  // ── Code Tools ──
  toolRegistry.set('run_lint', {
    name: 'run_lint', description: 'Run linter on a file or project',
    category: 'code',
    parameters: { filePath: { type: 'string', description: 'File or directory to lint (default: current dir)', required: false } },
    execute: async (params) => {
      return `Lint simulation: Would run lint on ${params.filePath || 'current project'}.`;
    },
    requireConfirmation: false,
  });

  toolRegistry.set('calculate', {
    name: 'calculate', description: 'Perform a mathematical calculation',
    category: 'code',
    parameters: { expression: { type: 'string', description: 'Math expression to evaluate', required: true } },
    execute: async (params) => {
      try { return String(Function(`"use strict"; return (${params.expression})`)()); }
      catch { return `Error evaluating: ${params.expression}`; }
    },
    requireConfirmation: false,
  });

  // ── System Tools ──
  toolRegistry.set('get_system_info', {
    name: 'get_system_info', description: 'Get system information (OS, node version, memory)',
    category: 'system',
    parameters: {},
    execute: async () => {
      return `OS: ${process.platform}, Node: ${process.version}, Arch: ${process.arch}, Memory: ${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(1)}MB`;
    },
    requireConfirmation: false,
  });

  toolRegistry.set('get_time', {
    name: 'get_time', description: 'Get current date and time',
    category: 'system',
    parameters: {},
    execute: async () => `Current time: ${new Date().toISOString()}`,
    requireConfirmation: false,
  });
}

// ─── Init ───────────────────────────────────────────────────────────
let initialized = false;
function ensureInit(): void { if (!initialized) { registerDefaultTools(); initialized = true; } }

// ─── Core API ───────────────────────────────────────────────────────

export function getToolDefinitions(): ToolDefinition[] {
  ensureInit();
  return Array.from(toolRegistry.values());
}

export async function executeWithTools(
  task: string,
  options: {
    domain?: string;
    tools?: string[];
    maxToolCalls?: number;
    requireConfirmFor?: string[];
  } = {}
): Promise<ToolUseSession> {
  ensureInit();
  const sessionId = `tool_${Date.now()}_${randomUUID().slice(0, 6)}`;
  const started = Date.now();
  const maxToolCalls = Math.min(options.maxToolCalls || 10, 20);
  const toolNames = options.tools || Array.from(toolRegistry.keys());

  const session: ToolUseSession = {
    id: sessionId, task, domain: options.domain || 'general',
    availableTools: toolNames, toolCalls: [],
    status: 'thinking', finalAnswer: '', maxToolCalls,
    startedAt: new Date().toISOString(), totalLatencyMs: 0, log: [],
  };

  session.log.push(`Tool session started. Task: "${task.slice(0, 100)}"`);
  session.log.push(`Available tools: ${toolNames.join(', ')}`);

  try {
    let currentContext = task;
    let toolCallCount = 0;

    while (toolCallCount < maxToolCalls) {
      session.status = 'thinking';

      // Ask AI: do you need a tool, or is the answer ready?
      const toolSelectionPrompt = buildToolSelectionPrompt(currentContext, toolNames, session);

      const selection = await dispatchTextThroughFabric(
        toolSelectionPrompt, undefined,
        { domain: (options.domain || 'general') as any, localFallback: true }
      );

      const responseText = selection.winner?.contentPreview || '';

      // Check if AI wants to use a tool
      const toolCallMatch = responseText.match(/TOOL:\s*(\w+)\s*\nARGS:\s*(\{[\s\S]*?\})/i);
      const doneMatch = responseText.match(/ANSWER:\s*([\s\S]*)/i);

      if (doneMatch && !toolCallMatch) {
        session.finalAnswer = doneMatch[1].trim();
        session.log.push(`Agent finished. Answer: ${session.finalAnswer.slice(0, 100)}...`);
        break;
      }

      if (toolCallMatch) {
        const toolName = toolCallMatch[1].trim();
        let params: Record<string, string> = {};

        try {
          params = JSON.parse(toolCallMatch[2]);
        } catch {
          // Try key=value parsing
          const kvPairs = toolCallMatch[2].replace(/[{}]/g, '').split(',').map(s => s.trim());
          for (const kv of kvPairs) {
            const [k, ...v] = kv.split('=');
            if (k) params[k.trim()] = v.join('=').trim().replace(/^['"]|['"]$/g, '');
          }
        }

        const tool = toolRegistry.get(toolName);
        if (!tool) {
          currentContext += `\n\n[Tool "${toolName}" not found. Available: ${toolNames.join(', ')}]`;
          session.log.push(`ERROR: Tool "${toolName}" not found.`);
          continue;
        }

        // Check confirmation
        if (tool.requireConfirmation && options.requireConfirmFor?.includes(toolName)) {
          currentContext += `\n\n[Tool "${toolName}" requires user confirmation. Skipped.]`;
          session.log.push(`SKIP: "${toolName}" requires confirmation.`);
          continue;
        }

        // Execute tool
        session.status = 'calling_tool';
        const tcStart = Date.now();
        session.log.push(`Calling tool: ${toolName}(${JSON.stringify(params).slice(0, 80)})`);

        try {
          const result = await tool.execute(params);
          const tc: ToolCall = {
            id: `tc_${Date.now()}_${randomUUID().slice(0, 4)}`,
            toolName, params,
            status: 'completed', result,
            latencyMs: Date.now() - tcStart,
          };
          session.toolCalls.push(tc);
          currentContext += `\n\n[Tool result from ${toolName}]\n${result}`;
          session.log.push(`  Result: ${result.slice(0, 100)}...`);
          toolCallCount++;
        } catch (err: any) {
          const tc: ToolCall = {
            id: `tc_${Date.now()}_${randomUUID().slice(0, 4)}`,
            toolName, params,
            status: 'failed', error: err.message,
            latencyMs: Date.now() - tcStart,
          };
          session.toolCalls.push(tc);
          currentContext += `\n\n[Tool "${toolName}" failed: ${err.message}]`;
          session.log.push(`  FAILED: ${err.message}`);
          toolCallCount++;
        }
      } else {
        // No clear tool call or answer - ask again
        currentContext += `\n\n[Please respond with TOOL: or ANSWER: format]`;
        toolCallCount++;
      }
    }

    if (!session.finalAnswer && toolCallCount >= maxToolCalls) {
      // Force final answer
      const finalPrompt = `Based on the tools you've used, provide your final answer:\n\n${currentContext.slice(-3000)}\n\nFinal answer:`;
      const finalResult = await dispatchTextThroughFabric(finalPrompt, undefined, { domain: 'general' as any, localFallback: true });
      session.finalAnswer = finalResult.winner?.contentPreview || 'Unable to complete task.';
      session.log.push(`Forced final answer after ${toolCallCount} tool calls.`);
    }

    session.status = 'completed';
  } catch (err: any) {
    session.status = 'failed';
    session.finalAnswer = `Session failed: ${err.message}`;
    session.log.push(`CRASH: ${err.message}`);
  } finally {
    session.totalLatencyMs = Date.now() - started;
    session.completedAt = new Date().toISOString();

    await appendAuditEvent({
      actor: 'system', workspace: 'Tool Router', action: 'tool_use.complete',
      target: task.slice(0, 80), risk: 'LOW', status: 'executed',
      summary: `Tool session: ${session.toolCalls.length} tool calls, status=${session.status}`,
      connectorId: 'tool-router',
      evidence: { sessionId, tools: session.toolCalls.length, status: session.status },
    }).catch(() => undefined);
  }

  return session;
}

function buildToolSelectionPrompt(
  context: string,
  toolNames: string[],
  session: ToolUseSession,
): string {
  ensureInit();
  let prompt = `You are an AI with access to tools. Decide: use a tool OR provide final answer.

TASK: ${session.task}

CONTEXT:
${context.slice(-3000)}

AVAILABLE TOOLS:
`;

  for (const name of toolNames) {
    const tool = toolRegistry.get(name);
    if (tool) {
      const params = Object.entries(tool.parameters)
        .map(([k, v]) => `  - ${k} (${v.type}): ${v.description}${v.required ? ' [REQUIRED]' : ''}`)
        .join('\n');
      prompt += `\n${name}: ${tool.description}\n${params}\n`;
    }
  }

  prompt += `
FORMAT:
- To use a tool: TOOL: tool_name
ARGS: {"param1": "value1", "param2": "value2"}

- To give final answer: ANSWER: [your complete response here]

What do you want to do?`;

  return prompt;
}
