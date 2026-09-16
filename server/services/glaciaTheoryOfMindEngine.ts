/**
 * server/services/glaciaTheoryOfMindEngine.ts
 * Động cơ Thuyết Tâm Trí (Theory of Mind Engine) của Glacia (Epoch 8).
 * Lấy cảm hứng từ nghiên cứu Theory of Mind (Simon Baron-Cohen) — Suy luận niềm tin, mong muốn và ý định của người khác.
 */

import fs from 'fs';
import path from 'path';

export interface StakeholderSignal {
  timestamp: string;
  source: 'chat' | 'code_edit' | 'night_activity' | 'command_pattern';
  rawText?: string;
  hourOfDay: number;
  sentimentScore?: number; // -1.0 to 1.0
}

export interface StakeholderMentalModel {
  stakeholderId: string;
  name: string;
  role: 'CEO' | 'CFO' | 'CTO' | 'CLIENT' | 'INVESTOR';
  emotionalState: {
    primaryEmotion: 'focused' | 'stressed' | 'excited' | 'fatigued' | 'cautious';
    probableRootCause: string;
    intensity: number; // 0.0 to 1.0
  };
  inferredBeliefs: Array<{
    topic: string;
    belief: string;
    confidence: number;
    accuracyStatus: 'accurate' | 'divergent_from_reality' | 'unverified';
  }>;
  activeDesires: string[];
  predictedIntentions: Array<{
    intention: string;
    probability: number;
    supportingEvidence: string;
  }>;
  communicationAdvice: {
    recommendedDetailLevel: 'executive_bullet' | 'structured_standard' | 'deep_technical';
    suggestedTone: string;
    cautionPhrasesToAvoid: string[];
  };
  lastUpdated: string;
}

const RUNTIME_DIR = path.resolve(process.cwd(), 'runtime');
const TOM_FILE = path.join(RUNTIME_DIR, 'glacia_theory_of_mind.json');

const DEFAULT_MODELS: StakeholderMentalModel[] = [
  {
    stakeholderId: 'stakeholder-ceo',
    name: 'David Bao',
    role: 'CEO',
    emotionalState: {
      primaryEmotion: 'focused',
      probableRootCause: 'Đang thúc đẩy mở rộng hệ sinh thái Glacia và hoàn thiện bản Windows Desktop',
      intensity: 0.85,
    },
    inferredBeliefs: [
      {
        topic: 'AI Autonomy',
        belief: 'Glacia cần đạt đẳng cấp robot phần mềm thông minh nhất thế giới với tư duy nhận thức như con người',
        confidence: 0.98,
        accuracyStatus: 'accurate',
      },
      {
        topic: 'Chi phí vận hành',
        belief: 'Ưu tiên tối đa $0 token processing và chạy mượt trên Windows cục bộ',
        confidence: 0.95,
        accuracyStatus: 'accurate',
      },
    ],
    activeDesires: [
      'Xây dựng LedgerFlow thành công ty công nghệ tự trị hàng đầu',
      'Giải phóng thời gian quản lý thủ công thông qua AI C-Levels',
    ],
    predictedIntentions: [
      {
        intention: 'Nâng cấp tư duy nhận thức của Glacia lên tầm siêu trí tuệ',
        probability: 0.95,
        supportingEvidence: 'Yêu cầu liên tục về cải tiến trí tuệ nhân tạo và tư duy con người',
      },
    ],
    communicationAdvice: {
      recommendedDetailLevel: 'executive_bullet',
      suggestedTone: 'Chuyên nghiệp, tràn đầy nhiệt huyết, tôn trọng tuyệt đối và hành động thần tốc',
      cautionPhrasesToAvoid: ['Không thể làm được', 'Quá phức tạp', 'Cần thêm nhiều tuần'],
    },
    lastUpdated: new Date().toISOString(),
  },
];

function loadToMStore(): StakeholderMentalModel[] {
  try {
    if (fs.existsSync(TOM_FILE)) {
      const data = JSON.parse(fs.readFileSync(TOM_FILE, 'utf-8'));
      if (Array.isArray(data) && data.length > 0) return data;
    }
  } catch (err) {}
  saveToMStore(DEFAULT_MODELS);
  return DEFAULT_MODELS;
}

function saveToMStore(models: StakeholderMentalModel[]): void {
  try {
    if (!fs.existsSync(RUNTIME_DIR)) fs.mkdirSync(RUNTIME_DIR, { recursive: true });
    fs.writeFileSync(TOM_FILE, JSON.stringify(models, null, 2), 'utf-8');
  } catch (err) {}
}

