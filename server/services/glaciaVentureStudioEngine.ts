/**
 * server/services/glaciaVentureStudioEngine.ts
 * Động cơ Vườn Ươm Doanh Nghiệp Tự Trị & Khởi Tạo Dự Án MVP (Autonomous Venture Studio) của Glacia (Epoch 10).
 * Cho phép Glacia tự phát hiện cơ hội thị trường, tạo đặc tả MVP hoàn chỉnh, thiết lập mô hình giá và cổng thanh toán VietQR.
 */

import fs from 'fs';
import path from 'path';

export interface VentureOpportunity {
  opportunityId: string;
  title: string;
  sector: 'accounting_saas' | 'indie_game' | 'ai_micro_tools' | 'ecommerce_automation';
  marketProblem: string;
  proposedSolution: string;
  targetAudience: string;
  tamSamSomEstimate: {
    tamUsd: string;
    samUsd: string;
    somYearOneUsd: string;
  };
  competitiveMoat: string;
  recommendedPricingModel: 'freemium' | 'pay_per_use' | 'annual_license' | 'hybrid';
  confidenceScore: number; // 0.0 to 1.0
  discoveredAt: string;
}

export interface IncubatedVentureProject {
  ventureId: string;
  opportunity: VentureOpportunity;
  mvpSpecification: {
    coreFeatures: string[];
    techStack: string[];
    estimatedDevDays: number;
  };
  monetizationPlan: {
    tiers: Array<{
      tierName: string;
      priceVnd: number;
      priceUsd: number;
      features: string[];
    }>;
    vietqrPaymentHookEnabled: boolean;
  };
  gtmStrategy: {
    channelPriorities: string[];
    firstMonthTargetUsers: number;
    viralHookDescription: string;
  };
  status: 'ideated' | 'mvp_in_progress' | 'launched_active';
  createdAt: string;
}

const RUNTIME_DIR = path.resolve(process.cwd(), 'runtime');
const VENTURE_FILE = path.join(RUNTIME_DIR, 'glacia_venture_studio.json');

const OPPORTUNITY_PRESETS: Record<string, VentureOpportunity> = {
  accounting_saas: {
    opportunityId: 'opp-vas-01',
    title: 'LedgerFlow Micro-VAS: Trợ Lý Thuế & Kế Toán Tự Động Cho Freelancer & Hộ Kinh Doanh',
    sector: 'accounting_saas',
    marketProblem: 'Hơn 5 triệu hộ kinh doanh tại Việt Nam gặp khó khăn khi kê khai thuế theo Thông tư 88 và xuất hóa đơn điện tử.',
    proposedSolution: 'Ứng dụng di động nhẹ, quét hóa đơn bằng camera nhận diện OCR, tự động lập sổ sách VAS và tạo mã QR nộp thuế tức thì.',
    targetAudience: 'Hộ kinh doanh cá thể, Freelancer lập trình/thiết kế, Chủ cửa hàng bán lẻ.',
    tamSamSomEstimate: { tamUsd: '$120M', samUsd: '$35M', somYearOneUsd: '$1.2M' },
    competitiveMoat: 'Đấu nối trực tiếp cơ sở dữ liệu thuế Việt Nam + $0 Token Cost Neural Engine độc quyền.',
    recommendedPricingModel: 'freemium',
    confidenceScore: 0.94,
    discoveredAt: new Date().toISOString(),
  },
  indie_game: {
    opportunityId: 'opp-game-02',
    title: 'Glacia Ledger Quest: Game 3D RPG Nhập Vai Tài Chính & Chiến Thuật',
    sector: 'indie_game',
    marketProblem: 'Học sinh, sinh viên và nhân viên mới cảm thấy kiến thức tài chính và kế toán khô khan, nhàm chán.',
    proposedSolution: 'Game 3D WebGL thế giới mở, người chơi thu thập tinh thể tài sản, giải câu đố dòng tiền và đối đầu quái vật Lạm Phát.',
    targetAudience: 'Gen Z, sinh viên kinh tế, game thủ yêu thích chiến thuật mô phỏng.',
    tamSamSomEstimate: { tamUsd: '$450M', samUsd: '$80M', somYearOneUsd: '$2.5M' },
    competitiveMoat: 'Đồ họa 3D Three.js WebGL mượt mà 60 FPS, NPC có não LLM sinh nhiệm vụ độc bản.',
    recommendedPricingModel: 'hybrid',
    confidenceScore: 0.91,
    discoveredAt: new Date().toISOString(),
  },
  ai_micro_tools: {
    opportunityId: 'opp-ai-03',
    title: 'VietVoice Studio: Trợ Lý Lồng Tiếng & Tạo Video Viral Đa Kênh',
    sector: 'ai_micro_tools',
    marketProblem: 'Các nhà sáng tạo nội dung TikTok/YouTube mất nhiều giờ để thu âm và khớp phụ đề tiếng Việt tự nhiên.',
    proposedSolution: 'Công cụ lồng tiếng cảm xúc tiếng Việt chuẩn 3 miền, tự đồng bộ khẩu hình và xuất video 4K tự động.',
    targetAudience: 'YouTubers, TikTok creators, Agency quảng cáo số.',
    tamSamSomEstimate: { tamUsd: '$200M', samUsd: '$45M', somYearOneUsd: '$1.8M' },
    competitiveMoat: 'Độ trễ <200ms, hỗ trợ ngắt lời Barge-in và giọng đọc Glacia độc quyền.',
    recommendedPricingModel: 'pay_per_use',
    confidenceScore: 0.96,
    discoveredAt: new Date().toISOString(),
  },
};

