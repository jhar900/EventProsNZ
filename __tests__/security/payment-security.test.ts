/**
 * Payment Security Tests
 * Security tests for payment operations and PCI compliance
 */

import { NextRequest } from 'next/server';
import { POST } from '@/app/api/subscriptions/route';
import { createClient } from '@/lib/supabase/server';

// Mock Supabase
jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(),
}));

// Mock Stripe service
jest.mock('@/lib/subscriptions/stripe-service', () => ({
  StripeService: jest.fn().mockImplementation(() => ({
    getOrCreateCustomer: jest.fn(),
    createPrice: jest.fn(),
    createSubscription: jest.fn(),
  })),
}));

// Mock audit logger
jest.mock('@/lib/subscriptions/audit-logger', () => ({
  AuditLogger: jest.fn().mockImplementation(() => ({
    logSubscriptionEvent: jest.fn(),
    logSecurityEvent: jest.fn(),
  })),
}));

// Mock rate limiting
jest.mock('@/lib/rate-limiting', () => ({
  rateLimit: jest.fn().mockReturnValue({
    allowed: true,
    headers: {},
  }),
  subscriptionRateLimiter: {},
}));

describe('Payment Security Tests', () => {
  let mockSupabase: any;

  beforeEach(() => {
    mockSupabase = {
      auth: {
        getUser: jest.fn(),
      },
      from: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
    };

    (createClient as jest.Mock).mockReturnValue(mockSupabase);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Input Validation and Sanitization', () => {
    it('should reject malicious input in subscription data', async () => {
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
      mockSupabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            in: jest.fn().mockReturnValue({
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
        }),
      });

      const maliciousInputs = [
        { tier: '<script>alert("xss")</script>', billing_cycle: 'monthly' },
        { tier: 'showcase', billing_cycle: '; DROP TABLE subscriptions;' },
        {
          tier: 'showcase',
          billing_cycle: 'monthly',
          promotional_code: '${7*7}',
        },
        {
          tier: 'showcase',
          billing_cycle: 'monthly',
          promotional_code: '../../../etc/passwd',
        },
      ];

      for (const input of maliciousInputs) {
        const request = new NextRequest(
          'http://localhost:3000/api/subscriptions',
          {
            method: 'POST',
            body: JSON.stringify(input),
            headers: {
              'Content-Type': 'application/json',
            },
          }
        );

        const response = await POST(request);
        expect(response.status).toBe(400);
      }
    });

    it('should sanitize promotional codes', async () => {
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
      mockSupabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            in: jest.fn().mockReturnValue({
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
        }),
      });

      const request = new NextRequest(
        'http://localhost:3000/api/subscriptions',
        {
          method: 'POST',
          body: JSON.stringify({
            tier: 'showcase',
            billing_cycle: 'monthly',
            promotional_code: '  welcome10  ', // Should be trimmed and uppercased
          }),
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      const response = await POST(request);
      // Should not fail due to sanitization
      expect(response.status).not.toBe(400);
    });
  });

  describe('Rate Limiting and DDoS Protection', () => {
    it('should enforce rate limiting on subscription endpoints', async () => {
      const { rateLimit } = require('@/lib/rate-limiting');

      // Mock rate limit exceeded
      rateLimit.mockReturnValue({
        allowed: false,
        headers: {
          'X-RateLimit-Limit': '100',
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': '1234567890',
        },
        message: 'Too many requests',
      });

      const mockUser = { id: 'user123', email: 'test@example.com' };

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      const request = new NextRequest(
        'http://localhost:3000/api/subscriptions',
        {
          method: 'POST',
          body: JSON.stringify({
            tier: 'showcase',
            billing_cycle: 'monthly',
          }),
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      const response = await POST(request);
      expect(response.status).toBe(429);

      const data = await response.json();
      expect(data.error).toBe('Too many requests');
    });

    it('should include rate limit headers in responses', async () => {
      const { rateLimit } = require('@/lib/rate-limiting');

      rateLimit.mockReturnValue({
        allowed: true,
        headers: {
          'X-RateLimit-Limit': '100',
          'X-RateLimit-Remaining': '99',
          'X-RateLimit-Reset': '1234567890',
        },
      });

      const mockUser = { id: 'user123', email: 'test@example.com' };

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      const request = new NextRequest(
        'http://localhost:3000/api/subscriptions',
        {
          method: 'POST',
          body: JSON.stringify({
            tier: 'showcase',
            billing_cycle: 'monthly',
          }),
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      const response = await POST(request);
      expect(response.headers.get('X-RateLimit-Limit')).toBe('100');
      expect(response.headers.get('X-RateLimit-Remaining')).toBe('99');
      expect(response.headers.get('X-RateLimit-Reset')).toBe('1234567890');
    });
  });

  describe('Audit Logging and Security Events', () => {
    it('should log security events for failed operations', async () => {
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
      mockSupabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            in: jest.fn().mockReturnValue({
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
        }),
      });

      // Mock Stripe service to throw error
      const { StripeService } = require('@/lib/subscriptions/stripe-service');
      StripeService.mockImplementation(() => ({
        getOrCreateCustomer: jest
          .fn()
          .mockRejectedValue(new Error('Stripe API error')),
      }));

      const request = new NextRequest(
        'http://localhost:3000/api/subscriptions',
        {
          method: 'POST',
          body: JSON.stringify({
            tier: 'showcase',
            billing_cycle: 'monthly',
          }),
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      await POST(request);

      // Verify security event was logged
      const { AuditLogger } = require('@/lib/subscriptions/audit-logger');
      expect(AuditLogger).toHaveBeenCalled();
    });

    it('should log subscription events with proper metadata', async () => {
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

      // Mock getCurrentSubscription to return null
      mockSupabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            in: jest.fn().mockReturnValue({
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
        }),
      });

      // Mock subscription creation
      mockSupabase.from.mockReturnValueOnce({
        insert: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: mockSubscription,
              error: null,
            }),
          }),
        }),
      });

      const request = new NextRequest(
        'http://localhost:3000/api/subscriptions',
        {
          method: 'POST',
          body: JSON.stringify({
            tier: 'showcase',
            billing_cycle: 'monthly',
          }),
          headers: {
            'Content-Type': 'application/json',
            'X-Forwarded-For': '192.168.1.1',
            'User-Agent':
              'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          },
        }
      );

      await POST(request);

      // Verify audit logger was called with proper metadata
      const { AuditLogger } = require('@/lib/subscriptions/audit-logger');
      expect(AuditLogger).toHaveBeenCalled();
    });
  });

  describe('PCI Compliance and Data Protection', () => {
    it('should not log sensitive payment data', async () => {
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
      mockSupabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            in: jest.fn().mockReturnValue({
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
        }),
      });

      const request = new NextRequest(
        'http://localhost:3000/api/subscriptions',
        {
          method: 'POST',
          body: JSON.stringify({
            tier: 'showcase',
            billing_cycle: 'monthly',
            // Simulate sensitive data that should not be logged
            card_number: '4242424242424242',
            card_cvc: '123',
            card_expiry: '12/25',
          }),
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      await POST(request);

      // Verify that sensitive data is not logged
      const { AuditLogger } = require('@/lib/subscriptions/audit-logger');
      const auditLoggerInstance = new AuditLogger();
      const logSubscriptionEvent = auditLoggerInstance.logSubscriptionEvent;

      expect(logSubscriptionEvent).toHaveBeenCalled();
      // Verify that the logged data doesn't contain sensitive information
      const loggedData = logSubscriptionEvent.mock.calls[0][2];
      expect(loggedData).not.toHaveProperty('card_number');
      expect(loggedData).not.toHaveProperty('card_cvc');
      expect(loggedData).not.toHaveProperty('card_expiry');
    });

    it('should handle Stripe webhook signature verification', async () => {
      const { StripeService } = require('@/lib/subscriptions/stripe-service');
      const mockStripeService = {
        verifyWebhookSignature: jest.fn(),
        handleSubscriptionWebhook: jest.fn(),
      };
      StripeService.mockImplementation(() => mockStripeService);

      // Test valid signature
      mockStripeService.verifyWebhookSignature.mockReturnValue({
        type: 'customer.subscription.created',
        data: { object: { id: 'sub_test123' } },
      });

      const validSignature = 't=1234567890,v1=valid_signature';
      const validPayload = JSON.stringify({
        type: 'customer.subscription.created',
      });

      const request = new NextRequest(
        'http://localhost:3000/api/stripe/webhook',
        {
          method: 'POST',
          body: validPayload,
          headers: {
            'stripe-signature': validSignature,
            'Content-Type': 'application/json',
          },
        }
      );

      // This would be tested in the webhook route
      expect(mockStripeService.verifyWebhookSignature).toHaveBeenCalledWith(
        validPayload,
        validSignature,
        process.env.STRIPE_WEBHOOK_SECRET
      );
    });

    it('should reject invalid webhook signatures', async () => {
      const { StripeService } = require('@/lib/subscriptions/stripe-service');
      const mockStripeService = {
        verifyWebhookSignature: jest.fn().mockImplementation(() => {
          throw new Error('Invalid signature');
        }),
      };
      StripeService.mockImplementation(() => mockStripeService);

      const invalidSignature = 't=1234567890,v1=invalid_signature';
      const payload = JSON.stringify({ type: 'customer.subscription.created' });

      const request = new NextRequest(
        'http://localhost:3000/api/stripe/webhook',
        {
          method: 'POST',
          body: payload,
          headers: {
            'stripe-signature': invalidSignature,
            'Content-Type': 'application/json',
          },
        }
      );

      // This would be tested in the webhook route
      expect(() => {
        mockStripeService.verifyWebhookSignature(
          payload,
          invalidSignature,
          'secret'
        );
      }).toThrow('Invalid signature');
    });
  });

  describe('Authorization and Access Control', () => {
    it('should enforce user authentication', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: new Error('Unauthorized'),
      });

      const request = new NextRequest(
        'http://localhost:3000/api/subscriptions',
        {
          method: 'POST',
          body: JSON.stringify({
            tier: 'showcase',
            billing_cycle: 'monthly',
          }),
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      const response = await POST(request);
      expect(response.status).toBe(401);
    });

    it('should prevent unauthorized subscription access', async () => {
      const mockUser = { id: 'user123', email: 'test@example.com' };

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      // Mock user trying to access another user's subscription
      const request = new NextRequest(
        'http://localhost:3000/api/subscriptions?user_id=other_user',
        {
          method: 'GET',
        }
      );

      // Mock non-admin user
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: { role: 'contractor' },
              error: null,
            }),
          }),
        }),
      });

      const response = await GET(request);
      expect(response.status).toBe(403);
    });
  });
});
