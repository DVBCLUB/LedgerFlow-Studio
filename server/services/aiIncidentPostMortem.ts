/**
 * aiIncidentPostMortem.ts
 * ============================================================
 * AUTOMATED AI INCIDENT POST-MORTEM & ROOT CAUSE ANALYSIS (RCA)
 *
 * Automatically generates blameless post-mortem reports whenever an AI agent
 * is quarantined, a multi-agent handoff chain fails, or a critical constitutional
 * invariant is violated.
 */

import { recordAIAction, queryAIActionLedger } from './aiActionLedger.ts';

export type IncidentType =
  | 'QUARANTINE'
  | 'CHAIN_FAILURE'
  | 'BUDGET_BREACH'
  | 'SECURITY_VIOLATION';

export type IncidentSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface PostMortemReport {
  incidentId: string;
  incidentType: IncidentType;
  affectedRoleId: string;
  severity: IncidentSeverity;
  title: string;
  rootCause: string;
  impactAssessment: string;
  timelineSummary: string[];
  preventiveActions: string[];
  createdAt: string;
}

const POST_MORTEM_STORAGE: PostMortemReport[] = [];

/**
 * Automatically generate a Root Cause Analysis Post-Mortem Report
 */
export function generatePostMortem(params: {
  incidentType: IncidentType;
  affectedRoleId: string;
  triggerReason: string;
  severity?: IncidentSeverity;
}): PostMortemReport {
  const incidentId = `rca_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const now = new Date().toISOString();
  const severity: IncidentSeverity = params.severity || (params.incidentType === 'QUARANTINE' ? 'CRITICAL' : 'HIGH');

  // Query recent action ledger for timeline context
  const recentLogs = queryAIActionLedger({ roleId: params.affectedRoleId, limit: 5 });
  const timelineSummary = recentLogs.entries.map(
    (e) => `[${e.timestamp.substring(11, 19)}] ${e.actionType}: ${e.outputSummary}`
  );

  if (timelineSummary.length === 0) {
    timelineSummary.push(`[${now.substring(11, 19)}] Sự cố kích hoạt: ${params.triggerReason}`);
  }

  let rootCause = params.triggerReason;
  let impactAssessment = '';
  const preventiveActions: string[] = [];

  if (params.incidentType === 'QUARANTINE') {
    rootCause = `Nhân viên AI ${params.affectedRoleId} ghi nhận 3 lỗi liên tiếp hoặc vi phạm ranh giới hệ thống: ${params.triggerReason}`;
    impactAssessment = `Quyền ghi đĩa và cấp token của ${params.affectedRoleId} bị thu hồi tạm thời (Blast-Radius Isolation). Tác vụ được chuyển sang node dự phòng.`;
    preventiveActions.push('Tăng cường kiểm tra cú pháp và logic trước khi gọi execute.');
    preventiveActions.push('Chuyển giao tạm thời sang mô hình an toàn hơn (Claude 3.5 Sonnet / Gemini Pro).');
    preventiveActions.push('Yêu cầu Solo Founder xét duyệt trước khi gỡ trạng thái cách ly.');
  } else if (params.incidentType === 'CHAIN_FAILURE') {
    rootCause = `Bước thực thi trong chuỗi chuyền giao Handoff Chain không đạt yêu cầu kiểm định: ${params.triggerReason}`;
    impactAssessment = 'Chuỗi phát hành tính năng bị tạm dừng để ngăn chặn lỗi lọt vào production.';
    preventiveActions.push('Bổ sung test cases vào QA checklist.');
    preventiveActions.push('Tăng timeout xử lý cho các module phức tạp.');
  } else if (params.incidentType === 'BUDGET_BREACH') {
    rootCause = `Chi tiêu token vượt quá ngưỡng an toàn: ${params.triggerReason}`;
    impactAssessment = 'Chi phí API có nguy cơ vượt ngân sách tháng nếu tiếp tục tần suất hiện tại.';
    preventiveActions.push('Kích hoạt định tuyến ưu tiên Ollama Local $0.');
    preventiveActions.push('Giảm tần suất chạy của các robot quét dọn không khẩn cấp.');
  } else {
    rootCause = `Vi phạm hiến pháp bảo mật: ${params.triggerReason}`;
    impactAssessment = 'Hệ thống kích hoạt Circuit Breaker để bảo toàn dữ liệu.';
    preventiveActions.push('Kiểm tra lại bộ lọc regex chống rò rỉ secret trong prompt.');
  }

  const report: PostMortemReport = {
    incidentId,
    incidentType: params.incidentType,
    affectedRoleId: params.affectedRoleId,
    severity,
    title: `[RCA Incident] ${params.incidentType} trên ${params.affectedRoleId}`,
    rootCause,
    impactAssessment,
    timelineSummary,
    preventiveActions,
    createdAt: now,
  };

  POST_MORTEM_STORAGE.push(report);

  // Record in Action Ledger
  recordAIAction({
    agentId: 'ai_incident_post_mortem_engine',
    roleId: 'role_ai_security_judge',
    domain: 'system_security',
    actionType: `POST_MORTEM_GENERATED:${params.incidentType}`,
    targetResource: incidentId,
    outputSummary: `Đã xuất bản báo cáo phân tích nguyên nhân gốc: ${report.title}`,
    permissionCheckPassed: true,
    constitutionalRulePassed: true,
  });

  // Notify on Telegram if critical (non-blocking)
  if (severity === 'CRITICAL' || severity === 'HIGH') {
    import('./telegramBot.ts')
      .then(({ sendTelegramNotification }) => {
        sendTelegramNotification(
          `🚨 [Báo Cáo Sự Cố RCA] ${report.title}\nTrạng thái: CẦN CHÚ Ý\nNguyên nhân: ${rootCause}\nBiện pháp: ${preventiveActions[0]}`
        ).catch(() => undefined);
      })
      .catch(() => undefined);
  }

  return report;
}

/**
 * List all post-mortem reports
 */
export function listPostMortemReports(filter?: {
  incidentType?: IncidentType;
  severity?: IncidentSeverity;
}): PostMortemReport[] {
  let list = [...POST_MORTEM_STORAGE];
  if (filter?.incidentType) {
    list = list.filter((r) => r.incidentType === filter.incidentType);
  }
  if (filter?.severity) {
    list = list.filter((r) => r.severity === filter.severity);
  }
  return list.reverse();
}

/**
 * Get report by ID
 */
export function getPostMortemById(incidentId: string): PostMortemReport | undefined {
  return POST_MORTEM_STORAGE.find((r) => r.incidentId === incidentId);
}

/**
 * Reset for testing
 */
export function __resetPostMortemForTesting(): void {
  POST_MORTEM_STORAGE.length = 0;
}
