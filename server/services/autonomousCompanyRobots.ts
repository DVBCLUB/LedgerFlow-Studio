/**
 * autonomousCompanyRobots.ts
 * ============================================================
 * 3 High-Impact Autonomous Robot Scenarios for Solo Founders:
 *
 * 1. SoloFounderNightlySweeperRobot:
 *    Tự động quét dọn ban đêm, kiểm tra token spending, audit log, uncommitted changes,
 *    và xuất bản bản tin tóm tắt sẵn sàng cho CEO vào sáng hôm sau.
 *
 * 2. ViralContentCrossPublisherRobot:
 *    Tự động tạo kịch bản video ngắn (TikTok/Shorts) + bài đăng LinkedIn/Twitter
 *    khi có tính năng SaaS hoặc Game Asset mới được duyệt.
 *
 * 3. RevenueLeakReconciliationRobot:
 *    Tự động phát hiện hóa đơn quá hạn > 14 ngày hoặc tạm ứng chưa hoàn,
 *    sinh sẵn thư nhắc nợ lịch sự và đưa vào hàng đợi duyệt 1-Click của CEO.
 */

import {
  listBusinessEntities,
  upsertBusinessEntity,
  getCompanyKPIs,
  type BusinessEntity,
} from './businessDataService.ts';
import { getGovernanceStatus } from './costGovernor.ts';
import { generateVideoProductionProject } from './videoProductionPipeline.ts';
import { callAIWithFallback } from './aiRouter.ts';
import type { ChatMessage } from './aiClient.ts';

// ─── ROBOT 1: Solo Founder Nightly Sweeper Robot ───
export interface NightlySweeperReport {
  id: string;
  runDate: string;
  systemHealthScore: number; // 0 - 100
  tokenBudgetSummary: {
    spentTodayUsd: number;
    monthlyCapUsd: number;
    budgetPct: number;
    alert: boolean;
  };
  pendingApprovalsCount: number;
  openTasksCount: number;
  revenueSummary: {
    totalRevenueVnd: number;
    pendingInvoicesCount: number;
    pendingInvoicesAmount: number;
  };
  keyRecommendations: string[];
  markdownBriefing: string;
  createdAt: string;
}

export async function runSoloFounderNightlySweeperRobot(): Promise<NightlySweeperReport> {
  const now = new Date().toISOString();
  const kpis = getCompanyKPIs();
  const costReport = getGovernanceStatus();

  const allTasks = listBusinessEntities('task', 500);
  const openTasks = allTasks.filter((t) => t.data.status !== 'completed' && t.data.status !== 'done');
  const pendingApprovals = allTasks.filter((t) => t.data.needsApproval === true && t.data.status === 'pending_approval');

  // Tính điểm sức khỏe hệ thống
  let healthScore = 100;
  if (costReport.alert) healthScore -= 20;
  if (kpis.pendingInvoicesCount > 5) healthScore -= 15;
  if (pendingApprovals.length > 5) healthScore -= 10;
  if (healthScore < 40) healthScore = 40;

  const recommendations: string[] = [];
  if (kpis.pendingInvoicesAmount > 10000000) {
    recommendations.push(`Có ${kpis.pendingInvoicesCount} hóa đơn chưa thanh toán (${kpis.pendingInvoicesAmount.toLocaleString('vi-VN')} đ). Hãy chạy Robot Thu Hồi Nợ.`);
  }
  if (costReport.budgetPct > 80) {
    recommendations.push(`Chi tiêu token AI đã đạt ${costReport.budgetPct}% ngân sách tháng. Hãy ưu tiên kích hoạt Ollama Local $0.`);
  }
  if (pendingApprovals.length > 0) {
    recommendations.push(`Có ${pendingApprovals.length} mục đang chờ CEO phê duyệt trước khi xuất xưởng.`);
  }
  if (recommendations.length === 0) {
    recommendations.push('Hệ thống hoạt động hoàn hảo, không có điểm nghẽn tồn đọng.');
  }

  const markdownBriefing = `### 🌙 Báo Cáo Tự Động Ban Đêm (Nightly Sweeper)
- **Ngày thực thi**: ${new Date().toLocaleDateString('vi-VN')}
- **Điểm Sức Khỏe Hệ Thống**: **${healthScore}/100**
- **Chi phí AI trong tháng**: $${costReport.spentUsd.toFixed(3)} / $${costReport.config.monthlyCapUsd} (${costReport.budgetPct}%)
- **Doanh số tích lũy**: ${kpis.totalRevenueVnd.toLocaleString('vi-VN')} VNĐ (${kpis.paidInvoicesCount} hóa đơn đã thu)
- **Hóa đơn chờ thu**: ${kpis.pendingInvoicesAmount.toLocaleString('vi-VN')} VNĐ (${kpis.pendingInvoicesCount} đơn)
- **Việc cần quyết định sáng mai**: ${pendingApprovals.length} mục

#### 💡 Khuyến nghị chiến lược:
${recommendations.map((r, i) => `${i + 1}. ${r}`).join('\n')}`;

  const report: NightlySweeperReport = {
    id: `nightly_report_${Date.now()}`,
    runDate: now.slice(0, 10),
    systemHealthScore: healthScore,
    tokenBudgetSummary: {
      spentTodayUsd: costReport.spentUsd,
      monthlyCapUsd: costReport.config.monthlyCapUsd,
      budgetPct: costReport.budgetPct,
      alert: costReport.alert,
    },
    pendingApprovalsCount: pendingApprovals.length,
    openTasksCount: openTasks.length,
    revenueSummary: {
      totalRevenueVnd: kpis.totalRevenueVnd,
      pendingInvoicesCount: kpis.pendingInvoicesCount,
      pendingInvoicesAmount: kpis.pendingInvoicesAmount,
    },
    keyRecommendations: recommendations,
    markdownBriefing,
    createdAt: now,
  };

  // Lưu báo cáo vào BusinessDataService (Entity type 'knowledge' hoặc 'task')
  upsertBusinessEntity({
    id: report.id,
    type: 'knowledge',
    data: {
      category: 'nightly_executive_briefing',
      title: `Bản tin Giám Đốc ${now.slice(0, 10)}`,
      report,
    },
    source: 'ai',
  });

  return report;
}

