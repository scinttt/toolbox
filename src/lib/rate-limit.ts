interface RateLimitEntry {
  count: number;
  resetAt: number;
}

interface RateLimiterConfig {
  windowMs: number;
  maxRequests: number;
}

export class RateLimiter {
  private store = new Map<string, RateLimitEntry>();
  private config: RateLimiterConfig;

  constructor(config: RateLimiterConfig) {
    this.config = config;
  }

  check(key: string): { allowed: true } | { allowed: false; retryAfterMs: number } {
    const now = Date.now();

    // Lazy cleanup when map grows too large
    if (this.store.size > 10_000) {
      for (const [k, v] of this.store) {
        if (now >= v.resetAt) this.store.delete(k);
      }
    }

    const entry = this.store.get(key);

    if (!entry || now >= entry.resetAt) {
      this.store.set(key, { count: 1, resetAt: now + this.config.windowMs });
      return { allowed: true };
    }

    if (entry.count < this.config.maxRequests) {
      entry.count++;
      return { allowed: true };
    }

    return { allowed: false, retryAfterMs: entry.resetAt - now };
  }
}
