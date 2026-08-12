/**
 * server/services/approvalStateMachine.ts
 * ============================================================
 * Enterprise Approval Workflow State Machine.
 *
 * Implements strict, immutable 6-stage lifecycle for business documents:
 *   1. DRAFT       (Dự thảo)
 *   2. SUBMITTED   (Đã trình ký)
 *   3. CHECKED     (Đã kiểm tra / Thẩm định)
 *   4. APPROVED    (Đã phê duyệt)
 *   5. PAID        (Đã thanh toán / Thực thi)
 *   6. ARCHIVED    (Đã lưu trữ kiểm toán)
 *
 * Emits Audit Trail Logs & Company OS Events on every state transition.
 */

import { appendAuditEvent } from './auditLog.ts';
import { appendCompanyOsEvent } from './companyOsControlPlane.ts';

export type ApprovalState = 'DRAFT' | 'SUBMITTED' | 'CHECKED' | 'APPROVED' | 'PAID' | 'ARCHIVED' | 'REJECTED';

export interface ApprovalHistoryEntry {
  fromState: ApprovalState;
  toState: ApprovalState;
  actor: string;
  timestamp: string;
  comment?: string;
}

export interface ApprovalRequest {
  id: string;
  documentType: 'PAYMENT_REQUEST' | 'CONTRACT' | 'QUOTATION' | 'ADVANCE_REQUEST' | 'RELEASE_CHECKLIST';
  documentNo: string;
  title: string;
  amountVnd?: number;
  requester: string;
  currentState: ApprovalState;
  history: ApprovalHistoryEntry[];
  createdAt: string;
  updatedAt: string;
}

const approvalStore = new Map<string, ApprovalRequest>();

const VALID_TRANSITIONS: Record<ApprovalState, ApprovalState[]> = {
  DRAFT: ['SUBMITTED', 'REJECTED'],
  SUBMITTED: ['CHECKED', 'REJECTED', 'DRAFT'],
  CHECKED: ['APPROVED', 'REJECTED', 'SUBMITTED'],
  APPROVED: ['PAID', 'ARCHIVED', 'REJECTED'],
  PAID: ['ARCHIVED'],
  ARCHIVED: [], // Terminal state
  REJECTED: ['DRAFT', 'SUBMITTED'], // Can be revised back to draft or re-submitted
};

/**
 * Create a new approval request
 */
export async function createApprovalRequest(
  documentType: ApprovalRequest['documentType'],
  documentNo: string,
  title: string,
  requester: string,
  amountVnd?: number
): Promise<ApprovalRequest> {
  const id = `appr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const now = new Date().toISOString();

  const req: ApprovalRequest = {
    id,
    documentType,
    documentNo,
    title,
    amountVnd,
    requester,
    currentState: 'DRAFT',
    history: [
      {
        fromState: 'DRAFT',
        toState: 'DRAFT',
        actor: requester,
        timestamp: now,
        comment: 'Tạo dự thảo hồ sơ phê duyệt.',
      },
    ],
    createdAt: now,
    updatedAt: now,
  };

  approvalStore.set(id, req);

  await appendAuditEvent({
    actor: requester,
    workspace: 'Documents-Approval',
    action: 'approval.created',
    target: documentNo,
    risk: 'LOW',
    status: 'executed',
    summary: `Khởi tạo hồ sơ phê duyệt ${documentNo} (${title}).`,
  }).catch(() => undefined);

  return req;
}

/**
 * Transition approval state
 */
export async function transitionApprovalState(
  id: string,
  targetState: ApprovalState,
  actor: string,
  comment?: string
): Promise<{ success: boolean; request?: ApprovalRequest; error?: string }> {
  const req = approvalStore.get(id);
  if (!req) {
    return { success: false, error: 'Approval request not found.' };
  }

  const allowedNextStates = VALID_TRANSITIONS[req.currentState] || [];
  if (!allowedNextStates.includes(targetState)) {
    return {
      success: false,
      error: `Không thể chuyển trạng thái từ "${req.currentState}" sang "${targetState}". Các trạng thái hợp lệ: ${allowedNextStates.join(', ')}.`,
    };
  }

  const now = new Date().toISOString();
  const fromState = req.currentState;
  req.currentState = targetState;
  req.updatedAt = now;
  req.history.push({
    fromState,
    toState: targetState,
    actor,
    timestamp: now,
    comment: comment || `Chuyển trạng thái sang ${targetState}`,
  });

  await appendAuditEvent({
    actor,
    workspace: 'Documents-Approval',
    action: 'approval.transition',
    target: req.documentNo,
    risk: targetState === 'APPROVED' || targetState === 'PAID' ? 'HIGH' : 'MEDIUM',
    status: 'executed',
    summary: `Chuyển trạng thái hồ sơ ${req.documentNo}: ${fromState} ➔ ${targetState} (Người thực hiện: ${actor}).`,
    evidence: { comment },
  }).catch(() => undefined);

  await appendCompanyOsEvent({
    source: 'documents',
    eventType: 'approval.state_changed',
    title: `Phê duyệt ${req.documentNo}: ${targetState}`,
    body: `Hồ sơ "${req.title}" đã được chuyển sang trạng thái ${targetState}.`,
    risk: targetState === 'APPROVED' ? 'low' : 'medium',
    payload: { id, documentNo: req.documentNo, fromState, targetState, actor },
  }).catch(() => undefined);

  return { success: true, request: req };
}

/**
 * Get approval request by ID
 */
export function getApprovalRequest(id: string): ApprovalRequest | undefined {
  return approvalStore.get(id);
}

/**
 * List all approval requests
 */
export function listApprovalRequests(): ApprovalRequest[] {
  return Array.from(approvalStore.values());
}
