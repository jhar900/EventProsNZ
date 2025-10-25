import { NextRequest, NextResponse } from 'next/server';

export interface SecurityHeadersConfig {
  enableHSTS: boolean;
  enableCSP: boolean;
  enableXFrameOptions: boolean;
  enableXContentTypeOptions: boolean;
  enableReferrerPolicy: boolean;
  enablePermissionsPolicy: boolean;
  hstsMaxAge: number;
  cspDirectives: string[];
  frameOptions: 'DENY' | 'SAMEORIGIN' | 'ALLOW-FROM';
  referrerPolicy:
    | 'no-referrer'
    | 'no-referrer-when-downgrade'
    | 'origin'
    | 'origin-when-cross-origin'
    | 'same-origin'
    | 'strict-origin'
    | 'strict-origin-when-cross-origin'
    | 'unsafe-url';
}

export class SecurityHeadersService {
  private readonly config: SecurityHeadersConfig = {
    enableHSTS: true,
    enableCSP: true,
    enableXFrameOptions: true,
    enableXContentTypeOptions: true,
    enableReferrerPolicy: true,
    enablePermissionsPolicy: true,
    hstsMaxAge: 31536000, // 1 year
    cspDirectives: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: https:",
      "font-src 'self'",
      "connect-src 'self'",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ],
    frameOptions: 'SAMEORIGIN',
    referrerPolicy: 'strict-origin-when-cross-origin',
  };

  /**
   * Apply security headers to response
   */
  applySecurityHeaders(response: NextResponse): NextResponse {
    // HSTS (HTTP Strict Transport Security)
    if (this.config.enableHSTS) {
      response.headers.set(
        'Strict-Transport-Security',
        `max-age=${this.config.hstsMaxAge}; includeSubDomains; preload`
      );
    }

    // CSP (Content Security Policy)
    if (this.config.enableCSP) {
      response.headers.set(
        'Content-Security-Policy',
        this.config.cspDirectives.join('; ')
      );
    }

    // X-Frame-Options
    if (this.config.enableXFrameOptions) {
      response.headers.set('X-Frame-Options', this.config.frameOptions);
    }

    // X-Content-Type-Options
    if (this.config.enableXContentTypeOptions) {
      response.headers.set('X-Content-Type-Options', 'nosniff');
    }

    // Referrer Policy
    if (this.config.enableReferrerPolicy) {
      response.headers.set('Referrer-Policy', this.config.referrerPolicy);
    }

    // Permissions Policy
    if (this.config.enablePermissionsPolicy) {
      response.headers.set(
        'Permissions-Policy',
        'camera=(), microphone=(), geolocation=(), payment=(), usb=()'
      );
    }

    // Additional security headers
    response.headers.set('X-XSS-Protection', '1; mode=block');
    response.headers.set('X-DNS-Prefetch-Control', 'off');
    response.headers.set('X-Download-Options', 'noopen');
    response.headers.set('X-Permitted-Cross-Domain-Policies', 'none');

    return response;
  }

  /**
   * Apply security headers to request
   */
  applySecurityHeadersToRequest(req: NextRequest): NextRequest {
    // Add security headers to request for downstream processing
    const headers = new Headers(req.headers);

    // Add custom security headers
    headers.set('X-Security-Context', 'secure');
    headers.set('X-Request-ID', this.generateRequestId());

    return new NextRequest(req.url, {
      method: req.method,
      headers,
      body: req.body,
    });
  }

  /**
   * Validate HTTPS enforcement
   */
  validateHTTPS(req: NextRequest): {
    isHTTPS: boolean;
    shouldRedirect: boolean;
    redirectUrl?: string;
  } {
    const isHTTPS = req.nextUrl.protocol === 'https:';
    const shouldRedirect = !isHTTPS && process.env.NODE_ENV === 'production';

    if (shouldRedirect) {
      const redirectUrl = `https://${req.nextUrl.host}${req.nextUrl.pathname}${req.nextUrl.search}`;
      return { isHTTPS, shouldRedirect, redirectUrl };
    }

    return { isHTTPS, shouldRedirect: false };
  }

  /**
   * Create HTTPS redirect response
   */
  createHTTPSRedirect(redirectUrl: string): NextResponse {
    return NextResponse.redirect(redirectUrl, 301);
  }

  /**
   * Generate request ID for tracking
   */
  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Update CSP directives
   */
  updateCSPDirectives(directives: string[]): void {
    this.config.cspDirectives = directives;
  }

  /**
   * Add CSP directive
   */
  addCSPDirective(directive: string): void {
    if (!this.config.cspDirectives.includes(directive)) {
      this.config.cspDirectives.push(directive);
    }
  }

  /**
   * Remove CSP directive
   */
  removeCSPDirective(directive: string): void {
    this.config.cspDirectives = this.config.cspDirectives.filter(
      d => d !== directive
    );
  }

  /**
   * Get current security headers configuration
   */
  getSecurityHeadersConfig(): SecurityHeadersConfig {
    return { ...this.config };
  }

  /**
   * Test security headers
   */
  testSecurityHeaders(response: NextResponse): {
    headersPresent: string[];
    headersMissing: string[];
    score: number;
  } {
    const requiredHeaders = [
      'Strict-Transport-Security',
      'Content-Security-Policy',
      'X-Frame-Options',
      'X-Content-Type-Options',
      'Referrer-Policy',
      'X-XSS-Protection',
    ];

    const headersPresent: string[] = [];
    const headersMissing: string[] = [];

    for (const header of requiredHeaders) {
      if (response.headers.has(header)) {
        headersPresent.push(header);
      } else {
        headersMissing.push(header);
      }
    }

    const score = (headersPresent.length / requiredHeaders.length) * 100;

    return {
      headersPresent,
      headersMissing,
      score,
    };
  }

  /**
   * Create security headers middleware
   */
  createSecurityHeadersMiddleware() {
    return (req: NextRequest, res: NextResponse) => {
      // Apply security headers
      this.applySecurityHeaders(res);

      // Validate HTTPS
      const httpsValidation = this.validateHTTPS(req);
      if (httpsValidation.shouldRedirect && httpsValidation.redirectUrl) {
        return this.createHTTPSRedirect(httpsValidation.redirectUrl);
      }

      return res;
    };
  }

  /**
   * Monitor security headers compliance
   */
  async monitorSecurityHeaders(
    req: NextRequest,
    res: NextResponse
  ): Promise<void> {
    const testResults = this.testSecurityHeaders(res);

    // Log security headers compliance
    if (testResults.score < 100) {
      console.warn('Security headers compliance:', {
        score: testResults.score,
        missing: testResults.headersMissing,
        url: req.nextUrl.href,
      });
    }
  }
}
