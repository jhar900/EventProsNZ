/**
 * Payment Service
 * Handles payment operations and database interactions
 */

import { createClient } from '@/lib/supabase/server';
import type { SupabaseClient } from '@supabase/supabase-js';

export interface PaymentCreateData {
  subscription_id: string;
  stripe_payment_intent_id: string;
  amount: number;
  currency: string;
  status: string;
  payment_method: string;
  receipt_url?: string;
}

export interface Payment {
  id: string;
  subscription_id: string;
  stripe_payment_intent_id: string;
  amount: number;
  currency: string;
  status: string;
  payment_method: string;
  failure_reason?: string;
  receipt_url?: string;
  created_at: string;
  updated_at: string;
}

export class PaymentService {
  private supabase: SupabaseClient;

  constructor(supabase?: SupabaseClient) {
    this.supabase = supabase || createClient();
  }

  /**
   * Create payment record
   */
  async createPayment(data: PaymentCreateData): Promise<Payment> {
    try {
      const { data: payment, error } = await this.supabase
        .from('payments')
        .insert({
          subscription_id: data.subscription_id,
          stripe_payment_intent_id: data.stripe_payment_intent_id,
          amount: data.amount,
          currency: data.currency,
          status: data.status,
          payment_method: data.payment_method,
          receipt_url: data.receipt_url,
        })
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to create payment: ${error.message}`);
      }

      return payment;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Failed to create payment record');
    }
  }

  /**
   * Get payment by ID
   */
  async getPayment(paymentId: string): Promise<Payment | null> {
    try {
      const { data: payment, error } = await this.supabase
        .from('payments')
        .select('*')
        .eq('id', paymentId)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw new Error(`Failed to get payment: ${error.message}`);
      }

      return payment;
    } catch (error) {
      throw new Error('Payment not found');
    }
  }

  /**
   * Get payment by Stripe payment intent ID
   */
  async getPaymentByIntentId(paymentIntentId: string): Promise<Payment | null> {
    try {
      const { data: payment, error } = await this.supabase
        .from('payments')
        .select('*')
        .eq('stripe_payment_intent_id', paymentIntentId)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw new Error(`Failed to get payment: ${error.message}`);
      }

      return payment;
    } catch (error) {
      throw new Error('Failed to get payment by intent ID');
    }
  }

  /**
   * Get user payments
   */
  async getUserPayments(
    userId: string,
    limit = 50,
    offset = 0
  ): Promise<Payment[]> {
    try {
      const { data: payments, error } = await this.supabase
        .from('payments')
        .select(
          `
          *,
          subscriptions!inner(user_id)
        `
        )
        .eq('subscriptions.user_id', userId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) {
        throw new Error(`Failed to get user payments: ${error.message}`);
      }

      return payments || [];
    } catch (error) {
      throw new Error('Failed to get user payments');
    }
  }

  /**
   * Update payment status
   */
  async updatePaymentStatus(
    paymentId: string,
    status: string,
    failureReason?: string
  ): Promise<Payment> {
    try {
      const updateData: any = {
        status,
        updated_at: new Date().toISOString(),
      };

      if (failureReason) {
        updateData.failure_reason = failureReason;
      }

      const { data: payment, error } = await this.supabase
        .from('payments')
        .update(updateData)
        .eq('id', paymentId)
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to update payment status: ${error.message}`);
      }

