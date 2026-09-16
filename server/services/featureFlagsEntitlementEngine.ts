/**
 * server/services/featureFlagsEntitlementEngine.ts
 * ─────────────────────────────────────────────────────────────
 * Trụ Cột 76 — AI Product Catalog, Feature Flags & Entitlement Engine
 * Quản lý feature flags, pricing tiers, usage metering và khóa tính năng theo gói.
 */

export interface FeatureFlag {
  flagKey: string;
  name: string;
  enabledTiers: string[];
  rolloutPercent: number;
  status: 'active' | 'beta';
}

export interface EntitlementData {
  flags: FeatureFlag[];
  totalActiveFlags: number;
  meteredUsageEvents24h: number;
  lastUpdated: string;
}

const FEATURE_FLAGS: FeatureFlag[] = [
  { flagKey: 'feat_vietqr_auto_reconcile', name: 'VietQR Dynamic Banking Auto-Reconciliation', enabledTiers: ['Starter', 'Growth', 'Enterprise'], rolloutPercent: 100, status: 'active' },
  { flagKey: 'feat_ai_boardroom_delphi', name: 'Constitutional Boardroom Delphi Consensus', enabledTiers: ['Enterprise'], rolloutPercent: 100, status: 'active' },
  { flagKey: 'feat_monte_carlo_digital_twin', name: 'Monte Carlo 1000-Iteration Digital Twin', enabledTiers: ['Scale', 'Enterprise'], rolloutPercent: 100, status: 'active' },
  { flagKey: 'feat_voice_ceo_command', name: 'Voice CEO Natural Language Command Hub', enabledTiers: ['Enterprise'], rolloutPercent: 80, status: 'beta' },
];

function rolloutBucket(userId: string, flagKey: string) {
  let hash = 0;
  for (const char of `${userId}:${flagKey}`) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  return hash % 100;
}

export function getEntitlementData(): EntitlementData {
  return {
    totalActiveFlags: FEATURE_FLAGS.filter((flag) => flag.status === 'active').length,
    meteredUsageEvents24h: 92400,
    flags: FEATURE_FLAGS.map((flag) => ({ ...flag, enabledTiers: [...flag.enabledTiers] })),
    lastUpdated: new Date().toISOString()
  };
}

export function checkUserEntitlement(userId: string, flagKey: string, tier: string) {
  const flag = FEATURE_FLAGS.find((item) => item.flagKey === flagKey);
  const hasEligibleTier = Boolean(flag?.enabledTiers.includes(tier));
  const inRollout = Boolean(flag && rolloutBucket(userId, flagKey) < flag.rolloutPercent);
  return {
    success: true,
    userId,
    flagKey,
    hasAccess: Boolean(flag && hasEligibleTier && inRollout),
    tier,
    reason: !flag ? 'unknown_flag' : !hasEligibleTier ? 'tier_not_entitled' : !inRollout ? 'outside_rollout' : 'granted',
    checkedAt: new Date().toISOString()
  };
}
