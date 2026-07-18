export interface WebAIProfileHealth {
  profileId: string;
  name: string;
  platform: 'chatgpt' | 'gemini' | 'claude' | 'deepseek';
  healthScore: number; // 0-100
  status: 'leaseable' | 'cooldown' | 'blocked';
  lastError?: string;
  cooldownEndsAt?: string;
  retryRecommendation?: string;
}

const HEALTH_DB = new Map<string, WebAIProfileHealth>();

export function getProfileHealth(profileId: string): WebAIProfileHealth | null {
  return HEALTH_DB.get(profileId) || null;
}

export function registerProfile(profileId: string, name: string, platform: WebAIProfileHealth['platform']) {
  if (!HEALTH_DB.has(profileId)) {
    HEALTH_DB.set(profileId, {
      profileId,
      name,
      platform,
      healthScore: 100,
      status: 'leaseable'
    });
  }
}

export function reportProfileSuccess(profileId: string) {
  const profile = HEALTH_DB.get(profileId);
  if (profile) {
    profile.healthScore = Math.min(100, profile.healthScore + 5);
    if (profile.status !== 'blocked') {
      profile.status = 'leaseable';
      profile.cooldownEndsAt = undefined;
      profile.lastError = undefined;
    }
  }
}

export function reportProfileError(profileId: string, error: string, isQuotaError: boolean) {
  const profile = HEALTH_DB.get(profileId);
  if (profile) {
    profile.healthScore = Math.max(0, profile.healthScore - (isQuotaError ? 20 : 10));
    profile.lastError = error;
    
    if (profile.healthScore < 30 || isQuotaError) {
      profile.status = 'cooldown';
      const cooldownMinutes = isQuotaError ? 60 : 15;
      const end = new Date();
      end.setMinutes(end.getMinutes() + cooldownMinutes);
      profile.cooldownEndsAt = end.toISOString();
      profile.retryRecommendation = `Wait ${cooldownMinutes} minutes before retrying due to ${isQuotaError ? 'quota limits' : 'repeated errors'}.`;
    }
  }
}

export function listAllProfileHealth(): WebAIProfileHealth[] {
  const now = new Date();
  for (const profile of HEALTH_DB.values()) {
    if (profile.status === 'cooldown' && profile.cooldownEndsAt) {
      if (now >= new Date(profile.cooldownEndsAt)) {
        profile.status = 'leaseable';
        profile.cooldownEndsAt = undefined;
      }
    }
  }
  return Array.from(HEALTH_DB.values());
}
