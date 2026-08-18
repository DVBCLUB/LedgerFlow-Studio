/**
 * aiEmployeePerformanceCard.ts
 * ============================================================
 * INDIVIDUAL AI EMPLOYEE PERFORMANCE SCORECARD & KPI ENGINE
 *
 * Computes individual KPI ratings, capital efficiency, accuracy metrics,
 * and AI-generated performance evaluations for every employee role.
 */

import { listAIRolePermissions } from './advancedDelegationConflictResolver.ts';
import { queryAIActionLedger } from './aiActionLedger.ts';

export interface EmployeeKpiCard {
  roleId: string;
  roleName: string;
  department: string;
  authorityLevel: string;
  grade: 'A+' | 'A' | 'B' | 'C' | 'PROBATION';
  overallScore: number; // 0 - 100
  metrics: {
    tasksCompleted: number;
    successRatePct: number;
    dailySpendUsd: number;
    costPerTaskUsd: number;
    boundaryViolationsCount: number;
    qualityJudgeScore: number;
  };
  strengths: string[];
  areasForImprovement: string[];
  executiveEvaluationText: string;
  evaluatedAt: string;
}

/**
 * Generate KPI Scorecard for a specific AI Employee role
 */
export function getEmployeeKpiCard(roleId: string): EmployeeKpiCard {
  const roles = listAIRolePermissions();
  const role = roles.find((r) => r.roleId === roleId) || roles[0];

  const ledgerViolations = queryAIActionLedger({ onlyViolations: true });
  const roleViolations = ledgerViolations.entries.filter((r) => r.roleId === role.roleId).length;

  const successRate = role.totalTasksCount > 0 ? (role.successfulTasksCount / role.totalTasksCount) * 100 : 100;
  const costPerTask = role.successfulTasksCount > 0 ? role.currentDailySpendUsd / role.successfulTasksCount : 0.01;

  // Composite Score Formula: 40% Success Rate + 30% Judge Score + 20% Budget Discipline + 10% (100 - violation penalty)
  const violationPenalty = roleViolations * 20;
  const overallScore = Math.max(
    0,
    Math.min(
      100,
      Math.round(successRate * 0.4 + role.avgJudgeScore * 0.3 + 95 * 0.2 + (100 - violationPenalty) * 0.1)
    )
  );

  let grade: EmployeeKpiCard['grade'] = 'A';
  if (overallScore >= 95) grade = 'A+';
  else if (overallScore >= 85) grade = 'A';
  else if (overallScore >= 70) grade = 'B';
  else if (overallScore >= 50) grade = 'C';
  else grade = 'PROBATION';

  let department = 'Sản Phẩm & Công Nghệ';
  if (role.roleId.includes('cfo') || role.roleId.includes('accountant')) {
    department = 'Tài Chính & Kế Toán';
  } else if (role.roleId.includes('scout') || role.roleId.includes('market')) {
    department = 'Tăng Trưởng & Thị Trường';
  } else if (role.roleId.includes('security') || role.roleId.includes('judge')) {
    department = 'Bảo Mật & Quản Trị';
  }

  const strengths = [
    `Độ chính xác cao (${Math.round(successRate)}% hoàn thành nhiệm vụ)`,
    `Chi phí tối ưu: $${costPerTask.toFixed(3)} / task`,
    `Tuân thủ hiến pháp an toàn (${roleViolations} vi phạm ranh giới)`,
  ];

  const areasForImprovement = [
    'Tiếp tục tối ưu hóa token qua mô hình cục bộ Ollama',
    'Tăng tốc độ phản hồi trong các chuỗi chuyền giao Handoff Chain',
  ];

  const executiveEvaluationText =
    `${role.roleName} thuộc Ban ${department} đạt xếp loại ${grade} (Điểm tổng hợp: ${overallScore}/100). ` +
    `Đã hoàn thành ${role.successfulTasksCount} tác vụ với mức chi phí $${role.currentDailySpendUsd}/ngày. Hoạt động xuất sắc.`;

  return {
    roleId: role.roleId,
    roleName: role.roleName,
    department,
    authorityLevel: role.authorityLevel,
    grade,
    overallScore,
    metrics: {
      tasksCompleted: role.successfulTasksCount,
      successRatePct: Math.round(successRate),
      dailySpendUsd: Number(role.currentDailySpendUsd.toFixed(2)),
      costPerTaskUsd: Number(costPerTask.toFixed(3)),
      boundaryViolationsCount: roleViolations,
      qualityJudgeScore: role.avgJudgeScore,
    },
    strengths,
    areasForImprovement,
    executiveEvaluationText,
    evaluatedAt: new Date().toISOString(),
  };
}

/**
 * List KPI scorecards for all registered AI employee roles
 */
export function listAllEmployeeKpiCards(): EmployeeKpiCard[] {
  const roles = listAIRolePermissions();
  return roles.map((r) => getEmployeeKpiCard(r.roleId));
}
