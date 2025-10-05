import { NextRequest } from 'next/server';
import { createHash, randomBytes } from 'crypto';

export interface CSRFConfig {
  secret: string;
  tokenLength: number;
  maxAge: number; // in milliseconds
}

export class CSRFProtection {
  private config: CSRFConfig;

  constructor(config?: Partial<CSRFConfig>) {
    this.config = {
      secret: process.env.CSRF_SECRET || 'default-csrf-secret',
      tokenLength: 32,
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      ...config,
    };
  }

  generateToken(sessionId: string): string {
    const timestamp = Date.now().toString();
    const random = randomBytes(this.config.tokenLength).toString('hex');
    const data = `${sessionId}:${timestamp}:${random}`;

    const hash = createHash('sha256')
      .update(data + this.config.secret)
      .digest('hex');

    return `${data}:${hash}`;
  }

  validateToken(token: string, sessionId: string): boolean {
    try {
      const parts = token.split(':');
      if (parts.length !== 4) {
        return false;
      }

      const [tokenSessionId, timestamp, random, hash] = parts;

      // Check if session ID matches
      if (tokenSessionId !== sessionId) {
        return false;
      }

      // Check if token is expired
      const tokenTime = parseInt(timestamp);
      const now = Date.now();
      if (now - tokenTime > this.config.maxAge) {
        return false;
      }

      // Verify hash
      const data = `${sessionId}:${timestamp}:${random}`;
      const expectedHash = createHash('sha256')
        .update(data + this.config.secret)
        .digest('hex');

      return hash === expectedHash;
    } catch (error) {
      console.error('CSRF token validation error:', error);
      return false;
    }
  }

  extractSessionId(request: NextRequest): string {
    // Try to get session ID from various sources
    const cookieHeader = request.headers.get('cookie');
    if (cookieHeader) {
      const sessionMatch = cookieHeader.match(/session=([^;]+)/);
      if (sessionMatch) {
        return sessionMatch[1];
      }
    }

    // Fallback to user ID from auth header or other sources
    const authHeader = request.headers.get('authorization');
    if (authHeader) {
      // Extract user ID from JWT or other auth token
      // This is a simplified example - in practice, you'd decode the JWT
      return authHeader.substring(7); // Remove 'Bearer ' prefix
    }

    return '';
  }

  validateRequest(request: NextRequest): boolean {
    const sessionId = this.extractSessionId(request);
    if (!sessionId) {
      return false;
    }

    // Get CSRF token from header
    const csrfToken = request.headers.get('x-csrf-token');
    if (!csrfToken) {
      return false;
    }

    return this.validateToken(csrfToken, sessionId);
  }

  getCSRFHeaders(sessionId: string): Record<string, string> {
    const token = this.generateToken(sessionId);
    return {
      'X-CSRF-Token': token,
    };
  }
}

// Middleware function for CSRF protection
export function withCSRFProtection(handler: Function) {
  return async (request: NextRequest, ...args: any[]) => {
    // Skip CSRF protection for GET requests
    if (request.method === 'GET') {
      return handler(request, ...args);
    }

    const csrfProtection = new CSRFProtection();

    if (!csrfProtection.validateRequest(request)) {
      return new Response(
        JSON.stringify({ error: 'CSRF token validation failed' }),
        {
          status: 403,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    return handler(request, ...args);
  };
}
