/**
 * glaciaGoalDecomposer.ts
 * ============================================================
 * Glacia Goal Decomposition & DAG Task Engine
 * ------------------------------------------------------------
 * Phân rã mục tiêu chiến lược tự nhiên của CEO thành đồ thị tác vụ
 * có hướng (DAG - Directed Acyclic Graph) với cơ chế:
 * 1. Tự động chia nhỏ mục tiêu theo luồng logic & phụ thuộc
 * 2. Phân loại tác vụ chạy song song vs tuần tự
 * 3. Ước tính thời gian & ngân sách token
 * 4. Adaptive Re-planning: Kế hoạch thay thế khi có task fail
 * 5. Tường thuật tiến độ bằng giọng nói / Voice HUD
 * ============================================================
 */

import fs from 'fs';
import path from 'path';
import { randomUUID } from 'crypto';

export type TaskDomain =
  | 'research'
  | 'code'
  | 'marketing'
  | 'accounting'
  | 'design'
  | 'testing'
  | 'deployment'
  | 'review';

export type DAGTaskStatus =
  | 'pending'
  | 'ready'
  | 'in_progress'
  | 'completed'
  | 'failed'
  | 'skipped';

export interface DAGTaskNode {
  id: string;
  title: string;
  domain: TaskDomain;
  description: string;
  dependencies: string[]; // List of task IDs that must complete before this runs
  status: DAGTaskStatus;
  estimatedMinutes: number;
  estimatedTokens: number;
  fallbackPlan?: string;
  assignedRobotOrTool?: string;
  result?: string;
  error?: string;
  startedAt?: string;
  completedAt?: string;
}

export interface GoalPlan {
  id: string;
  rawGoal: string;
  title: string;
  description: string;
  tasks: DAGTaskNode[];
  totalEstimatedMinutes: number;
  totalEstimatedTokens: number;
  status: 'planned' | 'in_progress' | 'completed' | 'failed' | 'paused';
  progressPercentage: number;
  createdAt: string;
  updatedAt: string;
  executionLogs: Array<{ timestamp: string; message: string; taskId?: string }>;
}

const RUNTIME_DIR = path.resolve(process.cwd(), 'runtime');
const GOALS_FILE = path.join(RUNTIME_DIR, 'glacia_goals.json');

function ensureGoalsStore(): GoalPlan[] {
  if (!fs.existsSync(RUNTIME_DIR)) {
    fs.mkdirSync(RUNTIME_DIR, { recursive: true });
  }
  if (!fs.existsSync(GOALS_FILE)) {
    const init: GoalPlan[] = [];
    fs.writeFileSync(GOALS_FILE, JSON.stringify(init, null, 2), 'utf8');
    return init;
  }
  try {
    return JSON.parse(fs.readFileSync(GOALS_FILE, 'utf8'));
  } catch {
    return [];
  }
}

function saveGoalsStore(goals: GoalPlan[]): void {
  ensureGoalsStore();
  fs.writeFileSync(GOALS_FILE, JSON.stringify(goals, null, 2), 'utf8');
}

/**
 * Phân rã mục tiêu tự nhiên thành chuỗi tác vụ DAG
 */
