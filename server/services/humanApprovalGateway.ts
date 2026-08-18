/**
 * humanApprovalGateway.ts
 * ============================================================
 * ENTERPRISE HUMAN APPROVAL GATEWAY FOR HIGH-RISK AI ACTIONS
 *
 * Compliant with:
 * - Singapore Model AI Governance Framework for Agentic AI (2026)
 * - OpenAI Seven Practices (Explicit Human Approval Gates)
 * - NIST AI RMF Human-in-the-Loop Oversight
 */

import { recordAIAction } from './aiActionLedger.ts';

export type ApprovalRiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type ApprovalStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'EXPIRED';

export interface ApprovalRequest {
  requestId: string;
  createdAt: string;
  expiresAt: string;
  requesterAgentId: string;
  requesterRoleId: string;
  domain: string;
  actionType: string;
  riskLevel: ApprovalRiskLevel;
  title: string;
  description: string;
  proposedChanges: Record<string, unknown>;
  status: ApprovalStatus;
  reviewedBy?: string;
  reviewedAt?: string;
  reviewComment?: string;
}

// Configurable high-risk actions requiring mandatory human sign-off
const HIGH_RISK_ACTION_DEFINITIONS: Record<string, { riskLevel: ApprovalRiskLevel; description: string }> = {
  deploy_production_build: {
    riskLevel: 'CRITICAL',
    description: 'Xuất bản và phát hành bản build phần mềm/game lên production.',
  },
  financial_ledger_modify: {
    riskLevel: 'CRITICAL',
    description: 'Sửa đổi, gạch nợ hoặc ghi đè dữ liệu sổ cái kế toán VAS 200.',
  },
  database_schema_alter: {
    riskLevel: 'HIGH',
    description: 'Thay đổi cấu trúc bảng cơ sở dữ liệu SQLite/Postgres.',
  },
  bulk_external_publish: {
    riskLevel: 'HIGH',
    description: 'Đăng video/bài viết tự động hàng loạt lên mạng xã hội.',
  },
  api_key_vault_rotation: {
    riskLevel: 'CRITICAL',
    description: 'Xoay vòng hoặc chỉnh sửa khóa bảo mật trong Vault.',
  },
  shell_unrestricted_exec: {
    riskLevel: 'CRITICAL',
    description: 'Thực thi lệnh terminal cấp hệ điều hành.',
  },
};

const APPROVAL_REQUESTS_STORAGE: ApprovalRequest[] = [];

/**
 * Check if an action requires human approval
 */
export function isActionHighRisk(actionType: string): boolean {
  return Boolean(HIGH_RISK_ACTION_DEFINITIONS[actionType]);
}

/**
 * Request human approval before taking high-risk action
 */
export function submitHumanApprovalRequest(params: {
  requesterAgentId: string;
  requesterRoleId: string;
  domain: string;
  actionType: string;
  title: string;
  description: string;
  proposedChanges?: Record<string, unknown>;
  timeoutMinutes?: number;
}): ApprovalRequest {
  const definition = HIGH_RISK_ACTION_DEFINITIONS[params.actionType] || {
    riskLevel: 'MEDIUM',
    description: params.description,
  };

  const timeout = params.timeoutMinutes || 15; // default 15 mins
  const now = new Date();
  const expiresAt = new Date(now.getTime() + timeout * 60 * 1000).toISOString();

  const request: ApprovalRequest = {
    requestId: `apr_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    createdAt: now.toISOString(),
    expiresAt,
    requesterAgentId: params.requesterAgentId,
    requesterRoleId: params.requesterRoleId,
    domain: params.domain,
    actionType: params.actionType,
    riskLevel: definition.riskLevel,
    title: params.title,
    description: params.description,
    proposedChanges: params.proposedChanges || {},
    status: 'PENDING',
  };

  APPROVAL_REQUESTS_STORAGE.push(request);

  // Record submission in immutable ledger
  recordAIAction({
    agentId: params.requesterAgentId,
    roleId: params.requesterRoleId,
    domain: params.domain,
    actionType: `APPROVAL_REQUESTED:${params.actionType}`,
    targetResource: request.requestId,
    inputPayload: request.proposedChanges,
    outputSummary: `Chờ duyệt từ Solo Founder: ${params.title}`,
    permissionCheckPassed: true,
    constitutionalRulePassed: true,
  });

  // Asynchronously notify Solo Founder on Telegram (non-blocking)
  import('./telegramBot.ts')
    .then(({ notifyApprovalRequest }) => {
      notifyApprovalRequest({
        requestId: request.requestId,
        title: request.title,
        description: request.description,
        riskLevel: request.riskLevel,
        requesterRoleId: request.requesterRoleId,
      }).catch(() => undefined);
    })
    .catch(() => undefined);

  return request;
}

/**
 * Respond to approval request (Solo Founder Decision)
 */
export function respondToApprovalRequest(
  requestId: string,
  decision: 'APPROVED' | 'REJECTED',
  reviewer: string = 'Solo Founder (CEO)',
  comment: string = ''
): ApprovalRequest {
  const req = APPROVAL_REQUESTS_STORAGE.find((r) => r.requestId === requestId);
  if (!req) throw new Error(`Approval request ${requestId} not found.`);

  if (req.status !== 'PENDING') {
    throw new Error(`Approval request ${requestId} is already ${req.status}.`);
  }

  // Check expiration
  if (new Date() > new Date(req.expiresAt)) {
    req.status = 'EXPIRED';
    throw new Error(`Approval request ${requestId} has expired.`);
  }

  req.status = decision;
  req.reviewedBy = reviewer;
  req.reviewedAt = new Date().toISOString();
  req.reviewComment = comment;

  // Record outcome in immutable ledger
  recordAIAction({
    agentId: req.requesterAgentId,
    roleId: req.requesterRoleId,
    domain: req.domain,
    actionType: `APPROVAL_RESOLVED:${decision}`,
    targetResource: req.requestId,
    outputSummary: `${reviewer} đã ${decision === 'APPROVED' ? 'DUYỆT' : 'TỪ CHỐI'}: ${comment || req.title}`,
    permissionCheckPassed: decision === 'APPROVED',
    constitutionalRulePassed: true,
  });

  return req;
}

/**
 * List pending or all approval requests
 */
export function listApprovalRequests(filter?: { status?: ApprovalStatus; limit?: number }): ApprovalRequest[] {
  const now = new Date();
  // Auto-expire past requests
  for (const r of APPROVAL_REQUESTS_STORAGE) {
    if (r.status === 'PENDING' && now > new Date(r.expiresAt)) {
      r.status = 'EXPIRED';
    }
  }

  let list = [...APPROVAL_REQUESTS_STORAGE];
  if (filter?.status) {
    list = list.filter((r) => r.status === filter.status);
  }

  const limit = filter?.limit || 50;
  return list.slice(-limit).reverse();
}

/**
 * Get high-risk action definitions
 */
export function getHighRiskActionDefinitions(): Record<string, { riskLevel: ApprovalRiskLevel; description: string }> {
  return HIGH_RISK_ACTION_DEFINITIONS;
}

/**
 * Reset for testing
 */
export function __resetApprovalRequestsForTesting(): void {
  APPROVAL_REQUESTS_STORAGE.length = 0;
}
