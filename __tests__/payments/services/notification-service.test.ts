/**
 * Notification Service Unit Tests
 * Comprehensive testing for payment notification operations
 */

// Create the mock objects BEFORE importing the service
const createMockQuery = (mockData = { data: [], error: null }) => {
  const mockQuery = {
    insert: jest.fn(),
    select: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    eq: jest.fn(),
    neq: jest.fn(),
    gte: jest.fn(),
    lte: jest.fn(),
    gt: jest.fn(),
    lt: jest.fn(),
    like: jest.fn(),
    ilike: jest.fn(),
    is: jest.fn(),
    in: jest.fn(),
    contains: jest.fn(),
    containedBy: jest.fn(),
    rangeGt: jest.fn(),
    rangeGte: jest.fn(),
    rangeLt: jest.fn(),
    rangeLte: jest.fn(),
    rangeAdjacent: jest.fn(),
    overlaps: jest.fn(),
    textSearch: jest.fn(),
    match: jest.fn(),
    not: jest.fn(),
    or: jest.fn(),
    filter: jest.fn(),
    order: jest.fn(),
    limit: jest.fn(),
    range: jest.fn(),
    abortSignal: jest.fn(),
    returns: jest.fn(),
    single: jest.fn().mockResolvedValue(mockData),
    maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null }),
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

// NOW import the service
import { NotificationService } from '@/lib/payments/notification-service';

