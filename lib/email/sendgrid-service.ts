import sgMail from '@sendgrid/mail';
import { createClient } from '@/lib/supabase/server';
import { sanitizeHtml, sanitizeText } from '@/lib/security/sanitization';
import { AuditLogger } from '@/lib/security/audit-logger';

export interface EmailMessage {
  to: string | string[];
  subject: string;
  html?: string;
  text?: string;
  templateId?: string;
  dynamicTemplateData?: Record<string, any>;
  attachments?: Array<{
    content: string;
    filename: string;
    type?: string;
    disposition?: string;
  }>;
  categories?: string[];
  customArgs?: Record<string, string>;
}

export interface EmailResponse {
  success: boolean;
  messageId?: string;
  error?: string;
}

export interface EmailLog {
  id: string;
  recipient: string;
  template_id?: string;
  status:
    | 'pending'
    | 'sent'
    | 'delivered'
    | 'bounced'
    | 'complained'
    | 'failed';
  sent_at?: string;
  delivered_at?: string;
  error_message?: string;
  message_id?: string;
}

export class SendGridService {
  private supabase = createClient();
  private auditLogger = new AuditLogger();

  constructor() {
    if (!process.env.SENDGRID_API_KEY) {
      throw new Error('SENDGRID_API_KEY environment variable is required');
    }
    sgMail.setApiKey(process.env.SENDGRID_API_KEY);
  }

