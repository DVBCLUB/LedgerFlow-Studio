import { randomUUID } from 'node:crypto';
import { dispatchTextThroughFabric, type FabricRun } from './aiFabric.ts';
import { recordObservation } from './compoundMemory.ts';
import { executeInSandbox, type SandboxResult } from './sandboxCodeExecutor.ts';
import { searchAgentMemory } from './agentMemoryStore.ts';
import { executeSandboxTool } from './sandboxToolExecutor.ts';
import { getAgentToolContract, listAgentToolContracts } from './agentToolRegistry.ts';
import { isAgentToolId } from './agentToolIds.ts';
import type { AgentToolId } from './agentPlanner.ts';
import type { ToolSpec } from './aiClient.ts';

export type AgentExecutionLoopStatus = 'planning' | 'executing' | 'observing' | 'replanning' | 'completed' | 'failed' | 'stopped';

export interface AgentExecutionLoopStep {
  id: string;
  index: number;
  phase: AgentExecutionLoopStatus;
  goal: string;
  plan: string;
  result?: FabricRun;
  observation: {
    success: boolean;
    summary: string;
    error?: string;
    evidence?: Record<string, unknown>;
    filesChanged?: string[];
    testsPassed?: boolean;
  };
  repairAttempts: number;
  startedAt: string;
  completedAt?: string;
  durationMs: number;
}

export interface AgentExecutionLoopRun {
  id: string;
  goal: string;
  domain: string;
  plan: string[];
  maxRepairAttempts: number;
  steps: AgentExecutionLoopStep[];
  updatedAt: string;
}

export interface AgentExecutionLoopOptions {
  webPlatform?: string;
  profileId?: string;
  filePaths?: string[];
  testCommand?: string;
}

function agentToolContractsToSpecs(): ToolSpec[] {
  return listAgentToolContracts().map((tool) => ({
    name: tool.id,
    description: `${tool.description} Permission: ${tool.permission}. Risk: ${tool.risk}. Requires approval: ${tool.requiresApproval ? 'yes' : 'no'}.`,
    parameters: {
      type: 'object',
      properties: {
        goal: {
          type: 'string',
          description: 'The concrete subtask or evidence request for this tool.',
        },
        input: {
          type: 'object',
          description: 'Optional structured input for the tool.',
          additionalProperties: true,
        },
      },
      required: ['goal'],
      additionalProperties: true,
    },
  }));
}

async function resolveNativeToolCalls(
  run: AgentExecutionLoopRun,
  step: AgentExecutionLoopStep,
): Promise<void> {
  const toolCalls = step.result?.winner?.toolCalls || [];
  if (!toolCalls.length) return;

  const executed: Array<Record<string, unknown>> = [];
  for (const call of toolCalls.slice(0, 3)) {
    const contract = getAgentToolContract(call.name);
    if (!contract || !isAgentToolId(call.name)) {
      executed.push({ id: call.id, tool: call.name, skipped: true, reason: 'Tool is not registered in the agent tool registry.' });
      continue;
    }
    if (contract.requiresApproval) {
      executed.push({ id: call.id, tool: call.name, skipped: true, requiresApproval: true, risk: contract.risk });
      continue;
    }

    const goal = typeof call.args.goal === 'string' && call.args.goal.trim()
      ? call.args.goal.trim()
      : step.goal;
    const toolInput = call.args.input && typeof call.args.input === 'object' && !Array.isArray(call.args.input)
      ? call.args.input as Record<string, unknown>
      : call.args;
    const controlled = await executeControlledAgentStep({
      runId: run.id,
      stepId: step.id,
      toolId: call.name,
      goal,
      toolInput,
    });
    executed.push({ id: call.id, tool: call.name, observation: controlled.observation, result: controlled.result });
  }

  step.observation.evidence = {
    ...(step.observation.evidence || {}),
    nativeToolCalls: toolCalls.map((call) => ({ id: call.id, name: call.name, args: call.args })),
    controlledToolExecutions: executed,
  };
  if (executed.length > 0) {
    step.observation.summary = `${step.observation.summary}\nTool evidence: ${executed.map((item) => `${item.tool}${item.skipped ? ':skipped' : ':executed'}`).join(', ')}`.trim();
  }
}

