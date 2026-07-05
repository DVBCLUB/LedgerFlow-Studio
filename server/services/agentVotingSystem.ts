/**
 * agentVotingSystem.ts
 * ============================================================
 * Agent Voting System — ensemble nhiều agents cùng trả lời
 * 1 task, sau đó AI evaluator chọn best answer qua voting.
 *
 * Pattern: Task → N parallel agents → AI evaluator → best answer
 * Supports: majority vote, weighted vote, best-of-N selection
 */
import { randomUUID } from 'node:crypto';
import { dispatchTextThroughFabric } from './aiFabric';
import { appendAuditEvent } from './auditLog';
import fs from 'fs';
import { ensureRuntimeRootSync, resolveRuntimePathFromEnv, resolveRuntimeReadPathFromEnv } from './runtimePaths.ts';

// ─── Types ──────────────────────────────────────────────────────────
export interface VoterAgent {
  name: string;
  role: string;
  systemPrompt: string;
  weight: number;
}

export interface AgentVote {
  agentName: string;
  agentRole: string;
  content: string;
  latencyMs: number;
  confidence: number;    // Self-reported confidence
  route: string;
}

export interface VoteEvaluation {
  agentName: string;
  score: number;
  rank: number;
  strengths: string[];
  weaknesses: string[];
  evaluatorComment: string;
}

export interface VotingSession {
  id: string;
  task: string;
  domain: string;
  voters: VoterAgent[];
  votes: AgentVote[];
  evaluations: VoteEvaluation[];
  winner: VoteEvaluation | null;
  strategy: 'best_of_n' | 'majority' | 'weighted';
  finalAnswer: string;
  totalLatencyMs: number;
  status: 'voting' | 'evaluating' | 'completed' | 'failed';
  startedAt: string;
  completedAt?: string;
}

// ─── Default voter agents ───────────────────────────────────────────
const DEFAULT_VOTERS: VoterAgent[] = [
  {
    name: 'Analyst', role: 'analyst',
    systemPrompt: 'Bạn là một Analyst. Trả lời chính xác, có cấu trúc, dẫn chứng khi cần.',
    weight: 1.0,
  },
  {
    name: 'Pragmatist', role: 'pragmatist',
    systemPrompt: 'Bạn là một Pragmatist. Trả lời ngắn gọn, thực tế, tập trung vào giải pháp.',
    weight: 1.0,
  },
  {
    name: 'Creative', role: 'creative',
    systemPrompt: 'Bạn là một Creative thinker. Đưa ra giải pháp sáng tạo, khác biệt.',
    weight: 0.8,
  },
];

// ─── Storage ────────────────────────────────────────────────────────
const FILE = resolveRuntimePathFromEnv('VOTING_SESSIONS_FILE', 'voting_sessions.json');
let sessions: VotingSession[] = [];

async function load(): Promise<void> {
  try {
    const file = resolveRuntimeReadPathFromEnv('VOTING_SESSIONS_FILE', 'voting_sessions.json');
    if (fs.existsSync(file)) sessions = JSON.parse(await fs.promises.readFile(file, 'utf8'));
  } catch { }
}
load().catch(() => undefined);
async function save(): Promise<void> {
  ensureRuntimeRootSync();
  await fs.promises.writeFile(FILE, JSON.stringify(sessions.slice(-30), null, 2), 'utf8');
}

// ─── Core API ───────────────────────────────────────────────────────

export function getDefaultVoters(): VoterAgent[] { return [...DEFAULT_VOTERS]; }

