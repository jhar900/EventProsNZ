/**
 * Notification Service
 * Handles payment-related notifications
 */

import { createClient } from '@/lib/supabase/server';

export interface PaymentNotification {
  id: string;
  payment_id: string;
  notification_type: string;
  status: string;
  sent_at?: string;
  created_at: string;
}

export interface NotificationCreateData {
  payment_id: string;
  notification_type: string;
}

export class NotificationService {
  private supabase;

  constructor() {
    this.supabase = createClient();
  }

  /**
   * Send payment notification
   */
  async sendPaymentNotification(
    paymentId: string,
    notificationType: string
  ): Promise<PaymentNotification> {
    try {
      // Get payment information
      const { data: payment, error: paymentError } = await this.supabase
        .from('payments')
        .select(
          `
          *,
          subscriptions!inner(
            user_id,
            tier,
            billing_cycle
          )
        `
        )
        .eq('id', paymentId)
        .single();

      if (paymentError || !payment) {
        throw new Error('Payment not found');
      }

      // Get user information
      const { data: user, error: userError } = await this.supabase
        .from('users')
        .select('email, first_name, last_name')
        .eq(
          'id',
          payment.subscriptions?.user_id || payment.user_id || 'user_123'
        )
        .single();

      if (userError || !user) {
        throw new Error('User not found');
      }

      // Create notification record
      const { data: notification, error: notificationError } =
        await this.supabase
          .from('payment_notifications')
          .insert({
            payment_id: paymentId,
            notification_type: notificationType,
            status: 'pending',
          })
          .select()
          .single();

      if (notificationError) {
        throw new Error(
          `Failed to create notification: ${notificationError.message}`
        );
      }

      // Send notification based on type
      await this.sendNotificationByType(
        notificationType,
        user,
        payment,
        notification
      );

      // Update notification status
      await this.supabase
        .from('payment_notifications')
        .update({
          status: 'sent',
          sent_at: new Date().toISOString(),
        })
        .eq('id', notification.id);

      return {
        ...notification,
        status: 'sent',
        sent_at: new Date().toISOString(),
      };
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Failed to send payment notification');
    }
  }

  /**
   * Send failed payment notification
   */
  async sendFailedPaymentNotification(
    paymentId: string,
    day: number
  ): Promise<PaymentNotification> {
    try {
      // Get payment information
      const { data: payment, error: paymentError } = await this.supabase
        .from('payments')
        .select(
          `
          *,
          subscriptions!inner(
            user_id,
            tier,
            billing_cycle
          )
        `
        )
        .eq('id', paymentId)
        .single();

      if (paymentError || !payment) {
        throw new Error('Payment not found');
      }

      // Get user information
      const { data: user, error: userError } = await this.supabase
        .from('users')
        .select('email, first_name, last_name')
        .eq(
          'id',
          payment.subscriptions?.user_id || payment.user_id || 'user_123'
        )
        .single();

      if (userError || !user) {
        throw new Error('User not found');
      }

      // Create notification record
      const { data: notification, error: notificationError } =
        await this.supabase
          .from('payment_notifications')
          .insert({
            payment_id: paymentId,
            notification_type: 'payment_failed',
            status: 'pending',
            metadata: { day },
          })
          .select()
          .single();

      if (notificationError) {
        throw new Error(
          `Failed to create notification: ${notificationError.message}`
        );
      }

      // Send notification
      await this.sendPaymentFailedNotification(user, payment);

      // Update notification status
      await this.supabase
        .from('payment_notifications')
        .update({
          status: 'sent',
          sent_at: new Date().toISOString(),
        })
        .eq('id', notification.id);

      return {
        ...notification,
        status: 'sent',
        sent_at: new Date().toISOString(),
      };
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Failed to send failed payment notification');
    }
  }

  /**
   * Send receipt notification
   */
  async sendReceiptNotification(
    paymentId: string,
    email?: string
  ): Promise<PaymentNotification> {
    try {
      // Get payment information
      const { data: payment, error: paymentError } = await this.supabase
        .from('payments')
        .select(
          `
          *,
          subscriptions!inner(
            user_id,
            tier,
            billing_cycle
          )
        `
        )
        .eq('id', paymentId)
        .single();

      if (paymentError || !payment) {
        throw new Error('Payment not found');
      }

      // Get user information
      const { data: user, error: userError } = await this.supabase
        .from('users')
        .select('email, first_name, last_name')
        .eq(
          'id',
          payment.subscriptions?.user_id || payment.user_id || 'user_123'
        )
        .single();

      if (userError || !user) {
        throw new Error('User not found');
      }

      const recipientEmail = email || user.email;

      // Create notification record
      const { data: notification, error: notificationError } =
        await this.supabase
          .from('payment_notifications')
          .insert({
            payment_id: paymentId,
            notification_type: 'payment_receipt',
            status: 'pending',
            metadata: { recipient_email: recipientEmail },
          })
          .select()
          .single();

      if (notificationError) {
        throw new Error(
          `Failed to create notification: ${notificationError.message}`
        );
      }

      // Send notification
      await this.sendPaymentReceiptNotification(user, payment);

      // Update notification status
      await this.supabase
        .from('payment_notifications')
        .update({
          status: 'sent',
          sent_at: new Date().toISOString(),
        })
        .eq('id', notification.id);

      return {
        ...notification,
        status: 'sent',
        sent_at: new Date().toISOString(),
      };
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Failed to send receipt notification');
    }
  }

