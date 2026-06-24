/**
 * agentHandoffProtocol.ts
 * ============================================================
 * Agent Handoff Protocol — agent→agent chuyển giao task
 * kèm context đầy đủ. Theo Microsoft Agent Group Chat + Handoff patterns.
 * Hỗ trợ: direct handoff, group discussion, escalation.
 */
import { randomUUID } from 'node:crypto';
import { dispatchTextThroughFabric } from './aiFabric';
import { searchMemory } from './compoundMemory';
import { appendAuditEvent } from './auditLog';

// ─── Types ──────────────────────────────────────────────────────────
export type HandoffReason = 'domain_mismatch' | 'need_review' | 'need_test' | 'need_finance' | 'escalation' | 'user_request';

export interface AgentIdentity {
  role: string;
  domain: string;
  systemPrompt: string;
  capabilities: string[];
}

export interface HandoffPacket {
  id: string;
  from: AgentIdentity;
  to: AgentIdentity;
  reason: HandoffReason;
  task: string;
  context: {
    originalGoal: string;
    previousResult?: string;
    previousSteps: Array<{ goal: string; result: string }>;
    relevantFiles?: string[];
    relevantMemories: Array<{ title: string; content: string }>;
  };
  priority: 'low' | 'normal' | 'high' | 'critical';
  createdAt: string;
  expiresAt?: string;
  status: 'pending' | 'accepted' | 'rejected' | 'completed';
  result?: string;
  completedAt?: string;
}

export interface GroupDiscussionRound {
  round: number;
  agent: string;
  message: string;
  timestamp: string;
}

export interface GroupDiscussion {
  id: string;
  topic: string;
  participants: AgentIdentity[];
  rounds: GroupDiscussionRound[];
  conclusion?: string;
  actionItems: Array<{ agent: string; task: string; priority: string }>;
  startedAt: string;
  completedAt?: string;
  status: 'discussing' | 'concluded' | 'timed_out';
}

// ─── Agent Registry ─────────────────────────────────────────────────
const AGENT_REGISTRY: Record<string, AgentIdentity> = {
  'code': {
    role: 'code', domain: 'coding',
    systemPrompt: 'Developer Agent — viết, sửa, tối ưu code. Domain: coding.',
    capabilities: ['write_code', 'edit_file', 'refactor', 'run_lint', 'fix_type'],
  },
  'test': {
    role: 'test', domain: 'coding',
    systemPrompt: 'QA Agent — kiểm tra chất lượng code, unit test, coverage.',
    capabilities: ['write_test', 'run_test', 'analyze_coverage', 'edge_case'],
  },
  'review': {
    role: 'review', domain: 'coding',
    systemPrompt: 'Review Agent — kiểm tra security, performance, best practices.',
    capabilities: ['security_scan', 'perf_review', 'best_practices', 'code_quality'],
  },
  'finance': {
    role: 'finance', domain: 'finance',
    systemPrompt: 'Finance Agent — phân tích số liệu, chi phí, báo cáo tài chính.',
    capabilities: ['calculate', 'generate_report', 'analyze_data', 'cost_estimate'],
  },
  'planner': {
    role: 'planner', domain: 'general',
    systemPrompt: 'Orchestrator — phân tích yêu cầu, lập kế hoạch, phân công agent.',
    capabilities: ['plan', 'delegate', 'summarize', 'orchestrate'],
  },
  'general': {
    role: 'general', domain: 'general',
    systemPrompt: 'General Agent — xử lý đa dạng tác vụ.',
    capabilities: ['search', 'analyze', 'respond', 'translate'],
  },
};

// ─── Active handoffs ────────────────────────────────────────────────
const activeHandoffs = new Map<string, HandoffPacket>();
const activeDiscussions = new Map<string, GroupDiscussion>();

// ─── Core API ───────────────────────────────────────────────────────

export function getAgentRegistry(): Record<string, AgentIdentity> {
  return { ...AGENT_REGISTRY };
}

