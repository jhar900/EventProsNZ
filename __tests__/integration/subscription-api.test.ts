/**
 * Subscription API Integration Tests
 * Tests for complete subscription flows with Stripe integration
 */

import { NextRequest } from 'next/server';
import { GET, POST } from '@/app/api/subscriptions/route';
import { createClient } from '@/lib/supabase/server';

// Mock NextRequest
const createMockRequest = (url: string, options: any = {}) => {
  const request = new NextRequest(url, options);
  request.json = jest
    .fn()
    .mockResolvedValue(options.body ? JSON.parse(options.body) : {});
  return request;
};

// Mock Supabase
jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(),
}));

// Mock SubscriptionService
const mockSubscriptionService = {
  getCurrentSubscription: jest.fn(),
  getUserSubscriptions: jest.fn(),
  createSubscription: jest.fn(),
};

jest.mock('@/lib/subscriptions/subscription-service', () => ({
  SubscriptionService: jest
    .fn()
    .mockImplementation(() => mockSubscriptionService),
}));

// Mock Stripe service
jest.mock('@/lib/subscriptions/stripe-service', () => ({
  StripeService: jest.fn().mockImplementation(() => ({
    getOrCreateCustomer: jest.fn().mockResolvedValue({
      id: 'cus_test123',
      email: 'test@example.com',
      metadata: { userId: 'user123' },
    }),
    createPrice: jest.fn().mockResolvedValue({
      id: 'price_test123',
      unit_amount: 2900,
      currency: 'nzd',
      recurring: { interval: 'month', interval_count: 1 },
    }),
    createSubscription: jest.fn().mockResolvedValue({
      id: 'sub_test123',
      customer: 'cus_test123',
      status: 'trialing',
      current_period_start: Date.now() / 1000,
      current_period_end: Date.now() / 1000 + 14 * 24 * 60 * 60,
      items: {
        data: [
          {
            price: { id: 'price_test123', unit_amount: 2900, currency: 'nzd' },
          },
        ],
      },
    }),
  })),
}));

// Mock audit logger
jest.mock('@/lib/subscriptions/audit-logger', () => ({
  AuditLogger: jest.fn().mockImplementation(() => ({
    logSubscriptionEvent: jest.fn().mockResolvedValue(undefined),
    logSecurityEvent: jest.fn().mockResolvedValue(undefined),
  })),
}));

// Mock rate limiting
jest.mock('@/lib/rate-limiting', () => ({
  rateLimit: jest.fn().mockReturnValue({
    allowed: true,
    headers: {
      'X-RateLimit-Limit': '100',
      'X-RateLimit-Remaining': '99',
      'X-RateLimit-Reset': '1234567890',
    },
  }),
  subscriptionRateLimiter: {},
}));

