/**
 * Audit Log Service Tests
 * Tests for payment audit logging functionality
 */

// Create the mock objects BEFORE importing the service
const createMockQuery = (mockData?: { data: any; error: any }) => {
  const mockQuery = {
    insert: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    neq: jest.fn().mockReturnThis(),
    gte: jest.fn().mockReturnThis(),
    lte: jest.fn().mockReturnThis(),
    gt: jest.fn().mockReturnThis(),
    lt: jest.fn().mockReturnThis(),
    like: jest.fn().mockReturnThis(),
    ilike: jest.fn().mockReturnThis(),
    is: jest.fn().mockReturnThis(),
    in: jest.fn().mockReturnThis(),
    contains: jest.fn().mockReturnThis(),
    containedBy: jest.fn().mockReturnThis(),
    rangeGt: jest.fn().mockReturnThis(),
    rangeGte: jest.fn().mockReturnThis(),
    rangeLt: jest.fn().mockReturnThis(),
    rangeLte: jest.fn().mockReturnThis(),
    rangeAdjacent: jest.fn().mockReturnThis(),
    overlaps: jest.fn().mockReturnThis(),
    textSearch: jest.fn().mockReturnThis(),
    match: jest.fn().mockReturnThis(),
    not: jest.fn().mockReturnThis(),
    or: jest.fn().mockReturnThis(),
    filter: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    range: jest.fn().mockReturnThis(),
    abortSignal: jest.fn().mockReturnThis(),
    returns: jest.fn().mockReturnThis(),
    single: jest
      .fn()
      .mockResolvedValue(mockData || { data: null, error: null }),
    maybeSingle: jest
      .fn()
      .mockResolvedValue(mockData || { data: null, error: null }),
    csv: jest.fn().mockResolvedValue(''),
    geojson: jest.fn().mockResolvedValue({}),
    explain: jest.fn().mockResolvedValue({}),
    rollback: jest.fn().mockResolvedValue({}),
    then: jest.fn().mockImplementation(resolve => {
      if (resolve) {
        return Promise.resolve(resolve(mockData || { data: [], error: null }));
      }
      return Promise.resolve(mockData || { data: [], error: null });
    }),
  };

  // Configure all chaining methods to return the mockQuery object
  const chainingMethods = [
    'insert',
    'select',
    'update',
    'delete',
    'eq',
    'neq',
    'gte',
    'lte',
    'gt',
    'lt',
    'like',
    'ilike',
    'is',
    'in',
    'contains',
    'containedBy',
    'rangeGt',
    'rangeGte',
    'rangeLt',
    'rangeLte',
    'rangeAdjacent',
    'overlaps',
    'textSearch',
    'match',
    'not',
    'or',
    'filter',
    'order',
    'limit',
    'range',
    'abortSignal',
    'returns',
  ];

  chainingMethods.forEach(method => {
    (mockQuery as any)[method].mockReturnValue(mockQuery);
  });

  return mockQuery;
};

const mockSupabase = {
  auth: {
    getUser: jest.fn().mockResolvedValue({
      data: { user: { id: 'test-user-id', email: 'test@example.com' } },
      error: null,
    }),
    getSession: jest.fn().mockResolvedValue({
      data: {
        session: { user: { id: 'test-user-id', email: 'test@example.com' } },
      },
      error: null,
    }),
  },
  from: jest.fn(() => createMockQuery()),
};

// Mock the Supabase server module BEFORE importing the service
jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(() => mockSupabase),
}));

import { AuditLogService } from '@/lib/payments/security/audit-log-service';

