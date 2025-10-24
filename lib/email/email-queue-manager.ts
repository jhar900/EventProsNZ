import { createClient } from '@/lib/supabase/server';
import { SendGridService } from './sendgrid-service';
import { AuditLogger } from '@/lib/security/audit-logger';

export interface QueueItem {
  id: string;
  recipient: string;
  template_id?: string;
  subject: string;
  html_content?: string;
  text_content?: string;
  dynamic_template_data?: Record<string, any>;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  status: 'pending' | 'processing' | 'sent' | 'failed' | 'cancelled';
  scheduled_at?: string;
  created_at: string;
  processed_at?: string;
  retry_count: number;
  max_retries: number;
  error_message?: string;
}

export interface QueueStats {
  total: number;
  pending: number;
  processing: number;
  sent: number;
  failed: number;
  cancelled: number;
  averageProcessingTime: number;
}

export interface QueueMetrics {
  throughput: number; // emails per hour
  successRate: number;
  averageQueueTime: number;
  peakQueueSize: number;
}

export class EmailQueueManager {
  private supabase = createClient();
  private sendGridService = new SendGridService();
  private auditLogger = new AuditLogger();
  private isProcessing = false;

  /**
   * Add email to queue
   */
  async addToQueue(
    item: Omit<QueueItem, 'id' | 'created_at' | 'retry_count' | 'status'>
  ): Promise<string> {
    try {
      const { data, error } = await this.supabase
        .from('email_queue')
        .insert({
          ...item,
          status: 'pending',
          retry_count: 0,
          created_at: new Date().toISOString(),
        })
        .select('id')
        .single();

      if (error) {
        throw new Error(`Failed to add to queue: ${error.message}`);
      }

      // Log audit event
      await this.auditLogger.logEvent({
        action: 'email_queued',
        details: {
          queueId: data.id,
          recipient: item.recipient,
          priority: item.priority,
        },
      });

      // Trigger processing if not already running
      this.triggerProcessing();

      return data.id;
    } catch (error) {
      console.error('Error adding to queue:', error);
      throw error;
    }
  }

