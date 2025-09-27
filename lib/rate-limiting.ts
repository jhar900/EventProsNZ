/**
 * Rate Limiting Service
 * Rate limiting for subscription endpoints
 */

import { NextRequest } from 'next/server';

interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
  message?: string;
}

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

// In-memory store for rate limiting (in production, use Redis)
const rateLimitStore = new Map<string, RateLimitEntry>();

export class RateLimiter {
  private config: RateLimitConfig;

  constructor(config: RateLimitConfig) {
    this.config = config;
  }

  /**
   * Check if request is within rate limit
   */
  isAllowed(identifier: string): {
    allowed: boolean;
    remaining: number;
    resetTime: number;
  } {
    const now = Date.now();
    const windowMs = this.config.windowMs;
    const maxRequests = this.config.maxRequests;

    // Get or create rate limit entry
    let entry = rateLimitStore.get(identifier);

    if (!entry || now > entry.resetTime) {
      // Create new entry or reset expired entry
      entry = {
        count: 0,
        resetTime: now + windowMs,
      };
      rateLimitStore.set(identifier, entry);
    }

    // Check if limit exceeded
    if (entry.count >= maxRequests) {
      return {
        allowed: false,
        remaining: 0,
        resetTime: entry.resetTime,
      };
    }

    // Increment counter
    entry.count++;
    rateLimitStore.set(identifier, entry);

    return {
      allowed: true,
      remaining: maxRequests - entry.count,
      resetTime: entry.resetTime,
    };
  }

  /**
   * Get rate limit headers
   */
  getHeaders(remaining: number, resetTime: number): Record<string, string> {
    return {
      'X-RateLimit-Limit': this.config.maxRequests.toString(),
      'X-RateLimit-Remaining': remaining.toString(),
      'X-RateLimit-Reset': Math.ceil(resetTime / 1000).toString(),
    };
  }
}

// Pre-configured rate limiters
export const subscriptionRateLimiter = new RateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 100, // 100 requests per 15 minutes
  message: 'Too many subscription requests',
});

export const paymentRateLimiter = new RateLimiter({
  windowMs: 5 * 60 * 1000, // 5 minutes
  maxRequests: 10, // 10 payment requests per 5 minutes
  message: 'Too many payment requests',
});

export const webhookRateLimiter = new RateLimiter({
  windowMs: 1 * 60 * 1000, // 1 minute
  maxRequests: 50, // 50 webhook requests per minute
  message: 'Too many webhook requests',
});

/**
 * Rate limiting middleware
 */
export function rateLimit(
  request: NextRequest,
  rateLimiter: RateLimiter,
  getIdentifier?: (req: NextRequest) => string
): { allowed: boolean; headers: Record<string, string>; message?: string } {
  // Get identifier (IP address by default)
  const identifier = getIdentifier
    ? getIdentifier(request)
    : getClientIP(request);

  const result = rateLimiter.isAllowed(identifier);
  const headers = rateLimiter.getHeaders(result.remaining, result.resetTime);

  if (!result.allowed) {
    return {
      allowed: false,
      headers,
      message: rateLimiter.config.message || 'Rate limit exceeded',
    };
  }

  return {
    allowed: true,
    headers,
  };
}

/**
 * Get client IP address
 */
function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const realIP = request.headers.get('x-real-ip');

  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }

  if (realIP) {
    return realIP;
  }

  return 'unknown';
}

/**
 * Clean up expired rate limit entries
 */
export function cleanupRateLimitStore(): void {
  const now = Date.now();

  for (const [key, entry] of rateLimitStore.entries()) {
    if (now > entry.resetTime) {
      rateLimitStore.delete(key);
    }
  }
}

// Clean up every 5 minutes
setInterval(cleanupRateLimitStore, 5 * 60 * 1000);
