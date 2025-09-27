import { NextRequest, NextResponse } from 'next/server';

interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
  keyGenerator?: (req: NextRequest) => string;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
}

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

// In-memory store for rate limiting (in production, use Redis)
const store: RateLimitStore = {};

/**
 * Rate limiting middleware for API endpoints
 * Provides protection against abuse and DoS attacks
 */
export class RateLimitService {
  private static configs: Map<string, RateLimitConfig> = new Map();

  /**
   * Configure rate limiting for a specific endpoint
   * @param endpoint - The endpoint identifier
   * @param config - Rate limiting configuration
   */
  static configure(endpoint: string, config: RateLimitConfig): void {
    this.configs.set(endpoint, config);
  }

  /**
   * Get rate limit configuration for an endpoint
   * @param endpoint - The endpoint identifier
   * @returns Rate limit configuration or default
   */
  static getConfig(endpoint: string): RateLimitConfig {
    return (
      this.configs.get(endpoint) || {
        windowMs: 15 * 60 * 1000, // 15 minutes
        maxRequests: 100,
        keyGenerator: (req: NextRequest) => {
          // Default key generator uses IP address
          const forwarded = req.headers.get('x-forwarded-for');
          const ip = forwarded ? forwarded.split(',')[0] : req.ip || 'unknown';
          return `${endpoint}:${ip}`;
        },
      }
    );
  }

  /**
   * Check if request is within rate limit
   * @param req - NextRequest object
   * @param endpoint - The endpoint identifier
   * @returns Rate limit result
   */
  static checkRateLimit(
    req: NextRequest,
    endpoint: string
  ): {
    allowed: boolean;
    remaining: number;
    resetTime: number;
    retryAfter?: number;
  } {
    const config = this.getConfig(endpoint);
    const key = config.keyGenerator
      ? config.keyGenerator(req)
      : `${endpoint}:${req.ip || 'unknown'}`;
    const now = Date.now();
    const windowMs = config.windowMs;

    // Get or create rate limit entry
    let entry = store[key];
    if (!entry || now > entry.resetTime) {
      entry = {
        count: 0,
        resetTime: now + windowMs,
      };
      store[key] = entry;
    }

    // Increment request count
    entry.count++;

    const remaining = Math.max(0, config.maxRequests - entry.count);
    const allowed = entry.count <= config.maxRequests;

    return {
      allowed,
      remaining,
      resetTime: entry.resetTime,
      retryAfter: !allowed
        ? Math.ceil((entry.resetTime - now) / 1000)
        : undefined,
    };
  }

  /**
   * Middleware wrapper for rate limiting
   * @param endpoint - The endpoint identifier
   * @param handler - The API handler function
   * @returns Wrapped handler with rate limiting
   */
  static withRateLimit(
    endpoint: string,
    handler: (req: NextRequest, context: any) => Promise<Response>
  ) {
    return async (req: NextRequest, context: any) => {
      const rateLimitResult = this.checkRateLimit(req, endpoint);

      // Add rate limit headers
      const response = await handler(req, context);
      const responseWithHeaders = new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers: {
          ...response.headers,
          'X-RateLimit-Limit': this.getConfig(endpoint).maxRequests.toString(),
          'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
          'X-RateLimit-Reset': new Date(
            rateLimitResult.resetTime
          ).toISOString(),
        },
      });

      if (!rateLimitResult.allowed) {
        return new Response(
          JSON.stringify({
            success: false,
            message: 'Too many requests',
            retryAfter: rateLimitResult.retryAfter,
          }),
          {
            status: 429,
            headers: {
              'Content-Type': 'application/json',
              'Retry-After': rateLimitResult.retryAfter?.toString() || '60',
              'X-RateLimit-Limit':
                this.getConfig(endpoint).maxRequests.toString(),
              'X-RateLimit-Remaining': '0',
              'X-RateLimit-Reset': new Date(
                rateLimitResult.resetTime
              ).toISOString(),
            },
          }
        );
      }

      return responseWithHeaders;
    };
  }

  /**
   * Clean up expired entries from the store
   * Should be called periodically in production
   */
  static cleanup(): void {
    const now = Date.now();
    Object.keys(store).forEach(key => {
      if (now > store[key].resetTime) {
        delete store[key];
      }
    });
  }
}

// Pre-configured rate limits for different endpoint types
export const rateLimits = {
  // General API endpoints
  general: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 100,
  },

  // Authentication endpoints (more restrictive)
  auth: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 10,
  },

  // Event management endpoints
  events: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 50,
  },

  // Dashboard endpoints (more restrictive due to complexity)
  dashboard: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 20,
  },

  // Search endpoints
  search: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 30,
  },

  // File upload endpoints
  upload: {
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 10,
  },
};

// Configure rate limits
Object.entries(rateLimits).forEach(([endpoint, config]) => {
  RateLimitService.configure(endpoint, config);
});

/**
 * Utility function to create rate-limited handler
 * @param endpoint - The endpoint identifier
 * @param handler - The API handler function
 * @returns Rate-limited handler
 */
export function withRateLimit(
  endpoint: string,
  handler: (req: NextRequest, context: any) => Promise<Response>
) {
  return RateLimitService.withRateLimit(endpoint, handler);
}
