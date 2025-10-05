import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '../supabase/client';

interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
  message: string;
}

const RATE_LIMIT_CONFIG: RateLimitConfig = {
  windowMs: 60 * 60 * 1000, // 1 hour
  maxRequests: 10, // 10 inquiries per hour per user
  message: 'Too many inquiries sent. Please try again later.',
};

const RATE_LIMIT_STORAGE = new Map<
  string,
  { count: number; resetTime: number }
>();

export async function checkInquiryRateLimit(
  request: NextRequest,
  userId: string
): Promise<NextResponse | null> {
  const now = Date.now();
  const windowStart = now - RATE_LIMIT_CONFIG.windowMs;

  // Clean up expired entries
  for (const [key, value] of RATE_LIMIT_STORAGE.entries()) {
    if (value.resetTime < now) {
      RATE_LIMIT_STORAGE.delete(key);
    }
  }

  const rateLimitKey = `inquiry:${userId}`;
  const current = RATE_LIMIT_STORAGE.get(rateLimitKey);

  if (!current) {
    RATE_LIMIT_STORAGE.set(rateLimitKey, {
      count: 1,
      resetTime: now + RATE_LIMIT_CONFIG.windowMs,
    });
    return null;
  }

  if (current.resetTime < now) {
    // Reset the counter
    RATE_LIMIT_STORAGE.set(rateLimitKey, {
      count: 1,
      resetTime: now + RATE_LIMIT_CONFIG.windowMs,
    });
    return null;
  }

  if (current.count >= RATE_LIMIT_CONFIG.maxRequests) {
    const retryAfter = Math.ceil((current.resetTime - now) / 1000);

    return NextResponse.json(
      {
        success: false,
        message: RATE_LIMIT_CONFIG.message,
        retryAfter,
      },
      {
        status: 429,
        headers: {
          'Retry-After': retryAfter.toString(),
          'X-RateLimit-Limit': RATE_LIMIT_CONFIG.maxRequests.toString(),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': new Date(current.resetTime).toISOString(),
        },
      }
    );
  }

  // Increment the counter
  current.count++;
  RATE_LIMIT_STORAGE.set(rateLimitKey, current);

  return null;
}

export function sanitizeInquiryInput(input: any): any {
  if (typeof input !== 'object' || input === null) {
    return input;
  }

  const sanitized: any = {};

  for (const [key, value] of Object.entries(input)) {
    if (typeof value === 'string') {
      // Remove potentially dangerous characters and limit length
      sanitized[key] = value
        .replace(/[<>]/g, '') // Remove < and > to prevent XSS
        .replace(/javascript:/gi, '') // Remove javascript: protocol
        .replace(/on\w+=/gi, '') // Remove event handlers
        .trim()
        .substring(0, 2000); // Limit to 2000 characters
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeInquiryInput(value);
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized;
}

export function validateInquiryInput(input: any): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!input.contractor_id || typeof input.contractor_id !== 'string') {
    errors.push('Contractor ID is required and must be a string');
  }

  if (
    !input.subject ||
    typeof input.subject !== 'string' ||
    input.subject.trim().length === 0
  ) {
    errors.push('Subject is required and cannot be empty');
  } else if (input.subject.length > 200) {
    errors.push('Subject must be 200 characters or less');
  }

  if (
    !input.message ||
    typeof input.message !== 'string' ||
    input.message.trim().length === 0
  ) {
    errors.push('Message is required and cannot be empty');
  } else if (input.message.length > 2000) {
    errors.push('Message must be 2000 characters or less');
  }

  if (
    input.inquiry_type &&
    !['general', 'quote_request', 'availability', 'custom'].includes(
      input.inquiry_type
    )
  ) {
    errors.push('Invalid inquiry type');
  }

  if (
    input.priority &&
    !['low', 'medium', 'high', 'urgent'].includes(input.priority)
  ) {
    errors.push('Invalid priority level');
  }

  if (input.event_details && typeof input.event_details === 'object') {
    if (input.event_details.event_date) {
      const eventDate = new Date(input.event_details.event_date);
      if (isNaN(eventDate.getTime())) {
        errors.push('Invalid event date format');
      } else if (eventDate < new Date()) {
        errors.push('Event date cannot be in the past');
      }
    }

    if (
      input.event_details.budget_total &&
      (typeof input.event_details.budget_total !== 'number' ||
        input.event_details.budget_total < 0)
    ) {
      errors.push('Budget total must be a positive number');
    }

    if (
      input.event_details.attendee_count &&
      (typeof input.event_details.attendee_count !== 'number' ||
        input.event_details.attendee_count < 0)
    ) {
      errors.push('Attendee count must be a positive number');
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

export async function addSecurityHeaders(
  response: NextResponse
): Promise<NextResponse> {
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'"
  );

  return response;
}
