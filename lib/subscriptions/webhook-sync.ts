/**
 * Webhook Sync Utilities
 * Helper functions for syncing Stripe webhook events to the database
 */

import { createClient } from '@/lib/supabase/server';
import Stripe from 'stripe';
import { SubscriptionStatus } from '@/lib/supabase/types';

/**
 * Map Stripe subscription status to local subscription status
 */
export function mapStripeStatusToLocal(
  stripeStatus: Stripe.Subscription.Status
): SubscriptionStatus {
  const statusMap: Record<string, SubscriptionStatus> = {
    active: 'active',
    canceled: 'cancelled',
    incomplete: 'trial',
    incomplete_expired: 'expired',
    past_due: 'active', // Keep active but will handle payment retry
    trialing: 'trial',
    unpaid: 'expired',
  };

  return statusMap[stripeStatus] || 'inactive';
}

/**
 * Sync subscription status from Stripe to database
 */
export async function syncSubscriptionFromStripe(
  subscription: Stripe.Subscription
): Promise<{ success: boolean; subscriptionId?: string; error?: string }> {
  try {
    const supabase = createClient();

    // Find subscription by Stripe subscription ID
    const { data: existingSubscription, error: findError } = await supabase
      .from('subscriptions')
      .select('id, user_id, status')
      .eq('stripe_subscription_id', subscription.id)
      .single();

    if (findError && findError.code !== 'PGRST116') {
      return {
        success: false,
        error: `Error finding subscription: ${findError.message}`,
      };
    }

    if (!existingSubscription) {
      return {
        success: false,
        error: `Subscription not found in database for Stripe subscription ${subscription.id}`,
      };
    }

    // Map Stripe status to local status
    const localStatus = mapStripeStatusToLocal(subscription.status);

    // Prepare update data
    const updateData: {
      status: SubscriptionStatus;
      updated_at: string;
      end_date?: string;
    } = {
      status: localStatus,
      updated_at: new Date().toISOString(),
    };

    // Set end_date if subscription is canceled
    if (subscription.canceled_at) {
      updateData.end_date = new Date(
        subscription.canceled_at * 1000
      ).toISOString();
    }

    // Update subscription in database
    const { error: updateError } = await supabase
      .from('subscriptions')
      .update(updateData)
      .eq('id', existingSubscription.id);

    if (updateError) {
      return {
        success: false,
        error: `Error updating subscription: ${updateError.message}`,
      };
    }

    return {
      success: true,
      subscriptionId: existingSubscription.id,
    };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : 'Unknown error syncing subscription',
    };
  }
}

/**
 * Get subscription ID from Stripe invoice
 */
export function getSubscriptionIdFromInvoice(
  invoice: Stripe.Invoice
): string | null {
  if (!invoice.subscription) {
    return null;
  }

  return typeof invoice.subscription === 'string'
    ? invoice.subscription
    : invoice.subscription.id;
}

/**
 * Sync invoice payment success to database
 */
