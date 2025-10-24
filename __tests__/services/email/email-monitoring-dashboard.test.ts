import { EmailMonitoringDashboard } from '@/lib/email/email-monitoring-dashboard';
import { createClient } from '@/lib/supabase/server';

// Mock dependencies
jest.mock('@/lib/supabase/server');
jest.mock('@/lib/email/email-delivery-monitor');
jest.mock('@/lib/email/email-authentication');
jest.mock('@/lib/email/deliverability-optimizer');
jest.mock('@/lib/email/error-handler');

// Create a comprehensive mock that supports all Supabase query methods
const createMockQuery = () => {
  const mockQuery = {
    select: jest.fn(() => mockQuery),
    insert: jest.fn(() => mockQuery),
    update: jest.fn(() => mockQuery),
    delete: jest.fn(() => mockQuery),
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

describe('EmailMonitoringDashboard', () => {
  let dashboard: EmailMonitoringDashboard;

  beforeEach(() => {
    jest.clearAllMocks();
    dashboard = new EmailMonitoringDashboard();
  });

  describe('getDashboardData', () => {
    it('should get comprehensive dashboard data', async () => {
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
        getDeliveryAnalytics: jest.fn().mockResolvedValue({
          trends: {
            daily: [
              {
                date: '2024-01-01',
                sent: 50,
                delivered: 48,
                bounced: 1,
                complained: 1,
              },
            ],
          },
          topTemplates: [
            {
              templateId: 'template-1',
              templateName: 'Welcome Email',
              sent: 25,
              deliveryRate: 98,
            },
          ],
        }),
      };

      // Mock the error handler
      const mockErrorHandler = {
        getErrorStats: jest.fn().mockResolvedValue({
          total: 10,
          unresolved: 2,
        }),
      };

      // Mock the queue metrics query
      const mockQueueQuery = createMockQuery();
      mockQueueQuery.eq.mockResolvedValue({
        data: [
          { id: '1', status: 'pending' },
          { id: '2', status: 'pending' },
          { id: '3', status: 'pending' },
        ],
        error: null,
      });

      // Mock the alerts query
      const mockAlertsQuery = createMockQuery();
      mockAlertsQuery.order.mockResolvedValue({
        data: [
          {
            id: 'alert-1',
            type: 'delivery_failure',
            severity: 'warning',
            message: 'High bounce rate detected',
            resolved: false,
            created_at: '2024-01-01T00:00:00Z',
          },
        ],
        error: null,
      });

      // Mock the recent errors query
      const mockErrorsQuery = createMockQuery();
      mockErrorsQuery.limit.mockResolvedValue({
        data: [
          {
            id: 'error-1',
            type: 'sendgrid_error',
            message: 'API rate limit exceeded',
            created_at: '2024-01-01T00:00:00Z',
            severity: 'error',
          },
        ],
        error: null,
      });

      // Mock the trends query
      const mockTrendsQuery = createMockQuery();
      mockTrendsQuery.order.mockResolvedValue({
        data: [
          {
            date: '2024-01-01',
            emails_sent: 50,
            emails_delivered: 48,
            emails_bounced: 1,
            emails_complained: 1,
          },
        ],
        error: null,
      });

      // Mock the top templates query
      const mockTemplatesQuery = createMockQuery();
      mockTemplatesQuery.order.mockResolvedValue({
        data: [
          {
            template_id: 'template-1',
            name: 'Welcome Email',
            usage_count: 25,
            success_rate: 98,
          },
        ],
        error: null,
      });

      // Set up the mock to return different queries for different calls
      // The calls happen in this order: getSystemMetrics -> getAlerts -> getRecentErrors
      mockSupabase.from
        .mockReturnValueOnce(mockQueueQuery) // For queue metrics in getSystemMetrics
        .mockReturnValueOnce(mockAlertsQuery) // For alerts
        .mockReturnValueOnce(mockErrorsQuery); // For recent errors

      // Mock the dashboard's dependencies
      (dashboard as any).deliveryMonitor = mockDeliveryMonitor;
      (dashboard as any).errorHandler = mockErrorHandler;

      const data = await dashboard.getDashboardData();

      expect(data.healthStatus).toBeDefined();
      expect(data.systemMetrics).toBeDefined();
      expect(data.alerts).toBeDefined();
      expect(data.trends).toBeDefined();
      expect(data.topTemplates).toBeDefined();
      expect(data.recentErrors).toBeDefined();

      // Check health status structure
      expect(data.healthStatus.overall).toMatch(
        /^(healthy|degraded|critical)$/
      );
      expect(data.healthStatus.components).toBeDefined();
      expect(data.healthStatus.components.sendgrid).toBeDefined();
      expect(data.healthStatus.components.database).toBeDefined();
      expect(data.healthStatus.components.authentication).toBeDefined();
      expect(data.healthStatus.components.delivery).toBeDefined();
      expect(data.healthStatus.components.queue).toBeDefined();

      // Check system metrics structure
      expect(typeof data.systemMetrics.emailsSent).toBe('number');
      expect(typeof data.systemMetrics.emailsDelivered).toBe('number');
      expect(typeof data.systemMetrics.emailsBounced).toBe('number');
      expect(typeof data.systemMetrics.emailsComplained).toBe('number');
      expect(typeof data.systemMetrics.deliveryRate).toBe('number');
      expect(typeof data.systemMetrics.bounceRate).toBe('number');
      expect(typeof data.systemMetrics.complaintRate).toBe('number');
      expect(typeof data.systemMetrics.averageDeliveryTime).toBe('number');
      expect(typeof data.systemMetrics.queueSize).toBe('number');
      expect(typeof data.systemMetrics.processingRate).toBe('number');
      expect(typeof data.systemMetrics.errorRate).toBe('number');
      expect(typeof data.systemMetrics.uptime).toBe('number');

      // Check trends structure
      expect(Array.isArray(data.trends.emailsSent)).toBe(true);
      expect(Array.isArray(data.trends.deliveryRate)).toBe(true);
      expect(Array.isArray(data.trends.bounceRate)).toBe(true);
      expect(Array.isArray(data.trends.errorRate)).toBe(true);

      // Check top templates structure
      expect(Array.isArray(data.topTemplates)).toBe(true);
      data.topTemplates.forEach(template => {
        expect(template.id).toBeDefined();
        expect(template.name).toBeDefined();
        expect(typeof template.sent).toBe('number');
        expect(typeof template.deliveryRate).toBe('number');
      });

      // Check recent errors structure
      expect(Array.isArray(data.recentErrors)).toBe(true);
      data.recentErrors.forEach(error => {
        expect(error.id).toBeDefined();
        expect(error.type).toBeDefined();
        expect(error.message).toBeDefined();
        expect(error.timestamp).toBeDefined();
        expect(error.severity).toBeDefined();
      });
    });
  });

  describe('createAlert', () => {
    it('should create a system alert', async () => {
      // Mock the insert operation
      const mockInsertQuery = createMockQuery();
      mockInsertQuery.insert.mockResolvedValue({
        data: { id: 'alert-1' },
        error: null,
      });

      mockSupabase.from.mockReturnValue(mockInsertQuery);

      const alert = {
        type: 'error' as const,
        severity: 'high' as const,
        title: 'Test Alert',
        message: 'This is a test alert',
        component: 'sendgrid',
      };

      await dashboard.createAlert(alert);

      expect(mockSupabase.from).toHaveBeenCalledWith('system_alerts');
      expect(mockInsertQuery.insert).toHaveBeenCalledWith({
        ...alert,
        timestamp: expect.any(String),
        resolved: false,
      });
    });
  });

  describe('resolveAlert', () => {
    it('should resolve a system alert', async () => {
      // Mock the update operation
      const mockUpdateQuery = createMockQuery();
      mockUpdateQuery.eq.mockResolvedValue({
        data: { id: 'test-alert-id' },
        error: null,
      });

      mockSupabase.from.mockReturnValue(mockUpdateQuery);

      const alertId = 'test-alert-id';

      await dashboard.resolveAlert(alertId);

      expect(mockSupabase.from).toHaveBeenCalledWith('system_alerts');
      expect(mockUpdateQuery.update).toHaveBeenCalledWith({
        resolved: true,
        resolved_at: expect.any(String),
      });
      expect(mockUpdateQuery.eq).toHaveBeenCalledWith('id', alertId);
    });
  });

  describe('getMonitoringStats', () => {
    it('should get monitoring statistics', async () => {
      // Mock the alerts query
      const mockAlertsQuery = createMockQuery();
      mockAlertsQuery.select.mockResolvedValue({
        data: [
          {
            id: 'alert-1',
            type: 'delivery_failure',
            severity: 'critical',
            message: 'Critical delivery failure',
            resolved: false,
            created_at: '2024-01-01T00:00:00Z',
          },
          {
            id: 'alert-2',
            type: 'bounce_rate',
            severity: 'warning',
            message: 'High bounce rate',
            resolved: true,
            created_at: '2024-01-01T00:00:00Z',
          },
          {
            id: 'alert-3',
            type: 'api_error',
            severity: 'critical',
            message: 'API connection failed',
            resolved: false,
            created_at: '2024-01-01T00:00:00Z',
          },
        ],
        error: null,
      });

      mockSupabase.from.mockReturnValue(mockAlertsQuery);

      const stats = await dashboard.getMonitoringStats();

      expect(stats.totalAlerts).toBe(3);
      expect(stats.resolvedAlerts).toBe(1);
      expect(stats.criticalAlerts).toBe(2);
      expect(stats.averageResponseTime).toBeDefined();
      expect(stats.uptime).toBeDefined();
    });
  });
});
