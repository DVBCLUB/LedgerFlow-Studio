import { daemonFetch } from './assistantApi';

export type ApprovalRiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type ApprovalStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'EXPIRED';

export type ApprovalRequest = {
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
};

type ApprovalListResponse = { success?: boolean; error?: string; requests?: ApprovalRequest[] };
type ApprovalResponse = ApprovalRequest & { success?: boolean; error?: string };

export async function listHITLApprovalRequests(): Promise<ApprovalRequest[]> {
  const response = await daemonFetch<ApprovalListResponse>('/api/delegation/approvals', undefined, 10_000);
  if (!response || response.success === false) throw new Error(response?.error || 'Không thể tải Approval Inbox.');
  return response.requests || [];
}

export async function respondToHITLApproval(requestId: string, status: 'APPROVED' | 'REJECTED', reviewerNote = ''): Promise<ApprovalRequest> {
  const response = await daemonFetch<ApprovalResponse>('/api/delegation/approval/respond', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ requestId, status, reviewerNote }),
  }, 15_000);
  if (!response || response.success === false) throw new Error(response?.error || 'Không thể lưu quyết định phê duyệt.');
  return response;
}
