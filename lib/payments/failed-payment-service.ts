/**
 * Failed Payment Service
 * Handles failed payment management and retry functionality
 */

import { createClient } from '@/lib/supabase/server';
import { StripeService } from './stripe-service';

export interface FailedPayment {
  id: string;
  payment_id: string;
  failure_count: number;
  grace_period_end: string;
  notification_sent_days: number[];
  retry_attempts: number;
  created_at: string;
  updated_at: string;
}

export interface FailedPaymentCreateData {
  payment_id: string;
  grace_period_days?: number;
}

export class FailedPaymentService {
  private supabase;
  private stripeService: any;

  constructor(stripeService?: any) {
    this.supabase = createClient();
    this.stripeService = stripeService || new StripeService();
  }

  /**
   * Create failed payment record
   */
  async createFailedPayment(
    paymentId: string,
    failureReason: string,
    gracePeriodDays?: number
  ): Promise<FailedPayment> {
    try {
      const gracePeriod = gracePeriodDays || 7;
      const gracePeriodEnd = new Date();
      gracePeriodEnd.setDate(gracePeriodEnd.getDate() + gracePeriod);

      const { data: failedPayment, error } = await this.supabase
        .from('failed_payments')
        .insert({
          payment_id: paymentId,
          failure_count: 1,
          grace_period_end: gracePeriodEnd.toISOString(),
          notification_sent_days: [],
          retry_attempts: 0,
        })
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to create failed payment: ${error.message}`);
      }

      return failedPayment;
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to create failed payment: ${error.message}`);
      }
      throw new Error(
        'Failed to create failed payment: Database connection failed'
      );
    }
  }

  /**
   * Get failed payments
   */
  async getFailedPayments(
    userId?: string,
    status?: string
  ): Promise<FailedPayment[]> {
    try {
      let query = this.supabase.from('failed_payments').select('*');

      if (userId) {
        query = query.eq('user_id', userId);
      }

      if (status) {
        query = query.eq('status', status);
      }

      const { data: failedPayments, error } = await query.order('created_at', {
        ascending: false,
      });

      if (error) {
        throw new Error(`Failed to retrieve failed payments: ${error.message}`);
      }

      return failedPayments || [];
    } catch (error) {
      throw new Error(
        'Failed to retrieve failed payments: Database connection failed'
      );
    }
  }

  /**
   * Retry failed payment
   */
  async retryFailedPayment(
    paymentId: string,
    paymentMethodId?: string
  ): Promise<{ success: boolean; payment?: any; error?: string }> {
    try {
      // Get failed payment record
      const { data: failedPayment, error: fpError } = await this.supabase
        .from('failed_payments')
        .select('*')
        .eq('payment_id', paymentId)
        .single();

      if (fpError || !failedPayment) {
        return { success: false, error: 'Failed payment record not found' };
      }

      // Check if grace period has expired
      const gracePeriodEnd = new Date(failedPayment.grace_period_end);
      if (new Date() > gracePeriodEnd) {
        return { success: false, error: 'Grace period has expired' };
      }

      // Check retry attempts limit
      if (failedPayment.retry_attempts >= 3) {
        return { success: false, error: 'Maximum retry attempts exceeded' };
      }

      // Get payment details
      const { data: payment, error: paymentError } = await this.supabase
        .from('payments')
        .select('*')
        .eq('id', paymentId)
        .single();

      if (paymentError || !payment) {
        return { success: false, error: 'Payment not found' };
      }

      // Update retry attempts
      await this.supabase
        .from('failed_payments')
        .update({
          retry_attempts: failedPayment.retry_attempts + 1,
          updated_at: new Date().toISOString(),
        })
        .eq('id', failedPayment.id);

      // Retry payment with Stripe
      try {
        const stripeResult = await this.stripeService.confirmPaymentIntent(
          payment.stripe_payment_intent_id,
          paymentMethodId || payment.stripe_payment_method_id
        );

        if (stripeResult.status !== 'succeeded') {
          return {
            success: false,
            error: `Payment retry failed: ${stripeResult.last_payment_error?.message || 'Unknown error'}`,
          };
        }
      } catch (stripeError) {
        return {
          success: false,
          error: `Payment retry failed: ${stripeError instanceof Error ? stripeError.message : 'Unknown error'}`,
        };
      }

      // Update payment status in database
      const { error: updateError } = await this.supabase
        .from('payments')
        .update({
          status: 'succeeded',
          updated_at: new Date().toISOString(),
        })
        .eq('id', paymentId);

      if (updateError) {
        return {
          success: false,
          error: `Failed to update payment status: ${updateError.message}`,
        };
      }

      const retryResult = {
        success: true,
        payment: {
          ...payment,
          status: 'succeeded',
          updated_at: new Date().toISOString(),
        },
      };

      return retryResult;
    } catch (error) {
      return { success: false, error: 'Failed to retry payment' };
    }
  }

  /**
   * Check for failed payments needing notifications
   */
  async checkFailedPaymentNotifications(): Promise<void> {
    try {
      const now = new Date();
      const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
      const sixDaysAgo = new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000);
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

      // Get failed payments that need notifications
      const { data: failedPayments, error } = await this.supabase
        .from('failed_payments')
        .select(
          `
          *,
          payments!inner(
            id,
            amount,
            currency,
            subscriptions!inner(
              user_id,
              tier
            )
          )
        `
        )
        .in('payments.status', ['failed', 'pending'])
        .order('created_at', { ascending: true });

      if (error) {
        throw new Error(
          `Failed to get failed payments for notifications: ${error.message}`
        );
      }

      for (const failedPayment of failedPayments || []) {
        const createdDate = new Date(failedPayment.created_at);
        const daysSinceFailure = Math.floor(
          (now.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24)
        );

        // Check if we need to send notifications
        let shouldNotify = false;
        let notificationDay = 0;

        if (
          daysSinceFailure >= 3 &&
          !failedPayment.notification_sent_days.includes(3)
        ) {
          shouldNotify = true;
          notificationDay = 3;
        } else if (
          daysSinceFailure >= 6 &&
          !failedPayment.notification_sent_days.includes(6)
        ) {
          shouldNotify = true;
          notificationDay = 6;
        } else if (
          daysSinceFailure >= 7 &&
          !failedPayment.notification_sent_days.includes(7)
        ) {
          shouldNotify = true;
          notificationDay = 7;
        }

        if (shouldNotify) {
          await this.sendFailedPaymentNotification(
            failedPayment,
            notificationDay
          );

          // Update notification sent days
          const updatedDays = [
            ...failedPayment.notification_sent_days,
            notificationDay,
          ];
          await this.supabase
            .from('failed_payments')
            .update({
              notification_sent_days: updatedDays,
              updated_at: new Date().toISOString(),
            })
            .eq('id', failedPayment.id);
        }
      }
    } catch (error) {
      console.error('Error checking failed payment notifications:', error);
    }
  }

  /**
   * Send failed payment notification
   */
  private async sendFailedPaymentNotification(
    failedPayment: any,
    notificationDay: number
  ): Promise<void> {
    try {
      // Get user information
      const { data: user, error: userError } = await this.supabase
        .from('users')
        .select('email, first_name, last_name')
        .eq('id', failedPayment.payments.subscriptions.user_id)
        .single();

      if (userError || !user) {
        console.error(
          'Failed to get user for failed payment notification:',
          userError
        );
        return;
      }

      // Send notification email
      await this.sendFailedPaymentEmail(user, failedPayment, notificationDay);
    } catch (error) {
      console.error('Error sending failed payment notification:', error);
    }
  }

  /**
   * Send failed payment email
   */
  private async sendFailedPaymentEmail(
    user: any,
    failedPayment: any,
    notificationDay: number
  ): Promise<void> {
    try {
      // In a real implementation, this would use SendGrid or similar
      console.log(
        'Failed payment notification email would be sent to:',
        user.email
      );
      console.log('Notification day:', notificationDay);
      console.log('Payment amount:', failedPayment.payments.amount);
      console.log('Payment currency:', failedPayment.payments.currency);
    } catch (error) {
      console.error('Error sending failed payment email:', error);
    }
  }

  /**
   * Get failed payment by ID
   */
  async getFailedPayment(
    failedPaymentId: string
  ): Promise<FailedPayment | null> {
    try {
      const { data: failedPayment, error } = await this.supabase
        .from('failed_payments')
        .select('*')
        .eq('id', failedPaymentId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null; // No rows found
        }
        throw new Error(`Failed to get failed payment: ${error.message}`);
      }

      return failedPayment;
    } catch (error) {
      throw new Error('Failed to get failed payment');
    }
  }

  /**
   * Update failed payment
   */
  async updateFailedPayment(
    failedPaymentId: string,
    updateData: Partial<FailedPayment>
  ): Promise<FailedPayment> {
    try {
      const { data: failedPayment, error } = await this.supabase
        .from('failed_payments')
        .update({
          ...updateData,
          updated_at: new Date().toISOString(),
        })
        .eq('id', failedPaymentId)
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to update failed payment: ${error.message}`);
      }

      return failedPayment;
    } catch (error) {
      throw new Error('Failed to update failed payment: Update failed');
    }
  }

  /**
   * Increment failure count
   */
  async incrementFailureCount(failedPaymentId: string): Promise<FailedPayment> {
    try {
      // First get the current failure count
      const { data: currentFailedPayment, error: getError } =
        await this.supabase
          .from('failed_payments')
          .select('failure_count')
          .eq('id', failedPaymentId)
          .single();

      if (getError) {
        throw new Error(
          `Failed to get current failure count: ${getError.message}`
        );
      }

      const { data: failedPayment, error } = await this.supabase
        .from('failed_payments')
        .update({
          failure_count: (currentFailedPayment.failure_count || 0) + 1,
          updated_at: new Date().toISOString(),
        })
        .eq('id', failedPaymentId)
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to increment failure count: ${error.message}`);
      }

      return failedPayment;
    } catch (error) {
      throw new Error('Failed to increment failure count');
    }
  }

  /**
   * Add notification sent day
   */
  async addNotificationSentDay(
    failedPaymentId: string,
    day: number
  ): Promise<FailedPayment> {
    try {
      // Get current failed payment
      const { data: currentFailedPayment, error: getError } =
        await this.supabase
          .from('failed_payments')
          .select('notification_sent_days')
          .eq('id', failedPaymentId)
          .single();

      if (getError) {
        throw new Error(`Failed to get failed payment: ${getError.message}`);
      }

      const updatedDays = [
        ...(currentFailedPayment.notification_sent_days || []),
        day,
      ];

      const { data: failedPayment, error } = await this.supabase
        .from('failed_payments')
        .update({
          notification_sent_days: updatedDays,
          updated_at: new Date().toISOString(),
        })
        .eq('id', failedPaymentId)
        .select()
        .single();

      if (error) {
        throw new Error(
          `Failed to add notification sent day: ${error.message}`
        );
      }

      return failedPayment;
    } catch (error) {
      throw new Error('Failed to add notification sent day');
    }
  }

  /**
   * Increment retry attempts
   */
  async incrementRetryAttempts(
    failedPaymentId: string
  ): Promise<FailedPayment> {
    try {
      // First get the current retry attempts
      const { data: currentFailedPayment, error: getError } =
        await this.supabase
          .from('failed_payments')
          .select('retry_attempts')
          .eq('id', failedPaymentId)
          .single();

      if (getError) {
        throw new Error(
          `Failed to get current retry attempts: ${getError.message}`
        );
      }

      const { data: failedPayment, error } = await this.supabase
        .from('failed_payments')
        .update({
          retry_attempts: (currentFailedPayment.retry_attempts || 0) + 1,
          updated_at: new Date().toISOString(),
        })
        .eq('id', failedPaymentId)
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to increment retry attempts: ${error.message}`);
      }

      return failedPayment;
    } catch (error) {
      throw new Error('Failed to increment retry attempts');
    }
  }

  /**
   * Get expired failed payments
   */
  async getExpiredFailedPayments(): Promise<FailedPayment[]> {
    try {
      const now = new Date().toISOString();

      const { data: failedPayments, error } = await this.supabase
        .from('failed_payments')
        .select('*')
        .lt('grace_period_end', now)
        .order('created_at', { ascending: false });

      if (error) {
        throw new Error(
          `Failed to get expired failed payments: ${error.message}`
        );
      }

      return failedPayments || [];
    } catch (error) {
      throw new Error('Failed to get expired failed payments');
    }
  }

  /**
   * Get failed payments requiring notification
   */
  async getFailedPaymentsRequiringNotification(
    day: number
  ): Promise<FailedPayment[]> {
    try {
      const { data: failedPayments, error } = await this.supabase
        .from('failed_payments')
        .select('*')
        .not('notification_sent_days', 'cs', `{${day}}`)
        .order('created_at', { ascending: false });

      if (error) {
        throw new Error(
          `Failed to get failed payments requiring notification: ${error.message}`
        );
      }

      return failedPayments || [];
    } catch (error) {
      throw new Error('Failed to get failed payments requiring notification');
    }
  }

  /**
   * Resolve failed payment
   */
  async resolveFailedPayment(
    failedPaymentId: string,
    resolution: string
  ): Promise<FailedPayment> {
    try {
      const { data: failedPayment, error } = await this.supabase
        .from('failed_payments')
        .update({
          status: 'resolved',
          resolution,
          updated_at: new Date().toISOString(),
        })
        .eq('id', failedPaymentId)
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to resolve failed payment: ${error.message}`);
      }

      return failedPayment;
    } catch (error) {
      throw new Error('Failed to resolve failed payment');
    }
  }

  /**
   * Delete failed payment
   */
  async deleteFailedPayment(failedPaymentId: string): Promise<boolean> {
    try {
      const { error } = await this.supabase
        .from('failed_payments')
        .delete()
        .eq('id', failedPaymentId);

      if (error) {
        throw new Error(`Failed to delete failed payment: ${error.message}`);
      }

      return true;
    } catch (error) {
      throw new Error('Failed to delete failed payment: Delete failed');
    }
  }

  /**
   * Get failed payment statistics
   */
  async getFailedPaymentStatistics(userId?: string): Promise<any> {
    try {
      let query = this.supabase.from('failed_payments').select('*');

      if (userId) {
        query = query.eq('user_id', userId);
      }

      const { data: failedPayments, error } = await query;

      if (error) {
        throw new Error(
          `Failed to retrieve failed payment statistics: ${error.message}`
        );
      }

      // Calculate statistics
      const totalFailed = failedPayments?.length || 0;
      const totalRetryAttempts =
        failedPayments?.reduce((sum, fp) => sum + fp.retry_attempts, 0) || 0;
      const averageFailureCount =
        failedPayments?.reduce((sum, fp) => sum + fp.failure_count, 0) /
          totalFailed || 0;
      const activeFailedPayments =
        failedPayments?.filter(fp => !fp.resolution).length || 0;
      const expiredFailedPayments =
        failedPayments?.filter(fp => new Date(fp.grace_period_end) < new Date())
          .length || 0;

      return {
        total_failed_payments: totalFailed,
        total_retry_attempts: totalRetryAttempts,
        average_failure_count: averageFailureCount,
        active_failed_payments: activeFailedPayments,
        expired_failed_payments: expiredFailedPayments,
      };
    } catch (error) {
      throw new Error(
        'Failed to retrieve failed payment statistics: Statistics query failed'
      );
    }
  }

  /**
   * Get failed payment analytics
   */
  async getFailedPaymentAnalytics(userId?: string): Promise<any> {
    try {
      let query = this.supabase.from('failed_payments').select(`
          *,
          payments!inner(
            amount,
            currency,
            subscriptions!inner(user_id)
          )
        `);

      if (userId) {
        query = query.eq('payments.subscriptions.user_id', userId);
      }

      const { data: failedPayments, error } = await query;

      if (error) {
        throw new Error(
          `Failed to get failed payment analytics: ${error.message}`
        );
      }

      // Calculate analytics
      const totalFailed = failedPayments?.length || 0;
      const totalAmount =
        failedPayments?.reduce((sum, fp) => sum + fp.payments.amount, 0) || 0;
      const averageRetryAttempts =
        failedPayments?.reduce((sum, fp) => sum + fp.retry_attempts, 0) /
          totalFailed || 0;

      return {
        total_failed: totalFailed,
        total_amount: totalAmount,
        average_retry_attempts: averageRetryAttempts,
        failed_payments: failedPayments || [],
      };
    } catch (error) {
      throw new Error('Failed to get failed payment analytics');
    }
  }
}
