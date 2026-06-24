/**
 * agentAnalytics.ts
 * ============================================================
 * Agent Behavior Analytics — phân tích pattern quyết định
 * của agent theo thời gian: success rate, best model/route,
 * common failure patterns, và trend dự báo.
 */
import { getSnapshot, getDailyCosts, getRecords } from './costObservability';
import { getStats as getMemoryStats } from './compoundMemory';
import { getAgenticLoopMetrics } from './agenticLoopEngine';
import fs from 'fs';
import path from 'path';

// ─── Types ──────────────────────────────────────────────────────────
export interface AgentPerformanceScore {
  agent: string;
  totalCalls: number;
  successRate: number;
  avgLatencyMs: number;
  totalCostUsd: number;
  costPerCall: number;
  trend: 'improving' | 'stable' | 'declining';
}

export interface ModelComparison {
  model: string;
  calls: number;
  successRate: number;
  avgLatencyMs: number;
  costPer1KCalls: number;
  bestFor: string[];
}

export interface RouteAnalysis {
  route: string;
  calls: number;
  successRate: number;
  avgLatencyMs: number;
  costSaving: number; // So với route đắt nhất
}

export interface FailurePattern {
  pattern: string;
  agent: string;
  domain: string;
  occurrences: number;
  lastOccurred: string;
  recommendedFix: string;
}

export interface AnalyticsReport {
  generatedAt: string;
  period: { from: string; to: string; days: number };
  agentPerformance: AgentPerformanceScore[];
  modelComparison: ModelComparison[];
  routeAnalysis: RouteAnalysis[];
  failurePatterns: FailurePattern[];
  usageTrend: Array<{ date: string; calls: number; cost: number; successRate: number }>;
  recommendations: string[];
}

// ─── Core ───────────────────────────────────────────────────────────

