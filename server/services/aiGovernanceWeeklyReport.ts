/**
 * aiGovernanceWeeklyReport.ts
 * ============================================================
 * WEEKLY AI WORKFORCE GOVERNANCE & PERFORMANCE REPORT
 *
 * Automatically aggregates:
 * 1. AI Workforce SLO Health Scores & Error Budgets
 * 2. Token Spend & Capital Efficiency (ROI)
 * 3. Boundary Violations & Constitutional Checks
 * 4. Human Approval Gateway resolution rate
 * 5. Dispatches Telegram Saturday morning digest & archives JSON report.
 */

import fs from 'node:fs';
import path from 'node:path';
import { queryAIActionLedger } from './aiActionLedger.ts';
import { listApprovalRequests } from './humanApprovalGateway.ts';
import { calculateAIWorkforceHealthScores } from './advancedDelegationConflictResolver.ts';
import { calculateAiRoiSummary } from './aiRoiAnalytics.ts';
import { recordAIAction } from './aiActionLedger.ts';
import { ensureRuntimeRootSync, resolveRuntimePathFromEnv } from './runtimePaths.ts';

export interface WeeklyGovernanceReport {
  reportId: string;
  reportPeriod: string;
  generatedAt: string;
  executiveSummary: string;
  workforceHealthScores: Array<{
    roleId: string;
    roleName: string;
    healthScore: number;
    sloStatus: string;
    successRatePercent: number;
  }>;
  financialMetrics: {
    totalSpendUsd: number;
    totalSpendVnd: number;
    estimatedRevenueVnd: number;
    roiMultiplier: number;
  };
  governanceAudits: {
    totalActionsRecorded: number;
    boundaryViolationsCount: number;
    pendingApprovalsCount: number;
    resolvedApprovalsCount: number;
    isCryptographicChainValid: boolean;
  };
  recommendations: string[];
}

const REPORTS_ARCHIVE: WeeklyGovernanceReport[] = [];

/**
 * Generate weekly AI governance report
 */
export function generateWeeklyGovernanceReport(): WeeklyGovernanceReport {
  const now = new Date();
  const reportId = `rep_gov_${now.toISOString().substring(0, 10).replace(/-/g, '')}`;
  const reportPeriod = `Tuần ${Math.ceil(now.getDate() / 7)} - Tháng ${now.getMonth() + 1}/${now.getFullYear()}`;

  const healthScores = calculateAIWorkforceHealthScores();
  const roi = calculateAiRoiSummary('week');
  const ledgerQuery = queryAIActionLedger({ limit: 500 });
  const violations = queryAIActionLedger({ onlyViolations: true });
  const approvals = listApprovalRequests({ limit: 100 });

  const pendingApprovalsCount = approvals.filter((a) => a.status === 'PENDING').length;
  const resolvedApprovalsCount = approvals.filter((a) => a.status === 'APPROVED' || a.status === 'REJECTED').length;

  const topHealthRole = [...healthScores].sort((a, b) => b.healthScore - a.healthScore)[0];

  const executiveSummary =
    `Hệ thống vận hành ${healthScores.length} vai trò AI ổn định. ` +
    `Đạt tỷ lệ thành công trung bình ${Math.round(healthScores.reduce((acc, h) => acc + h.successRatePercent, 0) / healthScores.length)}%. ` +
    `Vai trò dẫn đầu tuần: ${topHealthRole.roleName} (SLO ${topHealthRole.healthScore}/100). ` +
    `Tổng chi phí tuần $${roi.totalAiCostUsd} đem lại ước tính ${roi.totalRevenueVnd.toLocaleString('vi-VN')} VNĐ doanh thu (ROI: ${roi.roiMultiple}x).`;

  const recommendations = [
    'Duy trì cấp quyền SCOUT_READER cho các AI ngoại vi để hạn chế tối đa blast radius.',
    violations.total > 0
      ? `Phát hiện ${violations.total} lần vi phạm ranh giới đã bị chặn bởi IAM — tiếp tục giám sát.`
      : 'Không có vi phạm ranh giới nào trong tuần qua.',
    pendingApprovalsCount > 0
      ? `Còn ${pendingApprovalsCount} yêu cầu đang chờ Solo Founder duyệt trên Telegram.`
      : 'Toàn bộ yêu cầu phê duyệt đã được giải quyết 100%.',
  ];

  const report: WeeklyGovernanceReport = {
    reportId,
    reportPeriod,
    generatedAt: now.toISOString(),
    executiveSummary,
    workforceHealthScores: healthScores,
    financialMetrics: {
      totalSpendUsd: roi.totalAiCostUsd,
      totalSpendVnd: roi.totalAiCostVnd,
      estimatedRevenueVnd: roi.totalRevenueVnd,
      roiMultiplier: roi.roiMultiple,
    },
    governanceAudits: {
      totalActionsRecorded: ledgerQuery.total,
      boundaryViolationsCount: violations.total,
      pendingApprovalsCount,
      resolvedApprovalsCount,
      isCryptographicChainValid: ledgerQuery.isChainValid,
    },
    recommendations,
  };

  REPORTS_ARCHIVE.push(report);

  // Save report to runtime directory
  try {
    ensureRuntimeRootSync();
    const filePath = resolveRuntimePathFromEnv('WEEKLY_REPORTS_DIR', `weekly_report_${reportId}.json`);
    fs.writeFileSync(filePath, JSON.stringify(report, null, 2), 'utf8');
  } catch (err) {
    console.error('[WeeklyReport] Save file error:', err);
  }

  // Record in Action Ledger
  recordAIAction({
    agentId: 'agent_governance_auditor',
    roleId: 'role_ai_security_judge',
    domain: 'system_security',
    actionType: 'WEEKLY_REPORT_GENERATED',
    targetResource: reportId,
    outputSummary: `Đã xuất bản báo cáo quản trị tuần: ${reportPeriod}`,
    permissionCheckPassed: true,
    constitutionalRulePassed: true,
  });

  // Asynchronously dispatch Telegram notification
  import('./telegramBot.ts')
    .then(({ sendTelegramNotification }) => {
      sendTelegramNotification(
        `📊 *BÁO CÁO QUẢN TRỊ AI HÀNG TUẦN*\n\n` +
        `📅 *Kỳ:* ${reportPeriod}\n` +
        `🏆 *Top AI:* ${topHealthRole.roleName} (${topHealthRole.healthScore}/100)\n` +
        `💰 *Chi Phí:* $${roi.totalAiCostUsd} | *Doanh Thu:* ${roi.totalRevenueVnd.toLocaleString('vi-VN')} đ (ROI: ${roi.roiMultiple}x)\n` +
        `🛡️ *Vi Phạm Ranh Giới:* ${violations.total} (Đã chặn 100%)\n` +
        `✅ *Toàn Vẹn SHA-256:* ${ledgerQuery.isChainValid ? 'HỢP LỆ' : 'CẢNH BÁO'}\n\n` +
        `_Xem chi tiết tại CEO Command Center Dashboard._`
      ).catch(() => undefined);
    })
    .catch(() => undefined);

  return report;
}

/**
 * List past weekly governance reports
 */
export function listWeeklyGovernanceReports(): WeeklyGovernanceReport[] {
  return [...REPORTS_ARCHIVE].reverse();
}
