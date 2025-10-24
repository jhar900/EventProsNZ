import { createClient } from '@/lib/supabase/server';
import { AuditLogger } from '@/lib/security/audit-logger';

export interface BounceEvent {
  email: string;
  type: 'hard' | 'soft';
  reason: string;
  timestamp: string;
  messageId?: string;
}

export interface ComplaintEvent {
  email: string;
  reason: string;
  timestamp: string;
  messageId?: string;
}

export interface SuppressionEntry {
  id: string;
  email: string;
  type: 'bounce' | 'complaint' | 'unsubscribe';
  reason?: string;
  created_at: string;
  is_active: boolean;
}

export interface SuppressionStats {
  total: number;
  bounces: number;
  complaints: number;
  unsubscribes: number;
  recent: number; // Last 24 hours
}

export class BounceHandler {
  private supabase = createClient();
  private auditLogger = new AuditLogger();

  /**
   * Process bounce event
   */
  async processBounce(bounceEvent: BounceEvent): Promise<void> {
    try {
      // Add to suppression list
      await this.addToSuppressionList({
        email: bounceEvent.email,
        type: 'bounce',
        reason: bounceEvent.reason,
      });

      // Update email log status
      if (bounceEvent.messageId) {
        await this.updateEmailLogStatus(
          bounceEvent.messageId,
          'bounced',
          bounceEvent.reason
        );
      }

      // Log audit event
      await this.auditLogger.logEvent({
        action: 'email_bounce_processed',
        details: {
          email: bounceEvent.email,
          type: bounceEvent.type,
          reason: bounceEvent.reason,
          messageId: bounceEvent.messageId,
        },
      });

      // Send notification if critical bounce
      if (bounceEvent.type === 'hard') {
        await this.sendBounceNotification(bounceEvent);
      }
    } catch (error) {
      console.error('Error processing bounce:', error);
      throw error;
    }
  }

  /**
   * Process complaint event
   */
  async processComplaint(complaintEvent: ComplaintEvent): Promise<void> {
    try {
      // Add to suppression list
      await this.addToSuppressionList({
        email: complaintEvent.email,
        type: 'complaint',
        reason: complaintEvent.reason,
      });

      // Update email log status
      if (complaintEvent.messageId) {
        await this.updateEmailLogStatus(
          complaintEvent.messageId,
          'complained',
          complaintEvent.reason
        );
      }

      // Log audit event
      await this.auditLogger.logEvent({
        action: 'email_complaint_processed',
        details: {
          email: complaintEvent.email,
          reason: complaintEvent.reason,
          messageId: complaintEvent.messageId,
        },
      });

      // Send critical notification
      await this.sendComplaintNotification(complaintEvent);
    } catch (error) {
      console.error('Error processing complaint:', error);
      throw error;
    }
  }

  /**
   * Get suppression list
   */
  async getSuppressionList(filters?: {
    type?: 'bounce' | 'complaint' | 'unsubscribe';
    isActive?: boolean;
    search?: string;
  }): Promise<SuppressionEntry[]> {
    try {
      let query = this.supabase
        .from('email_suppressions')
        .select('*')
        .order('created_at', { ascending: false });

      if (filters?.type) {
        query = query.eq('type', filters.type);
      }

      if (filters?.isActive !== undefined) {
        query = query.eq('is_active', filters.isActive);
      }

      if (filters?.search) {
        query = query.ilike('email', `%${filters.search}%`);
      }

      const { data, error } = await query;

      if (error) {
        throw new Error(`Failed to fetch suppression list: ${error.message}`);
      }

      return data || [];
    } catch (error) {
      console.error('Error fetching suppression list:', error);
      throw error;
    }
  }

  /**
   * Remove email from suppression list
   */
  async removeFromSuppressionList(email: string, type?: string): Promise<void> {
    try {
      let query = this.supabase
        .from('email_suppressions')
        .update({ is_active: false })
        .eq('email', email);

      if (type) {
        query = query.eq('type', type);
      }

      const { error } = await query;

      if (error) {
        throw new Error(
          `Failed to remove from suppression list: ${error.message}`
        );
      }

      // Log audit event
      await this.auditLogger.logEvent({
        action: 'email_suppression_removed',
        details: { email, type },
      });
    } catch (error) {
      console.error('Error removing from suppression list:', error);
      throw error;
    }
  }