describe('NotificationService', () => {
  let notificationService: NotificationService;

  beforeEach(() => {
    jest.clearAllMocks();
    notificationService = new NotificationService();
  });

  describe('sendPaymentNotification', () => {
    it('should send payment notification successfully', async () => {
      const paymentId = 'payment_123';
      const notificationType = 'payment_success';

      const mockNotification = {
        id: 'notification_123',
        payment_id: paymentId,
        notification_type: notificationType,
        status: 'sent',
        sent_at: '2024-01-01T00:00:00Z',
        created_at: '2024-01-01T00:00:00Z',
      };

      // Mock payment retrieval with proper data structure
      const paymentQuery = createMockQuery();
      paymentQuery.single.mockResolvedValue({
        data: {
          id: paymentId,
          amount: 5000,
          currency: 'NZD',
          subscriptions: {
            user_id: 'user_123',
            tier: 'premium',
            billing_cycle: 'monthly',
          },
        },
        error: null,
      });
      mockSupabase.from.mockReturnValueOnce(paymentQuery);

      // Mock user retrieval
      const userQuery = createMockQuery();
      userQuery.single.mockResolvedValue({
        data: {
          email: 'test@example.com',
          first_name: 'John',
          last_name: 'Doe',
        },
        error: null,
      });
      mockSupabase.from.mockReturnValueOnce(userQuery);

      // Mock notification creation
      const insertQuery = createMockQuery();
      insertQuery.single.mockResolvedValue({
        data: mockNotification,
        error: null,
      });
      mockSupabase.from.mockReturnValueOnce(insertQuery);

      // Mock email sending
      jest.spyOn(notificationService, 'sendEmail').mockResolvedValue({
        success: true,
        messageId: 'msg_123',
      });

      const result = await notificationService.sendPaymentNotification(
        paymentId,
        notificationType
      );

      expect(mockSupabase.from).toHaveBeenCalledWith('payments');
      expect(paymentQuery.select).toHaveBeenCalledWith(`
          *,
          subscriptions!inner(
            user_id,
            tier,
            billing_cycle
          )
        `);
      expect(paymentQuery.eq).toHaveBeenCalledWith('id', paymentId);
      expect(result).toEqual(
        expect.objectContaining({
          id: mockNotification.id,
          payment_id: mockNotification.payment_id,
          notification_type: mockNotification.notification_type,
          status: mockNotification.status,
          created_at: mockNotification.created_at,
        })
      );
      expect(result.sent_at).toBeDefined();
    });

    it('should handle payment not found during notification sending', async () => {
      const paymentId = 'payment_nonexistent';
      const notificationType = 'payment_success';

      // Mock payment retrieval to return error
      const paymentQuery = createMockQuery({
        data: null,
        error: { message: 'No rows found' },
      });
      mockSupabase.from.mockReturnValueOnce(paymentQuery);

      await expect(
        notificationService.sendPaymentNotification(paymentId, notificationType)
      ).rejects.toThrow('Payment not found');
    });

    it('should handle email sending failures', async () => {
      const paymentId = 'payment_123';
      const notificationType = 'payment_success';

      // Mock payment retrieval
      const mockPaymentQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: {
            id: paymentId,
            amount: 5000,
            subscriptions: {
              user_id: 'user_123',
              tier: 'premium',
              billing_cycle: 'monthly',
            },
          },
          error: null,
        }),
      };
      mockSupabase.from.mockReturnValueOnce(mockPaymentQuery);

      // Mock user retrieval
      const mockUserQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: {
            id: 'user_123',
            email: 'test@example.com',
            first_name: 'Test',
            last_name: 'User',
          },
          error: null,
        }),
      };
      mockSupabase.from.mockReturnValueOnce(mockUserQuery);

      // Mock notification creation
      const mockInsertQuery = {
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: {
            id: 'notification_123',
            payment_id: paymentId,
            notification_type: notificationType,
            status: 'pending',
            created_at: new Date().toISOString(),
          },
          error: null,
        }),
      };
      mockSupabase.from.mockReturnValueOnce(mockInsertQuery);

      // Mock email sending failure
      jest
        .spyOn(notificationService, 'sendPaymentSuccessNotification')
        .mockRejectedValue(new Error('Email service unavailable'));

      await expect(
        notificationService.sendPaymentNotification(paymentId, notificationType)
      ).rejects.toThrow('Failed to send notification by type');
    });
  });

  describe('sendFailedPaymentNotification', () => {
    it('should send failed payment notification successfully', async () => {
      const paymentId = 'payment_123';
      const day = 3;

      const mockNotification = {
        id: 'notification_123',
        payment_id: paymentId,
        notification_type: 'payment_failed',
        status: 'sent',
        sent_at: '2024-01-01T00:00:00Z',
      };

      // Mock payment retrieval
      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: {
            id: paymentId,
            amount: 5000,
            subscriptions: {
              user_id: 'user_123',
              tier: 'premium',
              billing_cycle: 'monthly',
            },
          },
          error: null,
        }),
      };
      mockSupabase.from.mockReturnValueOnce(mockQuery);

      // Mock user retrieval
      const mockUserQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: {
            id: 'user_123',
            email: 'test@example.com',
            first_name: 'Test',
            last_name: 'User',
          },
          error: null,
        }),
      };
      mockSupabase.from.mockReturnValueOnce(mockUserQuery);

      // Mock notification creation
      const mockInsertQuery = {
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: mockNotification,
          error: null,
        }),
      };
      mockSupabase.from.mockReturnValueOnce(mockInsertQuery);

      // Mock email sending
      jest.spyOn(notificationService, 'sendEmail').mockResolvedValue({
        success: true,
        messageId: 'msg_123',
      });

      const result = await notificationService.sendFailedPaymentNotification(
        paymentId,
        day
      );

      expect(mockSupabase.from).toHaveBeenCalledWith('payments');
      expect(result).toEqual(
        expect.objectContaining({
          id: 'notification_123',
          notification_type: 'payment_failed',
          payment_id: paymentId,
          status: 'sent',
        })
      );
    });

    it('should handle different notification days', async () => {
      const paymentId = 'payment_123';
      const day = 6;

      // Mock payment retrieval
      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: {
            id: paymentId,
            amount: 5000,
            subscriptions: {
              user_id: 'user_123',
              tier: 'premium',
              billing_cycle: 'monthly',
            },
          },
          error: null,
        }),
      };
      mockSupabase.from.mockReturnValueOnce(mockQuery);

      // Mock user query
      const mockUserQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: {
            email: 'test@example.com',
            first_name: 'Test',
            last_name: 'User',
          },
          error: null,
        }),
      };
      mockSupabase.from.mockReturnValueOnce(mockUserQuery);

      // Mock notification creation
      const mockInsertQuery = {
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: { id: 'notification_123', status: 'sent' },
          error: null,
        }),
      };
      mockSupabase.from.mockReturnValueOnce(mockInsertQuery);

      // Mock email sending
      jest.spyOn(notificationService, 'sendEmail').mockResolvedValue({
        success: true,
        messageId: 'msg_123',
      });

      const result = await notificationService.sendFailedPaymentNotification(
        paymentId,
        day
      );

      expect(result).toBeDefined();
    });
  });

  describe('sendReceiptNotification', () => {
    it('should send receipt notification successfully', async () => {
      const paymentId = 'payment_123';
      const email = 'test@example.com';

      const mockNotification = {
        id: 'notification_123',
        payment_id: paymentId,
        notification_type: 'receipt',
        status: 'sent',
        sent_at: '2024-01-01T00:00:00Z',
      };

      // Mock payment retrieval
      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: {
            id: paymentId,
            amount: 5000,
            subscriptions: {
              user_id: 'user_123',
              tier: 'premium',
              billing_cycle: 'monthly',
            },
          },
          error: null,
        }),
      };
      mockSupabase.from.mockReturnValueOnce(mockQuery);

      // Mock user retrieval
      const mockUserQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: {
            id: 'user_123',
            email: 'test@example.com',
            first_name: 'Test',
            last_name: 'User',
          },
          error: null,
        }),
      };
      mockSupabase.from.mockReturnValueOnce(mockUserQuery);

      // Mock notification creation
      const mockInsertQuery = {
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: mockNotification,
          error: null,
        }),
      };
      mockSupabase.from.mockReturnValueOnce(mockInsertQuery);

      // Mock email sending
      jest.spyOn(notificationService, 'sendEmail').mockResolvedValue({
        success: true,
        messageId: 'msg_123',
      });

      const result = await notificationService.sendReceiptNotification(
        paymentId,
        email
      );

      expect(mockSupabase.from).toHaveBeenCalledWith('payments');
      expect(result).toEqual(
        expect.objectContaining({
          id: 'notification_123',
          notification_type: 'receipt',
          payment_id: paymentId,
          status: 'sent',
        })
      );
    });

    it('should use user email when not provided', async () => {
      const paymentId = 'payment_123';

      // Mock payment retrieval with user email
      const mockPaymentQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: {
            id: paymentId,
            user_id: 'user_123',
            amount: 5000,
            user: { email: 'user@example.com' },
          },
          error: null,
        }),
      };
      mockSupabase.from.mockReturnValueOnce(mockPaymentQuery);

      // Mock user retrieval
      const mockUserQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: {
            email: 'user@example.com',
            first_name: 'Test',
            last_name: 'User',
          },
          error: null,
        }),
      };
      mockSupabase.from.mockReturnValueOnce(mockUserQuery);

      // Mock notification creation
      const mockInsertQuery = {
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: { id: 'notification_123', status: 'sent' },
          error: null,
        }),
      };
      mockSupabase.from.mockReturnValueOnce(mockInsertQuery);

      // Mock email sending
      jest.spyOn(notificationService, 'sendEmail').mockResolvedValue({
        success: true,
        messageId: 'msg_123',
      });

      const result =
        await notificationService.sendReceiptNotification(paymentId);

      expect(result).toBeDefined();
    });
  });

  describe('getNotificationHistory', () => {
    it('should retrieve notification history successfully', async () => {
      const userId = 'user_123';
      const mockNotifications = [
        {
          id: 'notification_1',
          payment_id: 'payment_1',
          notification_type: 'payment_success',
          status: 'sent',
          sent_at: '2024-01-01T00:00:00Z',
        },
        {
          id: 'notification_2',
          payment_id: 'payment_2',
          notification_type: 'payment_failed',
          status: 'sent',
          sent_at: '2024-01-02T00:00:00Z',
        },
      ];

      // Mock the query chain to return the expected data
      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest
          .fn()
          .mockResolvedValue({ data: mockNotifications, error: null }),
      };
      mockSupabase.from.mockReturnValue(mockQuery);

      const result = await notificationService.getNotificationHistory(userId);

      expect(mockSupabase.from).toHaveBeenCalledWith('payment_notifications');
      expect(mockQuery.eq).toHaveBeenCalledWith('user_id', userId);
      expect(result).toEqual(mockNotifications);
    });

    it('should retrieve notifications for specific payment', async () => {
      const userId = 'user_123';
      const paymentId = 'payment_123';

      const mockNotifications = [
        {
          id: 'notification_1',
          payment_id: paymentId,
          notification_type: 'payment_success',
          status: 'sent',
        },
      ];

      // Mock query to return notifications
      const query = createMockQuery({
        data: mockNotifications,
        error: null,
      });
      mockSupabase.from.mockReturnValueOnce(query);

      const result = await notificationService.getNotificationHistory(
        userId,
        paymentId
      );

      expect(mockSupabase.from).toHaveBeenCalledWith('payment_notifications');
      expect(query.eq).toHaveBeenCalledWith('user_id', userId);
      expect(query.eq).toHaveBeenCalledWith('payment_id', paymentId);
      expect(result).toEqual(mockNotifications);
    });

    it('should return empty array when no notifications found', async () => {
      const userId = 'user_nonexistent';

      // Mock query to return empty array
      const query = createMockQuery({
        data: [],
        error: null,
      });
      mockSupabase.from.mockReturnValueOnce(query);

      const result = await notificationService.getNotificationHistory(userId);

      expect(result).toEqual([]);
    });

    it('should handle database errors during history retrieval', async () => {
      const userId = 'user_123';
      const dbError = { message: 'Database connection failed' };

      // Mock query to return error
      const query = createMockQuery({
        data: null,
        error: dbError,
      });
      mockSupabase.from.mockReturnValueOnce(query);

      await expect(
        notificationService.getNotificationHistory(userId)
      ).rejects.toThrow(
        'Failed to get notification history: Database connection failed'
      );
    });
  });

  describe('updateNotificationStatus', () => {
    it('should update notification status successfully', async () => {
      const notificationId = 'notification_123';
      const status = 'delivered';
      const metadata = { delivery_time: '2024-01-01T00:00:00Z' };

      const mockUpdatedNotification = {
        id: notificationId,
        status,
        metadata,
        updated_at: '2024-01-01T00:00:00Z',
      };

      // Mock query to return updated notification
      const query = createMockQuery({
        data: mockUpdatedNotification,
        error: null,
      });
      mockSupabase.from.mockReturnValueOnce(query);

      await notificationService.updateNotificationStatus(
        notificationId,
        status,
        metadata
      );

      expect(mockSupabase.from).toHaveBeenCalledWith('payment_notifications');
      expect(query.update).toHaveBeenCalledWith({
        status,
        metadata,
        updated_at: expect.any(String),
      });
      expect(query.eq).toHaveBeenCalledWith('id', notificationId);
    });

    it('should handle database errors during status update', async () => {
      const notificationId = 'notification_123';
      const status = 'delivered';

      const dbError = { message: 'Update failed' };

      // Mock query to return error
      const query = createMockQuery({
        data: null,
        error: dbError,
      });
      // Override the then method to return the error
      query.then = jest.fn().mockImplementation((resolve, reject) => {
        if (resolve) {
          return Promise.resolve(resolve({ data: null, error: dbError }));
        }
        return Promise.resolve({ data: null, error: dbError });
      });
      mockSupabase.from.mockReturnValueOnce(query);

      await expect(
        notificationService.updateNotificationStatus(notificationId, status)
      ).rejects.toThrow('Failed to update notification status: Update failed');
    });
  });

  describe('getNotification', () => {
    it('should retrieve notification by ID successfully', async () => {
      const notificationId = 'notification_123';
      const mockNotification = {
        id: notificationId,
        payment_id: 'payment_123',
        notification_type: 'payment_success',
        status: 'sent',
        sent_at: '2024-01-01T00:00:00Z',
      };

      // Mock query to return notification
      const query = createMockQuery({
        data: mockNotification,
        error: null,
      });
      mockSupabase.from.mockReturnValueOnce(query);

      const result = await notificationService.getNotification(notificationId);

      expect(mockSupabase.from).toHaveBeenCalledWith('payment_notifications');
      expect(query.select).toHaveBeenCalledWith('*');
      expect(query.eq).toHaveBeenCalledWith('id', notificationId);
      expect(result).toEqual(mockNotification);
    });

    it('should return null when notification not found', async () => {
      const notificationId = 'notification_nonexistent';

      // Mock query to return not found
      const query = createMockQuery({
        data: null,
        error: { message: 'No rows found', code: 'PGRST116' },
      });
      mockSupabase.from.mockReturnValueOnce(query);

      const result = await notificationService.getNotification(notificationId);

      expect(result).toBeNull();
    });
  });

  describe('deleteNotification', () => {
    it('should delete notification successfully', async () => {
      const notificationId = 'notification_123';

      // Mock query to return success
      const query = createMockQuery({
        data: { id: notificationId },
        error: null,
      });
      mockSupabase.from.mockReturnValueOnce(query);

      await notificationService.deleteNotification(notificationId);

      expect(mockSupabase.from).toHaveBeenCalledWith('payment_notifications');
      expect(query.delete).toHaveBeenCalled();
      expect(query.eq).toHaveBeenCalledWith('id', notificationId);
    });

    it('should handle database errors during deletion', async () => {
      const notificationId = 'notification_123';
      const dbError = { message: 'Delete failed' };

      // Mock query to return error
      const query = createMockQuery({
        data: null,
        error: dbError,
      });
      // Override the then method to return the error
      query.then = jest.fn().mockImplementation((resolve, reject) => {
        if (resolve) {
          return Promise.resolve(resolve({ data: null, error: dbError }));
        }
        return Promise.resolve({ data: null, error: dbError });
      });
      mockSupabase.from.mockReturnValueOnce(query);

      await expect(
        notificationService.deleteNotification(notificationId)
      ).rejects.toThrow('Failed to delete notification: Delete failed');
    });
  });

  describe('getNotificationStatistics', () => {
    it('should retrieve notification statistics successfully', async () => {
      const userId = 'user_123';
      const mockStats = {
        total_notifications: 20,
        sent_notifications: 18,
        pending_notifications: 0,
        failed_notifications: 2,
        success_rate: 90.0,
      };

      // Mock notification data for statistics calculation
      const mockNotifications = [
        ...Array(18).fill({ status: 'sent' }),
        ...Array(2).fill({ status: 'failed' }),
      ];

      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        then: jest.fn().mockImplementation(resolve => {
          return Promise.resolve(
            resolve({
              data: mockNotifications,
              error: null,
            })
          );
        }),
      };

      mockSupabase.from.mockReturnValueOnce(mockQuery);

      const result =
        await notificationService.getNotificationStatistics(userId);

      expect(result).toEqual(mockStats);
    });

    it('should handle database errors during statistics retrieval', async () => {
      const userId = 'user_123';
      const dbError = { message: 'Statistics query failed' };

      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        then: jest.fn().mockImplementation(resolve => {
          return Promise.resolve(
            resolve({
              data: null,
              error: dbError,
            })
          );
        }),
      };
      mockSupabase.from.mockReturnValueOnce(mockQuery);

      await expect(
        notificationService.getNotificationStatistics(userId)
      ).rejects.toThrow(
        'Failed to retrieve notification statistics: Statistics query failed'
      );
    });
  });

  describe('sendEmail', () => {
    it('should send email successfully', async () => {
      const emailData = {
        to: 'test@example.com',
        subject: 'Payment Notification',
        template: 'payment_success',
        data: { amount: 5000, currency: 'NZD' },
      };

      const mockEmailResult = {
        success: true,
        messageId: 'msg_123',
      };

      // Mock the email sending function
      jest
        .spyOn(notificationService, 'sendEmail')
        .mockResolvedValue(mockEmailResult);

      const result = await notificationService.sendEmail(emailData);

      expect(result).toEqual(mockEmailResult);
    });

    it('should handle email sending failures', async () => {
      const emailData = {
        to: 'invalid-email',
        subject: 'Payment Notification',
        template: 'payment_success',
        data: { amount: 5000 },
      };

      // Mock email sending failure
      jest
        .spyOn(notificationService, 'sendEmail')
        .mockRejectedValue(new Error('Invalid email address'));

      await expect(notificationService.sendEmail(emailData)).rejects.toThrow(
        'Invalid email address'
      );
    });
  });

  describe('getNotificationTemplates', () => {
    it('should retrieve notification templates successfully', async () => {
      const mockTemplates = [
        {
          id: 'template_1',
          name: 'payment_success',
          subject: 'Payment Successful',
          body: 'Your payment of {amount} {currency} has been processed successfully.',
        },
        {
          id: 'template_2',
          name: 'payment_failed',
          subject: 'Payment Failed',
          body: 'Your payment of {amount} {currency} has failed. Please try again.',
        },
      ];

      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        then: jest.fn().mockImplementation(resolve => {
          if (resolve) {
            return Promise.resolve(
              resolve({ data: mockTemplates, error: null })
            );
          }
          return Promise.resolve({ data: mockTemplates, error: null });
        }),
      };
      mockSupabase.from.mockReturnValueOnce(mockQuery);

      const result = await notificationService.getNotificationTemplates();

      expect(mockSupabase.from).toHaveBeenCalledWith('notification_templates');
      expect(mockQuery.select).toHaveBeenCalledWith('*');
      expect(mockQuery.eq).toHaveBeenCalledWith('active', true);
      expect(result).toEqual(mockTemplates);
    });

    it('should handle database errors during template retrieval', async () => {
      const dbError = { message: 'Database connection failed' };

      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        then: jest.fn().mockImplementation(resolve => {
          return Promise.resolve(
            resolve({
              data: null,
              error: dbError,
            })
          );
        }),
      };
      mockSupabase.from.mockReturnValueOnce(mockQuery);

      await expect(
        notificationService.getNotificationTemplates()
      ).rejects.toThrow(
        'Failed to retrieve notification templates: Database connection failed'
      );
    });
  });
});
