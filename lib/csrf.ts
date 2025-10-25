import { NextRequest } from 'next/server';
import { randomBytes } from 'crypto';

interface CSRFToken {
  token: string;
  expires: number;
}

// In-memory store for CSRF tokens (in production, use Redis or similar)
const csrfTokens = new Map<string, CSRFToken>();

const CSRF_TOKEN_EXPIRY = 60 * 60 * 1000; // 1 hour

export function generateCSRFToken(): string {
  return randomBytes(32).toString('hex');
}

export function createCSRFToken(sessionId: string): string {
  const token = generateCSRFToken();
  const expires = Date.now() + CSRF_TOKEN_EXPIRY;

  csrfTokens.set(sessionId, {
    token,
    expires,
  });

  return token;
}

export function validateCSRFToken(sessionId: string, token: string): boolean {
  const storedToken = csrfTokens.get(sessionId);

  if (!storedToken) {
    return false;
  }

  if (storedToken.expires < Date.now()) {
    csrfTokens.delete(sessionId);
    return false;
  }

  return storedToken.token === token;
}

export function getCSRFTokenFromRequest(request: NextRequest): string | null {
  // Try to get token from header first
  const headerToken = request.headers.get('x-csrf-token');
  if (headerToken) {
    return headerToken;
  }

  // Try to get token from form data
  const contentType = request.headers.get('content-type');
  if (contentType?.includes('application/x-www-form-urlencoded')) {
    // For form submissions, we'd need to parse the body
    // This is a simplified version
    return null;
  }

  return null;
}

export function getSessionIdFromRequest(request: NextRequest): string {
  // Try to get session ID from various sources
  const sessionCookie = request.cookies.get('session-id');
  if (sessionCookie) {
    return sessionCookie.value;
  }

  // Fallback to IP-based session (less secure but better than nothing)
  const forwarded = request.headers.get('x-forwarded-for');
  const realIP = request.headers.get('x-real-ip');
  const cfConnectingIP = request.headers.get('cf-connecting-ip');

  const ip =
    forwarded?.split(',')[0].trim() ||
    realIP ||
    cfConnectingIP ||
    request.ip ||
    'unknown';

  return `ip:${ip}`;
}

// Clean up expired tokens periodically
export function cleanupExpiredTokens(): void {
  const now = Date.now();
  for (const [sessionId, token] of csrfTokens.entries()) {
    if (token.expires < now) {
      csrfTokens.delete(sessionId);
    }
  }
}

// Run cleanup every 5 minutes
setInterval(cleanupExpiredTokens, 5 * 60 * 1000);
