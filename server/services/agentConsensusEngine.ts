/**
 * agentConsensusEngine.ts
 * ============================================================
 * Multi-Agent Consensus Grid & Debate Engine for LedgerFlow OS.
 *
 * For high-risk decisions (financial VAS accounting, security changes,
 * codebase refactoring):
 *  1. Assembles a panel of 3 specialized AI agents.
 *  2. Conducts a multi-perspective debate round.
 *  3. Computes Consensus Score (0.0 to 1.0).
 *  4. Auto-approves if consensus >= 80% (0.80).
 *  5. Escalates to Human/Telegram Approval Gate if consensus < 80%.
 */

import { randomUUID } from 'node:crypto';
import { dispatchTextThroughFabric } from './aiFabric.ts';
import { recordAgentOutcome } from './agentPerformanceLedger.ts';
import { shareLearning } from './crossAgentLearning.ts';
import { appendAuditEvent } from './auditLog.ts';

// ─── Types ────────────────────────────────────────────────────────────────────

export type DebateVote = 'approve' | 'reject' | 'modify';

export interface DebateParticipant {
  agentRole: string;
  domain: string;
  vote: DebateVote;
  confidence: number;
  reasoning: string;
  suggestedModification?: string;
}

export interface DebateRound {
  roundIndex: number;
  participants: DebateParticipant[];
  consensusScore: number;
  summary: string;
  timestamp: string;
}

export interface ConsensusDebateSession {
  id: string;
  topic: string;
  domain: string;
  status: 'debating' | 'approved' | 'rejected' | 'escalated_to_human';
  consensusScore: number;
  finalDecision: 'approved' | 'rejected' | 'escalated_to_human';
  rounds: DebateRound[];
  createdAt: string;
  updatedAt: string;
}

