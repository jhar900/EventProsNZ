import { NextRequest } from 'next/server';

interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Maximum requests per window
  keyGenerator: (request: NextRequest) => string; // Function to generate rate limit key
}

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

// In-memory store for rate limiting (in production, use Redis or similar)
const rateLimitStore = new Map<string, RateLimitEntry>();

export class RateLimiter {
  private config: RateLimitConfig;

  constructor(config: RateLimitConfig) {
    this.config = config;
  }

  async checkLimit(
    request: NextRequest
  ): Promise<{ allowed: boolean; remaining: number; resetTime: number }> {
    const key = this.config.keyGenerator(request);
    const now = Date.now();
    const windowStart = now - this.config.windowMs;

    // Clean up expired entries
    for (const [storeKey, entry] of rateLimitStore.entries()) {
      if (entry.resetTime < now) {
        rateLimitStore.delete(storeKey);
      }
    }

    // Get or create entry for this key
    let entry = rateLimitStore.get(key);
    if (!entry || entry.resetTime < now) {
      entry = {
        count: 0,
        resetTime: now + this.config.windowMs,
      };
    }

    // Check if limit is exceeded
    if (entry.count >= this.config.maxRequests) {
      return {
        allowed: false,
        remaining: 0,
        resetTime: entry.resetTime,
      };
    }

    // Increment count
    entry.count++;
    rateLimitStore.set(key, entry);

    return {
      allowed: true,
      remaining: this.config.maxRequests - entry.count,
      resetTime: entry.resetTime,
    };
  }
}

// Pre-configured rate limiters
export const uploadRateLimiter = new RateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 10, // 10 uploads per 15 minutes
  keyGenerator: (request: NextRequest) => {
    // Use IP address for rate limiting
    const ip =
      request.ip ||
      (request.headers ? request.headers.get('x-forwarded-for') : null) ||
      'unknown';
    return `upload:${ip}`;
  },
});

export const userUploadRateLimiter = new RateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  maxRequests: 50, // 50 uploads per hour per user
  keyGenerator: (request: NextRequest) => {
    // Use user ID from auth header
    const authHeader = request.headers
      ? request.headers.get('authorization')
      : null;
    const userId = authHeader ? 'authenticated' : 'anonymous';
    return `user_upload:${userId}`;
  },
});

export const apiRateLimiter = new RateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 100, // 100 API calls per 15 minutes
  keyGenerator: (request: NextRequest) => {
    const ip =
      request.ip ||
      (request.headers ? request.headers.get('x-forwarded-for') : null) ||
      'unknown';
    return `api:${ip}`;
  },
});

// Additional rate limiters for specific use cases
export const paymentRateLimiter = new RateLimiter({
  windowMs: 5 * 60 * 1000, // 5 minutes
  maxRequests: 20, // 20 payment requests per 5 minutes
  keyGenerator: (request: NextRequest) => {
    const ip =
      request.ip ||
      (request.headers ? request.headers.get('x-forwarded-for') : null) ||
      'unknown';
    return `payment:${ip}`;
  },
});

export const subscriptionRateLimiter = new RateLimiter({
  windowMs: 10 * 60 * 1000, // 10 minutes
  maxRequests: 15, // 15 subscription requests per 10 minutes
  keyGenerator: (request: NextRequest) => {
    const ip =
      request.ip ||
      (request.headers ? request.headers.get('x-forwarded-for') : null) ||
      'unknown';
    return `subscription:${ip}`;
  },
});

export const analyticsRateLimit = new RateLimiter({
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 100, // 100 analytics requests per minute
  keyGenerator: (request: NextRequest) => {
    const ip =
      request.ip ||
      (request.headers ? request.headers.get('x-forwarded-for') : null) ||
      'unknown';
    return `analytics:${ip}`;
  },
});

export const jobCreationRateLimiter = new RateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  maxRequests: 5, // 5 job postings per hour per user
  keyGenerator: (request: NextRequest) => {
    // Use IP address for rate limiting (in production, use user ID from auth)
    const ip =
      request.ip ||
      (request.headers ? request.headers.get('x-forwarded-for') : null) ||
      'unknown';
    return `job_creation:${ip}`;
  },
});

export const testimonialRateLimiter = new RateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  maxRequests: 3, // 3 testimonial submissions per hour per user
  keyGenerator: (request: NextRequest) => {
    // Use IP address for rate limiting (in production, use user ID from auth)
    const ip =
      request.ip ||
      (request.headers ? request.headers.get('x-forwarded-for') : null) ||
      'unknown';
    return `testimonial:${ip}`;
  },
});

// Generic rate limiter for general API use
export const rateLimit = new RateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 100, // 100 requests per 15 minutes
  keyGenerator: (request: NextRequest) => {
    const ip =
      request.ip ||
      (request.headers ? request.headers.get('x-forwarded-for') : null) ||
      'unknown';
    return `api:${ip}`;
  },
});

// Helper function to apply rate limiting to API routes
export async function applyRateLimit(
  request: NextRequest,
  rateLimiter: RateLimiter
): Promise<{ allowed: boolean; response?: Response }> {
  try {
    const result = await rateLimiter.checkLimit(request);

    if (!result.allowed) {
      const response = new Response(
        JSON.stringify({
          error: 'Rate limit exceeded',
          retryAfter: Math.ceil((result.resetTime - Date.now()) / 1000),
        }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'Retry-After': Math.ceil(
              (result.resetTime - Date.now()) / 1000
            ).toString(),
            'X-RateLimit-Limit': rateLimiter['config'].maxRequests.toString(),
            'X-RateLimit-Remaining': result.remaining.toString(),
            'X-RateLimit-Reset': result.resetTime.toString(),
          },
        }
      );

      return { allowed: false, response };
    }

    return { allowed: true };
  } catch (error) {
    console.error('Rate limiting error:', error);
    // Allow request to proceed if rate limiting fails
    return { allowed: true };
  }
}

// Higher-order function for rate limiting middleware
export function withRateLimit(rateLimiter: RateLimiter) {
  return function (handler: (request: NextRequest) => Promise<Response>) {
    return async (request: NextRequest) => {
      const rateLimitResult = await applyRateLimit(request, rateLimiter);

      if (!rateLimitResult.allowed) {
        return rateLimitResult.response!;
      }

      return await handler(request);
    };
  };
}
