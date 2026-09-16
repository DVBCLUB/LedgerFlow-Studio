/**
 * glaciaAutonomyGate.ts
 * ============================================================
 * GLACIA AUTONOMY LEVELS & TRUST ENFORCEMENT GATE
 * ------------------------------------------------------------
 * 1. 5-Tier Autonomy Classification (Level 0 to Level 4)
 * 2. Trust Score & Safety Envelope Calculation
 * 3. Dynamic Action Permission Evaluation
 * 4. Autonomous Boundary Interceptor
 * ============================================================
 */

import fs from 'fs';
import path from 'path';

export type AutonomyLevel = 0 | 1 | 2 | 3 | 4;

export interface AutonomyLevelSpec {
  level: AutonomyLevel;
  code: 'OBSERVER' | 'ADVISOR' | 'EXECUTOR' | 'ORCHESTRATOR' | 'AUTONOMOUS';
  name: string;
  minTrustScore: number;
  description: string;
  allowedActions: string[];
  requiresApprovalFor: string[];
  color: string;
}

export const AUTONOMY_SPECS: Record<AutonomyLevel, AutonomyLevelSpec> = {
  0: {
    level: 0,
    code: 'OBSERVER',
    name: 'Cấp độ 0: Quan sát viên (Observer)',
    minTrustScore: 0,
    description: 'Chỉ đọc dữ liệu, trả lời câu hỏi và phân tích trạng thái. Không tự ý thực thi bất kỳ công cụ nào.',
    allowedActions: ['chat', 'status_read', 'telemetry_read', 'diagnostics'],
    requiresApprovalFor: ['all_tools', 'all_workflows'],
    color: '#94a3b8',
  },
  1: {
    level: 1,
    code: 'ADVISOR',
    name: 'Cấp độ 1: Cố vấn Chiến lược (Advisor)',
    minTrustScore: 100,
    description: 'Đề xuất kế hoạch DAG và các bước thực thi. Mỗi thao tác công cụ yêu cầu CEO bấm duyệt 1 chạm.',
    allowedActions: ['chat', 'dag_proposal', 'code_diff_preview', 'dry_run_simulation'],
    requiresApprovalFor: ['single_tool_execute', 'skill_execute', 'render'],
    color: '#38bdf8',
  },
  2: {
    level: 2,
    code: 'EXECUTOR',
    name: 'Cấp độ 2: Chấp hành viên Độc lập (Executor)',
    minTrustScore: 500,
    description: 'Tự động thực thi các công cụ an toàn: Web Research, Render 3D Blender, Thiết kế Banner, Unit Test.',
    allowedActions: ['web_research', 'blender_render', 'banner_design', 'video_generate', 'skill_execute', 'unit_test'],
    requiresApprovalFor: ['multi_step_dag', 'git_push', 'db_write', 'file_delete'],
    color: '#34d399',
  },
  3: {
    level: 3,
    code: 'ORCHESTRATOR',
    name: 'Cấp độ 3: Nhạc trưởng Điều phối (Orchestrator)',
    minTrustScore: 1500,
    description: 'Tự động chạy các quy trình DAG đa tác tử phức tạp từ đầu đến cuối. Chỉ dừng lại khi gặp hành động phá hủy.',
    allowedActions: ['full_dag_pipeline', 'auto_program', 'self_heal_code', 'swarm_shift', 'asset_bundle_build'],
    requiresApprovalFor: ['destructive_actions', 'live_production_deploy', 'secret_vault_modify'],
    color: '#a855f7',
  },
  4: {
    level: 4,
    code: 'AUTONOMOUS',
    name: 'Cấp độ 4: Tự trị Toàn diện (Autonomous Sovereign)',
    minTrustScore: 5000,
    description: 'Toàn quyền vận hành Ca Đêm, tự bảo trì, tự tối ưu hóa, tự sửa bug và tạo sản phẩm sẵn sàng cho CEO.',
    allowedActions: ['night_shift_autopilot', 'full_self_mutation', 'auto_qa_healing', 'content_swarm_launch'],
    requiresApprovalFor: ['secret_vault_export'],
    color: '#f59e0b',
  },
};

export interface AutonomyState {
  currentLevel: AutonomyLevel;
  trustScore: number;
  totalApprovedMissions: number;
  totalRejectedMissions: number;
  emergencyLockout: boolean;
  lastUpdated: string;
}

const RUNTIME_DIR = path.join(process.cwd(), 'runtime');
const AUTONOMY_FILE = path.join(RUNTIME_DIR, 'glacia_autonomy_state.json');

const DEFAULT_STATE: AutonomyState = {
  currentLevel: 2,
  trustScore: 850,
  totalApprovedMissions: 42,
  totalRejectedMissions: 2,
  emergencyLockout: false,
  lastUpdated: new Date().toISOString(),
};

function ensureDir(): void {
  if (!fs.existsSync(RUNTIME_DIR)) {
    fs.mkdirSync(RUNTIME_DIR, { recursive: true });
  }
}