export async function syncInvoicePaymentSucceeded(
  invoice: Stripe.Invoice
): Promise<{ success: boolean; subscriptionId?: string; error?: string }> {
  try {
    const supabase = createClient();

    const subscriptionId = getSubscriptionIdFromInvoice(invoice);
    if (!subscriptionId) {
      return {
        success: false,
        error: 'Invoice has no subscription',
      };
    }

    // Find subscription by Stripe subscription ID
    const { data: existingSubscription, error: findError } = await supabase
      .from('subscriptions')
      .select('id, user_id, status')
      .eq('stripe_subscription_id', subscriptionId)
      .single();

    if (findError && findError.code !== 'PGRST116') {
      return {
        success: false,
        error: `Error finding subscription: ${findError.message}`,
      };
    }

    if (!existingSubscription) {
      return {
        success: false,
        error: `Subscription not found for invoice ${invoice.id}`,
      };
    }

    // Activate subscription if it was in trial or inactive
    const { error: updateError } = await supabase
      .from('subscriptions')
      .update({
        status: 'active',
        updated_at: new Date().toISOString(),
      })
      .eq('id', existingSubscription.id);

    if (updateError) {
      return {
        success: false,
        error: `Error activating subscription: ${updateError.message}`,
      };
    }

    // Log successful payment to analytics
    const { error: analyticsError } = await supabase
      .from('subscription_analytics')
      .insert({
        subscription_id: existingSubscription.id,
        event_type: 'payment_succeeded',
        event_data: {
          invoice_id: invoice.id,
          amount_paid: invoice.amount_paid,
          currency: invoice.currency,
          period_start: invoice.period_start,
          period_end: invoice.period_end,
        },
      });

    if (analyticsError) {
      console.error('Error logging payment to analytics:', analyticsError);
      // Don't fail the whole operation if analytics logging fails
    }

    return {
      success: true,
      subscriptionId: existingSubscription.id,
    };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : 'Unknown error syncing invoice payment',
    };
  }
}

/**
 * Sync invoice payment failure to database
 */
export async function syncInvoicePaymentFailed(
  invoice: Stripe.Invoice
): Promise<{ success: boolean; subscriptionId?: string; error?: string }> {
  try {
    const supabase = createClient();

    const subscriptionId = getSubscriptionIdFromInvoice(invoice);
    if (!subscriptionId) {
      return {
        success: false,
        error: 'Invoice has no subscription',
      };
    }

    // Find subscription by Stripe subscription ID
    const { data: existingSubscription, error: findError } = await supabase
      .from('subscriptions')
      .select('id, user_id, status')
      .eq('stripe_subscription_id', subscriptionId)
      .single();

    if (findError && findError.code !== 'PGRST116') {
      return {
        success: false,
        error: `Error finding subscription: ${findError.message}`,
      };
    }

    if (!existingSubscription) {
      return {
        success: false,
        error: `Subscription not found for invoice ${invoice.id}`,
      };
    }

    // Update subscription timestamp (keep status active - Stripe will retry)
    const { error: updateError } = await supabase
      .from('subscriptions')
      .update({
        updated_at: new Date().toISOString(),
      })
      .eq('id', existingSubscription.id);

    if (updateError) {
      return {
        success: false,
        error: `Error updating subscription: ${updateError.message}`,
      };
    }

    // Log failed payment to analytics
    const { error: analyticsError } = await supabase
      .from('subscription_analytics')
      .insert({
        subscription_id: existingSubscription.id,
        event_type: 'payment_failed',
        event_data: {
          invoice_id: invoice.id,
          amount_due: invoice.amount_due,
          currency: invoice.currency,
          attempt_count: invoice.attempt_count,
          next_payment_attempt: invoice.next_payment_attempt,
        },
      });

    if (analyticsError) {
      console.error(
        'Error logging payment failure to analytics:',
        analyticsError
      );
      // Don't fail the whole operation if analytics logging fails
    }

    return {
      success: true,
      subscriptionId: existingSubscription.id,
    };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : 'Unknown error syncing invoice payment failure',
    };
  }
}

/**
 * Sync customer ID to user record
 */
export async function syncCustomerToUser(
  customer: Stripe.Customer
): Promise<{ success: boolean; error?: string }> {
  try {
    if (!customer.metadata?.user_id) {
      return {
        success: false,
        error: 'Customer has no user_id in metadata',
      };
    }

    const supabase = createClient();

    // Update user's stripe_customer_id if not already set
    const { error } = await supabase
      .from('users')
      .update({ stripe_customer_id: customer.id })
      .eq('id', customer.metadata.user_id)
      .is('stripe_customer_id', null);

    if (error) {
      return {
        success: false,
        error: `Error updating user with customer ID: ${error.message}`,
      };
    }

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : 'Unknown error syncing customer to user',
    };
  }
}