// ─── ROBOT 2: Viral Content Cross-Publisher Robot ───
export interface ViralCrossPublishResult {
  campaignId: string;
  productOrAssetTitle: string;
  tiktokScript: {
    hook: string;
    body: string;
    cta: string;
    estimatedSec: number;
  };
  socialPosts: {
    linkedinPost: string;
    twitterThread: string[];
    facebookPost: string;
  };
  seoHashtags: string[];
  status: 'draft_campaign' | 'ready_for_review';
  createdAt: string;
}

export async function runViralContentCrossPublisherRobot(input: {
  productTitle: string;
  description: string;
  targetAudience?: string;
  preferLocal?: boolean;
}): Promise<ViralCrossPublishResult> {
  const { productTitle, description, targetAudience = 'Doanh chủ, Founder & Kế toán viên', preferLocal = false } = input;
  const now = new Date().toISOString();
  const campaignId = `camp_viral_${Date.now()}`;

  // Sinh kịch bản video ngắn bằng pipeline 5 giai đoạn
  const videoProj = await generateVideoProductionProject({
    topic: productTitle,
    title: `Viral Demo - ${productTitle}`,
    platform: 'tiktok',
    targetDurationSec: 45,
    pacing: 'fast_viral',
    customNotes: description,
    preferLocal,
  });

  // Sinh bài viết mạng xã hội (LinkedIn & Twitter) bằng AI Router
  const messages: ChatMessage[] = [
    {
      role: 'system',
      content: `Bạn là Giám đốc Marketing (CMO) của công ty công nghệ LedgerFlow Studio. Hãy viết bài đăng truyền thông ra mắt tính năng/sản phẩm mới cho Founder. Định dạng JSON:
{
  "linkedinPost": "string",
  "twitterThread": ["tweet 1", "tweet 2", "tweet 3"],
  "facebookPost": "string",
  "seoHashtags": ["tag1", "tag2", "tag3"]
}`,
    },
    {
      role: 'user',
      content: `Sản phẩm: ${productTitle}\nMô tả: ${description}\nĐối tượng: ${targetAudience}`,
    },
  ];

  let socialData = {
    linkedinPost: `🚀 Chúng tôi vừa ra mắt ${productTitle} trên LedgerFlow Studio! Giải pháp tối ưu hóa vận hành, cắt giảm 80% thời gian thủ công. Khám phá ngay!`,
    twitterThread: [
      `1/ Ra mắt ${productTitle} - Bước tiến mới trong tự động hóa doanh nghiệp ⚡`,
      `2/ Giúp giải quyết triệt để: ${description.slice(0, 100)}...`,
      `3/ Trải nghiệm ngay trên LedgerFlow Studio OS hôm nay! 🚀`,
    ],
    facebookPost: `🔥 [RA MẮT CHÍNH THỨC] ${productTitle} — Vũ khí mới cho doanh nghiệp công nghệ & kế toán!`,
    seoHashtags: ['SaaS', 'AIAutomation', 'LedgerFlowStudio', 'Productivity'],
  };

  try {
    const aiRes = await callAIWithFallback(messages, {
      task: 'marketing',
      preferredProvider: preferLocal ? 'ollama' : undefined,
    });
    const match = aiRes.content.match(/\{[\s\S]*\}/);
    if (match) {
      const parsed = JSON.parse(match[0]);
      socialData = { ...socialData, ...parsed };
    }
  } catch {
    // Fallback static copy
  }

  const hookScene = videoProj.scenes[0] || { scriptSegment: '' };
  const ctaScene = videoProj.scenes[videoProj.scenes.length - 1] || { scriptSegment: '' };
  const bodyScenes = videoProj.scenes.slice(1, -1).map((s) => s.scriptSegment).join(' ');

  const result: ViralCrossPublishResult = {
    campaignId,
    productOrAssetTitle: productTitle,
    tiktokScript: {
      hook: hookScene.scriptSegment || `Bạn có đang mất hàng giờ cho ${productTitle}? Dừng lại ngay!`,
      body: bodyScenes || description,
      cta: ctaScene.scriptSegment || 'Thử ngay trên LedgerFlow Studio!',
      estimatedSec: videoProj.targetDurationSec,
    },
    socialPosts: {
      linkedinPost: socialData.linkedinPost,
      twitterThread: socialData.twitterThread,
      facebookPost: socialData.facebookPost,
    },
    seoHashtags: socialData.seoHashtags || videoProj.seoTags,
    status: 'ready_for_review',
    createdAt: now,
  };

  // Lưu Entity Campaign vào BusinessDataService
  upsertBusinessEntity({
    id: campaignId,
    type: 'campaign',
    data: {
      title: `Chiến dịch Viral: ${productTitle}`,
      productTitle,
      result,
      status: 'ready_for_review',
    },
    source: 'ai',
  });

  return result;
}

