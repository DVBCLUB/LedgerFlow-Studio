/**
 * aiWorkforceLiveBoard.ts
 * ============================================================
 * REAL-TIME AI WORKFORCE & ROBOT LIVE OPERATIONS BOARD
 *
 * Real-time operational snapshot showing:
 * - Which AI employee is active, idle, or quarantined
 * - Active shift and responsible shift leader
 * - Current in-flight tasks & pending approvals
 * - Last recorded actions from the immutable Action Ledger
 */

import { listAIRolePermissions } from './advancedDelegationConflictResolver.ts';
import { getCurrentActiveShift } from './aiShiftScheduler.ts';
import { queryAIActionLedger } from './aiActionLedger.ts';
import { listApprovalRequests } from './humanApprovalGateway.ts';

export interface LiveEmployeeStatus {
  roleId: string;
  roleName: string;
  authorityLevel: string;
  status: 'ACTIVE' | 'IDLE' | 'IN_SHIFT' | 'QUARANTINED';
  currentAction: string;
  lastActionAt: string;
  tasksCompletedToday: number;
}

export interface LiveBoardSnapshot {
  activeShift: {
    id: string;
    name: string;
    timeRange: string;
    leaderRoleId: string;
  };
  totalEmployeesCount: number;
  activeCount: number;
  quarantinedCount: number;
  pendingApprovalsCount: number;
  employees: LiveEmployeeStatus[];
  recentFeed: Array<{
    timestamp: string;
    actor: string;
    summary: string;
  }>;
  generatedAt: string;
}

/**
 * Generate real-time live board snapshot
 */
export function getLiveBoardSnapshot(): LiveBoardSnapshot {
  const currentShift = getCurrentActiveShift();
  const roles = listAIRolePermissions();
  const recentLogs = queryAIActionLedger({ limit: 8 });
  const pendingApprovals = listApprovalRequests({ status: 'PENDING' });

  const employees: LiveEmployeeStatus[] = roles.map((role) => {
    const isQuarantined = role.quarantineStatus === 'QUARANTINED';
    const isInShift = currentShift.assignedRoles.includes(role.roleId);

    let status: LiveEmployeeStatus['status'] = 'IDLE';
    if (isQuarantined) status = 'QUARANTINED';
    else if (isInShift) status = 'IN_SHIFT';
    else if (role.successfulTasksCount > 0) status = 'ACTIVE';

    const lastLog = recentLogs.entries.find((r) => r.roleId === role.roleId);

    return {
      roleId: role.roleId,
      roleName: role.roleName,
      authorityLevel: role.authorityLevel,
      status,
      currentAction: lastLog ? lastLog.outputSummary : 'Sẵn sàng tiếp nhận nhiệm vụ',
      lastActionAt: lastLog ? lastLog.timestamp : new Date().toISOString(),
      tasksCompletedToday: role.successfulTasksCount,
    };
  });

  const activeCount = employees.filter((e) => e.status === 'ACTIVE' || e.status === 'IN_SHIFT').length;
  const quarantinedCount = employees.filter((e) => e.status === 'QUARANTINED').length;

  const recentFeed = recentLogs.entries.map((r) => ({
    timestamp: r.timestamp,
    actor: r.roleId,
    summary: r.outputSummary,
  }));

  return {
    activeShift: {
      id: currentShift.id,
      name: currentShift.name,
      timeRange: currentShift.timeRange,
      leaderRoleId: currentShift.leaderRoleId,
    },
    totalEmployeesCount: roles.length,
    activeCount,
    quarantinedCount,
    pendingApprovalsCount: pendingApprovals.length,
    employees,
    recentFeed,
    generatedAt: new Date().toISOString(),
  };
}