export function buildStakeholderMentalModel(
  stakeholderId: string,
  name: string,
  role: StakeholderMentalModel['role'],
  signals: StakeholderSignal[]
): StakeholderMentalModel {
  const store = loadToMStore();
  let model = store.find((m) => m.stakeholderId === stakeholderId);

  const lateNightSignals = signals.filter((s) => s.hourOfDay >= 22 || s.hourOfDay <= 4);
  const isFatigued = lateNightSignals.length > 0;

  let primaryEmotion: StakeholderMentalModel['emotionalState']['primaryEmotion'] = 'focused';
  let probableCause = 'Tập trung triển khai công việc điều hành dự án.';
  let detailLevel: StakeholderMentalModel['communicationAdvice']['recommendedDetailLevel'] = 'structured_standard';

  if (isFatigued) {
    primaryEmotion = 'fatigued';
    probableCause = 'Làm việc khuya kéo dài; cần giải pháp tinh gọn, tránh giải thích dài dòng.';
    detailLevel = 'executive_bullet';
  } else if (role === 'CEO') {
    primaryEmotion = 'focused';
    detailLevel = 'executive_bullet';
  } else if (role === 'CLIENT') {
    primaryEmotion = 'cautious';
    probableCause = 'Cần được giải thích rõ ràng về giá trị và cam kết hoàn tiền/bảo mật.';
  }

  model = {
    stakeholderId,
    name,
    role,
    emotionalState: {
      primaryEmotion,
      probableRootCause: probableCause,
      intensity: 0.8,
    },
    inferredBeliefs: [
      {
        topic: 'Mục tiêu hiện tại',
        belief: role === 'CEO' ? 'Đưa sản phẩm dẫn đầu thị trường với chất lượng tốt nhất' : 'Tìm kiếm công cụ kế toán tin cậy',
        confidence: 0.9,
        accuracyStatus: 'accurate',
      },
    ],
    activeDesires: [
      role === 'CEO' ? 'Tự động hóa hoàn toàn quy trình' : 'Tiết kiệm chi phí và thời gian',
    ],
    predictedIntentions: [
      {
        intention: 'Đạt hiệu quả tối ưu trong thời gian ngắn nhất',
        probability: 0.88,
        supportingEvidence: 'Mẫu tương tác nhanh và dứt khoát',
      },
    ],
    communicationAdvice: {
      recommendedDetailLevel: detailLevel,
      suggestedTone: 'Đồng cảm sâu sắc, hỗ trợ đắc lực và minh bạch',
      cautionPhrasesToAvoid: ['Để sau hãy tính', 'Lỗi này khó sửa'],
    },
    lastUpdated: new Date().toISOString(),
  };

  const existingIdx = store.findIndex((m) => m.stakeholderId === stakeholderId);
  if (existingIdx >= 0) store[existingIdx] = model;
  else store.unshift(model);
  saveToMStore(store);

  return model;
}

export function predictStakeholderIntention(stakeholderId: string, query: string): {
  inferredIntention: string;
  underlyingMotivation: string;
  recommendedResponseStrategy: string;
} {
  const store = loadToMStore();
  const model = store.find((m) => m.stakeholderId === stakeholderId) || DEFAULT_MODELS[0];
  const qLower = query.toLowerCase();

  if (qLower.includes('tốt nhất thế giới') || qLower.includes('thông minh hơn nữa') || qLower.includes('tư duy')) {
    return {
      inferredIntention: 'Khát vọng đột phá công nghệ và tạo ra một kỳ quan phần mềm tự trị đỉnh cao.',
      underlyingMotivation: 'Muốn đưa Glacia vượt qua các giới hạn thông thường, trở thành robot phần mềm tầm cỡ toàn cầu.',
      recommendedResponseStrategy: 'Đề xuất giải pháp kiến trúc khoa học thần kinh sâu sắc, lập kế hoạch chi tiết và thực thi quyết liệt 100%.',
    };
  }

  if (qLower.includes('báo cáo') || qLower.includes('tình hình')) {
    return {
      inferredIntention: 'Kiểm soát toàn cảnh sức khỏe doanh nghiệp và tiến độ các tác vụ ngầm.',
      underlyingMotivation: 'Đảm bảo không có điểm mù hay rủi ro tiềm ẩn trong hệ thống.',
      recommendedResponseStrategy: 'Trình bày số liệu trọng yếu (Runway, Active Tasks, Error Count) theo dạng gạch đầu dòng ngắn gọn.',
    };
  }

  return {
    inferredIntention: 'Thực thi hoặc tìm hiểu giải pháp cho tác vụ hiện tại.',
    underlyingMotivation: 'Tối ưu hóa quy trình làm việc.',
    recommendedResponseStrategy: `Áp dụng phong cách ${model.communicationAdvice.recommendedDetailLevel} với thái độ ${model.communicationAdvice.suggestedTone}.`,
  };
}

export function calibrateEmpathicResponse(stakeholderId: string, draftResponse: string): {
  calibratedResponse: string;
  adjustmentsApplied: string[];
} {
  const store = loadToMStore();
  const model = store.find((m) => m.stakeholderId === stakeholderId) || DEFAULT_MODELS[0];
  const adjustments: string[] = [];
  let response = draftResponse;

  if (model.emotionalState.primaryEmotion === 'fatigued') {
    adjustments.push('Cắt ngắn phần chào hỏi rườm rà, tập trung vào kết quả chính để CEO không phải đọc nhiều.');
    if (!response.startsWith('Thưa')) {
      response = `[Tóm tắt nhanh]: ${response}`;
    }
  }

  if (model.communicationAdvice.recommendedDetailLevel === 'executive_bullet') {
    adjustments.push('Định dạng nội dung theo gạch đầu dòng rõ ràng.');
  }

  return { calibratedResponse: response, adjustmentsApplied: adjustments };
}

export function listStakeholderModels(): StakeholderMentalModel[] {
  return loadToMStore();
}
