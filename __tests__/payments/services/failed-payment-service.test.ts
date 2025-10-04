/**
 * Failed Payment Service Unit Tests
 * Comprehensive testing for failed payment handling and recovery
 */

import { FailedPaymentService } from '@/lib/payments/failed-payment-service';
import { createClient } from '@/lib/supabase/server';

// Mock Supabase client
jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(),
}));

describe('FailedPaymentService', () => {
  let failedPaymentService: FailedPaymentService;
  let mockSupabase: any;

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock Supabase client
    mockSupabase = {
      from: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      gte: jest.fn().mockReturnThis(),
      lte: jest.fn().mockReturnThis(),
      lt: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      single: jest.fn(),
      not: jest.fn().mockReturnThis(),
    };

    (createClient as jest.Mock).mockReturnValue(mockSupabase);
    failedPaymentService = new FailedPaymentService();
  });

  describe('createFailedPayment', () => {
    it('should create failed payment record successfully', async () => {
      const paymentId = 'payment_123';
      const failureReason = 'Card declined';
      const gracePeriodDays = 7;

      const mockFailedPayment = {
        id: 'failed_payment_123',
        payment_id: paymentId,
        failure_count: 1,
        grace_period_end: '2024-01-08T00:00:00Z',
        notification_sent_days: [],
        retry_attempts: 0,
        created_at: '2024-01-01T00:00:00Z',
      };

      mockSupabase.single.mockResolvedValue({
        data: mockFailedPayment,
        error: null,
      });

      const result = await failedPaymentService.createFailedPayment(
        paymentId,
        failureReason,
        gracePeriodDays
      );

      expect(mockSupabase.from).toHaveBeenCalledWith('failed_payments');
      expect(mockSupabase.insert).toHaveBeenCalledWith({
        payment_id: paymentId,
        failure_count: 1,
        grace_period_end: expect.any(String),
        notification_sent_days: [],
        retry_attempts: 0,
      });
      expect(result).toEqual(mockFailedPayment);
    });

    it('should handle database errors during creation', async () => {
      const paymentId = 'payment_123';
      const failureReason = 'Card declined';

      const dbError = { message: 'Database connection failed' };
      mockSupabase.single.mockResolvedValue({
        data: null,
        error: dbError,
      });

      await expect(
        failedPaymentService.createFailedPayment(paymentId, failureReason)
      ).rejects.toThrow(
        'Failed to create failed payment: Database connection failed'
      );
    });
  });

  describe('getFailedPayments', () => {
    it('should retrieve failed payments successfully', async () => {
      const userId = 'user_123';
      const mockFailedPayments = [
        {
          id: 'failed_payment_1',
          payment_id: 'payment_1',
          failure_count: 1,
          grace_period_end: '2024-01-08T00:00:00Z',
          status: 'active',
        },
        {
          id: 'failed_payment_2',
          payment_id: 'payment_2',
          failure_count: 2,
          grace_period_end: '2024-01-05T00:00:00Z',
          status: 'expired',
        },
      ];

      // Mock the final method in the chain to return the data
      mockSupabase.order = jest.fn().mockResolvedValue({
        data: mockFailedPayments,
        error: null,
      });

      const result = await failedPaymentService.getFailedPayments(userId);

      expect(mockSupabase.from).toHaveBeenCalledWith('failed_payments');
      expect(mockSupabase.select).toHaveBeenCalledWith('*');
      expect(mockSupabase.eq).toHaveBeenCalledWith('user_id', userId);
      expect(result).toEqual(mockFailedPayments);
    });

    it('should return empty array when no failed payments found', async () => {
      const userId = 'user_nonexistent';

      // Mock the final method in the chain to return empty data
      mockSupabase.order = jest.fn().mockResolvedValue({
        data: [],
        error: null,
      });

      const result = await failedPaymentService.getFailedPayments(userId);

      expect(result).toEqual([]);
    });

    it('should handle database errors during retrieval', async () => {
      const userId = 'user_123';
      const dbError = { message: 'Database connection failed' };

      mockSupabase.select.mockResolvedValue({
        data: null,
        error: dbError,
      });

      await expect(
        failedPaymentService.getFailedPayments(userId)
      ).rejects.toThrow(
        'Failed to retrieve failed payments: Database connection failed'
      );
    });
  });

  describe('getFailedPayment', () => {
    it('should retrieve failed payment by ID successfully', async () => {
      const failedPaymentId = 'failed_payment_123';
      const mockFailedPayment = {
        id: failedPaymentId,
        payment_id: 'payment_123',
        failure_count: 1,
        grace_period_end: '2024-01-08T00:00:00Z',
        status: 'active',
      };

      mockSupabase.single.mockResolvedValue({
        data: mockFailedPayment,
        error: null,
      });

      const result =
        await failedPaymentService.getFailedPayment(failedPaymentId);

      expect(mockSupabase.from).toHaveBeenCalledWith('failed_payments');
      expect(mockSupabase.select).toHaveBeenCalledWith('*');
      expect(mockSupabase.eq).toHaveBeenCalledWith('id', failedPaymentId);
      expect(result).toEqual(mockFailedPayment);
    });

    it('should return null when failed payment not found', async () => {
      const failedPaymentId = 'failed_payment_nonexistent';

      mockSupabase.single.mockResolvedValue({
        data: null,
        error: { code: 'PGRST116', message: 'No rows found' },
      });

      const result =
        await failedPaymentService.getFailedPayment(failedPaymentId);

      expect(result).toBeNull();
    });
  });

  describe('updateFailedPayment', () => {
    it('should update failed payment successfully', async () => {
      const failedPaymentId = 'failed_payment_123';
      const updateData = {
        failure_count: 2,
        retry_attempts: 1,
        notification_sent_days: [3, 6],
      };

      const mockUpdatedFailedPayment = {
        id: failedPaymentId,
        ...updateData,
        updated_at: '2024-01-01T00:00:00Z',
      };

      mockSupabase.single.mockResolvedValue({
        data: mockUpdatedFailedPayment,
        error: null,
      });

      const result = await failedPaymentService.updateFailedPayment(
        failedPaymentId,
        updateData
      );

      expect(mockSupabase.from).toHaveBeenCalledWith('failed_payments');
      expect(mockSupabase.update).toHaveBeenCalledWith({
        ...updateData,
        updated_at: expect.any(String),
      });
      expect(mockSupabase.eq).toHaveBeenCalledWith('id', failedPaymentId);
      expect(result).toEqual(mockUpdatedFailedPayment);
    });

    it('should handle database errors during update', async () => {
      const failedPaymentId = 'failed_payment_123';
      const updateData = { failure_count: 2 };

      const dbError = { message: 'Update failed' };
      mockSupabase.single.mockResolvedValue({
        data: null,
        error: dbError,
      });

      await expect(
        failedPaymentService.updateFailedPayment(failedPaymentId, updateData)
      ).rejects.toThrow('Failed to update failed payment: Update failed');
    });
  });

  describe('incrementFailureCount', () => {
    it('should increment failure count successfully', async () => {
      const failedPaymentId = 'failed_payment_123';
      const currentCount = 1;

      const mockUpdatedFailedPayment = {
        id: failedPaymentId,
        failure_count: currentCount + 1,
        updated_at: '2024-01-01T00:00:00Z',
      };

      mockSupabase.single.mockResolvedValue({
        data: mockUpdatedFailedPayment,
        error: null,
      });

      const result =
        await failedPaymentService.incrementFailureCount(failedPaymentId);

      expect(mockSupabase.from).toHaveBeenCalledWith('failed_payments');
      expect(mockSupabase.update).toHaveBeenCalledWith({
        failure_count: expect.any(Number),
        updated_at: expect.any(String),
      });
      expect(mockSupabase.eq).toHaveBeenCalledWith('id', failedPaymentId);
      expect(result).toEqual(mockUpdatedFailedPayment);
    });
  });

  describe('addNotificationSentDay', () => {
    it('should add notification sent day successfully', async () => {
      const failedPaymentId = 'failed_payment_123';
      const day = 3;
      const currentDays = [1, 2];

      const mockUpdatedFailedPayment = {
        id: failedPaymentId,
        notification_sent_days: [...currentDays, day],
        updated_at: '2024-01-01T00:00:00Z',
      };

      mockSupabase.single.mockResolvedValue({
        data: mockUpdatedFailedPayment,
        error: null,
      });

      const result = await failedPaymentService.addNotificationSentDay(
        failedPaymentId,
        day
      );

      expect(mockSupabase.from).toHaveBeenCalledWith('failed_payments');
      expect(mockSupabase.update).toHaveBeenCalledWith({
        notification_sent_days: expect.arrayContaining([day]),
        updated_at: expect.any(String),
      });
      expect(result).toEqual(mockUpdatedFailedPayment);
    });
  });

  describe('incrementRetryAttempts', () => {
    it('should increment retry attempts successfully', async () => {
      const failedPaymentId = 'failed_payment_123';
      const currentAttempts = 1;

      const mockUpdatedFailedPayment = {
        id: failedPaymentId,
        retry_attempts: currentAttempts + 1,
        updated_at: '2024-01-01T00:00:00Z',
      };

      mockSupabase.single.mockResolvedValue({
        data: mockUpdatedFailedPayment,
        error: null,
      });

      const result =
        await failedPaymentService.incrementRetryAttempts(failedPaymentId);

      expect(mockSupabase.from).toHaveBeenCalledWith('failed_payments');
      expect(mockSupabase.update).toHaveBeenCalledWith({
        retry_attempts: expect.any(Number),
        updated_at: expect.any(String),
      });
      expect(mockSupabase.eq).toHaveBeenCalledWith('id', failedPaymentId);
      expect(result).toEqual(mockUpdatedFailedPayment);
    });
  });

  describe('getExpiredFailedPayments', () => {
    it('should retrieve expired failed payments successfully', async () => {
      const mockExpiredPayments = [
        {
          id: 'failed_payment_1',
          payment_id: 'payment_1',
          grace_period_end: '2024-01-01T00:00:00Z',
          status: 'expired',
        },
        {
          id: 'failed_payment_2',
          payment_id: 'payment_2',
          grace_period_end: '2024-01-02T00:00:00Z',
          status: 'expired',
        },
      ];

      // Mock the final method in the chain to return the data
      mockSupabase.order = jest.fn().mockResolvedValue({
        data: mockExpiredPayments,
        error: null,
      });

      const result = await failedPaymentService.getExpiredFailedPayments();

      expect(mockSupabase.from).toHaveBeenCalledWith('failed_payments');
      expect(mockSupabase.select).toHaveBeenCalledWith('*');
      expect(mockSupabase.lt).toHaveBeenCalledWith(
        'grace_period_end',
        expect.any(String)
      );
      expect(result).toEqual(mockExpiredPayments);
    });

    it('should return empty array when no expired payments found', async () => {
      // Mock the final method in the chain to return empty data
      mockSupabase.order = jest.fn().mockResolvedValue({
        data: [],
        error: null,
      });

      const result = await failedPaymentService.getExpiredFailedPayments();

      expect(result).toEqual([]);
    });
  });

  describe('getFailedPaymentsRequiringNotification', () => {
    it('should retrieve failed payments requiring notification successfully', async () => {
      const day = 3;
      const mockPaymentsRequiringNotification = [
        {
          id: 'failed_payment_1',
          payment_id: 'payment_1',
          failure_count: 1,
          grace_period_end: '2024-01-08T00:00:00Z',
          notification_sent_days: [],
        },
        {
          id: 'failed_payment_2',
          payment_id: 'payment_2',
          failure_count: 1,
          grace_period_end: '2024-01-08T00:00:00Z',
          notification_sent_days: [1, 2],
        },
      ];

      // Mock the final method in the chain to return the data
      mockSupabase.order = jest.fn().mockResolvedValue({
        data: mockPaymentsRequiringNotification,
        error: null,
      });

      const result =
        await failedPaymentService.getFailedPaymentsRequiringNotification(day);

      expect(mockSupabase.from).toHaveBeenCalledWith('failed_payments');
      expect(mockSupabase.select).toHaveBeenCalledWith('*');
      expect(mockSupabase.not).toHaveBeenCalledWith(
        'notification_sent_days',
        'cs',
        `{${day}}`
      );
      expect(result).toEqual(mockPaymentsRequiringNotification);
    });
  });

  describe('resolveFailedPayment', () => {
    it('should resolve failed payment successfully', async () => {
      const failedPaymentId = 'failed_payment_123';
      const resolution = 'payment_succeeded';

      const mockResolvedFailedPayment = {
        id: failedPaymentId,
        status: 'resolved',
        resolution,
        updated_at: '2024-01-01T00:00:00Z',
      };

      mockSupabase.single.mockResolvedValue({
        data: mockResolvedFailedPayment,
        error: null,
      });

      const result = await failedPaymentService.resolveFailedPayment(
        failedPaymentId,
        resolution
      );

      expect(mockSupabase.from).toHaveBeenCalledWith('failed_payments');
      expect(mockSupabase.update).toHaveBeenCalledWith({
        status: 'resolved',
        resolution,
        updated_at: expect.any(String),
      });
      expect(mockSupabase.eq).toHaveBeenCalledWith('id', failedPaymentId);
      expect(result).toEqual(mockResolvedFailedPayment);
    });
  });

  describe('deleteFailedPayment', () => {
    it('should delete failed payment successfully', async () => {
      const failedPaymentId = 'failed_payment_123';

      // Mock the delete method to return success
      mockSupabase.delete = jest.fn().mockReturnThis();
      mockSupabase.eq = jest.fn().mockResolvedValue({
        data: null,
        error: null,
      });

      const result =
        await failedPaymentService.deleteFailedPayment(failedPaymentId);

      expect(mockSupabase.from).toHaveBeenCalledWith('failed_payments');
      expect(mockSupabase.delete).toHaveBeenCalled();
      expect(mockSupabase.eq).toHaveBeenCalledWith('id', failedPaymentId);
      expect(result).toBe(true);
    });

    it('should handle database errors during deletion', async () => {
      const failedPaymentId = 'failed_payment_123';
      const dbError = { message: 'Delete failed' };

      mockSupabase.delete.mockResolvedValue({
        data: null,
        error: dbError,
      });

      await expect(
        failedPaymentService.deleteFailedPayment(failedPaymentId)
      ).rejects.toThrow('Failed to delete failed payment: Delete failed');
    });
  });

  describe('getFailedPaymentStatistics', () => {
    it('should retrieve failed payment statistics successfully', async () => {
      const userId = 'user_123';
      const mockStats = {
        total_failed_payments: 5,
        active_failed_payments: 4, // 4 records with resolution: null
        expired_failed_payments: 5, // 5 records with grace_period_end < now
        average_failure_count: 1.4, // (1+2+1+2+1)/5 = 1.4
        total_retry_attempts: 8, // 2+3+1+2+0 = 8
      };

      // Mock the query to return sample data for statistics calculation
      const mockFailedPayments = [
        {
          id: '1',
          failure_count: 1,
          retry_attempts: 2,
          resolution: null,
          grace_period_end: '2024-01-01T00:00:00Z',
        },
        {
          id: '2',
          failure_count: 2,
          retry_attempts: 3,
          resolution: 'resolved',
          grace_period_end: '2024-01-02T00:00:00Z',
        },
        {
          id: '3',
          failure_count: 1,
          retry_attempts: 1,
          resolution: null,
          grace_period_end: '2023-12-01T00:00:00Z',
        },
        {
          id: '4',
          failure_count: 2,
          retry_attempts: 2,
          resolution: null,
          grace_period_end: '2024-01-03T00:00:00Z',
        },
        {
          id: '5',
          failure_count: 1,
          retry_attempts: 0,
          resolution: null,
          grace_period_end: '2023-11-01T00:00:00Z',
        },
      ];

      // Mock the query chain properly
      mockSupabase.select = jest.fn().mockReturnThis();
      mockSupabase.eq = jest.fn().mockResolvedValue({
        data: mockFailedPayments,
        error: null,
      });

      const result =
        await failedPaymentService.getFailedPaymentStatistics(userId);

      expect(result).toEqual(mockStats);
    });

    it('should handle database errors during statistics retrieval', async () => {
      const userId = 'user_123';
      const dbError = { message: 'Statistics query failed' };

      mockSupabase.select.mockResolvedValue({
        data: null,
        error: dbError,
      });

      await expect(
        failedPaymentService.getFailedPaymentStatistics(userId)
      ).rejects.toThrow(
        'Failed to retrieve failed payment statistics: Statistics query failed'
      );
    });
  });
});
