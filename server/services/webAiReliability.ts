/**
 * WebAiReliability V2 — Sliding Window + Circuit Breaker Pattern
 * 
 * Tracks profile health using a rolling 30-minute window of events,
 * implements a circuit breaker pattern (closed→open→half-open), and
 * provides dynamic cooldown with exponential backoff.
 */

export type CircuitState = 'closed' | 'open' | 'half-open';

export interface WebAIProfileHealth {
  profileId: string;
  name: string;
  platform: 'chatgpt' | 'gemini' | 'claude' | 'deepseek' | 'grok' | 'copilot';
  healthScore: number; // 0-100
  status: 'leaseable' | 'cooldown' | 'blocked';
  lastError?: string;
  cooldownEndsAt?: string;
  retryRecommendation?: string;
  // V2 fields
  circuitState: CircuitState;
  consecutiveFailures: number;
  consecutiveSuccesses: number;
  totalRequests: number;
  totalFailures: number;
  lastSuccessAt?: string;
  lastFailureAt?: string;
  recentEvents: ProfileEvent[];
}

interface ProfileEvent {
  timestamp: number;
  success: boolean;
  error?: string;
  isQuota?: boolean;
  latencyMs?: number;
}

// Configuration constants
const SLIDING_WINDOW_MS = 30 * 60 * 1000; // 30 minutes
const CIRCUIT_OPEN_THRESHOLD = 3;         // Open circuit after 3 consecutive failures
const CIRCUIT_HALF_OPEN_COOLDOWN_MS = 5 * 60 * 1000;  // 5 minutes before half-open
const QUOTA_COOLDOWN_MS = 60 * 60 * 1000;             // 60 minutes for quota errors
const MAX_EVENTS_PER_PROFILE = 100;

const HEALTH_DB = new Map<string, WebAIProfileHealth>();

function pruneOldEvents(profile: WebAIProfileHealth): void {
  const cutoff = Date.now() - SLIDING_WINDOW_MS;
  profile.recentEvents = profile.recentEvents.filter(e => e.timestamp >= cutoff);
  // Also cap at MAX_EVENTS_PER_PROFILE
  if (profile.recentEvents.length > MAX_EVENTS_PER_PROFILE) {
    profile.recentEvents = profile.recentEvents.slice(-MAX_EVENTS_PER_PROFILE);
  }
}

function recalculateHealthScore(profile: WebAIProfileHealth): void {
  pruneOldEvents(profile);
  const events = profile.recentEvents;
  if (events.length === 0) {
    profile.healthScore = 100;
    return;
  }
  const successes = events.filter(e => e.success).length;
  const successRate = successes / events.length;
  // Weight recent events more heavily (last 5 events count 2x)
  const recentEvents = events.slice(-5);
  const recentSuccesses = recentEvents.filter(e => e.success).length;
  const recentRate = recentEvents.length > 0 ? recentSuccesses / recentEvents.length : 1;
  // Combined score: 40% overall + 60% recent
  profile.healthScore = Math.round((successRate * 40 + recentRate * 60));
}

function updateCircuitState(profile: WebAIProfileHealth): void {
  const now = Date.now();

  if (profile.circuitState === 'open') {
    // Check if cooldown has passed → transition to half-open
    if (profile.cooldownEndsAt && now >= new Date(profile.cooldownEndsAt).getTime()) {
      profile.circuitState = 'half-open';
      profile.status = 'leaseable'; // Allow one probe request
      console.log(`[Reliability] Circuit for ${profile.name} transitioned: open → half-open`);
    }
    return;
  }

  if (profile.circuitState === 'half-open') {
    // In half-open, we allow 1 request. 
    // The success/failure handlers will transition it to closed/open.
    return;
  }

  // circuitState === 'closed'
  if (profile.consecutiveFailures >= CIRCUIT_OPEN_THRESHOLD) {
    profile.circuitState = 'open';
    profile.status = 'cooldown';
    // Dynamic cooldown: exponential backoff based on total failures
    const backoffMultiplier = Math.min(profile.totalFailures, 5);
    const cooldownMs = CIRCUIT_HALF_OPEN_COOLDOWN_MS * backoffMultiplier;
    const cooldownEnd = new Date(now + cooldownMs);
    profile.cooldownEndsAt = cooldownEnd.toISOString();
    profile.retryRecommendation = `Circuit breaker open after ${profile.consecutiveFailures} failures. Auto-retry in ${Math.round(cooldownMs / 60000)} minutes.`;
    console.log(`[Reliability] Circuit OPEN for ${profile.name}: ${profile.retryRecommendation}`);
  }
}

export function getProfileHealth(profileId: string): WebAIProfileHealth | null {
  const profile = HEALTH_DB.get(profileId) || null;
  if (profile) {
    pruneOldEvents(profile);
    updateCircuitState(profile);
  }
  return profile;
}

