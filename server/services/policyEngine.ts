/**
 * policyEngine.ts
 * ============================================================
 * UNIFIED GLACIA POLICY ENGINE
 * ------------------------------------------------------------
 * Single source of truth for:
 * 1. Role-Based Access Control (RBAC)
 * 2. Glacia Autonomy Levels & Trust Gate (L0 -> L4)
 * 3. Automation Safety Envelope & Human-in-the-Loop Checkpoints
 * 4. Emergency Lockout Protocol
 * ============================================================
 */

import {
  ROLE_POLICIES,
  type UserRole,
  type WorkspaceModuleId,
  type RolePolicy,
  canAccessWorkspace,
  canApproveExpense,
  listRolePolicies,
} from './rbacEngine.ts';

import {
  AUTONOMY_SPECS,
  type AutonomyLevel,
  type AutonomyState,
  loadAutonomyState,
  saveAutonomyState,
  validateActionPermission,
  adjustTrustScore,
  setAutonomyLevel,
} from './glaciaAutonomyGate.ts';

import {
  validateAutomationSafetyEnvelope,
  type AutomationSafetyPlan,
  type AutomationSafetyDecision,
} from './automationSafetyEnvelope.ts';

import { GlaciaError } from './glaciaError.ts';

// ─── Types ─────────────────────────────────────────────────────────────────────

export type PolicyDecision = 'ALLOWED' | 'DENIED' | 'REQUIRES_APPROVAL' | 'LAB_ONLY';
export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';

export interface PolicyEvaluationRequest {
  principal: {
    id: string;
    role: UserRole | string;
    email?: string;
  };
  action: string;
  target?: string;
  riskLevel?: RiskLevel;
  autonomyAction?: string;
  safetyPlan?: AutomationSafetyPlan;
  metadata?: Record<string, unknown>;
}

export interface PolicyEvaluationResult {
  decision: PolicyDecision;
  allowed: boolean;
  requiresHumanApproval: boolean;
  enforcedBy: 'RBAC' | 'AUTONOMY_GATE' | 'SAFETY_ENVELOPE' | 'EMERGENCY_LOCKOUT' | 'DEFAULT';
  reason: string;
  currentAutonomyLevel: AutonomyLevel;
  trustScore: number;
  safetyDecision?: AutomationSafetyDecision;
  evaluatedAt: string;
}

// ─── High Risk Actions List ────────────────────────────────────────────────────

const HIGH_RISK_ACTIONS = new Set<string>([
  'destructive_actions',
  'file_delete',
  'db_drop',
  'live_production_deploy',
  'secret_vault_modify',
  'secret_vault_export',
  'execute_arbitrary_shell',
  'git_force_push',
]);

const REQUIRE_APPROVAL_ACTIONS = new Set<string>([
  'git_push',
  'db_write',
  'multi_step_dag',
  'live_deploy',
  'execute_code_unboxed',
]);

// ─── Policy Engine Implementation ──────────────────────────────────────────────

export class PolicyEngine {
  private static instance: PolicyEngine | null = null;

  public static getInstance(): PolicyEngine {
    if (!PolicyEngine.instance) {
      PolicyEngine.instance = new PolicyEngine();
    }
    return PolicyEngine.instance;
  }

