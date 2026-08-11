/**
 * aiWorkforceCockpit.ts
 * ============================================================
 * Executive AI Workforce Cockpit & Autonomy Scoring Engine for LedgerFlow OS.
 *
 * Consolidates real-time telemetry from across the autonomous OS:
 *  - Enterprise Autonomy Score (0 - 100%)
 *  - Agent Performance Ledger (7 roles)
 *  - Circuit Breaker Health
 *  - Auto-Repair Session Metrics
 *  - Monte Carlo Digital Twin Executive Bottlenecks
 */

import { getPerformanceDashboard } from './agentPerformanceLedger.ts';
import { getAgentLoopJobStats } from './agentLoopJobRunner.ts';
import { getCircuitBreakerStatus } from './aiRouter.ts';
import { listAutoRepairSessions } from './agentAutoRepairEngine.ts';
import { listDigitalTwinSimulations } from './businessDigitalTwinSimulator.ts';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface AutonomyScoreBreakdown {
  score: number; // 0 to 100
  rating: 'LEVEL_5_AUTONOMOUS' | 'LEVEL_4_HIGH' | 'LEVEL_3_MODERATE' | 'LEVEL_2_BASIC';
  components: {
    agentSuccessWeight: number; // 40%
    backgroundLoopWeight: number; // 30%
    autoRepairSuccessWeight: number; // 20%
    circuitBreakerHealthWeight: number; // 10%
  };
}

export interface AIWorkforceCockpitOverview {
  autonomyScore: AutonomyScoreBreakdown;
  healthStatus: 'OPTIMAL' | 'DEGRADED' | 'ATTENTION_REQUIRED';
  executiveSummary: string;
  telemetry: {
    totalAgentRuns: number;
    overallSuccessRate: number;
    activeLoopJobs: number;
    completedLoopJobs: number;
    openCircuitBreakers: number;
    autoRepairSessionsCompleted: number;
    simulatedMedianRunwayDays: number;
  };
  executiveAlerts: string[];
  evaluatedAt: string;
}

// ─── Core Engine ──────────────────────────────────────────────────────────────

/**
 * Calculates the Enterprise Autonomy Score and returns Executive Cockpit telemetry.
 */
export function getAIWorkforceCockpitOverview(): AIWorkforceCockpitOverview {
  const perf = getPerformanceDashboard();
  const loopStats = getAgentLoopJobStats();
  const cbStatus = getCircuitBreakerStatus();
  const repairSessions = listAutoRepairSessions(50);
  const simulations = listDigitalTwinSimulations(1);

  // 1. Agent Success Component (40%)
  const agentSuccessRate = perf.overallSuccessRate || 0.85;
  const agentSuccessScore = agentSuccessRate * 40;

  // 2. Background Loop Completion Component (30%)
  const totalLoopJobs = loopStats.completed + loopStats.failed;
  const loopCompletionRate = totalLoopJobs > 0 ? loopStats.completed / totalLoopJobs : 0.90;
  const loopScore = loopCompletionRate * 30;

  // 3. Auto-Repair Component (20%)
  const completedRepairs = repairSessions.filter((s) => s.status === 'completed').length;
  const totalFinishedRepairs = repairSessions.filter((s) => s.status === 'completed' || s.status === 'failed').length;
  const repairSuccessRate = totalFinishedRepairs > 0 ? completedRepairs / totalFinishedRepairs : 0.85;
  const repairScore = repairSuccessRate * 20;

  // 4. Circuit Breaker Health Component (10%)
  const openBreakers = Object.values(cbStatus).filter((cb) => cb.state === 'open').length;
  const breakerScore = openBreakers === 0 ? 10 : Math.max(0, 10 - openBreakers * 5);

  // Total Score (0 - 100)
  const totalScore = Math.round(agentSuccessScore + loopScore + repairScore + breakerScore);

  let rating: AutonomyScoreBreakdown['rating'] = 'LEVEL_4_HIGH';
  if (totalScore >= 90) rating = 'LEVEL_5_AUTONOMOUS';
  else if (totalScore >= 75) rating = 'LEVEL_4_HIGH';
  else if (totalScore >= 60) rating = 'LEVEL_3_MODERATE';
  else rating = 'LEVEL_2_BASIC';

  const autonomyScore: AutonomyScoreBreakdown = {
    score: totalScore,
    rating,
    components: {
      agentSuccessWeight: Math.round(agentSuccessScore),
      backgroundLoopWeight: Math.round(loopScore),
      autoRepairSuccessWeight: Math.round(repairScore),
      circuitBreakerHealthWeight: Math.round(breakerScore),
    },
  };

  // Health Status
  let healthStatus: AIWorkforceCockpitOverview['healthStatus'] = 'OPTIMAL';
  if (openBreakers > 0 || totalScore < 70) healthStatus = 'DEGRADED';
  if (totalScore < 50) healthStatus = 'ATTENTION_REQUIRED';

  // Executive Alerts
  const executiveAlerts: string[] = [];
  if (openBreakers > 0) {
    executiveAlerts.push(`⚡ AI Router: ${openBreakers} provider circuit breaker(s) currently open.`);
  }

  const latestSim = simulations[0];
  if (latestSim && latestSim.bottlenecks.length > 0) {
    latestSim.bottlenecks.forEach((b) => {
      if (b.severity === 'CRITICAL' || b.severity === 'HIGH') {
        executiveAlerts.push(`📈 Digital Twin [Day ${b.day}]: ${b.description}`);
      }
    });
  }

  const summary = [
    `Enterprise Autonomy Score: ${totalScore}% (${rating.replace(/_/g, ' ')}).`,
    `System health status is ${healthStatus}.`,
    `Total AI task executions: ${perf.totalRuns} across ${perf.totalAgentRoles} roles with ${(perf.overallSuccessRate * 100).toFixed(0)}% success rate.`,
  ].join(' ');

  return {
    autonomyScore,
    healthStatus,
    executiveSummary: summary,
    telemetry: {
      totalAgentRuns: perf.totalRuns,
      overallSuccessRate: perf.overallSuccessRate,
      activeLoopJobs: loopStats.running + loopStats.queued,
      completedLoopJobs: loopStats.completed,
      openCircuitBreakers: openBreakers,
      autoRepairSessionsCompleted: completedRepairs,
      simulatedMedianRunwayDays: latestSim?.medianRunwayDays || 180,
    },
    executiveAlerts,
    evaluatedAt: new Date().toISOString(),
  };
}
