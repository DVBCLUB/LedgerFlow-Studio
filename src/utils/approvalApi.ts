/**
 * src/utils/approvalApi.ts
 * ─────────────────────────────────────────────────────────────
 * Frontend client cho backend Approval State Machine
 * (server/services/approvalStateMachine.ts, route /api/dormant/approval/*).
 *
 * Nguồn chân lý là backend: tạo hồ sơ → chuyển trạng thái (có validate
 * transition + audit trail + company OS event). UI dùng API này khi online,
 * fallback về localStorage khi offline.
 */

export type BackendApprovalState =
  | 'DRAFT'
  | 'SUBMITTED'
  | 'CHECKED'
  | 'APPROVED'
  | 'PAID'
  | 'ARCHIVED'
  | 'REJECTED';

export type BackendDocumentType =
  | 'PAYMENT_REQUEST'
  | 'CONTRACT'
  | 'QUOTATION'
  | 'ADVANCE_REQUEST'
  | 'RELEASE_CHECKLIST';

export interface BackendApprovalHistoryEntry {
  fromState: BackendApprovalState;
  toState: BackendApprovalState;
  actor: string;
  timestamp: string;
  comment?: string;
}

export interface BackendApprovalRequest {
  id: string;
  documentType: BackendDocumentType;
  documentNo: string;
  title: string;
  amountVnd?: number;
  requester: string;
  currentState: BackendApprovalState;
  history: BackendApprovalHistoryEntry[];
  createdAt: string;
  updatedAt: string;
}

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, { headers: { 'Content-Type': 'application/json' }, ...init });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return (await res.json()) as T;
}

export function listApprovalRequests(): Promise<BackendApprovalRequest[]> {
  return request<{ success: boolean; requests: BackendApprovalRequest[] }>(
    '/api/dormant/approval/list'
  ).then((r) => r.requests ?? []);
}

export function createApprovalRequest(input: {
  documentType: BackendDocumentType;
  documentNo: string;
  title: string;
  requester: string;
  amountVnd?: number;
}): Promise<BackendApprovalRequest> {
  return request<{ success: boolean; request: BackendApprovalRequest }>(
    '/api/dormant/approval/create',
    { method: 'POST', body: JSON.stringify(input) }
  ).then((r) => r.request);
}

export function transitionApprovalRequest(input: {
  id: string;
  targetState: BackendApprovalState;
  actor: string;
  comment?: string;
}): Promise<{ success: boolean; request?: BackendApprovalRequest; error?: string }> {
  return request<{ success: boolean; request?: BackendApprovalRequest; error?: string }>(
    '/api/dormant/approval/transition',
    { method: 'POST', body: JSON.stringify(input) }
  );
}