  /**
   * Unified policy evaluation across RBAC, Autonomy Levels, and Safety Envelope.
   */
  public evaluate(req: PolicyEvaluationRequest): PolicyEvaluationResult {
    const autonomyState = loadAutonomyState();
    const evaluatedAt = new Date().toISOString();

    // 1. Emergency Lockout Check
    if (autonomyState.emergencyLockout) {
      return {
        decision: 'DENIED',
        allowed: false,
        requiresHumanApproval: true,
        enforcedBy: 'EMERGENCY_LOCKOUT',
        reason: 'Hệ thống đang kích hoạt chế độ Khóa Khẩn cấp (Emergency Lockout). Mọi hoạt động tự trị bị đình chỉ.',
        currentAutonomyLevel: autonomyState.currentLevel,
        trustScore: autonomyState.trustScore,
        evaluatedAt,
      };
    }

    const principalRole = (req.principal.role || 'viewer') as UserRole;
    const isOwner = principalRole === 'owner' || req.principal.email === 'davidbao1704@gmail.com';

    // 2. High Risk / Destructive Check (Owner only or strict human approval)
    const isHighRisk =
      req.riskLevel === 'critical' ||
      req.riskLevel === 'high' ||
      HIGH_RISK_ACTIONS.has(req.action);

    if (isHighRisk && !isOwner) {
      return {
        decision: 'REQUIRES_APPROVAL',
        allowed: false,
        requiresHumanApproval: true,
        enforcedBy: 'RBAC',
        reason: `Hành động nguy cơ cao [${req.action}] yêu cầu Founder & CEO David Bao phê duyệt trực tiếp.`,
        currentAutonomyLevel: autonomyState.currentLevel,
        trustScore: autonomyState.trustScore,
        evaluatedAt,
      };
    }

    // 3. Safety Envelope Check (if Automation Safety Plan provided)
    if (req.safetyPlan) {
      const safetyDec = validateAutomationSafetyEnvelope(req.safetyPlan);
      if (!safetyDec.approved) {
        return {
          decision: safetyDec.mode === 'blocked' ? 'DENIED' : 'REQUIRES_APPROVAL',
          allowed: false,
          requiresHumanApproval: safetyDec.humanCheckpointRequired,
          enforcedBy: 'SAFETY_ENVELOPE',
          reason: `Ranh giới an toàn từ chối hoặc yêu cầu kiểm duyệt: ${safetyDec.issues.join('; ')}`,
          currentAutonomyLevel: autonomyState.currentLevel,
          trustScore: autonomyState.trustScore,
          safetyDecision: safetyDec,
          evaluatedAt,
        };
      }
    }

    // 4. Glacia Autonomy Gate Check (if action is requested by an autonomous agent)
    const actionToCheck = req.autonomyAction || req.action;
    const autonomyGateResult = validateActionPermission(actionToCheck);

    if (!autonomyGateResult.allowed && !isOwner) {
      return {
        decision: 'REQUIRES_APPROVAL',
        allowed: false,
        requiresHumanApproval: true,
        enforcedBy: 'AUTONOMY_GATE',
        reason: autonomyGateResult.reason,
        currentAutonomyLevel: autonomyGateResult.currentLevel,
        trustScore: autonomyState.trustScore,
        evaluatedAt,
      };
    }

    // 5. Actions requiring human approval checkpoint
    if (REQUIRE_APPROVAL_ACTIONS.has(req.action) && autonomyState.currentLevel < 3 && !isOwner) {
      return {
        decision: 'REQUIRES_APPROVAL',
        allowed: false,
        requiresHumanApproval: true,
        enforcedBy: 'AUTONOMY_GATE',
        reason: `Tác vụ [${req.action}] yêu cầu xác nhận 1 chạm từ CEO ở cấp độ tự trị hiện tại (${autonomyGateResult.currentLevelName}).`,
        currentAutonomyLevel: autonomyState.currentLevel,
        trustScore: autonomyState.trustScore,
        evaluatedAt,
      };
    }

    // 6. Action Allowed
    return {
      decision: 'ALLOWED',
      allowed: true,
      requiresHumanApproval: false,
      enforcedBy: 'DEFAULT',
      reason: isOwner
        ? 'Phê chuẩn bởi quyền hạn Solo Founder / Owner.'
        : `Phê chuẩn hợp lệ theo chính sách Cấp độ ${autonomyState.currentLevel}.`,
      currentAutonomyLevel: autonomyState.currentLevel,
      trustScore: autonomyState.trustScore,
      evaluatedAt,
    };
  }

  /**
   * Enforce policy evaluation: throws GlaciaError if not allowed
   */
  public enforce(req: PolicyEvaluationRequest): PolicyEvaluationResult {
    const result = this.evaluate(req);
    if (!result.allowed) {
      const code = result.requiresHumanApproval
        ? 'GLACIA_APPROVAL_REQUIRED'
        : 'GLACIA_POLICY_VIOLATION';
      throw new GlaciaError(result.reason, {
        code,
        component: 'PolicyEngine',
        details: {
          action: req.action,
          enforcedBy: result.enforcedBy,
          currentLevel: result.currentAutonomyLevel,
        },
      });
    }
    return result;
  }

  /**
   * Quick check if current autonomy state allows execution
   */
  public canExecuteAutonomousAction(actionType: string): boolean {
    const result = this.evaluate({
      principal: { id: 'glacia-agent', role: 'ai_agent' },
      action: actionType,
      autonomyAction: actionType,
    });
    return result.allowed;
  }
}

export const policyEngine = PolicyEngine.getInstance();

// ─── Re-exports for Full Backward Compatibility ────────────────────────────────
export {
  ROLE_POLICIES,
  type UserRole,
  type WorkspaceModuleId,
  type RolePolicy,
  canAccessWorkspace,
  canApproveExpense,
  listRolePolicies,
  AUTONOMY_SPECS,
  type AutonomyLevel,
  type AutonomyState,
  loadAutonomyState,
  saveAutonomyState,
  validateActionPermission,
  adjustTrustScore,
  setAutonomyLevel,
  validateAutomationSafetyEnvelope,
  validateAutomationSafetyEnvelope as evaluateAutomationSafety,
  type AutomationSafetyPlan,
  type AutomationSafetyDecision,
};
