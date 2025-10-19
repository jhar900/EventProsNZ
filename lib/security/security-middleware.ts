import { NextRequest, NextResponse } from 'next/server';
import { withRateLimit, crmRateLimiter } from './rate-limiting';
import { withCSRFProtection } from './csrf-protection';
import {
  InputSanitizer,
  textSanitizer,
  htmlSanitizer,
} from './input-sanitization';

export interface SecurityConfig {
  enableRateLimit: boolean;
  enableCSRF: boolean;
  enableInputSanitization: boolean;
  enableCORS: boolean;
  allowedOrigins: string[];
  maxRequestSize: number; // in bytes
}

const defaultConfig: SecurityConfig = {
  enableRateLimit: true,
  enableCSRF: true,
  enableInputSanitization: true,
  enableCORS: true,
  allowedOrigins: ['http://localhost:3000', 'https://eventpros.co.nz'],
  maxRequestSize: 10 * 1024 * 1024, // 10MB
};

export class SecurityMiddleware {
  private config: SecurityConfig;
  private sanitizer: InputSanitizer;

  constructor(config: Partial<SecurityConfig> = {}) {
    this.config = { ...defaultConfig, ...config };
    this.sanitizer = new InputSanitizer();
  }

  async applySecurity(
    req: NextRequest,
    handler: () => Promise<Response>
  ): Promise<Response> {
    try {
      // 1. CORS handling
      if (this.config.enableCORS) {
        const corsResponse = this.handleCORS(req);
        if (corsResponse) {
          return corsResponse;
        }
      }

      // 2. Request size validation
      const sizeResponse = this.validateRequestSize(req);
      if (sizeResponse) {
        return sizeResponse;
      }

      // 3. Rate limiting
      if (this.config.enableRateLimit) {
        const rateLimitResponse = await this.applyRateLimit(req, handler);
        if (rateLimitResponse) {
          return rateLimitResponse;
        }
      }

      // 4. CSRF protection
      if (this.config.enableCSRF) {
        const csrfResponse = await this.applyCSRFProtection(req, handler);
        if (csrfResponse) {
          return csrfResponse;
        }
      }

      // 5. Input sanitization
      if (this.config.enableInputSanitization) {
        const sanitizedReq = await this.sanitizeRequest(req);
        return handler();
      }

      return handler();
    } catch (error) {
      console.error('Security middleware error:', error);
      return new NextResponse(
        JSON.stringify({
          success: false,
          message: 'Security validation failed',
        }),
        {
          status: 500,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
    }
  }

  private handleCORS(req: NextRequest): NextResponse | null {
    const origin = req.headers.get('origin');

    if (origin && !this.config.allowedOrigins.includes(origin)) {
      return new NextResponse(
        JSON.stringify({
          success: false,
          message: 'CORS policy violation',
        }),
        {
          status: 403,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': this.config.allowedOrigins[0],
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
            'Access-Control-Allow-Headers':
              'Content-Type, Authorization, X-CSRF-Token',
            'Access-Control-Allow-Credentials': 'true',
          },
        }
      );
    }

    return null;
  }

  private validateRequestSize(req: NextRequest): NextResponse | null {
    const contentLength = req.headers.get('content-length');

    if (contentLength && parseInt(contentLength) > this.config.maxRequestSize) {
      return new NextResponse(
        JSON.stringify({
          success: false,
          message: 'Request too large',
        }),
        {
          status: 413,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
    }

    return null;
  }

  private async applyRateLimit(
    req: NextRequest,
    handler: () => Promise<Response>
  ): Promise<Response | null> {
    try {
      return await withRateLimit(crmRateLimiter, req, handler);
    } catch (error) {
      console.error('Rate limiting error:', error);
      return new NextResponse(
        JSON.stringify({
          success: false,
          message: 'Rate limit validation failed',
        }),
        {
          status: 500,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
    }
  }

  private async applyCSRFProtection(
    req: NextRequest,
    handler: () => Promise<Response>
  ): Promise<Response | null> {
    try {
      return await withCSRFProtection(req, handler);
    } catch (error) {
      console.error('CSRF protection error:', error);
      return new NextResponse(
        JSON.stringify({
          success: false,
          message: 'CSRF validation failed',
        }),
        {
          status: 500,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
    }
  }

  private async sanitizeRequest(req: NextRequest): Promise<NextRequest> {
    // This is a simplified version - in practice, you'd need to
    // create a new request object with sanitized data
    return req;
  }
}

// Predefined security configurations
export const crmSecurityConfig: SecurityConfig = {
  enableRateLimit: true,
  enableCSRF: true,
  enableInputSanitization: true,
  enableCORS: true,
  allowedOrigins: ['http://localhost:3000', 'https://eventpros.co.nz'],
  maxRequestSize: 5 * 1024 * 1024, // 5MB for CRM operations
};

export const authSecurityConfig: SecurityConfig = {
  enableRateLimit: true,
  enableCSRF: false, // CSRF not needed for auth endpoints
  enableInputSanitization: true,
  enableCORS: true,
  allowedOrigins: ['http://localhost:3000', 'https://eventpros.co.nz'],
  maxRequestSize: 1024, // 1KB for auth requests
};

export const publicSecurityConfig: SecurityConfig = {
  enableRateLimit: true,
  enableCSRF: false,
  enableInputSanitization: true,
  enableCORS: true,
  allowedOrigins: ['*'],
  maxRequestSize: 10 * 1024 * 1024, // 10MB for public endpoints
};

// Convenience function for applying security
export async function withSecurity(
  req: NextRequest,
  handler: () => Promise<Response>,
  config: Partial<SecurityConfig> = {}
): Promise<Response> {
  const securityMiddleware = new SecurityMiddleware(config);
  return securityMiddleware.applySecurity(req, handler);
}