  /**
   * Process email queue
   */
  async processQueue(): Promise<void> {
    if (this.isProcessing) {
      return; // Already processing
    }

    this.isProcessing = true;

    try {
      // Get pending emails ordered by priority and creation time
      const { data: queueItems, error } = await this.supabase
        .from('email_queue')
        .select('*')
        .eq('status', 'pending')
        .lte('scheduled_at', new Date().toISOString())
        .order('priority', { ascending: false })
        .order('created_at', { ascending: true })
        .limit(50); // Process in batches

      if (error) {
        throw new Error(`Failed to fetch queue items: ${error.message}`);
      }

      if (!queueItems || queueItems.length === 0) {
        return;
      }

      // Process each item
      for (const item of queueItems) {
        try {
          await this.processQueueItem(item);
        } catch (error) {
          console.error(`Error processing queue item ${item.id}:`, error);
          await this.handleProcessingError(item, error);
        }
      }
    } catch (error) {
      console.error('Error processing queue:', error);
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Process individual queue item
   */
  private async processQueueItem(item: QueueItem): Promise<void> {
    try {
      // Update status to processing
      await this.updateQueueItemStatus(item.id, 'processing');

      // Prepare email message
      const emailMessage = {
        to: item.recipient,
        subject: item.subject,
        html: item.html_content,
        text: item.text_content,
        templateId: item.template_id,
        dynamicTemplateData: item.dynamic_template_data,
        categories: ['queued-email'],
        customArgs: {
          queueId: item.id,
        },
      };

      // Send email
      const result = await this.sendGridService.sendEmail(emailMessage);

      if (result.success) {
        // Update status to sent
        await this.updateQueueItemStatus(
          item.id,
          'sent',
          undefined,
          result.messageId
        );

        // Log audit event
        await this.auditLogger.logEvent({
          action: 'email_sent_from_queue',
          details: {
            queueId: item.id,
            recipient: item.recipient,
            messageId: result.messageId,
          },
        });
      } else {
        throw new Error(result.error || 'Unknown error');
      }
    } catch (error) {
      await this.handleProcessingError(item, error);
    }
  }

  /**
   * Handle processing error
   */
  private async handleProcessingError(
    item: QueueItem,
    error: any
  ): Promise<void> {
    const newRetryCount = item.retry_count + 1;
    const shouldRetry = newRetryCount < item.max_retries;

    if (shouldRetry) {
      // Retry with exponential backoff
      const retryDelay = Math.pow(2, newRetryCount) * 60 * 1000; // 2^n minutes
      const retryTime = new Date(Date.now() + retryDelay).toISOString();

      await this.supabase
        .from('email_queue')
        .update({
          status: 'pending',
          retry_count: newRetryCount,
          scheduled_at: retryTime,
          error_message: error.message,
        })
        .eq('id', item.id);
    } else {
      // Mark as failed
      await this.updateQueueItemStatus(
        item.id,
        'failed',
        undefined,
        error.message
      );
    }
  }

  /**
   * Update queue item status
   */
  private async updateQueueItemStatus(
    id: string,
    status: string,
    messageId?: string,
    errorMessage?: string
  ): Promise<void> {
    try {
      const updateData: any = { status };

      if (status === 'sent') {
        updateData.processed_at = new Date().toISOString();
      }
      if (messageId) {
        updateData.message_id = messageId;
      }
      if (errorMessage) {
        updateData.error_message = errorMessage;
      }

      const { error } = await this.supabase
        .from('email_queue')
        .update(updateData)
        .eq('id', id);

      if (error) {
        console.error('Failed to update queue item status:', error);
      }
    } catch (error) {
      console.error('Error updating queue item status:', error);
    }
  }

  /**
   * Get queue statistics
   */
  async getQueueStats(): Promise<QueueStats> {
    try {
      const { data, error } = await this.supabase
        .from('email_queue')
        .select('status, created_at, processed_at');

      if (error) {
        throw new Error(`Failed to fetch queue stats: ${error.message}`);
      }

      const stats: QueueStats = {
        total: data.length,
        pending: data.filter(item => item.status === 'pending').length,
        processing: data.filter(item => item.status === 'processing').length,
        sent: data.filter(item => item.status === 'sent').length,
        failed: data.filter(item => item.status === 'failed').length,
        cancelled: data.filter(item => item.status === 'cancelled').length,
        averageProcessingTime: 0,
      };

      // Calculate average processing time
      const processedItems = data.filter(
        item => item.status === 'sent' && item.created_at && item.processed_at
      );

      if (processedItems.length > 0) {
        const totalTime = processedItems.reduce((sum, item) => {
          const created = new Date(item.created_at).getTime();
          const processed = new Date(item.processed_at).getTime();
          return sum + (processed - created);
        }, 0);

        stats.averageProcessingTime = totalTime / processedItems.length / 1000; // Convert to seconds
      }

      return stats;
    } catch (error) {
      console.error('Error fetching queue stats:', error);
      throw error;
    }
  }

  /**
   * Get queue metrics
   */
  async getQueueMetrics(
    timeframe: 'hour' | 'day' | 'week' = 'day'
  ): Promise<QueueMetrics> {
    try {
      const endDate = new Date();
      const startDate = new Date();

      switch (timeframe) {
        case 'hour':
          startDate.setHours(endDate.getHours() - 1);
          break;
        case 'day':
          startDate.setDate(endDate.getDate() - 1);
          break;
        case 'week':
          startDate.setDate(endDate.getDate() - 7);
          break;
      }

      const { data, error } = await this.supabase
        .from('email_queue')
        .select('status, created_at, processed_at')
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString());

      if (error) {
        throw new Error(`Failed to fetch queue metrics: ${error.message}`);
      }

      const sent = data.filter(item => item.status === 'sent').length;
      const failed = data.filter(item => item.status === 'failed').length;
      const total = sent + failed;

      const timeframeHours =
        timeframe === 'hour' ? 1 : timeframe === 'day' ? 24 : 168;
      const throughput = sent / timeframeHours;
      const successRate = total > 0 ? (sent / total) * 100 : 0;

      // Calculate average queue time
      const processedItems = data.filter(
        item => item.status === 'sent' && item.created_at && item.processed_at
      );

      let averageQueueTime = 0;
      if (processedItems.length > 0) {
        const totalTime = processedItems.reduce((sum, item) => {
          const created = new Date(item.created_at).getTime();
          const processed = new Date(item.processed_at).getTime();
          return sum + (processed - created);
        }, 0);

        averageQueueTime = totalTime / processedItems.length / 1000; // Convert to seconds
      }

      // Get peak queue size (this would need a more sophisticated query in practice)
      const peakQueueSize = data.length;

      return {
        throughput,
        successRate,
        averageQueueTime,
        peakQueueSize,
      };
    } catch (error) {
      console.error('Error fetching queue metrics:', error);
      throw error;
    }
  }

  /**
   * Cancel queue item
   */
  async cancelQueueItem(id: string): Promise<void> {
    try {
      const { error } = await this.supabase
        .from('email_queue')
        .update({ status: 'cancelled' })
        .eq('id', id)
        .in('status', ['pending', 'processing']);

      if (error) {
        throw new Error(`Failed to cancel queue item: ${error.message}`);
      }

      // Log audit event
      await this.auditLogger.logEvent({
        action: 'email_queue_cancelled',
        details: { queueId: id },
      });
    } catch (error) {
      console.error('Error cancelling queue item:', error);
      throw error;
    }
  }

  /**
   * Retry failed queue items
   */
  async retryFailedItems(): Promise<void> {
    try {
      const { error } = await this.supabase
        .from('email_queue')
        .update({
          status: 'pending',
          retry_count: 0,
          error_message: null,
          scheduled_at: new Date().toISOString(),
        })
        .eq('status', 'failed');

      if (error) {
        throw new Error(`Failed to retry failed items: ${error.message}`);
      }

      // Log audit event
      await this.auditLogger.logEvent({
        action: 'email_queue_retry_initiated',
        details: {},
      });

      // Trigger processing
      this.triggerProcessing();
    } catch (error) {
      console.error('Error retrying failed items:', error);
      throw error;
    }
  }

  /**
   * Clear old queue items
   */
  async clearOldItems(daysOld: number = 30): Promise<void> {
    try {
      const cutoffDate = new Date(
        Date.now() - daysOld * 24 * 60 * 60 * 1000
      ).toISOString();

      const { error } = await this.supabase
        .from('email_queue')
        .delete()
        .lt('created_at', cutoffDate)
        .in('status', ['sent', 'failed', 'cancelled']);

      if (error) {
        throw new Error(`Failed to clear old items: ${error.message}`);
      }

      // Log audit event
      await this.auditLogger.logEvent({
        action: 'email_queue_cleared',
        details: { cutoffDate, daysOld },
      });
    } catch (error) {
      console.error('Error clearing old items:', error);
      throw error;
    }
  }

  /**
   * Trigger queue processing
   */
  private triggerProcessing(): void {
    // Use setTimeout to avoid blocking
    setTimeout(() => {
      this.processQueue().catch(error => {
        console.error('Queue processing error:', error);
      });
    }, 0);
  }

  /**
   * Start continuous queue processing
   */
  startContinuousProcessing(intervalMs: number = 30000): void {
    setInterval(() => {
      this.processQueue().catch(error => {
        console.error('Continuous queue processing error:', error);
      });
    }, intervalMs);
  }

  /**
   * Stop continuous queue processing
   */
  stopContinuousProcessing(): void {
    // This would need to be implemented with a proper interval management system
    console.log('Continuous processing stop requested');
  }
}