export async function runVotingSession(
  task: string,
  options: {
    domain?: string;
    voters?: VoterAgent[];
    strategy?: VotingSession['strategy'];
  } = {}
): Promise<VotingSession> {
  const sessionId = `vote_${Date.now()}_${randomUUID().slice(0, 6)}`;
  const started = Date.now();
  const voters = options.voters || DEFAULT_VOTERS;
  const strategy = options.strategy || 'best_of_n';

  const session: VotingSession = {
    id: sessionId, task, domain: options.domain || 'general',
    voters, votes: [], evaluations: [], winner: null,
    strategy, finalAnswer: '', totalLatencyMs: 0,
    status: 'voting',
    startedAt: new Date().toISOString(),
  };

  sessions.push(session);

  // Phase 1: All voters respond in parallel
  try {
    const votePromises = voters.map(async (voter) => {
      const vStart = Date.now();
      try {
        const result = await dispatchTextThroughFabric(
          task,
          voter.systemPrompt,
          { domain: (options.domain || 'general') as any, localFallback: true }
        );

        return {
          agentName: voter.name, agentRole: voter.role,
          content: result.winner?.contentPreview || '',
          latencyMs: Date.now() - vStart,
          confidence: result.status === 'completed' ? 0.8 : 0.3,
          route: result.winner?.route || 'unknown',
        } as AgentVote;
      } catch {
        return {
          agentName: voter.name, agentRole: voter.role,
          content: `Error: failed to respond`,
          latencyMs: Date.now() - vStart,
          confidence: 0.1, route: 'error',
        } as AgentVote;
      }
    });

    session.votes = await Promise.all(votePromises);
  } catch (err: any) {
    session.status = 'failed';
    session.totalLatencyMs = Date.now() - started;
    session.completedAt = new Date().toISOString();
    save().catch(() => undefined);
    return session;
  }

  // Phase 2: AI evaluates all votes
  session.status = 'evaluating';
  try {
    const evaluationPrompt = buildEvaluationPrompt(session);
    const evalResult = await dispatchTextThroughFabric(
      evaluationPrompt,
      'Bạn là một AI Evaluator. Đánh giá khách quan, cho điểm 0-100 cho từng response.',
      { domain: 'general', task: 'general', localFallback: true }
    );

    if (evalResult.status === 'completed' && evalResult.winner?.contentPreview) {
      session.evaluations = parseEvaluations(evalResult.winner.contentPreview, session);
    } else {
      session.evaluations = fallbackEvaluations(session);
    }
  } catch {
    session.evaluations = fallbackEvaluations(session);
  }

  // Phase 3: Select winner based on strategy
  if (session.evaluations.length > 0) {
    if (strategy === 'weighted') {
      for (const ev of session.evaluations) {
        const voter = voters.find(v => v.name === ev.agentName);
        ev.score *= (voter?.weight || 1);
      }
    }

    session.evaluations.sort((a, b) => b.score - a.score);
    session.evaluations.forEach((ev, i) => { ev.rank = i + 1; });
    session.winner = session.evaluations[0];

    const winnerVote = session.votes.find(v => v.agentName === session.winner!.agentName);
    session.finalAnswer = winnerVote?.content || 'No answer.';
  }

  session.status = 'completed';
  session.totalLatencyMs = Date.now() - started;
  session.completedAt = new Date().toISOString();

  await appendAuditEvent({
    actor: 'system', workspace: 'Agent Voting', action: 'voting.complete',
    target: task.slice(0, 80), risk: 'LOW', status: 'executed',
    summary: `Voting: ${session.evaluations.length} agents, winner=${session.winner?.agentName} (score=${session.winner?.score})`,
    connectorId: 'agent-voting',
    evidence: { sessionId, voters: voters.length, strategy, winner: session.winner?.agentName },
  }).catch(() => undefined);

  save().catch(() => undefined);
  return session;
}

export function getVotingSession(id: string): VotingSession | undefined {
  return sessions.find(s => s.id === id);
}
export function listVotingSessions(): VotingSession[] { return [...sessions].reverse(); }

// ─── Helpers ────────────────────────────────────────────────────────

function buildEvaluationPrompt(session: VotingSession): string {
  let prompt = `Đánh giá các câu trả lời sau cho task: "${session.task}"\n\n`;
  prompt += `Strategy: ${session.strategy}\n\n`;

  for (let i = 0; i < session.votes.length; i++) {
    const v = session.votes[i];
    prompt += `--- CANDIDATE ${i + 1}: ${v.agentName} (${v.agentRole}) | latency: ${v.latencyMs}ms ---\n`;
    prompt += `${v.content.slice(0, 600)}\n\n`;
  }

  prompt += `Cho điểm 0-100 và nhận xét cho từng candidate theo format:\n`;
  for (let i = 0; i < session.votes.length; i++) {
    prompt += `SCORE:${session.votes[i].agentName}=[points]|STRENGTHS:[comma-separated]|WEAKNESSES:[comma-separated]|COMMENT:[1 sentence]\n`;
  }
  prompt += `WINNER:[agent name]`;

  return prompt;
}

function parseEvaluations(content: string, session: VotingSession): VoteEvaluation[] {
  const evals: VoteEvaluation[] = [];

  for (const vote of session.votes) {
    const regex = new RegExp(`SCORE:${vote.agentName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*=\\s*(\\d+)`, 'i');
    const match = content.match(regex);
    const score = match ? parseInt(match[1]) : 50;

    const strengthsMatch = content.match(new RegExp(`STRENGTHS:([^|]*)`, 'i'));
    const weaknessesMatch = content.match(new RegExp(`WEAKNESSES:([^|]*)`, 'i'));
    const commentMatch = content.match(new RegExp(`COMMENT:([^\\n]+)`, 'i'));

    evals.push({
      agentName: vote.agentName,
      score: Math.min(100, Math.max(0, score)),
      rank: 0,
      strengths: strengthsMatch?.[1]?.split(',').map(s => s.trim()).filter(Boolean) || [],
      weaknesses: weaknessesMatch?.[1]?.split(',').map(s => s.trim()).filter(Boolean) || [],
      evaluatorComment: commentMatch?.[1]?.trim() || '',
    });
  }

  return evals;
}

function fallbackEvaluations(session: VotingSession): VoteEvaluation[] {
  return session.votes.map(v => ({
    agentName: v.agentName,
    score: Math.round(v.confidence * 80 + (1 - v.latencyMs / 30000) * 20),
    rank: 0,
    strengths: [], weaknesses: [],
    evaluatorComment: 'Fallback score based on confidence + latency.',
  }));
}
