/**
 * aiContextualHelp.ts
 * ============================================================
 * AI Contextual Help Engine — provides in-app, context-aware
 * help based on the current code, cursor position, and
 * active file.
 *
 * Modes: explain, suggest, debug, document, tutorial
 */
import { randomUUID } from 'node:crypto';
import { dispatchTextThroughFabric } from './aiFabric';
import { searchMemory } from './compoundMemory';
import { searchCodebase } from './localSearchService';
import { appendAuditEvent } from './auditLog';
import fs from 'fs';
import path from 'path';

// ─── Types ──────────────────────────────────────────────────────────
export type HelpMode = 'explain' | 'suggest' | 'debug' | 'document' | 'tutorial' | 'quick_fix';

export interface CodeContext {
  filePath: string;
  fileName: string;
  language: string;
  selectedCode: string;
  surroundingCode: string;
  cursorLine: number;
  totalLines: number;
}

export interface HelpResponse {
  id: string;
  mode: HelpMode;
  query: string;
  context: CodeContext;
  answer: string;
  confidence: number;
  references: Array<{ type: string; title: string; detail: string }>;
  relatedTopics: string[];
  codeFix?: {
    original: string;
    fixed: string;
    explanation: string;
  };
  generatedAt: string;
  latencyMs: number;
}

export interface HelpSession {
  id: string;
  filePath: string;
  history: Array<{ query: string; mode: HelpMode; answer: string; at: string }>;
  openedAt: string;
  lastActivityAt: string;
}

// ─── Storage ────────────────────────────────────────────────────────
const sessions = new Map<string, HelpSession>();
const recentResponses: HelpResponse[] = [];

// ─── Core API ───────────────────────────────────────────────────────

export function createHelpSession(filePath: string): HelpSession {
  const session: HelpSession = {
    id: `help_${Date.now()}`,
    filePath,
    history: [],
    openedAt: new Date().toISOString(),
    lastActivityAt: new Date().toISOString(),
  };
  sessions.set(session.id, session);
  return session;
}

export function getSession(id: string): HelpSession | undefined { return sessions.get(id); }

