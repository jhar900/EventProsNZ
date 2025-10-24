import { DeliverabilityOptimizer } from '@/lib/email/deliverability-optimizer';
import { createClient } from '@/lib/supabase/server';

// Mock dependencies
jest.mock('@/lib/supabase/server');
jest.mock('@/lib/email/email-delivery-monitor');
jest.mock('@/lib/email/email-authentication');

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

describe('DeliverabilityOptimizer', () => {
  let optimizer: DeliverabilityOptimizer;

  beforeEach(() => {
    jest.clearAllMocks();
    optimizer = new DeliverabilityOptimizer();
  });

  describe('getDeliverabilityReport', () => {
    it('should generate comprehensive deliverability report', async () => {
      // Mock the delivery monitor
      const mockDeliveryMonitor = {
        getDeliveryMetrics: jest.fn().mockResolvedValue({
          totalSent: 100,
          totalDelivered: 95,
          totalBounced: 3,
          totalComplained: 2,
          deliveryRate: 95,
          bounceRate: 3,
          complaintRate: 2,
          averageDeliveryTime: 120,
        }),
      };

      // Mock the authentication service
      const mockAuthService = {
        getAuthenticationStatus: jest.fn().mockResolvedValue({
          domain: 'example.com',
          spf: true,
          dkim: true,
          dmarc: true,
          overall: 'excellent',
        }),
      };

      // Mock the optimizer's dependencies
      (optimizer as any).deliveryMonitor = mockDeliveryMonitor;
      (optimizer as any).authService = mockAuthService;

      // Mock the Supabase upsert operation for storing the report
      const mockUpsertQuery = createMockQuery();
      mockUpsertQuery.upsert.mockResolvedValue({
        data: { id: 'report-1' },
        error: null,
      });

      mockSupabase.from.mockReturnValue(mockUpsertQuery);

      const domain = 'example.com';
      const report = await optimizer.getDeliverabilityReport(domain);

      expect(report.overallScore).toBeDefined();
      expect(report.status).toMatch(/^(excellent|good|fair|poor|critical)$/);
      expect(report.senderReputation).toBeDefined();
      expect(report.contentOptimization).toBeDefined();
      expect(report.listHygiene).toBeDefined();
      expect(report.engagementMetrics).toBeDefined();
      expect(report.recommendations).toBeDefined();
      expect(Array.isArray(report.recommendations)).toBe(true);
    });
  });

  describe('getOptimizationActions', () => {
    it('should get optimization actions for a domain', async () => {
      // Mock the delivery monitor
      const mockDeliveryMonitor = {
        getDeliveryMetrics: jest.fn().mockResolvedValue({
          totalSent: 100,
          totalDelivered: 95,
          totalBounced: 3,
          totalComplained: 2,
          deliveryRate: 95,
          bounceRate: 3,
          complaintRate: 2,
          averageDeliveryTime: 120,
        }),
      };

      // Mock the authentication service
      const mockAuthService = {
        getAuthenticationStatus: jest.fn().mockResolvedValue({
          domain: 'example.com',
          spf: true,
          dkim: true,
          dmarc: true,
          overall: 'excellent',
        }),
      };

      // Mock the optimizer's dependencies
      (optimizer as any).deliveryMonitor = mockDeliveryMonitor;
      (optimizer as any).authService = mockAuthService;

      // Mock the Supabase upsert operation for storing the report
      const mockUpsertQuery = createMockQuery();
      mockUpsertQuery.upsert.mockResolvedValue({
        data: { id: 'report-1' },
        error: null,
      });

      mockSupabase.from.mockReturnValue(mockUpsertQuery);

      const domain = 'example.com';
      const actions = await optimizer.getOptimizationActions(domain);

      expect(Array.isArray(actions)).toBe(true);
      actions.forEach(action => {
        expect(action.id).toBeDefined();
        expect(action.type).toMatch(
          /^(content|list|authentication|timing|frequency)$/
        );
        expect(action.priority).toMatch(/^(low|medium|high|critical)$/);
        expect(action.title).toBeDefined();
        expect(action.description).toBeDefined();
        expect(action.action).toBeDefined();
        expect(action.expectedImpact).toBeDefined();
        expect(action.effort).toMatch(/^(low|medium|high)$/);
        expect(action.timeline).toBeDefined();
      });
    });
  });

  describe('getDeliverabilityTrends', () => {
    it('should get deliverability trends for a domain', async () => {
      // Mock the Supabase query
      const mockQuery = createMockQuery();
      mockQuery.order.mockResolvedValue({
        data: [
          {
            id: 'trend-1',
            domain: 'example.com',
            last_updated: '2024-01-01T00:00:00Z',
            report: {
              overallScore: 85,
              status: 'good',
            },
          },
        ],
        error: null,
      });

      mockSupabase.from.mockReturnValue(mockQuery);

      const domain = 'example.com';
      const days = 30;
      const trends = await optimizer.getDeliverabilityTrends(domain, days);

      expect(Array.isArray(trends)).toBe(true);
    });
  });

  describe('getDeliverabilityStats', () => {
    it('should get deliverability statistics', async () => {
      // Mock the Supabase query
      const mockQuery = createMockQuery();
      mockQuery.select.mockResolvedValue({
        data: [
          {
            id: 'report-1',
            domain: 'example.com',
            report: {
              overallScore: 85,
              status: 'good',
            },
          },
          {
            id: 'report-2',
            domain: 'test.com',
            report: {
              overallScore: 95,
              status: 'excellent',
            },
          },
        ],
        error: null,
      });

      mockSupabase.from.mockReturnValue(mockQuery);

      const stats = await optimizer.getDeliverabilityStats();

      expect(stats.totalDomains).toBe(2);
      expect(stats.excellent).toBeDefined();
      expect(stats.good).toBeDefined();
      expect(stats.fair).toBeDefined();
      expect(stats.poor).toBeDefined();
      expect(stats.critical).toBeDefined();
      expect(stats.averageScore).toBeDefined();
    });
  });
});
