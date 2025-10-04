/**
 * Stripe Service Unit Tests
 * Comprehensive testing for Stripe payment processing
 */

import { StripeService } from '@/lib/payments/stripe-service';
import Stripe from 'stripe';

// Mock Stripe
jest.mock('stripe', () => {
  return jest.fn().mockImplementation(() => ({
    customers: {
      list: jest.fn(),
      create: jest.fn(),
      retrieve: jest.fn(),
      update: jest.fn(),
    },
    paymentIntents: {
      create: jest.fn(),
      retrieve: jest.fn(),
      confirm: jest.fn(),
      update: jest.fn(),
    },
    paymentMethods: {
      create: jest.fn(),
      retrieve: jest.fn(),
      attach: jest.fn(),
      detach: jest.fn(),
      list: jest.fn(),
    },
    webhooks: {
      constructEvent: jest.fn(),
    },
  }));
});

// Mock Supabase
jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(() => ({
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn(),
        })),
      })),
      insert: jest.fn(() => ({
        select: jest.fn(),
      })),
      update: jest.fn(() => ({
        eq: jest.fn(() => ({
          select: jest.fn(),
        })),
      })),
    })),
  })),
}));

describe('StripeService', () => {
  let stripeService: StripeService;
  let mockStripe: any;

  beforeEach(() => {
    stripeService = new StripeService();
    mockStripe = (Stripe as jest.MockedClass<typeof Stripe>).mock.results[0]
      .value;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getOrCreateCustomer', () => {
    it('should return existing customer if found', async () => {
      const existingCustomer = {
        id: 'cus_existing',
        email: 'test@example.com',
        metadata: { user_id: 'user_123' },
      };

      mockStripe.customers.list.mockResolvedValue({
        data: [existingCustomer],
      });

      const result = await stripeService.getOrCreateCustomer(
        'user_123',
        'test@example.com'
      );

      expect(result).toEqual(existingCustomer);
      expect(mockStripe.customers.list).toHaveBeenCalledWith({
        email: 'test@example.com',
        limit: 1,
      });
      expect(mockStripe.customers.create).not.toHaveBeenCalled();
    });

    it('should create new customer if not found', async () => {
      const newCustomer = {
        id: 'cus_new',
        email: 'test@example.com',
        metadata: { user_id: 'user_123' },
      };

      mockStripe.customers.list.mockResolvedValue({
        data: [],
      });
      mockStripe.customers.create.mockResolvedValue(newCustomer);

      const result = await stripeService.getOrCreateCustomer(
        'user_123',
        'test@example.com'
      );

      expect(result).toEqual(newCustomer);
      expect(mockStripe.customers.create).toHaveBeenCalledWith({
        email: 'test@example.com',
        metadata: { user_id: 'user_123' },
      });
    });

    it('should handle errors gracefully', async () => {
      mockStripe.customers.list.mockRejectedValue(
        new Error('Stripe API error')
      );

      await expect(
        stripeService.getOrCreateCustomer('user_123', 'test@example.com')
      ).rejects.toThrow('Stripe API error');
    });
  });

  describe('createPaymentIntent', () => {
    it('should create payment intent successfully', async () => {
      const paymentIntentData = {
        amount: 2999,
        currency: 'nzd',
        customer: 'cus_123',
        metadata: { subscription_id: 'sub_123' },
      };

      const mockPaymentIntent = {
        id: 'pi_123',
        client_secret: 'pi_123_secret',
        status: 'requires_payment_method',
        amount: 2999,
        currency: 'nzd',
      };

      mockStripe.paymentIntents.create.mockResolvedValue(mockPaymentIntent);

      const result = await stripeService.createPaymentIntent(paymentIntentData);

      expect(result).toEqual(mockPaymentIntent);
      expect(mockStripe.paymentIntents.create).toHaveBeenCalledWith({
        amount: 2999,
        currency: 'nzd',
        customer: 'cus_123',
        metadata: { subscription_id: 'sub_123' },
        automatic_payment_methods: { enabled: true },
      });
    });

    it('should handle payment intent creation errors', async () => {
      const paymentIntentData = {
        amount: 2999,
        currency: 'nzd',
        customer: 'cus_123',
        metadata: { subscription_id: 'sub_123' },
      };

      mockStripe.paymentIntents.create.mockRejectedValue(
        new Error('Invalid amount')
      );

      await expect(
        stripeService.createPaymentIntent(paymentIntentData)
      ).rejects.toThrow('Invalid amount');
    });
  });

  describe('confirmPaymentIntent', () => {
    it('should confirm payment intent successfully', async () => {
      const paymentIntentId = 'pi_123';
      const paymentMethodId = 'pm_123';

      const mockConfirmedPaymentIntent = {
        id: 'pi_123',
        status: 'succeeded',
        payment_method: 'pm_123',
        amount: 2999,
        currency: 'nzd',
      };

      mockStripe.paymentIntents.confirm.mockResolvedValue(
        mockConfirmedPaymentIntent
      );

      const result = await stripeService.confirmPaymentIntent(
        paymentIntentId,
        paymentMethodId
      );

      expect(result).toEqual(mockConfirmedPaymentIntent);
      expect(mockStripe.paymentIntents.confirm).toHaveBeenCalledWith(
        paymentIntentId,
        {
          payment_method: paymentMethodId,
        }
      );
    });

    it('should handle payment confirmation errors', async () => {
      const paymentIntentId = 'pi_123';
      const paymentMethodId = 'pm_123';

      mockStripe.paymentIntents.confirm.mockRejectedValue(
        new Error('Payment failed')
      );

      await expect(
        stripeService.confirmPaymentIntent(paymentIntentId, paymentMethodId)
      ).rejects.toThrow('Payment failed');
    });
  });

  describe('createPaymentMethod', () => {
    it('should create payment method successfully', async () => {
      const cardData = {
        number: '4242424242424242',
        exp_month: 12,
        exp_year: 2025,
        cvc: '123',
      };

      const mockPaymentMethod = {
        id: 'pm_123',
        type: 'card',
        card: {
          last4: '4242',
          brand: 'visa',
          exp_month: 12,
          exp_year: 2025,
        },
      };

      mockStripe.paymentMethods.create.mockResolvedValue(mockPaymentMethod);

      const result = await stripeService.createPaymentMethod(cardData);

      expect(result).toEqual(mockPaymentMethod);
      expect(mockStripe.paymentMethods.create).toHaveBeenCalledWith({
        type: 'card',
        card: cardData,
      });
    });

    it('should handle payment method creation errors', async () => {
      const cardData = {
        number: '4242424242424242',
        exp_month: 12,
        exp_year: 2025,
        cvc: '123',
      };

      mockStripe.paymentMethods.create.mockRejectedValue(
        new Error('Invalid card')
      );

      await expect(stripeService.createPaymentMethod(cardData)).rejects.toThrow(
        'Invalid card'
      );
    });
  });

  describe('attachPaymentMethod', () => {
    it('should attach payment method to customer successfully', async () => {
      const paymentMethodId = 'pm_123';
      const customerId = 'cus_123';

      const mockAttachedPaymentMethod = {
        id: 'pm_123',
        customer: 'cus_123',
        type: 'card',
      };

      mockStripe.paymentMethods.attach.mockResolvedValue(
        mockAttachedPaymentMethod
      );

      const result = await stripeService.attachPaymentMethod(
        paymentMethodId,
        customerId
      );

      expect(result).toEqual(mockAttachedPaymentMethod);
      expect(mockStripe.paymentMethods.attach).toHaveBeenCalledWith(
        paymentMethodId,
        {
          customer: customerId,
        }
      );
    });

    it('should handle payment method attachment errors', async () => {
      const paymentMethodId = 'pm_123';
      const customerId = 'cus_123';

      mockStripe.paymentMethods.attach.mockRejectedValue(
        new Error('Attachment failed')
      );

      await expect(
        stripeService.attachPaymentMethod(paymentMethodId, customerId)
      ).rejects.toThrow('Attachment failed');
    });
  });

  describe('getPaymentMethods', () => {
    it('should retrieve customer payment methods successfully', async () => {
      const customerId = 'cus_123';

      const mockPaymentMethods = {
        data: [
          {
            id: 'pm_123',
            type: 'card',
            card: {
              last4: '4242',
              brand: 'visa',
            },
          },
        ],
      };

      mockStripe.paymentMethods.list.mockResolvedValue(mockPaymentMethods);

      const result = await stripeService.getPaymentMethods(customerId);

      expect(result).toEqual(mockPaymentMethods.data);
      expect(mockStripe.paymentMethods.list).toHaveBeenCalledWith({
        customer: customerId,
        type: 'card',
      });
    });

    it('should handle payment methods retrieval errors', async () => {
      const customerId = 'cus_123';

      mockStripe.paymentMethods.list.mockRejectedValue(
        new Error('Customer not found')
      );

      await expect(stripeService.getPaymentMethods(customerId)).rejects.toThrow(
        'Customer not found'
      );
    });
  });

  describe('handleWebhook', () => {
    it('should construct webhook event successfully', async () => {
      const payload = 'webhook_payload';
      const signature = 'webhook_signature';

      const mockEvent = {
        id: 'evt_123',
        type: 'payment_intent.succeeded',
        data: {
          object: {
            id: 'pi_123',
            status: 'succeeded',
          },
        },
      };

      mockStripe.webhooks.constructEvent.mockReturnValue(mockEvent);

      const result = await stripeService.handleWebhook(payload, signature);

      expect(result).toEqual(mockEvent);
      expect(mockStripe.webhooks.constructEvent).toHaveBeenCalledWith(
        payload,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET
      );
    });

    it('should handle webhook signature verification errors', async () => {
      const payload = 'webhook_payload';
      const signature = 'invalid_signature';

      mockStripe.webhooks.constructEvent.mockImplementation(() => {
        throw new Error('Invalid signature');
      });

      await expect(
        stripeService.handleWebhook(payload, signature)
      ).rejects.toThrow('Invalid signature');
    });
  });

  describe('getPaymentIntent', () => {
    it('should retrieve payment intent successfully', async () => {
      const paymentIntentId = 'pi_123';

      const mockPaymentIntent = {
        id: 'pi_123',
        status: 'succeeded',
        amount: 2999,
        currency: 'nzd',
      };

      mockStripe.paymentIntents.retrieve.mockResolvedValue(mockPaymentIntent);

      const result = await stripeService.getPaymentIntent(paymentIntentId);

      expect(result).toEqual(mockPaymentIntent);
      expect(mockStripe.paymentIntents.retrieve).toHaveBeenCalledWith(
        paymentIntentId
      );
    });

    it('should handle payment intent retrieval errors', async () => {
      const paymentIntentId = 'pi_123';

      mockStripe.paymentIntents.retrieve.mockRejectedValue(
        new Error('Payment intent not found')
      );

      await expect(
        stripeService.getPaymentIntent(paymentIntentId)
      ).rejects.toThrow('Payment intent not found');
    });
  });

  describe('updatePaymentIntent', () => {
    it('should update payment intent successfully', async () => {
      const paymentIntentId = 'pi_123';
      const updateData = {
        metadata: { updated: 'true' },
      };

      const mockUpdatedPaymentIntent = {
        id: 'pi_123',
        metadata: { updated: 'true' },
      };

      mockStripe.paymentIntents.update.mockResolvedValue(
        mockUpdatedPaymentIntent
      );

      const result = await stripeService.updatePaymentIntent(
        paymentIntentId,
        updateData
      );

      expect(result).toEqual(mockUpdatedPaymentIntent);
      expect(mockStripe.paymentIntents.update).toHaveBeenCalledWith(
        paymentIntentId,
        updateData
      );
    });

    it('should handle payment intent update errors', async () => {
      const paymentIntentId = 'pi_123';
      const updateData = {
        metadata: { updated: 'true' },
      };

      mockStripe.paymentIntents.update.mockRejectedValue(
        new Error('Update failed')
      );

      await expect(
        stripeService.updatePaymentIntent(paymentIntentId, updateData)
      ).rejects.toThrow('Update failed');
    });
  });

  describe('detachPaymentMethod', () => {
    it('should detach payment method successfully', async () => {
      const paymentMethodId = 'pm_123';

      const mockDetachedPaymentMethod = {
        id: 'pm_123',
        customer: null,
      };

      mockStripe.paymentMethods.detach.mockResolvedValue(
        mockDetachedPaymentMethod
      );

      const result = await stripeService.detachPaymentMethod(paymentMethodId);

      expect(result).toEqual(mockDetachedPaymentMethod);
      expect(mockStripe.paymentMethods.detach).toHaveBeenCalledWith(
        paymentMethodId
      );
    });

    it('should handle payment method detachment errors', async () => {
      const paymentMethodId = 'pm_123';

      mockStripe.paymentMethods.detach.mockRejectedValue(
        new Error('Detachment failed')
      );

      await expect(
        stripeService.detachPaymentMethod(paymentMethodId)
      ).rejects.toThrow('Detachment failed');
    });
  });
});
