import { z } from 'zod';
import { AGENT_TOOL_IDS, type AgentToolId } from './agentToolIds.ts';

const planSchema = z.object({
  summary: z.string().min(3).max(1_000),
  steps: z.array(z.object({
    toolId: z.enum(AGENT_TOOL_IDS),
    title: z.string().min(3).max(500),
    successCriteria: z.string().min(3).max(1_000),
  })).min(1).max(12),
});

export type { AgentToolId };
export type AgentPlan = z.infer<typeof planSchema> & { planner: 'ai' | 'deterministic'; fallbackReason?: string };

function deterministicPlan(goal: string, requestedTools: AgentToolId[], fallbackReason?: string): AgentPlan {
  const tools = [...new Set<AgentToolId>(['read_knowledge', 'draft_plan', ...requestedTools])];
  return {
    planner: 'deterministic',
    fallbackReason,
    summary: `Controlled plan for: ${goal}`,
    steps: tools.map((toolId) => ({
      toolId,
      title: `${toolId.replaceAll('_', ' ')} for ${goal}`,
      successCriteria:
        toolId === 'read_knowledge'
          ? 'Return reviewed citations or explicitly report no evidence.'
          : toolId === 'robot_inspect'
          ? 'Return current robot telemetry state as inspectable evidence.'
          : toolId === 'analyse_data'
          ? 'Return structured analysis with confidence score and data summary.'
          : toolId === 'generate_report'
          ? 'Return a complete markdown report artifact.'
          : 'Return inspectable evidence without unapproved external side effects.',
    })),
  };
}

function extractJson(value: string) {
  const fenced = value.match(/```(?:json)?\s*([\s\S]*?)```/i)?.[1];
  const candidate = fenced || value.slice(value.indexOf('{'), value.lastIndexOf('}') + 1);
  return JSON.parse(candidate);
}

/**
 * Inject company knowledge context from memory store into the planner prompt.
 */
async function buildContextSummary(observations: string[]): Promise<string> {
  if (!observations.length) return '';
  return `\n\nPrevious observations:\n${observations.slice(-5).map((o, i) => `${i + 1}. ${o}`).join('\n')}`;
}

/**
 * Determine if the planner should self-replan based on failed observations.
 */
export function shouldReplan(observations: string[]): boolean {
  const failureKeywords = ['failure:', 'failed', 'error', 'blocked', 'rejected', 'timeout'];
  const uncertaintyKeywords = ['unexpected', 'uncertain', 'low confidence', 'missing evidence', 'partial', 'incomplete'];
  const recentObs = observations.slice(-4).map((obs) => obs.toLowerCase());
  const failures = recentObs.filter((obs) => failureKeywords.some((k) => obs.includes(k)));
  const uncertainty = recentObs.filter((obs) => uncertaintyKeywords.some((k) => obs.includes(k)));
  return failures.length >= 1 || uncertainty.length >= 2;
}

export async function createAgentPlan(input: {
  goal: string;
  requestedTools?: AgentToolId[];
  observations?: string[];
  mode?: 'auto' | 'ai' | 'deterministic';
}): Promise<AgentPlan> {
  const requestedTools = input.requestedTools || [];
  const observations = input.observations || [];

  if (input.mode === 'deterministic') return deterministicPlan(input.goal, requestedTools);

  // Observation-driven replanning: if recent observations show failures, downgrade to safe tools
  if (observations.length > 0 && shouldReplan(observations)) {
    const safeTools = requestedTools.filter((t) => ['read_knowledge', 'draft_plan', 'analyse_data', 'generate_report', 'robot_inspect'].includes(t));
    return deterministicPlan(input.goal, safeTools, 'Replanned with safe tools after observed failures.');
  }

  try {
    const contextSummary = await buildContextSummary(observations);
    const { callAI } = await import('./aiClient.ts');
    const result = await callAI(
      [
        {
          role: 'system',
          content: `You are the LedgerFlow software-agent planner. Return JSON only.
Allowed tools: ${AGENT_TOOL_IDS.join(', ')}.
Never invent tools. Prefer read-only and reversible steps first.
robot_move, send_notification, external_connector are last and always approval-gated.
analyse_data and generate_report are safe to use without approval.
${contextSummary}`,
        },
        {
          role: 'user',
          content: JSON.stringify({
            goal: input.goal,
            requestedTools,
            observations: observations.slice(-5),
            outputSchema: {
              summary: 'string (max 200 chars)',
              steps: [{ toolId: 'one of the allowed tool ids', title: 'string', successCriteria: 'string' }],
            },
          }),
        },
      ],
      { model: 'ai-assistant', task: 'coding', temperature: 0.1, maxTokens: 1_500 },
    );
    const parsed = planSchema.parse(extractJson(result.content || result.text || ''));
    return { ...parsed, planner: 'ai' };
  } catch (error) {
    if (input.mode === 'ai') throw error;
    return deterministicPlan(input.goal, requestedTools, error instanceof Error ? error.message : String(error));
  }
}