export interface ConductDebateOptions {
  topic: string;
  domain?: string;
  agentRoles?: string[];
  context?: string;
  minConsensusThreshold?: number; // Default: 0.80 (80%)
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function calculateConsensusScore(participants: DebateParticipant[]): number {
  if (!participants.length) return 0;

  const approveWeight = participants
    .filter((p) => p.vote === 'approve')
    .reduce((sum, p) => sum + p.confidence, 0);

  const modifyWeight = participants
    .filter((p) => p.vote === 'modify')
    .reduce((sum, p) => sum + p.confidence * 0.5, 0);

  const totalConfidence = participants.reduce((sum, p) => sum + p.confidence, 0);
  if (totalConfidence === 0) return 0;

  return Math.min(1.0, Math.max(0.0, (approveWeight + modifyWeight) / totalConfidence));
}

// ─── Core Engine ──────────────────────────────────────────────────────────────

/**
 * Conducts a multi-agent debate session and evaluates consensus.
 */
export async function conductMultiAgentDebate(options: ConductDebateOptions): Promise<ConsensusDebateSession> {
  const sessionId = `debate_${Date.now()}_${randomUUID().slice(0, 6)}`;
  const now = new Date().toISOString();
  const domain = options.domain || 'general';
  const roles = options.agentRoles || (domain === 'coding' ? ['code', 'review', 'test'] : ['finance', 'planner', 'general']);
  const threshold = options.minConsensusThreshold ?? 0.80;

  const session: ConsensusDebateSession = {
    id: sessionId,
    topic: options.topic,
    domain,
    status: 'debating',
    consensusScore: 0,
    finalDecision: 'escalated_to_human',
    rounds: [],
    createdAt: now,
    updatedAt: now,
  };

  await appendAuditEvent({
    actor: 'consensus-engine',
    workspace: 'AI-Ops',
    action: 'consensus_debate.started',
    target: sessionId,
    risk: 'MEDIUM',
    status: 'executed',
    summary: `Multi-agent debate ${sessionId} started on topic: ${options.topic.slice(0, 60)}`,
    evidence: { sessionId, domain, roles },
  }).catch(() => undefined);

  // Execute debate round in parallel across participating agent roles
  const roundParticipants = await Promise.all(
    roles.map(async (role) => {
      const prompt = [
        `Bạn là AI Agent vai trò: ${role.toUpperCase()} (Domain: ${domain}).`,
        `Đề tài tranh luận: "${options.topic}"`,
        options.context ? `Bối cảnh: ${options.context}` : '',
        '',
        'Hãy phân tích từ góc nhìn chuyên môn của bạn và đưa ra ĐÁNH GIÁ theo format JSON:',
        '{',
        '  "vote": "approve" | "reject" | "modify",',
        '  "confidence": 0.85,',
        '  "reasoning": "lý do ngắn gọn 1-2 câu",',
        '  "suggestedModification": "nếu vote là modify thì nêu đề xuất sửa"',
        '}',
      ].join('\n');

      const started = Date.now();
      try {
        const result = await dispatchTextThroughFabric(prompt, undefined, {
          domain: domain as any,
          task: 'analysis',
          localFallback: true,
        });

        let participant: DebateParticipant = {
          agentRole: role,
          domain,
          vote: 'approve',
          confidence: 0.8,
          reasoning: result.winner?.contentPreview?.slice(0, 150) || 'Approved based on standard policy.',
        };

        if (result.status === 'completed' && result.winner?.contentPreview) {
          try {
            const jsonMatch = result.winner.contentPreview.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
              const parsed = JSON.parse(jsonMatch[0]);
              participant = {
                agentRole: role,
                domain,
                vote: ['approve', 'reject', 'modify'].includes(parsed.vote) ? parsed.vote : 'approve',
                confidence: typeof parsed.confidence === 'number' ? Math.min(1, Math.max(0, parsed.confidence)) : 0.8,
                reasoning: parsed.reasoning || participant.reasoning,
                suggestedModification: parsed.suggestedModification,
              };
            }
          } catch {
            // Keep text fallback
          }
        }

        // Record performance
        recordAgentOutcome(role, domain, participant.vote !== 'reject', Date.now() - started, {
          taskTitle: `Debate: ${options.topic.slice(0, 80)}`,
        });

        return participant;
      } catch (err: any) {
        recordAgentOutcome(role, domain, false, Date.now() - started, {
          taskTitle: `Debate: ${options.topic.slice(0, 80)}`,
          errorSummary: err.message,
        });

        return {
          agentRole: role,
          domain,
          vote: 'reject' as DebateVote,
          confidence: 0.3,
          reasoning: `Agent execution failed: ${err.message}`,
        };
      }
    })
  );

  const score = calculateConsensusScore(roundParticipants);
  const roundSummary = `${roundParticipants.filter((p) => p.vote === 'approve').length}/${roundParticipants.length} agents approved. Score: ${(score * 100).toFixed(0)}%.`;

  const debateRound: DebateRound = {
    roundIndex: 1,
    participants: roundParticipants,
    consensusScore: score,
    summary: roundSummary,
    timestamp: new Date().toISOString(),
  };

  session.rounds.push(debateRound);
  session.consensusScore = score;
  session.updatedAt = new Date().toISOString();

  if (score >= threshold) {
    session.status = 'approved';
    session.finalDecision = 'approved';

    // Share successful consensus pattern
    shareLearning(
      `consensus:${sessionId}`,
      domain,
      'success',
      `Debate consensus reached (${(score * 100).toFixed(0)}%) for: ${options.topic.slice(0, 60)}`,
      roundSummary,
      score,
      ['consensus', domain],
    ).catch(() => undefined);
  } else {
    session.status = 'escalated_to_human';
    session.finalDecision = 'escalated_to_human';
  }

  await appendAuditEvent({
    actor: 'consensus-engine',
    workspace: 'AI-Ops',
    action: 'consensus_debate.completed',
    target: sessionId,
    risk: session.finalDecision === 'approved' ? 'LOW' : 'HIGH',
    status: session.finalDecision === 'approved' ? 'executed' : 'pending_approval',
    summary: `Debate ${sessionId} ${session.finalDecision} with consensus score ${(score * 100).toFixed(0)}%`,
    evidence: { sessionId, score, threshold, finalDecision: session.finalDecision },
  }).catch(() => undefined);

  return session;
}
