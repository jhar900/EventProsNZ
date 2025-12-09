/**
 * Integration tests for Stripe webhook handler
 */

import { POST } from '@/app/api/stripe/webhook/route';
import { NextRequest } from 'next/server';
import Stripe from 'stripe';

// Mock environment variables
process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test_webhook_secret';
process.env.NODE_ENV = 'test';

// Mock Stripe service
jest.mock('@/lib/payments/stripe-service', () => ({
  StripeService: jest.fn().mockImplementation(() => ({
    verifyWebhookSignature: jest.fn((payload, signature, secret) => {
      if (signature === 'invalid') {
        throw new Error('Invalid signature');
      }
      return JSON.parse(payload);
    }),
    handlePaymentWebhook: jest.fn(),
  })),
}));

// Mock services
jest.mock('@/lib/payments/payment-service');
jest.mock('@/lib/payments/failed-payment-service');
jest.mock('@/lib/payments/notification-service');
jest.mock('@/lib/subscriptions/subscription-service');
jest.mock('@/lib/subscriptions/webhook-sync');

describe('Stripe Webhook Handler', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const createWebhookRequest = (
    event: Stripe.Event,
    signature: string = 'valid_signature'
  ): NextRequest => {
    const body = JSON.stringify(event);
    const headers = new Headers({
      'stripe-signature': signature,
      'content-type': 'application/json',
    });

    return new NextRequest('http://localhost:3000/api/stripe/webhook', {
      method: 'POST',
      headers,
      body,
    });
  };

  describe('Signature Verification', () => {
    it('should reject requests without signature', async () => {
      const event: Stripe.Event = {
        id: 'evt_test',
        object: 'event',
        type: 'customer.subscription.created',
        data: { object: {} as any },
        created: Math.floor(Date.now() / 1000),
        livemode: false,
        pending_webhooks: 0,
        request: null,
        api_version: '2025-08-27.basil',
      };

      const request = createWebhookRequest(event, '');
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Missing Stripe signature');
    });

    it('should reject requests with invalid signature', async () => {
      const event: Stripe.Event = {
        id: 'evt_test',
        object: 'event',
        type: 'customer.subscription.created',
        data: { object: {} as any },
        created: Math.floor(Date.now() / 1000),
        livemode: false,
        pending_webhooks: 0,
        request: null,
        api_version: '2025-08-27.basil',
      };

      const request = createWebhookRequest(event, 'invalid');
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid signature');
    });
  });

  describe('Subscription Events', () => {
    it('should handle customer.subscription.created', async () => {
      const subscription: Stripe.Subscription = {
        id: 'sub_test123',
        object: 'subscription',
        status: 'active',
        customer: 'cus_test123',
        current_period_start: Math.floor(Date.now() / 1000),
        current_period_end: Math.floor(Date.now() / 1000) + 2592000,
        canceled_at: null,
      } as Stripe.Subscription;

      const event: Stripe.Event = {
        id: 'evt_test',
        object: 'event',
        type: 'customer.subscription.created',
        data: { object: subscription },
        created: Math.floor(Date.now() / 1000),
        livemode: false,
        pending_webhooks: 0,
        request: null,
        api_version: '2025-08-27.basil',
      };

      const request = createWebhookRequest(event);
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.received).toBe(true);
    });

    it('should handle customer.subscription.updated', async () => {
      const subscription: Stripe.Subscription = {
        id: 'sub_test123',
        object: 'subscription',
        status: 'active',
        customer: 'cus_test123',
        current_period_start: Math.floor(Date.now() / 1000),
        current_period_end: Math.floor(Date.now() / 1000) + 2592000,
        canceled_at: null,
      } as Stripe.Subscription;

      const event: Stripe.Event = {
        id: 'evt_test',
        object: 'event',
        type: 'customer.subscription.updated',
        data: { object: subscription },
        created: Math.floor(Date.now() / 1000),
        livemode: false,
        pending_webhooks: 0,
        request: null,
        api_version: '2025-08-27.basil',
      };

      const request = createWebhookRequest(event);
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.received).toBe(true);
    });

    it('should handle customer.subscription.deleted', async () => {
      const subscription: Stripe.Subscription = {
        id: 'sub_test123',
        object: 'subscription',
        status: 'canceled',
        customer: 'cus_test123',
        current_period_start: Math.floor(Date.now() / 1000),
        current_period_end: Math.floor(Date.now() / 1000) + 2592000,
        canceled_at: Math.floor(Date.now() / 1000),
      } as Stripe.Subscription;

      const event: Stripe.Event = {
        id: 'evt_test',
        object: 'event',
        type: 'customer.subscription.deleted',
        data: { object: subscription },
        created: Math.floor(Date.now() / 1000),
        livemode: false,
        pending_webhooks: 0,
        request: null,
        api_version: '2025-08-27.basil',
      };

      const request = createWebhookRequest(event);
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.received).toBe(true);
    });
  });

  describe('Invoice Events', () => {
    it('should handle invoice.payment_succeeded', async () => {
      const invoice: Stripe.Invoice = {
        id: 'in_test123',
        object: 'invoice',
        subscription: 'sub_test123',
        customer: 'cus_test123',
        amount_paid: 1000,
        currency: 'nzd',
        status: 'paid',
      } as Stripe.Invoice;

      const event: Stripe.Event = {
        id: 'evt_test',
        object: 'event',
        type: 'invoice.payment_succeeded',
        data: { object: invoice },
        created: Math.floor(Date.now() / 1000),
        livemode: false,
        pending_webhooks: 0,
        request: null,
        api_version: '2025-08-27.basil',
      };

      const request = createWebhookRequest(event);
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.received).toBe(true);
    });

    it('should handle invoice.payment_failed', async () => {
      const invoice: Stripe.Invoice = {
        id: 'in_test456',
        object: 'invoice',
        subscription: 'sub_test123',
        customer: 'cus_test123',
        amount_due: 1000,
        currency: 'nzd',
        attempt_count: 1,
        status: 'open',
      } as Stripe.Invoice;

      const event: Stripe.Event = {
        id: 'evt_test',
        object: 'event',
        type: 'invoice.payment_failed',
        data: { object: invoice },
        created: Math.floor(Date.now() / 1000),
        livemode: false,
        pending_webhooks: 0,
        request: null,
        api_version: '2025-08-27.basil',
      };

      const request = createWebhookRequest(event);
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.received).toBe(true);
    });
  });

  describe('Payment Intent Events', () => {
    it('should handle payment_intent.succeeded', async () => {
      const paymentIntent: Stripe.PaymentIntent = {
        id: 'pi_test123',
        object: 'payment_intent',
        status: 'succeeded',
        amount: 1000,
        currency: 'nzd',
        customer: 'cus_test123',
      } as Stripe.PaymentIntent;

      const event: Stripe.Event = {
        id: 'evt_test',
        object: 'event',
        type: 'payment_intent.succeeded',
        data: { object: paymentIntent },
        created: Math.floor(Date.now() / 1000),
        livemode: false,
        pending_webhooks: 0,
        request: null,
        api_version: '2025-08-27.basil',
      };

      const request = createWebhookRequest(event);
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.received).toBe(true);
    });

    it('should handle payment_intent.payment_failed', async () => {
      const paymentIntent: Stripe.PaymentIntent = {
        id: 'pi_test456',
        object: 'payment_intent',
        status: 'requires_payment_method',
        amount: 1000,
        currency: 'nzd',
        customer: 'cus_test123',
        last_payment_error: {
          type: 'card_error',
          message: 'Your card was declined.',
        },
      } as Stripe.PaymentIntent;

      const event: Stripe.Event = {
        id: 'evt_test',
        object: 'event',
        type: 'payment_intent.payment_failed',
        data: { object: paymentIntent },
        created: Math.floor(Date.now() / 1000),
        livemode: false,
        pending_webhooks: 0,
        request: null,
        api_version: '2025-08-27.basil',
      };

      const request = createWebhookRequest(event);
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.received).toBe(true);
    });
  });

  describe('Error Handling', () => {
    it('should handle webhook processing errors gracefully', async () => {
      const event: Stripe.Event = {
        id: 'evt_test',
        object: 'event',
        type: 'customer.subscription.created',
        data: { object: null as any }, // Invalid data
        created: Math.floor(Date.now() / 1000),
        livemode: false,
        pending_webhooks: 0,
        request: null,
        api_version: '2025-08-27.basil',
      };

      const request = createWebhookRequest(event);
      const response = await POST(request);

      // Should still return 200 to acknowledge receipt, even if processing fails
      expect(response.status).toBe(200);
    });
  });
});
