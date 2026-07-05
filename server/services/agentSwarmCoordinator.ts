/**
 * agentSwarmCoordinator.ts
 * ============================================================
 * Agent Swarm Coordinator — phối hợp nhiều agents hoạt động
 * như một swarm: phân công task, merge kết quả, xử lý
 * conflict, và chọn output tốt nhất.
 *
 * Pattern: Coordinating agent dispatches to worker agents,
 * collects results, merges/selects best output.
 */
import { randomUUID } from 'node:crypto';
import { dispatchTextThroughFabric } from './aiFabric.ts';
import { appendAuditEvent } from './auditLog.ts';
import { recordUsage } from './costObservability.ts';
import { recordRuntimeCoreMission } from './agentRuntimeCore.ts';
import { agentToolContractsToSpecs } from './agentExecutionCore.ts';
import fs from 'fs';
import { ensureRuntimeRootSync, resolveRuntimePathFromEnv, resolveRuntimeReadPathFromEnv } from './runtimePaths.ts';

// ─── Types ──────────────────────────────────────────────────────────
export interface SwarmAgent {
  id: string;
  name: string;
  role: string;
  systemPrompt: string;
  specializations: string[];
  maxConcurrency: boolean;   // Can this agent run parallel with others?
}

export interface SwarmTask {
  id: string;
  title: string;
  description: string;
  assignedTo: string;         // Agent ID
  priority: number;
  dependencies: string[];     // Task IDs
}

export interface SwarmTaskResult {
  taskId: string;
  agentId: string;
  agentName: string;
  output: string;
  confidence: number;
  latencyMs: number;
  status: 'completed' | 'failed' | 'skipped';
  error?: string;
}

export interface SwarmMission {
  id: string;
  goal: string;
  domain: string;
  agents: SwarmAgent[];
  tasks: SwarmTask[];
  results: SwarmTaskResult[];
  mergedOutput: string;
  status: 'planning' | 'dispatching' | 'merging' | 'completed' | 'failed';
  summary: string;
  startedAt: string;
  completedAt?: string;
  totalLatencyMs: number;
  log: string[];
}

// ─── Default swarm agents ───────────────────────────────────────────
const DEFAULT_SWARM: SwarmAgent[] = [
  {
    id: 'swarm_planner', name: 'Planner', role: 'orchestrator',
    systemPrompt: 'Orchestrator — analyze the goal, break it into tasks, assign to the right specialists.',
    specializations: ['planning', 'delegation', 'integration'],
    maxConcurrency: false,
  },
  {
    id: 'swarm_coder', name: 'Coder', role: 'developer',
    systemPrompt: 'Developer — write clean, well-structured code with types and error handling.',
    specializations: ['coding', 'typescript', 'algorithms'],
    maxConcurrency: true,
  },
  {
    id: 'swarm_reviewer', name: 'Reviewer', role: 'reviewer',
    systemPrompt: 'Reviewer — check for bugs, security issues, edge cases, and code quality.',
    specializations: ['review', 'security', 'quality'],
    maxConcurrency: true,
  },
  {
    id: 'swarm_tester', name: 'Tester', role: 'tester',
    systemPrompt: 'Tester — write comprehensive tests covering edge cases.',
    specializations: ['testing', 'edge_cases', 'coverage'],
    maxConcurrency: true,
  },
  {
    id: 'swarm_docs', name: 'Documenter', role: 'documenter',
    systemPrompt: 'Documenter — write clear, concise documentation and usage examples.',
    specializations: ['documentation', 'examples', 'api_docs'],
    maxConcurrency: true,
  },
];

// ─── Storage ────────────────────────────────────────────────────────
const FILE = resolveRuntimePathFromEnv('SWARM_MISSIONS_FILE', 'swarm_missions.json');
let missions: SwarmMission[] = [];

async function load(): Promise<void> {
  try {
    const file = resolveRuntimeReadPathFromEnv('SWARM_MISSIONS_FILE', 'swarm_missions.json');
    if (fs.existsSync(file)) missions = JSON.parse(await fs.promises.readFile(file, 'utf8'));
  } catch { }
}
load().catch(() => undefined);

async function save(): Promise<void> {
  ensureRuntimeRootSync();
  await fs.promises.writeFile(FILE, JSON.stringify(missions.slice(-30), null, 2), 'utf8');
}

// ─── Core API ───────────────────────────────────────────────────────

export function getDefaultSwarm(): SwarmAgent[] { return [...DEFAULT_SWARM]; }