  /**
   * Send email via SendGrid
   */
  async sendEmail(message: EmailMessage): Promise<EmailResponse> {
    let logId: string | undefined;

    try {
      // Validate and sanitize inputs
      const sanitizedMessage = this.sanitizeEmailMessage(message);

      // Create email log entry
      logId = await this.createEmailLog(sanitizedMessage);

      // Prepare SendGrid message
      const sgMessage = this.prepareSendGridMessage(sanitizedMessage);

      // Send email
      const response = await sgMail.send(sgMessage);
      const messageId = response[0].headers['x-message-id'] as string;

      // Update email log
      await this.updateEmailLog(logId, 'sent', messageId);

      // Log audit event
      await this.auditLogger.logEvent({
        action: 'email_sent',
        details: {
          recipient: Array.isArray(sanitizedMessage.to)
            ? sanitizedMessage.to.join(', ')
            : sanitizedMessage.to,
          subject: sanitizedMessage.subject,
          messageId,
        },
      });

      return {
        success: true,
        messageId,
      };
    } catch (error) {
      console.error('SendGrid email error:', error);

      // Update email log with error
      if (logId && error.response?.body?.errors) {
        const errorMessage = error.response.body.errors
          .map((e: any) => e.message)
          .join(', ');
        await this.updateEmailLog(logId, 'failed', undefined, errorMessage);
      }

      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Send bulk emails
   */
  async sendBulkEmails(messages: EmailMessage[]): Promise<EmailResponse[]> {
    const results: EmailResponse[] = [];

    // Process in batches to avoid rate limits
    const batchSize = 10;
    for (let i = 0; i < messages.length; i += batchSize) {
      const batch = messages.slice(i, i + batchSize);
      const batchPromises = batch.map(message => this.sendEmail(message));
      const batchResults = await Promise.allSettled(batchPromises);

      batchResults.forEach(result => {
        if (result.status === 'fulfilled') {
          results.push(result.value);
        } else {
          results.push({
            success: false,
            error: result.reason.message,
          });
        }
      });

      // Add delay between batches to respect rate limits
      if (i + batchSize < messages.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    return results;
  }

  /**
   * Get email delivery status
   */
  async getEmailStatus(messageId: string): Promise<EmailLog | null> {
    try {
      const { data, error } = await this.supabase
        .from('email_logs')
        .select('*')
        .eq('message_id', messageId)
        .single();

      if (error) {
        console.error('Error fetching email status:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error fetching email status:', error);
      return null;
    }
  }

  /**
   * Get email analytics
   */
  async getEmailAnalytics(filters?: {
    startDate?: string;
    endDate?: string;
    status?: string;
    templateId?: string;
  }) {
    try {
      let query = this.supabase.from('email_logs').select('*');

      if (filters?.startDate) {
        query = query.gte('sent_at', filters.startDate);
      }
      if (filters?.endDate) {
        query = query.lte('sent_at', filters.endDate);
      }
      if (filters?.status) {
        query = query.eq('status', filters.status);
      }
      if (filters?.templateId) {
        query = query.eq('template_id', filters.templateId);
      }

      const { data, error } = await query.order('sent_at', {
        ascending: false,
      });

      if (error) {
        throw new Error(`Failed to fetch email analytics: ${error.message}`);
      }

      return this.calculateEmailMetrics(data || []);
    } catch (error) {
      console.error('Error fetching email analytics:', error);
      throw error;
    }
  }

  /**
   * Handle webhook events from SendGrid
   */
  async handleWebhookEvent(event: any): Promise<void> {
    try {
      const { email, event: eventType, sg_message_id, timestamp } = event;

      // Update email log based on event type
      const status = this.mapWebhookEventToStatus(eventType);
      if (status) {
        await this.supabase
          .from('email_logs')
          .update({
            status,
            delivered_at:
              eventType === 'delivered'
                ? new Date(timestamp * 1000).toISOString()
                : undefined,
            error_message: eventType === 'bounce' ? event.reason : undefined,
          })
          .eq('message_id', sg_message_id);
      }

      // Handle bounce and complaint events
      if (eventType === 'bounce' || eventType === 'complaint') {
        await this.handleBounceOrComplaint(email, eventType, event.reason);
      }
    } catch (error) {
      console.error('Error handling webhook event:', error);
    }
  }

  /**
   * Sanitize email message to prevent XSS and other security issues
   */
  private sanitizeEmailMessage(message: EmailMessage): EmailMessage {
    return {
      ...message,
      subject: sanitizeText(message.subject),
      html: message.html ? sanitizeHtml(message.html) : undefined,
      text: message.text ? sanitizeText(message.text) : undefined,
      dynamicTemplateData: message.dynamicTemplateData
        ? this.sanitizeObject(message.dynamicTemplateData)
        : undefined,
    };
  }

  /**
   * Sanitize object properties recursively
   */
  private sanitizeObject(obj: Record<string, any>): Record<string, any> {
    const sanitized: Record<string, any> = {};
    for (const [key, value] of Object.entries(obj)) {
      if (typeof value === 'string') {
        sanitized[key] = sanitizeText(value);
      } else if (typeof value === 'object' && value !== null) {
        sanitized[key] = this.sanitizeObject(value);
      } else {
        sanitized[key] = value;
      }
    }
    return sanitized;
  }

  /**
   * Prepare SendGrid message format
   */
  private prepareSendGridMessage(message: EmailMessage): any {
    const sgMessage: any = {
      to: message.to,
      from: {
        email: process.env.SENDGRID_FROM_EMAIL || 'noreply@eventprosnz.com',
        name: 'EventProsNZ',
      },
      subject: message.subject,
    };

    if (message.templateId) {
      sgMessage.templateId = message.templateId;
      if (message.dynamicTemplateData) {
        sgMessage.dynamicTemplateData = message.dynamicTemplateData;
      }
    } else {
      if (message.html) sgMessage.html = message.html;
      if (message.text) sgMessage.text = message.text;
    }

    if (message.attachments) {
      sgMessage.attachments = message.attachments;
    }

    if (message.categories) {
      sgMessage.categories = message.categories;
    }

    if (message.customArgs) {
      sgMessage.customArgs = message.customArgs;
    }

    // Add tracking settings
    sgMessage.trackingSettings = {
      clickTracking: {
        enable: true,
        enableText: true,
      },
      openTracking: {
        enable: true,
      },
    };

    return sgMessage;
  }

  /**
   * Create email log entry
   */
  private async createEmailLog(message: EmailMessage): Promise<string> {
    const { data, error } = await this.supabase
      .from('email_logs')
      .insert({
        recipient: Array.isArray(message.to)
          ? message.to.join(', ')
          : message.to,
        template_id: message.templateId,
        status: 'pending',
        subject: message.subject,
      })
      .select('id')
      .single();

    if (error) {
      throw new Error(`Failed to create email log: ${error.message}`);
    }

    return data.id;
  }

  /**
   * Update email log entry
   */
  private async updateEmailLog(
    logId: string,
    status: string,
    messageId?: string,
    errorMessage?: string
  ): Promise<void> {
    const updateData: any = { status };

    if (status === 'sent') {
      updateData.sent_at = new Date().toISOString();
    }
    if (messageId) {
      updateData.message_id = messageId;
    }
    if (errorMessage) {
      updateData.error_message = errorMessage;
    }

    const { error } = await this.supabase
      .from('email_logs')
      .update(updateData)
      .eq('id', logId);

    if (error) {
      console.error('Failed to update email log:', error);
    }
  }

  /**
   * Map SendGrid webhook events to internal status
   */
  private mapWebhookEventToStatus(eventType: string): string | null {
    const statusMap: Record<string, string> = {
      processed: 'sent',
      delivered: 'delivered',
      bounce: 'bounced',
      complaint: 'complained',
      dropped: 'failed',
    };

    return statusMap[eventType] || null;
  }

  /**
   * Handle bounce or complaint events
   */
  private async handleBounceOrComplaint(
    email: string,
    eventType: string,
    reason?: string
  ): Promise<void> {
    try {
      // Add to suppression list
      await this.supabase.from('email_suppressions').upsert({
        email,
        type: eventType,
        reason,
        is_active: true,
        created_at: new Date().toISOString(),
      });

      // Log audit event
      await this.auditLogger.logEvent({
        action: 'email_suppression_added',
        details: {
          email,
          type: eventType,
          reason,
        },
      });
    } catch (error) {
      console.error('Error handling bounce/complaint:', error);
    }
  }

  /**
   * Calculate email metrics from logs
   */
  private calculateEmailMetrics(logs: any[]) {
    const total = logs.length;
    const sent = logs.filter(log => log.status === 'sent').length;
    const delivered = logs.filter(log => log.status === 'delivered').length;
    const bounced = logs.filter(log => log.status === 'bounced').length;
    const complained = logs.filter(log => log.status === 'complained').length;
    const failed = logs.filter(log => log.status === 'failed').length;

    return {
      total,
      sent,
      delivered,
      bounced,
      complained,
      failed,
      deliveryRate: total > 0 ? (delivered / total) * 100 : 0,
      bounceRate: total > 0 ? (bounced / total) * 100 : 0,
      complaintRate: total > 0 ? (complained / total) * 100 : 0,
    };
  }
}
