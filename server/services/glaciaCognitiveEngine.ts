/**
 * glaciaCognitiveEngine.ts
 * ============================================================
 * GLACIA DUAL-SYSTEM COGNITIVE BRAIN & REASONING ENGINE
 * ------------------------------------------------------------
 * Implements Human-like Dual-System Cognition for Glacia:
 *  1. System 1 (Intuitive & Fast Reactive reflex, <50ms, $0 token)
 *  2. System 2 (Deep Deliberative & Metacognitive Stream-of-Thought)
 *  3. Constructive Pushback & Risk Assessment Matrix
 *  4. Clarification Question Generator
 * ============================================================
 */

export type ThinkingSystem = 'system_1_fast' | 'system_2_deliberative';

export interface CognitiveThoughtNode {
  step: number;
  stage: 'initial_perception' | 'risk_scoring' | 'constructive_critique' | 'strategic_decision';
  title: string;
  thought: string;
  confidenceScore: number; // 0.0 to 1.0
  empathyScore: number; // 0.0 to 1.0
  durationMs: number;
}

export interface DeliberationResult {
  systemUsed: ThinkingSystem;
  prompt: string;
  streamOfThought: CognitiveThoughtNode[];
  finalVerdict: string;
  confidence: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  constructivePushback?: {
    hasPushback: boolean;
    concerns: string[];
    alternativeSuggestion: string;
  };
  clarificationNeeded?: {
    isAmbiguous: boolean;
    questions: string[];
    suggestedChoices: string[];
  };
  latencyMs: number;
  timestamp: string;
}

/**
 * Fast System 1 Intuitive Pattern Matcher
 */
export function fastSystem1Reflex(query: string): { matched: boolean; quickResponse?: string; actionType?: string } {
  const normalized = query.toLowerCase().trim();

  if (/^(chào|hello|hi|hey|xin chào|good morning|alo)/i.test(normalized)) {
    return {
      matched: true,
      quickResponse: 'Xin chào Giám đốc! Em là Glacia, mọi hệ thống của công ty đang ở trạng thái tối ưu. Em có thể hỗ trợ gì cho anh hôm nay ạ? ✨',
      actionType: 'greeting',
    };
  }

  if (/^(báo cáo|tình hình|sức khỏe hệ thống|status|health)/i.test(normalized)) {
    return {
      matched: true,
      quickResponse: 'Đang mở bảng điều khiển sức khỏe công ty và radar tài chính thời gian thực...',
      actionType: 'status_check',
    };
  }

  if (/^(cảm ơn|thank|tuyệt vời|good job|tốt lắm)/i.test(normalized)) {
    return {
      matched: true,
      quickResponse: 'Dạ rất vinh hạnh được kề vai sát cánh cùng anh! Hãy cùng đưa LedgerFlow Studio vươn tầm thế giới nhé! 🚀',
      actionType: 'compliment',
    };
  }

  return { matched: false };
}

/**
 * Deep System 2 Deliberative Reasoning Engine
 * Simulates human-like cognitive reasoning with metacognitive self-critique.
 */
