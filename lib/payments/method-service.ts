/**
 * Payment Method Service
 * Handles payment method operations
 */

import { createClient } from '@/lib/supabase/server';

export interface PaymentMethodCreateData {
  user_id: string;
  stripe_payment_method_id: string;
  type: string;
  last_four: string;
  brand?: string;
  exp_month?: number;
  exp_year?: number;
  is_default?: boolean;
}

export interface PaymentMethod {
  id: string;
  user_id: string;
  stripe_payment_method_id: string;
  type: string;
  last_four: string;
  brand?: string;
  exp_month?: number;
  exp_year?: number;
  is_default: boolean;
  created_at: string;
}

export class PaymentMethodService {
  private supabase;

  constructor() {
    this.supabase = createClient();
  }

  /**
   * Create payment method
   */
  async createPaymentMethod(
    data: PaymentMethodCreateData
  ): Promise<PaymentMethod> {
    try {
      const { data: paymentMethod, error } = await this.supabase
        .from('payment_methods')
        .insert({
          user_id: data.user_id,
          stripe_payment_method_id: data.stripe_payment_method_id,
          type: data.type,
          last_four: data.last_four,
          brand: data.brand,
          exp_month: data.exp_month,
          exp_year: data.exp_year,
          is_default: data.is_default || false,
        })
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to create payment method: ${error.message}`);
      }

      return paymentMethod;
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Database error: ${error.message}`);
      }
      throw new Error('Failed to create payment method');
    }
  }

  /**
   * Get user payment methods
   */
  async getUserPaymentMethods(userId: string): Promise<PaymentMethod[]> {
    try {
      const { data: paymentMethods, error } = await this.supabase
        .from('payment_methods')
        .select('*')
        .eq('user_id', userId)
        .order('is_default', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) {
        throw new Error(`Failed to get payment methods: ${error.message}`);
      }

      return paymentMethods || [];
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`User not found: ${error.message}`);
      }
      throw new Error('Failed to get payment methods');
    }
  }

  /**
   * Get payment method by ID
   */
  async getPaymentMethod(
    paymentMethodId: string
  ): Promise<PaymentMethod | null> {
    try {
      const { data: paymentMethod, error } = await this.supabase
        .from('payment_methods')
        .select('*')
        .eq('id', paymentMethodId)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw new Error(`Payment method not found: ${error.message}`);
      }

      return paymentMethod;
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Payment method not found: ${error.message}`);
      }
      throw new Error('Failed to get payment method');
    }
  }

  /**
   * Update payment method
   */
  async updatePaymentMethod(
    paymentMethodId: string,
    updates: Partial<PaymentMethodCreateData>
  ): Promise<PaymentMethod> {
    try {
      const { data: paymentMethod, error } = await this.supabase
        .from('payment_methods')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', paymentMethodId)
        .select()
        .single();

      if (error) {
        throw new Error(`Update failed: ${error.message}`);
      }

      return paymentMethod;
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Update failed: ${error.message}`);
      }
      throw new Error('Failed to update payment method');
    }
  }

  /**
   * Delete payment method
   */
  async deletePaymentMethod(paymentMethodId: string): Promise<void> {
    try {
      const { error } = await this.supabase
        .from('payment_methods')
        .delete()
        .eq('id', paymentMethodId);

      if (error) {
        throw new Error(`Deletion failed: ${error.message}`);
      }
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Deletion failed: ${error.message}`);
      }
      throw new Error('Failed to delete payment method');
    }
  }

  /**
   * Set default payment method
   */
  async setDefaultPaymentMethod(
    userId: string,
    paymentMethodId: string
  ): Promise<void> {
    try {
      // First, unset all other default payment methods for this user
      await this.supabase
        .from('payment_methods')
        .update({ is_default: false })
        .eq('user_id', userId)
        .neq('id', paymentMethodId);

      // Then set the specified payment method as default
      const { error } = await this.supabase
        .from('payment_methods')
        .update({ is_default: true })
        .eq('id', paymentMethodId)
        .eq('user_id', userId);

      if (error) {
        throw new Error(
          `Failed to set default payment method: ${error.message}`
        );
      }
    } catch (error) {
      throw new Error('Failed to set default payment method');
    }
  }

  /**
   * Get default payment method
   */
  async getDefaultPaymentMethod(userId: string): Promise<PaymentMethod | null> {
    try {
      const { data: paymentMethod, error } = await this.supabase
        .from('payment_methods')
        .select('*')
        .eq('user_id', userId)
        .eq('is_default', true)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw new Error(
          `Failed to get default payment method: ${error.message}`
        );
      }

      return paymentMethod;
    } catch (error) {
      throw new Error('Failed to get default payment method');
    }
  }

  /**
   * Validate payment method
   */
  async validatePaymentMethod(paymentMethodId: string): Promise<boolean> {
    try {
      const { data: paymentMethod, error } = await this.supabase
        .from('payment_methods')
        .select('id')
        .eq('id', paymentMethodId)
        .single();

      if (error && error.code !== 'PGRST116') {
        return false;
      }

      return !!paymentMethod;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get payment method analytics
   */
  async getPaymentMethodAnalytics(userId?: string): Promise<any> {
    try {
      let query = this.supabase.from('payment_methods').select('*');

      if (userId) {
        query = query.eq('user_id', userId);
      }

      const { data: paymentMethods, error } = await query;

      if (error) {
        throw new Error(
          `Failed to get payment method analytics: ${error.message}`
        );
      }

      // Calculate analytics
      const totalMethods = paymentMethods?.length || 0;
      const defaultMethods =
        paymentMethods?.filter(pm => pm.is_default).length || 0;
      const cardMethods =
        paymentMethods?.filter(pm => pm.type === 'card').length || 0;

      return {
        total_methods: totalMethods,
        default_methods: defaultMethods,
        card_methods: cardMethods,
        payment_methods: paymentMethods || [],
      };
    } catch (error) {
      throw new Error('Failed to get payment method analytics');
    }
  }

  /**
   * Get payment methods (alias for getUserPaymentMethods)
   */
  async getPaymentMethods(userId: string): Promise<PaymentMethod[]> {
    return this.getUserPaymentMethods(userId);
  }

  /**
   * Get payment method by Stripe ID
   */
  async getPaymentMethodByStripeId(
    stripePaymentMethodId: string
  ): Promise<PaymentMethod | null> {
    try {
      const { data: paymentMethod, error } = await this.supabase
        .from('payment_methods')
        .select('*')
        .eq('stripe_payment_method_id', stripePaymentMethodId)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw new Error(`Stripe ID not found: ${error.message}`);
      }

      return paymentMethod;
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Stripe ID not found: ${error.message}`);
      }
      throw new Error('Failed to get payment method');
    }
  }

  /**
   * Validate payment method data
   */
  validatePaymentMethod(data: any): boolean {
    if (
      !data.user_id ||
      !data.stripe_payment_method_id ||
      !data.type ||
      !data.last_four
    ) {
      throw new Error('Invalid payment method data');
    }
    return true;
  }
}