  /**
   * Check if email is suppressed
   */
  async isEmailSuppressed(email: string): Promise<boolean> {
    try {
      const { data, error } = await this.supabase
        .from('email_suppressions')
        .select('id')
        .eq('email', email)
        .eq('is_active', true)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw new Error(`Failed to check suppression status: ${error.message}`);
      }

      return !!data;
    } catch (error) {
      console.error('Error checking suppression status:', error);
      return true; // Default to suppressed if error
    }
  }

  /**
   * Get suppression statistics
   */
  async getSuppressionStats(): Promise<SuppressionStats> {
    try {
      const { data, error } = await this.supabase
        .from('email_suppressions')
        .select('type, created_at, is_active')
        .eq('is_active', true);

      if (error) {
        throw new Error(`Failed to fetch suppression stats: ${error.message}`);
      }

      const now = new Date();
      const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);

      const stats: SuppressionStats = {
        total: data.length,
        bounces: data.filter(entry => entry.type === 'bounce').length,
        complaints: data.filter(entry => entry.type === 'complaint').length,
        unsubscribes: data.filter(entry => entry.type === 'unsubscribe').length,
        recent: data.filter(entry => new Date(entry.created_at) >= yesterday)
          .length,
      };

      return stats;
    } catch (error) {
      console.error('Error fetching suppression stats:', error);
      throw error;
    }
  }

  /**
   * Clean suppression list (remove old soft bounces)
   */
  async cleanSuppressionList(): Promise<void> {
    try {
      // Remove soft bounces older than 30 days
      const thirtyDaysAgo = new Date(
        Date.now() - 30 * 24 * 60 * 60 * 1000
      ).toISOString();

      const { error } = await this.supabase
        .from('email_suppressions')
        .update({ is_active: false })
        .eq('type', 'bounce')
        .eq('is_active', true)
        .lt('created_at', thirtyDaysAgo);

      if (error) {
        throw new Error(`Failed to clean suppression list: ${error.message}`);
      }

      // Log audit event
      await this.auditLogger.logEvent({
        action: 'suppression_list_cleaned',
        details: { cutoffDate: thirtyDaysAgo },
      });
    } catch (error) {
      console.error('Error cleaning suppression list:', error);
      throw error;
    }
  }

  /**
   * Add email to suppression list
   */
  private async addToSuppressionList(entry: {
    email: string;
    type: 'bounce' | 'complaint' | 'unsubscribe';
    reason?: string;
  }): Promise<void> {
    try {
      const { error } = await this.supabase.from('email_suppressions').upsert({
        email: entry.email,
        type: entry.type,
        reason: entry.reason,
        is_active: true,
        created_at: new Date().toISOString(),
      });

      if (error) {
        throw new Error(`Failed to add to suppression list: ${error.message}`);
      }
    } catch (error) {
      console.error('Error adding to suppression list:', error);
      throw error;
    }
  }

  /**
   * Update email log status
   */
  private async updateEmailLogStatus(
    messageId: string,
    status: string,
    errorMessage?: string
  ): Promise<void> {
    try {
      const updateData: any = { status };
      if (errorMessage) {
        updateData.error_message = errorMessage;
      }

      const { error } = await this.supabase
        .from('email_logs')
        .update(updateData)
        .eq('message_id', messageId);

      if (error) {
        console.error('Failed to update email log status:', error);
      }
    } catch (error) {
      console.error('Error updating email log status:', error);
    }
  }

  /**
   * Send bounce notification
   */
  private async sendBounceNotification(
    bounceEvent: BounceEvent
  ): Promise<void> {
    try {
      // This would integrate with your notification system
      // For now, we'll just log it
      console.log('Bounce notification:', {
        email: bounceEvent.email,
        type: bounceEvent.type,
        reason: bounceEvent.reason,
        timestamp: bounceEvent.timestamp,
      });

      // In a real implementation, you might:
      // - Send email to admin
      // - Create dashboard alert
      // - Update monitoring system
    } catch (error) {
      console.error('Error sending bounce notification:', error);
    }
  }

  /**
   * Send complaint notification
   */
  private async sendComplaintNotification(
    complaintEvent: ComplaintEvent
  ): Promise<void> {
    try {
      // This would integrate with your notification system
      console.log('Complaint notification:', {
        email: complaintEvent.email,
        reason: complaintEvent.reason,
        timestamp: complaintEvent.timestamp,
      });

      // In a real implementation, you might:
      // - Send urgent email to admin
      // - Create high-priority dashboard alert
      // - Trigger immediate investigation
    } catch (error) {
      console.error('Error sending complaint notification:', error);
    }
  }

  /**
   * Process webhook events from SendGrid
   */
  async processWebhookEvents(events: any[]): Promise<void> {
    try {
      for (const event of events) {
        switch (event.event) {
          case 'bounce':
            await this.processBounce({
              email: event.email,
              type: event.type === 'bounce' ? 'hard' : 'soft',
              reason: event.reason,
              timestamp: new Date(event.timestamp * 1000).toISOString(),
              messageId: event.sg_message_id,
            });
            break;

          case 'complaint':
            await this.processComplaint({
              email: event.email,
              reason: event.reason,
              timestamp: new Date(event.timestamp * 1000).toISOString(),
              messageId: event.sg_message_id,
            });
            break;

          case 'unsubscribe':
            await this.addToSuppressionList({
              email: event.email,
              type: 'unsubscribe',
              reason: 'User unsubscribed',
            });
            break;

          default:
            // Handle other events if needed
            break;
        }
      }
    } catch (error) {
      console.error('Error processing webhook events:', error);
      throw error;
    }
  }
}
