import { EmailAuthenticationService } from '@/lib/email/email-authentication';
import { createClient } from '@/lib/supabase/server';

// Mock dependencies
jest.mock('@/lib/supabase/server');
jest.mock('@/lib/security/audit-logger');

// Create a comprehensive mock that supports all Supabase query methods
const createMockQuery = () => {
  const mockQuery = {
    select: jest.fn(() => mockQuery),
    insert: jest.fn(() => mockQuery),
    update: jest.fn(() => mockQuery),
    delete: jest.fn(() => mockQuery),
    upsert: jest.fn(() => mockQuery),
    eq: jest.fn(() => mockQuery),
    gte: jest.fn(() => mockQuery),
    lte: jest.fn(() => mockQuery),
    lt: jest.fn(() => mockQuery),
    in: jest.fn(() => mockQuery),
    or: jest.fn(() => mockQuery),
    order: jest.fn(() => mockQuery),
    limit: jest.fn(() => mockQuery),
    single: jest.fn(() => mockQuery),
    data: [],
    error: null,
  };
  return mockQuery;
};

const mockSupabase = {
  from: jest.fn(),
};

(createClient as jest.Mock).mockReturnValue(mockSupabase);

describe('EmailAuthenticationService', () => {
  let authService: EmailAuthenticationService;

  beforeEach(() => {
    jest.clearAllMocks();
    authService = new EmailAuthenticationService();

    // Mock the upsert operation for storing authentication results
    const mockUpsertQuery = createMockQuery();
    mockUpsertQuery.upsert.mockResolvedValue({
      data: { id: 'auth-result-1' },
      error: null,
    });

    mockSupabase.from.mockReturnValue(mockUpsertQuery);
  });

  describe('validateSPFRecord', () => {
    it('should validate SPF record successfully', async () => {
      const domain = 'example.com';
      const result = await authService.validateSPFRecord(domain);

      expect(result.domain).toBe(domain);
      expect(result.isValid).toBe(true);
      expect(result.record).toContain('v=spf1');
      expect(mockSupabase.from).toHaveBeenCalledWith('email_authentication');
    });

    it('should handle SPF validation errors', async () => {
      // Mock the getSPFRecord method to return an invalid record
      const mockGetSPFRecord = jest
        .fn()
        .mockResolvedValue('invalid-spf-record');
      (authService as any).getSPFRecord = mockGetSPFRecord;

      const domain = 'invalid.com';
      const result = await authService.validateSPFRecord(domain);

      expect(result.domain).toBe(domain);
      expect(result.isValid).toBe(false);
      expect(result.errors).toBeDefined();
    });
  });

  describe('validateDKIMRecord', () => {
    it('should validate DKIM record successfully', async () => {
      const domain = 'example.com';
      const result = await authService.validateDKIMRecord(domain);

      expect(result.domain).toBe(domain);
      expect(result.isValid).toBe(true);
      expect(result.publicKey).toContain('v=DKIM1');
    });

    it('should validate DKIM record with custom selector', async () => {
      const domain = 'example.com';
      const selector = 'custom';
      const result = await authService.validateDKIMRecord(domain, selector);

      expect(result.domain).toBe(domain);
      expect(result.selector).toBe(selector);
    });
  });

  describe('validateDMARCRecord', () => {
    it('should validate DMARC record successfully', async () => {
      const domain = 'example.com';
      const result = await authService.validateDMARCRecord(domain);

      expect(result.domain).toBe(domain);
      expect(result.isValid).toBe(true);
      expect(result.policy).toBeDefined();
      expect(result.percentage).toBeDefined();
    });
  });

  describe('getAuthenticationStatus', () => {
    it('should get comprehensive authentication status', async () => {
      const domain = 'example.com';
      const status = await authService.getAuthenticationStatus(domain);

      expect(status.domain).toBe(domain);
      expect(status.spf).toBeDefined();
      expect(status.dkim).toBeDefined();
      expect(status.dmarc).toBeDefined();
      expect(status.overallStatus).toBeDefined();
    });
  });

  describe('getAuthenticationRecommendations', () => {
    it('should get authentication recommendations', async () => {
      const domain = 'example.com';
      const recommendations =
        await authService.getAuthenticationRecommendations(domain);

      expect(Array.isArray(recommendations)).toBe(true);
      recommendations.forEach(rec => {
        expect(rec.type).toMatch(/^(spf|dkim|dmarc)$/);
        expect(rec.priority).toMatch(/^(low|medium|high|critical)$/);
        expect(rec.title).toBeDefined();
        expect(rec.description).toBeDefined();
        expect(rec.action).toBeDefined();
        expect(rec.expectedImpact).toBeDefined();
      });
    });
  });

  describe('getAuthenticationHistory', () => {
    it('should get authentication history for a domain', async () => {
      // Mock the Supabase query for authentication history
      const mockHistoryQuery = createMockQuery();
      mockHistoryQuery.order.mockResolvedValue({
        data: [
          {
            id: 'history-1',
            domain: 'example.com',
            type: 'spf',
            result: { isValid: true },
            last_checked: '2024-01-01T00:00:00Z',
          },
        ],
        error: null,
      });

      mockSupabase.from.mockReturnValue(mockHistoryQuery);

      const domain = 'example.com';
      const days = 30;
      const history = await authService.getAuthenticationHistory(domain, days);

      expect(Array.isArray(history)).toBe(true);
      expect(mockSupabase.from).toHaveBeenCalledWith('email_authentication');
    });
  });

  describe('getAuthenticationStats', () => {
    it('should get authentication statistics', async () => {
      // Mock the Supabase query
      const mockQuery = createMockQuery();
      mockQuery.eq.mockResolvedValue({
        data: [
          {
            id: 'auth-1',
            domain: 'example.com',
            type: 'overall',
            result: {
              overallStatus: 'pass',
              spf: { isValid: true },
              dkim: { isValid: true },
              dmarc: { isValid: true },
            },
          },
          {
            id: 'auth-2',
            domain: 'test.com',
            type: 'overall',
            result: {
              overallStatus: 'partial',
              spf: { isValid: true },
              dkim: { isValid: false },
              dmarc: { isValid: false },
            },
          },
        ],
        error: null,
      });

      mockSupabase.from.mockReturnValue(mockQuery);

      const stats = await authService.getAuthenticationStats();

      expect(stats.totalDomains).toBe(2);
      expect(stats.fullyAuthenticated).toBe(1);
      expect(stats.partiallyAuthenticated).toBe(1);
      expect(stats.notAuthenticated).toBe(0);
      expect(stats.spfValid).toBe(2);
      expect(stats.dkimValid).toBe(1);
      expect(stats.dmarcValid).toBe(1);
    });
  });
});
