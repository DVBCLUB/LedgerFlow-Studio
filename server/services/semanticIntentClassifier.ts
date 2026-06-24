/**
 * semanticIntentClassifier.ts
 * ============================================================
 * Semantic Intent Classifier — phân loại intent người dùng
 * để route đến đúng agent + tool combination.
 *
 * Dùng keyword + pattern matching (fast) kết hợp AI semantic
 * classification (accurate) cho ambiguous queries.
 */
import { dispatchTextThroughFabric } from './aiFabric';

// ─── Types ──────────────────────────────────────────────────────────
export type UserIntent =
  | 'generate_code'
  | 'fix_bug'
  | 'explain_code'
  | 'review_code'
  | 'refactor_code'
  | 'write_test'
  | 'analyze_data'
  | 'search_info'
  | 'optimize_performance'
  | 'security_audit'
  | 'summarize'
  | 'general_question'
  | 'execute_command';

export interface IntentClassification {
  primaryIntent: UserIntent;
  confidence: number;
  secondaryIntents: Array<{ intent: UserIntent; confidence: number }>;
  domain: string;
  language: string;
  suggestedAgent: string;
  suggestedTools: string[];
  complexity: 'simple' | 'medium' | 'complex';
  estimatedTokens: number;
}

export interface IntentRouting {
  intent: IntentClassification;
  route: { agent: string; systemPrompt: string; tools: string[] };
  alternatives: Array<{ agent: string; reason: string }>;
}

// ─── Keyword patterns ───────────────────────────────────────────────
const INTENT_PATTERNS: Array<{
  intent: UserIntent;
  patterns: RegExp[];
  agent: string;
  tools: string[];
  complexity: 'simple' | 'medium' | 'complex';
}> = [
  {
    intent: 'generate_code',
    patterns: [
      /viết\s+(hàm|function|code|script|app|ứng dụng|component)/i,
      /create\s+(a\s+)?(function|code|script|component|class|module)/i,
      /generate\s+(a\s+)?(function|code|script|component)/i,
      /build\s+(a\s+)?(function|app|component|api|endpoint)/i,
    ],
    agent: 'code',
    tools: ['write_file', 'search_code', 'search_memory'],
    complexity: 'medium',
  },
  {
    intent: 'fix_bug',
    patterns: [
      /sửa|fix|bug|lỗi|error|không chạy|not working|broken/i,
      /why.*(error|not\s+work|crash|fail)/i,
      /debug/i,
    ],
    agent: 'code',
    tools: ['read_file', 'search_code', 'run_lint'],
    complexity: 'medium',
  },
  {
    intent: 'explain_code',
    patterns: [
      /giải thích|explain|what does.*do|how does.*work|mô tả/i,
    ],
    agent: 'general',
    tools: ['read_file', 'search_code'],
    complexity: 'simple',
  },
  {
    intent: 'review_code',
    patterns: [
      /review|kiểm tra|check|đánh giá.*code|code\s*review/i,
    ],
    agent: 'review',
    tools: ['read_file', 'search_code', 'search_memory'],
    complexity: 'medium',
  },
  {
    intent: 'refactor_code',
    patterns: [
      /refactor|cấu trúc lại|tối ưu.*code|cải thiện.*code|clean\s*up/i,
    ],
    agent: 'code',
    tools: ['read_file', 'write_file', 'search_code', 'search_memory'],
    complexity: 'complex',
  },
  {
    intent: 'write_test',
    patterns: [
      /viết\s+(test|kiểm thử|unit\s*test)|write\s+(test|unit\s*test)|add\s+test/i,
    ],
    agent: 'test',
    tools: ['read_file', 'write_file', 'run_lint'],
    complexity: 'medium',
  },
  {
    intent: 'analyze_data',
    patterns: [
      /phân tích|analyze|phân tích dữ liệu|data\s*anal/i,
    ],
    agent: 'finance',
    tools: ['calculate', 'search_memory'],
    complexity: 'medium',
  },
  {
    intent: 'search_info',
    patterns: [
      /tìm|search|find|look\s*up|locate|where\s*is/i,
    ],
    agent: 'general',
    tools: ['search_code', 'search_memory', 'search_graph'],
    complexity: 'simple',
  },
  {
    intent: 'optimize_performance',
    patterns: [
      /tối ưu|optimize|performance|chậm|slow|nhanh hơn|faster|speed/i,
    ],
    agent: 'code',
    tools: ['read_file', 'search_code'],
    complexity: 'complex',
  },
  {
    intent: 'security_audit',
    patterns: [
      /security|bảo mật|audit|lỗ hổng|vulnerability|CVE/i,
    ],
    agent: 'review',
    tools: ['read_file', 'search_graph'],
    complexity: 'high' as any, // deliberately mismatched, will be 'complex'
  },
  {
    intent: 'summarize',
    patterns: [
      /tóm tắt|summarize|tổng kết|recap|overview|briefly/i,
    ],
    agent: 'general',
    tools: [],
    complexity: 'simple',
  },
  {
    intent: 'execute_command',
    patterns: [
      /chạy|run|execute|start|stop|restart|deploy/i,
    ],
    agent: 'code',
    tools: ['get_system_info'],
    complexity: 'medium',
  },
];

// Fix the complexity for security_audit
for (const p of INTENT_PATTERNS) {
  if (p.intent === 'security_audit') p.complexity = 'complex';
}

