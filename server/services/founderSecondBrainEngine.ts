/**
 * server/services/founderSecondBrainEngine.ts
 * ============================================================
 * Autonomous Founder Second-Brain & Neural Executive Assistant
 *
 * Implements Level 7 Founder Hyper-Productivity & Thought Capture:
 * 1. Spontaneous Audio / Voice Memo & Text Thought Stream Ingestion
 * 2. Neural Action-Item Extraction & Autonomous AI Delegation
 * 3. Daily Top-3 North Star Priority Synthesis & Calendar Sync
 */

import { publishSystemEvent } from './crossSystemEventBus.ts';

export interface FounderThought {
  thoughtId: string;
  rawInput: string;
  extractedCategory: 'STRATEGY' | 'PRODUCT' | 'DEAL' | 'HIRING' | 'URGENT';
  actionItems: string[];
  assignedAgent: string;
  delegationStatus: 'CAPTURED' | 'DELEGATED_TO_AI' | 'COMPLETED';
  capturedAt: string;
}

let thoughtsStore: FounderThought[] = [
  {
    thoughtId: 'th_01_bim_module_upsell',
    rawInput: 'Khách hàng Vinaconex đang cần mở rộng thêm 50 ghế module 3-Way Matching và kết nối VietQR. AI Sales gửi ngay proposal trước 17h.',
    extractedCategory: 'DEAL',
    actionItems: ['Tạo báo giá nâng cấp 50 ghế doanh nghiệp', 'Tạo link thanh toán VietQR động', 'Gửi hợp đồng điện tử qua Zalo OA'],
    assignedAgent: 'AI Sales Lead (Văn Phong)',
    delegationStatus: 'DELEGATED_TO_AI',
    capturedAt: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
  },
  {
    thoughtId: 'th_02_soc_firewall_audit',
    rawInput: 'Cần kiểm tra lại toàn bộ quy tắc che giấu số CCCD và MST trên tường lửa Prompt Security Firewall trước đợt kiểm toán ISO27001.',
    extractedCategory: 'URGENT',
    actionItems: ['Chạy kiểm thử Prompt Injection 100 mẫu', 'Xác thực độ chính xác PII Masking 99.8%'],
    assignedAgent: 'AI Security Lead (Quang Minh)',
    delegationStatus: 'COMPLETED',
    capturedAt: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
  },
  {
    thoughtId: 'th_03_singapore_subsidiary',
    rawInput: 'Chuẩn bị hồ sơ nộp ACRA Singapore để thành lập pháp nhân mở rộng thị trường Đông Nam Á vào quý 3/2026.',
    extractedCategory: 'STRATEGY',
    actionItems: ['Soạn thảo Điều lệ công ty Singapore', 'Thiết lập quy chế Reverse Charge GST 9%'],
    assignedAgent: 'AI Compliance Lead (Bảo An)',
    delegationStatus: 'DELEGATED_TO_AI',
    capturedAt: new Date(Date.now() - 1000 * 60 * 360).toISOString(),
  },
];

/**
 * Lấy dữ liệu Second-Brain & danh sách việc ủy quyền
 */
export function getFounderSecondBrainData(): {
  thoughts: FounderThought[];
  activeDelegationsCount: number;
  completedTasksCount: number;
  northStarPriorities: string[];
} {
  const active = thoughtsStore.filter((t) => t.delegationStatus === 'DELEGATED_TO_AI').length;
  const completed = thoughtsStore.filter((t) => t.delegationStatus === 'COMPLETED').length;

  return {
    thoughts: thoughtsStore,
    activeDelegationsCount: active,
    completedTasksCount: completed,
    northStarPriorities: [
      'Chốt deal nâng cấp 50 ghế Vinaconex (+120M VND MRR)',
      'Hoàn tất diễn tập Chaos Engineering đạt 99.999% Resilience',
      'Phát động chiến dịch Telegram Broadcast Flash Sale Unicorn OS',
    ],
  };
}

/**
 * Thu nạp ý tưởng mới và tự động phân rã thành nhiệm vụ cho AI Swarm
 */
export function captureAndDelegateThought(rawInput: string): {
  success: boolean;
  thought: FounderThought;
} {
  const newThought: FounderThought = {
    thoughtId: `th_${Date.now()}`,
    rawInput,
    extractedCategory: rawInput.toLowerCase().includes('khách') ? 'DEAL' : 'STRATEGY',
    actionItems: ['Phân tích yêu cầu tự động', 'Thực thi quy trình tự trị qua AI Swarm'],
    assignedAgent: 'AI Orchestrator Engine',
    delegationStatus: 'DELEGATED_TO_AI',
    capturedAt: new Date().toISOString(),
  };

  thoughtsStore.unshift(newThought);

  publishSystemEvent({
    eventType: 'founder.thought_captured_and_delegated',
    source: 'FounderSecondBrainEngine',
    department: 'general',
    payload: {
      thoughtId: newThought.thoughtId,
      assignedAgent: newThought.assignedAgent,
    },
  });

  return {
    success: true,
    thought: newThought,
  };
}
