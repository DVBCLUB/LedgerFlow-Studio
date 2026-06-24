/**
 * codeAutocompleteEngine.ts
 * ============================================================
 * AI Code Autocomplete Engine — real-time context-aware
 * code completion suggestions based on current file,
 * project patterns, and historical completions.
 */
import { randomUUID } from 'node:crypto';
import { dispatchTextThroughFabric } from './aiFabric';
import { searchCodebase } from './localSearchService';
import { searchMemory } from './compoundMemory';
import fs from 'fs';
import path from 'path';

// ─── Types ──────────────────────────────────────────────────────────
export interface CursorPosition { line: number; column: number; }

export interface CodeContext {
  filePath: string; language: string;
  prefix: string; suffix: string;
  imports: string;
  cursor: CursorPosition;
}

export interface CompletionSuggestion {
  id: string;
  text: string;
  displayText: string;
  description: string;
  kind: 'function' | 'variable' | 'class' | 'interface' | 'type' | 'import' | 'snippet' | 'keyword';
  score: number;
  source: 'ai' | 'heuristic' | 'project_pattern' | 'memory';
  replaceRange: { start: CursorPosition; end: CursorPosition };
  detail: string;
}

export interface CompletionSession {
  id: string;
  filePath: string;
  language: string;
  completions: CompletionSuggestion[];
  stats: { totalCompletions: number; acceptedCount: number; avgLatencyMs: number };
  openedAt: string;
  lastActivityAt: string;
}

// ─── Heuristic completions ──────────────────────────────────────────
const TS_PATTERNS: Array<{ prefix: string; kind: CompletionSuggestion['kind']; text: string; desc: string }> = [
  { prefix: 'const', kind: 'keyword', text: 'const ', desc: 'Constant declaration' },
  { prefix: 'let', kind: 'keyword', text: 'let ', desc: 'Variable declaration' },
  { prefix: 'function', kind: 'keyword', text: 'function ${1:name}(${2:params}) {\n  ${3}\n}', desc: 'Function declaration' },
  { prefix: 'if', kind: 'keyword', text: 'if (${1:condition}) {\n  ${2}\n}', desc: 'If statement' },
  { prefix: 'for', kind: 'keyword', text: 'for (const ${1:item} of ${2:items}) {\n  ${3}\n}', desc: 'For-of loop' },
  { prefix: 'try', kind: 'keyword', text: 'try {\n  ${1}\n} catch (err) {\n  console.error(err);\n}', desc: 'Try-catch block' },
  { prefix: 'import', kind: 'import', text: 'import { ${1} } from \'${2}\';', desc: 'Named import' },
  { prefix: 'class', kind: 'class', text: 'class ${1:Name} {\n  constructor() {\n    ${2}\n  }\n}', desc: 'Class definition' },
  { prefix: 'interface', kind: 'interface', text: 'interface ${1:Name} {\n  ${2}\n}', desc: 'Interface definition' },
  { prefix: 'type', kind: 'type', text: 'type ${1:Name} = ${2};', desc: 'Type alias' },
  { prefix: 'export default', kind: 'function', text: 'export default function ${1:name}(${2:params}) {\n  ${3}\n}', desc: 'Default export function' },
  { prefix: 'console.', kind: 'snippet', text: 'console.log(${1});', desc: 'Console log' },
  { prefix: 'describe', kind: 'snippet', text: 'describe(\'${1:name}\', () => {\n  it(\'should ${2}\', () => {\n    ${3}\n  });\n});', desc: 'Test suite' },
  { prefix: 'useState', kind: 'snippet', text: 'const [${1:state}, set${2:State}] = useState(${3});', desc: 'React useState hook' },
  { prefix: 'useEffect', kind: 'snippet', text: 'useEffect(() => {\n  ${1}\n}, [${2}]);', desc: 'React useEffect hook' },
];

// ─── Session management ─────────────────────────────────────────────
const sessions = new Map<string, CompletionSession>();

export function createCompletionSession(filePath: string): CompletionSession {
  const ext = path.extname(filePath).toLowerCase();
  const language = ext === '.ts' || ext === '.tsx' ? 'typescript' : ext === '.js' || ext === '.jsx' ? 'javascript' : ext === '.py' ? 'python' : 'unknown';

  const session: CompletionSession = {
    id: `comp_${Date.now()}`,
    filePath, language,
    completions: [],
    stats: { totalCompletions: 0, acceptedCount: 0, avgLatencyMs: 0 },
    openedAt: new Date().toISOString(),
    lastActivityAt: new Date().toISOString(),
  };
  sessions.set(session.id, session);
  return session;
}