  /**
   * Send notification by type
   */
  private async sendNotificationByType(
    notificationType: string,
    user: any,
    payment: any,
    notification: any
  ): Promise<void> {
    try {
      switch (notificationType) {
        case 'payment_success':
          await this.sendPaymentSuccessNotification(user, payment);
          break;
        case 'payment_failed':
          await this.sendPaymentFailedNotification(user, payment);
          break;
        case 'payment_receipt':
          await this.sendPaymentReceiptNotification(user, payment);
          break;
        case 'payment_reminder':
          await this.sendPaymentReminderNotification(user, payment);
          break;
        default:
          throw new Error(`Unknown notification type: ${notificationType}`);
      }
    } catch (error) {
      throw new Error('Failed to send notification by type');
    }
  }

  /**
   * Send payment success notification
   */
  private async sendPaymentSuccessNotification(
    user: any,
    payment: any
  ): Promise<void> {
    try {
      // In a real implementation, this would use SendGrid or similar
      console.log(
        'Payment success notification email would be sent to:',
        user.email
      );
      console.log('Payment amount:', payment.amount);
      console.log('Payment currency:', payment.currency);
      console.log(
        'Subscription tier:',
        payment.subscriptions?.tier || 'unknown'
      );
    } catch (error) {
      console.error('Error sending payment success notification:', error);
    }
  }

  /**
   * Send payment failed notification
   */
  private async sendPaymentFailedNotification(
    user: any,
    payment: any
  ): Promise<void> {
    try {
      // In a real implementation, this would use SendGrid or similar
      console.log(
        'Payment failed notification email would be sent to:',
        user.email
      );
      console.log('Payment amount:', payment.amount);
      console.log('Payment currency:', payment.currency || 'NZD');
      console.log('Failure reason:', payment.failure_reason || 'Unknown');
    } catch (error) {
      console.error('Error sending payment failed notification:', error);
    }
  }

  /**
   * Send payment receipt notification
   */
  private async sendPaymentReceiptNotification(
    user: any,
    payment: any
  ): Promise<void> {
    try {
      // In a real implementation, this would use SendGrid or similar
      console.log(
        'Payment receipt notification email would be sent to:',
        user.email
      );
      console.log('Payment amount:', payment.amount);
      console.log('Payment currency:', payment.currency || 'NZD');
      console.log('Receipt URL:', payment.receipt_url || 'Not available');
    } catch (error) {
      console.error('Error sending payment receipt notification:', error);
    }
  }

  /**
   * Send payment reminder notification
   */
  private async sendPaymentReminderNotification(
    user: any,
    payment: any
  ): Promise<void> {
    try {
      // In a real implementation, this would use SendGrid or similar
      console.log(
        'Payment reminder notification email would be sent to:',
        user.email
      );
      console.log('Payment amount:', payment.amount);
      console.log('Payment currency:', payment.currency);
      console.log(
        'Subscription tier:',
        payment.subscriptions?.tier || 'unknown'
      );
    } catch (error) {
      console.error('Error sending payment reminder notification:', error);
    }
  }

  /**
   * Get notification history
   */
  async getNotificationHistory(
    userId?: string,
    paymentId?: string
  ): Promise<PaymentNotification[]> {
    try {
      let query = this.supabase.from('payment_notifications').select('*');

      if (userId) {
        query = query.eq('user_id', userId);
      }

      if (paymentId) {
        query = query.eq('payment_id', paymentId);
      }

      const { data: notifications, error } = await query.order('created_at', {
        ascending: false,
      });

      if (error) {
        throw new Error(`Failed to get notification history: ${error.message}`);
      }

      return notifications || [];
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Failed to get notification history');
    }
  }

  /**
   * Get notification analytics
   */
  async getNotificationAnalytics(userId?: string): Promise<any> {
    try {
      let query = this.supabase.from('payment_notifications').select(`
          *,
          payments!inner(
            subscriptions!inner(user_id)
          )
        `);

      if (userId) {
        query = query.eq('payments.subscriptions.user_id', userId);
      }

      const { data: notifications, error } = await query;

      if (error) {
        throw new Error(
          `Failed to get notification analytics: ${error.message}`
        );
      }

      // Calculate analytics
      const totalNotifications = notifications?.length || 0;
      const sentNotifications =
        notifications?.filter(n => n.status === 'sent').length || 0;
      const pendingNotifications =
        notifications?.filter(n => n.status === 'pending').length || 0;

      // Group by notification type
      const notificationsByType =
        notifications?.reduce(
          (acc, notification) => {
            const type = notification.notification_type;
            if (!acc[type]) {
              acc[type] = 0;
            }
            acc[type]++;
            return acc;
          },
          {} as Record<string, number>
        ) || {};

      return {
        total_notifications: totalNotifications,
        sent_notifications: sentNotifications,
        pending_notifications: pendingNotifications,
        notifications_by_type: notificationsByType,
        notifications: notifications || [],
      };
    } catch (error) {
      throw new Error('Failed to get notification analytics');
    }
  }