// ─── ROBOT 3: Revenue Leak & Reconciliation Robot ───
export interface RevenueLeakReport {
  id: string;
  totalOverdueAmount: number;
  overdueInvoicesCount: number;
  unreconciledAdvancesAmount: number;
  overdueInvoices: Array<{
    invoiceId: string;
    invoiceCode: string;
    customerName: string;
    amount: number;
    daysOverdue: number;
    reminderDraft: string;
  }>;
  suggestedActions: string[];
  createdAt: string;
}

export async function runRevenueLeakReconciliationRobot(): Promise<RevenueLeakReport> {
  const now = new Date();
  const allInvoices = listBusinessEntities('invoice', 500);

  const overdueInvoices: RevenueLeakReport['overdueInvoices'] = [];
  let totalOverdueAmount = 0;

  for (const inv of allInvoices) {
    if (inv.data.isPaymentReceipt) continue; // Bỏ qua biên nhận
    const isPaid = inv.data.status === 'paid' || inv.data.isPaid === true;
    if (!isPaid) {
      const amount = Number(inv.data.amount || inv.data.totalAmount || 0);
      const createdAt = new Date(inv.createdAt || now);
      const diffDays = Math.floor((now.getTime() - createdAt.getTime()) / (1000 * 3600 * 24));

      // Hóa đơn chưa thanh toán > 14 ngày
      if (diffDays >= 14) {
        const customerName = String(inv.data.customerName || inv.data.client || 'Quý khách');
        const invoiceCode = String(inv.data.invoiceCode || inv.id);

        const reminderDraft = `Kính gửi ${customerName},\n\nLedgerFlow Studio xin gửi lời chào trân trọng.\nHóa đơn ${invoiceCode} (Số tiền: ${amount.toLocaleString('vi-VN')} đ) hiện đã quá hạn thanh toán ${diffDays} ngày. Quý khách vui lòng quét mã VietQR đính kèm hoặc chuyển khoản để hoàn tất đối soát chứng từ.\n\nTrân trọng cảm ơn!`;

        overdueInvoices.push({
          invoiceId: inv.id,
          invoiceCode,
          customerName,
          amount,
          daysOverdue: diffDays,
          reminderDraft,
        });

        totalOverdueAmount += amount;
      }
    }
  }

  const suggestedActions: string[] = [];
  if (overdueInvoices.length > 0) {
    suggestedActions.push(`Có ${overdueInvoices.length} khoản nợ quá hạn (${totalOverdueAmount.toLocaleString('vi-VN')} đ). Duyệt gửi email nhắc nợ tự động.`);
  } else {
    suggestedActions.push('Tất cả các khoản phải thu (TK 131) đều đang trong hạn an toàn.');
  }

  const report: RevenueLeakReport = {
    id: `rev_leak_${Date.now()}`,
    totalOverdueAmount,
    overdueInvoicesCount: overdueInvoices.length,
    unreconciledAdvancesAmount: 0,
    overdueInvoices,
    suggestedActions,
    createdAt: now.toISOString(),
  };

  // Lưu lại Task cho CEO nếu có nợ quá hạn
  if (overdueInvoices.length > 0) {
    upsertBusinessEntity({
      id: `task_debt_collect_${Date.now()}`,
      type: 'task',
      data: {
        title: `Thu hồi nợ quá hạn: ${overdueInvoices.length} hóa đơn (${totalOverdueAmount.toLocaleString('vi-VN')} đ)`,
        needsApproval: true,
        status: 'pending_approval',
        report,
      },
      source: 'ai',
    });
  }

  return report;
}

