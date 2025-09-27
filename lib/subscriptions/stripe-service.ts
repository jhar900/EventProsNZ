/**
 * Stripe Service
 * Complete Stripe integration for subscription management
 */

import Stripe from 'stripe';
import { createClient } from '@/lib/supabase/server';
import { SubscriptionTier, BillingCycle } from '@/lib/supabase/types';
import { SUBSCRIPTION_CONFIG } from './constants';

export interface StripeCustomer {
  id: string;
  email: string;
  metadata: Record<string, string>;
}

export interface StripeSubscription {
  id: string;
  customer: string;
  status: string;
  current_period_start: number;
  current_period_end: number;
  items: {
    data: Array<{
      price: {
        id: string;
        unit_amount: number;
        currency: string;
      };
    }>;
  };
}

export interface StripePrice {
  id: string;
  unit_amount: number;
  currency: string;
  recurring: {
    interval: string;
    interval_count: number;
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
   * Create a Stripe customer
   */
  async createCustomer(userId: string, email: string): Promise<StripeCustomer> {
    try {
      const customer = await this.stripe.customers.create({
        email,
        metadata: {
          userId,
          source: 'eventprosnz',
        },
      });

      return {
        id: customer.id,
        email: customer.email!,
        metadata: customer.metadata,
      };
    } catch (error) {
      throw new Error('Failed to create Stripe customer');
    }
  }

  /**
   * Get or create Stripe customer for user
   */
  async getOrCreateCustomer(
    userId: string,
    email: string
  ): Promise<StripeCustomer> {
    try {
      // First, try to find existing customer
      const customers = await this.stripe.customers.list({
        email,
        limit: 1,
      });

      if (customers.data.length > 0) {
        const customer = customers.data[0];
        return {
          id: customer.id,
          email: customer.email!,
          metadata: customer.metadata,
        };
      }

      // Create new customer if not found
      return await this.createCustomer(userId, email);
    } catch (error) {
      throw new Error('Failed to get or create Stripe customer');
    }
  }

  /**
   * Create Stripe price for subscription tier
   */
  async createPrice(
    tier: SubscriptionTier,
    billingCycle: BillingCycle
  ): Promise<StripePrice> {
    try {
      const priceData = this.getPriceData(tier, billingCycle);

      const price = await this.stripe.prices.create({
        unit_amount: priceData.amount,
        currency: 'nzd',
        recurring: {
          interval: priceData.interval,
          interval_count: priceData.intervalCount,
        },
        product_data: {
          name: `${this.getTierDisplayName(tier)} Subscription`,
          description: `EventProsNZ ${this.getTierDisplayName(tier)} subscription`,
        },
        metadata: {
          tier,
          billing_cycle: billingCycle,
        },
      });

      return {
        id: price.id,
        unit_amount: price.unit_amount!,
        currency: price.currency,
        recurring: price.recurring!,
      };
    } catch (error) {
      throw new Error('Failed to create Stripe price');
    }
  }

  /**
   * Create Stripe subscription
   */
  async createSubscription(
    customerId: string,
    priceId: string,
    trialDays?: number
  ): Promise<StripeSubscription> {
    try {
      const subscriptionData: Stripe.SubscriptionCreateParams = {
        customer: customerId,
        items: [{ price: priceId }],
        payment_behavior: 'default_incomplete',
        expand: ['latest_invoice.payment_intent'],
      };

      if (trialDays && trialDays > 0) {
        subscriptionData.trial_period_days = trialDays;
      }

      const subscription =
        await this.stripe.subscriptions.create(subscriptionData);

      return {
        id: subscription.id,
        customer: subscription.customer as string,
        status: subscription.status,
        current_period_start: subscription.current_period_start,
        current_period_end: subscription.current_period_end,
        items: subscription.items as any,
      };
    } catch (error) {
      throw new Error('Failed to create Stripe subscription');
    }
  }

  /**
   * Update Stripe subscription
   */
  async updateSubscription(
    subscriptionId: string,
    newPriceId: string,
    prorationBehavior: 'create_prorations' | 'none' = 'create_prorations'
  ): Promise<StripeSubscription> {
    try {
      const subscription =
        await this.stripe.subscriptions.retrieve(subscriptionId);

      const updatedSubscription = await this.stripe.subscriptions.update(
        subscriptionId,
        {
          items: [
            {
              id: subscription.items.data[0].id,
              price: newPriceId,
            },
          ],
          proration_behavior: prorationBehavior,
          expand: ['latest_invoice.payment_intent'],
        }
      );

      return {
        id: updatedSubscription.id,
        customer: updatedSubscription.customer as string,
        status: updatedSubscription.status,
        current_period_start: updatedSubscription.current_period_start,
        current_period_end: updatedSubscription.current_period_end,
        items: updatedSubscription.items as any,
      };
    } catch (error) {
      throw new Error('Failed to update Stripe subscription');
    }
  }

  /**
   * Cancel Stripe subscription
   */
  async cancelSubscription(
    subscriptionId: string,
    immediately: boolean = false
  ): Promise<void> {
    try {
      if (immediately) {
        await this.stripe.subscriptions.cancel(subscriptionId);
      } else {
        await this.stripe.subscriptions.update(subscriptionId, {
          cancel_at_period_end: true,
        });
      }
    } catch (error) {
      throw new Error('Failed to cancel Stripe subscription');
    }
  }

  /**
   * Get Stripe subscription
   */
  async getSubscription(subscriptionId: string): Promise<StripeSubscription> {
    try {
      const subscription =
        await this.stripe.subscriptions.retrieve(subscriptionId);

      return {
        id: subscription.id,
        customer: subscription.customer as string,
        status: subscription.status,
        current_period_start: subscription.current_period_start,
        current_period_end: subscription.current_period_end,
        items: subscription.items as any,
      };
    } catch (error) {
      throw new Error('Failed to get Stripe subscription');
    }
  }

  /**
   * Create payment method
   */
  async createPaymentMethod(
    customerId: string,
    paymentMethodId: string
  ): Promise<void> {
    try {
      await this.stripe.paymentMethods.attach(paymentMethodId, {
        customer: customerId,
      });

      await this.stripe.customers.update(customerId, {
        invoice_settings: {
          default_payment_method: paymentMethodId,
        },
      });
    } catch (error) {
      throw new Error('Failed to create payment method');
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
      throw new Error('Invalid webhook signature');
    }
  }

  /**
   * Handle subscription webhook events
   */
  async handleSubscriptionWebhook(event: Stripe.Event): Promise<void> {
    try {
      switch (event.type) {
        case 'customer.subscription.created':
        case 'customer.subscription.updated':
        case 'customer.subscription.deleted':
          await this.syncSubscriptionStatus(
            event.data.object as Stripe.Subscription
          );
          break;
        case 'invoice.payment_succeeded':
          await this.handlePaymentSucceeded(
            event.data.object as Stripe.Invoice
          );
          break;
        case 'invoice.payment_failed':
          await this.handlePaymentFailed(event.data.object as Stripe.Invoice);
          break;
        default:
          }
    } catch (error) {
      throw error;
    }
  }

  /**
   * Sync subscription status with database
   */
  private async syncSubscriptionStatus(
    subscription: Stripe.Subscription
  ): Promise<void> {
    try {
      const { data: existingSubscription } = await this.supabase
        .from('subscriptions')
        .select('id')
        .eq('stripe_subscription_id', subscription.id)
        .single();

      if (existingSubscription) {
        // Update existing subscription
        await this.supabase
          .from('subscriptions')
          .update({
            status: this.mapStripeStatusToLocal(subscription.status),
            stripe_subscription_id: subscription.id,
            updated_at: new Date().toISOString(),
          })
          .eq('id', existingSubscription.id);
      }
    } catch (error) {
      throw error;
    }
  }

  /**
   * Handle successful payment
   */
  private async handlePaymentSucceeded(invoice: Stripe.Invoice): Promise<void> {
    try {
      // Log successful payment
      await this.supabase.from('subscription_analytics').insert({
        event_type: 'payment_succeeded',
        event_data: {
          invoice_id: invoice.id,
          amount_paid: invoice.amount_paid,
          currency: invoice.currency,
        },
      });
    } catch (error) {
      }
  }

  /**
   * Handle failed payment
   */
  private async handlePaymentFailed(invoice: Stripe.Invoice): Promise<void> {
    try {
      // Log failed payment
      await this.supabase.from('subscription_analytics').insert({
        event_type: 'payment_failed',
        event_data: {
          invoice_id: invoice.id,
          amount_due: invoice.amount_due,
          currency: invoice.currency,
        },
      });
    } catch (error) {
      }
  }

  /**
   * Map Stripe status to local status
   */
  private mapStripeStatusToLocal(stripeStatus: string): string {
    const statusMap: Record<string, string> = {
      active: 'active',
      canceled: 'cancelled',
      incomplete: 'trial',
      incomplete_expired: 'expired',
      past_due: 'active',
      trialing: 'trial',
      unpaid: 'expired',
    };

    return statusMap[stripeStatus] || 'inactive';
  }

  /**
   * Get price data for tier and billing cycle
   */
  private getPriceData(tier: SubscriptionTier, billingCycle: BillingCycle) {
    const pricing =
      SUBSCRIPTION_CONFIG.PRICING[
        tier.toUpperCase() as keyof typeof SUBSCRIPTION_CONFIG.PRICING
      ];

    let amount: number;
    let interval: string;
    let intervalCount: number;

    switch (billingCycle) {
      case 'monthly':
        amount = pricing.MONTHLY;
        interval = 'month';
        intervalCount = 1;
        break;
      case 'yearly':
        amount = pricing.YEARLY;
        interval = 'year';
        intervalCount = 1;
        break;
      case '2year':
        amount = pricing.TWO_YEAR;
        interval = 'year';
        intervalCount = 2;
        break;
      default:
        throw new Error('Invalid billing cycle');
    }

    return { amount, interval, intervalCount };
  }

  /**
   * Get tier display name
   */
  private getTierDisplayName(tier: SubscriptionTier): string {
    const names = {
      essential: 'Essential',
      showcase: 'Showcase',
      spotlight: 'Spotlight',
    };
    return names[tier];
  }
}
