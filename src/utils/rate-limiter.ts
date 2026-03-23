// Simple client-side rate limiter for API calls
// Prevents excessive requests to Claude/Groq APIs

interface RateLimiterConfig {
  maxRequests: number;  // max requests per window
  windowMs: number;     // time window in ms
}

export class RateLimiter {
  private timestamps: number[] = [];
  private config: RateLimiterConfig;

  constructor(config: RateLimiterConfig) {
    this.config = config;
  }

  // Check if request is allowed. Returns true if allowed, false if rate limited.
  canRequest(): boolean {
    const now = Date.now();
    // Remove timestamps outside the window
    this.timestamps = this.timestamps.filter(t => now - t < this.config.windowMs);
    return this.timestamps.length < this.config.maxRequests;
  }

  // Record a request
  recordRequest(): void {
    this.timestamps.push(Date.now());
  }

  // Try to make a request. Returns true if allowed and recorded.
  tryRequest(): boolean {
    if (!this.canRequest()) return false;
    this.recordRequest();
    return true;
  }

  // Get remaining requests in current window
  remaining(): number {
    const now = Date.now();
    this.timestamps = this.timestamps.filter(t => now - t < this.config.windowMs);
    return Math.max(0, this.config.maxRequests - this.timestamps.length);
  }

  // Get ms until next request is available
  retryAfterMs(): number {
    if (this.canRequest()) return 0;
    const oldest = this.timestamps[0];
    return oldest + this.config.windowMs - Date.now();
  }
}

// Pre-configured limiters for external APIs
export const claudeLimiter = new RateLimiter({ maxRequests: 10, windowMs: 60_000 }); // 10/min
export const groqLimiter = new RateLimiter({ maxRequests: 20, windowMs: 60_000 });   // 20/min
