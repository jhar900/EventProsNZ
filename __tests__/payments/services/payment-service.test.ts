/**
 * Payment Service Unit Tests
 * Comprehensive testing for payment operations and database interactions
 */

import {
  PaymentService,
  PaymentCreateData,
  Payment,
} from '@/lib/payments/payment-service';
import { createClient } from '@/lib/supabase/server';

// Mock Supabase client
jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(),
}));

describe('PaymentService', () => {
  let paymentService: PaymentService;
  let mockSupabase: any;

  beforeEach(() => {
    jest.clearAllMocks();

    // Create a simple test-specific mock
    mockSupabase = {
      from: jest.fn().mockReturnValue({
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        update: jest.fn().mockReturnThis(),
        delete: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: null, error: null }),
      }),
    };

    (createClient as jest.Mock).mockReturnValue(mockSupabase);
    paymentService = new PaymentService();
  });

  describe('createPayment', () => {
    it('should create payment successfully', async () => {
      const paymentData: PaymentCreateData = {
        subscription_id: 'sub_123',
        stripe_payment_intent_id: 'pi_123',
        amount: 2999,
        currency: 'NZD',
        status: 'succeeded',
        payment_method: 'pm_123',
        receipt_url: 'https://receipt.example.com',
      };

      const mockPayment: Payment = {
        id: 'pay_123',
        ...paymentData,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      };

      // Set up the mock chain properly
      mockSupabase.from().insert().select().single.mockResolvedValue({
        data: mockPayment,
        error: null,
      });

      const result = await paymentService.createPayment(paymentData);

      expect(result).toEqual(mockPayment);
      expect(mockSupabase.from).toHaveBeenCalledWith('payments');
    });

    it('should handle payment creation errors', async () => {
      const paymentData: PaymentCreateData = {
        subscription_id: 'sub_123',
        stripe_payment_intent_id: 'pi_123',
        amount: 2999,
        currency: 'NZD',
        status: 'succeeded',
        payment_method: 'pm_123',
      };

      // Set up the mock chain properly for error case
      mockSupabase
        .from()
        .insert()
        .select()
        .single.mockResolvedValue({
          data: null,
          error: { message: 'Database error' },
        });

      await expect(paymentService.createPayment(paymentData)).rejects.toThrow(
        'Database error'
      );
    });
  });

  describe('getPayment', () => {
    it('should retrieve payment by ID successfully', async () => {
      const paymentId = 'pay_123';
      const mockPayment: Payment = {
        id: paymentId,
        subscription_id: 'sub_123',
        stripe_payment_intent_id: 'pi_123',
        amount: 2999,
        currency: 'NZD',
        status: 'succeeded',
        payment_method: 'pm_123',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      };

      // Set up the mock chain properly
      mockSupabase.from().select().eq().single.mockResolvedValue({
        data: mockPayment,
        error: null,
      });

      const result = await paymentService.getPayment(paymentId);

      expect(result).toEqual(mockPayment);
      expect(mockSupabase.from).toHaveBeenCalledWith('payments');
    });

    it('should handle payment retrieval errors', async () => {
      const paymentId = 'pay_123';

      mockSupabase
        .from()
        .select()
        .eq()
        .single.mockResolvedValue({
          data: null,
          error: { message: 'Payment not found' },
        });

      await expect(paymentService.getPayment(paymentId)).rejects.toThrow(
        'Payment not found'
      );
    });
  });

  describe('getPaymentsBySubscription', () => {
    it('should retrieve payments by subscription ID successfully', async () => {
      const subscriptionId = 'sub_123';
      const mockPayments: Payment[] = [
        {
          id: 'pay_123',
          subscription_id: subscriptionId,
          stripe_payment_intent_id: 'pi_123',
          amount: 2999,
          currency: 'NZD',
          status: 'succeeded',
          payment_method: 'pm_123',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        },
      ];

      mockSupabase.from().select().eq().order().limit.mockResolvedValue({
        data: mockPayments,
        error: null,
      });

      const result =
        await paymentService.getPaymentsBySubscription(subscriptionId);

      expect(result).toEqual(mockPayments);
      expect(mockSupabase.from).toHaveBeenCalledWith('payments');
    });

    it('should handle subscription payments retrieval errors', async () => {
      const subscriptionId = 'sub_123';

      mockSupabase
        .from()
        .select()
        .eq()
        .order()
        .limit.mockResolvedValue({
          data: null,
          error: { message: 'Subscription not found' },
        });

      await expect(
        paymentService.getPaymentsBySubscription(subscriptionId)
      ).rejects.toThrow('Subscription not found');
    });
  });

  describe('updatePaymentStatus', () => {
    it('should update payment status successfully', async () => {
      const paymentId = 'pay_123';
      const newStatus = 'failed';
      const failureReason = 'Card declined';

      const mockUpdatedPayment: Payment = {
        id: paymentId,
        subscription_id: 'sub_123',
        stripe_payment_intent_id: 'pi_123',
        amount: 2999,
        currency: 'NZD',
        status: newStatus,
        payment_method: 'pm_123',
        failure_reason: failureReason,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      };

      mockSupabase.from().update().eq().select().single.mockResolvedValue({
        data: mockUpdatedPayment,
        error: null,
      });

      const result = await paymentService.updatePaymentStatus(
        paymentId,
        newStatus,
        failureReason
      );

      expect(result).toEqual(mockUpdatedPayment);
      expect(mockSupabase.from).toHaveBeenCalledWith('payments');
    });

    it('should handle payment status update errors', async () => {
      const paymentId = 'pay_123';
      const newStatus = 'failed';
      const failureReason = 'Card declined';

      mockSupabase
        .from()
        .update()
        .eq()
        .select()
        .single.mockResolvedValue({
          data: null,
          error: { message: 'Update failed' },
        });

      await expect(
        paymentService.updatePaymentStatus(paymentId, newStatus, failureReason)
      ).rejects.toThrow('Update failed');
    });
  });

  describe('getPaymentHistory', () => {
    it('should retrieve payment history successfully', async () => {
      const userId = 'user_123';
      const limit = 10;
      const mockPayments: Payment[] = [
        {
          id: 'pay_123',
          subscription_id: 'sub_123',
          stripe_payment_intent_id: 'pi_123',
          amount: 2999,
          currency: 'NZD',
          status: 'succeeded',
          payment_method: 'pm_123',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        },
      ];

      mockSupabase.from().select().order().limit.mockResolvedValue({
        data: mockPayments,
        error: null,
      });

      const result = await paymentService.getPaymentHistory(userId, limit);

      expect(result).toEqual(mockPayments);
      expect(mockSupabase.from).toHaveBeenCalledWith('payments');
    });

    it('should handle payment history retrieval errors', async () => {
      const userId = 'user_123';
      const limit = 10;

      mockSupabase
        .from()
        .select()
        .order()
        .limit.mockResolvedValue({
          data: null,
          error: { message: 'History not found' },
        });

      await expect(
        paymentService.getPaymentHistory(userId, limit)
      ).rejects.toThrow('History not found');
    });
  });

  describe('getPaymentByStripeIntent', () => {
    it('should retrieve payment by Stripe intent ID successfully', async () => {
      const stripePaymentIntentId = 'pi_123';
      const mockPayment: Payment = {
        id: 'pay_123',
        subscription_id: 'sub_123',
        stripe_payment_intent_id: stripePaymentIntentId,
        amount: 2999,
        currency: 'NZD',
        status: 'succeeded',
        payment_method: 'pm_123',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      };

      mockSupabase.from().select().eq().single.mockResolvedValue({
        data: mockPayment,
        error: null,
      });

      const result = await paymentService.getPaymentByStripeIntent(
        stripePaymentIntentId
      );

      expect(result).toEqual(mockPayment);
      expect(mockSupabase.from).toHaveBeenCalledWith('payments');
    });

    it('should handle payment retrieval by Stripe intent errors', async () => {
      const stripePaymentIntentId = 'pi_123';

      mockSupabase
        .from()
        .select()
        .eq()
        .single.mockResolvedValue({
          data: null,
          error: { message: 'Intent not found' },
        });

      await expect(
        paymentService.getPaymentByStripeIntent(stripePaymentIntentId)
      ).rejects.toThrow('Intent not found');
    });
  });

  describe('updatePaymentReceipt', () => {
    it('should update payment receipt URL successfully', async () => {
      const paymentId = 'pay_123';
      const receiptUrl = 'https://receipt.example.com';

      const mockUpdatedPayment: Payment = {
        id: paymentId,
        subscription_id: 'sub_123',
        stripe_payment_intent_id: 'pi_123',
        amount: 2999,
        currency: 'NZD',
        status: 'succeeded',
        payment_method: 'pm_123',
        receipt_url: receiptUrl,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      };

      mockSupabase.from().update().eq().select().single.mockResolvedValue({
        data: mockUpdatedPayment,
        error: null,
      });

      const result = await paymentService.updatePaymentReceipt(
        paymentId,
        receiptUrl
      );

      expect(result).toEqual(mockUpdatedPayment);
      expect(mockSupabase.from).toHaveBeenCalledWith('payments');
    });

    it('should handle payment receipt update errors', async () => {
      const paymentId = 'pay_123';
      const receiptUrl = 'https://receipt.example.com';

      mockSupabase
        .from()
        .update()
        .eq()
        .select()
        .single.mockResolvedValue({
          data: null,
          error: { message: 'Receipt update failed' },
        });

      await expect(
        paymentService.updatePaymentReceipt(paymentId, receiptUrl)
      ).rejects.toThrow('Receipt update failed');
    });
  });

  describe('getFailedPayments', () => {
    it('should retrieve failed payments successfully', async () => {
      const mockFailedPayments: Payment[] = [
        {
          id: 'pay_123',
          subscription_id: 'sub_123',
          stripe_payment_intent_id: 'pi_123',
          amount: 2999,
          currency: 'NZD',
          status: 'failed',
          payment_method: 'pm_123',
          failure_reason: 'Card declined',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        },
      ];

      // Mock the complex query chain
      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({
          data: mockFailedPayments,
          error: null,
        }),
      };

      mockSupabase.from.mockReturnValue(mockQuery);

      const result = await paymentService.getFailedPayments();

      expect(result).toEqual(mockFailedPayments);
      expect(mockSupabase.from).toHaveBeenCalledWith('payments');
    });

    it('should handle failed payments retrieval errors', async () => {
      // Mock the complex query chain with error
      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({
          data: null,
          error: { message: 'Failed payments not found' },
        }),
      };

      mockSupabase.from.mockReturnValue(mockQuery);

      await expect(paymentService.getFailedPayments()).rejects.toThrow(
        'Failed to get failed payments'
      );
    });
  });
});
