import { daemonFetch } from './assistantApi';

export type AIWorkforceLiveEmployee = {
  roleId: string;
  roleName: string;
  authorityLevel: string;
  status: 'ACTIVE' | 'IDLE' | 'IN_SHIFT' | 'QUARANTINED';
  currentAction: string;
  lastActionAt: string;
  tasksCompletedToday: number;
};

export type AIWorkforceLiveBoard = {
  activeShift: { id: string; name: string; timeRange: string; leaderRoleId: string };
  totalEmployeesCount: number;
  activeCount: number;
  quarantinedCount: number;
  pendingApprovalsCount: number;
  employees: AIWorkforceLiveEmployee[];
  recentFeed: Array<{ timestamp: string; actor: string; summary: string }>;
  generatedAt: string;
};

type LiveBoardResponse = AIWorkforceLiveBoard & { success?: boolean; error?: string };

export async function fetchAIWorkforceLiveBoard(): Promise<AIWorkforceLiveBoard> {
  const response = await daemonFetch<LiveBoardResponse>('/api/workforce/live-board', undefined, 10_000);
  if (!response || response.success === false) throw new Error(response?.error || 'Không thể đọc trạng thái AI Workforce.');
  return response;
}
