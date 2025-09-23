import { NextRequest, NextResponse } from 'next/server';

interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Maximum requests per window
  message?: string;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
}

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

// In-memory store for rate limiting (in production, use Redis or similar)
const store: RateLimitStore = {};

// Clean up expired entries periodically
setInterval(() => {
  const now = Date.now();
  Object.keys(store).forEach(key => {
    if (store[key].resetTime < now) {
      delete store[key];
    }
  });
}, 60000); // Clean up every minute

export function createRateLimit(config: RateLimitConfig) {
  return function rateLimit(req: NextRequest): NextResponse | null {
    const identifier = getIdentifier(req);
    const now = Date.now();
    const windowStart = now - config.windowMs;

    // Initialize or get existing entry
    if (!store[identifier] || store[identifier].resetTime < now) {
      store[identifier] = {
        count: 0,
        resetTime: now + config.windowMs,
      };
    }

    // Increment request count
    store[identifier].count++;

    // Check if limit exceeded
    if (store[identifier].count > config.maxRequests) {
      const response = NextResponse.json(
        {
          error: config.message || 'Too many requests',
          retryAfter: Math.ceil((store[identifier].resetTime - now) / 1000),
        },
        { status: 429 }
      );

      // Add rate limit headers
      response.headers.set('X-RateLimit-Limit', config.maxRequests.toString());
      response.headers.set('X-RateLimit-Remaining', '0');
      response.headers.set(
        'X-RateLimit-Reset',
        store[identifier].resetTime.toString()
      );
      response.headers.set(
        'Retry-After',
        Math.ceil((store[identifier].resetTime - now) / 1000).toString()
      );

      return response;
    }

    // Add rate limit headers for successful requests
    const remaining = Math.max(0, config.maxRequests - store[identifier].count);
    const response = NextResponse.next();
    response.headers.set('X-RateLimit-Limit', config.maxRequests.toString());
    response.headers.set('X-RateLimit-Remaining', remaining.toString());
    response.headers.set(
      'X-RateLimit-Reset',
      store[identifier].resetTime.toString()
    );

    return response;
  };
}

function getIdentifier(req: NextRequest): string {
  // Use IP address as primary identifier
  const ip =
    req.ip ||
    req.headers.get('x-forwarded-for') ||
    req.headers.get('x-real-ip') ||
    'unknown';

  // For authenticated users, you might want to use user ID instead
  const userId = req.headers.get('x-user-id');

  return userId ? `user:${userId}` : `ip:${ip}`;
}

// Predefined rate limit configurations
export const rateLimitConfigs = {
  // Strict limits for analytics endpoints
  analytics: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 100, // 100 requests per 15 minutes
    message: 'Analytics API rate limit exceeded. Please try again later.',
  },

  // Moderate limits for search endpoints
  search: {
    windowMs: 5 * 60 * 1000, // 5 minutes
    maxRequests: 200, // 200 requests per 5 minutes
    message: 'Search API rate limit exceeded. Please try again later.',
  },

  // Lenient limits for general API endpoints
  general: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 1000, // 1000 requests per 15 minutes
    message: 'API rate limit exceeded. Please try again later.',
  },

  // Very strict limits for admin endpoints
  admin: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 50, // 50 requests per 15 minutes
    message: 'Admin API rate limit exceeded. Please try again later.',
  },

  // Limits for tracking endpoints (higher volume expected)
  tracking: {
    windowMs: 1 * 60 * 1000, // 1 minute
    maxRequests: 500, // 500 requests per minute
    message: 'Tracking API rate limit exceeded. Please try again later.',
  },
};

// Convenience functions for common rate limits
export const analyticsRateLimit = createRateLimit(rateLimitConfigs.analytics);
export const searchRateLimit = createRateLimit(rateLimitConfigs.search);
export const generalRateLimit = createRateLimit(rateLimitConfigs.general);
export const adminRateLimit = createRateLimit(rateLimitConfigs.admin);
export const trackingRateLimit = createRateLimit(rateLimitConfigs.tracking);

// Middleware function for Next.js API routes
export function withRateLimit(
  rateLimitFn: (req: NextRequest) => NextResponse | null
) {
  return function rateLimitMiddleware(
    handler: (req: NextRequest) => Promise<NextResponse>
  ) {
    return async function (req: NextRequest): Promise<NextResponse> {
      const rateLimitResponse = rateLimitFn(req);

      if (rateLimitResponse) {
        return rateLimitResponse;
      }

      return handler(req);
    };
  };
}

// Utility function to check rate limit status without blocking
export function checkRateLimit(
  req: NextRequest,
  config: RateLimitConfig
): {
  allowed: boolean;
  remaining: number;
  resetTime: number;
} {
  const identifier = getIdentifier(req);
  const now = Date.now();

  if (!store[identifier] || store[identifier].resetTime < now) {
    return {
      allowed: true,
      remaining: config.maxRequests,
      resetTime: now + config.windowMs,
    };
  }

  const remaining = Math.max(0, config.maxRequests - store[identifier].count);

  return {
    allowed: store[identifier].count <= config.maxRequests,
    remaining,
    resetTime: store[identifier].resetTime,
  };
}
