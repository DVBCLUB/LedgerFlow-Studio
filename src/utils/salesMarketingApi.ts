/**
 * src/utils/salesMarketingApi.ts
 * Frontend client cho các engine Sales & Marketing (route /api/dormant/*).
 */

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, { headers: { 'Content-Type': 'application/json' }, ...init });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return (await res.json()) as T;
}

// ── B2B Marketplace ──────────────────────────────────────────────
export interface MarketplaceModule {
  moduleId: string;
  name: string;
  author: string;
  category: string;
  priceMonthlyVnd: number;
  activeInstallsCount: number;
  ratingScore: number;
  verified: boolean;
}
export interface B2bMarketplaceData {
  modules: MarketplaceModule[];
  totalEcosystemGmvVnd: number;
  activeDevelopersCount: number;
  lastUpdated: string;
}
export function getB2bModules(): Promise<{ success: boolean } & B2bMarketplaceData> {
  return request('/api/dormant/b2b-marketplace/modules');
}
export function installB2bModule(moduleId: string): Promise<{ success: boolean; moduleId: string; installStatus: string; installedAt: string }> {
  return request('/api/dormant/b2b-marketplace/install', { method: 'POST', body: JSON.stringify({ moduleId }) });
}

// ── Bilingual Voice Bridge ───────────────────────────────────────
export interface VoiceCallSession {
  sessionId: string;
  counterparty: string;
  targetLanguage: string;
  durationSeconds: number;
  detectedTermsAgreed: string[];
  audioQualityScore: number;
  status: string;
}
export interface VoiceBridgeData {
  totalCallsHandled30d: number;
  averageTranslationLatencyMs: number;
  contractNegotiationWinRatePercent: number;
  sessions: VoiceCallSession[];
  lastSessionAt: string;
}
export function getVoiceBridgeSessions(): Promise<{ success: boolean } & VoiceBridgeData> {
  return request('/api/dormant/voice-bridge/sessions');
}
export function translateVoice(text: string, fromLang?: string, toLang?: string): Promise<{ success: boolean; originalText: string; translatedText: string; latencyMs: number; audioStreamUrl: string; translatedAt: string }> {
  return request('/api/dormant/voice-bridge/translate', { method: 'POST', body: JSON.stringify({ text, fromLang, toLang }) });
}

// ── Competitive War Room ─────────────────────────────────────────
export interface CompetitorIntel {
  competitor: string;
  marketShareEstimatePercent: number;
  coreVulnerability: string;
  killPointForLedgerFlow: string;
  lastUpdated: string;
}
export interface WarRoomData {
  competitors: CompetitorIntel[];
  marketIntelligenceHealthScore: number;
  lastSyncAt: string;
}
export function getWarRoomIntel(): Promise<{ success: boolean } & WarRoomData> {
  return request('/api/dormant/competitive-war-room/intel');
}
export function generateBattleCard(competitor?: string): Promise<{ success: boolean; competitor: string; battleCardSummary: string; generatedAt: string }> {
  return request('/api/dormant/competitive-war-room/battle-card', { method: 'POST', body: JSON.stringify({ competitor }) });
}

// ── Customer DNA Profiling ───────────────────────────────────────
export interface CustomerDnaProfile {
  customerId: string;
  customerName: string;
  tier: string;
  industry: string;
  healthScore: number;
  churnRiskPercent: number;
  predictedLtvVnd: number;
  propensityToUpgradeScore: number;
  primaryValueDriver: string;
  usageFrequency: string;
  npsScore: number;
  supportTicketCount30d: number;
  recommendedPlaybook: string;
  dnaTraits: string[];
}
export interface CustomerDnaData {
  profiles: CustomerDnaProfile[];
  averageDnaScore: number;
  highValueCohortCount: number;
  expansionPipelineVnd: number;
  segmentationClusters: { cluster: string; count: number; mrrSharePercent: number }[];
  lastProfileRefreshAt: string;
}
export function getCustomerDnaProfiles(): Promise<{ success: boolean } & CustomerDnaData> {
  return request('/api/dormant/customer-dna/profiles');
}
export function enrichCustomerDna(customerId: string): Promise<{ success: boolean; customerId: string; updatedHealthScore: number; nextBestAction: string; generatedInsight: string; enrichedAt: string }> {
  return request('/api/dormant/customer-dna/enrich', { method: 'POST', body: JSON.stringify({ customerId }) });
}

