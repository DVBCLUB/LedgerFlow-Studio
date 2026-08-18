/**
 * crossDepartmentRequestBridge.ts
 * ============================================================
 * CROSS-DEPARTMENT AI COLLABORATION & REQUEST PROTOCOL
 *
 * Enables structured inter-departmental task requests between AI employees
 * without requiring the Solo Founder (CEO) to act as a manual dispatcher.
 *
 * Example:
 *  AI Marketer (Growth) submits request -> Chief of Staff (Product Manager)
 *  -> Chief of Staff automatically assigns to AI Dev.
 */

import { recordAIAction } from './aiActionLedger.ts';
import { delegateTaskToDepartmentMember } from './advancedDelegationConflictResolver.ts';

export type DepartmentName = 'PRODUCT' | 'FINANCE' | 'SECURITY' | 'GROWTH' | 'MEDIA';
export type RequestPriority = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
export type RequestStatus = 'SUBMITTED' | 'ACCEPTED' | 'IN_PROGRESS' | 'COMPLETED' | 'REJECTED';

export interface CrossDeptRequest {
  requestId: string;
  fromDepartment: DepartmentName;
  fromRoleId: string;
  toDepartment: DepartmentName;
  toManagerRoleId: string;
  title: string;
  description: string;
  priority: RequestPriority;
  status: RequestStatus;
  assignedWorkerRoleId?: string;
  responseComment?: string;
  createdAt: string;
  updatedAt: string;
}

const DEPARTMENT_MANAGERS: Record<DepartmentName, string> = {
  PRODUCT: 'role_chief_of_staff',
  FINANCE: 'role_ai_cfo_director',
  SECURITY: 'role_ai_security_judge',
  GROWTH: 'role_chief_of_staff',
  MEDIA: 'role_chief_of_staff',
};

const CROSS_DEPT_REQUESTS: CrossDeptRequest[] = [];

/**
 * Submit a request from one department to another
 */
export function submitCrossDeptRequest(params: {
  fromDepartment: DepartmentName;
  fromRoleId: string;
  toDepartment: DepartmentName;
  title: string;
  description: string;
  priority?: RequestPriority;
}): CrossDeptRequest {
  const requestId = `xdept_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const now = new Date().toISOString();
  const toManagerRoleId = DEPARTMENT_MANAGERS[params.toDepartment] || 'role_chief_of_staff';
  const priority = params.priority || 'MEDIUM';

  const request: CrossDeptRequest = {
    requestId,
    fromDepartment: params.fromDepartment,
    fromRoleId: params.fromRoleId,
    toDepartment: params.toDepartment,
    toManagerRoleId,
    title: params.title,
    description: params.description,
    priority,
    status: 'SUBMITTED',
    createdAt: now,
    updatedAt: now,
  };

  CROSS_DEPT_REQUESTS.push(request);

  recordAIAction({
    agentId: params.fromRoleId,
    roleId: toManagerRoleId,
    domain: 'software_core',
    actionType: 'CROSS_DEPT_REQUEST_SUBMITTED',
    targetResource: requestId,
    outputSummary: `Ban ${params.fromDepartment} (${params.fromRoleId}) đã gửi yêu cầu "${params.title}" tới Trưởng phòng ${toManagerRoleId}.`,
    permissionCheckPassed: true,
    constitutionalRulePassed: true,
  });

  return request;
}

/**
 * Department Manager responds to cross-department request
 */
export function respondToCrossDeptRequest(params: {
  requestId: string;
  decision: 'ACCEPTED' | 'REJECTED';
  responseComment?: string;
  assignToWorkerRoleId?: string;
}): CrossDeptRequest {
  const request = CROSS_DEPT_REQUESTS.find((r) => r.requestId === params.requestId);
  if (!request) throw new Error(`Cross-dept request ${params.requestId} not found`);

  request.status = params.decision === 'ACCEPTED' ? 'IN_PROGRESS' : 'REJECTED';
  request.responseComment = params.responseComment;
  request.updatedAt = new Date().toISOString();

  if (params.decision === 'ACCEPTED' && params.assignToWorkerRoleId) {
    request.assignedWorkerRoleId = params.assignToWorkerRoleId;

    // Automatically delegate to member
    delegateTaskToDepartmentMember({
      managerRoleId: request.toManagerRoleId,
      memberRoleId: params.assignToWorkerRoleId,
      taskTitle: `[Liên Phòng ${request.fromDepartment}] ${request.title}`,
      domain: 'software_core',
    });
  }

  recordAIAction({
    agentId: request.toManagerRoleId,
    roleId: request.toManagerRoleId,
    domain: 'software_core',
    actionType: `CROSS_DEPT_REQUEST_RESPONDED:${params.decision}`,
    targetResource: request.requestId,
    outputSummary: `Trưởng phòng ${request.toManagerRoleId} đã ${params.decision === 'ACCEPTED' ? 'TIẾP NHẬN' : 'TỪ CHỐI'} yêu cầu "${request.title}".`,
    permissionCheckPassed: true,
    constitutionalRulePassed: true,
  });

  return request;
}

/**
 * Mark request as completed
 */
export function completeCrossDeptRequest(requestId: string, outputSummary: string): CrossDeptRequest {
  const request = CROSS_DEPT_REQUESTS.find((r) => r.requestId === requestId);
  if (!request) throw new Error(`Cross-dept request ${requestId} not found`);

  request.status = 'COMPLETED';
  request.responseComment = outputSummary;
  request.updatedAt = new Date().toISOString();

  recordAIAction({
    agentId: request.assignedWorkerRoleId || request.toManagerRoleId,
    roleId: request.fromRoleId,
    domain: 'software_core',
    actionType: 'CROSS_DEPT_REQUEST_COMPLETED',
    targetResource: requestId,
    outputSummary: `Đã hoàn thành yêu cầu liên phòng "${request.title}": ${outputSummary}`,
    permissionCheckPassed: true,
    constitutionalRulePassed: true,
  });

  return request;
}

/**
 * List all cross-department requests
 */
export function listCrossDeptRequests(filter?: {
  department?: DepartmentName;
  status?: RequestStatus;
}): CrossDeptRequest[] {
  let list = [...CROSS_DEPT_REQUESTS];
  if (filter?.department) {
    list = list.filter((r) => r.fromDepartment === filter.department || r.toDepartment === filter.department);
  }
  if (filter?.status) {
    list = list.filter((r) => r.status === filter.status);
  }
  return list.reverse();
}

/**
 * Reset for testing
 */
export function __resetCrossDeptRequestsForTesting(): void {
  CROSS_DEPT_REQUESTS.length = 0;
}