// Mock Next.js headers
jest.mock('next/headers', () => ({
  headers: jest.fn().mockReturnValue({
    get: jest.fn().mockImplementation((key: string) => {
      const mockHeaders: Record<string, string> = {
        'x-forwarded-for': '192.168.1.1',
        'x-real-ip': '192.168.1.1',
        'user-agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      };
      return mockHeaders[key.toLowerCase()] || null;
    }),
  }),
}));

describe('Subscription API Integration', () => {
  let mockSupabase: any;

  beforeEach(() => {
    // Reset rate limit mock
    const { rateLimit } = require('@/lib/rate-limiting');
    rateLimit.mockReturnValue({
      allowed: true,
      headers: {
        'X-RateLimit-Limit': '100',
        'X-RateLimit-Remaining': '99',
        'X-RateLimit-Reset': '1234567890',
      },
    });

    mockSupabase = {
      auth: {
        getUser: jest.fn(),
      },
      from: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      single: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
    };

    (createClient as jest.Mock).mockReturnValue(mockSupabase);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/subscriptions', () => {
    it('should fetch user subscriptions successfully', async () => {
      const mockUser = { id: 'user123', email: 'test@example.com' };
      const mockSubscriptions = [
        {
          id: 'sub123',
          user_id: 'user123',
          tier: 'showcase',
          status: 'active',
          billing_cycle: 'monthly',
          price: 29.0,
        },
      ];

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      // Mock getUserSubscriptions method
      mockSubscriptionService.getUserSubscriptions.mockResolvedValue(
        mockSubscriptions
      );

      const request = createMockRequest(
        'http://localhost:3000/api/subscriptions'
      );
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.subscriptions).toBeDefined();
      expect(data.total).toBe(1);
    });

    it('should return 401 for unauthorized requests', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: new Error('Unauthorized'),
      });

      const request = createMockRequest(
        'http://localhost:3000/api/subscriptions'
      );
      const response = await GET(request);

      expect(response.status).toBe(401);
    });

    it('should enforce rate limiting', async () => {
      const { rateLimit } = require('@/lib/rate-limiting');
      rateLimit.mockReturnValue({
        allowed: false,
        headers: {
          'X-RateLimit-Limit': '100',
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': '1234567890',
        },
        message: 'Too many requests',
      });

      const request = createMockRequest(
        'http://localhost:3000/api/subscriptions'
      );
      const response = await GET(request);

      expect(response.status).toBe(429);
    });
  });

  describe('POST /api/subscriptions', () => {
    it('should create subscription with Stripe integration', async () => {
      const mockUser = { id: 'user123', email: 'test@example.com' };
      const mockUserData = { email: 'test@example.com' };
      const mockSubscription = {
        id: 'sub123',
        user_id: 'user123',
        tier: 'showcase',
        status: 'trial',
        billing_cycle: 'monthly',
        price: 29.0,
        stripe_customer_id: 'cus_test123',
        stripe_subscription_id: 'sub_test123',
        stripe_price_id: 'price_test123',
      };

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: mockUserData,
              error: null,
            }),
          }),
        }),
      });

      // Mock getCurrentSubscription to return null (no existing subscription)
      mockSubscriptionService.getCurrentSubscription.mockResolvedValue(null);

      // Mock subscription creation
      mockSubscriptionService.createSubscription.mockResolvedValue(
        mockSubscription
      );

      const requestBody = {
        tier: 'showcase',
        billing_cycle: 'monthly',
        promotional_code: 'WELCOME10',
      };

      const request = createMockRequest(
        'http://localhost:3000/api/subscriptions',
        {
          method: 'POST',
          body: JSON.stringify(requestBody),
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.subscription).toBeDefined();
      expect(data.subscription.stripe_customer_id).toBe('cus_test123');
      expect(data.subscription.stripe_subscription_id).toBe('sub_test123');
    });

    it('should validate input data', async () => {
      const mockUser = { id: 'user123', email: 'test@example.com' };

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      const requestBody = {
        tier: 'invalid_tier',
        billing_cycle: 'monthly',
      };

      const request = createMockRequest(
        'http://localhost:3000/api/subscriptions',
        {
          method: 'POST',
          body: JSON.stringify(requestBody),
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Validation failed');
      expect(data.details).toContain('Invalid subscription tier');
    });

    it('should prevent duplicate subscriptions', async () => {
      const mockUser = { id: 'user123', email: 'test@example.com' };
      const mockExistingSubscription = {
        id: 'sub123',
        user_id: 'user123',
        tier: 'showcase',
        status: 'active',
      };

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      // Mock getCurrentSubscription to return existing subscription
      mockSubscriptionService.getCurrentSubscription.mockResolvedValue(
        mockExistingSubscription
      );

      const requestBody = {
        tier: 'showcase',
        billing_cycle: 'monthly',
      };

      const request = createMockRequest(
        'http://localhost:3000/api/subscriptions',
        {
          method: 'POST',
          body: JSON.stringify(requestBody),
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('User already has an active subscription');
    });

    it('should handle Stripe integration errors', async () => {
      const mockUser = { id: 'user123', email: 'test@example.com' };
      const mockUserData = { email: 'test@example.com' };

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: mockUserData,
              error: null,
            }),
          }),
        }),
      });

      // Mock getCurrentSubscription to return null
      mockSubscriptionService.getCurrentSubscription.mockResolvedValue(null);

      // Mock createSubscription to throw error
      mockSubscriptionService.createSubscription.mockRejectedValue(
        new Error('Stripe API error')
      );

      const requestBody = {
        tier: 'showcase',
        billing_cycle: 'monthly',
      };

      const request = createMockRequest(
        'http://localhost:3000/api/subscriptions',
        {
          method: 'POST',
          body: JSON.stringify(requestBody),
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to create subscription');
    });
  });

  describe('Security Tests', () => {
    it('should handle security events for failed operations', async () => {
      const mockUser = { id: 'user123', email: 'test@example.com' };

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      // Mock user email lookup
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: { email: 'test@example.com' },
              error: null,
            }),
          }),
        }),
      });

      // Mock Stripe service to throw error
      const { StripeService } = require('@/lib/subscriptions/stripe-service');
      StripeService.mockImplementation(() => ({
        getOrCreateCustomer: jest
          .fn()
          .mockRejectedValue(new Error('Stripe API error')),
      }));

      const requestBody = {
        tier: 'showcase',
        billing_cycle: 'monthly',
      };

      const request = createMockRequest(
        'http://localhost:3000/api/subscriptions',
        {
          method: 'POST',
          body: JSON.stringify(requestBody),
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      const response = await POST(request);

      // Verify that the API returns an error response
      expect(response.status).toBe(500);
      const responseData = await response.json();
      expect(responseData.error).toBe('Failed to create subscription');
    });

    it('should include rate limit headers in responses', async () => {
      const mockUser = { id: 'user123', email: 'test@example.com' };

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            order: jest.fn().mockReturnValue({
              limit: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: null,
                  error: { code: 'PGRST116' },
                }),
              }),
            }),
          }),
        }),
      });

      const request = createMockRequest(
        'http://localhost:3000/api/subscriptions'
      );
      const response = await GET(request);

      expect(response.headers.get('X-RateLimit-Limit')).toBe('100');
      expect(response.headers.get('X-RateLimit-Remaining')).toBe('99');
      expect(response.headers.get('X-RateLimit-Reset')).toBe('1234567890');
    });
  });
});