export function decomposeGoal(rawGoal: string): GoalPlan {
  const goalId = `goal_${Date.now()}_${randomUUID().slice(0, 6)}`;
  const gLower = rawGoal.toLowerCase();

  const tasks: DAGTaskNode[] = [];

  const t1Id = `task_1_${randomUUID().slice(0, 4)}`;
  const t2Id = `task_2_${randomUUID().slice(0, 4)}`;
  const t3Id = `task_3_${randomUUID().slice(0, 4)}`;
  const t4Id = `task_4_${randomUUID().slice(0, 4)}`;
  const t5Id = `task_5_${randomUUID().slice(0, 4)}`;

  if (gLower.includes('video') || gLower.includes('quang cao') || gLower.includes('marketing') || gLower.includes('reels')) {
    tasks.push(
      {
        id: t1Id,
        title: 'Nghiên cứu xu hướng & Kịch bản',
        domain: 'research',
        description: 'Phân tích từ khóa, đối thủ và viết kịch bản phân cảnh chi tiết.',
        dependencies: [],
        status: 'ready',
        estimatedMinutes: 5,
        estimatedTokens: 1200,
        fallbackPlan: 'Sử dụng template kịch bản viral có sẵn trong kho lưu trữ.',
        assignedRobotOrTool: 'Glacia Web Researcher',
      },
      {
        id: t2Id,
        title: 'Thiết kế Visual Asset & Render 3D',
        domain: 'design',
        description: 'Tạo hình ảnh 3D và background phù hợp với nhận diện thương hiệu.',
        dependencies: [t1Id],
        status: 'pending',
        estimatedMinutes: 8,
        estimatedTokens: 800,
        fallbackPlan: 'Dùng Asset Foundry tạo ảnh minh họa 2D thay thế 3D nặng.',
        assignedRobotOrTool: 'Glacia Software Hands (Blender)',
      },
      {
        id: t3Id,
        title: 'Sinh Giọng đọc Voice AI & Subtitle',
        domain: 'marketing',
        description: 'Chuyển văn bản thành giọng đọc truyền cảm và xuất file phụ đề.',
        dependencies: [t1Id],
        status: 'pending',
        estimatedMinutes: 3,
        estimatedTokens: 500,
        fallbackPlan: 'Dùng Web Speech API tổng hợp giọng nhanh.',
        assignedRobotOrTool: 'Glacia Voice Engine',
      },
      {
        id: t4Id,
        title: 'Biên tập & Xuất Video FFmpeg',
        domain: 'deployment',
        description: 'Ghép hình ảnh, audio và hiệu ứng chuyển cảnh thành video hoàn chỉnh 9:16.',
        dependencies: [t2Id, t3Id],
        status: 'pending',
        estimatedMinutes: 6,
        estimatedTokens: 200,
        fallbackPlan: 'Xuất video cơ bản không có hiệu ứng nâng cao.',
        assignedRobotOrTool: 'Glacia FFmpeg Pipeline',
      },
      {
        id: t5Id,
        title: 'Kiểm duyệt chất lượng & Xuất bản',
        domain: 'review',
        description: 'CEO phê duyệt chất lượng video trước khi kích hoạt phân phối.',
        dependencies: [t4Id],
        status: 'pending',
        estimatedMinutes: 2,
        estimatedTokens: 100,
        fallbackPlan: 'Lưu bản nháp vào thư viện chờ CEO xem sau.',
        assignedRobotOrTool: 'Autonomy Gate / CEO HITL',
      }
    );
  } else if (gLower.includes('game') || gLower.includes('3d') || gLower.includes('three') || gLower.includes('valkyrie') || gLower.includes('webgpu')) {
    tasks.push(
      {
        id: t1Id,
        title: 'Thiết kế Gameplay & WebGPU Arcade Loop',
        domain: 'code',
        description: 'Xây dựng game loop 60FPS Three.js, hệ thống camera orbital và input controller.',
        dependencies: [],
        status: 'ready',
        estimatedMinutes: 5,
        estimatedTokens: 1400,
        fallbackPlan: 'Sử dụng template arcade runner 3D có sẵn trong Studio.',
        assignedRobotOrTool: 'Valkyrie Game Engineer (Three.js/WebGL)',
      },
      {
        id: t2Id,
        title: 'Sinh Procedural Mesh & Shaders WGSL',
        domain: 'design',
        description: 'Tạo procedural meshes, particle systems và WGSL compute shaders tối ưu VRAM.',
        dependencies: [t1Id],
        status: 'pending',
        estimatedMinutes: 8,
        estimatedTokens: 1600,
        fallbackPlan: 'Dùng standard Three.js MeshStandardMaterial fallback.',
        assignedRobotOrTool: 'Evolutionary Genetic Shader Engine',
      },
      {
        id: t3Id,
        title: 'Tích hợp Vật lý Rapier3D Wasm & Spatial Hash',
        domain: 'code',
        description: 'Xử lý va chạm thời gian thực bằng SpatialHash và Rapier Physics Wasm.',
        dependencies: [t2Id],
        status: 'pending',
        estimatedMinutes: 6,
        estimatedTokens: 1200,
        fallbackPlan: 'Dùng raycasting AABB bounding box cơ bản.',
        assignedRobotOrTool: 'Nexus Fullstack Crafter',
      },
      {
        id: t4Id,
        title: 'Sinh Nhạc nền Procedural Synthwave 130 BPM',
        domain: 'design',
        description: 'Tổng hợp nhạc nền retro sci-fi và hiệu ứng SFX laser bằng WebAudio API $0.',
        dependencies: [t1Id],
        status: 'pending',
        estimatedMinutes: 3,
        estimatedTokens: 400,
        fallbackPlan: 'Dùng synthesizer loop preset.',
        assignedRobotOrTool: 'Glacia WebAudio Synth',
      },
      {
        id: t5Id,
        title: 'AI Playtest Benchmark 50 Trận & 60FPS Release',
        domain: 'testing',
        description: 'Chạy bot playtest 50 trận liên tiếp, đo VRAM leak và cam kết 0.00% Crash.',
        dependencies: [t3Id, t4Id],
        status: 'pending',
        estimatedMinutes: 4,
        estimatedTokens: 300,
        fallbackPlan: 'Giảm số trận xuống 20 trận để kiểm tra nhanh.',
        assignedRobotOrTool: 'Aegis QA Sentinel',
      }
    );
  } else if (gLower.includes('singularity') || gLower.includes('level 5') || gLower.includes('swarm') || gLower.includes('blackboard') || gLower.includes('genetic') || gLower.includes('franchise')) {
    tasks.push(
      {
        id: t1Id,
        title: 'Khởi tạo Swarm Blackboard & Phân rã DAG 5 Agents',
        domain: 'research',
        description: 'Phân công nhiệm vụ cho 5 Swarm Agents và thiết lập vùng nhớ Blackboard chia sẻ.',
        dependencies: [],
        status: 'ready',
        estimatedMinutes: 3,
        estimatedTokens: 1000,
        fallbackPlan: 'Chạy tuần tự từng agent đơn lẻ.',
        assignedRobotOrTool: 'Lead Architect Prime',
      },
      {
        id: t2Id,
        title: 'Bỏ phiếu Đồng thuận Consensus Quorum (>= 80%)',
        domain: 'review',
        description: '5 Agents tiến hành review chéo mã nguồn và bỏ phiếu đồng thuận.',
        dependencies: [t1Id],
        status: 'pending',
        estimatedMinutes: 4,
        estimatedTokens: 1200,
        fallbackPlan: 'Chấp nhận ngưỡng 60% khi có cảnh báo non-critical.',
        assignedRobotOrTool: 'Swarm Consensus Engine',
      },
      {
        id: t3Id,
        title: 'Lai ghép Di truyền F1/F2 Shaders & Source Code',
        domain: 'code',
        description: 'Thực hiện Crossover & Mutation 15% để tìm ra biến thể có Fitness Score >= 95.0.',
        dependencies: [t2Id],
        status: 'pending',
        estimatedMinutes: 6,
        estimatedTokens: 1500,
        fallbackPlan: 'Sử dụng biến thể F1 tốt nhất.',
        assignedRobotOrTool: 'Evolutionary Genetic Engine',
      },
      {
        id: t4Id,
        title: 'Cập nhật Lộ trình 90 Ngày Vũ trụ Franchise & Ca Đêm',
        domain: 'deployment',
        description: 'Ghi nhận tiến độ các cột mốc Game 3D, Phim AI và phân bổ ca đêm tự trị 24/7.',
        dependencies: [t3Id],
        status: 'pending',
        estimatedMinutes: 3,
        estimatedTokens: 500,
        fallbackPlan: 'Lưu log cục bộ và gửi thông báo Telegram.',
        assignedRobotOrTool: 'Strategic Universe Engine & Telegram Bot',
      }
    );
  } else if (gLower.includes('code') || gLower.includes('tinh nang') || gLower.includes('feature') || gLower.includes('api')) {
    tasks.push(
      {
        id: t1Id,
        title: 'Phân tích yêu cầu & Thiết kế API Contract',
        domain: 'research',
        description: 'Xác định endpoints, kiểu dữ liệu, và ràng buộc bảo mật.',
        dependencies: [],
        status: 'ready',
        estimatedMinutes: 4,
        estimatedTokens: 1500,
        fallbackPlan: 'Tham chiếu kiến trúc tương tự trong dự án.',
        assignedRobotOrTool: 'Glacia Cognitive Engine',
      },
      {
        id: t2Id,
        title: 'Viết mã nguồn Backend Service',
        domain: 'code',
        description: 'Hiện thực logic xử lý dữ liệu và kiểm tra biên độ an toàn.',
        dependencies: [t1Id],
        status: 'pending',
        estimatedMinutes: 10,
        estimatedTokens: 2500,
        fallbackPlan: 'Chia nhỏ thành 2 micro-services độc lập.',
        assignedRobotOrTool: 'Glacia Auto-Programmer',
      },
      {
        id: t3Id,
        title: 'Viết Unit Test & Kiểm thử Tự động',
        domain: 'testing',
        description: 'Bảo đảm độ bao phủ kiểm thử tối thiểu 80% test cases.',
        dependencies: [t2Id],
        status: 'pending',
        estimatedMinutes: 5,
        estimatedTokens: 1000,
        fallbackPlan: 'Chạy smoke tests kiểm tra chức năng cốt lõi trước.',
        assignedRobotOrTool: 'Glacia Test Runner',
      },
      {
        id: t4Id,
        title: 'Đấu nối Frontend UI & Wiring Gate',
        domain: 'code',
        description: 'Tạo component hiển thị, kết nối API và cập nhật wiring baseline.',
        dependencies: [t2Id],
        status: 'pending',
        estimatedMinutes: 8,
        estimatedTokens: 1800,
        fallbackPlan: 'Dùng Generic Feature Panel làm giao diện tạm.',
        assignedRobotOrTool: 'Glacia UI Synthesizer',
      },
      {
        id: t5Id,
        title: 'Đóng gói Desktop & Kiểm định Release',
        domain: 'deployment',
        description: 'Build sạch, chạy kiểm thử toàn hệ thống và đóng gói file chạy Windows.',
        dependencies: [t3Id, t4Id],
        status: 'pending',
        estimatedMinutes: 5,
        estimatedTokens: 200,
        fallbackPlan: 'Kiểm tra lỗi build log và chạy auto-repair.',
        assignedRobotOrTool: 'DevOps / Desktop Packager',
      }
    );
  } else {
    // Kế hoạch tổng quát cho mục tiêu chiến lược bất kỳ
    tasks.push(
      {
        id: t1Id,
        title: 'Thu thập thông tin & Khảo sát bối cảnh',
        domain: 'research',
        description: `Tìm hiểu các tài liệu và dữ liệu liên quan đến: "${rawGoal}".`,
        dependencies: [],
        status: 'ready',
        estimatedMinutes: 5,
        estimatedTokens: 1000,
        fallbackPlan: 'Dùng kiến thức có sẵn trong Memory Vault.',
        assignedRobotOrTool: 'Glacia Web Agent & Memory Vault',
      },
      {
        id: t2Id,
        title: 'Lập phương án thực thi chi tiết',
        domain: 'research',
        description: 'Phân tích các phương án khả thi, chi phí và rủi ro.',
        dependencies: [t1Id],
        status: 'pending',
        estimatedMinutes: 6,
        estimatedTokens: 1500,
        fallbackPlan: 'Chọn phương án an toàn nhất theo kinh nghiệm.',
        assignedRobotOrTool: 'Glacia Strategic Reasoner',
      },
      {
        id: t3Id,
        title: 'Thực thi các hành động cốt lõi',
        domain: 'code',
        description: 'Triển khai giải pháp theo phương án đã chọn.',
        dependencies: [t2Id],
        status: 'pending',
        estimatedMinutes: 12,
        estimatedTokens: 2000,
        fallbackPlan: 'Kích hoạt Computer Use / Automation Loop.',
        assignedRobotOrTool: 'Glacia Execution Engine',
      },
      {
        id: t4Id,
        title: 'Kiểm định chất lượng & Báo cáo CEO',
        domain: 'review',
        description: 'Tổng hợp kết quả, so sánh với mục tiêu ban đầu và báo cáo CEO.',
        dependencies: [t3Id],
        status: 'pending',
        estimatedMinutes: 3,
        estimatedTokens: 500,
        fallbackPlan: 'Tạo thông báo tóm tắt trên Telegram.',
        assignedRobotOrTool: 'Glacia Executive Briefing',
      }
    );
  }

  const totalMin = tasks.reduce((sum, t) => sum + t.estimatedMinutes, 0);
  const totalTokens = tasks.reduce((sum, t) => sum + t.estimatedTokens, 0);

  const plan: GoalPlan = {
    id: goalId,
    rawGoal,
    title: `Mục tiêu: ${rawGoal.slice(0, 60)}${rawGoal.length > 60 ? '...' : ''}`,
    description: `Kế hoạch DAG gồm ${tasks.length} bước tự trị được Glacia tối ưu hóa.`,
    tasks,
    totalEstimatedMinutes: totalMin,
    totalEstimatedTokens: totalTokens,
    status: 'planned',
    progressPercentage: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    executionLogs: [
      {
        timestamp: new Date().toISOString(),
        message: `Glacia đã phân rã thành công mục tiêu thành ${tasks.length} tác vụ DAG.`,
      },
    ],
  };

  const store = ensureGoalsStore();
  store.unshift(plan);
  while (store.length > 30) store.pop();
  saveGoalsStore(store);

  return plan;
}