export async function handoffTask(
  fromRole: string,
  toRole: string,
  task: string,
  context: {
    originalGoal?: string;
    previousResult?: string;
    reason?: HandoffReason;
    priority?: HandoffPacket['priority'];
  } = {}
): Promise<HandoffPacket> {
  const fromAgent = AGENT_REGISTRY[fromRole];
  const toAgent = AGENT_REGISTRY[toRole];

  if (!fromAgent || !toAgent) {
    throw new Error(`Invalid agent roles: from=${fromRole}, to=${toRole}`);
  }

  // Search memory for relevant context
  let relevantMemories: Array<{ title: string; content: string }> = [];
  try {
    const mems = await searchMemory(task, { domain: toAgent.domain, limit: 3 });
    relevantMemories = mems.map(m => ({ title: m.title, content: m.content.slice(0, 200) }));
  } catch { /* optional */ }

  const packet: HandoffPacket = {
    id: `handoff_${Date.now()}_${randomUUID().slice(0, 6)}`,
    from: fromAgent,
    to: toAgent,
    reason: context.reason || 'user_request',
    task,
    context: {
      originalGoal: context.originalGoal || task,
      previousResult: context.previousResult,
      previousSteps: [],
      relevantMemories,
    },
    priority: context.priority || 'normal',
    createdAt: new Date().toISOString(),
    status: 'pending',
  };

  activeHandoffs.set(packet.id, packet);

  // Attempt to execute the handoff via AI Fabric
  try {
    const handoffPrompt = buildHandoffPrompt(packet);
    const result = await dispatchTextThroughFabric(
      handoffPrompt,
      toAgent.systemPrompt,
      { domain: toAgent.domain as any, task: toAgent.role, localFallback: true }
    );

    if (result.status === 'completed') {
      packet.status = 'accepted';
      packet.result = result.winner?.contentPreview?.slice(0, 1000);
    } else {
      packet.status = 'rejected';
    }
  } catch (err: any) {
    packet.status = 'rejected';
    packet.result = `Error: ${err.message}`;
  }

  packet.completedAt = new Date().toISOString();

  await appendAuditEvent({
    actor: fromRole,
    workspace: 'Agent Handoff',
    action: `handoff.${fromRole}->${toRole}`,
    target: task.slice(0, 80),
    risk: 'LOW',
    status: packet.status === 'accepted' ? 'executed' : 'failed',
    summary: `Handoff ${fromRole} → ${toRole}: ${packet.status}`,
    connectorId: 'agent-handoff',
    evidence: { handoffId: packet.id, reason: packet.reason },
  }).catch(() => undefined);

  return packet;
}

export function getActiveHandoff(id: string): HandoffPacket | undefined {
  return activeHandoffs.get(id);
}

export function listHandoffs(): HandoffPacket[] {
  return Array.from(activeHandoffs.values());
}

// ─── Group Discussion ───────────────────────────────────────────────

export async function startGroupDiscussion(
  topic: string,
  participantRoles: string[],
  maxRounds = 3,
): Promise<GroupDiscussion> {
  const participants = participantRoles
    .map(r => AGENT_REGISTRY[r])
    .filter(Boolean);

  if (participants.length < 2) {
    throw new Error('Need at least 2 participants for group discussion.');
  }

  const discussion: GroupDiscussion = {
    id: `discuss_${Date.now()}_${randomUUID().slice(0, 6)}`,
    topic,
    participants,
    rounds: [],
    actionItems: [],
    startedAt: new Date().toISOString(),
    status: 'discussing',
  };

  activeDiscussions.set(discussion.id, discussion);

  try {
    for (let round = 0; round < maxRounds; round++) {
      for (const agent of participants) {
        const prompt = buildDiscussionPrompt(discussion, agent, round);
        const result = await dispatchTextThroughFabric(
          prompt,
          agent.systemPrompt,
          { domain: agent.domain as any, task: 'general', localFallback: true },
        );

        const msg = result.winner?.contentPreview?.slice(0, 500) || `[${agent.role}] No response.`;
        discussion.rounds.push({ round: round + 1, agent: agent.role, message: msg, timestamp: new Date().toISOString() });
      }
    }

    // Generate conclusion
    const conclusionPrompt = buildConclusionPrompt(discussion);
    const conclusion = await dispatchTextThroughFabric(
      conclusionPrompt,
      undefined,
      { domain: 'general', task: 'general', localFallback: true },
    );

    if (conclusion.status === 'completed') {
      const content = conclusion.winner?.contentPreview || '';
      discussion.conclusion = content.slice(0, 500);
      // Parse action items
      discussion.actionItems = parseActionItems(content, participants);
    }

    discussion.status = 'concluded';
  } catch {
    discussion.status = 'timed_out';
  }

  discussion.completedAt = new Date().toISOString();
  return discussion;
}

