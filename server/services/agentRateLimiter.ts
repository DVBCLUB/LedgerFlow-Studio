/**
 * agentRateLimiter.ts
 * ============================================================
 * Token Bucket Rate Limiter per Agent & Client Session.
 *
 * Chống cạn kiệt token/quota khi nhiều agent hoặc loop chạy song song.
 * Cung cấp giới hạn phân tầng (Human vs Robot vs SWE Agent) với
 * cơ chế hồi token tự động (Token Bucket Refill).
 */

export type RateLimitTier = 'human' | 'robot' | 'agent';

export interface RateLimitPolicy {
  capacity: number;       // Dung lượng tối đa trong bucket (burst)
  refillPerMinute: number; // Tốc độ hồi phục token mỗi phút
}

const DEFAULT_POLICIES: Record<RateLimitTier, RateLimitPolicy> = {
  human: { capacity: 60, refillPerMinute: 60 },   // 60 req/min
  agent: { capacity: 30, refillPerMinute: 30 },   // 30 req/min
  robot: { capacity: 20, refillPerMinute: 20 },   // 20 req/min
};

interface BucketState {
  tokens: number;
  lastRefillTimestamp: number;
  tier: RateLimitTier;
}

const bucketStore = new Map<string, BucketState>();

function getOrInitBucket(clientId: string, tier: RateLimitTier = 'agent'): BucketState {
  const existing = bucketStore.get(clientId);
  const now = Date.now();
  const policy = DEFAULT_POLICIES[tier] || DEFAULT_POLICIES.agent;

  if (!existing) {
    const fresh: BucketState = {
      tokens: policy.capacity,
      lastRefillTimestamp: now,
      tier,
    };
    bucketStore.set(clientId, fresh);
    return fresh;
  }

  // Refill tokens based on elapsed time
  const elapsedMs = now - existing.lastRefillTimestamp;
  if (elapsedMs > 0) {
    const refillTokens = (elapsedMs / 60000) * policy.refillPerMinute;
    existing.tokens = Math.min(policy.capacity, existing.tokens + refillTokens);
    existing.lastRefillTimestamp = now;
  }
  return existing;
}

export interface RateLimitResult {
  allowed: boolean;
  remainingTokens: number;
  retryAfterMs: number;
  tier: RateLimitTier;
}

/**
 * Kiểm tra xem client/agent có đủ token để gọi AI Gateway hay không
 */
export function checkAgentRateLimit(clientId: string, tier: RateLimitTier = 'agent'): RateLimitResult {
  const bucket = getOrInitBucket(clientId, tier);
  const policy = DEFAULT_POLICIES[tier] || DEFAULT_POLICIES.agent;
  const allowed = bucket.tokens >= 1;

  let retryAfterMs = 0;
  if (!allowed) {
    const needed = 1 - bucket.tokens;
    retryAfterMs = Math.ceil((needed / (policy.refillPerMinute / 60000)));
  }

  return {
    allowed,
    remainingTokens: Math.max(0, Math.floor(bucket.tokens)),
    retryAfterMs,
    tier,
  };
}

/**
 * Tiêu thụ token (1 token mặc định) cho 1 lượt gọi AI
 */
export function consumeAgentRateLimit(clientId: string, tier: RateLimitTier = 'agent', tokensToConsume = 1): RateLimitResult {
  const bucket = getOrInitBucket(clientId, tier);
  const policy = DEFAULT_POLICIES[tier] || DEFAULT_POLICIES.agent;

  if (bucket.tokens >= tokensToConsume) {
    bucket.tokens -= tokensToConsume;
    return {
      allowed: true,
      remainingTokens: Math.max(0, Math.floor(bucket.tokens)),
      retryAfterMs: 0,
      tier,
    };
  }

  const needed = tokensToConsume - bucket.tokens;
  const retryAfterMs = Math.ceil((needed / (policy.refillPerMinute / 60000)));

  return {
    allowed: false,
    remainingTokens: Math.max(0, Math.floor(bucket.tokens)),
    retryAfterMs,
    tier,
  };
}

/**
 * Xóa cache giới hạn cho 1 client hoặc toàn bộ hệ thống
 */
export function resetAgentRateLimit(clientId?: string): void {
  if (clientId) {
    bucketStore.delete(clientId);
  } else {
    bucketStore.clear();
  }
}

/**
 * Xem tổng quan trạng thái tất cả các bucket đang hoạt động
 */
export function getAgentRateLimiterStatus() {
  const entries: Array<{ clientId: string; tier: RateLimitTier; tokens: number }> = [];
  for (const [clientId, state] of bucketStore.entries()) {
    entries.push({
      clientId,
      tier: state.tier,
      tokens: Math.round(state.tokens * 10) / 10,
    });
  }
  return {
    activeClientCount: bucketStore.size,
    clients: entries,
  };
}