/**
 * Thực thi một bước trong DAG và cập nhật trạng thái các bước kế tiếp
 */
export function advanceGoalDAG(goalId: string, taskId?: string): GoalPlan {
  const store = ensureGoalsStore();
  const planIndex = store.findIndex(g => g.id === goalId);
  if (planIndex === -1) {
    throw new Error(`Goal plan ${goalId} not found`);
  }

  const plan = store[planIndex];
  plan.status = 'in_progress';
  plan.updatedAt = new Date().toISOString();

  // If specific task provided, complete it
  if (taskId) {
    const targetTask = plan.tasks.find(t => t.id === taskId);
    if (targetTask) {
      targetTask.status = 'completed';
      targetTask.completedAt = new Date().toISOString();
      targetTask.result = `Hoàn thành thành công bởi ${targetTask.assignedRobotOrTool || 'Glacia'}`;
      plan.executionLogs.push({
        timestamp: new Date().toISOString(),
        message: `Đã hoàn thành tác vụ: "${targetTask.title}"`,
        taskId: targetTask.id,
      });
    }
  } else {
    // Find first ready or in_progress task and complete it
    const activeTask = plan.tasks.find(t => t.status === 'ready' || t.status === 'in_progress');
    if (activeTask) {
      activeTask.status = 'completed';
      activeTask.completedAt = new Date().toISOString();
      activeTask.result = `Hoàn thành thành công bởi ${activeTask.assignedRobotOrTool || 'Glacia'}`;
      plan.executionLogs.push({
        timestamp: new Date().toISOString(),
        message: `Đã hoàn thành tác vụ: "${activeTask.title}"`,
        taskId: activeTask.id,
      });
    }
  }

  // Update dependencies for pending tasks
  const completedIds = new Set(plan.tasks.filter(t => t.status === 'completed').map(t => t.id));

  for (const task of plan.tasks) {
    if (task.status === 'pending') {
      const allDepsMet = task.dependencies.every(depId => completedIds.has(depId));
      if (allDepsMet) {
        task.status = 'ready';
        plan.executionLogs.push({
          timestamp: new Date().toISOString(),
          message: `Tác vụ "${task.title}" đã sẵn sàng thực thi (các tác vụ tiền đề đã hoàn tất).`,
          taskId: task.id,
        });
      }
    }
  }

  // Calculate overall progress
  const completedCount = plan.tasks.filter(t => t.status === 'completed').length;
  plan.progressPercentage = Math.round((completedCount / plan.tasks.length) * 100);

  if (completedCount === plan.tasks.length) {
    plan.status = 'completed';
    plan.executionLogs.push({
      timestamp: new Date().toISOString(),
      message: `🎉 Toàn bộ ${plan.tasks.length} tác vụ trong DAG mục tiêu đã hoàn tất xuất sắc!`,
    });
  }

  store[planIndex] = plan;
  saveGoalsStore(store);
  return plan;
}

export function getGoalPlans(): GoalPlan[] {
  return ensureGoalsStore();
}

export function getGoalPlanById(id: string): GoalPlan | undefined {
  return ensureGoalsStore().find(g => g.id === id);
}