export function getDiscussion(id: string): GroupDiscussion | undefined {
  return activeDiscussions.get(id);
}

export function listDiscussions(): GroupDiscussion[] {
  return Array.from(activeDiscussions.values());
}

// ─── Prompt builders ────────────────────────────────────────────────

function buildHandoffPrompt(packet: HandoffPacket): string {
  return `Bạn là ${packet.to.role} Agent nhận handoff từ ${packet.from.role} Agent.

TASK ĐƯỢC HANDOFF:
${packet.task}

CONTEXT:
- Mục tiêu gốc: ${packet.context.originalGoal}
${packet.context.previousResult ? `- Kết quả từ agent trước: ${packet.context.previousResult}` : ''}
${packet.context.relevantMemories.length > 0 ? `- Memory liên quan:\n${packet.context.relevantMemories.map(m => `  * ${m.title}: ${m.content}`).join('\n')}` : ''}

LÝ DO HANDOFF: ${packet.reason}

Hãy xử lý task này với chuyên môn của bạn (${packet.to.capabilities.join(', ')}). Trả lời kết quả cụ thể.`;
}

function buildDiscussionPrompt(discussion: GroupDiscussion, agent: AgentIdentity, round: number): string {
  const history = discussion.rounds
    .map(r => `[${r.agent}] Round ${r.round}: ${r.message}`)
    .join('\n');

  return `GROUP DISCUSSION: "${discussion.topic}" — Round ${round + 1}

Participants: ${discussion.participants.map(p => `${p.role} (${p.capabilities.slice(0, 2).join(', ')})`).join(', ')}

History:
${history || '(Bắt đầu thảo luận)'}

Bạn là ${agent.role} Agent. Hãy đưa ra ý kiến chuyên môn của bạn về chủ đề này. Tập trung vào: ${agent.capabilities.slice(0, 3).join(', ')}.`;
}

function buildConclusionPrompt(discussion: GroupDiscussion): string {
  const history = discussion.rounds
    .map(r => `[${r.agent}] R${r.round}: ${r.message.slice(0, 200)}`)
    .join('\n');

  return `Tổng kết group discussion về "${discussion.topic}".

Thảo luận:
${history}

Hãy kết luận và đưa ra action items theo format:
## CONCLUSION
[tổng kết]

## ACTION ITEMS
- [agent]: [task] | [priority]`;
}

function parseActionItems(content: string, participants: AgentIdentity[]): Array<{ agent: string; task: string; priority: string }> {
  const items: Array<{ agent: string; task: string; priority: string }> = [];
  const section = content.match(/## ACTION ITEMS\s*\n([\s\S]*?)(?=\n##|$)/i);
  if (!section) return items;

  const lines = section[1].split('\n').filter(l => l.trim().startsWith('-'));
  for (const line of lines) {
    const parts = line.replace(/^-\s*/, '').split('|').map(s => s.trim());
    if (parts.length >= 1) {
      const agentPart = parts[0].split(':');
      items.push({
        agent: agentPart[0].trim(),
        task: (agentPart[1] || parts[0]).trim(),
        priority: parts[1] || 'normal',
      });
    }
  }
  return items.slice(0, 5);
}
