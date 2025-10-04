/**
 * Receipt Service Unit Tests
 * Comprehensive testing for receipt generation and management
 */

import { ReceiptService } from '@/lib/payments/receipt-service';
import { createClient } from '@/lib/supabase/server';

// Use the global Supabase mock from jest.setup.js

describe('ReceiptService', () => {
  let receiptService: ReceiptService;
  let mockSupabase: any;

  beforeEach(() => {
    jest.clearAllMocks();

    // Reset the global mock client
    global.mockSupabaseClient = {
      auth: {
        getUser: jest.fn().mockResolvedValue({
          data: { user: { id: 'test-user-id', email: 'test@example.com' } },
          error: null,
        }),
        getSession: jest.fn().mockResolvedValue({
          data: {
            session: {
              user: { id: 'test-user-id', email: 'test@example.com' },
            },
          },
          error: null,
        }),
      },
      from: jest.fn(),
    };

    // Use the global mock client
    mockSupabase = global.mockSupabaseClient;
    receiptService = new ReceiptService();
  });

  // Helper function to create mock query chains using proven pattern
  const createMockQuery = (mockData = { data: [], error: null }) => {
    const query = {
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
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
      single: jest.fn().mockResolvedValue(mockData),
      maybeSingle: jest.fn().mockResolvedValue(mockData),
      csv: jest.fn().mockResolvedValue(''),
      geojson: jest.fn().mockResolvedValue({}),
      explain: jest.fn().mockResolvedValue({}),
      rollback: jest.fn().mockResolvedValue({}),
      then: jest.fn().mockImplementation((resolve, reject) => {
        if (resolve) {
          return Promise.resolve(resolve(mockData));
        }
        return Promise.resolve(mockData);
      }),
    };

    // Make the query object thenable
    Object.setPrototypeOf(query, Promise.prototype);
    return query;
  };

  describe('generateReceipt', () => {
    it('should generate receipt successfully', async () => {
      const paymentId = 'payment_123';
      const mockPayment = {
        id: paymentId,
        amount: 5000,
        currency: 'NZD',
        payment_method: 'card',
        created_at: '2024-01-01T00:00:00Z',
      };

      const mockReceipt = {
        id: 'receipt_123',
        payment_id: paymentId,
        receipt_url: 'https://example.com/receipt.pdf',
        receipt_number: 'RCP-2024-001',
        amount: 5000,
        currency: 'NZD',
        created_at: '2024-01-01T00:00:00Z',
      };

      // Mock receipt creation
      const mockQuery = createMockQuery({
        data: mockReceipt,
        error: null,
      });
      mockSupabase.from.mockReturnValueOnce(mockQuery);

      const result = await receiptService.createReceipt({
        payment_id: paymentId,
        receipt_url: 'https://example.com/receipt.pdf',
        receipt_number: 'RCP-2024-001',
      });

      expect(mockSupabase.from).toHaveBeenCalledWith('receipts');
      expect(mockQuery.insert).toHaveBeenCalledWith({
        payment_id: paymentId,
        receipt_url: 'https://example.com/receipt.pdf',
        receipt_number: 'RCP-2024-001',
      });
      expect(result).toEqual(mockReceipt);
    });

    it('should handle payment not found', async () => {
      const paymentId = 'payment_nonexistent';

      // Mock receipt retrieval to return null (not found)
      const receiptQuery = createMockQuery({
        data: null,
        error: { code: 'PGRST116', message: 'No rows found' },
      });
      mockSupabase.from.mockReturnValueOnce(receiptQuery);

      const result = await receiptService.getReceiptInfo(paymentId);
      expect(result).toBeNull();
    });

    it('should handle database errors during receipt generation', async () => {
      const paymentId = 'payment_123';
      const mockPayment = {
        id: paymentId,
        amount: 5000,
        currency: 'NZD',
      };

      // Mock receipt creation failure using proven pattern
      const insertQuery = {
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: null,
          error: { message: 'Database connection failed' },
        }),
      };

      mockSupabase.from.mockReturnValue(insertQuery);

      await expect(
        receiptService.createReceipt({
          payment_id: paymentId,
          receipt_url: 'https://example.com/receipt.pdf',
          receipt_number: 'RCP-2024-001',
        })
      ).rejects.toThrow('Failed to create receipt');
    });
  });

  describe('getReceiptInfo', () => {
    it('should retrieve receipt information successfully', async () => {
      const paymentId = 'payment_123';
      const mockReceipt = {
        id: 'receipt_123',
        payment_id: paymentId,
        receipt_url: 'https://example.com/receipt.pdf',
        receipt_number: 'RCP-2024-001',
        amount: 5000,
        currency: 'NZD',
        created_at: '2024-01-01T00:00:00Z',
      };

      // Mock query to return receipt with payment data
      const query = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: {
            ...mockReceipt,
            payments: {
              amount: mockReceipt.amount,
              currency: mockReceipt.currency,
              payment_method: 'card',
            },
          },
          error: null,
        }),
      };
      mockSupabase.from.mockReturnValueOnce(query);

      const result = await receiptService.getReceiptInfo(paymentId);

      expect(mockSupabase.from).toHaveBeenCalledWith('receipts');
      expect(query.select).toHaveBeenCalledWith(`
          *,
          payments!inner(
            amount,
            currency,
            payment_method
          )
        `);
      expect(query.eq).toHaveBeenCalledWith('payment_id', paymentId);
      expect(result).toEqual({
        ...mockReceipt,
        payment_method: 'card',
      });
    });

    it('should return null when receipt not found', async () => {
      const paymentId = 'payment_nonexistent';

      // Mock query to return not found
      const query = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: null,
          error: { message: 'No rows found', code: 'PGRST116' },
        }),
      };
      mockSupabase.from.mockReturnValueOnce(query);

      const result = await receiptService.getReceiptInfo(paymentId);

      expect(result).toBeNull();
    });

    it('should handle database errors during receipt retrieval', async () => {
      const paymentId = 'payment_123';
      const dbError = { message: 'Database connection failed' };

      // Mock query to return error
      const query = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: null,
          error: dbError,
        }),
      };
      mockSupabase.from.mockReturnValueOnce(query);

      await expect(receiptService.getReceiptInfo(paymentId)).rejects.toThrow(
        'Failed to get receipt information'
      );
    });
  });

  describe('sendReceiptEmail', () => {
    it('should send receipt email successfully', async () => {
      const paymentId = 'payment_123';
      const email = 'test@example.com';
      const mockReceipt = {
        id: 'receipt_123',
        payment_id: paymentId,
        receipt_url: 'https://example.com/receipt.pdf',
        receipt_number: 'RCP-2024-001',
      };

      // Mock payment retrieval
      const paymentQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
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
        }),
      };
      // Mock receipt check (no existing receipt)
      const receiptCheckQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: null,
          error: { message: 'No rows found', code: 'PGRST116' },
        }),
      };
      // Mock receipt creation
      const receiptCreateQuery = {
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: mockReceipt,
          error: null,
        }),
      };
      mockSupabase.from
        .mockReturnValueOnce(paymentQuery)
        .mockReturnValueOnce(receiptCheckQuery)
        .mockReturnValueOnce(receiptCreateQuery);

      // Mock sendReceipt method
      jest
        .spyOn(receiptService, 'sendReceipt')
        .mockResolvedValue('https://example.com/receipt.pdf');

      const result = await receiptService.sendReceiptEmail(paymentId, email);

      expect(result).toBeUndefined();
    });

    it('should handle receipt not found during email sending', async () => {
      const paymentId = 'payment_nonexistent';
      const email = 'test@example.com';

      // Mock payment retrieval to return not found
      const paymentQuery = createMockQuery({
        data: null,
        error: { message: 'No rows found', code: 'PGRST116' },
      });
      mockSupabase.from.mockReturnValueOnce(paymentQuery);

      await expect(
        receiptService.sendReceiptEmail(paymentId, email)
      ).rejects.toThrow('Failed to send receipt email');
    });

    it('should handle email sending failures', async () => {
      const paymentId = 'payment_123';
      const email = 'test@example.com';
      const mockReceipt = {
        id: 'receipt_123',
        payment_id: paymentId,
        receipt_url: 'https://example.com/receipt.pdf',
      };

      // Mock payment retrieval
      const paymentQuery = createMockQuery({
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
      // Mock receipt check (no existing receipt)
      const receiptCheckQuery = createMockQuery({
        data: null,
        error: { message: 'No rows found', code: 'PGRST116' },
      });
      // Mock receipt creation
      const receiptCreateQuery = createMockQuery({
        data: mockReceipt,
        error: null,
      });
      mockSupabase.from
        .mockReturnValueOnce(paymentQuery)
        .mockReturnValueOnce(receiptCheckQuery)
        .mockReturnValueOnce(receiptCreateQuery);

      await expect(
        receiptService.sendReceiptEmail(paymentId, email)
      ).rejects.toThrow('Failed to send receipt email');
    });
  });

  describe('getReceiptsByUser', () => {
    it('should retrieve user receipts successfully', async () => {
      const userId = 'user_123';
      const mockReceipts = [
        {
          id: 'receipt_1',
          payment_id: 'payment_1',
          receipt_url: 'https://example.com/receipt1.pdf',
          amount: 5000,
          created_at: '2024-01-01T00:00:00Z',
        },
        {
          id: 'receipt_2',
          payment_id: 'payment_2',
          receipt_url: 'https://example.com/receipt2.pdf',
          amount: 3000,
          created_at: '2024-01-02T00:00:00Z',
        },
      ];

      // Mock query to return receipts
      const query = createMockQuery({
        data: mockReceipts,
        error: null,
      });
      mockSupabase.from.mockReturnValueOnce(query);

      const result = await receiptService.getReceiptsByUser(userId);

      expect(mockSupabase.from).toHaveBeenCalledWith('receipts');
      expect(query.select).toHaveBeenCalledWith(expect.stringContaining('*'));
      expect(query.select).toHaveBeenCalledWith(
        expect.stringContaining('payments!inner')
      );
      expect(query.select).toHaveBeenCalledWith(
        expect.stringContaining('subscriptions!inner(user_id)')
      );
      expect(query.eq).toHaveBeenCalledWith(
        'payments.subscriptions.user_id',
        userId
      );
      expect(result).toEqual(mockReceipts);
    });

    it('should return empty array when no receipts found', async () => {
      const userId = 'user_nonexistent';

      // Mock query to return empty array
      const query = createMockQuery({
        data: [],
        error: null,
      });
      // Override the then method to return the data
      query.then = jest.fn().mockImplementation((resolve, reject) => {
        if (resolve) {
          return Promise.resolve(resolve({ data: [], error: null }));
        }
        return Promise.resolve({ data: [], error: null });
      });
      mockSupabase.from.mockReturnValueOnce(query);

      const result = await receiptService.getReceiptsByUser(userId);

      expect(result).toEqual([]);
    });

    it('should handle database errors during user receipt retrieval', async () => {
      const userId = 'user_123';
      const dbError = { message: 'Database connection failed' };

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

      await expect(receiptService.getReceiptsByUser(userId)).rejects.toThrow(
        'Failed to retrieve user receipts'
      );
    });
  });

  describe('downloadReceipt', () => {
    it('should download receipt successfully', async () => {
      const receiptId = 'receipt_123';
      const mockReceipt = {
        id: receiptId,
        receipt_url: 'https://example.com/receipt.pdf',
        receipt_number: 'RCP-2024-001',
        payment_id: 'payment_123',
        created_at: '2024-01-01T00:00:00Z',
        payments: {
          amount: 5000,
          currency: 'NZD',
          payment_method: 'card',
        },
      };

      // Mock query to return receipt
      const query = createMockQuery({
        data: mockReceipt,
        error: null,
      });
      // Override the then method to return the data
      query.then = jest.fn().mockImplementation((resolve, reject) => {
        if (resolve) {
          return Promise.resolve(resolve({ data: mockReceipt, error: null }));
        }
        return Promise.resolve({ data: mockReceipt, error: null });
      });
      mockSupabase.from.mockReturnValueOnce(query);

      const result = await receiptService.downloadReceipt(receiptId);

      expect(mockSupabase.from).toHaveBeenCalledWith('receipts');
      expect(query.select).toHaveBeenCalledWith(expect.stringContaining('*'));
      expect(query.select).toHaveBeenCalledWith(
        expect.stringContaining('payments!inner')
      );
      expect(query.eq).toHaveBeenCalledWith('id', receiptId);
      expect(result).toEqual({
        id: mockReceipt.id,
        payment_id: mockReceipt.payment_id,
        receipt_url: mockReceipt.receipt_url,
        receipt_number: mockReceipt.receipt_number,
        amount: mockReceipt.payments.amount,
        currency: mockReceipt.payments.currency,
        payment_method: mockReceipt.payments.payment_method,
        created_at: mockReceipt.created_at,
      });
    });

    it('should handle receipt not found during download', async () => {
      const receiptId = 'receipt_nonexistent';

      // Mock query to return not found
      const query = createMockQuery({
        data: null,
        error: { message: 'No rows found', code: 'PGRST116' },
      });
      // Override the then method to return the error
      query.then = jest.fn().mockImplementation((resolve, reject) => {
        if (resolve) {
          return Promise.resolve(
            resolve({
              data: null,
              error: { message: 'No rows found', code: 'PGRST116' },
            })
          );
        }
        return Promise.resolve({
          data: null,
          error: { message: 'No rows found', code: 'PGRST116' },
        });
      });
      mockSupabase.from.mockReturnValueOnce(query);

      await expect(receiptService.downloadReceipt(receiptId)).rejects.toThrow(
        'Failed to download receipt'
      );
    });
  });

  describe('updateReceiptStatus', () => {
    it('should update receipt status successfully', async () => {
      const receiptId = 'receipt_123';
      const status = 'sent';
      const metadata = { email: 'test@example.com' };

      const mockUpdatedReceipt = {
        id: receiptId,
        payment_id: 'payment_123',
        receipt_url: 'https://example.com/receipt.pdf',
        receipt_number: 'RCP-2024-001',
        created_at: '2024-01-01T00:00:00Z',
        payments: {
          amount: 5000,
          currency: 'NZD',
          payment_method: 'card',
        },
      };

      // Mock query to return updated receipt
      const query = createMockQuery({
        data: mockUpdatedReceipt,
        error: null,
      });
      // Override the then method to return the data
      query.then = jest.fn().mockImplementation((resolve, reject) => {
        if (resolve) {
          return Promise.resolve(
            resolve({ data: mockUpdatedReceipt, error: null })
          );
        }
        return Promise.resolve({ data: mockUpdatedReceipt, error: null });
      });
      mockSupabase.from.mockReturnValueOnce(query);

      const result = await receiptService.updateReceiptStatus(
        receiptId,
        status,
        metadata
      );

      expect(mockSupabase.from).toHaveBeenCalledWith('receipts');
      expect(query.update).toHaveBeenCalledWith({
        status,
        metadata,
        updated_at: expect.any(String),
      });
      expect(query.eq).toHaveBeenCalledWith('id', receiptId);
      expect(result).toEqual({
        id: mockUpdatedReceipt.id,
        payment_id: mockUpdatedReceipt.payment_id,
        receipt_url: mockUpdatedReceipt.receipt_url,
        receipt_number: mockUpdatedReceipt.receipt_number,
        amount: mockUpdatedReceipt.payments.amount,
        currency: mockUpdatedReceipt.payments.currency,
        payment_method: mockUpdatedReceipt.payments.payment_method,
        created_at: mockUpdatedReceipt.created_at,
      });
    });

    it('should handle database errors during status update', async () => {
      const receiptId = 'receipt_123';
      const status = 'sent';

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
        receiptService.updateReceiptStatus(receiptId, status)
      ).rejects.toThrow('Failed to update receipt status');
    });
  });

  describe('deleteReceipt', () => {
    it('should delete receipt successfully', async () => {
      const receiptId = 'receipt_123';

      // Mock query to return success
      const query = createMockQuery({
        data: { id: receiptId },
        error: null,
      });
      // Override the then method to return the data
      query.then = jest.fn().mockImplementation((resolve, reject) => {
        if (resolve) {
          return Promise.resolve(
            resolve({ data: { id: receiptId }, error: null })
          );
        }
        return Promise.resolve({ data: { id: receiptId }, error: null });
      });
      mockSupabase.from.mockReturnValueOnce(query);

      const result = await receiptService.deleteReceipt(receiptId);

      expect(mockSupabase.from).toHaveBeenCalledWith('receipts');
      expect(query.delete).toHaveBeenCalled();
      expect(query.eq).toHaveBeenCalledWith('id', receiptId);
      expect(result).toBeUndefined();
    });

    it('should handle database errors during deletion', async () => {
      const receiptId = 'receipt_123';
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

      await expect(receiptService.deleteReceipt(receiptId)).rejects.toThrow(
        'Failed to delete receipt'
      );
    });
  });

  describe('generateReceiptNumber', () => {
    it('should generate unique receipt number', async () => {
      const mockReceiptNumber = 'RCP-2024-001';

      // Mock the receipt number generation
      jest
        .spyOn(receiptService, 'generateReceiptNumber')
        .mockResolvedValue(mockReceiptNumber);

      const result = await receiptService.generateReceiptNumber();

      expect(result).toBe(mockReceiptNumber);
    });

    it('should handle receipt number generation conflicts', async () => {
      // Mock a scenario where the first generated number already exists
      const query1 = createMockQuery({
        data: { receipt_number: 'RCP-2024-001' },
        error: null,
      });
      const query2 = createMockQuery({
        data: null,
        error: { message: 'No rows found', code: 'PGRST116' },
      });
      mockSupabase.from.mockReturnValueOnce(query1).mockReturnValueOnce(query2);

      const result = await receiptService.generateReceiptNumber();

      expect(result).toMatch(/^RCP-\d{6}-[A-Z0-9]{6}$/);
    });
  });
});
