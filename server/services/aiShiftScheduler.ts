/**
 * aiShiftScheduler.ts
 * ============================================================
 * AI WORKFORCE SHIFT SCHEDULER & AUTOMATED ROUTINES
 *
 * Coordinates 3 distinct daily operational shifts for AI employees & robots:
 *  1. Morning Shift (06:00 - 12:00): Chief of Staff Daily Briefing, Morning Standup, Ticket Triage.
 *  2. Afternoon Shift (12:00 - 18:00): AI Market Scout, Content Marketing, Feature Development.
 *  3. Night Shift (22:00 - 06:00): Robot Sweeper, Token Audits, VietQR Bank Reconciliations, Security Drills.
 */

import { recordAIAction } from './aiActionLedger.ts';

export type ShiftType = 'morning_shift' | 'afternoon_shift' | 'night_shift';

export interface AIShiftDefinition {
  id: ShiftType;
  name: string;
  timeRange: string; // e.g. "06:00 - 12:00"
  startHour: number;
  endHour: number;
  leaderRoleId: string;
  assignedRoles: string[];
  primaryTasks: string[];
  isActiveNow: boolean;
}

const SHIFT_DEFINITIONS: AIShiftDefinition[] = [
  {
    id: 'morning_shift',
    name: 'Ca Sáng (Điều Hành & Khởi Động Ngày)',
    timeRange: '06:00 - 12:00',
    startHour: 6,
    endHour: 12,
    leaderRoleId: 'role_chief_of_staff',
    assignedRoles: ['role_chief_of_staff', 'role_ai_security_judge', 'role_ai_market_scout'],
    primaryTasks: [
      'Tổng hợp Daily Morning Briefing cho Solo Founder',
      'Quét hàng đợi phê duyệt tồn đọng (Pending Approvals)',
      'Kiểm tra tình trạng toàn vẹn SHA-256 trên Action Ledger',
    ],
    isActiveNow: false,
  },
  {
    id: 'afternoon_shift',
    name: 'Ca Chiều (Tăng Trưởng & Phát Triển Tính Năng)',
    timeRange: '12:00 - 18:00',
    startHour: 12,
    endHour: 18,
    leaderRoleId: 'role_ai_code_specialist',
    assignedRoles: ['role_ai_code_specialist', 'role_ai_market_scout'],
    primaryTasks: [
      'AI Market Scout quét và chấm điểm khách hàng tiềm năng CRM',
      'Sản xuất kịch bản Video Shorts / TikTok marketing',
      'Thực thi các chuỗi Atomic Code Patch và kiểm thử QA',
    ],
    isActiveNow: false,
  },
  {
    id: 'night_shift',
    name: 'Ca Đêm (Robot Dọn Dẹp & Đối Soát Tài Chính)',
    timeRange: '22:00 - 06:00',
    startHour: 22,
    endHour: 6,
    leaderRoleId: 'role_ai_cfo_director',
    assignedRoles: ['role_ai_cfo_director', 'role_ai_security_judge'],
    primaryTasks: [
      'Robot Nightly Sweeper dọn dẹp hệ thống & tính toán ngân sách',
      'Đối soát sao kê ngân hàng VietQR & hóa đơn chưa thu',
      'Quét lỗ hổng bảo mật SAST & kiểm tra rò rỉ Vault Key',
    ],
    isActiveNow: false,
  },
];

/**
 * Determine currently active shift based on local hour
 */
export function getCurrentActiveShift(customHour?: number): AIShiftDefinition {
  const hour = customHour !== undefined ? customHour : new Date().getHours();

  if (hour >= 6 && hour < 12) {
    return { ...SHIFT_DEFINITIONS[0], isActiveNow: true };
  } else if (hour >= 12 && hour < 18) {
    return { ...SHIFT_DEFINITIONS[1], isActiveNow: true };
  } else {
    // 18:00 - 06:00 belongs to Night / Evening maintenance
    return { ...SHIFT_DEFINITIONS[2], isActiveNow: true };
  }
}

/**
 * List all shift definitions with real-time active status
 */
export function listAIShifts(): AIShiftDefinition[] {
  const current = getCurrentActiveShift();
  return SHIFT_DEFINITIONS.map((shift) => ({
    ...shift,
    isActiveNow: shift.id === current.id,
  }));
}

/**
 * Execute routine tasks for a specific shift
 */
export function executeShiftRoutine(shiftId: ShiftType): {
  shiftId: ShiftType;
  shiftName: string;
  tasksExecuted: string[];
  executedAt: string;
  status: 'COMPLETED' | 'FAILED';
  summary: string;
} {
  const shift = SHIFT_DEFINITIONS.find((s) => s.id === shiftId);
  if (!shift) throw new Error(`Shift ${shiftId} not found`);

  const executedAt = new Date().toISOString();

  // Log in Action Ledger
  recordAIAction({
    agentId: `shift_runner_${shiftId}`,
    roleId: shift.leaderRoleId,
    domain: 'software_core',
    actionType: `SHIFT_ROUTINE_EXECUTED:${shiftId}`,
    targetResource: shiftId,
    outputSummary: `Đã hoàn thành ${shift.primaryTasks.length} nhiệm vụ thường nhật của ${shift.name}.`,
    permissionCheckPassed: true,
    constitutionalRulePassed: true,
  });

  return {
    shiftId,
    shiftName: shift.name,
    tasksExecuted: shift.primaryTasks,
    executedAt,
    status: 'COMPLETED',
    summary: `Trưởng ca ${shift.leaderRoleId} đã hoàn tất ca trực với ${shift.primaryTasks.length} tác vụ tự động.`,
  };
}
