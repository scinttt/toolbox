import { RateLimiter } from "@/lib/rate-limit";

describe("RateLimiter", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test("allows first request", () => {
    const limiter = new RateLimiter({ windowMs: 60_000, maxRequests: 5 });
    expect(limiter.check("ip1").allowed).toBe(true);
  });

  test("allows requests up to maxRequests", () => {
    const limiter = new RateLimiter({ windowMs: 60_000, maxRequests: 3 });
    expect(limiter.check("ip1").allowed).toBe(true);
    expect(limiter.check("ip1").allowed).toBe(true);
    expect(limiter.check("ip1").allowed).toBe(true);
  });

  test("rejects requests exceeding maxRequests", () => {
    const limiter = new RateLimiter({ windowMs: 60_000, maxRequests: 2 });
    limiter.check("ip1");
    limiter.check("ip1");

    const result = limiter.check("ip1");
    expect(result.allowed).toBe(false);
    if (!result.allowed) {
      expect(result.retryAfterMs).toBeGreaterThan(0);
      expect(result.retryAfterMs).toBeLessThanOrEqual(60_000);
    }
  });

  test("allows requests again after window expires", () => {
    const limiter = new RateLimiter({ windowMs: 60_000, maxRequests: 1 });
    limiter.check("ip1");

    expect(limiter.check("ip1").allowed).toBe(false);

    jest.advanceTimersByTime(60_001);

    expect(limiter.check("ip1").allowed).toBe(true);
  });

  test("tracks different keys independently", () => {
    const limiter = new RateLimiter({ windowMs: 60_000, maxRequests: 1 });
    limiter.check("ip1");

    expect(limiter.check("ip1").allowed).toBe(false);
    expect(limiter.check("ip2").allowed).toBe(true);
  });
});