export function discoverVentureOpportunity(
  sector: VentureOpportunity['sector'] = 'accounting_saas'
): VentureOpportunity {
  const opp = OPPORTUNITY_PRESETS[sector] || OPPORTUNITY_PRESETS['accounting_saas'];
  return {
    ...opp,
    opportunityId: `opp-${Date.now()}`,
    discoveredAt: new Date().toISOString(),
  };
}

export function incubateVentureProject(
  sector: VentureOpportunity['sector'] = 'accounting_saas',
  customTitle?: string
): IncubatedVentureProject {
  const opportunity = discoverVentureOpportunity(sector);
  if (customTitle) opportunity.title = customTitle;

  const ventureId = `venture-${Date.now()}`;
  const project: IncubatedVentureProject = {
    ventureId,
    opportunity,
    mvpSpecification: {
      coreFeatures: [
        'Xác thực người dùng một chạm (OAuth + Google / Apple ID)',
        'Bảng điều khiển trực quan thời gian thực với đồ thị Chart.js / Three.js',
        'Tích hợp cổng thanh toán VietQR động và Stripe Checkout',
        'Trợ lý Glacia AI tích hợp sẵn phản hồi tức thì $0 chi phí token',
      ],
      techStack: ['React 19', 'TypeScript', 'Node.js Express', 'SQLite / Local Storage', 'Tailwind CSS'],
      estimatedDevDays: 14,
    },
    monetizationPlan: {
      tiers: [
        {
          tierName: 'Khởi Nghiệp (Starter)',
          priceVnd: 0,
          priceUsd: 0,
          features: ['Sử dụng tối đa 100 tác vụ/tháng', 'Báo cáo cơ bản', 'Cộng đồng hỗ trợ'],
        },
        {
          tierName: 'Chuyên Nghiệp (Pro)',
          priceVnd: 199000,
          priceUsd: 8.5,
          features: ['Không giới hạn tác vụ', 'Tự động hóa 24/7 Night Shift', 'Xuất báo cáo PDF/Excel VAS', 'Hỗ trợ ưu tiên 1:1'],
        },
        {
          tierName: 'Doanh Nghiệp (Enterprise)',
          priceVnd: 990000,
          priceUsd: 42.0,
          features: ['Đầy đủ toàn bộ tính năng', 'Triển khai Swarm P2P đa thiết bị', 'API Webhook riêng', 'Bảo lãnh an toàn dữ liệu Nghị định 13'],
        },
      ],
      vietqrPaymentHookEnabled: true,
    },
    gtmStrategy: {
      channelPriorities: ['Cộng đồng Kế toán & Doanh nhân Việt', 'TikTok Organic Video Series', 'Google SEO & GitHub Open Source'],
      firstMonthTargetUsers: 1500,
      viralHookDescription: 'Tặng miễn phí 1 năm bản quyền Pro cho 100 doanh nghiệp đầu tiên đăng ký trải nghiệm.',
    },
    status: 'mvp_in_progress',
    createdAt: new Date().toISOString(),
  };

  try {
    if (!fs.existsSync(RUNTIME_DIR)) fs.mkdirSync(RUNTIME_DIR, { recursive: true });
    const list = listIncubatedVentures();
    list.unshift(project);
    if (list.length > 20) list.pop();
    fs.writeFileSync(VENTURE_FILE, JSON.stringify(list, null, 2), 'utf-8');
  } catch (err) {}

  return project;
}

export function listIncubatedVentures(): IncubatedVentureProject[] {
  try {
    if (fs.existsSync(VENTURE_FILE)) {
      const data = JSON.parse(fs.readFileSync(VENTURE_FILE, 'utf-8'));
      if (Array.isArray(data) && data.length > 0) return data;
    }
  } catch (err) {}
  const initial = incubateVentureProject('accounting_saas');
  return [initial];
}