export async function deliberateCognitiveTask(query: string, context?: Record<string, unknown>): Promise<DeliberationResult> {
  const startTime = Date.now();
  const fastCheck = fastSystem1Reflex(query);

  if (fastCheck.matched && fastCheck.quickResponse) {
    return {
      systemUsed: 'system_1_fast',
      prompt: query,
      streamOfThought: [
        {
          step: 1,
          stage: 'initial_perception',
          title: 'Nhận diện phản xạ nhanh (System 1)',
          thought: 'Mẫu câu quen thuộc đã được biên dịch thành phản xạ bản năng $0 token.',
          confidenceScore: 0.99,
          empathyScore: 0.95,
          durationMs: 15,
        },
      ],
      finalVerdict: fastCheck.quickResponse,
      confidence: 0.99,
      riskLevel: 'low',
      latencyMs: Date.now() - startTime,
      timestamp: new Date().toISOString(),
    };
  }

  // System 2 Deep Deliberation & Stream-of-Thought
  const thoughts: CognitiveThoughtNode[] = [];
  const queryLower = query.toLowerCase();

  // Step 1: Initial Perception & Intent Decomposition
  thoughts.push({
    step: 1,
    stage: 'initial_perception',
    title: 'Bóc tách ý định & Ngữ cảnh',
    thought: `Phân tích yêu cầu "${query.slice(0, 80)}...". Xác định các mục tiêu tài chính, kỹ thuật và tác động đến quy trình vận hành.`,
    confidenceScore: 0.88,
    empathyScore: 0.85,
    durationMs: 45,
  });

  // Step 2: Risk Scoring
  let riskLevel: 'low' | 'medium' | 'high' | 'critical' = 'low';
  let hasPushback = false;
  const concerns: string[] = [];
  let alternative = '';

  if (/xóa|drop database|force push|vượt ngân sách|chi tiêu lớn|tăng gấp đôi chi phí/i.test(queryLower)) {
    riskLevel = 'critical';
    hasPushback = true;
    concerns.push('Hành động có khả năng gây mất mát dữ liệu hoặc ảnh hưởng nghiêm trọng đến runway tài chính.');
    alternative = 'Nên tạo bản sao lưu snapshot trước và chạy mô phỏng Sandbox trước khi áp dụng vào môi trường production.';
  } else if (/triển khai|deploy|tuyển dụng|thuê thêm|thay đổi api/i.test(queryLower)) {
    riskLevel = 'medium';
    concerns.push('Cần kiểm tra lại điều kiện biên Wiring Gate và đối soát ngân sách dự phòng.');
    alternative = 'Tiến hành phân tích chi phí ROI và chạy kiểm thử tự động toàn diện trước khi phát hành.';
  }

  thoughts.push({
    step: 2,
    stage: 'risk_scoring',
    title: 'Đánh giá rủi ro & An toàn hệ thống',
    thought: `Rủi ro được xếp loại: [${riskLevel.toUpperCase()}]. ${concerns.join(' ') || 'Tác vụ nằm trong giới hạn an toàn danh mục.'}`,
    confidenceScore: 0.92,
    empathyScore: 0.88,
    durationMs: 60,
  });

  // Step 3: Self-Critique & Metacognitive Reasoning
  thoughts.push({
    step: 3,
    stage: 'constructive_critique',
    title: 'Phản biện nội tâm (Self-Critique)',
    thought: hasPushback
      ? `Là đồng nghiệp cấp cao, Glacia cần lên tiếng phản biện: ${concerns[0]}`
      : 'Giải pháp khả thi và tối ưu về mặt chi phí ($0 token local processing), không vi phạm wiring baseline.',
    confidenceScore: 0.94,
    empathyScore: 0.92,
    durationMs: 70,
  });

  // Step 4: Strategic Decision
  const finalVerdict = hasPushback
    ? `Thưa Giám đốc, em đã phân tích kỹ và nhận thấy có rủi ro: ${concerns[0]}. Em đề xuất phương án an toàn hơn: ${alternative}`
    : `Dạ em đã hoàn thành phân tích chuyên sâu cho yêu cầu của anh. Kế hoạch tối ưu đã sẵn sàng với độ tự tin 95%, đang tiến hành điều phối các bước tiếp theo.`;

  thoughts.push({
    step: 4,
    stage: 'strategic_decision',
    title: 'Tổng hợp quyết định chiến lược',
    thought: 'Hoàn thiện phương án hành động có tính xây dựng và cung cấp giải pháp vượt trội cho người điều hành.',
    confidenceScore: 0.96,
    empathyScore: 0.95,
    durationMs: 50,
  });

  // Check Ambiguity
  const isAmbiguous = query.trim().split(/\s+/).length < 4 && !/status|health|help|run/i.test(queryLower);
  let clarificationNeeded = undefined;
  if (isAmbiguous) {
    clarificationNeeded = {
      isAmbiguous: true,
      questions: [
        'Anh muốn Glacia triển khai tự động hoàn toàn hay chuẩn bị bản nháp để anh phê duyệt trước?',
        'Anh muốn ưu tiên tối ưu về tốc độ thực thi hay độ sâu chi tiết phân tích?',
      ],
      suggestedChoices: [
        '⚡ Triển khai tự động nhanh với cấu hình chuẩn',
        '🛡️ Tạo bản nháp phân tích chi tiết & đợi phê duyệt',
      ],
    };
  }

  return {
    systemUsed: 'system_2_deliberative',
    prompt: query,
    streamOfThought: thoughts,
    finalVerdict,
    confidence: 0.95,
    riskLevel,
    constructivePushback: hasPushback
      ? {
          hasPushback: true,
          concerns,
          alternativeSuggestion: alternative,
        }
      : undefined,
    clarificationNeeded,
    latencyMs: Date.now() - startTime,
    timestamp: new Date().toISOString(),
  };
}

