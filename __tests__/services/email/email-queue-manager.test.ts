import { EmailQueueManager } from '@/lib/email/email-queue-manager';
import { createClient } from '@/lib/supabase/server';

// Mock SendGridService
const mockSendEmail = jest.fn();
jest.mock('@/lib/email/sendgrid-service', () => {
  return {
    SendGridService: jest.fn().mockImplementation(() => {
      return {
        sendEmail: mockSendEmail,
      };
    }),
  };
});

// Mock other dependencies
jest.mock('@/lib/supabase/server');
jest.mock('@/lib/security/audit-logger');

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

describe('EmailQueueManager', () => {
  let queueManager: EmailQueueManager;

  beforeEach(() => {
    jest.clearAllMocks();
    queueManager = new EmailQueueManager();
  });

  describe('addToQueue', () => {
    it('should add email to queue', async () => {
      // Mock the insert operation to return a queue ID
      const mockQuery = createMockQuery();
      mockQuery.single.mockResolvedValue({
        data: { id: 'test-queue-id' },
        error: null,
      });
      mockSupabase.from.mockReturnValue(mockQuery);

      const queueItem = {
        recipient: 'test@example.com',
        subject: 'Test Subject',
        html_content: '<p>Test HTML</p>',
        text_content: 'Test Text',
        priority: 'normal' as const,
        max_retries: 3,
      };

      const result = await queueManager.addToQueue(queueItem);

      expect(result).toBe('test-queue-id');
      expect(mockQuery.insert).toHaveBeenCalledWith({
        ...queueItem,
        status: 'pending',
        retry_count: 0,
        created_at: expect.any(String),
      });
    });

    it('should handle queue insertion errors', async () => {
      mockSupabase.from.mockReturnValue({
        insert: jest.fn(() => ({
          select: jest.fn(() => ({
            single: jest.fn(() => ({
              data: null,
              error: { message: 'Database error' },
            })),
          })),
        })),
      });

      const queueItem = {
        recipient: 'test@example.com',
        subject: 'Test Subject',
        html_content: '<p>Test HTML</p>',
        priority: 'normal' as const,
        max_retries: 3,
      };

      await expect(queueManager.addToQueue(queueItem)).rejects.toThrow(
        'Failed to add to queue'
      );
    });
  });

  describe('processQueue', () => {
    it('should process pending emails', async () => {
      // Mock the select operation to return pending emails
      const mockQuery = createMockQuery();
      mockQuery.limit.mockResolvedValue({
        data: [
          {
            id: 'test-queue-id',
            recipient: 'test@example.com',
            subject: 'Test Subject',
            html_content: '<p>Test HTML</p>',
            text_content: 'Test Text',
            priority: 'normal',
            status: 'pending',
            created_at: '2024-01-01T00:00:00Z',
            retry_count: 0,
            max_retries: 3,
          },
        ],
        error: null,
      });

      // Mock the update operations for processing and sent status
      const mockUpdateQuery1 = createMockQuery();
      mockUpdateQuery1.eq.mockResolvedValue({
        data: [{ id: 'test-queue-id' }],
        error: null,
      });

      const mockUpdateQuery2 = createMockQuery();
      mockUpdateQuery2.eq.mockResolvedValue({
        data: [{ id: 'test-queue-id' }],
        error: null,
      });

      // Set up the mock to return different queries for different calls
      mockSupabase.from
        .mockReturnValueOnce(mockQuery) // For the select query
        .mockReturnValueOnce(mockUpdateQuery1) // For the first update (processing)
        .mockReturnValueOnce(mockUpdateQuery2); // For the second update (sent)

      // Mock SendGridService to return success
      mockSendEmail.mockResolvedValue({
        success: true,
        messageId: 'test-message-id',
      });

      await queueManager.processQueue();

      expect(mockSendEmail).toHaveBeenCalledWith({
        to: 'test@example.com',
        subject: 'Test Subject',
        html: '<p>Test HTML</p>',
        text: 'Test Text',
        categories: ['queued-email'],
        customArgs: {
          queueId: 'test-queue-id',
        },
      });
    });

    it('should handle processing errors with retry', async () => {
      // Mock the select operation to return pending emails
      const mockQuery = createMockQuery();
      mockQuery.limit.mockResolvedValue({
        data: [
          {
            id: 'test-queue-id',
            recipient: 'test@example.com',
            subject: 'Test Subject',
            html_content: '<p>Test HTML</p>',
            text_content: 'Test Text',
            priority: 'normal',
            status: 'pending',
            created_at: '2024-01-01T00:00:00Z',
            retry_count: 0,
            max_retries: 3,
          },
        ],
        error: null,
      });

      // Mock the update operations
      const mockUpdateQuery1 = createMockQuery();
      mockUpdateQuery1.eq.mockResolvedValue({
        data: [{ id: 'test-queue-id' }],
        error: null,
      });

      const mockUpdateQuery2 = createMockQuery();
      mockUpdateQuery2.eq.mockResolvedValue({
        data: [{ id: 'test-queue-id' }],
        error: null,
      });

      mockSupabase.from
        .mockReturnValueOnce(mockQuery) // For the select query
        .mockReturnValueOnce(mockUpdateQuery1) // For the first update (processing)
        .mockReturnValueOnce(mockUpdateQuery2); // For the retry update

      // Mock SendGridService to return error
      mockSendEmail.mockRejectedValue(new Error('SendGrid error'));

      await queueManager.processQueue();

      // Should update queue item with retry - check the second update call
      expect(mockUpdateQuery2.update).toHaveBeenCalledWith({
        status: 'pending',
        retry_count: 1,
        scheduled_at: expect.any(String),
        error_message: 'SendGrid error',
      });
    });

    it('should mark as failed after max retries', async () => {
      // Mock the select operation to return pending emails with max retries
      const mockQuery = createMockQuery();
      mockQuery.limit.mockResolvedValue({
        data: [
          {
            id: 'test-queue-id',
            recipient: 'test@example.com',
            subject: 'Test Subject',
            html_content: '<p>Test HTML</p>',
            text_content: 'Test Text',
            priority: 'normal',
            status: 'pending',
            created_at: '2024-01-01T00:00:00Z',
            retry_count: 3, // Max retries reached
            max_retries: 3,
          },
        ],
        error: null,
      });

      // Mock the update operations
      const mockUpdateQuery1 = createMockQuery();
      mockUpdateQuery1.eq.mockResolvedValue({
        data: [{ id: 'test-queue-id' }],
        error: null,
      });

      const mockUpdateQuery2 = createMockQuery();
      mockUpdateQuery2.eq.mockResolvedValue({
        data: [{ id: 'test-queue-id' }],
        error: null,
      });

      mockSupabase.from
        .mockReturnValueOnce(mockQuery) // For the select query
        .mockReturnValueOnce(mockUpdateQuery1) // For the first update (processing)
        .mockReturnValueOnce(mockUpdateQuery2); // For the failed update

      // Mock SendGridService to return error
      mockSendEmail.mockRejectedValue(new Error('SendGrid error'));

      await queueManager.processQueue();

      // Should mark as failed - check the second update call
      expect(mockUpdateQuery2.update).toHaveBeenCalledWith({
        status: 'failed',
        error_message: 'SendGrid error',
      });
    });
  });

  describe('getQueueStats', () => {
    it('should return queue statistics', async () => {
      // Mock the select operation to return queue data
      const mockQuery = createMockQuery();
      mockQuery.select.mockResolvedValue({
        data: [
          {
            id: 'test-queue-id',
            status: 'sent',
            created_at: '2024-01-01T00:00:00Z',
            processed_at: '2024-01-01T00:01:00Z',
          },
        ],
        error: null,
      });
      mockSupabase.from.mockReturnValue(mockQuery);

      const stats = await queueManager.getQueueStats();

      expect(stats.total).toBe(1);
      expect(stats.sent).toBe(1);
      expect(stats.averageProcessingTime).toBe(60); // 1 minute in seconds
    });

    it('should handle empty queue', async () => {
      mockSupabase.from.mockReturnValue({
        select: jest.fn(() => ({
          data: [],
          error: null,
        })),
      });

      const stats = await queueManager.getQueueStats();

      expect(stats.total).toBe(0);
      expect(stats.sent).toBe(0);
      expect(stats.averageProcessingTime).toBe(0);
    });
  });

  describe('getQueueMetrics', () => {
    it('should return queue metrics for different timeframes', async () => {
      // Mock the select operation to return metrics data
      const mockQuery = createMockQuery();
      mockQuery.lte.mockResolvedValue({
        data: [
          {
            id: 'test-queue-id',
            status: 'sent',
            created_at: '2024-01-01T00:00:00Z',
            processed_at: '2024-01-01T00:01:00Z',
          },
        ],
        error: null,
      });
      mockSupabase.from.mockReturnValue(mockQuery);

      const hourMetrics = await queueManager.getQueueMetrics('hour');
      const dayMetrics = await queueManager.getQueueMetrics('day');
      const weekMetrics = await queueManager.getQueueMetrics('week');

      expect(hourMetrics.throughput).toBeGreaterThanOrEqual(0);
      expect(hourMetrics.successRate).toBeGreaterThanOrEqual(0);
      expect(hourMetrics.averageQueueTime).toBeGreaterThanOrEqual(0);

      expect(dayMetrics.throughput).toBeGreaterThanOrEqual(0);
      expect(dayMetrics.successRate).toBeGreaterThanOrEqual(0);
      expect(dayMetrics.averageQueueTime).toBeGreaterThanOrEqual(0);

      expect(weekMetrics.throughput).toBeGreaterThanOrEqual(0);
      expect(weekMetrics.successRate).toBeGreaterThanOrEqual(0);
      expect(weekMetrics.averageQueueTime).toBeGreaterThanOrEqual(0);
    });
  });

  describe('cancelQueueItem', () => {
    it('should cancel queue item', async () => {
      // Mock the update operation
      const mockQuery = createMockQuery();
      mockQuery.in.mockResolvedValue({
        data: { id: 'test-queue-id' },
        error: null,
      });
      mockSupabase.from.mockReturnValue(mockQuery);

      await queueManager.cancelQueueItem('test-queue-id');

      expect(mockQuery.update).toHaveBeenCalledWith({
        status: 'cancelled',
      });
    });

    it('should handle cancellation errors', async () => {
      mockSupabase.from.mockReturnValue({
        update: jest.fn(() => ({
          eq: jest.fn(() => ({
            in: jest.fn(() => ({
              data: null,
              error: { message: 'Database error' },
            })),
          })),
        })),
      });

      await expect(
        queueManager.cancelQueueItem('test-queue-id')
      ).rejects.toThrow('Failed to cancel queue item');
    });
  });

  describe('retryFailedItems', () => {
    it('should retry failed items', async () => {
      await queueManager.retryFailedItems();

      expect(mockSupabase.from().update).toHaveBeenCalledWith({
        status: 'pending',
        retry_count: 0,
        error_message: null,
        scheduled_at: expect.any(String),
      });
    });
  });

  describe('clearOldItems', () => {
    it('should clear old items', async () => {
      // Mock the delete operation
      const mockQuery = createMockQuery();
      mockQuery.in.mockResolvedValue({
        data: { count: 5 },
        error: null,
      });
      mockSupabase.from.mockReturnValue(mockQuery);

      await queueManager.clearOldItems(30);

      expect(mockQuery.delete).toHaveBeenCalled();
    });

    it('should use default days if not specified', async () => {
      // Mock the delete operation
      const mockQuery = createMockQuery();
      mockQuery.in.mockResolvedValue({
        data: { count: 5 },
        error: null,
      });
      mockSupabase.from.mockReturnValue(mockQuery);

      await queueManager.clearOldItems();

      expect(mockQuery.delete).toHaveBeenCalled();
    });
  });

  describe('continuous processing', () => {
    it('should start continuous processing', () => {
      const setIntervalSpy = jest.spyOn(global, 'setInterval');

      queueManager.startContinuousProcessing(1000);

      expect(setIntervalSpy).toHaveBeenCalledWith(expect.any(Function), 1000);

      setIntervalSpy.mockRestore();
    });

    it('should stop continuous processing', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      queueManager.stopContinuousProcessing();

      expect(consoleSpy).toHaveBeenCalledWith(
        'Continuous processing stop requested'
      );

      consoleSpy.mockRestore();
    });
  });

  describe('error handling', () => {
    it('should handle database errors gracefully', async () => {
      mockSupabase.from.mockReturnValue({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            order: jest.fn(() => ({
              limit: jest.fn(() => ({
                data: null,
                error: { message: 'Database error' },
              })),
            })),
          })),
        })),
      });

      // Should not throw error
      await expect(queueManager.processQueue()).resolves.toBeUndefined();
    });

    it('should handle SendGrid service errors', async () => {
      const mockSendEmail = jest
        .fn()
        .mockRejectedValue(new Error('SendGrid service error'));

      const SendGridService =
        require('@/lib/email/sendgrid-service').SendGridService;
      SendGridService.prototype.sendEmail = mockSendEmail;

      // Should not throw error
      await expect(queueManager.processQueue()).resolves.toBeUndefined();
    });
  });
});
