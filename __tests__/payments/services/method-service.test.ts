/**
 * Payment Method Service Unit Tests
 * Comprehensive testing for payment method operations
 */

import type {
  PaymentMethodCreateData,
  PaymentMethod,
} from '@/lib/payments/method-service';

// Create the mock objects BEFORE importing the service
const createMockQuery = () => {
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
    single: jest.fn().mockResolvedValue({ data: null, error: null }),
    maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null }),
    csv: jest.fn().mockResolvedValue(''),
    geojson: jest.fn().mockResolvedValue({}),
    explain: jest.fn().mockResolvedValue({}),
    rollback: jest.fn().mockResolvedValue({}),
    then: jest.fn().mockResolvedValue({ data: [], error: null }),
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
import { PaymentMethodService } from '@/lib/payments/method-service';

describe('PaymentMethodService', () => {
  let paymentMethodService: PaymentMethodService;

  beforeEach(() => {
    jest.clearAllMocks();
    paymentMethodService = new PaymentMethodService();
  });

  describe('createPaymentMethod', () => {
    it('should create payment method successfully', async () => {
      const paymentMethodData: PaymentMethodCreateData = {
        user_id: 'user_123',
        stripe_payment_method_id: 'pm_123',
        type: 'card',
        last_four: '4242',
        brand: 'visa',
        exp_month: 12,
        exp_year: 2025,
        is_default: true,
      };

      const mockPaymentMethod: PaymentMethod = {
        id: 'pm_db_123',
        ...paymentMethodData,
        created_at: '2024-01-01T00:00:00Z',
      } as PaymentMethod;

      const mockQuery = createMockQuery();
      mockQuery.single.mockResolvedValue({
        data: mockPaymentMethod,
        error: null,
      });
      mockSupabase.from.mockReturnValue(mockQuery);

      const result =
        await paymentMethodService.createPaymentMethod(paymentMethodData);

      expect(result).toEqual(mockPaymentMethod);
      expect(mockSupabase.from).toHaveBeenCalledWith('payment_methods');
    });

    it('should handle payment method creation errors', async () => {
      const paymentMethodData: PaymentMethodCreateData = {
        user_id: 'user_123',
        stripe_payment_method_id: 'pm_123',
        type: 'card',
        last_four: '4242',
      };

      const mockQuery = createMockQuery();
      mockQuery.single.mockResolvedValue({
        data: null,
        error: { message: 'Database error' },
      });
      mockSupabase.from.mockReturnValue(mockQuery);

      await expect(
        paymentMethodService.createPaymentMethod(paymentMethodData)
      ).rejects.toThrow('Database error');
    });
  });

  describe('getPaymentMethods', () => {
    it('should retrieve payment methods by user ID successfully', async () => {
      const userId = 'user_123';
      const mockPaymentMethods: PaymentMethod[] = [
        {
          id: 'pm_db_1',
          user_id: userId,
          stripe_payment_method_id: 'pm_1',
          type: 'card',
          last_four: '4242',
          brand: 'visa',
          exp_month: 12,
          exp_year: 2025,
          is_default: true,
          created_at: '2024-01-01T00:00:00Z',
        },
      ];

      const mockQuery = createMockQuery();
      // Mock the thenable behavior - when await is used, it calls then
      mockQuery.then.mockImplementation(resolve => {
        return Promise.resolve(
          resolve({ data: mockPaymentMethods, error: null })
        );
      });
      mockSupabase.from.mockReturnValue(mockQuery);

      const result = await paymentMethodService.getPaymentMethods(userId);

      expect(result).toEqual(mockPaymentMethods);
      expect(mockSupabase.from).toHaveBeenCalledWith('payment_methods');
    });

    it('should handle payment methods retrieval errors', async () => {
      const userId = 'user_123';

      const mockQuery = createMockQuery();
      // Mock the thenable behavior - when await is used, it calls then
      mockQuery.then.mockImplementation(resolve => {
        return Promise.resolve(
          resolve({ data: null, error: { message: 'Database error' } })
        );
      });
      mockSupabase.from.mockReturnValue(mockQuery);

      await expect(
        paymentMethodService.getPaymentMethods(userId)
      ).rejects.toThrow('User not found');
    });
  });

  describe('getPaymentMethod', () => {
    it('should retrieve payment method by ID successfully', async () => {
      const paymentMethodId = 'pm_db_123';
      const mockPaymentMethod: PaymentMethod = {
        id: paymentMethodId,
        user_id: 'user_123',
        stripe_payment_method_id: 'pm_123',
        type: 'card',
        last_four: '4242',
        brand: 'visa',
        exp_month: 12,
        exp_year: 2025,
        is_default: true,
        created_at: '2024-01-01T00:00:00Z',
      };

      const mockQuery = createMockQuery();
      mockQuery.single.mockResolvedValue({
        data: mockPaymentMethod,
        error: null,
      });
      mockSupabase.from.mockReturnValue(mockQuery);

      const result =
        await paymentMethodService.getPaymentMethod(paymentMethodId);

      expect(result).toEqual(mockPaymentMethod);
      expect(mockSupabase.from).toHaveBeenCalledWith('payment_methods');
    });

    it('should handle payment method retrieval errors', async () => {
      const paymentMethodId = 'pm_db_123';

      const mockQuery = createMockQuery();
      mockQuery.single.mockResolvedValue({
        data: null,
        error: { message: 'Not found' },
      });
      mockSupabase.from.mockReturnValue(mockQuery);

      await expect(
        paymentMethodService.getPaymentMethod(paymentMethodId)
      ).rejects.toThrow('Not found');
    });
  });

  describe('updatePaymentMethod', () => {
    it('should update payment method successfully', async () => {
      const paymentMethodId = 'pm_db_123';
      const updateData = { is_default: true };
      const mockPaymentMethod: PaymentMethod = {
        id: paymentMethodId,
        user_id: 'user_123',
        stripe_payment_method_id: 'pm_123',
        type: 'card',
        last_four: '4242',
        is_default: true,
        created_at: '2024-01-01T00:00:00Z',
      };

      const mockQuery = createMockQuery();
      mockQuery.single.mockResolvedValue({
        data: mockPaymentMethod,
        error: null,
      });
      mockSupabase.from.mockReturnValue(mockQuery);

      const result = await paymentMethodService.updatePaymentMethod(
        paymentMethodId,
        updateData
      );

      expect(result).toEqual(mockPaymentMethod);
      expect(mockSupabase.from).toHaveBeenCalledWith('payment_methods');
    });

    it('should handle payment method update errors', async () => {
      const paymentMethodId = 'pm_db_123';
      const updateData = { is_default: true };

      const mockQuery = createMockQuery();
      mockQuery.single.mockResolvedValue({
        data: null,
        error: { message: 'Update failed' },
      });
      mockSupabase.from.mockReturnValue(mockQuery);

      await expect(
        paymentMethodService.updatePaymentMethod(paymentMethodId, updateData)
      ).rejects.toThrow('Update failed');
    });
  });

  describe('deletePaymentMethod', () => {
    it('should delete payment method successfully', async () => {
      const paymentMethodId = 'pm_db_123';

      const mockQuery = createMockQuery();
      // Mock the thenable behavior
      mockQuery.then.mockImplementation(resolve => {
        return Promise.resolve(resolve({ data: null, error: null }));
      });
      mockSupabase.from.mockReturnValue(mockQuery);

      await expect(
        paymentMethodService.deletePaymentMethod(paymentMethodId)
      ).resolves.not.toThrow();

      expect(mockSupabase.from).toHaveBeenCalledWith('payment_methods');
    });

    it('should handle payment method deletion errors', async () => {
      const paymentMethodId = 'pm_db_123';

      const mockQuery = createMockQuery();
      // Mock the thenable behavior
      mockQuery.then.mockImplementation(resolve => {
        return Promise.resolve(
          resolve({ data: null, error: { message: 'Delete failed' } })
        );
      });
      mockSupabase.from.mockReturnValue(mockQuery);

      await expect(
        paymentMethodService.deletePaymentMethod(paymentMethodId)
      ).rejects.toThrow('Deletion failed');
    });
  });

  describe('setDefaultPaymentMethod', () => {
    it('should set default payment method successfully', async () => {
      const userId = 'user_123';
      const paymentMethodId = 'pm_db_123';

      const mockQuery = createMockQuery();
      // Mock the thenable behavior
      mockQuery.then.mockImplementation(resolve => {
        return Promise.resolve(resolve({ data: null, error: null }));
      });
      mockSupabase.from.mockReturnValue(mockQuery);

      await expect(
        paymentMethodService.setDefaultPaymentMethod(userId, paymentMethodId)
      ).resolves.not.toThrow();

      expect(mockSupabase.from).toHaveBeenCalledWith('payment_methods');
    });

    it('should handle default payment method setting errors', async () => {
      const userId = 'user_123';
      const paymentMethodId = 'pm_db_123';

      const mockQuery = createMockQuery();
      // Mock the thenable behavior
      mockQuery.then.mockImplementation(resolve => {
        return Promise.resolve(
          resolve({ data: null, error: { message: 'Update failed' } })
        );
      });
      mockSupabase.from.mockReturnValue(mockQuery);

      await expect(
        paymentMethodService.setDefaultPaymentMethod(userId, paymentMethodId)
      ).rejects.toThrow('Failed to set default payment method');
    });
  });

  describe('getDefaultPaymentMethod', () => {
    it('should retrieve default payment method successfully', async () => {
      const userId = 'user_123';
      const mockPaymentMethod: PaymentMethod = {
        id: 'pm_db_123',
        user_id: userId,
        stripe_payment_method_id: 'pm_123',
        type: 'card',
        last_four: '4242',
        is_default: true,
        created_at: '2024-01-01T00:00:00Z',
      };

      const mockQuery = createMockQuery();
      mockQuery.single.mockResolvedValue({
        data: mockPaymentMethod,
        error: null,
      });
      mockSupabase.from.mockReturnValue(mockQuery);

      const result = await paymentMethodService.getDefaultPaymentMethod(userId);

      expect(result).toEqual(mockPaymentMethod);
      expect(mockSupabase.from).toHaveBeenCalledWith('payment_methods');
    });

    it('should handle default payment method retrieval errors', async () => {
      const userId = 'user_123';

      const mockQuery = createMockQuery();
      mockQuery.single.mockResolvedValue({
        data: null,
        error: { message: 'Not found' },
      });
      mockSupabase.from.mockReturnValue(mockQuery);

      await expect(
        paymentMethodService.getDefaultPaymentMethod(userId)
      ).rejects.toThrow('Failed to get default payment method');
    });
  });

  describe('getPaymentMethodByStripeId', () => {
    it('should retrieve payment method by Stripe ID successfully', async () => {
      const stripePaymentMethodId = 'pm_123';
      const mockPaymentMethod: PaymentMethod = {
        id: 'pm_db_123',
        user_id: 'user_123',
        stripe_payment_method_id: stripePaymentMethodId,
        type: 'card',
        last_four: '4242',
        is_default: true,
        created_at: '2024-01-01T00:00:00Z',
      };

      const mockQuery = createMockQuery();
      mockQuery.single.mockResolvedValue({
        data: mockPaymentMethod,
        error: null,
      });
      mockSupabase.from.mockReturnValue(mockQuery);

      const result = await paymentMethodService.getPaymentMethodByStripeId(
        stripePaymentMethodId
      );

      expect(result).toEqual(mockPaymentMethod);
      expect(mockSupabase.from).toHaveBeenCalledWith('payment_methods');
    });

    it('should handle payment method retrieval by Stripe ID errors', async () => {
      const stripePaymentMethodId = 'pm_123';

      const mockQuery = createMockQuery();
      mockQuery.single.mockResolvedValue({
        data: null,
        error: { message: 'Not found' },
      });
      mockSupabase.from.mockReturnValue(mockQuery);

      await expect(
        paymentMethodService.getPaymentMethodByStripeId(stripePaymentMethodId)
      ).rejects.toThrow('Stripe ID not found');
    });
  });

  describe('validatePaymentMethod', () => {
    it('should validate payment method data successfully', () => {
      const validData: PaymentMethodCreateData = {
        user_id: 'user_123',
        stripe_payment_method_id: 'pm_123',
        type: 'card',
        last_four: '4242',
      };

      expect(() =>
        paymentMethodService.validatePaymentMethod(validData)
      ).not.toThrow();
    });

    it('should throw error for invalid payment method data', () => {
      const invalidData = {
        user_id: 'user_123',
        // Missing required fields
      } as PaymentMethodCreateData;

      expect(() =>
        paymentMethodService.validatePaymentMethod(invalidData)
      ).toThrow();
    });
  });
});
