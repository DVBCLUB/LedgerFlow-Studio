/**
 * agent-system.ts
 * ============================================================
 * Strongly-typed Agent & Robot System Interfaces for Frontend/Backend.
 */

export type AuthorityLevel = 'EXECUTIVE' | 'DEPARTMENT_MANAGER' | 'SPECIALIST';

export interface AgentRolePermission {
  roleId: string;
  roleTitle: string;
  authorityLevel: AuthorityLevel;
  department: string;
  allowedActions: string[];
  maxDailyTokenBudget: number;
}

export interface AgentLoopJobInfo {
  jobId: string;
  goal: string;
  domain: string;
  status: 'queued' | 'running' | 'completed' | 'failed' | 'dead_letter';
  progressPercent: number;
  currentStep?: string;
  createdAt: string;
  completedAt?: string;
}

export interface CircuitBreakerInfo {
  providerName: string;
  state: 'CLOSED' | 'OPEN' | 'HALF_OPEN';
  failuresCount: number;
  lastFailureTime?: string;
  coolDownEndsAt?: string;
}

export interface RobotMissionState {
  missionId: string;
  platform: string;
  goal: string;
  status: 'pending' | 'in_progress' | 'succeeded' | 'failed';
  executionLogs: string[];
  startedAt: string;
  durationMs: number;
}

export interface ApprovalRequestItem {
  id: string;
  roleId: string;
  actionType: string;
  summary: string;
  payload: Record<string, any>;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  createdAt: string;
  reviewerNote?: string;
}
