/**
 * dynamicRiskMatrix.ts
 * ============================================================
 * Centralized Dynamic Risk Assessment Matrix for LedgerFlow Studio.
 *
 * Evaluates risk for AI agent tool calls, system shell operations,
 * git actions, financial transactions, and physical robot motion.
 *
 * Integrates with agentPerformanceLedger:
 * Highly trusted agents (success rate > 85%, runs > 10) get
 * dynamic risk reduction for non-critical operations.
 */

import { getAgentPerformanceStats } from './agentPerformanceLedger.ts';

export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type RiskPolicyDecision =
  | 'AUTO_EXECUTE'               // Run immediately without intervention
  | 'AUDIT_LOG_ONLY'             // Run automatically + record high-priority audit event
  | 'TELEGRAM_APPROVAL_REQUIRED' // Pause execution, send 1-click approval to Telegram/UI
  | 'HARD_BLOCKED';              // Blocked under all circumstances (safety violation)

export interface ActionRiskRule {
  actionId: string;
  category: 'read' | 'write' | 'shell' | 'git' | 'finance' | 'robot' | 'system';
  baseRisk: RiskLevel;
  allowAutoDowngrade?: boolean; // If true, experienced agents can reduce risk by 1 level
  description: string;
  defaultDecision: RiskPolicyDecision;
}

export interface RiskAssessmentContext {
  actionId: string;
  category?: ActionRiskRule['category'];
  agentRole?: string;
  domain?: string;
  environment?: 'sandbox' | 'local' | 'staging' | 'production';
  payload?: Record<string, unknown>;
}

export interface RiskAssessmentResult {
  actionId: string;
  category: ActionRiskRule['category'];
  baseRisk: RiskLevel;
  effectiveRisk: RiskLevel;
  decision: RiskPolicyDecision;
  reasons: string[];
  agentTrustBonus: boolean;
  evaluatedAt: string;
}

// ─── Default Rule Registry ───────────────────────────────────────────────────

const DEFAULT_RISK_RULES: Record<string, ActionRiskRule> = {
  // Read operations (LOW risk)
  'read_file': { actionId: 'read_file', category: 'read', baseRisk: 'LOW', allowAutoDowngrade: true, description: 'Read local file content', defaultDecision: 'AUTO_EXECUTE' },
  'search_code': { actionId: 'search_code', category: 'read', baseRisk: 'LOW', allowAutoDowngrade: true, description: 'Codebase search', defaultDecision: 'AUTO_EXECUTE' },
  'get_system_status': { actionId: 'get_system_status', category: 'read', baseRisk: 'LOW', allowAutoDowngrade: true, description: 'Read system status', defaultDecision: 'AUTO_EXECUTE' },
  'read_audit_logs': { actionId: 'read_audit_logs', category: 'read', baseRisk: 'LOW', allowAutoDowngrade: true, description: 'Read audit events', defaultDecision: 'AUTO_EXECUTE' },

  // Write operations (MEDIUM risk)
  'write_file': { actionId: 'write_file', category: 'write', baseRisk: 'MEDIUM', allowAutoDowngrade: true, description: 'Write or modify local source file', defaultDecision: 'AUTO_EXECUTE' },
  'edit_file': { actionId: 'edit_file', category: 'write', baseRisk: 'MEDIUM', allowAutoDowngrade: true, description: 'Edit specific lines of source file', defaultDecision: 'AUTO_EXECUTE' },
  'run_lint': { actionId: 'run_lint', category: 'write', baseRisk: 'LOW', allowAutoDowngrade: true, description: 'Run linter / formatter', defaultDecision: 'AUTO_EXECUTE' },
  'run_test': { actionId: 'run_test', category: 'write', baseRisk: 'LOW', allowAutoDowngrade: true, description: 'Run unit test suite', defaultDecision: 'AUTO_EXECUTE' },

  // Git operations
  'github_create_draft_pr': { actionId: 'github_create_draft_pr', category: 'git', baseRisk: 'MEDIUM', allowAutoDowngrade: true, description: 'Create draft pull request', defaultDecision: 'AUDIT_LOG_ONLY' },
  'github_push_main': { actionId: 'github_push_main', category: 'git', baseRisk: 'CRITICAL', allowAutoDowngrade: false, description: 'Direct push to main branch', defaultDecision: 'HARD_BLOCKED' },
  'github_delete_repo': { actionId: 'github_delete_repo', category: 'git', baseRisk: 'CRITICAL', allowAutoDowngrade: false, description: 'Delete GitHub repository', defaultDecision: 'HARD_BLOCKED' },

  // Shell & System execution
  'run_command': { actionId: 'run_command', category: 'shell', baseRisk: 'HIGH', allowAutoDowngrade: false, description: 'Execute arbitrary terminal shell command', defaultDecision: 'TELEGRAM_APPROVAL_REQUIRED' },
  'env_update_secret': { actionId: 'env_update_secret', category: 'system', baseRisk: 'CRITICAL', allowAutoDowngrade: false, description: 'Modify environment secrets or API vault', defaultDecision: 'TELEGRAM_APPROVAL_REQUIRED' },

  // Finance operations
  'financial_payout': { actionId: 'financial_payout', category: 'finance', baseRisk: 'HIGH', allowAutoDowngrade: false, description: 'Execute payout or transfer', defaultDecision: 'TELEGRAM_APPROVAL_REQUIRED' },
  'financial_reconcile': { actionId: 'financial_reconcile', category: 'finance', baseRisk: 'MEDIUM', allowAutoDowngrade: true, description: 'Auto-reconcile VAS ledger entry', defaultDecision: 'AUDIT_LOG_ONLY' },

  // Robot motion
  'robot_move': { actionId: 'robot_move', category: 'robot', baseRisk: 'HIGH', allowAutoDowngrade: false, description: 'Physical robot movement', defaultDecision: 'TELEGRAM_APPROVAL_REQUIRED' },
  'robot_stop': { actionId: 'robot_stop', category: 'robot', baseRisk: 'LOW', allowAutoDowngrade: false, description: 'Emergency stop robot', defaultDecision: 'AUTO_EXECUTE' },
};

