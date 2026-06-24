/**
 * aiStrategyEngine.ts
 * ============================================================
 * AI Strategy Engine — phân tích goal, ước lượng effort/cost,
 * đề xuất thứ tự ưu tiên, và sinh kế hoạch hành động.
 *
 * Core: impact/effort matrix, dependency graph, cost estimation,
 * và adaptive re-prioritization.
 */
import { randomUUID } from 'node:crypto';
import { dispatchTextThroughFabric } from './aiFabric';
import { getSnapshot } from './costObservability';
import { getAgenticLoopMetrics } from './agenticLoopEngine';
import { getStats as getMemoryStats } from './compoundMemory';
import { recommendSkills } from './skillRegistry';
import { appendAuditEvent } from './auditLog';

// ─── Types ──────────────────────────────────────────────────────────
export interface StrategicGoal {
  id: string;
  title: string;
  description: string;
  domain: string;
  priority: number;             // 1-10
  impact: 'critical' | 'high' | 'medium' | 'low';
  effort: 'small' | 'medium' | 'large' | 'xlarge';
  estimatedCostUsd: number;
  estimatedTimeMinutes: number;
  dependencies: string[];       // Goal IDs
  status: 'proposed' | 'approved' | 'in_progress' | 'completed' | 'blocked';
  assignedAgent?: string;
  skillsRecommended: string[];
  confidence: number;           // AI confidence in estimate
}

export interface StrategyPlan {
  id: string;
  name: string;
  goals: StrategicGoal[];
  summary: string;
  totalCostUsd: number;
  totalTimeMinutes: number;
  riskFactors: string[];
  timelineEstimate: string;
  generatedAt: string;
  basedOn: {
    systemState: string;
    costSnapshot: { totalCostUsd: number; agentsActive: number };
    memoryRecords: number;
    loopStatus: { completed: number; failed: number; running: number };
  };
}

export interface StrategyAnalysis {
  query: string;
  plan: StrategyPlan;
  recommendations: string[];
  alternativeApproaches: string[];
}

// ─── Core ───────────────────────────────────────────────────────────