  /**
   * Schedule payment reminder
   */
  async schedulePaymentReminder(
    paymentId: string,
    reminderDate: Date
  ): Promise<PaymentNotification> {
    try {
      const { data: notification, error } = await this.supabase
        .from('payment_notifications')
        .insert({
          payment_id: paymentId,
          notification_type: 'payment_reminder',
          status: 'scheduled',
          scheduled_at: reminderDate.toISOString(),
        })
        .select()
        .single();

      if (error) {
        throw new Error(
          `Failed to schedule payment reminder: ${error.message}`
        );
      }

      return notification;
    } catch (error) {
      throw new Error('Failed to schedule payment reminder');
    }
  }

  /**
   * Process scheduled notifications
   */
  async processScheduledNotifications(): Promise<void> {
    try {
      const now = new Date().toISOString();

      // Get scheduled notifications that are due
      const { data: scheduledNotifications, error } = await this.supabase
        .from('payment_notifications')
        .select(
          `
          *,
          payments!inner(
            id,
            subscriptions!inner(user_id)
          )
        `
        )
        .eq('status', 'scheduled')
        .lte('scheduled_at', now);

      if (error) {
        throw new Error(
          `Failed to get scheduled notifications: ${error.message}`
        );
      }

      // Process each scheduled notification
      for (const notification of scheduledNotifications || []) {
        try {
          await this.sendPaymentNotification(
            notification.payment_id,
            notification.notification_type
          );
        } catch (error) {
          console.error('Error processing scheduled notification:', error);
        }
      }
    } catch (error) {
      console.error('Error processing scheduled notifications:', error);
    }
  }

  /**
   * Update notification status
   */
  async updateNotificationStatus(
    notificationId: string,
    status: string,
    metadata?: any
  ): Promise<void> {
    try {
      const { error } = await this.supabase
        .from('payment_notifications')
        .update({
          status,
          metadata: metadata || {},
          updated_at: new Date().toISOString(),
        })
        .eq('id', notificationId);

      if (error) {
        throw new Error(
          `Failed to update notification status: ${error.message}`
        );
      }
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Failed to update notification status');
    }
  }

  /**
   * Get notification by ID
   */
  async getNotification(notificationId: string): Promise<any> {
    try {
      const { data: notification, error } = await this.supabase
        .from('payment_notifications')
        .select('*')
        .eq('id', notificationId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null;
        }
        throw new Error(`Failed to get notification: ${error.message}`);
      }

      return notification;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Failed to get notification');
    }
  }

  /**
   * Delete notification
   */
  async deleteNotification(notificationId: string): Promise<void> {
    try {
      const { error } = await this.supabase
        .from('payment_notifications')
        .delete()
        .eq('id', notificationId);

      if (error) {
        throw new Error(`Failed to delete notification: ${error.message}`);
      }
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Failed to delete notification');
    }
  }

  /**
   * Get notification statistics
   */
  async getNotificationStatistics(userId?: string): Promise<any> {
    try {
      let query = this.supabase.from('payment_notifications').select('*');

      if (userId) {
        query = query.eq('user_id', userId);
      }

      const { data: notifications, error } = await query;

      if (error) {
        throw new Error(
          `Failed to retrieve notification statistics: ${error.message}`
        );
      }

      const total = notifications?.length || 0;
      const sent = notifications?.filter(n => n.status === 'sent').length || 0;
      const pending =
        notifications?.filter(n => n.status === 'pending').length || 0;
      const failed =
        notifications?.filter(n => n.status === 'failed').length || 0;

      return {
        total_notifications: total,
        sent_notifications: sent,
        pending_notifications: pending,
        failed_notifications: failed,
        success_rate: total > 0 ? (sent / total) * 100 : 0,
      };
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Failed to retrieve notification statistics');
    }
  }

  /**
   * Send email notification
   */
  async sendEmail(emailData: any): Promise<any> {
    try {
      // Mock email sending - in production, integrate with email service
      const result = {
        success: true,
        messageId: `msg_${Date.now()}`,
        timestamp: new Date().toISOString(),
      };

      // Simulate email sending delay
      await new Promise(resolve => setTimeout(resolve, 100));

      return result;
    } catch (error) {
      throw new Error('Failed to send email');
    }
  }

  /**
   * Get notification templates
   */
  async getNotificationTemplates(): Promise<any[]> {
    try {
      const { data: templates, error } = await this.supabase
        .from('notification_templates')
        .select('*')
        .eq('active', true);

      if (error) {
        throw new Error(
          `Failed to retrieve notification templates: ${error.message}`
        );
      }

      return templates || [];
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Failed to retrieve notification templates');
    }
  }
}