const RISK_LEVEL_WEIGHTS: Record<RiskLevel, number> = {
  LOW: 1,
  MEDIUM: 2,
  HIGH: 3,
  CRITICAL: 4,
};

const WEIGHT_TO_RISK_LEVEL: Record<number, RiskLevel> = {
  1: 'LOW',
  2: 'MEDIUM',
  3: 'HIGH',
  4: 'CRITICAL',
};

// ─── Core Assessment Function ─────────────────────────────────────────────────

/**
 * Evaluates the risk level and policy decision for an action.
 */
export function assessActionRisk(context: RiskAssessmentContext): RiskAssessmentResult {
  const actionId = context.actionId;
  const rule = DEFAULT_RISK_RULES[actionId] || {
    actionId,
    category: context.category || 'system',
    baseRisk: 'HIGH',
    allowAutoDowngrade: false,
    description: `Custom action: ${actionId}`,
    defaultDecision: 'TELEGRAM_APPROVAL_REQUIRED',
  };

  const reasons: string[] = [`Action "${actionId}" base risk is ${rule.baseRisk} (${rule.description}).`];
  let riskWeight = RISK_LEVEL_WEIGHTS[rule.baseRisk];
  let agentTrustBonus = false;

  // 1. Check Agent Performance Ledger for trust bonus
  if (rule.allowAutoDowngrade && context.agentRole) {
    try {
      const stats = getAgentPerformanceStats(context.agentRole, context.domain);
      const primaryStat = stats[0];
      if (primaryStat && primaryStat.totalRuns >= 10 && primaryStat.successRate >= 0.85) {
        agentTrustBonus = true;
        riskWeight = Math.max(1, riskWeight - 1);
        reasons.push(
          `Agent "${context.agentRole}" has high trust record (${(primaryStat.successRate * 100).toFixed(0)}% success over ${primaryStat.totalRuns} runs). Risk downgraded by 1 level.`
        );
      }
    } catch {
      // Ledger optional
    }
  }

  // 2. Adjust for Environment
  const env = context.environment || 'local';
  if (env === 'sandbox') {
    riskWeight = Math.max(1, riskWeight - 1);
    reasons.push('Environment is "sandbox": Risk downgraded by 1 level.');
  } else if (env === 'production') {
    if (rule.baseRisk !== 'CRITICAL') {
      riskWeight = Math.min(4, riskWeight + 1);
      reasons.push('Environment is "production": Risk elevated by 1 level.');
    }
  }

  // 3. Inspect Payload for Dangerous Patterns
  if (context.payload) {
    const payloadStr = JSON.stringify(context.payload).toLowerCase();
    if (payloadStr.includes('rm -rf') || payloadStr.includes('drop database') || payloadStr.includes('format c:')) {
      riskWeight = 4;
      reasons.push('CRITICAL: Payload contains destructive command pattern (rm -rf / drop database). Elevated to CRITICAL.');
    }
  }

  const effectiveRisk = WEIGHT_TO_RISK_LEVEL[riskWeight] || 'HIGH';

  // 4. Map Effective Risk to Policy Decision
  let decision: RiskPolicyDecision;

  if (effectiveRisk === 'CRITICAL') {
    // Check if hard blocked
    if (rule.defaultDecision === 'HARD_BLOCKED' || (context.payload && JSON.stringify(context.payload).includes('rm -rf'))) {
      decision = 'HARD_BLOCKED';
      reasons.push('Policy: Action is strictly hard-blocked due to destructive impact.');
    } else {
      decision = 'TELEGRAM_APPROVAL_REQUIRED';
      reasons.push('Policy: Critical action requires mandatory human/Telegram approval.');
    }
  } else if (effectiveRisk === 'HIGH') {
    decision = 'TELEGRAM_APPROVAL_REQUIRED';
    reasons.push('Policy: High risk action requires Telegram or UI approval gate.');
  } else if (effectiveRisk === 'MEDIUM') {
    decision = 'AUDIT_LOG_ONLY';
    reasons.push('Policy: Medium risk action executes automatically with detailed audit logging.');
  } else {
    decision = 'AUTO_EXECUTE';
    reasons.push('Policy: Low risk action executes automatically.');
  }

  return {
    actionId,
    category: rule.category,
    baseRisk: rule.baseRisk,
    effectiveRisk,
    decision,
    reasons,
    agentTrustBonus,
    evaluatedAt: new Date().toISOString(),
  };
}

/**
 * Returns all registered risk rules.
 */
export function getRiskMatrixRegistry(): ActionRiskRule[] {
  return Object.values(DEFAULT_RISK_RULES);
}