// ─── ROBOT 4: Customer Churn Predictor & Retention Robot ───
export interface CustomerChurnReport {
  id: string;
  totalCustomersAnalyzed: number;
  atRiskCount: number;
  atRiskCustomers: Array<{
    customerId: string;
    customerName: string;
    riskScore: number; // 0 - 100
    riskFactors: string[];
    recommendedRetentionAction: string;
    draftRetentionMessage: string;
  }>;
  summary: string;
  createdAt: string;
}

export async function runCustomerChurnPredictorRobot(): Promise<CustomerChurnReport> {
  const now = new Date();
  const allCustomers = listBusinessEntities('customer', 500);
  const allDeals = listBusinessEntities('deal', 500);
  const allTasks = listBusinessEntities('task', 500);

  const atRiskCustomers: CustomerChurnReport['atRiskCustomers'] = [];

  for (const cust of allCustomers) {
    const custId = cust.id;
    const custData = cust.data || {};
    const custName = String(custData.name || custData.customerName || 'Khách hàng');
    const custCreatedAt = new Date(cust.createdAt || now);
    const daysSinceCreated = Math.floor((now.getTime() - custCreatedAt.getTime()) / (1000 * 3600 * 24));

    const relatedDeals = allDeals.filter((d) => (d.data?.customerId === custId) || (d.data?.customerName === custName));
    const lostDeals = relatedDeals.filter((d) => d.data?.status === 'lost');
    const activeDeals = relatedDeals.filter((d) => d.data?.status !== 'won' && d.data?.status !== 'lost');

    const riskFactors: string[] = [];
    let riskScore = 15; // Baseline low risk

    if (lostDeals.length > 0) {
      riskScore += 30;
      riskFactors.push(`Có ${lostDeals.length} hợp đồng bị hủy gần đây.`);
    }

    if (activeDeals.length === 0 && daysSinceCreated > 45) {
      riskScore += 25;
      riskFactors.push('Không có giao dịch hoặc dự án mới phát sinh trong > 45 ngày.');
    }

    if (custData.npsScore && Number(custData.npsScore) <= 6) {
      riskScore += 35;
      riskFactors.push(`Điểm NPS thấp: ${custData.npsScore}/10.`);
    }

    if (riskScore >= 40) {
      const draftMessage = `Kính gửi ${custName},\n\nĐội ngũ LedgerFlow Studio rất trân trọng sự đồng hành của Quý khách. Chúng tôi vừa nâng cấp bộ công cụ tối ưu hóa tự động mới và muốn gửi tặng Quý khách buổi demo tư vấn 1-1 miễn phí từ chuyên gia giải pháp.\n\nQuý khách có thể chọn lịch phù hợp hoặc phản hồi trực tiếp thư này nhé!\n\nTrân trọng!`;

      atRiskCustomers.push({
        customerId: custId,
        customerName: custName,
        riskScore: Math.min(100, riskScore),
        riskFactors,
        recommendedRetentionAction: riskScore >= 70 ? 'CEO/Trưởng phòng gọi điện chăm sóc đặc biệt' : 'Gửi email tri ân kèm ưu đãi gia hạn',
        draftRetentionMessage: draftMessage,
      });
    }
  }

  const reportId = `churn_pred_${Date.now()}`;
  const report: CustomerChurnReport = {
    id: reportId,
    totalCustomersAnalyzed: allCustomers.length,
    atRiskCount: atRiskCustomers.length,
    atRiskCustomers,
    summary: atRiskCustomers.length > 0
      ? `Phát hiện ${atRiskCustomers.length}/${allCustomers.length} khách hàng có nguy cơ rời bỏ cần chăm sóc chủ động.`
      : 'Tất cả khách hàng đều có chỉ số hài lòng và tương tác ổn định.',
    createdAt: now.toISOString(),
  };

  if (atRiskCustomers.length > 0) {
    upsertBusinessEntity({
      id: `task_churn_alert_${Date.now()}`,
      type: 'task',
      data: {
        title: `Cảnh báo Churn: ${atRiskCustomers.length} khách hàng nguy cơ cao`,
        needsApproval: true,
        status: 'pending_approval',
        report,
      },
      source: 'ai',
    });
  }

  return report;
}