export async function generateAnalyticsReport(days = 30): Promise<AnalyticsReport> {
  const now = new Date();
  const from = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

  const [costSnap, dailyCosts, costRecords, memStats, loopMetrics] = await Promise.all([
    Promise.resolve(getSnapshot(days)),
    Promise.resolve(getDailyCosts(Math.min(days, 30))),
    Promise.resolve(getRecords(Math.min(days * 10, 500))),
    getMemoryStats().catch(() => ({ totalRecords: 0, session: { count: 0 }, shortTerm: { count: 0 }, longTerm: { count: 0 } })),
    Promise.resolve(getAgenticLoopMetrics()),
  ]);

  // 1. Agent performance
  const agentPerformance: AgentPerformanceScore[] = [];
  for (const [agent, data] of Object.entries(costSnap.byAgent)) {
    const agentRecords = costRecords.filter((r: any) => r.agent === agent);
    const successCount = agentRecords.filter((r: any) => r.success).length;
    const totalForAgent = agentRecords.length || data.calls;
    const successRate = totalForAgent > 0 ? successCount / totalForAgent : 1;

    // Trend: compare first half vs second half
    const mid = Math.floor(agentRecords.length / 2);
    const firstHalf = agentRecords.slice(0, mid);
    const secondHalf = agentRecords.slice(mid);
    const firstRate = firstHalf.length > 0 ? firstHalf.filter((r: any) => r.success).length / firstHalf.length : 1;
    const secondRate = secondHalf.length > 0 ? secondHalf.filter((r: any) => r.success).length / secondHalf.length : 1;

    let trend: AgentPerformanceScore['trend'] = 'stable';
    if (secondRate > firstRate + 0.05) trend = 'improving';
    else if (secondRate < firstRate - 0.05) trend = 'declining';

    agentPerformance.push({
      agent,
      totalCalls: totalForAgent,
      successRate: +(successRate * 100).toFixed(1),
      avgLatencyMs: data.avgLatencyMs,
      totalCostUsd: +data.cost.toFixed(4),
      costPerCall: data.calls > 0 ? +(data.cost / data.calls).toFixed(6) : 0,
      trend,
    });
  }
  agentPerformance.sort((a, b) => b.totalCalls - a.totalCalls);

  // 2. Model comparison
  const modelComparison: ModelComparison[] = [];
  for (const [model, data] of Object.entries(costSnap.byModel)) {
    const modelRecords = costRecords.filter((r: any) => r.model === model);
    const successCount = modelRecords.filter((r: any) => r.success).length;
    const successRate = modelRecords.length > 0 ? successCount / modelRecords.length : 1;

    // Which domains is this model best for?
    const domainSuccess: Record<string, { success: number; total: number }> = {};
    for (const r of modelRecords) {
      const d = (r as any).domain || 'general';
      if (!domainSuccess[d]) domainSuccess[d] = { success: 0, total: 0 };
      domainSuccess[d].total++;
      if ((r as any).success) domainSuccess[d].success++;
    }
    const bestFor = Object.entries(domainSuccess)
      .filter(([, v]) => v.total >= 2 && v.success / v.total >= 0.8)
      .map(([k]) => k)
      .slice(0, 3);

    modelComparison.push({
      model,
      calls: data.calls,
      successRate: +(successRate * 100).toFixed(1),
      avgLatencyMs: costSnap.byAgent[Object.keys(costSnap.byAgent)[0]]?.avgLatencyMs || 0,
      costPer1KCalls: data.calls > 0 ? +((data.cost / data.calls) * 1000).toFixed(4) : 0,
      bestFor,
    });
  }
  modelComparison.sort((a, b) => b.calls - a.calls);

  // 3. Route analysis
  const routeAnalysis: RouteAnalysis[] = [];
  const maxCost = Math.max(...Object.values(costSnap.byRoute).map((d: any) => d.cost / Math.max(d.calls, 1)), 0.001);
  for (const [route, data] of Object.entries(costSnap.byRoute)) {
    const routeRecords = costRecords.filter((r: any) => r.route === route);
    const successCount = routeRecords.filter((r: any) => r.success).length;
    const avgCost = (data as any).calls > 0 ? (data as any).cost / (data as any).calls : 0;
    routeAnalysis.push({
      route,
      calls: (data as any).calls,
      successRate: (data as any).calls > 0 ? +(successCount / (data as any).calls * 100).toFixed(1) : 0,
      avgLatencyMs: 0,
      costSaving: +(maxCost - avgCost).toFixed(6),
    });
  }
  routeAnalysis.sort((a, b) => b.calls - a.calls);

  // 4. Failure patterns
  const failurePatterns: FailurePattern[] = [];
  const failures = costRecords.filter((r: any) => !r.success);
  const patternMap = new Map<string, { agent: string; domain: string; occurrences: number; lastOccurred: string }>();

  for (const f of failures) {
    const task = ((f as any).taskSummary || '').slice(0, 40).toLowerCase();
    const key = `${(f as any).agent}:${task || 'unknown'}`;
    const existing = patternMap.get(key);
    if (existing) {
      existing.occurrences++;
      existing.lastOccurred = (f as any).recordedAt;
    } else {
      patternMap.set(key, {
        agent: (f as any).agent,
        domain: (f as any).domain || 'general',
        occurrences: 1,
        lastOccurred: (f as any).recordedAt,
      });
    }
  }

  for (const [pattern, data] of patternMap) {
    if (data.occurrences < 2) continue;
    failurePatterns.push({
      pattern,
      ...data,
      recommendedFix: generateRecommendation(data.agent, data.domain),
    });
  }
  failurePatterns.sort((a, b) => b.occurrences - a.occurrences);

  // 5. Usage trend
  const usageTrend = dailyCosts.map(d => {
    const dayRecords = costRecords.filter((r: any) => (r as any).recordedAt?.startsWith(d.date));
    const successCount = dayRecords.filter((r: any) => r.success).length;
    return {
      date: d.date,
      calls: d.calls,
      cost: d.cost,
      successRate: dayRecords.length > 0 ? +(successCount / dayRecords.length * 100).toFixed(1) : 0,
    };
  });

  // 6. Recommendations
  const recommendations: string[] = [];

  // Low success rate agent
  for (const ap of agentPerformance) {
    if (ap.successRate < 70 && ap.totalCalls >= 5) {
      recommendations.push(`${ap.agent}: success rate thấp (${ap.successRate}%). Cân nhắc chuyển model mạnh hơn hoặc thêm context.`);
    }
  }

  // Trending down
  for (const ap of agentPerformance) {
    if (ap.trend === 'declining' && ap.totalCalls >= 5) {
      recommendations.push(`${ap.agent}: đang suy giảm. Kiểm tra prompt quality và memory context.`);
    }
  }

  // Memory growth
  if (memStats.totalRecords > 50 && memStats.longTerm.count === 0) {
    recommendations.push(`Memory có ${memStats.totalRecords} records nhưng chưa có long-term. Chạy curator để chọn lọc.`);
  }

  // Loop failures
  if (loopMetrics.failed > 0) {
    recommendations.push(`${loopMetrics.failed} agentic loop thất bại. Kiểm tra Agent Loop Monitor.`);
  }

  // Cost efficiency
  const expensiveModel = modelComparison.find(m => m.costPer1KCalls > 5);
  if (expensiveModel) {
    recommendations.push(`${expensiveModel.model} đắt (${expensiveModel.costPer1KCalls.toFixed(2)}/1K calls). Thử model rẻ hơn nếu chất lượng tương đương.`);
  }

  if (recommendations.length === 0) {
    recommendations.push('Hệ thống đang chạy tốt. Các chỉ số đều ổn định.');
  }

  return {
    generatedAt: now.toISOString(),
    period: { from: from.toISOString(), to: now.toISOString(), days },
    agentPerformance,
    modelComparison,
    routeAnalysis,
    failurePatterns: failurePatterns.slice(0, 10),
    usageTrend,
    recommendations: recommendations.slice(0, 8),
  };
}

function generateRecommendation(agent: string, domain: string): string {
  const fixes: Record<string, string> = {
    'fabric': 'Kiểm tra API keys còn hạn. Fabric có thể cần fallback route.',
    'agentic-loop': 'Xem chi tiết từng bước trong Agent Loop Monitor. Bước nào thường fail?',
    'multi-agent': 'Kiểm tra agent specs và domain routing.',
  };
  return fixes[agent] || `Phân tích lỗi trong domain "${domain}" để tối ưu context.`;
}
