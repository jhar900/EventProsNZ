import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { AuditLogger } from './audit-logger';
import { RateLimiter } from './rate-limiting';

export interface APISecurityConfig {
  enableRateLimit: boolean;
  enableAuth: boolean;
  enableValidation: boolean;
  enableMonitoring: boolean;
  enableAbuseDetection: boolean;
  maxRequestSize: number;
  allowedMethods: string[];
  allowedHeaders: string[];
  blockedIPs: string[];
  trustedIPs: string[];
}

export interface APIRequest {
  id: string;
  endpoint: string;
  method: string;
  ipAddress: string;
  userAgent: string;
  userId?: string;
  timestamp: Date;
  responseTime: number;
  statusCode: number;
  requestSize: number;
  isBlocked: boolean;
  blockReason?: string;
}

export interface APIRateLimit {
  id: string;
  endpoint: string;
  limit: number;
  window: number;
  created_at: Date;
  updated_at: Date;
}

export class APISecurityService {
  private supabase = createClient();
  private auditLogger = new AuditLogger();
  private readonly config: APISecurityConfig = {
    enableRateLimit: true,
    enableAuth: true,
    enableValidation: true,
    enableMonitoring: true,
    enableAbuseDetection: true,
    maxRequestSize: 10 * 1024 * 1024, // 10MB
    allowedMethods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-CSRF-Token',
      'X-Requested-With',
      'content-length',
      'user-agent',
      'host',
      'accept',
      'accept-language',
      'accept-encoding',
    ],
    blockedIPs: [],
    trustedIPs: [],
  };

  private rateLimiters = new Map<string, RateLimiter>();

  /**
   * Initialize API security
   */
  async initialize(): Promise<void> {
    await this.loadRateLimits();
    await this.loadBlockedIPs();
    await this.loadTrustedIPs();
  }

  /**
   * Validate API request
   */
  async validateRequest(req: NextRequest): Promise<{
    valid: boolean;
    errors: string[];
    requestId: string;
  }> {
    const requestId = this.generateRequestId();
    const errors: string[] = [];

    // Method validation
    if (!this.config.allowedMethods.includes(req.method)) {
      errors.push(`Method ${req.method} not allowed`);
    }

    // Request size validation
    const contentLength = req.headers.get('content-length');
    if (contentLength && parseInt(contentLength) > this.config.maxRequestSize) {
      errors.push('Request too large');
    }

    // IP validation
    const ipAddress = this.getClientIP(req);
    if (this.config.blockedIPs.includes(ipAddress)) {
      errors.push('IP address is blocked');
    }

    // Header validation
    const invalidHeaders = this.validateHeaders(req);
    if (invalidHeaders.length > 0) {
      errors.push(`Invalid headers: ${invalidHeaders.join(', ')}`);
    }

    // User agent validation
    const userAgent = req.headers.get('user-agent') || '';
    if (this.isSuspiciousUserAgent(userAgent)) {
      errors.push('Suspicious user agent detected');
    }

    return {
      valid: errors.length === 0,
      errors,
      requestId,
    };
  }

  /**
   * Apply rate limiting
   */
  async applyRateLimit(
    req: NextRequest,
    endpoint: string
  ): Promise<{
    allowed: boolean;
    remaining: number;
    resetTime: number;
    retryAfter?: number;
  }> {
    const rateLimiter = this.rateLimiters.get(endpoint);
    if (!rateLimiter) {
      return { allowed: true, remaining: Infinity, resetTime: Date.now() };
    }

    return await rateLimiter.checkLimit(req);
  }

  /**
   * Authenticate API request
   */
  async authenticateRequest(req: NextRequest): Promise<{
    authenticated: boolean;
    userId?: string;
    error?: string;
  }> {
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return { authenticated: false, error: 'No authorization header' };
    }

    const token = authHeader.replace('Bearer ', '');

    try {
      // Validate JWT token with Supabase
      const {
        data: { user },
        error,
      } = await this.supabase.auth.getUser(token);

      if (error || !user) {
        return { authenticated: false, error: 'Invalid token' };
      }

      return { authenticated: true, userId: user.id };
    } catch (error) {
      return { authenticated: false, error: 'Token validation failed' };
    }
  }

  /**
   * Monitor API request
   */
  async monitorRequest(
    requestId: string,
    req: NextRequest,
    response: Response,
    startTime: number
  ): Promise<void> {
    const endTime = Date.now();
    const responseTime = endTime - startTime;
    const ipAddress = this.getClientIP(req);
    const userAgent = req.headers.get('user-agent') || '';
    const userId = req.headers.get('x-user-id') || undefined;

    const apiRequest: APIRequest = {
      id: requestId,
      endpoint: req.nextUrl.pathname,
      method: req.method,
      ipAddress,
      userAgent,
      userId,
      timestamp: new Date(),
      responseTime,
      statusCode: response.status,
      requestSize: parseInt(req.headers.get('content-length') || '0'),
      isBlocked: response.status === 429 || response.status === 403,
      blockReason:
        response.status === 429
          ? 'Rate limit exceeded'
          : response.status === 403
            ? 'Access forbidden'
            : undefined,
    };

    // Store request log
    await this.storeRequestLog(apiRequest);

    // Check for abuse patterns
    await this.checkAbusePatterns(apiRequest);

    // Log security events
    if (apiRequest.isBlocked) {
      await this.auditLogger.logEvent({
        action: 'api_request_blocked',
        userId,
        resource: 'api_security',
        resourceId: requestId,
        details: {
          endpoint: apiRequest.endpoint,
          method: apiRequest.method,
          ipAddress: apiRequest.ipAddress,
          blockReason: apiRequest.blockReason,
        },
        ipAddress,
        userAgent,
      });
    }
  }

  /**
   * Detect API abuse
   */
  async checkAbusePatterns(request: APIRequest): Promise<void> {
    // Check for rapid requests from same IP
    const recentRequests = await this.getRecentRequests(
      request.ipAddress,
      5 * 60 * 1000
    ); // 5 minutes
    if (recentRequests.length > 100) {
      await this.recordAbuseEvent(request, 'rapid_requests', {
        requestCount: recentRequests.length,
        timeWindow: '5 minutes',
      });
    }

    // Check for suspicious user agents
    if (this.isSuspiciousUserAgent(request.userAgent)) {
      await this.recordAbuseEvent(request, 'suspicious_user_agent', {
        userAgent: request.userAgent,
      });
    }

    // Check for large request sizes
    if (request.requestSize > this.config.maxRequestSize * 0.8) {
      await this.recordAbuseEvent(request, 'large_request', {
        requestSize: request.requestSize,
        maxSize: this.config.maxRequestSize,
      });
    }

    // Check for repeated failed requests
    const failedRequests = recentRequests.filter(r => r.statusCode >= 400);
    if (failedRequests.length > 10) {
      await this.recordAbuseEvent(request, 'repeated_failures', {
        failureCount: failedRequests.length,
        timeWindow: '5 minutes',
      });
    }
  }

  /**
   * Record abuse event
   */
  private async recordAbuseEvent(
    request: APIRequest,
    abuseType: string,
    details: any
  ): Promise<void> {
    await this.auditLogger.logEvent({
      action: 'api_abuse_detected',
      userId: request.userId,
      resource: 'api_security',
      resourceId: request.id,
      details: {
        abuseType,
        endpoint: request.endpoint,
        method: request.method,
        ipAddress: request.ipAddress,
        ...details,
      },
      ipAddress: request.ipAddress,
      userAgent: request.userAgent,
    });
  }

  /**
   * Get recent requests from IP
   */
  private async getRecentRequests(
    ipAddress: string,
    timeWindow: number
  ): Promise<APIRequest[]> {
    const since = new Date(Date.now() - timeWindow);

    const { data, error } = await this.supabase
      .from('api_requests')
      .select('*')
      .eq('ip_address', ipAddress)
      .gte('timestamp', since.toISOString())
      .order('timestamp', { ascending: false });

    if (error || !data) {
      return [];
    }

    return data.map(req => ({
      id: req.id,
      endpoint: req.endpoint,
      method: req.method,
      ipAddress: req.ip_address,
      userAgent: req.user_agent,
      userId: req.user_id,
      timestamp: new Date(req.timestamp),
      responseTime: req.response_time,
      statusCode: req.status_code,
      requestSize: req.request_size,
      isBlocked: req.is_blocked,
      blockReason: req.block_reason,
    }));
  }

  /**
   * Store request log
   */
  private async storeRequestLog(request: APIRequest): Promise<void> {
    await this.supabase.from('api_requests').insert({
      id: request.id,
      endpoint: request.endpoint,
      method: request.method,
      ip_address: request.ipAddress,
      user_agent: request.userAgent,
      user_id: request.userId,
      timestamp: request.timestamp.toISOString(),
      response_time: request.responseTime,
      status_code: request.statusCode,
      request_size: request.requestSize,
      is_blocked: request.isBlocked,
      block_reason: request.blockReason,
    });
  }

  /**
   * Load rate limits from database
   */
  private async loadRateLimits(): Promise<void> {
    const { data, error } = await this.supabase
      .from('api_rate_limits')
      .select('*');

    if (error || !data) {
      return;
    }

    for (const limit of data) {
      const rateLimiter = new RateLimiter({
        windowMs: limit.window * 1000, // Convert to milliseconds
        maxRequests: limit.limit,
        keyGenerator: req => {
          const userId = req.headers.get('x-user-id');
          if (userId) {
            return `api_rate_limit:user:${userId}:${limit.endpoint}`;
          }
          const ip = this.getClientIP(req);
          return `api_rate_limit:ip:${ip}:${limit.endpoint}`;
        },
      });

      this.rateLimiters.set(limit.endpoint, rateLimiter);
    }
  }

  /**
   * Load blocked IPs
   */
  private async loadBlockedIPs(): Promise<void> {
    // In practice, this would load from database
    this.config.blockedIPs = [];
  }

  /**
   * Load trusted IPs
   */
  private async loadTrustedIPs(): Promise<void> {
    // In practice, this would load from database
    this.config.trustedIPs = [];
  }

  /**
   * Validate headers
   */
  private validateHeaders(req: NextRequest): string[] {
    const invalidHeaders: string[] = [];
    const headers = Array.from(req.headers.keys());

    for (const header of headers) {
      if (!this.config.allowedHeaders.includes(header)) {
        invalidHeaders.push(header);
      }
    }

    return invalidHeaders;
  }

  /**
   * Check if user agent is suspicious
   */
  private isSuspiciousUserAgent(userAgent: string): boolean {
    const suspiciousPatterns = [
      /bot/i,
      /crawler/i,
      /spider/i,
      /scraper/i,
      /curl/i,
      /wget/i,
      /python/i,
      /java/i,
      /php/i,
    ];

    return suspiciousPatterns.some(pattern => pattern.test(userAgent));
  }

  /**
   * Get client IP address
   */
  private getClientIP(req: NextRequest): string {
    return (
      req.headers.get('x-forwarded-for') ||
      req.headers.get('x-real-ip') ||
      req.ip ||
      'unknown'
    );
  }

  /**
   * Generate request ID
   */
  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Block IP address
   */
  async blockIP(ipAddress: string, reason: string): Promise<void> {
    this.config.blockedIPs.push(ipAddress);

    await this.auditLogger.logEvent({
      action: 'ip_blocked',
      resource: 'api_security',
      details: { ipAddress, reason },
    });
  }

  /**
   * Unblock IP address
   */
  async unblockIP(ipAddress: string): Promise<void> {
    this.config.blockedIPs = this.config.blockedIPs.filter(
      ip => ip !== ipAddress
    );

    await this.auditLogger.logEvent({
      action: 'ip_unblocked',
      resource: 'api_security',
      details: { ipAddress },
    });
  }

  /**
   * Get API security status
   */
  async getSecurityStatus(): Promise<{
    totalRequests: number;
    blockedRequests: number;
    abuseEvents: number;
    activeRateLimits: number;
    blockedIPs: number;
  }> {
    const { data: stats } = await this.supabase
      .from('api_requests')
      .select('is_blocked, timestamp')
      .gte(
        'timestamp',
        new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
      );

    const totalRequests = stats?.length || 0;
    const blockedRequests = stats?.filter(r => r.is_blocked).length || 0;

    return {
      totalRequests,
      blockedRequests,
      abuseEvents: 0, // Would be calculated from audit logs
      activeRateLimits: this.rateLimiters.size,
      blockedIPs: this.config.blockedIPs.length,
    };
  }
}