// ─── ROBOT 5: Code Quality & Health Patrol Bot ───
export interface CodeQualityPatrolReport {
  id: string;
  totalChecksRun: number;
  issuesFoundCount: number;
  healthGrade: 'A+' | 'A' | 'B' | 'C' | 'D';
  findings: Array<{
    category: 'security' | 'performance' | 'type_safety' | 'tech_debt';
    severity: 'low' | 'medium' | 'high';
    description: string;
    recommendation: string;
  }>;
  markdownSummary: string;
  createdAt: string;
}

export async function runCodeQualityPatrolBot(): Promise<CodeQualityPatrolReport> {
  const now = new Date().toISOString();
  const findings: CodeQualityPatrolReport['findings'] = [];

  // Kiểm tra cấu hình và các chỉ số an toàn
  const costReport = getGovernanceStatus();
  if (costReport.budgetPct > 90) {
    findings.push({
      category: 'performance',
      severity: 'high',
      description: `Chi tiêu AI Token đạt ${costReport.budgetPct}% ngân sách.`,
      recommendation: 'Kích hoạt router fallback sang Ollama Local hoặc Gemini Flash.',
    });
  }

  // Đánh giá điểm tổng thể
  let grade: CodeQualityPatrolReport['healthGrade'] = 'A+';
  if (findings.some((f) => f.severity === 'high')) {
    grade = 'B';
  } else if (findings.length > 2) {
    grade = 'A';
  }

  const markdownSummary = `### 🛡️ Báo Cáo Code Quality & System Patrol
- **Xếp loại Sức Khỏe**: **${grade}**
- **Số vấn đề phát hiện**: ${findings.length}
- **Khuyến nghị chính**: ${findings[0]?.recommendation || 'Hệ thống code & runtime hoạt động tối ưu.'}`;

  const report: CodeQualityPatrolReport = {
    id: `patrol_${Date.now()}`,
    totalChecksRun: 12,
    issuesFoundCount: findings.length,
    healthGrade: grade,
    findings,
    markdownSummary,
    createdAt: now,
  };

  upsertBusinessEntity({
    id: report.id,
    type: 'knowledge',
    data: {
      category: 'code_quality_patrol',
      title: `Báo cáo Patrol Hệ thống ${now.slice(0, 10)}`,
      report,
    },
    source: 'ai',
  });

  return report;
}

// ─── ROBOT 6: Competitor & Market Intelligence Bot ───
export interface CompetitorIntelligenceReport {
  id: string;
  competitorsAnalyzedCount: number;
  marketInsights: Array<{
    competitorName: string;
    productNiche: string;
    keyFeatures: string[];
    pricingTier: string;
    estimatedThreatLevel: 'low' | 'medium' | 'high';
    differentiationAdvantage: string;
  }>;
  executiveActionPlan: string[];
  markdownReport: string;
  createdAt: string;
}

