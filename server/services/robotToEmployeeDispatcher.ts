/**
 * robotToEmployeeDispatcher.ts
 * ============================================================
 * INTELLIGENT ROBOT TO AI EMPLOYEE TASK DISPATCHER
 *
 * Bridges the gap between Autonomous Robots (background executors)
 * and AI Employees (specialized domain managers).
 *
 * Automatically routes robot outputs, anomalies, and findings to the
 * right AI Department Manager or Specialist for follow-up.
 */

import { recordAIAction } from './aiActionLedger.ts';

export type RobotSource =
  | 'robot_nightly_sweeper'
  | 'robot_revenue_reconciler'
  | 'robot_cross_publisher'
  | 'robot_vision_dom';

export interface RobotDispatchedTask {
  dispatchId: string;
  sourceRobot: RobotSource;
  targetRoleId: string;
  targetRoleName: string;
  priority: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  taskCategory: 'FINANCIAL_ACTION' | 'SECURITY_REVIEW' | 'MARKETING_PROMOTION' | 'DEV_INSPECTION';
  title: string;
  payloadSummary: string;
  suggestedAction: string;
  dispatchedAt: string;
  status: 'PENDING_AI_ACTION' | 'ACKNOWLEDGED' | 'COMPLETED';
}

const DISPATCHED_TASKS_QUEUE: RobotDispatchedTask[] = [];

/**
 * Automatically analyze robot output and dispatch to the correct AI Employee
 */
export function dispatchRobotOutputToEmployee(params: {
  sourceRobot: RobotSource;
  data: Record<string, unknown>;
}): RobotDispatchedTask {
  const now = new Date().toISOString();
  const dispatchId = `disp_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

  let targetRoleId = 'role_chief_of_staff';
  let targetRoleName = 'Chief of Staff';
  let priority: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' = 'MEDIUM';
  let taskCategory: RobotDispatchedTask['taskCategory'] = 'DEV_INSPECTION';
  let title = 'Robot Event Follow-up';
  let payloadSummary = '';
  let suggestedAction = '';

  if (params.sourceRobot === 'robot_nightly_sweeper') {
    const budgetPct = Number(params.data.budgetPct || 0);
    const healthScore = Number(params.data.healthScore || 100);

    if (budgetPct >= 80) {
      targetRoleId = 'role_ai_cfo_director';
      targetRoleName = 'AI CFO';
      priority = 'HIGH';
      taskCategory = 'FINANCIAL_ACTION';
      title = `Cảnh Báo Ngân Sách AI (${budgetPct}% cap)`;
      payloadSummary = `Chi tiêu token đã chạm ngưỡng cảnh báo (${budgetPct}%).`;
      suggestedAction = 'Kích hoạt chính sách định tuyến Ollama Local $0 và DeepSeek để tiết kiệm chi phí.';
    } else if (healthScore < 70) {
      targetRoleId = 'role_ai_security_judge';
      targetRoleName = 'AI Security Judge';
      priority = 'CRITICAL';
      taskCategory = 'SECURITY_REVIEW';
      title = `Điểm Sức Khỏe Hệ Thống Suy Giảm (${healthScore}/100)`;
      payloadSummary = `Robot phát hiện nhiều tác vụ lỗi hoặc vi phạm cấu hình.`;
      suggestedAction = 'Thực hiện kiểm toán rủi ro và khôi phục các node bị cách ly.';
    } else {
      targetRoleId = 'role_chief_of_staff';
      targetRoleName = 'Chief of Staff';
      priority = 'LOW';
      taskCategory = 'DEV_INSPECTION';
      title = 'Báo Cáo Quét Dọn Ban Đêm Định Kỳ';
      payloadSummary = 'Hệ thống vận hành trơn tru, không có lỗi bất thường.';
      suggestedAction = 'Đưa số liệu vào bản tin Morning Executive Briefing cho Solo Founder.';
    }
  } else if (params.sourceRobot === 'robot_revenue_reconciler') {
    targetRoleId = 'role_ai_cfo_director';
    targetRoleName = 'AI CFO';
    priority = 'HIGH';
    taskCategory = 'FINANCIAL_ACTION';
    title = 'Xử Lý Hóa Đơn Quá Hạn & Công Nợ';
    payloadSummary = `Phát hiện công nợ cần đối soát: ${params.data.unpaidCount || 1} hóa đơn.`;
    suggestedAction = 'Kiểm tra ủy nhiệm chi VietQR và chuẩn bị thư nhắc nợ tự động gửi khách hàng.';
  } else if (params.sourceRobot === 'robot_cross_publisher') {
    targetRoleId = 'role_ai_market_scout';
    targetRoleName = 'AI Market & Trends Scout';
    priority = 'MEDIUM';
    taskCategory = 'MARKETING_PROMOTION';
    title = 'Phân Phối Nội Dung Đa Kênh Tự Động';
    payloadSummary = `Video Shorts / bài đăng SaaS đã sẵn sàng: ${params.data.title || 'Marketing Pack'}.`;
    suggestedAction = 'Đưa vào hàng đợi phân phối TikTok, YouTube Shorts và Zalo OA sau khi CEO duyệt.';
  }

  const dispatchedTask: RobotDispatchedTask = {
    dispatchId,
    sourceRobot: params.sourceRobot,
    targetRoleId,
    targetRoleName,
    priority,
    taskCategory,
    title,
    payloadSummary,
    suggestedAction,
    dispatchedAt: now,
    status: 'PENDING_AI_ACTION',
  };

  DISPATCHED_TASKS_QUEUE.push(dispatchedTask);

  // Log in Action Ledger
  recordAIAction({
    agentId: params.sourceRobot,
    roleId: targetRoleId,
    domain: 'software_core',
    actionType: `ROBOT_DISPATCHED_TO_EMPLOYEE:${params.sourceRobot}`,
    targetResource: dispatchId,
    outputSummary: `Robot ${params.sourceRobot} đã chuyển giao tác vụ "${title}" cho ${targetRoleName}.`,
    permissionCheckPassed: true,
    constitutionalRulePassed: true,
  });

  return dispatchedTask;
}

/**
 * List all dispatched tasks pending employee processing
 */
export function listDispatchedRobotTasks(): RobotDispatchedTask[] {
  return [...DISPATCHED_TASKS_QUEUE].reverse();
}