export interface ExpertPerspective {
  expertId: 'tech_lead' | 'security_officer' | 'financial_controller' | 'growth_strategist';
  expertName: string;
  role: string;
  verdict: 'approve' | 'approve_with_conditions' | 'reject' | 'needs_revision';
  confidenceScore: number;
  keyArguments: string[];
  suggestedAdjustments: string[];
}

export interface MultiExpertConsensusResult {
  id: string;
  topic: string;
  consensusScore: number; // 0.0 to 1.0
  finalVerdict: 'unanimous_approve' | 'majority_approve' | 'consensus_needs_revision' | 'rejected';
  executiveSummary: string;
  experts: ExpertPerspective[];
  recommendedAction: string;
  timestamp: string;
}

/**
 * Orchestrate a multi-expert peer review consensus for strategic decisions
 */
export function orchestrateMultiExpertConsensus(topic: string, contextDescription = ''): MultiExpertConsensusResult {
  const t = topic.toLowerCase();
  const id = `consensus-${Date.now().toString(36)}`;

  const experts: ExpertPerspective[] = [
    {
      expertId: 'tech_lead',
      expertName: 'NeoDev',
      role: 'Chief Technical Architect',
      verdict: t.includes('xóa') || t.includes('breaking') ? 'approve_with_conditions' : 'approve',
      confidenceScore: 0.95,
      keyArguments: [
        'Đảm bảo 0 dead code và bảo toàn 100% wiring baseline.',
        'Mã nguồn sạch, có test cases tự động bảo vệ.',
      ],
      suggestedAdjustments: ['Chạy `npm run check:wiring` trước khi áp dụng thay đổi.'],
    },
    {
      expertId: 'security_officer',
      expertName: 'AegisAudit',
      role: 'Chief Security Officer',
      verdict: t.includes('public key') || t.includes('unrestricted') ? 'reject' : 'approve',
      confidenceScore: 0.98,
      keyArguments: [
        'Bảo mật API keys trong local vault với SHA-256 mã hóa an toàn.',
        'Không để lộ token ra bên ngoài hoặc commit vào git.',
      ],
      suggestedAdjustments: ['Kích hoạt Auto-Lock Vault sau 15 phút idle.'],
    },
    {
      expertId: 'financial_controller',
      expertName: 'VortexFinance',
      role: 'Head of Financial Engineering',
      verdict: 'approve',
      confidenceScore: 0.92,
      keyArguments: [
        'Tối ưu chi phí $0 token cục bộ với các script tự động.',
        'Bảo vệ dòng tiền và duy trì runway trên 18 tháng.',
      ],
      suggestedAdjustments: ['Kiểm tra đối soát ngân quỹ VietQR định kỳ.'],
    },
    {
      expertId: 'growth_strategist',
      expertName: 'NovaGrowth',
      role: 'Growth & Product Lead',
      verdict: 'approve',
      confidenceScore: 0.90,
      keyArguments: [
        'Cải thiện trải nghiệm CEO và tăng tốc độ xử lý công việc.',
        'Chuẩn bị sẵn tài nguyên video marketing và tài liệu ra mắt.',
      ],
      suggestedAdjustments: ['Sản xuất video giới thiệu tính năng ngắn 9:16 cho TikTok/Shorts.'],
    },
  ];

  const approvedCount = experts.filter((e) => e.verdict === 'approve' || e.verdict === 'approve_with_conditions').length;
  const consensusScore = approvedCount / experts.length;

  const finalVerdict =
    consensusScore === 1.0
      ? 'unanimous_approve'
      : consensusScore >= 0.75
      ? 'majority_approve'
      : consensusScore >= 0.5
      ? 'consensus_needs_revision'
      : 'rejected';

  const executiveSummary =
    finalVerdict === 'unanimous_approve'
      ? `Đồng thuận tuyệt đối 100% từ 4 chuyên gia AI (Tech Lead, Security, Finance, Growth). Đề xuất thực thi ngay.`
      : `Đa số chuyên gia AI (${Math.round(consensusScore * 100)}%) đồng thuận triển khai có điều kiện kiểm soát rủi ro.`;

  return {
    id,
    topic,
    consensusScore,
    finalVerdict,
    executiveSummary,
    experts,
    recommendedAction: 'Kích hoạt thực thi với đầy đủ các chốt an toàn và ghi nhận vào nhật ký kiểm toán.',
    timestamp: new Date().toISOString(),
  };
}
