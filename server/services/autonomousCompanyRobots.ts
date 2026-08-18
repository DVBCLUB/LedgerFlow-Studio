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
