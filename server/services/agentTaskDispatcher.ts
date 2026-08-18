/**
 * agentTaskDispatcher.ts
 * ============================================================
 * Robot trung gian điều phối: chọn đúng nhân viên theo thế mạnh
 * (domain → role), ưu tiên kênh rẻ/hợp lệ, và tự chuyển fallback.
 *
 * CLI-first cho coding (Antigravity/Claude Code) → API (Gemini/DeepSeek)
 * → web chat (bị chặn bởi cổng ToS nếu không được duyệt).
 */

import { listAgentEmployees, getAgentEmployeeById, type AgentEmployee } from './agentEmployeeRegistry.ts';
import { executeEmployeeTask } from './webAiEmployeeAdapter.ts';
import { runCliAgent } from './aiCliExecutor.ts';

export interface DispatchResult {
  goal: string;
  domain: string;
  routedTo: {
    employeeId: string;
    name: string;
    strength: string;
    accessMethod: string;
    primary: string;
  };
  result: {
    success: boolean;
    usedBinding: string;
    provider?: string;
    content?: string;
    error?: string;
  };
}

const DOMAIN_ROLE_MAP: Record<string, string> = {
  coding: 'AI Dev',
  finance: 'AI CFO',
  marketing: 'AI Marketer',
  sales: 'AI Sales',
  media: 'AI Video',
  research: 'AI Research',
  general: 'Chief of Staff',
};

export function findBestEmployee(domain: string): AgentEmployee | undefined {
  const roleName = DOMAIN_ROLE_MAP[domain] || 'Chief of Staff';
  const employees = listAgentEmployees();
  return employees.find((e) => e.roleId === roleName) || employees[0];
}

function describeEndpoint(endpoint: { kind: string; provider: string; model?: string }): string {
  return `${endpoint.kind}:${endpoint.provider}${endpoint.model ? ':' + endpoint.model : ''}`;
}

export async function dispatchTask(input: {
  goal: string;
  domain?: string;
  useCli?: boolean;
  localFirst?: boolean;
}): Promise<DispatchResult> {
  const domain = input.domain || 'general';
  const employee = findBestEmployee(domain);
  if (!employee) throw new Error('No AI employee available.');

  const routedTo = {
    employeeId: employee.id,
    name: employee.name,
    strength: employee.strength,
    accessMethod: employee.accessMethod,
    primary: describeEndpoint(employee.primary),
  };

  // CLI-first cho coding agent (kênh chính thống, free/subscription)
  if (input.useCli && employee.primary.kind === 'cli') {
    try {
      const cliResult = await runCliAgent({
        cli: employee.primary.provider as 'antigravity' | 'claude' | 'gemini',
        prompt: input.goal,
      });
      if (cliResult.success) {
        return {
          goal: input.goal,
          domain,
          routedTo,
          result: { success: true, usedBinding: 'cli', provider: employee.primary.provider, content: cliResult.output },
        };
      }
      // CLI thất bại → rơi xuống API path bên dưới.
    } catch {
      // fall through to API employee execution
    }
  }

  const task = await executeEmployeeTask({ employeeId: employee.id, prompt: input.goal, localFirst: input.localFirst });
  return {
    goal: input.goal,
    domain,
    routedTo,
    result: {
      success: task.success,
      usedBinding: task.usedBinding,
      provider: task.provider,
      content: task.content,
      error: task.error,
    },
  };
}

export function listRoutingTable() {
  return listAgentEmployees().map((e) => ({
    id: e.id,
    name: e.name,
    emoji: e.emoji,
    group: e.group,
    strength: e.strength,
    accessMethod: e.accessMethod,
    primary: describeEndpoint(e.primary),
    fallbacks: e.fallbacks.map((f) => describeEndpoint(f)),
    costTier: e.costTier,
  }));
}
