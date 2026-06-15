export const AGENT_ROLES = [
  'AI PM',
  'AI Dev',
  'AI Marketer',
  'AI Accountant',
  'AI Auditor',
  'AI Designer',
  'AI Analyst',
  'AI Support',
] as const;

export type AgentRole = (typeof AGENT_ROLES)[number];

export interface AgentExecuteRequest {
  taskId: string;
  agentRole: AgentRole;
  prompt: string;
  context?: Record<string, unknown>;
}

export interface AgentExecuteResponse {
  success: boolean;
  output?: string;
  provider?: string;
  model?: string;
  tokensUsed?: number;
  error?: string;
}

async function readJson<T>(response: Response): Promise<T> {
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = typeof payload?.error === 'string' ? payload.error : 'Agent execution failed';
    throw new Error(message);
  }
  return payload as T;
}

export async function executeAgentTask(request: AgentExecuteRequest): Promise<AgentExecuteResponse> {
  return readJson<AgentExecuteResponse>(
    await fetch('/api/agents/execute', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    }),
  );
}

export async function fetchAgentRoles(): Promise<AgentRole[]> {
  const result = await readJson<{ success: boolean; roles: AgentRole[] }>(await fetch('/api/agents/roles'));
  return result.roles;
}