// ── Hyper Personalization ────────────────────────────────────────
export interface PersonalizedCampaign {
  campaignId: string;
  accountName: string;
  industry: string;
  customHook: string;
  recommendedSolution: string;
  projectedRoiPercent: number;
  channel: string;
  status: string;
}
export interface HyperPersonalizationData {
  campaigns: PersonalizedCampaign[];
  totalPersonalizedSent30d: number;
  openRatePercent: number;
  replyRatePercent: number;
  lastGeneratedAt: string;
}
export function getHyperPersonalizationCampaigns(): Promise<{ success: boolean } & HyperPersonalizationData> {
  return request('/api/dormant/hyper-personalization/campaigns');
}
export function generatePersonalizedPitch(accountName?: string, industry?: string): Promise<{ success: boolean; accountName: string; industry: string; generatedSubject: string; generatedBody: string; generatedAt: string }> {
  return request('/api/dormant/hyper-personalization/generate-pitch', { method: 'POST', body: JSON.stringify({ accountName, industry }) });
}

// ── Multi-Variate Pricing ────────────────────────────────────────
export interface PricingSimulationResult {
  tierName: string;
  currentPriceVnd: number;
  optimalPriceVnd: number;
  expectedRevenueLiftPercent: number;
  elasticityCoefficient: number;
}
export interface PricingOptimizationData {
  tiers: PricingSimulationResult[];
  averageWtpConfidencePercent: number;
  lastSimulatedAt: string;
}
export function getPricingTiers(): Promise<{ success: boolean } & PricingOptimizationData> {
  return request('/api/dormant/pricing-optimization/tiers');
}
export function simulatePricing(targetTier?: string, proposedPriceVnd?: number): Promise<{ success: boolean; targetTier: string; proposedPriceVnd: number; projectedMrrVnd: number; projectedConversionRatePercent: number; simulatedAt: string }> {
  return request('/api/dormant/pricing-optimization/simulate', { method: 'POST', body: JSON.stringify({ targetTier, proposedPriceVnd }) });
}

// ── Partner / Reseller ───────────────────────────────────────────
export interface PartnerChannel {
  partnerId: string;
  partnerName: string;
  tier: string;
  activeDealsCount: number;
  totalRevenueGeneratedVnd: number;
  commissionPaidVnd: number;
  commissionRatePercent: number;
  mdfBudgetVnd: number;
  status: string;
}
export interface PartnerProgramData {
  partners: PartnerChannel[];
  totalChannelRevenueVnd: number;
  averageDealCycleDays: number;
  pendingDealRegistrations: number;
  lastUpdated: string;
}
export function getPartnerOverview(): Promise<{ success: boolean } & PartnerProgramData> {
  return request('/api/dormant/partners/overview');
}
export function registerPartnerDeal(payload: { partnerId?: string; clientName?: string; dealValueVnd?: number }): Promise<{ success: boolean; dealRegistrationId: string; partnerId: string; clientName: string; dealValueVnd: number; estimatedCommissionVnd: number; protectionPeriodDays: number; status: string; registeredAt: string }> {
  return request('/api/dormant/partners/register-deal', { method: 'POST', body: JSON.stringify(payload) });
}

// ── PLG Conversion ───────────────────────────────────────────────
export interface PlgMember {
  userId: string;
  tenantName: string;
  plan: string;
  ahaMomentReached: boolean;
  featureAdoptionScore: number;
  upsellEligible: boolean;
  recommendedUpgrade: string;
}
export interface PlgFunnelData {
  members: PlgMember[];
  conversionRatePercent: number;
  averageTimeToAhaMomentDays: number;
  topTriggerEvent: string;
  upsellCandidates: number;
  estimatedUpsellMrrVnd: number;
}
export function getPlgFunnel(): Promise<{ success: boolean } & PlgFunnelData> {
  return request('/api/dormant/plg/funnel');
}
export function triggerPlgUpsell(userId: string): Promise<{ success: boolean; userId: string; offerId: string; offerDescription: string; offerPriceVnd: number; expiresAt: string; deliveryChannel: string }> {
  return request('/api/dormant/plg/trigger-upsell', { method: 'POST', body: JSON.stringify({ userId }) });
}

// ── Customer Success Academy ─────────────────────────────────────
export interface AcademyCourse {
  courseId: string;
  title: string;
  targetRole: string;
  totalModules: number;
  enrolledStudentsCount: number;
  completionRatePercent: number;
  certificateEarnedCount: number;
}
export interface AcademyData {
  courses: AcademyCourse[];
  totalCertifiedProfessionals: number;
  averageNpsImprovementPercent: number;
  lastUpdated: string;
}
export function getSuccessAcademyCourses(): Promise<{ success: boolean } & AcademyData> {
  return request('/api/dormant/success-academy/courses');
}
export function issueCertificate(studentName?: string, courseId?: string): Promise<{ success: boolean; certificateId: string; studentName: string; courseId: string; verificationUrl: string; issuedAt: string }> {
  return request('/api/dormant/success-academy/issue-cert', { method: 'POST', body: JSON.stringify({ studentName, courseId }) });
}