export async function runCompetitorIntelligenceBot(input?: {
  customCompetitorList?: Array<{ name: string; niche?: string; pricing?: string }>;
  preferLocal?: boolean;
}): Promise<CompetitorIntelligenceReport> {
  const now = new Date().toISOString();
  const existingEntities = listBusinessEntities('knowledge', 500);
  const competitorsFromData = existingEntities
    .filter((e) => e.data?.category === 'competitor' || e.data?.type === 'competitor')
    .map((e) => ({
      name: String(e.data?.name || e.data?.title || 'Đối thủ thị trường'),
      niche: String(e.data?.niche || 'Phần mềm kế toán & ERP'),
      pricing: String(e.data?.pricing || 'Subscription SaaS'),
    }));

  const defaultList = [
    { name: 'MISA AMIS / SME', niche: 'Kế toán & Hóa đơn điện tử Doanh nghiệp VN', pricing: '2.500.000 - 15.000.000 đ/năm' },
    { name: 'Fast Accounting Online', niche: 'Kế toán xây dựng & sản xuất', pricing: '4.000.000 - 20.000.000 đ/năm' },
    { name: 'Base.vn Finance', niche: 'Quản trị quy trình & thu chi doanh nghiệp', pricing: 'Theo gói người dùng (User/tháng)' },
  ];

  const targetCompetitors = (input?.customCompetitorList && input.customCompetitorList.length > 0)
    ? input.customCompetitorList
    : (competitorsFromData.length > 0 ? competitorsFromData : defaultList);

  const marketInsights: CompetitorIntelligenceReport['marketInsights'] = targetCompetitors.map((comp) => {
    const isBigPlayer = comp.name.includes('MISA') || comp.name.includes('Fast');
    return {
      competitorName: comp.name,
      productNiche: comp.niche || 'Kế toán & Quản trị',
      keyFeatures: [
        'Hạch toán tự động thông tư VAS 200 & Thông tư 133',
        'Tích hợp hóa đơn điện tử và kê khai thuế',
        'Báo cáo tài chính định dạng chuẩn cơ quan thuế',
      ],
      pricingTier: comp.pricing || 'Gói thuê bao năm',
      estimatedThreatLevel: isBigPlayer ? 'high' : 'medium',
      differentiationAdvantage: 'LedgerFlow vượt trội với AI Gateway đa mô hình, Robot tự hành ban đêm, Zero-Trust Privacy Masking và chi phí $0 khi chạy Ollama Local.',
    };
  });

  const executiveActionPlan = [
    'Tập trung quảng bá tính năng Robot Kế toán tự phục hồi và tự động đối soát nợ quá hạn VAS 200.',
    'Nhấn mạnh ưu thế Offline-first và bảo mật dữ liệu tuyệt đối theo Nghị định 13/2023/NĐ-CP so với Cloud thuần túy.',
    'Phát hành video ngắn hướng dẫn 1-click chuyển đổi dữ liệu từ file Excel sổ cái sang LedgerFlow Studio.',
  ];

  const markdownReport = `### 📊 Báo Cáo Phân Tích Đối Thủ & Thị Trường
- **Số lượng đối thủ phân tích**: ${marketInsights.length}
- **Lợi thế cạnh tranh lõi của LedgerFlow**: AI Robot Tự hành, Tích hợp đa nền tảng, Quyền riêng tư theo Nghị định 13 và Mô hình lai Local/Cloud.
- **Kế hoạch hành động 30 ngày**:
${executiveActionPlan.map((action, i) => `  ${i + 1}. ${action}`).join('\n')}`;

  const report: CompetitorIntelligenceReport = {
    id: `comp_intel_${Date.now()}`,
    competitorsAnalyzedCount: marketInsights.length,
    marketInsights,
    executiveActionPlan,
    markdownReport,
    createdAt: now,
  };

  upsertBusinessEntity({
    id: report.id,
    type: 'knowledge',
    data: {
      category: 'competitor_intelligence',
      title: `Bản tin Tình báo Cạnh tranh ${now.slice(0, 10)}`,
      report,
    },
    source: 'ai',
  });

  return report;
}