describe('AuditLogService', () => {
  let auditLogService: AuditLogService;

  beforeEach(() => {
    jest.clearAllMocks();
    auditLogService = new AuditLogService();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('logPaymentEvent', () => {
    it('should log payment event successfully', async () => {
      const eventData = {
        event_type: 'payment_created',
        user_id: 'user_123',
        payment_id: 'payment_123',
        amount: 100.0,
        currency: 'NZD',
        metadata: { source: 'web' },
      };

      // Create a proper mock query chain
      const mockQuery = createMockQuery({
        data: { id: 'log_123' },
        error: null,
      });
      mockSupabase.from.mockReturnValueOnce(mockQuery);

      await auditLogService.logPaymentEvent(
        eventData.user_id,
        eventData.event_type,
        eventData,
        '192.168.1.1',
        'Mozilla/5.0'
      );

      expect(mockSupabase.from).toHaveBeenCalledWith('audit_logs');
      expect(mockQuery.insert).toHaveBeenCalledWith({
        user_id: eventData.user_id,
        event_type: eventData.event_type,
        event_data: eventData,
        ip_address: '192.168.1.1',
        user_agent: 'Mozilla/5.0',
        created_at: expect.any(String),
      });
    });

    it('should handle database errors', async () => {
      const eventData = {
        event_type: 'payment_created',
        user_id: 'user_123',
        payment_id: 'payment_123',
        amount: 100.0,
        currency: 'NZD',
        metadata: { source: 'web' },
      };

      // Mock insert to return error
      const insertQuery = createMockQuery({
        data: null,
        error: { message: 'Database error' },
      });
      mockSupabase.from.mockReturnValueOnce(insertQuery);

      // The service is designed to be resilient and not throw errors
      // It will log the error but complete successfully
      await expect(
        auditLogService.logPaymentEvent(eventData)
      ).resolves.toBeUndefined();
    });
  });

  describe('getPaymentAuditLogs', () => {
    it('should retrieve payment audit logs', async () => {
      const mockLogs = [
        {
          id: 'log_1',
          user_id: 'user_123',
          event_type: 'payment_created',
          event_data: { payment_id: 'payment_123' },
          ip_address: '192.168.1.1',
          user_agent: 'Mozilla/5.0',
          created_at: '2024-01-01T00:00:00Z',
        },
        {
          id: 'log_2',
          user_id: 'user_123',
          event_type: 'payment_completed',
          event_data: { payment_id: 'payment_123' },
          ip_address: '192.168.1.1',
          user_agent: 'Mozilla/5.0',
          created_at: '2024-01-01T00:01:00Z',
        },
      ];

      // Mock query to return audit logs
      const query = createMockQuery({
        data: mockLogs,
        error: null,
      });
      mockSupabase.from.mockReturnValueOnce(query);

      const result = await auditLogService.getAuditLogs('user_123');

      expect(mockSupabase.from).toHaveBeenCalledWith('audit_logs');
      expect(query.eq).toHaveBeenCalledWith('user_id', 'user_123');
      expect(query.order).toHaveBeenCalledWith('created_at', {
        ascending: false,
      });
      expect(result).toEqual(mockLogs);
    });

    it('should handle empty results', async () => {
      // Mock query to return empty array
      const query = createMockQuery({
        data: [],
        error: null,
      });
      mockSupabase.from.mockReturnValueOnce(query);

      const result = await auditLogService.getAuditLogs('payment_123');

      expect(result).toEqual([]);
    });

    it('should handle database errors', async () => {
      // Mock select to return error
      const selectQuery = createMockQuery({
        data: null,
        error: { message: 'Database error' },
      });
      mockSupabase.from.mockReturnValueOnce(selectQuery);

      await expect(auditLogService.getAuditLogs('user_123')).rejects.toThrow(
        'Failed to get audit logs'
      );
    });
  });

  describe('getUserAuditLogs', () => {
    it('should retrieve user audit logs', async () => {
      const mockLogs = [
        {
          id: 'log_1',
          event_type: 'payment_created',
          user_id: 'user_123',
          event_data: undefined,
          ip_address: undefined,
          user_agent: undefined,
          created_at: undefined,
        },
      ];

      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        range: jest.fn().mockReturnThis(),
        then: jest.fn().mockImplementation(resolve => {
          if (resolve) {
            return Promise.resolve(resolve({ data: mockLogs, error: null }));
          }
          return Promise.resolve({ data: mockLogs, error: null });
        }),
      };
      mockSupabase.from.mockReturnValueOnce(mockQuery);

      const result = await auditLogService.getUserAuditLogs('user_123', 10);

      expect(mockSupabase.from).toHaveBeenCalledWith('audit_logs');
      expect(mockQuery.eq).toHaveBeenCalledWith('user_id', 'user_123');
      expect(mockQuery.range).toHaveBeenCalledWith(0, 9);
      expect(result).toEqual(mockLogs);
    });
  });

  describe('getAuditLogsByDateRange', () => {
    it('should retrieve audit logs by date range', async () => {
      const startDate = '2024-01-01T00:00:00Z';
      const endDate = '2024-01-31T23:59:59Z';
      const mockLogs = [
        {
          id: 'log_1',
          event_type: 'payment_created',
          user_id: 'user_123',
          event_data: undefined,
          ip_address: undefined,
          user_agent: undefined,
          created_at: undefined,
        },
      ];

      const mockQuery = createMockQuery({
        data: mockLogs,
        error: null,
      });
      mockSupabase.from.mockReturnValueOnce(mockQuery);

      const result = await auditLogService.getAuditLogsByDateRange(
        startDate,
        endDate
      );

      expect(mockSupabase.from).toHaveBeenCalledWith('audit_logs');
      expect(mockQuery.gte).toHaveBeenCalledWith('created_at', startDate);
      expect(mockQuery.lte).toHaveBeenCalledWith('created_at', endDate);
      expect(result).toEqual(mockLogs);
    });
  });

  describe('searchAuditLogs', () => {
    it('should search audit logs by event type', async () => {
      const mockLogs = [
        {
          id: 'log_1',
          event_type: 'payment_created',
          user_id: 'user_123',
          payment_id: 'payment_123',
          timestamp: '2024-01-01T00:00:00Z',
        },
      ];

      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        gte: jest.fn().mockReturnThis(),
        lte: jest.fn().mockReturnThis(),
        then: jest.fn().mockImplementation(resolve => {
          if (resolve) {
            return Promise.resolve(resolve({ data: mockLogs, error: null }));
          }
          return Promise.resolve({ data: mockLogs, error: null });
        }),
      };
      mockSupabase.from.mockReturnValueOnce(mockQuery);

      const result = await auditLogService.searchAuditLogs({
        event_type: 'payment_created',
        user_id: 'user_123',
      });

      expect(mockSupabase.from).toHaveBeenCalledWith('payment_audit_logs');
      expect(mockQuery.eq).toHaveBeenCalledWith(
        'event_type',
        'payment_created'
      );
      expect(mockQuery.eq).toHaveBeenCalledWith('user_id', 'user_123');
      expect(result).toEqual(mockLogs);
    });
  });

  describe('deleteOldAuditLogs', () => {
    it('should delete old audit logs', async () => {
      const cutoffDate = '2023-01-01T00:00:00Z';

      const mockQuery = {
        delete: jest.fn().mockReturnThis(),
        lt: jest.fn().mockReturnThis(),
        then: jest.fn().mockImplementation(resolve => {
          if (resolve) {
            return Promise.resolve(resolve({ data: null, error: null }));
          }
          return Promise.resolve({ data: null, error: null });
        }),
      };
      mockSupabase.from.mockReturnValueOnce(mockQuery);

      await auditLogService.deleteOldAuditLogs(cutoffDate);

      expect(mockSupabase.from).toHaveBeenCalledWith('payment_audit_logs');
      expect(mockQuery.lt).toHaveBeenCalledWith('timestamp', cutoffDate);
    });

    it('should handle deletion errors', async () => {
      const cutoffDate = '2023-01-01T00:00:00Z';

      const mockQuery = {
        delete: jest.fn().mockReturnThis(),
        lt: jest.fn().mockReturnThis(),
        then: jest.fn().mockImplementation(resolve => {
          if (resolve) {
            return Promise.resolve(
              resolve({ data: null, error: { message: 'Deletion error' } })
            );
          }
          return Promise.resolve({
            data: null,
            error: { message: 'Deletion error' },
          });
        }),
      };
      mockSupabase.from.mockReturnValueOnce(mockQuery);

      await expect(
        auditLogService.deleteOldAuditLogs(cutoffDate)
      ).rejects.toThrow('Failed to delete old audit logs');
    });
  });

  describe('getAuditLogStatistics', () => {
    it('should get audit log statistics', async () => {
      const mockStats = {
        total_events: 100,
        events_by_type: {
          payment_created: 50,
          payment_completed: 30,
          payment_failed: 20,
        },
        events_by_user: {
          user_123: 60,
          user_456: 40,
        },
      };

      const mockQuery = createMockQuery({
        data: [
          {
            id: 'log_1',
            event_type: 'payment_created',
            user_id: 'user_123',
            created_at: '2024-01-01T00:00:00Z',
          },
          {
            id: 'log_2',
            event_type: 'payment_completed',
            user_id: 'user_123',
            created_at: '2024-01-01T01:00:00Z',
          },
          {
            id: 'log_3',
            event_type: 'payment_failed',
            user_id: 'user_456',
            created_at: '2024-01-01T02:00:00Z',
          },
        ],
        error: null,
      });
      mockSupabase.from.mockReturnValueOnce(mockQuery);

      const result = await auditLogService.getAuditLogStatistics();

      expect(mockSupabase.from).toHaveBeenCalledWith('audit_logs');
      expect(mockQuery.select).toHaveBeenCalledWith('*');
      expect(result).toEqual({
        total_logs: 3,
        event_types: {
          payment_created: 1,
          payment_completed: 1,
          payment_failed: 1,
        },
        recent_activity: 0, // No logs from last 24 hours
        security_events: 1, // payment_failed is a security event
      });
    });
  });
});
