/**
 * crmAiScoutService.ts
 * ============================================================
 * CRM AI MARKET SCOUT & LEAD ENGAGEMENT SERVICE
 *
 * Autonomous Scout (SCOUT_READER) that analyzes customer leads,
 * computes conversion probability, and generates proactive follow-up proposals.
 */

import { recordAIAction } from './aiActionLedger.ts';
import { verifyAgentActionPermission } from './advancedDelegationConflictResolver.ts';

export interface LeadProfile {
  id: string;
  customerName: string;
  companyName: string;
  industry: 'construction' | 'service' | 'trading' | 'saas' | 'general';
  dealValueVnd: number;
  lastContactDaysAgo: number;
  leadScore: number; // 0 - 100
  stage: 'lead' | 'contacted' | 'demo_requested' | 'proposal_sent' | 'negotiation';
}

export interface LeadFollowupSuggestion {
  suggestionId: string;
  leadId: string;
  customerName: string;
  companyName: string;
  priority: 'CRITICAL' | 'HIGH' | 'MEDIUM';
  recommendedAction: string;
  pitchAngle: string;
  conversionProbabilityPct: number;
  suggestedByRole: string;
  scoutedAt: string;
}

const SAMPLE_LEADS: LeadProfile[] = [
  {
    id: 'lead_001',
    customerName: 'Nguyễn Văn Hùng',
    companyName: 'Công ty XD An Phát Khang',
    industry: 'construction',
    dealValueVnd: 45000000,
    lastContactDaysAgo: 2,
    leadScore: 88,
    stage: 'demo_requested',
  },
  {
    id: 'lead_002',
    customerName: 'Trần Thị Thu Thảo',
    companyName: 'Dịch vụ Kế toán Minh Tâm',
    industry: 'service',
    dealValueVnd: 28000000,
    lastContactDaysAgo: 5,
    leadScore: 75,
    stage: 'proposal_sent',
  },
  {
    id: 'lead_003',
    customerName: 'Lê Hoàng Nam',
    companyName: 'Công nghệ & Game Alpha',
    industry: 'saas',
    dealValueVnd: 60000000,
    lastContactDaysAgo: 1,
    leadScore: 94,
    stage: 'negotiation',
  },
  {
    id: 'lead_004',
    customerName: 'Phạm Minh Đức',
    companyName: 'Vật liệu Xây dựng Đông Dương',
    industry: 'trading',
    dealValueVnd: 35000000,
    lastContactDaysAgo: 8,
    leadScore: 62,
    stage: 'contacted',
  },
];

/**
 * AI Scout scans leads and generates actionable follow-up advice
 */
export function scanLeadsAndProposeFollowups(leadsInput?: LeadProfile[]): {
  suggestions: LeadFollowupSuggestion[];
  totalScanned: number;
  highPriorityCount: number;
  scoutedBy: string;
} {
  const roleId = 'role_ai_market_scout';
  const permCheck = verifyAgentActionPermission(roleId, 'video_marketing', 'read');

  if (!permCheck.isAllowed) {
    throw new Error(`AI Market Scout bị chặn: ${permCheck.message}`);
  }

  const leads = leadsInput && leadsInput.length > 0 ? leadsInput : SAMPLE_LEADS;
  const suggestions: LeadFollowupSuggestion[] = [];

  for (const lead of leads) {
    let priority: 'CRITICAL' | 'HIGH' | 'MEDIUM' = 'MEDIUM';
    let recommendedAction = '';
    let pitchAngle = '';
    let conversionProbabilityPct = lead.leadScore;

    if (lead.stage === 'negotiation' || lead.leadScore >= 90) {
      priority = 'CRITICAL';
      recommendedAction = 'Gọi chốt hợp đồng & gửi link ký số hợp đồng bản quyền';
      pitchAngle = 'Nhấn mạnh cam kết hỗ trợ trực tiếp 1-1 từ Solo Founder và bảo hành 12 tháng.';
      conversionProbabilityPct = Math.min(98, lead.leadScore + 5);
    } else if (lead.stage === 'demo_requested' || lead.lastContactDaysAgo >= 4) {
      priority = 'HIGH';
      recommendedAction = 'Gửi video demo tính năng chuyên biệt kèm bảng phân tích ROI';
      pitchAngle = `Trọng tâm vào giải pháp tự động hóa cho ngành ${lead.industry} giúp tiết kiệm 70% thời gian.`;
    } else {
      priority = 'MEDIUM';
      recommendedAction = 'Gửi case study khách hàng tương tự qua Zalo/Email';
      pitchAngle = 'Chia sẻ câu chuyện thành công và lời chứng thực từ khách hàng cùng ngành.';
    }

    const suggestion: LeadFollowupSuggestion = {
      suggestionId: `sug_${lead.id}_${Date.now().toString(36)}`,
      leadId: lead.id,
      customerName: lead.customerName,
      companyName: lead.companyName,
      priority,
      recommendedAction,
      pitchAngle,
      conversionProbabilityPct,
      suggestedByRole: 'AI Market & Trends Scout',
      scoutedAt: new Date().toISOString(),
    };

    suggestions.push(suggestion);
  }

  // Sort by priority (CRITICAL -> HIGH -> MEDIUM)
  suggestions.sort((a, b) => {
    const pRank = { CRITICAL: 3, HIGH: 2, MEDIUM: 1 };
    return pRank[b.priority] - pRank[a.priority];
  });

  const highPriorityCount = suggestions.filter((s) => s.priority === 'CRITICAL' || s.priority === 'HIGH').length;

  recordAIAction({
    agentId: 'agent_scout_crm',
    roleId,
    domain: 'video_marketing',
    actionType: 'CRM_LEAD_SCOUTING_COMPLETED',
    targetResource: 'crm_leads_queue',
    outputSummary: `AI Scout đã quét ${leads.length} leads và phát hiện ${highPriorityCount} cơ hội chốt deal giá trị cao.`,
    permissionCheckPassed: true,
    constitutionalRulePassed: true,
  });

  return {
    suggestions,
    totalScanned: leads.length,
    highPriorityCount,
    scoutedBy: 'AI Market Scout (Claude / Groq Fast)',
  };
}
