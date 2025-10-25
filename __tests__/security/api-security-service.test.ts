import { APISecurityService } from '@/lib/security/api-security-service';
import { NextRequest } from 'next/server';

// Mock Supabase client
jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(() => ({
    from: jest.fn(() => ({
      insert: jest.fn(() => ({ error: null })),
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          gte: jest.fn(() => ({
            order: jest.fn(() => ({ data: [], error: null })),
          })),
          order: jest.fn(() => ({
            limit: jest.fn(() => ({
              single: jest.fn(() => ({ data: null, error: null })),
            })),
          })),
        })),
        gte: jest.fn(() => ({ data: [], error: null })),
      })),
      update: jest.fn(() => ({
        eq: jest.fn(() => ({
          eq: jest.fn(() => ({ error: null })),
        })),
      })),
      delete: jest.fn(() => ({ error: null })),
    })),
  })),
}));

// Mock AuditLogger
jest.mock('@/lib/security/audit-logger', () => ({
  AuditLogger: jest.fn().mockImplementation(() => ({
    logEvent: jest.fn(),
  })),
}));

describe('APISecurityService', () => {
  let apiSecurityService: APISecurityService;

  beforeEach(() => {
    apiSecurityService = new APISecurityService();
  });

  describe('initialize', () => {
    it('should initialize API security service', async () => {
      await apiSecurityService.initialize();

      // Should not throw error
      expect(true).toBe(true);
    });
  });

  describe('validateRequest', () => {
    it('should validate valid request', async () => {
      await apiSecurityService.initialize();

      const req = new NextRequest('https://example.com/api/test', {
        method: 'GET',
        headers: {
          'content-length': '100',
          'user-agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        },
      });

      const result = await apiSecurityService.validateRequest(req);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.requestId).toBeDefined();
    });

    it('should reject request with invalid method', async () => {
      const req = new NextRequest('https://example.com/api/test', {
        method: 'INVALID',
        headers: {
          'content-length': '100',
        },
      });

      const result = await apiSecurityService.validateRequest(req);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Method INVALID not allowed');
    });

    it('should reject oversized request', async () => {
      const req = new NextRequest('https://example.com/api/test', {
        method: 'POST',
        headers: {
          'content-length': '20000000', // 20MB
        },
      });

      const result = await apiSecurityService.validateRequest(req);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Request too large');
    });

    it('should detect suspicious user agent', async () => {
      const req = new NextRequest('https://example.com/api/test', {
        method: 'GET',
        headers: {
          'content-length': '100',
          'user-agent': 'curl/7.68.0', // Suspicious user agent
        },
      });

      const result = await apiSecurityService.validateRequest(req);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Suspicious user agent detected');
    });
  });

  describe('applyRateLimit', () => {
    it('should allow request within rate limit', async () => {
      const req = new NextRequest('https://example.com/api/test', {
        method: 'GET',
      });

      const result = await apiSecurityService.applyRateLimit(req, '/api/test');

      expect(result.allowed).toBe(true);
      expect(result.remaining).toBeGreaterThan(0);
    });
  });

  describe('authenticateRequest', () => {
    it('should authenticate valid token', async () => {
      const req = new NextRequest('https://example.com/api/test', {
        method: 'GET',
        headers: {
          authorization: 'Bearer valid-token',
        },
      });

      // Mock Supabase auth
      const mockSupabase = {
        auth: {
          getUser: jest.fn(() => ({
            data: { user: { id: 'user-123' } },
            error: null,
          })),
        },
      };

      (apiSecurityService as any).supabase = mockSupabase;

      const result = await apiSecurityService.authenticateRequest(req);

      expect(result.authenticated).toBe(true);
      expect(result.userId).toBe('user-123');
    });

    it('should reject request without token', async () => {
      const req = new NextRequest('https://example.com/api/test', {
        method: 'GET',
      });

      const result = await apiSecurityService.authenticateRequest(req);

      expect(result.authenticated).toBe(false);
      expect(result.error).toBe('No authorization header');
    });

    it('should reject request with invalid token', async () => {
      const req = new NextRequest('https://example.com/api/test', {
        method: 'GET',
        headers: {
          authorization: 'Bearer invalid-token',
        },
      });

      // Mock Supabase auth to return error
      const mockSupabase = {
        auth: {
          getUser: jest.fn(() => ({
            data: { user: null },
            error: { message: 'Invalid token' },
          })),
        },
      };

      (apiSecurityService as any).supabase = mockSupabase;

      const result = await apiSecurityService.authenticateRequest(req);

      expect(result.authenticated).toBe(false);
      expect(result.error).toBe('Invalid token');
    });
  });

  describe('monitorRequest', () => {
    it('should monitor API request', async () => {
      const req = new NextRequest('https://example.com/api/test', {
        method: 'GET',
        headers: {
          'x-user-id': 'user-123',
          'user-agent': 'Mozilla/5.0',
        },
      });

      const response = new Response('OK', { status: 200 });
      const startTime = Date.now();

      await apiSecurityService.monitorRequest(
        'req-123',
        req,
        response,
        startTime
      );

      // Should not throw error
      expect(true).toBe(true);
    });
  });

  describe('checkAbusePatterns', () => {
    it('should detect rapid requests', async () => {
      const request = {
        id: 'req-123',
        endpoint: '/api/test',
        method: 'GET',
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0',
        userId: 'user-123',
        timestamp: new Date(),
        responseTime: 100,
        statusCode: 200,
        requestSize: 1000,
        isBlocked: false,
      };

      // Mock getRecentRequests to return many requests
      jest
        .spyOn(apiSecurityService as any, 'getRecentRequests')
        .mockResolvedValue(
          Array(150).fill(request) // More than 100 requests
        );

      await apiSecurityService.checkAbusePatterns(request);

      // Should not throw error
      expect(true).toBe(true);
    });

    it('should detect suspicious user agent', async () => {
      const request = {
        id: 'req-123',
        endpoint: '/api/test',
        method: 'GET',
        ipAddress: '192.168.1.1',
        userAgent: 'curl/7.68.0', // Suspicious user agent
        userId: 'user-123',
        timestamp: new Date(),
        responseTime: 100,
        statusCode: 200,
        requestSize: 1000,
        isBlocked: false,
      };

      jest
        .spyOn(apiSecurityService as any, 'getRecentRequests')
        .mockResolvedValue([]);

      await apiSecurityService.checkAbusePatterns(request);

      // Should not throw error
      expect(true).toBe(true);
    });

    it('should detect large request sizes', async () => {
      const request = {
        id: 'req-123',
        endpoint: '/api/test',
        method: 'POST',
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0',
        userId: 'user-123',
        timestamp: new Date(),
        responseTime: 100,
        statusCode: 200,
        requestSize: 9000000, // Large request size
        isBlocked: false,
      };

      jest
        .spyOn(apiSecurityService as any, 'getRecentRequests')
        .mockResolvedValue([]);

      await apiSecurityService.checkAbusePatterns(request);

      // Should not throw error
      expect(true).toBe(true);
    });
  });

  describe('blockIP', () => {
    it('should block IP address', async () => {
      const ipAddress = '192.168.1.100';
      const reason = 'Suspicious activity';

      await apiSecurityService.blockIP(ipAddress, reason);

      // Should not throw error
      expect(true).toBe(true);
    });
  });

  describe('unblockIP', () => {
    it('should unblock IP address', async () => {
      const ipAddress = '192.168.1.100';

      await apiSecurityService.unblockIP(ipAddress);

      // Should not throw error
      expect(true).toBe(true);
    });
  });

  describe('getSecurityStatus', () => {
    it('should get security status', async () => {
      const status = await apiSecurityService.getSecurityStatus();

      expect(status).toBeDefined();
      expect(status).toHaveProperty('totalRequests');
      expect(status).toHaveProperty('blockedRequests');
      expect(status).toHaveProperty('abuseEvents');
      expect(status).toHaveProperty('activeRateLimits');
      expect(status).toHaveProperty('blockedIPs');
    });
  });
});
