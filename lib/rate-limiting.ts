import { NextRequest } from 'next/server';

interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Maximum requests per window
}

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

// In-memory store for rate limiting (in production, use Redis or similar)
const rateLimitStore = new Map<string, RateLimitEntry>();

const defaultConfig: RateLimitConfig = {
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 5, // 5 requests per minute
};

export function createRateLimit(config: Partial<RateLimitConfig> = {}) {
  const finalConfig = { ...defaultConfig, ...config };

  return async (
    request: NextRequest
  ): Promise<{ allowed: boolean; remaining: number; resetTime: number }> => {
    const ip = getClientIP(request);
    const now = Date.now();
    const windowStart = now - finalConfig.windowMs;

    // Clean up expired entries
    for (const [key, entry] of rateLimitStore.entries()) {
      if (entry.resetTime < now) {
        rateLimitStore.delete(key);
      }
    }

    const key = `rate_limit:${ip}`;
    const entry = rateLimitStore.get(key);

    if (!entry || entry.resetTime < now) {
      // New window or expired entry
      const newEntry: RateLimitEntry = {
        count: 1,
        resetTime: now + finalConfig.windowMs,
      };
      rateLimitStore.set(key, newEntry);

      return {
        allowed: true,
        remaining: finalConfig.maxRequests - 1,
        resetTime: newEntry.resetTime,
      };
    }

    if (entry.count >= finalConfig.maxRequests) {
      // Rate limit exceeded
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
      remaining: finalConfig.maxRequests - entry.count,
      resetTime: entry.resetTime,
    };
  };
}

function getClientIP(request: NextRequest): string {
  // Try various headers that might contain the real IP
  const forwarded = request.headers.get('x-forwarded-for');
  const realIP = request.headers.get('x-real-ip');
  const cfConnectingIP = request.headers.get('cf-connecting-ip');

  if (forwarded) {
    // x-forwarded-for can contain multiple IPs, take the first one
    return forwarded.split(',')[0].trim();
  }

  if (realIP) {
    return realIP;
  }

  if (cfConnectingIP) {
    return cfConnectingIP;
  }

  // Fallback to connection remote address
  return request.ip || 'unknown';
}

export const contactFormRateLimit = createRateLimit({
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 5, // 5 requests per minute per IP
});

export const newsletterRateLimit = createRateLimit({
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 3, // 3 requests per minute per IP
});

// Additional rate limiters for different endpoints
export const rateLimit = createRateLimit({
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 10, // 10 requests per minute per IP
});

export const withRateLimit = createRateLimit({
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 5, // 5 requests per minute per IP
});

export const applyRateLimit = createRateLimit({
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 5, // 5 requests per minute per IP
});

export const analyticsRateLimit = createRateLimit({
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 20, // 20 requests per minute per IP
});

export const uploadRateLimiter = createRateLimit({
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 3, // 3 uploads per minute per IP
});

export const userUploadRateLimiter = createRateLimit({
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 5, // 5 uploads per minute per IP
});

export const paymentRateLimiter = createRateLimit({
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 5, // 5 payment requests per minute per IP
});

export const subscriptionRateLimiter = createRateLimit({
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 3, // 3 subscription requests per minute per IP
});

export const testimonialRateLimiter = createRateLimit({
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 2, // 2 testimonial requests per minute per IP
});
