import type { Express, Request, Response } from 'express';
import { listIndustryTemplates, getIndustryTemplate, calculateBOMCost, calculateProgressBilling } from '../industryTemplateEngine.ts';
import { postVoucher, listPostedVouchers } from '../accountingPostEngine.ts';
import { createApprovalRequest, transitionApprovalState, listApprovalRequests } from '../approvalStateMachine.ts';
import { ingestBankWebhook } from '../bankWebhookIngestionService.ts';
import { generateEInvoiceXML } from '../vietnameseEInvoiceEngine.ts';
import { generateQuarterlyTaxFiling } from '../taxFilingAutomationEngine.ts';
import { listReconciliationRecords, runAutoReconciliationBatch, approveDiscrepancyReconciliation } from '../crossModuleAutoReconciler.ts';
import { getPredictiveAccountingMetrics } from '../predictiveAccountingEngine.ts';
import { getFinancialIncidents, executeFinancialIncidentPlaybook, scanAndTriggerFinancialPlaybooks } from '../financialIncidentPlaybook.ts';
import { getGlobalLocalizationData, convertCurrency } from '../globalLocalizationAdapter.ts';
import { getInvestorRelationsData, simulateFundingRound } from '../investorRelationsEngine.ts';
import { getVendorSettlementData, executeVendorDisbursement } from '../vendorSettlementEngine.ts';
import { getTreasuryData, executeOvernightYieldSweep } from '../treasuryManagementEngine.ts';
import { getMaValuationData, advanceMaDealStage } from '../maValuationEngine.ts';
import { getGlobalVatData, calculateCrossBorderTax } from '../globalVatReverseChargeEngine.ts';
import { getEsgCarbonData, purchaseCarbonCredits } from '../esgCarbonAccountingEngine.ts';
import { getCryptoTreasuryData, executeOffRampSettlement } from '../cryptoTreasuryWeb3Engine.ts';
import { getRevenueRecognitionData, calculateIfrs15Allocation } from '../revenueRecognitionEngine.ts';
import { getCreditScoringData, calculateCreditEligibility } from '../creditScoringCapitalEngine.ts';

function successResponse(res: Response, data: any) {
  return res.json({ success: true, ...data });
}

function errorResponse(res: Response, err: unknown, status = 500) {
  const message = err instanceof Error ? err.message : String(err);
  return res.status(status).json({ success: false, error: message });
}

