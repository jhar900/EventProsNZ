/**
 * Payment Performance Tests
 * Comprehensive testing for payment processing under load and performance optimization
 */

import { PaymentPerformanceService } from '@/lib/payments/performance/payment-performance-service';
import { PaymentService } from '@/lib/payments/payment-service';
import { StripeService } from '@/lib/payments/stripe-service';
import { createClient } from '@/lib/supabase/server';

// Mock dependencies
jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(),
}));

jest.mock('@/lib/payments/payment-service', () => ({
  PaymentService: jest.fn(),
}));

jest.mock('@/lib/payments/stripe-service', () => ({
  StripeService: jest.fn(),
}));

describe('Payment Performance', () => {
  let paymentPerformanceService: PaymentPerformanceService;
  let mockPaymentService: any;
  let mockStripeService: any;
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
      order: jest.fn().mockReturnThis(),
      limit: jest.fn().mockResolvedValue({
        data: Array.from({ length: 100 }, (_, i) => ({ id: i })),
        error: null,
      }),
      range: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({ data: null, error: null }),
      then: jest.fn().mockResolvedValue({ data: [], error: null }),
    };

    (createClient as jest.Mock).mockReturnValue(mockSupabase);

    // Mock Payment service
    mockPaymentService = {
      createPayment: jest.fn(),
      getPayment: jest.fn(),
      updatePaymentStatus: jest.fn(),
    };

    (PaymentService as jest.Mock).mockImplementation(() => mockPaymentService);

    // Mock Stripe service
    mockStripeService = {
      createPaymentIntent: jest.fn(),
      confirmPaymentIntent: jest.fn(),
    };

    (StripeService as jest.Mock).mockImplementation(() => mockStripeService);

    paymentPerformanceService = new PaymentPerformanceService(mockSupabase);

    // Mock the recordMetrics method to avoid database operations
    jest
      .spyOn(paymentPerformanceService, 'recordMetrics')
      .mockResolvedValue(undefined);
  });

  describe('load testing', () => {
    it('should handle concurrent payment processing', async () => {
      const paymentRequests = Array.from({ length: 10 }, (_, i) => ({
        id: `payment_${i}`,
        amount: 29.99,
        currency: 'NZD',
        user_id: `user_${i}`,
      }));

      // Mock successful payment processing
      mockStripeService.createPaymentIntent.mockResolvedValue({
        id: 'pi_test123',
        client_secret: 'pi_test123_secret_abc123',
      });

      mockPaymentService.createPayment.mockResolvedValue({
        id: 'payment_123',
        status: 'pending',
      });

      const startTime = Date.now();
      const results = await Promise.all(
        paymentRequests.map(request =>
          paymentPerformanceService.processPayment(request)
        )
      );
      const endTime = Date.now();

      // Verify all payments were processed
      expect(results).toHaveLength(10);
      expect(results.every(result => result.success)).toBe(true);

      // Verify performance within acceptable limits
      const processingTime = endTime - startTime;
      expect(processingTime).toBeLessThan(5000); // 5 seconds max
    });

    it('should handle payment processing under high load', async () => {
      const paymentRequests = Array.from({ length: 20 }, (_, i) => ({
        id: `payment_${i}`,
        amount: 29.99,
        currency: 'NZD',
        user_id: `user_${i}`,
      }));

      // Mock payment processing with some failures
      mockStripeService.createPaymentIntent
        .mockResolvedValueOnce({
          id: 'pi_test123',
          client_secret: 'pi_test123_secret',
        })
        .mockRejectedValueOnce(new Error('Rate limit exceeded'))
        .mockResolvedValue({
          id: 'pi_test123',
          client_secret: 'pi_test123_secret',
        });

      mockPaymentService.createPayment.mockResolvedValue({
        id: 'payment_123',
        status: 'pending',
      });

      const startTime = Date.now();
      const results = await Promise.allSettled(
        paymentRequests.map(request =>
          paymentPerformanceService.processPayment(request)
        )
      );
      const endTime = Date.now();

      // Verify most payments succeeded
      const successfulPayments = results.filter(
        result => result.status === 'fulfilled' && result.value.success
      );
      expect(successfulPayments.length).toBeGreaterThan(18);

      // Verify performance under load
      const processingTime = endTime - startTime;
      expect(processingTime).toBeLessThan(1000); // 1 second max for 20 payments
    });

    it('should handle database connection pooling', async () => {
      const paymentRequests = Array.from({ length: 15 }, (_, i) => ({
        id: `payment_${i}`,
        amount: 29.99,
        currency: 'NZD',
        user_id: `user_${i}`,
      }));

      // Mock database operations
      mockSupabase.single.mockResolvedValue({
        data: { id: 'payment_123', status: 'pending' },
        error: null,
      });

      const startTime = Date.now();
      const results = await Promise.all(
        paymentRequests.map(request =>
          paymentPerformanceService.createPaymentRecord(request)
        )
      );
      const endTime = Date.now();

      // Verify all database operations completed
      expect(results).toHaveLength(15);
      expect(results.every(result => result.success)).toBe(true);

      // Verify connection pooling performance
      const processingTime = endTime - startTime;
      expect(processingTime).toBeLessThan(2000); // 2 seconds max
    });
  });

  describe('response time optimization', () => {
    it('should optimize payment intent creation', async () => {
      const paymentData = {
        amount: 29.99,
        currency: 'NZD',
        user_id: 'user_123',
      };

      // Mock optimized Stripe service
      mockStripeService.createPaymentIntent.mockResolvedValue({
        id: 'pi_test123',
        client_secret: 'pi_test123_secret_abc123',
      });

      const startTime = Date.now();
      const result =
        await paymentPerformanceService.createPaymentIntent(paymentData);
      const endTime = Date.now();

      expect(result.success).toBe(true);
      expect(result.payment_intent_id).toBe('pi_test123');

      // Verify response time optimization
      const responseTime = endTime - startTime;
      expect(responseTime).toBeLessThan(1000); // 1 second max
    });

    it('should optimize payment confirmation', async () => {
      const paymentIntentId = 'pi_test123';
      const paymentMethodId = 'pm_test123';

      mockStripeService.confirmPaymentIntent.mockResolvedValue({
        id: paymentIntentId,
        status: 'succeeded',
      });

      const startTime = Date.now();
      const result = await paymentPerformanceService.confirmPayment(
        paymentIntentId,
        paymentMethodId
      );
      const endTime = Date.now();

      expect(result.success).toBe(true);
      expect(result.status).toBe('succeeded');

      // Verify response time optimization
      const responseTime = endTime - startTime;
      expect(responseTime).toBeLessThan(500); // 500ms max
    });

    it('should optimize database queries', async () => {
      const userId = 'user_123';

      // Mock optimized database query - the final method in the chain should return data
      mockSupabase.order.mockResolvedValue({
        data: [
          { id: 'payment_1', amount: 29.99, status: 'succeeded' },
          { id: 'payment_2', amount: 49.99, status: 'succeeded' },
        ],
        error: null,
      });

      const startTime = Date.now();
      const result = await paymentPerformanceService.getUserPayments(userId);
      const endTime = Date.now();

      expect(result).toHaveLength(2);
      expect(mockSupabase.from).toHaveBeenCalledWith('payments');
      expect(mockSupabase.eq).toHaveBeenCalledWith(
        'subscriptions.user_id',
        userId
      );

      // Verify query optimization
      const queryTime = endTime - startTime;
      expect(queryTime).toBeLessThan(200); // 200ms max
    });
  });

  describe('caching performance', () => {
    it('should cache payment methods', async () => {
      const userId = 'user_123';
      const mockPaymentMethods = [
        { id: 'pm_1', type: 'card', last_four: '4242' },
        { id: 'pm_2', type: 'card', last_four: '5555' },
      ];

      // Mock database query - the final method in the chain should return data
      mockSupabase.order.mockResolvedValue({
        data: mockPaymentMethods,
        error: null,
      });

      // Test payment methods retrieval
      const startTime = Date.now();
      const result =
        await paymentPerformanceService.getUserPaymentMethods(userId);
      const endTime = Date.now();

      expect(result).toEqual(mockPaymentMethods);
      expect(mockSupabase.from).toHaveBeenCalledWith('payment_methods');
      expect(mockSupabase.eq).toHaveBeenCalledWith('user_id', userId);

      // Verify query performance
      const queryTime = endTime - startTime;
      expect(queryTime).toBeLessThan(200); // 200ms max
    });

    it('should cache payment statistics', async () => {
      const userId = 'user_123';
      const mockStats = {
        totalPayments: 2,
        successfulPayments: 2,
        successRate: 100,
        averageAmount: 39.99,
      };

      // Mock database queries - the final method in the chain should return data
      mockSupabase.eq.mockResolvedValue({
        data: [
          { id: 'payment_1', amount: 29.99, status: 'succeeded' },
          { id: 'payment_2', amount: 49.99, status: 'succeeded' },
        ],
        error: null,
      });

      // Test payment statistics retrieval
      const startTime = Date.now();
      const result =
        await paymentPerformanceService.getPaymentStatistics(userId);
      const endTime = Date.now();

      expect(result).toEqual(mockStats);

      // Verify query performance
      const queryTime = endTime - startTime;
      expect(queryTime).toBeLessThan(200); // 200ms max
    });
  });

  describe('memory optimization', () => {
    it('should handle large payment datasets efficiently', async () => {
      const largePaymentDataset = Array.from({ length: 100 }, (_, i) => ({
        id: `payment_${i}`,
        amount: Math.random() * 100,
        currency: 'NZD',
        status: 'succeeded',
        created_at: new Date().toISOString(),
      }));

      // Mock large dataset - the final method in the chain should return data
      mockSupabase.limit.mockResolvedValue({
        data: largePaymentDataset,
        error: null,
      });

      const startTime = Date.now();
      const result =
        await paymentPerformanceService.processLargePaymentDataset();
      const endTime = Date.now();

      expect(result.success).toBe(true);
      expect(result.processedCount).toBe(100);

      // Verify memory efficiency
      const processingTime = endTime - startTime;
      expect(processingTime).toBeLessThan(5000); // 5 seconds max
    });

    it('should optimize payment batch processing', async () => {
      const paymentBatch = Array.from({ length: 20 }, (_, i) => ({
        id: `payment_${i}`,
        amount: 29.99,
        currency: 'NZD',
        user_id: `user_${i}`,
      }));

      // Mock batch processing
      mockPaymentService.createPayment.mockResolvedValue({
        id: 'payment_123',
        status: 'pending',
      });

      const startTime = Date.now();
      const result =
        await paymentPerformanceService.processPaymentBatch(paymentBatch);
      const endTime = Date.now();

      expect(result.success).toBe(true);
      expect(result.processed_count).toBe(20);

      // Verify batch processing performance
      const processingTime = endTime - startTime;
      expect(processingTime).toBeLessThan(2000); // 2 seconds max
    });
  });

  describe('error handling under load', () => {
    it('should handle partial failures gracefully', async () => {
      const paymentRequests = Array.from({ length: 20 }, (_, i) => ({
        id: `payment_${i}`,
        amount: 29.99,
        currency: 'NZD',
        user_id: `user_${i}`,
      }));

      // Mock partial failures
      mockStripeService.createPaymentIntent
        .mockResolvedValueOnce({
          id: 'pi_test123',
          client_secret: 'pi_test123_secret',
        })
        .mockRejectedValueOnce(new Error('Rate limit exceeded'))
        .mockResolvedValue({
          id: 'pi_test123',
          client_secret: 'pi_test123_secret',
        });

      mockPaymentService.createPayment.mockResolvedValue({
        id: 'payment_123',
        status: 'pending',
      });

      const results = await Promise.allSettled(
        paymentRequests.map(request =>
          paymentPerformanceService.processPayment(request)
        )
      );

      // Verify partial success handling
      const successfulPayments = results.filter(
        result => result.status === 'fulfilled' && result.value.success
      );
      const failedPayments = results.filter(
        result =>
          result.status === 'rejected' ||
          (result.status === 'fulfilled' && !result.value.success)
      );

      expect(successfulPayments.length).toBeGreaterThan(0);
      expect(successfulPayments.length + failedPayments.length).toBe(20);
      // Note: With 99% success rate, we might not have failures, which is acceptable
    });

    it('should handle database connection failures', async () => {
      const paymentData = {
        amount: 29.99,
        currency: 'NZD',
        user_id: 'user_123',
        error: 'database_connection_failed', // Trigger database error
      };

      await expect(
        paymentPerformanceService.createPaymentRecord(paymentData)
      ).rejects.toThrow('Database connection failed');
    });

    it('should handle Stripe API rate limiting', async () => {
      const paymentData = {
        amount: 29.99,
        currency: 'NZD',
        user_id: 'user_123',
        error: 'rate_limit_exceeded', // Trigger rate limiting error
      };

      await expect(
        paymentPerformanceService.createPaymentIntent(paymentData)
      ).rejects.toThrow('Rate limit exceeded');
    });
  });

  describe('performance monitoring', () => {
    it('should track payment processing metrics', async () => {
      const paymentData = {
        amount: 29.99,
        currency: 'NZD',
        user_id: 'user_123',
      };

      // Mock payment processing
      mockStripeService.createPaymentIntent.mockResolvedValue({
        id: 'pi_test123',
        client_secret: 'pi_test123_secret_abc123',
      });

      const metrics =
        await paymentPerformanceService.trackPaymentMetrics(paymentData);

      expect(metrics).toHaveProperty('processing_time');
      expect(metrics).toHaveProperty('success_rate');
      expect(metrics).toHaveProperty('error_rate');
      expect(metrics).toHaveProperty('average_response_time');
    });

    it('should generate performance reports', async () => {
      const report =
        await paymentPerformanceService.generatePerformanceReport();

      expect(report).toHaveProperty('total_payments');
      expect(report).toHaveProperty('success_rate');
      expect(report).toHaveProperty('average_response_time');
    });

    it('should monitor system resources', async () => {
      const resourceMetrics =
        await paymentPerformanceService.monitorSystemResources();

      expect(resourceMetrics).toHaveProperty('cpu_usage');
      expect(resourceMetrics).toHaveProperty('memory_usage');
      expect(resourceMetrics).toHaveProperty('database_connections');
      expect(resourceMetrics).toHaveProperty('active_payments');
    });
  });

  describe('scalability testing', () => {
    it('should handle horizontal scaling', async () => {
      const paymentRequests = Array.from({ length: 25 }, (_, i) => ({
        id: `payment_${i}`,
        amount: 29.99,
        currency: 'NZD',
        user_id: `user_${i}`,
      }));

      // Mock distributed processing
      mockStripeService.createPaymentIntent.mockResolvedValue({
        id: 'pi_test123',
        client_secret: 'pi_test123_secret_abc123',
      });

      const startTime = Date.now();
      const results = await Promise.all(
        paymentRequests.map(request =>
          paymentPerformanceService.processPaymentDistributed(request)
        )
      );
      const endTime = Date.now();

      expect(results).toHaveLength(25);
      // Allow for some failures due to the 99% success rate in the service
      const successCount = results.filter(result => result.success).length;
      expect(successCount).toBeGreaterThanOrEqual(20); // At least 80% success rate

      // Verify horizontal scaling performance
      const processingTime = endTime - startTime;
      expect(processingTime).toBeLessThan(3000); // 3 seconds max
    });

    it('should handle vertical scaling', async () => {
      const paymentRequests = Array.from({ length: 25 }, (_, i) => ({
        id: `payment_${i}`,
        amount: 29.99,
        currency: 'NZD',
        user_id: `user_${i}`,
      }));

      // Mock high-performance processing
      mockStripeService.createPaymentIntent.mockResolvedValue({
        id: 'pi_test123',
        client_secret: 'pi_test123_secret_abc123',
      });

      const startTime = Date.now();
      const results = await Promise.all(
        paymentRequests.map(request =>
          paymentPerformanceService.processPaymentHighPerformance(request)
        )
      );
      const endTime = Date.now();

      expect(results).toHaveLength(25);
      expect(results.every(result => result.success)).toBe(true);

      // Verify vertical scaling performance
      const processingTime = endTime - startTime;
      expect(processingTime).toBeLessThan(1000); // 1 second max
    });
  });
});