export function registerProfile(profileId: string, name: string, platform: WebAIProfileHealth['platform']) {
  if (!HEALTH_DB.has(profileId)) {
    HEALTH_DB.set(profileId, {
      profileId,
      name,
      platform,
      healthScore: 100,
      status: 'leaseable',
      circuitState: 'closed',
      consecutiveFailures: 0,
      consecutiveSuccesses: 0,
      totalRequests: 0,
      totalFailures: 0,
      recentEvents: [],
    });
  }
}

export function reportProfileSuccess(profileId: string, latencyMs?: number) {
  const profile = HEALTH_DB.get(profileId);
  if (!profile) return;

  profile.totalRequests++;
  profile.consecutiveSuccesses++;
  profile.consecutiveFailures = 0;
  profile.lastSuccessAt = new Date().toISOString();
  profile.lastError = undefined;

  profile.recentEvents.push({
    timestamp: Date.now(),
    success: true,
    latencyMs,
  });

  recalculateHealthScore(profile);

  // Circuit breaker transitions
  if (profile.circuitState === 'half-open') {
    // Successful probe → close circuit
    profile.circuitState = 'closed';
    profile.status = 'leaseable';
    profile.cooldownEndsAt = undefined;
    profile.retryRecommendation = undefined;
    console.log(`[Reliability] Circuit CLOSED for ${profile.name} after successful probe.`);
  } else if (profile.circuitState === 'open') {
    // Shouldn't happen, but handle gracefully
    profile.circuitState = 'closed';
    profile.status = 'leaseable';
  } else {
    profile.status = 'leaseable';
    profile.cooldownEndsAt = undefined;
  }
}

export function reportProfileError(profileId: string, error: string, isQuotaError: boolean) {
  const profile = HEALTH_DB.get(profileId);
  if (!profile) return;

  const now = Date.now();
  profile.totalRequests++;
  profile.totalFailures++;
  profile.consecutiveFailures++;
  profile.consecutiveSuccesses = 0;
  profile.lastError = error;
  profile.lastFailureAt = new Date().toISOString();

  profile.recentEvents.push({
    timestamp: now,
    success: false,
    error: error.slice(0, 200),
    isQuota: isQuotaError,
  });

  recalculateHealthScore(profile);

  // Circuit breaker transitions
  if (profile.circuitState === 'half-open') {
    // Failed probe → reopen circuit with longer cooldown
    profile.circuitState = 'open';
    profile.status = 'cooldown';
    const cooldownMs = isQuotaError ? QUOTA_COOLDOWN_MS : CIRCUIT_HALF_OPEN_COOLDOWN_MS * 2;
    profile.cooldownEndsAt = new Date(now + cooldownMs).toISOString();
    profile.retryRecommendation = `Recovery probe failed. Reopened circuit for ${Math.round(cooldownMs / 60000)} minutes.`;
    console.log(`[Reliability] Circuit REOPENED for ${profile.name}: ${profile.retryRecommendation}`);
    return;
  }

  if (isQuotaError) {
    profile.circuitState = 'open';
    profile.status = 'cooldown';
    profile.cooldownEndsAt = new Date(now + QUOTA_COOLDOWN_MS).toISOString();
    profile.retryRecommendation = `Quota limit reached. Auto-retry in 60 minutes.`;
    console.log(`[Reliability] Circuit OPEN (quota) for ${profile.name}.`);
    return;
  }

  updateCircuitState(profile);
}

/**
 * Check if a profile is currently available for requests.
 * Returns true if circuit is closed or half-open (allows 1 probe).
 */
export function isProfileAvailable(profileId: string): boolean {
  const profile = HEALTH_DB.get(profileId);
  if (!profile) return true; // Unknown profile, allow
  
  pruneOldEvents(profile);
  updateCircuitState(profile);
  
  return profile.circuitState !== 'open';
}

export function listAllProfileHealth(): WebAIProfileHealth[] {
  const now = Date.now();
  for (const profile of HEALTH_DB.values()) {
    pruneOldEvents(profile);
    updateCircuitState(profile);
  }
  return Array.from(HEALTH_DB.values());
}

/**
 * Get summary stats for diagnostics
 */
export function getReliabilityStats(): {
  totalProfiles: number;
  available: number;
  cooldown: number;
  blocked: number;
  avgHealthScore: number;
} {
  const profiles = listAllProfileHealth();
  const available = profiles.filter(p => p.status === 'leaseable').length;
  const cooldown = profiles.filter(p => p.status === 'cooldown').length;
  const blocked = profiles.filter(p => p.status === 'blocked').length;
  const avgHealthScore = profiles.length > 0
    ? Math.round(profiles.reduce((sum, p) => sum + p.healthScore, 0) / profiles.length)
    : 100;

  return {
    totalProfiles: profiles.length,
    available,
    cooldown,
    blocked,
    avgHealthScore,
  };
}