export function registerFinanceAccountingRoutes(app: Express): void {
  app.post('/api/dormant/accounting/post-voucher', async (req: Request, res: Response) => {
    try {
      const { voucherNo, voucherDate, voucherType, partnerName, lines, totalAmount } = req.body || {};
      if (!voucherNo || !voucherType || !lines) {
        return res.status(400).json({ success: false, error: 'Missing voucherNo, voucherType, or lines.' });
      }
      const result = await postVoucher({
        voucherId: `v_${Date.now()}`,
        voucherNo,
        voucherDate: voucherDate || new Date().toISOString(),
        voucherType,
        partnerName,
        lines,
        totalAmount: Number(totalAmount || 0),
      });
      return res.json(result);
    } catch (err) {
      return errorResponse(res, err);
    }
  });

  app.get('/api/dormant/accounting/vouchers', (_req: Request, res: Response) => {
    try {
      const vouchers = listPostedVouchers();
      return successResponse(res, { vouchers });
    } catch (err) {
      return errorResponse(res, err);
    }
  });

  // 🟢 18. Approval Workflow State Machine API

  app.post('/api/dormant/approval/create', async (req: Request, res: Response) => {
    try {
      const { documentType, documentNo, title, requester, amountVnd } = req.body || {};
      if (!documentType || !documentNo || !title || !requester) {
        return res.status(400).json({ success: false, error: 'Missing documentType, documentNo, title, or requester.' });
      }
      const request = await createApprovalRequest(documentType, documentNo, title, requester, amountVnd);
      return successResponse(res, { request });
    } catch (err) {
      return errorResponse(res, err);
    }
  });

  app.post('/api/dormant/approval/transition', async (req: Request, res: Response) => {
    try {
      const { id, targetState, actor, comment } = req.body || {};
      if (!id || !targetState || !actor) {
        return res.status(400).json({ success: false, error: 'Missing id, targetState, or actor.' });
      }
      const result = await transitionApprovalState(id, targetState, actor, comment);
      return res.json(result);
    } catch (err) {
      return errorResponse(res, err);
    }
  });

  app.get('/api/dormant/approval/list', (_req: Request, res: Response) => {
    try {
      const requests = listApprovalRequests();
      return successResponse(res, { requests });
    } catch (err) {
      return errorResponse(res, err);
    }
  });

  // 🟢 19. Hybrid AI Media Connectors API (Midjourney, Leonardo, Flux.1, Kling, Sora, Pika, Hailuo, Runway, Luma)

  app.get('/api/dormant/industry-templates/list', (_req: Request, res: Response) => {
    try {
      const templates = listIndustryTemplates();
      return successResponse(res, { templates });
    } catch (err) {
      return errorResponse(res, err);
    }
  });

  app.get('/api/dormant/industry-templates/get/:id', (req: Request, res: Response) => {
    try {
      const id = req.params.id as any;
      const template = getIndustryTemplate(id);
      if (!template) return res.status(404).json({ success: false, error: 'Template not found.' });
      return successResponse(res, { template });
    } catch (err) {
      return errorResponse(res, err);
    }
  });

  app.post('/api/dormant/industry-templates/calculate-bom', (req: Request, res: Response) => {
    try {
      const { bomItems } = req.body || {};
      if (!bomItems || !Array.isArray(bomItems)) {
        return res.status(400).json({ success: false, error: 'Missing bomItems array.' });
      }
      const result = calculateBOMCost(bomItems);
      return successResponse(res, { result });
    } catch (err) {
      return errorResponse(res, err);
    }
  });

  app.post('/api/dormant/industry-templates/calculate-progress-billing', (req: Request, res: Response) => {
    try {
      const { totalContractValueVnd, completedPercent } = req.body || {};
      const result = calculateProgressBilling(Number(totalContractValueVnd || 0), Number(completedPercent || 0));
      return successResponse(res, { result });
    } catch (err) {
      return errorResponse(res, err);
    }
  });

  // 🟢 21. AI Executive Boardroom Daily Standup API

  app.post('/api/dormant/bank-webhook/ingest', async (req: Request, res: Response) => {
    try {
      const result = await ingestBankWebhook(req.body || {});
      return successResponse(res, { result });
    } catch (err) {
      return errorResponse(res, err);
    }
  });

  // 🟢 24. Live System Architecture Mermaid Map API

  app.post('/api/dormant/einvoice/generate-xml', (req: Request, res: Response) => {
    try {
      const payload = req.body || {};
      if (!payload.sellerTaxCode || !payload.buyerName || !Array.isArray(payload.items)) {
        return res.status(400).json({ success: false, error: 'Missing sellerTaxCode, buyerName, or items array.' });
      }
      const eInvoice = generateEInvoiceXML(payload);
      return successResponse(res, { eInvoice });
    } catch (err) {
      return errorResponse(res, err);
    }
  });

  // 🟢 26. Subscription Renewal & Upsell Automation API

  app.post('/api/dormant/tax/quarterly-filing', (req: Request, res: Response) => {
    try {
      const { quarter, totalRevenueVnd, totalExpensesVnd } = req.body || {};
      const filing = generateQuarterlyTaxFiling(quarter || 'Q3/2026', Number(totalRevenueVnd || 150_000_000), Number(totalExpensesVnd || 80_000_000));
      return successResponse(res, { filing });
    } catch (err) {
      return errorResponse(res, err);
    }
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // 🟢 LEVEL 6 UPGRADE — Phase 1: AI CEO Autopilot & Natural Language OS
  // ═══════════════════════════════════════════════════════════════════════════

  // 53. Get AI CEO Autopilot State

  app.get('/api/dormant/reconciliation/records', (_req: Request, res: Response) => {
    try {
      return successResponse(res, { records: listReconciliationRecords() });
    } catch (err) {
      return errorResponse(res, err);
    }
  });

  app.post('/api/dormant/reconciliation/run-batch', (_req: Request, res: Response) => {
    try {
      const summary = runAutoReconciliationBatch();
      return successResponse(res, { summary });
    } catch (err) {
      return errorResponse(res, err);
    }
  });

  app.post('/api/dormant/reconciliation/approve', (req: Request, res: Response) => {
    try {
      const { recId, reason } = req.body || {};
      if (!recId) return res.status(400).json({ success: false, error: "Missing 'recId'." });
      const approved = approveDiscrepancyReconciliation(recId, reason || 'Approved by CFO');
      return successResponse(res, { approved, recId });
    } catch (err) {
      return errorResponse(res, err);
    }
  });

  // 61. Predictive Accounting Metrics

  app.get('/api/dormant/predictive-accounting/metrics', (_req: Request, res: Response) => {
    try {
      return successResponse(res, { metrics: getPredictiveAccountingMetrics() });
    } catch (err) {
      return errorResponse(res, err);
    }
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // 🟢 LEVEL 6 UPGRADE — Phase 4: Factory Auto-Scale, Performance & ROI
  // ═══════════════════════════════════════════════════════════════════════════

  // 62. Factory Auto-Scale Status

  app.get('/api/dormant/finance/incidents', (_req: Request, res: Response) => {
    try {
      return successResponse(res, { incidents: getFinancialIncidents() });
    } catch (err) {
      return errorResponse(res, err);
    }
  });

  app.post('/api/dormant/finance/scan-incidents', (_req: Request, res: Response) => {
    try {
      const result = scanAndTriggerFinancialPlaybooks();
      return successResponse(res, result);
    } catch (err) {
      return errorResponse(res, err);
    }
  });

  app.post('/api/dormant/finance/resolve-incident', (req: Request, res: Response) => {
    try {
      const { incidentId } = req.body || {};
      if (!incidentId) return res.status(400).json({ success: false, error: "Missing 'incidentId'." });
      const result = executeFinancialIncidentPlaybook(incidentId);
      return successResponse(res, result);
    } catch (err) {
      return errorResponse(res, err);
    }
  });

  // 75. Autonomous Business A/B Testing & Dynamic Pricing Optimizer

  app.get('/api/dormant/localization/data', (_req: Request, res: Response) => {
    try {
      return successResponse(res, getGlobalLocalizationData());
    } catch (err) {
      return errorResponse(res, err);
    }
  });

  app.get('/api/dormant/localization/convert', (req: Request, res: Response) => {
    try {
      const amount = Number(req.query.amount) || 1;
      const from = String(req.query.from || 'USD').toUpperCase();
      const to = String(req.query.to || 'VND').toUpperCase();
      const result = convertCurrency(amount, from, to);
      return successResponse(res, result);
    } catch (err) {
      return errorResponse(res, err);
    }
  });

  // 83. Autonomous Video & Social Swarm Campaign Engine

  app.get('/api/dormant/investors/data', (_req: Request, res: Response) => {
    try {
      return successResponse(res, getInvestorRelationsData());
    } catch (err) {
      return errorResponse(res, err);
    }
  });

  app.post('/api/dormant/investors/simulate-round', (req: Request, res: Response) => {
    try {
      const { roundName, raisedAmountVnd, preMoneyValuationVnd } = req.body || {};
      const result = simulateFundingRound({
        roundName: roundName || 'Series Seed',
        raisedAmountVnd: Number(raisedAmountVnd) || 5000000000,
        preMoneyValuationVnd: Number(preMoneyValuationVnd) || 25000000000,
      });
      return successResponse(res, { result });
    } catch (err) {
      return errorResponse(res, err);
    }
  });

  // 90. Supply Chain 3-Way Matching & Vendor Settlement

  app.get('/api/dormant/vendor/settlement', (_req: Request, res: Response) => {
    try {
      return successResponse(res, getVendorSettlementData());
    } catch (err) {
      return errorResponse(res, err);
    }
  });

  app.post('/api/dormant/vendor/pay', (req: Request, res: Response) => {
    try {
      const { billId } = req.body || {};
      if (!billId) return res.status(400).json({ success: false, error: "Missing 'billId'." });
      const result = executeVendorDisbursement(billId);
      return successResponse(res, result);
    } catch (err) {
      return errorResponse(res, err);
    }
  });

  // 91. Autonomous SEO Topical Authority & Backlink Graph

  app.get('/api/dormant/treasury/data', (_req: Request, res: Response) => {
    try {
      return successResponse(res, getTreasuryData());
    } catch (err) {
      return errorResponse(res, err);
    }
  });

  app.post('/api/dormant/treasury/sweep', (_req: Request, res: Response) => {
    try {
      return successResponse(res, executeOvernightYieldSweep());
    } catch (err) {
      return errorResponse(res, err);
    }
  });

  // 99. Autonomous Omnichannel Helpdesk & Voice-AI Call Center

  app.get('/api/dormant/ma/deals', (_req: Request, res: Response) => {
    try {
      return successResponse(res, getMaValuationData());
    } catch (err) {
      return errorResponse(res, err);
    }
  });

  app.post('/api/dormant/ma/advance', (req: Request, res: Response) => {
    try {
      const { dealId, nextStage } = req.body || {};
      if (!dealId || !nextStage) return res.status(400).json({ success: false, error: "Missing 'dealId' or 'nextStage'." });
      const result = advanceMaDealStage(dealId, nextStage);
      return successResponse(res, result);
    } catch (err) {
      return errorResponse(res, err);
    }
  });

  // 102. Autonomous Brand Reputation & Social Sentiment Radar

  app.get('/api/dormant/vat/rules', (_req: Request, res: Response) => {
    try {
      return successResponse(res, getGlobalVatData());
    } catch (err) {
      return errorResponse(res, err);
    }
  });

  app.post('/api/dormant/vat/calculate', (req: Request, res: Response) => {
    try {
      const { amountUsd, countryCode } = req.body || {};
      if (amountUsd === undefined || !countryCode) return res.status(400).json({ success: false, error: "Missing 'amountUsd' or 'countryCode'." });
      const result = calculateCrossBorderTax(amountUsd, countryCode);
      return successResponse(res, result);
    } catch (err) {
      return errorResponse(res, err);
    }
  });

  // 106. Autonomous Customer Referral Network & Multi-Tier Affiliate Commission Hub

  app.get('/api/dormant/esg/carbon', (_req: Request, res: Response) => {
    try {
      return successResponse(res, getEsgCarbonData());
    } catch (err) {
      return errorResponse(res, err);
    }
  });

  app.post('/api/dormant/esg/offset', (req: Request, res: Response) => {
    try {
      const { tons } = req.body || {};
      const result = purchaseCarbonCredits(Number(tons) || 1.0);
      return successResponse(res, result);
    } catch (err) {
      return errorResponse(res, err);
    }
  });

  // 109. Autonomous Multi-Channel WhatsApp & Telegram Marketing Bot

  app.get('/api/dormant/crypto-treasury/holdings', (_req: Request, res: Response) => {
    try {
      return successResponse(res, getCryptoTreasuryData());
    } catch (err) {
      return errorResponse(res, err);
    }
  });

  app.post('/api/dormant/crypto-treasury/offramp', (req: Request, res: Response) => {
    try {
      const { amountUsd } = req.body || {};
      const result = executeOffRampSettlement(Number(amountUsd) || 1000);
      return successResponse(res, result);
    } catch (err) {
      return errorResponse(res, err);
    }
  });

  // 114. Autonomous Video Production Studio & CapCut/TikTok Auto-Publisher

  app.get('/api/dormant/revenue-recognition/schedules', (_req: Request, res: Response) => {
    try { return successResponse(res, getRevenueRecognitionData()); } catch (err) { return errorResponse(res, err); }
  });

  app.post('/api/dormant/revenue-recognition/calculate', (req: Request, res: Response) => {
    try {
      const { contractTotalVnd, durationMonths } = req.body || {};
      if (!contractTotalVnd) return res.status(400).json({ success: false, error: "Missing 'contractTotalVnd'." });
      return successResponse(res, calculateIfrs15Allocation(contractTotalVnd, durationMonths));
    } catch (err) { return errorResponse(res, err); }
  });

  // 🟢 137. Data Privacy & PDPA/GDPR Compliance Engine

  app.get('/api/dormant/credit-scoring/profiles', (_req: Request, res: Response) => {
    try { return successResponse(res, getCreditScoringData()); } catch (err) { return errorResponse(res, err); }
  });

  app.post('/api/dormant/credit-scoring/calculate', (req: Request, res: Response) => {
    try {
      const { businessName, monthlyRevenueVnd } = req.body || {};
      return successResponse(res, calculateCreditEligibility(businessName || 'Vinaconex 3', monthlyRevenueVnd || 1200000000));
    } catch (err) { return errorResponse(res, err); }
  });

  // 🟢 150. ESG Impact & Carbon Offset Marketplace Integration
}