export async function executeLoopStep(
  run: AgentExecutionLoopRun,
  stepGoal: string,
  index: number,
  options: AgentExecutionLoopOptions,
): Promise<AgentExecutionLoopStep> {
  const step: AgentExecutionLoopStep = {
    id: randomUUID(),
    index,
    phase: 'executing',
    goal: stepGoal,
    plan: run.plan.join(' -> '),
    observation: { success: false, summary: '' },
    repairAttempts: 0,
    startedAt: new Date().toISOString(),
    durationMs: 0,
  };

  const stepStart = Date.now();

  try {
    const result = await dispatchTextThroughFabric(
      `Step ${index + 1}/${run.plan.length}: ${stepGoal}\n\nOverall goal: ${run.goal}`,
      undefined,
      {
        domain: run.domain as any,
        task: run.domain,
        webPlatform: options.webPlatform,
        profileId: options.profileId,
        localFallback: true,
        filePath: options.filePaths?.[0],
        tools: agentToolContractsToSpecs(),
        toolChoice: 'auto',
      },
    );

    step.result = result;
    step.durationMs = Date.now() - stepStart;
    step.completedAt = new Date().toISOString();

    if (result.status === 'completed') {
      step.observation = {
        success: true,
        summary: result.winner?.contentPreview?.slice(0, 300) || 'Step completed.',
        evidence: {
          modelUsed: result.modelUsed,
          route: result.winner?.route,
          steps: result.steps.length,
          latencyMs: result.totalLatencyMs,
        },
      };

      await resolveNativeToolCalls(run, step);

      recordObservation(
        run.domain,
        `Step ${index + 1}: ${stepGoal.slice(0, 80)}`,
        step.observation.summary,
        0.75,
        `agentic-loop:${run.id}:step:${index}`,
        true,
      ).catch(() => undefined);
    } else {
      step.observation = {
        success: false,
        summary: 'AI Fabric failed to complete this step.',
        error: `All routes exhausted. Steps: ${result.steps.map(s => `${s.route}=${s.status}`).join(', ')}`,
      };

      recordObservation(
        run.domain,
        `FAILED Step ${index + 1}: ${stepGoal.slice(0, 80)}`,
        step.observation.error || 'Fabric exhausted',
        0.3,
        `agentic-loop:${run.id}:step:${index}`,
        false,
      ).catch(() => undefined);
    }
  } catch (err: any) {
    step.durationMs = Date.now() - stepStart;
    step.completedAt = new Date().toISOString();
    step.observation = {
      success: false,
      summary: 'Step execution threw an exception.',
      error: err.message?.slice(0, 300),
    };

    recordObservation(
      run.domain,
      `CRASH Step ${index + 1}`,
      err.message?.slice(0, 300) || 'Unknown',
      0.1,
      `agentic-loop:${run.id}:step:${index}`,
      false,
    ).catch(() => undefined);
  }

  run.steps.push(step);
  run.updatedAt = new Date().toISOString();
  return step;
}

export async function runSandboxVerification(
  sandboxId: string,
  testCommand: string,
): Promise<SandboxResult> {
  return executeInSandbox(sandboxId, testCommand).catch(err => ({
    ok: false, exitCode: -1, stdout: '', stderr: err.message,
    durationMs: 0, command: testCommand, mode: 'local',
  }));
}

export async function attemptRepair(
  run: AgentExecutionLoopRun,
  failedStep: AgentExecutionLoopStep,
  options: AgentExecutionLoopOptions,
  sandboxId?: string,
): Promise<boolean> {
  const attempt = failedStep.repairAttempts + 1;
  failedStep.repairAttempts = attempt;
  failedStep.phase = 'replanning';

  const sandboxError = failedStep.observation.evidence?.sandboxOutput as string || '';
  const repairGoal = `REPAIR (attempt ${attempt}/${run.maxRepairAttempts}): ${failedStep.goal}\n\nERROR: ${failedStep.observation.error || 'Unknown error'}\n${sandboxError ? 'SANDBOX OUTPUT:\n' + sandboxError : ''}\n\nPropose the concrete repair.`;

  try {
    const result = await dispatchTextThroughFabric(
      repairGoal,
      undefined,
      { domain: run.domain as any, task: 'coding', localFallback: true },
    );

    if (result.status === 'completed') {
      let testsPassed = false;
      let sandboxExitCode = -1;
      if (sandboxId && options.testCommand) {
        const testResult = await runSandboxVerification(sandboxId, options.testCommand);
        testsPassed = testResult.ok;
        sandboxExitCode = testResult.exitCode;
      }

      failedStep.observation = {
        success: true,
        summary: `Repaired after ${attempt} attempt(s): ${result.winner?.contentPreview?.slice(0, 200)}`,
        evidence: {
          modelUsed: result.modelUsed,
          repairAttempt: attempt,
          sandboxTest: testsPassed,
          sandboxExitCode,
        },
        testsPassed,
      };

      recordObservation(
        run.domain,
        `REPAIRED Step: ${failedStep.goal.slice(0, 80)}`,
        `Repaired in ${attempt} attempt(s). Test: ${testsPassed ? 'PASS' : 'FAIL'}`,
        testsPassed ? 0.7 : 0.4,
        `agentic-loop:${run.id}:repair`,
        testsPassed,
      ).catch(() => undefined);

      return true;
    }

    return false;
  } catch {
    return false;
  }
}

export async function executeControlledAgentStep(input: {
  runId: string;
  stepId: string;
  toolId: AgentToolId;
  goal: string;
  toolInput?: Record<string, unknown>;
}): Promise<{ result: Record<string, unknown>; observation: string }> {
  let result: Record<string, unknown>;
  if (input.toolId === 'read_knowledge') {
    const memories = await searchAgentMemory(input.goal, { limit: 5 });
    result = { action: input.toolId, mode: 'retrieval', citations: memories.map((item) => item.citation), memories };
  } else if (input.toolId === 'external_connector') {
    result = { action: input.toolId, mode: 'connector_preview', blocked: true, reason: 'A separately scoped connector approval is required.' };
  } else {
    result = await executeSandboxTool({
      runId: input.runId,
      stepId: input.stepId,
      toolId: input.toolId,
      goal: input.goal,
      toolInput: input.toolInput,
    });
  }

  return {
    result,
    observation: `${input.toolId} completed with inspectable ${String(result.mode || 'sandbox')} evidence.`,
  };
}
