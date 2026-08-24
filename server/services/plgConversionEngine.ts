export interface PlgEvent { userId: string; event: string; timestamp: string; value: number; }
export interface PlgMember { userId: string; tenantName: string; plan: string; ahaMomentReached: boolean; featureAdoptionScore: number; upsellEligible: boolean; recommendedUpgrade: string; }
export interface PlgFunnelData { members: PlgMember[]; conversionRatePercent: number; averageTimeToAhaMomentDays: number; topTriggerEvent: string; upsellCandidates: number; estimatedUpsellMrrVnd: number; }
export interface UpsellResult { success: boolean; userId: string; offerId: string; offerDescription: string; offerPriceVnd: number; expiresAt: string; deliveryChannel: string; }

export function getPlgConversionData(): PlgFunnelData {
  const members: PlgMember[] = [
    { userId: 'usr_001', tenantName: 'StarterCorp VN', plan: 'starter', ahaMomentReached: true, featureAdoptionScore: 87, upsellEligible: true, recommendedUpgrade: 'growth' },
    { userId: 'usr_002', tenantName: 'SME Saigon', plan: 'starter', ahaMomentReached: true, featureAdoptionScore: 92, upsellEligible: true, recommendedUpgrade: 'growth' },
    { userId: 'usr_003', tenantName: 'Hanoi Retail', plan: 'growth', ahaMomentReached: true, featureAdoptionScore: 78, upsellEligible: false, recommendedUpgrade: '' },
    { userId: 'usr_004', tenantName: 'MidSize Tech', plan: 'growth', ahaMomentReached: false, featureAdoptionScore: 45, upsellEligible: false, recommendedUpgrade: '' },
  ];
  return {
    members,
    conversionRatePercent: 34.7,
    averageTimeToAhaMomentDays: 2.8,
    topTriggerEvent: '10th_invoice_created',
    upsellCandidates: members.filter(m => m.upsellEligible).length,
    estimatedUpsellMrrVnd: members.filter(m => m.upsellEligible).length * 2_000_000,
  };
}

export function triggerUpsell(userId: string, triggerEvent: string): UpsellResult {
  return {
    success: true,
    userId,
    offerId: 'UPSELL-' + Date.now().toString(36).toUpperCase(),
    offerDescription: 'Nang cap len Growth — Mo khoa AI Swarm 3 agents + TT200 Ledger. Giam 20% thang dau.',
    offerPriceVnd: 2_392_000,
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    deliveryChannel: 'in-app + telegram',
  };
}
