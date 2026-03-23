import { describe, it, expect, vi, beforeEach } from 'vitest';
import { RateLimiter } from '../rate-limiter';

describe('RateLimiter', () => {
  let limiter: RateLimiter;

  beforeEach(() => {
    limiter = new RateLimiter({ maxRequests: 3, windowMs: 1000 });
  });

  it('allows requests within limit', () => {
    expect(limiter.tryRequest()).toBe(true);
    expect(limiter.tryRequest()).toBe(true);
    expect(limiter.tryRequest()).toBe(true);
  });

  it('blocks requests over limit', () => {
    limiter.tryRequest();
    limiter.tryRequest();
    limiter.tryRequest();
    expect(limiter.tryRequest()).toBe(false);
  });

  it('reports remaining correctly', () => {
    expect(limiter.remaining()).toBe(3);
    limiter.tryRequest();
    expect(limiter.remaining()).toBe(2);
  });

  it('resets after window expires', () => {
    vi.useFakeTimers();
    limiter.tryRequest();
    limiter.tryRequest();
    limiter.tryRequest();
    expect(limiter.tryRequest()).toBe(false);

    vi.advanceTimersByTime(1001);
    expect(limiter.tryRequest()).toBe(true);
    vi.useRealTimers();
  });

  it('canRequest returns true when under limit', () => {
    expect(limiter.canRequest()).toBe(true);
  });

  it('retryAfterMs returns 0 when under limit', () => {
    expect(limiter.retryAfterMs()).toBe(0);
  });
});