export function loadAutonomyState(): AutonomyState {
  ensureDir();
  const backupFile = `${AUTONOMY_FILE}.bak`;
  if (!fs.existsSync(AUTONOMY_FILE)) {
    if (fs.existsSync(backupFile)) {
      try {
        const rawBak = fs.readFileSync(backupFile, 'utf-8');
        return JSON.parse(rawBak) as AutonomyState;
      } catch {}
    }
    saveAutonomyState(DEFAULT_STATE);
    return DEFAULT_STATE;
  }
  try {
    const raw = fs.readFileSync(AUTONOMY_FILE, 'utf-8');
    return JSON.parse(raw) as AutonomyState;
  } catch {
    if (fs.existsSync(backupFile)) {
      try {
        const rawBak = fs.readFileSync(backupFile, 'utf-8');
        return JSON.parse(rawBak) as AutonomyState;
      } catch {}
    }
    return DEFAULT_STATE;
  }
}

export function saveAutonomyState(state: AutonomyState): void {
  ensureDir();
  state.lastUpdated = new Date().toISOString();
  try {
    const backupFile = `${AUTONOMY_FILE}.bak`;
    if (fs.existsSync(AUTONOMY_FILE)) {
      fs.copyFileSync(AUTONOMY_FILE, backupFile);
    }
    fs.writeFileSync(AUTONOMY_FILE, JSON.stringify(state, null, 2), 'utf-8');
  } catch (err) {
    console.error('[GlaciaAutonomyGate] Failed to save autonomy state:', err);
  }
}

/**
 * Check if a requested action is allowed under current autonomy level
 */
export function validateActionPermission(actionType: string): {
  allowed: boolean;
  currentLevel: AutonomyLevel;
  currentLevelName: string;
  requiredLevel: AutonomyLevel;
  reason: string;
} {
  const state = loadAutonomyState();
  if (state.emergencyLockout) {
    return {
      allowed: false,
      currentLevel: state.currentLevel,
      currentLevelName: AUTONOMY_SPECS[state.currentLevel].name,
      requiredLevel: 0,
      reason: 'Hệ thống đang ở trạng thái Khóa Khẩn cấp (Emergency Lockout).',
    };
  }

  // Determine required level for action
  let requiredLevel: AutonomyLevel = 0;
  if (['web_research', 'blender_render', 'banner_design', 'video_generate', 'skill_execute'].includes(actionType)) {
    requiredLevel = 2;
  } else if (['full_dag_pipeline', 'auto_program', 'self_heal_code', 'swarm_shift'].includes(actionType)) {
    requiredLevel = 3;
  } else if (['night_shift_autopilot', 'full_self_mutation'].includes(actionType)) {
    requiredLevel = 4;
  }

  const allowed = state.currentLevel >= requiredLevel;
  const reason = allowed
    ? `Thực thi được phê chuẩn bởi Cấp độ ${state.currentLevel} (${AUTONOMY_SPECS[state.currentLevel].code}).`
    : `Tác vụ [${actionType}] yêu cầu quyền tối thiểu Cấp độ ${requiredLevel} (${AUTONOMY_SPECS[requiredLevel].code}), hiện tại đang ở Cấp độ ${state.currentLevel}.`;

  return {
    allowed,
    currentLevel: state.currentLevel,
    currentLevelName: AUTONOMY_SPECS[state.currentLevel].name,
    requiredLevel,
    reason,
  };
}

/**
 * Adjust Trust Score based on task outcome (with double penalty on rejection)
 */
export function adjustTrustScore(outcome: 'approved' | 'rejected' | 'success' | 'failure'): AutonomyState {
  const state = loadAutonomyState();
  if (outcome === 'approved' || outcome === 'success') {
    state.trustScore += 25;
    state.totalApprovedMissions += 1;
  } else {
    state.trustScore = Math.max(0, state.trustScore - 50); // 2x penalty
    state.totalRejectedMissions += 1;
  }

  // Auto downgrade if trust score falls below current level threshold
  for (let l = 4; l >= 0; l--) {
    const lvl = l as AutonomyLevel;
    if (state.trustScore >= AUTONOMY_SPECS[lvl].minTrustScore) {
      if (state.currentLevel > lvl) {
        state.currentLevel = lvl;
      }
      break;
    }
  }

  saveAutonomyState(state);
  return state;
}

/**
 * Set Autonomy Level explicitly with validation
 */
export function setAutonomyLevel(targetLevel: AutonomyLevel): { success: boolean; state: AutonomyState; message: string } {
  const state = loadAutonomyState();
  const spec = AUTONOMY_SPECS[targetLevel];

  if (state.trustScore < spec.minTrustScore) {
    return {
      success: false,
      state,
      message: `Điểm tin cậy hiện tại (${state.trustScore}) chưa đạt mức yêu cầu tối thiểu (${spec.minTrustScore}) của ${spec.name}.`,
    };
  }

  state.currentLevel = targetLevel;
  saveAutonomyState(state);

  return {
    success: true,
    state,
    message: `Đã nâng cấp Glacia lên ${spec.name}.`,
  };
}
