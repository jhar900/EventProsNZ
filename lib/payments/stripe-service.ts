/**
 * Stripe Payment Service
 * Enhanced Stripe integration for payment processing
 */

import Stripe from 'stripe';
import { createClient } from '@/lib/supabase/server';

export interface PaymentIntentData {
  amount: number;
  currency: string;
  customer: string;
  metadata: Record<string, string>;
}

export interface PaymentMethodData {
  id: string;
  type: string;
  card?: {
    last4: string;
    brand: string;
    exp_month: number;
    exp_year: number;
  };
}

export class StripeService {
  private stripe: Stripe;
  private supabase;

  constructor() {
    this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: '2025-08-27.basil',
    });
    this.supabase = createClient();
  }

  /**
   * Create or get Stripe customer
   */
  async getOrCreateCustomer(
    userId: string,
    email: string
  ): Promise<Stripe.Customer> {
    try {
      // First, try to find existing customer
      const customers = await this.stripe.customers.list({
        email,
        limit: 1,
      });

      if (customers.data.length > 0) {
        return customers.data[0];
      }

      // Create new customer if not found
      const customer = await this.stripe.customers.create({
        email,
        metadata: {
          user_id: userId,
        },
      });

      return customer;
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Stripe API error: ${error.message}`);
      }
      throw new Error('Failed to get or create Stripe customer');
    }
  }

  /**
   * Create payment intent
   */
  async createPaymentIntent(
    data: PaymentIntentData
  ): Promise<Stripe.PaymentIntent> {
    try {
      const paymentIntent = await this.stripe.paymentIntents.create({
        amount: data.amount,
        currency: data.currency,
        customer: data.customer,
        metadata: data.metadata,
        automatic_payment_methods: {
          enabled: true,
        },
      });

      return paymentIntent;
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Invalid amount: ${error.message}`);
      }
      throw new Error('Failed to create payment intent');
    }
  }

  /**
   * Confirm payment intent
   */
  async confirmPaymentIntent(
    paymentIntentId: string,
    paymentMethodId?: string
  ): Promise<Stripe.PaymentIntent> {
    try {
      const confirmData: Stripe.PaymentIntentConfirmParams = {};

      if (paymentMethodId) {
        confirmData.payment_method = paymentMethodId;
      }

      const paymentIntent = await this.stripe.paymentIntents.confirm(
        paymentIntentId,
        confirmData
      );

      return paymentIntent;
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Payment failed: ${error.message}`);
      }
      throw new Error('Failed to confirm payment intent');
    }
  }

  /**
   * Get payment intent
   */
  async getPaymentIntent(
    paymentIntentId: string
  ): Promise<Stripe.PaymentIntent> {
    try {
      const paymentIntent =
        await this.stripe.paymentIntents.retrieve(paymentIntentId);
      return paymentIntent;
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Payment intent not found: ${error.message}`);
      }
      throw new Error('Failed to get payment intent');
    }
  }

  /**
   * Create payment method
   */
  async createPaymentMethod(card: any): Promise<Stripe.PaymentMethod> {
    try {
      const paymentMethod = await this.stripe.paymentMethods.create({
        type: 'card',
        card,
      });

      return paymentMethod;
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Invalid card: ${error.message}`);
      }
      throw new Error('Failed to create payment method');
    }
  }

  /**
   * Attach payment method to customer
   */
  async attachPaymentMethod(
    paymentMethodId: string,
    customerId: string
  ): Promise<Stripe.PaymentMethod> {
    try {
      const paymentMethod = await this.stripe.paymentMethods.attach(
        paymentMethodId,
        {
          customer: customerId,
        }
      );
      return paymentMethod;
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Attachment failed: ${error.message}`);
      }
      throw new Error('Failed to attach payment method');
    }
  }

  /**
   * Detach payment method from customer
   */
  async detachPaymentMethod(
    paymentMethodId: string
  ): Promise<Stripe.PaymentMethod> {
    try {
      const paymentMethod =
        await this.stripe.paymentMethods.detach(paymentMethodId);
      return paymentMethod;
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Detachment failed: ${error.message}`);
      }
      throw new Error('Failed to detach payment method');
    }
  }

  /**
   * Get payment method
   */
  async getPaymentMethod(
    paymentMethodId: string
  ): Promise<Stripe.PaymentMethod> {
    try {
      const paymentMethod =
        await this.stripe.paymentMethods.retrieve(paymentMethodId);
      return paymentMethod;
    } catch (error) {
      throw new Error('Failed to get payment method');
    }
  }

  /**
   * List customer payment methods
   */
  async getCustomerPaymentMethods(
    customerId: string
  ): Promise<Stripe.PaymentMethod[]> {
    try {
      const paymentMethods = await this.stripe.paymentMethods.list({
        customer: customerId,
        type: 'card',
      });

      return paymentMethods.data;
    } catch (error) {
      throw new Error('Customer not found');
    }
  }

  /**
   * Set default payment method
   */
  async setDefaultPaymentMethod(
    customerId: string,
    paymentMethodId: string
  ): Promise<void> {
    try {
      await this.stripe.customers.update(customerId, {
        invoice_settings: {
          default_payment_method: paymentMethodId,
        },
      });
    } catch (error) {
      throw new Error('Failed to set default payment method');
    }
  }

  /**
   * Verify webhook signature
   */
  verifyWebhookSignature(
    payload: string | Buffer,
    signature: string,
    secret: string
  ): Stripe.Event {
    try {
      return this.stripe.webhooks.constructEvent(payload, signature, secret);
    } catch (error) {
      throw new Error('Invalid signature');
    }
  }

  /**
   * Handle payment webhook events
   */
  async handlePaymentWebhook(event: Stripe.Event): Promise<void> {
    try {
      switch (event.type) {
        case 'payment_intent.succeeded':
          await this.handlePaymentSucceeded(
            event.data.object as Stripe.PaymentIntent
          );
          break;
        case 'payment_intent.payment_failed':
          await this.handlePaymentFailed(
            event.data.object as Stripe.PaymentIntent
          );
          break;
        case 'payment_method.attached':
          await this.handlePaymentMethodAttached(
            event.data.object as Stripe.PaymentMethod
          );
          break;
        case 'payment_method.detached':
          await this.handlePaymentMethodDetached(
            event.data.object as Stripe.PaymentMethod
          );
          break;
        default:
          // Handle other webhook events as needed
          break;
      }
    } catch (error) {
      throw error;
    }
  }

  /**
   * Handle successful payment
   */
  private async handlePaymentSucceeded(
    paymentIntent: Stripe.PaymentIntent
  ): Promise<void> {
    try {
      // Log successful payment
      await this.supabase.from('payment_analytics').insert({
        event_type: 'payment_succeeded',
        event_data: {
          payment_intent_id: paymentIntent.id,
          amount: paymentIntent.amount,
          currency: paymentIntent.currency,
          customer: paymentIntent.customer,
        },
      });
    } catch (error) {
      console.error('Error handling payment succeeded:', error);
    }
  }

  /**
   * Handle failed payment
   */
  private async handlePaymentFailed(
    paymentIntent: Stripe.PaymentIntent
  ): Promise<void> {
    try {
      // Log failed payment
      await this.supabase.from('payment_analytics').insert({
        event_type: 'payment_failed',
        event_data: {
          payment_intent_id: paymentIntent.id,
          amount: paymentIntent.amount,
          currency: paymentIntent.currency,
          customer: paymentIntent.customer,
          last_payment_error: paymentIntent.last_payment_error,
        },
      });
    } catch (error) {
      console.error('Error handling payment failed:', error);
    }
  }

  /**
   * Handle payment method attached
   */
  private async handlePaymentMethodAttached(
    paymentMethod: Stripe.PaymentMethod
  ): Promise<void> {
    try {
      // Log payment method attachment
      await this.supabase.from('payment_analytics').insert({
        event_type: 'payment_method_attached',
        event_data: {
          payment_method_id: paymentMethod.id,
          customer: paymentMethod.customer,
          type: paymentMethod.type,
        },
      });
    } catch (error) {
      console.error('Error handling payment method attached:', error);
    }
  }

  /**
   * Handle payment method detached
   */
  private async handlePaymentMethodDetached(
    paymentMethod: Stripe.PaymentMethod
  ): Promise<void> {
    try {
      // Log payment method detachment
      await this.supabase.from('payment_analytics').insert({
        event_type: 'payment_method_detached',
        event_data: {
          payment_method_id: paymentMethod.id,
          customer: paymentMethod.customer,
          type: paymentMethod.type,
        },
      });
    } catch (error) {
      console.error('Error handling payment method detached:', error);
    }
  }

  /**
   * Get payment methods for a customer (alias for getCustomerPaymentMethods)
   */
  async getPaymentMethods(customerId: string): Promise<Stripe.PaymentMethod[]> {
    return this.getCustomerPaymentMethods(customerId);
  }

  /**
   * Handle webhook events (alias for handlePaymentWebhook)
   */
  async handleWebhook(
    payload: string,
    signature: string
  ): Promise<Stripe.Event> {
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!webhookSecret) {
      throw new Error('Invalid signature');
    }

    const event = this.verifyWebhookSignature(
      payload,
      signature,
      webhookSecret
    );
    await this.handlePaymentWebhook(event);
    return event;
  }

  /**
   * Update payment intent
   */
  async updatePaymentIntent(
    paymentIntentId: string,
    updateData: Stripe.PaymentIntentUpdateParams
  ): Promise<Stripe.PaymentIntent> {
    try {
      const paymentIntent = await this.stripe.paymentIntents.update(
        paymentIntentId,
        updateData
      );
      return paymentIntent;
    } catch (error) {
      throw new Error('Update failed');
    }
  }
}