export async function launchSwarm(
  goal: string,
  options: {
    domain?: string;
    agents?: SwarmAgent[];
    maxAgents?: number;
  } = {}
): Promise<SwarmMission> {
  const missionId = `swarm_${Date.now()}_${randomUUID().slice(0, 6)}`;
  const started = Date.now();
  const agents = (options.agents || DEFAULT_SWARM).slice(0, options.maxAgents || 5);

  const mission: SwarmMission = {
    id: missionId, goal, domain: options.domain || 'general',
    agents, tasks: [], results: [],
    mergedOutput: '', status: 'planning',
    summary: '', startedAt: new Date().toISOString(),
    totalLatencyMs: 0, log: [],
  };

  missions.push(mission);
  mission.log.push(`Swarm launched: "${goal.slice(0, 80)}" with ${agents.length} agents.`);

  try {
    // Phase 1: Planner decomposes goal into tasks
    mission.status = 'planning';
    mission.log.push('Phase 1: Planning...');

    const planPrompt = `Decompose this goal into 3-5 tasks and assign each to a specialist.

GOAL: ${goal}

SPECIALISTS:
${agents.map(a => `- ${a.name} (${a.role}): ${a.specializations.join(', ')}`).join('\n')}

Return format (one task per line):
TASK: [title] | assigned_to: [agent_name] | priority: [1-5] | depends_on: [task_titles,comma,separated]
DESCRIPTION: [1-2 sentences]`;

    let planText: string;
    try {
      const planResult = await dispatchTextThroughFabric(
        planPrompt, undefined,
        { domain: (options.domain || 'general') as any, localFallback: true }
      );
      planText = planResult.winner?.contentPreview || '';
    } catch {
      // Heuristic fallback plan
      planText = '';
      for (let i = 0; i < Math.min(agents.length, 4); i++) {
        const agent = agents[i + 1] || agents[0];
        planText += `TASK: Task ${i + 1} | assigned_to: ${agent.name} | priority: ${i + 1} | depends_on: \n`;
        planText += `DESCRIPTION: Handle "${goal.slice(0, 80)}" from ${agent.role} perspective.\n`;
      }
    }

    const taskLines = planText.split('\n').filter(l => l.toUpperCase().startsWith('TASK:'));
    for (let i = 0; i < taskLines.length; i++) {
      const line = taskLines[i];
      const descLine = taskLines[i + 1]?.replace(/^DESCRIPTION:\s*/i, '').trim() || '';

      const parts = line.replace(/^TASK:\s*/i, '').split('|').map(s => s.trim());
      const title = parts[0] || `Task ${i + 1}`;

      const assignedMatch = parts.find(p => p.startsWith('assigned_to:'))?.replace('assigned_to:', '').trim();
      const priorityMatch = parts.find(p => p.startsWith('priority:'))?.replace('priority:', '').trim();
      const depsMatch = parts.find(p => p.startsWith('depends_on:'))?.replace('depends_on:', '').trim();

      const agent = agents.find(a => a.name === assignedMatch) || agents[i + 1] || agents[0];

      mission.tasks.push({
        id: `task_${Date.now()}_${i}`,
        title, description: descLine,
        assignedTo: agent.id,
        priority: parseInt(priorityMatch || `${i + 1}`),
        dependencies: depsMatch ? depsMatch.split(',').map(s => s.trim()).filter(Boolean) : [],
      });
    }

    mission.log.push(`  Plan: ${mission.tasks.length} tasks defined.`);

    // Phase 2: Dispatch tasks (respect dependencies)
    mission.status = 'dispatching';
    mission.log.push('Phase 2: Dispatching...');

    const completed = new Set<string>();
    const outputMap = new Map<string, string>();

    while (completed.size < mission.tasks.length) {
      const ready = mission.tasks.filter(t =>
        !completed.has(t.id) &&
        t.dependencies.every(d =>
          mission.tasks.some(ot => ot.title === d && completed.has(ot.id))
        )
      );

      if (ready.length === 0 && completed.size < mission.tasks.length) {
        mission.log.push('WARNING: Deadlock in task dependencies, executing remaining.');
        for (const t of mission.tasks.filter(t => !completed.has(t.id))) {
          ready.push(t);
        }
        if (ready.length === 0) break;
      }

      // Group tasks by agent
      for (const task of ready) {
        const agent = agents.find(a => a.id === task.assignedTo);
        if (!agent) {
          mission.results.push({
            taskId: task.id, agentId: task.assignedTo, agentName: 'unknown',
            output: 'Agent not found.', confidence: 0, latencyMs: 0,
            status: 'failed', error: 'Agent not assigned.',
          });
          completed.add(task.id);
          continue;
        }

        const tStart = Date.now();

        // Build context from dependencies
        let context = '';
        for (const depTitle of task.dependencies) {
          const depTask = mission.tasks.find(t => t.title === depTitle);
          if (depTask) {
            const depOutput = outputMap.get(depTask.id);
            if (depOutput) context += `\n[From "${depTask.title}"]\n${depOutput}\n`;
          }
        }

        const agentPrompt = `Task: ${task.title}\n\n${task.description}\n${context}\n\nOriginal goal: ${goal}\n\nComplete this task as a ${agent.role}.`;

        try {
          const result = await dispatchTextThroughFabric(
            agentPrompt, agent.systemPrompt,
            { 
              domain: (options.domain || 'general') as any, 
              localFallback: true,
              tools: agentToolContractsToSpecs(),
              toolChoice: 'auto',
            }
          );

          const res: SwarmTaskResult = {
            taskId: task.id, agentId: agent.id, agentName: agent.name,
            output: result.winner?.contentPreview || '',
            confidence: result.status === 'completed' ? 0.85 : 0.3,
            latencyMs: Date.now() - tStart,
            status: result.status === 'completed' ? 'completed' : 'failed',
          };

          mission.results.push(res);
          outputMap.set(task.id, res.output);
          mission.log.push(`  [${res.status}] ${agent.name}: ${task.title} (${res.latencyMs}ms)`);
        } catch (err: any) {
          mission.results.push({
            taskId: task.id, agentId: agent.id, agentName: agent.name,
            output: `Error: ${err.message}`, confidence: 0,
            latencyMs: Date.now() - tStart,
            status: 'failed', error: err.message,
          });
          mission.log.push(`  [failed] ${agent.name}: ${task.title}`);
        }

        completed.add(task.id);
      }
    }

    // Phase 3: Merge results
    mission.status = 'merging';
    mission.log.push('Phase 3: Merging results...');

    const mergePrompt = `Merge these task results into one coherent output for the original goal.

GOAL: ${goal}

TASK RESULTS:
${mission.results.filter(r => r.status === 'completed').map(r => `### ${r.agentName}: ${mission.tasks.find(t => t.id === r.taskId)?.title}\n${r.output.slice(0, 400)}`).join('\n\n')}

Produce a well-structured, comprehensive final answer. Include code if applicable.`;

    try {
      const mergedResult = await dispatchTextThroughFabric(
        mergePrompt, undefined,
        { domain: (options.domain || 'general') as any, localFallback: true }
      );
      mission.mergedOutput = mergedResult.winner?.contentPreview || 'Unable to merge results.';
    } catch {
      // Fallback: concatenate all results
      mission.mergedOutput = mission.results
        .filter(r => r.status === 'completed')
        .map(r => `### ${r.agentName}\n${r.output}`)
        .join('\n\n---\n\n');
    }

    mission.status = 'completed';
    mission.summary = `${mission.results.filter(r => r.status === 'completed').length}/${mission.tasks.length} tasks completed by ${agents.length} agents.`;
    mission.log.push(`Swarm completed: ${mission.summary}`);

  } catch (err: any) {
    mission.status = 'failed';
    mission.log.push(`CRASH: ${err.message}`);
  } finally {
    mission.totalLatencyMs = Date.now() - started;
    mission.completedAt = new Date().toISOString();

    await appendAuditEvent({
      actor: 'system', workspace: 'Agent Swarm', action: 'swarm.complete',
      target: goal.slice(0, 80), risk: 'MEDIUM', status: mission.status === 'completed' ? 'executed' : 'failed',
      summary: `Swarm: ${mission.results.length} results from ${mission.agents.length} agents, status=${mission.status}`,
      connectorId: 'agent-swarm',
      evidence: { missionId, agents: mission.agents.length, tasks: mission.tasks.length, status: mission.status },
    }).catch(() => undefined);

    await recordRuntimeCoreMission({
      source: 'agent_swarm_coordinator',
      missionId: mission.id,
      goal: mission.goal,
      domain: mission.domain,
      status: mission.status === 'failed' ? 'failed' : 'completed',
      createdAt: mission.startedAt,
      updatedAt: mission.completedAt,
      completedAt: mission.completedAt,
      summary: mission.summary,
      stepCount: mission.tasks.length,
      completedStepCount: mission.results.filter((result) => result.status === 'completed').length,
      failedStepCount: mission.results.filter((result) => result.status === 'failed' || result.status === 'skipped').length,
      waitingApprovalCount: undefined,
      totalDurationMs: mission.totalLatencyMs,
      metadata: {
        agentCount: mission.agents.length,
        resultCount: mission.results.length,
        taskAgents: mission.tasks.map((task) => task.assignedTo),
      },
    }).catch(() => undefined);

    save().catch(() => undefined);
  }

  return mission;
}

export function getSwarmMission(id: string): SwarmMission | undefined {
  return missions.find(m => m.id === id);
}

export function listSwarmMissions(): SwarmMission[] {
  return [...missions].reverse();
}