export function getSession(id: string): CompletionSession | undefined { return sessions.get(id); }
export function acceptCompletion(sessionId: string, completionId: string): boolean {
  const session = sessions.get(sessionId);
  if (!session) return false;
  session.stats.acceptedCount++;
  return true;
}

// ─── Core: Get completions ──────────────────────────────────────────

export async function getCompletions(
  context: CodeContext,
  sessionId?: string,
): Promise<CompletionSuggestion[]> {
  const started = Date.now();
  const suggestions: CompletionSuggestion[] = [];

  // Update session
  if (sessionId) {
    const session = sessions.get(sessionId);
    if (session) session.lastActivityAt = new Date().toISOString();
  }

  // Step 1: Heuristic pattern matching (fast, always available)
  const prefixLower = context.prefix.trim().toLowerCase();
  for (const pattern of TS_PATTERNS) {
    if (prefixLower.startsWith(pattern.prefix.toLowerCase()) || prefixLower === '') {
      suggestions.push({
        id: `he_${randomUUID().slice(0, 6)}`,
        text: pattern.text, displayText: pattern.prefix,
        description: pattern.desc, kind: pattern.kind,
        score: prefixLower.length > 0 ? 0.85 : 0.4,
        source: 'heuristic',
        replaceRange: { start: context.cursor, end: context.cursor },
        detail: pattern.desc,
      });
    }
  }

  // Step 2: Search project for similar patterns
  try {
    const searchQuery = context.prefix.split(/\s+/).slice(-3).join(' ');
    if (searchQuery.length > 2) {
      const codeResults = await searchCodebase(searchQuery, 5);
      for (const cr of codeResults) {
        if (cr.snippet) {
          suggestions.push({
            id: `pp_${randomUUID().slice(0, 6)}`,
            text: cr.snippet.slice(0, 200),
            displayText: `→ ${cr.relativePath}`,
            description: `Similar code in ${cr.relativePath}`,
            kind: 'snippet',
            score: 0.65,
            source: 'project_pattern',
            replaceRange: { start: context.cursor, end: context.cursor },
            detail: `Found in: ${cr.relativePath}`,
          });
        }
      }
    }
  } catch { }

  // Step 3: AI-powered completion
  if (context.prefix.trim().length > 0) {
    try {
      const aiPrompt = `Complete this ${context.language} code:

PREFIX: ${context.prefix.slice(-300)}
SUFFIX: ${context.suffix.slice(0, 300)}
IMPORTS: ${context.imports.slice(0, 200)}

Return 2-3 completion options, each on a new line starting with COMPLETE:
COMPLETE: [the completed code]
DESC: [short description]`;

      const result = await dispatchTextThroughFabric(aiPrompt, undefined, {
        domain: 'coding', localFallback: true,
      });

      if (result.winner?.contentPreview) {
        const lines = result.winner.contentPreview.split('\n');
        let currentCompletion = '';
        let currentDesc = '';

        for (const line of lines) {
          if (line.toUpperCase().startsWith('COMPLETE:')) {
            if (currentCompletion) {
              suggestions.push({
                id: `ai_${randomUUID().slice(0, 6)}`,
                text: currentCompletion.trim(),
                displayText: currentCompletion.trim().slice(0, 60),
                description: currentDesc || 'AI suggestion',
                kind: 'snippet', score: 0.9,
                source: 'ai',
                replaceRange: { start: context.cursor, end: context.cursor },
                detail: currentDesc || 'AI-generated completion',
              });
            }
            currentCompletion = line.replace(/^COMPLETE:\s*/i, '');
            currentDesc = '';
          } else if (line.toUpperCase().startsWith('DESC:')) {
            currentDesc = line.replace(/^DESC:\s*/i, '').trim();
          }
        }
        if (currentCompletion) {
          suggestions.push({
            id: `ai_${randomUUID().slice(0, 6)}`,
            text: currentCompletion.trim(),
            displayText: currentCompletion.trim().slice(0, 60),
            description: currentDesc || 'AI suggestion',
            kind: 'snippet', score: 0.9, source: 'ai',
            replaceRange: { start: context.cursor, end: context.cursor },
            detail: currentDesc || 'AI-generated completion',
          });
        }
      }
    } catch { }
  }

  // Sort by score
  suggestions.sort((a, b) => b.score - a.score);

  // Update session stats
  if (sessionId) {
    const session = sessions.get(sessionId);
    if (session) {
      session.stats.totalCompletions++;
      session.stats.avgLatencyMs = Math.round(
        (session.stats.avgLatencyMs * (session.stats.totalCompletions - 1) + (Date.now() - started)) / session.stats.totalCompletions
      );
      session.completions.push(...suggestions);
    }
  }

  return suggestions.slice(0, 15);
}

export function recordAcceptance(suggestionId: string): void {
  // Track which suggestions users accept for future scoring improvements
}
