/**
 * Bank Transfer Service Unit Tests
 * Comprehensive testing for bank transfer fallback operations
 */

// Create the mock objects BEFORE importing the service
const createMockQuery = (mockData?: { data: any; error: any }) => {
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
import {
  BankTransferService,
  BankTransferCreateData,
} from '@/lib/payments/bank-transfer-service';

describe('BankTransferService', () => {
  let bankTransferService: BankTransferService;

  beforeEach(() => {
    jest.clearAllMocks();
    bankTransferService = new BankTransferService();
  });

  describe('createBankTransfer', () => {
    it('should create bank transfer successfully', async () => {
      const bankTransferData: BankTransferCreateData = {
        subscription_id: 'sub_123',
        amount: 5000,
        reference: 'EventProsNZ-12345678',
        user_id: 'user_123',
      };

      const mockBankTransfer = {
        id: 'bt_123',
        ...bankTransferData,
        status: 'pending',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      };

      // Mock query to return bank transfer
      const mockQuery = createMockQuery();
      mockQuery.single.mockResolvedValue({
        data: mockBankTransfer,
        error: null,
      });
      mockSupabase.from.mockReturnValueOnce(mockQuery);

      const result =
        await bankTransferService.createBankTransfer(bankTransferData);

      expect(mockSupabase.from).toHaveBeenCalledWith('bank_transfers');
      expect(mockQuery.insert).toHaveBeenCalledWith({
        subscription_id: bankTransferData.subscription_id,
        amount: bankTransferData.amount,
        reference: bankTransferData.reference,
        user_id: bankTransferData.user_id,
        status: 'pending',
      });
      expect(result).toEqual(mockBankTransfer);
    });

    it('should handle database errors during creation', async () => {
      const bankTransferData: BankTransferCreateData = {
        subscription_id: 'sub_123',
        amount: 5000,
        reference: 'EventProsNZ-12345678',
        user_id: 'user_123',
      };

      const dbError = { message: 'Database connection failed' };
      // Mock insert to return error
      const insertQuery = createMockQuery({
        data: null,
        error: dbError,
      });
      mockSupabase.from.mockReturnValueOnce(insertQuery);

      await expect(
        bankTransferService.createBankTransfer(bankTransferData)
      ).rejects.toThrow(
        'Failed to create bank transfer: Database connection failed'
      );
    });

    it('should handle missing required fields', async () => {
      const invalidBankTransferData = {
        subscription_id: 'sub_123',
        // Missing required fields
      } as any;

      // Mock query to return error for missing fields
      const query = createMockQuery({
        data: null,
        error: { message: 'Missing required fields' },
      });
      mockSupabase.from.mockReturnValueOnce(query);

      await expect(
        bankTransferService.createBankTransfer(invalidBankTransferData)
      ).rejects.toThrow(
        'Failed to create bank transfer: Missing required fields'
      );
    });
  });

  describe('getBankTransfer', () => {
    it('should retrieve bank transfer by ID successfully', async () => {
      const bankTransferId = 'bt_123';
      const mockBankTransfer = {
        id: bankTransferId,
        subscription_id: 'sub_123',
        amount: 5000,
        reference: 'EventProsNZ-12345678',
        status: 'pending',
        created_at: '2024-01-01T00:00:00Z',
      };

      // Mock query to return bank transfer
      const query = createMockQuery({
        data: mockBankTransfer,
        error: null,
      });
      mockSupabase.from.mockReturnValueOnce(query);

      const result = await bankTransferService.getBankTransfer(bankTransferId);

      expect(mockSupabase.from).toHaveBeenCalledWith('bank_transfers');
      expect(query.select).toHaveBeenCalledWith('*');
      expect(query.eq).toHaveBeenCalledWith('id', bankTransferId);
      expect(result).toEqual(mockBankTransfer);
    });

    it('should return null when bank transfer not found', async () => {
      const bankTransferId = 'bt_nonexistent';

      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: null,
          error: { code: 'PGRST116', message: 'No rows found' },
        }),
      };

      mockSupabase.from.mockReturnValue(mockQuery);

      const result = await bankTransferService.getBankTransfer(bankTransferId);

      expect(result).toBeNull();
    });

    it('should handle database errors during retrieval', async () => {
      const bankTransferId = 'bt_123';
      const dbError = { message: 'Database connection failed' };

      // Mock query to return error
      const query = createMockQuery({
        data: null,
        error: dbError,
      });
      mockSupabase.from.mockReturnValueOnce(query);

      await expect(
        bankTransferService.getBankTransfer(bankTransferId)
      ).rejects.toThrow(
        'Failed to get bank transfer: Database connection failed'
      );
    });
  });

  describe('getBankTransfersByUser', () => {
    it('should retrieve user bank transfers successfully', async () => {
      const userId = 'user_123';
      const mockBankTransfers = [
        {
          id: 'bt_1',
          user_id: userId,
          amount: 5000,
          status: 'pending',
          reference: 'EventProsNZ-12345678',
        },
        {
          id: 'bt_2',
          user_id: userId,
          amount: 3000,
          status: 'completed',
          reference: 'EventProsNZ-87654321',
        },
      ];

      // Mock the query chain to return the expected data
      const mockQuery = createMockQuery({
        data: mockBankTransfers,
        error: null,
      });
      mockSupabase.from.mockReturnValue(mockQuery);

      const result = await bankTransferService.getBankTransfersByUser(userId);

      expect(mockSupabase.from).toHaveBeenCalledWith('bank_transfers');
      expect(mockQuery.eq).toHaveBeenCalledWith('user_id', userId);
      expect(result).toEqual(mockBankTransfers);
    });

    it('should return empty array when no bank transfers found', async () => {
      const userId = 'user_nonexistent';

      // Mock query to return empty array
      const query = createMockQuery({
        data: [],
        error: null,
      });
      mockSupabase.from.mockReturnValueOnce(query);

      const result = await bankTransferService.getBankTransfersByUser(userId);

      expect(result).toEqual([]);
    });

    it('should handle database errors during retrieval', async () => {
      const userId = 'user_123';
      const dbError = { message: 'Database connection failed' };

      // Mock query to return error
      const query = createMockQuery({
        data: null,
        error: dbError,
      });
      mockSupabase.from.mockReturnValueOnce(query);

      await expect(
        bankTransferService.getBankTransfersByUser(userId)
      ).rejects.toThrow(
        'Failed to retrieve bank transfers: Database connection failed'
      );
    });
  });

  describe('updateBankTransferStatus', () => {
    it('should update bank transfer status successfully', async () => {
      const bankTransferId = 'bt_123';
      const newStatus = 'completed';
      const adminNotes = 'Payment verified and processed';

      const mockUpdatedBankTransfer = {
        id: bankTransferId,
        status: newStatus,
        admin_notes: adminNotes,
        updated_at: '2024-01-01T00:00:00Z',
      };

      mockSupabase.from().update().eq().select().single.mockResolvedValue({
        data: mockUpdatedBankTransfer,
        error: null,
      });

      const result = await bankTransferService.updateBankTransferStatus(
        bankTransferId,
        newStatus,
        adminNotes
      );

      expect(mockSupabase.from).toHaveBeenCalledWith('bank_transfers');
      expect(mockSupabase.from().update).toHaveBeenCalledWith({
        status: newStatus,
        admin_notes: adminNotes,
        updated_at: expect.any(String),
      });
      expect(mockSupabase.from().update().eq).toHaveBeenCalledWith(
        'id',
        bankTransferId
      );
      expect(result).toEqual(mockUpdatedBankTransfer);
    });

    it('should update status without admin notes', async () => {
      const bankTransferId = 'bt_123';
      const newStatus = 'pending';

      const mockUpdatedBankTransfer = {
        id: bankTransferId,
        status: newStatus,
        updated_at: '2024-01-01T00:00:00Z',
      };

      // Mock query to return updated bank transfer
      const query = createMockQuery({
        data: mockUpdatedBankTransfer,
        error: null,
      });
      mockSupabase.from.mockReturnValueOnce(query);

      const result = await bankTransferService.updateBankTransferStatus(
        bankTransferId,
        newStatus
      );

      expect(query.update).toHaveBeenCalledWith({
        status: newStatus,
        updated_at: expect.any(String),
      });
      expect(result).toEqual(mockUpdatedBankTransfer);
    });

    it('should handle database errors during status update', async () => {
      const bankTransferId = 'bt_123';
      const newStatus = 'completed';

      const dbError = { message: 'Update failed' };
      mockSupabase.from().update().eq().select().single.mockResolvedValue({
        data: null,
        error: dbError,
      });

      await expect(
        bankTransferService.updateBankTransferStatus(bankTransferId, newStatus)
      ).rejects.toThrow('Failed to update bank transfer status: Update failed');
    });
  });

  describe('getPendingBankTransfers', () => {
    it('should retrieve pending bank transfers successfully', async () => {
      const mockPendingTransfers = [
        {
          id: 'bt_1',
          status: 'pending',
          amount: 5000,
          reference: 'EventProsNZ-12345678',
          created_at: '2024-01-01T00:00:00Z',
        },
        {
          id: 'bt_2',
          status: 'pending',
          amount: 3000,
          reference: 'EventProsNZ-87654321',
          created_at: '2024-01-02T00:00:00Z',
        },
      ];

      // Mock query to return pending transfers
      const query = createMockQuery({
        data: mockPendingTransfers,
        error: null,
      });
      mockSupabase.from.mockReturnValueOnce(query);

      const result = await bankTransferService.getPendingBankTransfers();

      expect(mockSupabase.from).toHaveBeenCalledWith('bank_transfers');
      expect(query.select).toHaveBeenCalledWith('*');
      expect(query.eq).toHaveBeenCalledWith('status', 'pending');
      expect(result).toEqual(mockPendingTransfers);
    });

    it('should return empty array when no pending transfers found', async () => {
      // Mock query to return empty array
      const query = createMockQuery({
        data: [],
        error: null,
      });
      mockSupabase.from.mockReturnValueOnce(query);

      const result = await bankTransferService.getPendingBankTransfers();

      expect(result).toEqual([]);
    });

    it('should handle database errors during pending transfers retrieval', async () => {
      const dbError = { message: 'Database connection failed' };

      // Mock query to return error
      const query = createMockQuery({
        data: null,
        error: dbError,
      });
      mockSupabase.from.mockReturnValueOnce(query);

      await expect(
        bankTransferService.getPendingBankTransfers()
      ).rejects.toThrow(
        'Failed to retrieve pending bank transfers: Database connection failed'
      );
    });
  });

  describe('getBankTransferInstructions', () => {
    it('should generate bank transfer instructions successfully', async () => {
      const bankTransferId = 'bt_123';
      const mockBankTransfer = {
        id: bankTransferId,
        amount: 5000,
        reference: 'EventProsNZ-12345678',
        status: 'pending',
      };

      // Mock query to return bank transfer
      const query = createMockQuery({
        data: mockBankTransfer,
        error: null,
      });
      mockSupabase.from.mockReturnValueOnce(query);

      const result =
        await bankTransferService.getBankTransferInstructions(bankTransferId);

      expect(mockSupabase.from).toHaveBeenCalledWith('bank_transfers');
      expect(query.select).toHaveBeenCalledWith('*');
      expect(query.eq).toHaveBeenCalledWith('id', bankTransferId);
      expect(result).toEqual({
        bank_name: 'EventProsNZ Bank',
        account_number: '12-3456-7890123-00',
        account_name: 'EventProsNZ Limited',
        instructions: expect.any(Array),
        reference_format: expect.any(String),
      });
    });

    it('should handle bank transfer not found for instructions', async () => {
      const bankTransferId = 'bt_nonexistent';

      // Mock query to return not found
      const query = createMockQuery({
        data: null,
        error: { message: 'No rows found' },
      });
      mockSupabase.from.mockReturnValueOnce(query);

      await expect(
        bankTransferService.getBankTransferInstructions(bankTransferId)
      ).rejects.toThrow('Failed to get bank transfer instructions');
    });
  });

  describe('validateBankTransferOwnership', () => {
    it('should validate bank transfer ownership successfully', async () => {
      const bankTransferId = 'bt_123';
      const userId = 'user_123';

      const mockBankTransfer = {
        id: bankTransferId,
        user_id: userId,
        amount: 5000,
      };

      // Mock query to return bank transfer
      const query = createMockQuery({
        data: mockBankTransfer,
        error: null,
      });
      mockSupabase.from.mockReturnValueOnce(query);

      const result = await bankTransferService.validateBankTransferOwnership(
        bankTransferId,
        userId
      );

      expect(result).toBe(true);
      expect(mockSupabase.from).toHaveBeenCalledWith('bank_transfers');
      expect(query.select).toHaveBeenCalledWith('user_id');
      expect(query.eq).toHaveBeenCalledWith('id', bankTransferId);
    });

    it('should return false when bank transfer does not belong to user', async () => {
      const bankTransferId = 'bt_123';
      const userId = 'user_123';

      const mockBankTransfer = {
        id: bankTransferId,
        user_id: 'different_user',
        amount: 5000,
      };

      // Mock query to return bank transfer
      const query = createMockQuery({
        data: mockBankTransfer,
        error: null,
      });
      mockSupabase.from.mockReturnValueOnce(query);

      const result = await bankTransferService.validateBankTransferOwnership(
        bankTransferId,
        userId
      );

      expect(result).toBe(false);
    });

    it('should return false when bank transfer not found', async () => {
      const bankTransferId = 'bt_nonexistent';
      const userId = 'user_123';

      // Mock query to return not found
      const query = createMockQuery({
        data: null,
        error: { message: 'No rows found' },
      });
      mockSupabase.from.mockReturnValueOnce(query);

      await expect(
        bankTransferService.validateBankTransferOwnership(
          bankTransferId,
          userId
        )
      ).rejects.toThrow('Failed to validate ownership: No rows found');
    });
  });

  describe('deleteBankTransfer', () => {
    it('should delete bank transfer successfully', async () => {
      const bankTransferId = 'bt_123';

      // Mock query to return success
      const query = createMockQuery({
        data: { id: bankTransferId },
        error: null,
      });
      mockSupabase.from.mockReturnValueOnce(query);

      await bankTransferService.deleteBankTransfer(bankTransferId);

      expect(mockSupabase.from).toHaveBeenCalledWith('bank_transfers');
      expect(query.delete).toHaveBeenCalled();
      expect(query.eq).toHaveBeenCalledWith('id', bankTransferId);
    });

    it('should handle database errors during deletion', async () => {
      const bankTransferId = 'bt_123';
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
        bankTransferService.deleteBankTransfer(bankTransferId)
      ).rejects.toThrow('Failed to delete bank transfer: Delete failed');
    });
  });

  describe('getBankTransferStatistics', () => {
    it('should retrieve bank transfer statistics successfully', async () => {
      const userId = 'user_123';
      const mockStats = {
        total_transfers: 3,
        pending_transfers: 1,
        completed_transfers: 1,
        total_amount: 3500,
        average_amount: 1166.6666666666667,
      };

      // Mock query to return statistics data
      const query = createMockQuery({
        data: [
          { status: 'pending', amount: 1000, created_at: '2024-01-01' },
          { status: 'completed', amount: 2000, created_at: '2024-01-02' },
          { status: 'failed', amount: 500, created_at: '2024-01-03' },
        ],
        error: null,
      });
      // Override the then method to return the data when awaited
      query.then = jest.fn().mockImplementation((resolve, reject) => {
        if (resolve) {
          return Promise.resolve(
            resolve({
              data: [
                { status: 'pending', amount: 1000, created_at: '2024-01-01' },
                { status: 'completed', amount: 2000, created_at: '2024-01-02' },
                { status: 'failed', amount: 500, created_at: '2024-01-03' },
              ],
              error: null,
            })
          );
        }
        return Promise.resolve({
          data: [
            { status: 'pending', amount: 1000, created_at: '2024-01-01' },
            { status: 'completed', amount: 2000, created_at: '2024-01-02' },
            { status: 'failed', amount: 500, created_at: '2024-01-03' },
          ],
          error: null,
        });
      });
      mockSupabase.from.mockReturnValueOnce(query);

      const result =
        await bankTransferService.getBankTransferStatistics(userId);

      expect(mockSupabase.from).toHaveBeenCalledWith('bank_transfers');
      expect(query.select).toHaveBeenCalledWith('status, amount, created_at');
      expect(query.eq).toHaveBeenCalledWith('user_id', userId);
      expect(result).toEqual(mockStats);
    });

    it('should handle database errors during statistics retrieval', async () => {
      const userId = 'user_123';
      const dbError = { message: 'Statistics query failed' };

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
        bankTransferService.getBankTransferStatistics(userId)
      ).rejects.toThrow('Failed to get statistics: Statistics query failed');
    });
  });

  describe('generateReference', () => {
    it('should generate unique reference successfully', async () => {
      const subscriptionId = 'sub_123';
      const mockReference = 'EventProsNZ-12345678';

      // Mock query to return not found (no existing reference)
      const query = createMockQuery({
        data: null,
        error: { message: 'No rows found' },
      });
      mockSupabase.from.mockReturnValueOnce(query);

      const result =
        await bankTransferService.generateReference(subscriptionId);

      expect(result).toMatch(/^EventProsNZ-\d{8}$/);
    });

    it('should handle reference generation conflicts', async () => {
      const subscriptionId = 'sub_123';

      // Mock a scenario where the first generated reference already exists
      // Mock first query to return existing reference
      const query1 = createMockQuery({
        data: { reference: 'EventProsNZ-12345678' },
        error: null,
      });
      // Mock second query to return not found
      const query2 = createMockQuery({
        data: null,
        error: { message: 'No rows found' },
      });

      mockSupabase.from.mockReturnValueOnce(query1).mockReturnValueOnce(query2);

      const result =
        await bankTransferService.generateReference(subscriptionId);

      expect(result).toMatch(/^EventProsNZ-\d{8}$/);
    });
  });
});