export async function getHelp(
  query: string,
  mode: HelpMode,
  context: CodeContext,
  sessionId?: string,
): Promise<HelpResponse> {
  const responseId = `hr_${Date.now()}`;
  const started = Date.now();

  // Update session if exists
  if (sessionId) {
    const session = sessions.get(sessionId);
    if (session) session.lastActivityAt = new Date().toISOString();
  }

  // Build context-aware prompt
  let prompt = '';

  switch (mode) {
    case 'explain':
      prompt = `Explain the following ${context.language} code in simple terms. What does it do, step by step?

FILE: ${context.fileName} (line ${context.cursorLine}/${context.totalLines})

CODE:
\`\`\`${context.language}
${context.selectedCode || context.surroundingCode.slice(0, 2000)}
\`\`\`

USER QUERY: ${query}

Provide a clear, educational explanation.`;
      break;

    case 'suggest':
      prompt = `Suggest improvements for this ${context.language} code:

FILE: ${context.fileName}

CURRENT CODE:
\`\`\`${context.language}
${context.selectedCode || context.surroundingCode.slice(0, 2000)}
\`\`\`

USER QUERY: ${query}

Suggest 2-3 improvements with code examples. Focus on: readability, performance, patterns.`;
      break;

    case 'debug':
      prompt = `Debug this ${context.language} code. Identify potential bugs, edge cases, and issues:

FILE: ${context.fileName}

CODE:
\`\`\`${context.language}
${context.selectedCode || context.surroundingCode.slice(0, 2000)}
\`\`\`

USER QUERY: ${query}

List specific bugs/issues found, and provide fixes.`;
      break;

    case 'document':
      prompt = `Write documentation for this ${context.language} code:

FILE: ${context.fileName}

CODE:
\`\`\`${context.language}
${context.selectedCode || context.surroundingCode.slice(0, 2000)}
\`\`\`

USER QUERY: ${query}

Write clear JSDoc/TSDoc-style documentation with parameters, returns, examples.`;
      break;

    case 'tutorial':
      prompt = `Create a mini-tutorial about this code pattern:

FILE: ${context.fileName}

CODE:
\`\`\`${context.language}
${context.selectedCode || context.surroundingCode.slice(0, 2000)}
\`\`\`

USER QUERY: ${query}

Explain the concept, show variations, and suggest next learning steps.`;
      break;

    case 'quick_fix':
      prompt = `Quickly fix this code issue:

FILE: ${context.fileName}

CODE:
\`\`\`${context.language}
${context.selectedCode || context.surroundingCode.slice(0, 2000)}
\`\`\`

USER QUERY: ${query}

Return format:
ORIGINAL: [the problematic code]
FIXED: [the fixed code]
EXPLANATION: [why this fixes it]`;
      break;

    default:
      prompt = `Answer this question about the code:

FILE: ${context.fileName}
CODE: ${context.selectedCode?.slice(0, 1500)}

USER QUERY: ${query}`;
  }

  // Try AI first
  let answer = '';
  let codeFix: HelpResponse['codeFix'] | undefined;

  try {
    const result = await dispatchTextThroughFabric(prompt, undefined, {
      domain: 'coding', localFallback: true,
    });

    if (result.winner?.contentPreview) {
      answer = result.winner.contentPreview;

      // Parse quick_fix format if applicable
      if (mode === 'quick_fix') {
        const origMatch = answer.match(/ORIGINAL:\s*([\s\S]*?)(?=FIXED:|$)/i);
        const fixedMatch = answer.match(/FIXED:\s*([\s\S]*?)(?=EXPLANATION:|$)/i);
        const expMatch = answer.match(/EXPLANATION:\s*([\s\S]*?)$/i);

        if (fixedMatch) {
          codeFix = {
            original: origMatch?.[1]?.trim() || '',
            fixed: fixedMatch[1].trim(),
            explanation: expMatch?.[1]?.trim() || '',
          };
        }
      }
    }
  } catch {
    answer = `I cannot access the AI provider right now. Here's what I can tell based on context: This is a ${context.language} file with ${context.totalLines} lines. The selected code at line ${context.cursorLine} appears to be a ${detectCodeType(context.selectedCode)}.`;
  }

  // Gather references from memory and codebase
  const references: HelpResponse['references'] = [];

  try {
    const mems = await searchMemory(query, { limit: 3 });
    for (const mem of mems.slice(0, 3)) {
      references.push({ type: 'memory', title: mem.title, detail: mem.content.slice(0, 100) });
    }
  } catch { }

  // Search for related code in codebase
  try {
    const relatedCode = await searchCodebase(
      context.selectedCode?.split(/\s+/).slice(0, 3).join(' ') || query,
      3,
    );
    for (const rc of relatedCode.slice(0, 3)) {
      references.push({ type: 'code', title: rc.relativePath, detail: rc.snippet?.slice(0, 100) || '' });
    }
  } catch { }

  // Related topics
  const relatedTopics = generateRelatedTopics(query, context);

  // Save to session if exists
  if (sessionId) {
    const session = sessions.get(sessionId);
    if (session) {
      session.history.push({ query, mode, answer: answer.slice(0, 500), at: new Date().toISOString() });
    }
  }

  const response: HelpResponse = {
    id: responseId, mode, query, context,
    answer, confidence: answer.length > 50 ? 0.85 : 0.5,
    references, relatedTopics, codeFix,
    generatedAt: new Date().toISOString(),
    latencyMs: Date.now() - started,
  };

  recentResponses.push(response);
  if (recentResponses.length > 100) recentResponses.splice(0, recentResponses.length - 100);

  return response;
}

function detectCodeType(code: string): string {
  if (!code) return 'unknown';
  if (code.includes('function') || code.includes('=>')) return 'function';
  if (code.includes('class ')) return 'class';
  if (code.includes('import ') || code.includes('require(')) return 'import/require';
  if (code.includes('interface ') || code.includes('type ')) return 'type definition';
  if (code.match(/^(const|let|var)\s+\w+\s*=/)) return 'variable';
  return 'code block';
}

function generateRelatedTopics(query: string, context: CodeContext): string[] {
  const topics: string[] = [];
  const q = query.toLowerCase();

  if (context.language === 'typescript' || context.language === 'ts') {
    if (q.includes('type') || q.includes('interface')) topics.push('TypeScript type system', 'Generics in TypeScript');
    if (q.includes('async') || q.includes('await')) topics.push('Promises and async/await', 'Error handling in async code');
    if (q.includes('react') || q.includes('component')) topics.push('React component patterns', 'Hooks best practices');
  }

  if (q.includes('sort') || q.includes('search')) topics.push('Algorithms and data structures', 'Big O notation');
  if (q.includes('test') || q.includes('mock')) topics.push('Unit testing with Jest/Vitest', 'Mocking strategies');
  if (q.includes('error') || q.includes('bug') || q.includes('fix')) topics.push('Debugging techniques', 'Common TypeScript errors');

  if (topics.length === 0) {
    topics.push(`${context.language} best practices`, 'Code review checklist');
  }

  return topics;
}

export function listRecentResponses(limit = 20): HelpResponse[] {
  return recentResponses.slice(-limit).reverse();
}

export function closeSession(id: string): boolean {
  return sessions.delete(id);
}

export function getHelpStats(): { activeSessions: number; totalResponses: number; avgLatencyMs: number } {
  return {
    activeSessions: sessions.size,
    totalResponses: recentResponses.length,
    avgLatencyMs: recentResponses.length > 0 ? Math.round(recentResponses.reduce((s, r) => s + r.latencyMs, 0) / recentResponses.length) : 0,
  };
}