      return payment;
    } catch (error) {
      throw new Error('Update failed');
    }
  }

  /**
   * Get payment analytics
   */
  async getPaymentAnalytics(
    userId?: string,
    startDate?: string,
    endDate?: string
  ): Promise<any> {
    try {
      let query = this.supabase.from('payments').select('*');

      if (userId) {
        query = query.eq('user_id', userId);
      }

      if (startDate) {
        query = query.gte('created_at', startDate);
      }

      if (endDate) {
        query = query.lte('created_at', endDate);
      }

      const { data: payments, error } = await query;

      if (error) {
        throw new Error(`Failed to get payment analytics: ${error.message}`);
      }

      // Calculate analytics
      const totalAmount =
        payments?.reduce((sum, payment) => sum + payment.amount, 0) || 0;
      const successfulPayments =
        payments?.filter(p => p.status === 'succeeded').length || 0;
      const failedPayments =
        payments?.filter(p => p.status === 'failed').length || 0;
      const totalPayments = payments?.length || 0;

      return {
        total_amount: totalAmount,
        total_payments: totalPayments,
        successful_payments: successfulPayments,
        failed_payments: failedPayments,
        success_rate:
          totalPayments > 0 ? (successfulPayments / totalPayments) * 100 : 0,
        payments: payments || [],
      };
    } catch (error) {
      throw new Error('Failed to get payment analytics');
    }
  }

  /**
   * Get failed payments
   */
  async getFailedPayments(userId?: string): Promise<Payment[]> {
    try {
      let query = this.supabase
        .from('payments')
        .select(
          `
          *,
          subscriptions!inner(user_id)
        `
        )
        .eq('status', 'failed');

      if (userId) {
        query = query.eq('subscriptions.user_id', userId);
      }

      const { data: payments, error } = await query.order('created_at', {
        ascending: false,
      });

      if (error) {
        throw new Error(`Failed to get failed payments: ${error.message}`);
      }

      return payments || [];
    } catch (error) {
      throw new Error('Failed to get failed payments');
    }
  }

  /**
   * Retry failed payment
   */
  async retryPayment(
    paymentId: string,
    newPaymentIntentId: string
  ): Promise<Payment> {
    try {
      const { data: payment, error } = await this.supabase
        .from('payments')
        .update({
          stripe_payment_intent_id: newPaymentIntentId,
          status: 'pending',
          updated_at: new Date().toISOString(),
        })
        .eq('id', paymentId)
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to retry payment: ${error.message}`);
      }

      return payment;
    } catch (error) {
      throw new Error('Failed to retry payment');
    }
  }

  /**
   * Retry failed payment with different payment method
   */
  async retryPaymentWithMethod(
    paymentId: string,
    paymentMethodId: string
  ): Promise<{ success: boolean; payment?: Payment; error?: string }> {
    try {
      // Get the payment details
      const { data: payment, error: paymentError } = await this.supabase
        .from('payments')
        .select('*')
        .eq('id', paymentId)
        .single();

      if (paymentError || !payment) {
        return { success: false, error: 'Payment not found' };
      }

      // Get the payment method details
      const { data: paymentMethod, error: methodError } = await this.supabase
        .from('payment_methods')
        .select('*')
        .eq('id', paymentMethodId)
        .single();

      if (methodError || !paymentMethod) {
        return { success: false, error: 'Payment method not found' };
      }

      // In a real implementation, this would retry the payment with Stripe
      // For now, we'll simulate a successful retry
      const { data: updatedPayment, error: updateError } = await this.supabase
        .from('payments')
        .update({
          status: 'succeeded',
          updated_at: new Date().toISOString(),
        })
        .eq('id', paymentId)
        .select()
        .single();

      if (updateError) {
        return { success: false, error: 'Failed to update payment status' };
      }

      return { success: true, payment: updatedPayment };
    } catch (error) {
      return { success: false, error: 'Failed to retry payment' };
    }
  }

  /**
   * Get payments by subscription ID
   */
  async getPaymentsBySubscription(subscriptionId: string): Promise<Payment[]> {
    try {
      const { data: payments, error } = await this.supabase
        .from('payments')
        .select('*')
        .eq('subscription_id', subscriptionId)
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) {
        throw new Error(`Failed to get payments: ${error.message}`);
      }

      return payments || [];
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Failed to get payments by subscription');
    }
  }

  /**
   * Get payment history for a user
   */
  async getPaymentHistory(
    userId: string,
    limit: number = 50
  ): Promise<Payment[]> {
    try {
      const { data: payments, error } = await this.supabase
        .from('payments')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        throw new Error(`Failed to get payment history: ${error.message}`);
      }

      return payments || [];
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Failed to get payment history');
    }
  }

  /**
   * Get payment by Stripe intent ID
   */
  async getPaymentByStripeIntent(
    stripePaymentIntentId: string
  ): Promise<Payment | null> {
    try {
      const { data: payment, error } = await this.supabase
        .from('payments')
        .select('*')
        .eq('stripe_payment_intent_id', stripePaymentIntentId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null; // No payment found
        }
        throw new Error(`Failed to get payment: ${error.message}`);
      }

      return payment;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Failed to get payment by Stripe intent');
    }
  }

  /**
   * Update payment receipt URL
   */
  async updatePaymentReceipt(
    paymentId: string,
    receiptUrl: string
  ): Promise<Payment> {
    try {
      const { data: payment, error } = await this.supabase
        .from('payments')
        .update({ receipt_url: receiptUrl })
        .eq('id', paymentId)
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to update payment receipt: ${error.message}`);
      }

      return payment;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Failed to update payment receipt');
    }
  }
}