export async function analyzeStrategy(query: string): Promise<StrategyAnalysis> {
  const now = new Date();

  // Gather system state
  const [costSnap, loopMetrics, memStats] = await Promise.all([
    Promise.resolve(getSnapshot(30)),
    Promise.resolve(getAgenticLoopMetrics()),
    getMemoryStats().catch(() => ({ totalRecords: 0, session: { count: 0 }, shortTerm: { count: 0 }, longTerm: { count: 0 } })),
  ]);

  const systemState = `
SYSTEM STATE:
- AI Cost (30 days): $${costSnap.totalCostUsd.toFixed(4)}
- Agents active: ${Object.keys(costSnap.byAgent).length}
- Agent loops: ${loopMetrics.completed} completed, ${loopMetrics.failed} failed, ${loopMetrics.running} running
- Memory records: ${memStats.totalRecords} total
- Models used: ${Object.keys(costSnap.byModel).join(', ') || 'none yet'}
- Routes: ${Object.keys(costSnap.byRoute).join(', ') || 'none yet'}
`;

  // Step 1: AI decomposes goal into strategic tasks
  const decompositionPrompt = `Bạn là một AI Strategy Planner. Phân tích goal sau và đề xuất kế hoạch chiến lược.

USER GOAL: ${query}

${systemState}

DECOMPOSE thành 3-5 nhiệm vụ con. Với mỗi nhiệm vụ, đánh giá:
- Impact: critical|high|medium|low
- Effort: small|medium|large|xlarge  
- Estimated cost (USD)
- Estimated time (minutes)
- Dependencies (tên các task khác phụ thuộc vào)
- Recommended skills

Trả lời theo format:
## SUMMARY
[tóm tắt kế hoạch 1-2 câu]

## GOALS
GOAL: [title] | [impact] | [effort] | [cost USD] | [time min] | [deps: a,b] | [skills: x,y] | [confidence 0-1]
Mô tả: [1 câu]

GOAL: ...

## RISKS
- [risk factor]

## RECOMMENDATIONS
- [recommendation]

## ALTERNATIVES
- [alternative approach]`;

  let plan: StrategyPlan | null = null;
  let recommendations: string[] = [];
  let alternativeApproaches: string[] = [];

  try {
    const result = await dispatchTextThroughFabric(
      decompositionPrompt,
      'Bạn là AI Strategy Planner. Phân tích thực tế, không suy đoán nếu thiếu dữ liệu.',
      { domain: 'general', task: 'general', localFallback: true }
    );

    if (result.status === 'completed' && result.winner?.contentPreview) {
      const content = result.winner.contentPreview;

      // Parse summary
      const summary = extractSection(content, 'SUMMARY') || 'No summary available.';

      // Parse goals
      const goals: StrategicGoal[] = [];
      const goalSection = content.match(/## GOALS\s*\n([\s\S]*?)(?=\n## |$)/i);
      if (goalSection) {
        const lines = goalSection[1].split('\n').filter(l => l.toUpperCase().startsWith('GOAL:'));
        for (let i = 0; i < lines.length; i++) {
          const line = lines[i];
          const parts = line.replace(/^GOAL:\s*/i, '').split('|').map(s => s.trim());
          if (parts.length >= 3) {
            goals.push({
              id: `goal_${Date.now()}_${i}`,
              title: parts[0],
              description: lines[i + 1]?.replace(/^Mô tả:\s*/i, '').trim() || '',
              domain: 'general',
              priority: i + 1,
              impact: parseImpact(parts[1]),
              effort: parseEffort(parts[2]),
              estimatedCostUsd: parseFloat(parts[3]) || 0.01,
              estimatedTimeMinutes: parseInt(parts[4]) || 30,
              dependencies: parts[5]?.replace('deps:', '').split(',').map(s => s.trim()).filter(Boolean) || [],
              status: 'proposed',
              skillsRecommended: parts[6]?.replace('skills:', '').split(',').map(s => s.trim()).filter(Boolean) || [],
              confidence: parseFloat(parts[7]) || 0.7,
            });
          }
        }
      }

      // Parse risks
      const riskSection = content.match(/## RISKS?\s*\n([\s\S]*?)(?=\n## |$)/i);
      const riskFactors = riskSection
        ? riskSection[1].split('\n').filter(l => l.trim().startsWith('-')).map(l => l.replace(/^-\s*/, '').trim())
        : [];

      // Parse recommendations
      const recSection = content.match(/## RECOMMENDATIONS?\s*\n([\s\S]*?)(?=\n## |$)/i);
      recommendations = recSection
        ? recSection[1].split('\n').filter(l => l.trim().startsWith('-')).map(l => l.replace(/^-\s*/, '').trim())
        : [];

      // Parse alternatives
      const altSection = content.match(/## ALTERNATIVES?\s*\n([\s\S]*?)(?=\n## |$)/i);
      alternativeApproaches = altSection
        ? altSection[1].split('\n').filter(l => l.trim().startsWith('-')).map(l => l.replace(/^-\s*/, '').trim())
        : [];

      plan = {
        id: `strat_${Date.now()}`,
        name: query.slice(0, 80),
        goals,
        summary,
        totalCostUsd: goals.reduce((s, g) => s + g.estimatedCostUsd, 0),
        totalTimeMinutes: goals.reduce((s, g) => s + g.estimatedTimeMinutes, 0),
        riskFactors,
        timelineEstimate: `${goals.length} goals, ~${Math.round(goals.reduce((s, g) => s + g.estimatedTimeMinutes, 0) / 60)} hours`,
        generatedAt: now.toISOString(),
        basedOn: {
          systemState: systemState.trim(),
          costSnapshot: { totalCostUsd: costSnap.totalCostUsd, agentsActive: Object.keys(costSnap.byAgent).length },
          memoryRecords: memStats.totalRecords,
          loopStatus: { completed: loopMetrics.completed, failed: loopMetrics.failed, running: loopMetrics.running },
        },
      };
    }
  } catch { /* fallback to heuristic */ }

  // Fallback if AI didn't produce valid plan
  if (!plan) {
    plan = heuristicPlan(query, costSnap.totalCostUsd);
  }

  if (recommendations.length === 0) {
    recommendations.push('Bắt đầu với task impact cao nhất và effort nhỏ nhất để có quick win.');
    recommendations.push('Chạy Agent Loop Monitor để theo dõi tiến độ.');
  }

  return { query, plan, recommendations, alternativeApproaches };
}

function heuristicPlan(query: string, currentCost: number): StrategyPlan {
  const now = new Date();
  const goals: StrategicGoal[] = [
    {
      id: `goal_h1`, title: 'Phân tích yêu cầu', description: query.slice(0, 100),
      domain: 'general', priority: 1, impact: 'high', effort: 'small',
      estimatedCostUsd: 0.01, estimatedTimeMinutes: 15,
      dependencies: [], status: 'proposed', skillsRecommended: [], confidence: 0.6,
    },
    {
      id: `goal_h2`, title: 'Implement giải pháp', description: `Triển khai dựa trên phân tích.`,
      domain: 'coding', priority: 2, impact: 'critical', effort: 'medium',
      estimatedCostUsd: 0.05, estimatedTimeMinutes: 60,
      dependencies: ['goal_h1'], status: 'proposed', skillsRecommended: ['code-generator'], confidence: 0.6,
    },
    {
      id: `goal_h3`, title: 'Kiểm tra và tối ưu', description: 'Chạy test, review, và tối ưu.',
      domain: 'coding', priority: 3, impact: 'medium', effort: 'small',
      estimatedCostUsd: 0.02, estimatedTimeMinutes: 30,
      dependencies: ['goal_h2'], status: 'proposed', skillsRecommended: ['code-reviewer', 'test-writer'], confidence: 0.6,
    },
  ];

  return {
    id: `strat_h_${Date.now()}`,
    name: query.slice(0, 80),
    goals,
    summary: 'Heuristic plan (AI unavailable). Đề xuất: Phân tích → Implement → Kiểm tra.',
    totalCostUsd: 0.08,
    totalTimeMinutes: 105,
    riskFactors: ['Không có đủ dữ liệu để ước lượng chính xác.'],
    timelineEstimate: '3 goals, ~2 hours',
    generatedAt: now.toISOString(),
    basedOn: {
      systemState: 'Heuristic fallback',
      costSnapshot: { totalCostUsd: currentCost, agentsActive: 0 },
      memoryRecords: 0,
      loopStatus: { completed: 0, failed: 0, running: 0 },
    },
  };
}

function extractSection(content: string, name: string): string | null {
  const regex = new RegExp(`## ${name}\\s*\\n([\\s\\S]*?)(?=\n## |$)`, 'i');
  const match = content.match(regex);
  return match ? match[1].trim() : null;
}

function parseImpact(v: string): 'critical' | 'high' | 'medium' | 'low' {
  const l = v.toLowerCase();
  if (l.includes('critical')) return 'critical';
  if (l.includes('high')) return 'high';
  if (l.includes('medium')) return 'medium';
  return 'low';
}

function parseEffort(v: string): 'small' | 'medium' | 'large' | 'xlarge' {
  const l = v.toLowerCase();
  if (l.includes('xlarge') || l.includes('x-large')) return 'xlarge';
  if (l.includes('large')) return 'large';
  if (l.includes('medium')) return 'medium';
  return 'small';
}