// ─── Core API ───────────────────────────────────────────────────────

export function classifyIntent(query: string): IntentClassification {
  const queryLower = query.toLowerCase();

  // Keyword-based classification
  let bestMatch: typeof INTENT_PATTERNS[0] | null = null;
  let bestScore = 0;

  for (const pattern of INTENT_PATTERNS) {
    let score = 0;
    for (const regex of pattern.patterns) {
      if (regex.test(queryLower)) score += 1;
    }
    if (score > bestScore) {
      bestScore = score;
      bestMatch = pattern;
    }
  }

  // Secondary intents
  const secondary: IntentClassification['secondaryIntents'] = [];
  for (const pattern of INTENT_PATTERNS) {
    if (pattern === bestMatch) continue;
    let score = 0;
    for (const regex of pattern.patterns) {
      if (regex.test(queryLower)) score += 1;
    }
    if (score > 0) {
      secondary.push({ intent: pattern.intent, confidence: Math.min(0.8, score * 0.3) });
    }
  }
  secondary.sort((a, b) => b.confidence - a.confidence);

  // Language detection
  const hasVietnamese = /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/i.test(query);
  const language = hasVietnamese ? 'vi' : 'en';

  const confidence = bestMatch ? Math.min(0.95, 0.3 + bestScore * 0.2) : 0.3;

  return {
    primaryIntent: bestMatch?.intent || 'general_question',
    confidence,
    secondaryIntents: secondary.slice(0, 3),
    domain: bestMatch?.agent === 'finance' ? 'finance' : 'coding',
    language,
    suggestedAgent: bestMatch?.agent || 'general',
    suggestedTools: bestMatch?.tools || [],
    complexity: bestMatch?.complexity || 'simple',
    estimatedTokens: Math.ceil(query.length / 2),
  };
}

export async function classifyIntentSemantic(query: string): Promise<IntentClassification> {
  // Try keyword first
  const keywordResult = classifyIntent(query);

  // If keyword confidence is high enough, skip AI
  if (keywordResult.confidence >= 0.7) return keywordResult;

  // Fallback to AI semantic classification for ambiguous queries
  try {
    const prompt = `Classify this user query into exactly ONE intent from the list:

QUERY: "${query}"

INTENTS:
- generate_code: writing new code, functions, components
- fix_bug: fixing errors, debugging
- explain_code: explaining how code works
- review_code: reviewing, checking quality
- refactor_code: restructuring, improving code
- write_test: writing tests, unit testing
- analyze_data: data analysis, calculations
- search_info: searching, finding information
- optimize_performance: performance optimization
- security_audit: security review, vulnerability scan
- summarize: summarizing, overview
- general_question: everything else
- execute_command: running commands, deploying

Return format:
INTENT: [intent]
CONFIDENCE: [0-1]
DOMAIN: [coding|finance|general]
COMPLEXITY: [simple|medium|complex]`;

    const result = await dispatchTextThroughFabric(prompt, undefined, { domain: 'general', localFallback: true });

    if (result.winner?.contentPreview) {
      const content = result.winner.contentPreview;
      const intentMatch = content.match(/INTENT:\s*(\w+)/i);
      const confMatch = content.match(/CONFIDENCE:\s*([\d.]+)/i);
      const domainMatch = content.match(/DOMAIN:\s*(\w+)/i);
      const compMatch = content.match(/COMPLEXITY:\s*(\w+)/i);

      const aiIntent = (intentMatch?.[1] || 'general_question') as UserIntent;
      const aiConfidence = parseFloat(confMatch?.[1] || '0.7');

      return {
        ...keywordResult,
        primaryIntent: aiIntent,
        confidence: Math.max(keywordResult.confidence, aiConfidence),
        domain: domainMatch?.[1] || keywordResult.domain,
        complexity: (compMatch?.[1] as any) || keywordResult.complexity,
      };
    }
  } catch { /* fall through to keyword result */ }

  return keywordResult;
}

export function routeIntent(intent: IntentClassification): IntentRouting {
  const agentRoutes: Record<string, { systemPrompt: string }> = {
    'code': { systemPrompt: 'Developer Agent — viết code sạch, type-safe, có error handling.' },
    'test': { systemPrompt: 'QA Agent — viết test đầy đủ, edge case coverage.' },
    'review': { systemPrompt: 'Review Agent — kiểm tra security, performance, practices.' },
    'finance': { systemPrompt: 'Finance Agent — phân tích chính xác, có dẫn chứng số.' },
    'general': { systemPrompt: 'General Agent — trả lời chính xác, hữu ích.' },
    'planner': { systemPrompt: 'Orchestrator — phân tích, lập kế hoạch, phân công.' },
  };

  const route = agentRoutes[intent.suggestedAgent] || agentRoutes.general;

  const alternatives = Object.entries(agentRoutes)
    .filter(([k]) => k !== intent.suggestedAgent)
    .slice(0, 2)
    .map(([agent, cfg]) => ({
      agent,
      reason: `Alternative for when ${intent.suggestedAgent} fails or needs ${agent === 'planner' ? 'higher-level planning' : `specialized ${agent} work`}.`,
    }));

  return {
    intent,
    route: {
      agent: intent.suggestedAgent,
      systemPrompt: route.systemPrompt,
      tools: intent.suggestedTools,
    },
    alternatives,
  };
}
