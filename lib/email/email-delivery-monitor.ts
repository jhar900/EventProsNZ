import { createClient } from '@/lib/supabase/server';

export interface DeliveryMetrics {
  totalSent: number;
  totalDelivered: number;
  totalBounced: number;
  totalComplained: number;
  totalFailed: number;
  deliveryRate: number;
  bounceRate: number;
  complaintRate: number;
  averageDeliveryTime: number;
}

export interface DeliveryAnalytics {
  metrics: DeliveryMetrics;
  trends: {
    daily: Array<{
      date: string;
      sent: number;
      delivered: number;
      bounced: number;
      complained: number;
    }>;
    hourly: Array<{
      hour: number;
      sent: number;
      delivered: number;
    }>;
  };
  topTemplates: Array<{
    templateId: string;
    templateName: string;
    sent: number;
    deliveryRate: number;
  }>;
  topRecipients: Array<{
    email: string;
    sent: number;
    delivered: number;
    bounced: number;
  }>;
}

export interface DeliveryAlert {
  id: string;
  type:
    | 'high_bounce_rate'
    | 'low_delivery_rate'
    | 'high_complaint_rate'
    | 'delivery_delay';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  threshold: number;
  currentValue: number;
  createdAt: string;
  resolvedAt?: string;
  isResolved: boolean;
}

export interface PerformanceRecommendation {
  id: string;
  type: 'content' | 'timing' | 'frequency' | 'authentication' | 'list_hygiene';
  priority: 'low' | 'medium' | 'high';
  title: string;
  description: string;
  action: string;
  expectedImpact: string;
}

export class EmailDeliveryMonitor {
  private supabase = createClient();

  /**
   * Get delivery metrics for a date range
   */
  async getDeliveryMetrics(
    startDate: string,
    endDate: string,
    templateId?: string
  ): Promise<DeliveryMetrics> {
    try {
      let query = this.supabase
        .from('email_logs')
        .select('status, sent_at, delivered_at')
        .gte('sent_at', startDate)
        .lte('sent_at', endDate);

      if (templateId) {
        query = query.eq('template_id', templateId);
      }

      const { data, error } = await query;

      if (error) {
        throw new Error(`Failed to fetch delivery metrics: ${error.message}`);
      }

      return this.calculateMetrics(data || []);
    } catch (error) {
      console.error('Error fetching delivery metrics:', error);
      throw error;
    }
  }

  /**
   * Get comprehensive delivery analytics
   */
  async getDeliveryAnalytics(
    startDate: string,
    endDate: string,
    templateId?: string
  ): Promise<DeliveryAnalytics> {
    try {
      const [metrics, dailyTrends, hourlyTrends, topTemplates, topRecipients] =
        await Promise.all([
          this.getDeliveryMetrics(startDate, endDate, templateId),
          this.getDailyTrends(startDate, endDate, templateId),
          this.getHourlyTrends(startDate, endDate, templateId),
          this.getTopTemplates(startDate, endDate),
          this.getTopRecipients(startDate, endDate, templateId),
        ]);

      return {
        metrics,
        trends: {
          daily: dailyTrends,
          hourly: hourlyTrends,
        },
        topTemplates,
        topRecipients,
      };
    } catch (error) {
      console.error('Error fetching delivery analytics:', error);
      throw error;
    }
  }

  /**
   * Get delivery alerts
   */
  async getDeliveryAlerts(
    includeResolved: boolean = false
  ): Promise<DeliveryAlert[]> {
    try {
      let query = this.supabase
        .from('delivery_alerts')
        .select('*')
        .order('created_at', { ascending: false });

      if (!includeResolved) {
        query = query.eq('is_resolved', false);
      }

      const { data, error } = await query;

      if (error) {
        throw new Error(`Failed to fetch delivery alerts: ${error.message}`);
      }

      return data || [];
    } catch (error) {
      console.error('Error fetching delivery alerts:', error);
      throw error;
    }
  }

  /**
   * Create a delivery alert
   */
  async createDeliveryAlert(
    alert: Omit<DeliveryAlert, 'id' | 'createdAt' | 'isResolved'>
  ): Promise<DeliveryAlert> {
    try {
      const { data, error } = await this.supabase
        .from('delivery_alerts')
        .insert({
          ...alert,
          created_at: new Date().toISOString(),
          is_resolved: false,
        })
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to create delivery alert: ${error.message}`);
      }

      return data;
    } catch (error) {
      console.error('Error creating delivery alert:', error);
      throw error;
    }
  }

  /**
   * Resolve a delivery alert
   */
  async resolveAlert(alertId: string): Promise<void> {
    try {
      const { error } = await this.supabase
        .from('delivery_alerts')
        .update({
          is_resolved: true,
          resolved_at: new Date().toISOString(),
        })
        .eq('id', alertId);

      if (error) {
        throw new Error(`Failed to resolve alert: ${error.message}`);
      }
    } catch (error) {
      console.error('Error resolving alert:', error);
      throw error;
    }
  }

  /**
   * Get performance recommendations
   */
  async getPerformanceRecommendations(): Promise<PerformanceRecommendation[]> {
    try {
      // Get recent metrics to generate recommendations
      const endDate = new Date().toISOString();
      const startDate = new Date(
        Date.now() - 7 * 24 * 60 * 60 * 1000
      ).toISOString();

      const metrics = await this.getDeliveryMetrics(startDate, endDate);
      const recommendations: PerformanceRecommendation[] = [];

      // Generate recommendations based on metrics
      if (metrics.bounceRate > 5) {
        recommendations.push({
          id: 'high_bounce_rate',
          type: 'list_hygiene',
          priority: 'high',
          title: 'High Bounce Rate Detected',
          description: `Your bounce rate is ${metrics.bounceRate.toFixed(1)}%, which is above the recommended 2%.`,
          action:
            'Review and clean your email list, remove invalid email addresses.',
          expectedImpact:
            'Reduce bounce rate to under 2% and improve sender reputation.',
        });
      }

      if (metrics.deliveryRate < 95) {
        recommendations.push({
          id: 'low_delivery_rate',
          type: 'content',
          priority: 'high',
          title: 'Low Delivery Rate',
          description: `Your delivery rate is ${metrics.deliveryRate.toFixed(1)}%, which is below the recommended 95%.`,
          action:
            'Review email content for spam triggers, improve authentication setup.',
          expectedImpact:
            'Increase delivery rate to 95%+ and improve inbox placement.',
        });
      }

      if (metrics.complaintRate > 0.1) {
        recommendations.push({
          id: 'high_complaint_rate',
          type: 'frequency',
          priority: 'critical',
          title: 'High Complaint Rate',
          description: `Your complaint rate is ${metrics.complaintRate.toFixed(2)}%, which is above the recommended 0.1%.`,
          action:
            'Reduce email frequency, improve content relevance, add unsubscribe options.',
          expectedImpact:
            'Reduce complaint rate to under 0.1% and maintain sender reputation.',
        });
      }

      if (metrics.averageDeliveryTime > 300) {
        recommendations.push({
          id: 'delivery_delay',
          type: 'timing',
          priority: 'medium',
          title: 'Slow Delivery Times',
          description: `Average delivery time is ${Math.round(metrics.averageDeliveryTime)} seconds.`,
          action:
            'Optimize email queue processing, consider using dedicated IP.',
          expectedImpact: 'Reduce delivery time and improve user experience.',
        });
      }

      return recommendations;
    } catch (error) {
      console.error('Error generating performance recommendations:', error);
      throw error;
    }
  }

  /**
   * Monitor delivery performance and create alerts
   */
  async monitorDeliveryPerformance(): Promise<void> {
    try {
      const endDate = new Date().toISOString();
      const startDate = new Date(
        Date.now() - 24 * 60 * 60 * 1000
      ).toISOString();

      const metrics = await this.getDeliveryMetrics(startDate, endDate);

      // Check for high bounce rate
      if (metrics.bounceRate > 5) {
        await this.createDeliveryAlert({
          type: 'high_bounce_rate',
          severity: 'high',
          message: `Bounce rate is ${metrics.bounceRate.toFixed(1)}% (threshold: 5%)`,
          threshold: 5,
          currentValue: metrics.bounceRate,
        });
      }

      // Check for low delivery rate
      if (metrics.deliveryRate < 95) {
        await this.createDeliveryAlert({
          type: 'low_delivery_rate',
          severity: 'high',
          message: `Delivery rate is ${metrics.deliveryRate.toFixed(1)}% (threshold: 95%)`,
          threshold: 95,
          currentValue: metrics.deliveryRate,
        });
      }

      // Check for high complaint rate
      if (metrics.complaintRate > 0.1) {
        await this.createDeliveryAlert({
          type: 'high_complaint_rate',
          severity: 'critical',
          message: `Complaint rate is ${metrics.complaintRate.toFixed(2)}% (threshold: 0.1%)`,
          threshold: 0.1,
          currentValue: metrics.complaintRate,
        });
      }

      // Check for delivery delays
      if (metrics.averageDeliveryTime > 300) {
        await this.createDeliveryAlert({
          type: 'delivery_delay',
          severity: 'medium',
          message: `Average delivery time is ${Math.round(metrics.averageDeliveryTime)} seconds (threshold: 300s)`,
          threshold: 300,
          currentValue: metrics.averageDeliveryTime,
        });
      }
    } catch (error) {
      console.error('Error monitoring delivery performance:', error);
    }
  }

  /**
   * Calculate metrics from email logs
   */
  private calculateMetrics(logs: any[]): DeliveryMetrics {
    const totalSent = logs.length;
    const totalDelivered = logs.filter(
      log => log.status === 'delivered'
    ).length;
    const totalBounced = logs.filter(log => log.status === 'bounced').length;
    const totalComplained = logs.filter(
      log => log.status === 'complained'
    ).length;
    const totalFailed = logs.filter(log => log.status === 'failed').length;

    const deliveryRate = totalSent > 0 ? (totalDelivered / totalSent) * 100 : 0;
    const bounceRate = totalSent > 0 ? (totalBounced / totalSent) * 100 : 0;
    const complaintRate =
      totalSent > 0 ? (totalComplained / totalSent) * 100 : 0;

    // Calculate average delivery time
    const deliveredLogs = logs.filter(
      log => log.status === 'delivered' && log.sent_at && log.delivered_at
    );
    const averageDeliveryTime =
      deliveredLogs.length > 0
        ? deliveredLogs.reduce((sum, log) => {
            const sentTime = new Date(log.sent_at).getTime();
            const deliveredTime = new Date(log.delivered_at).getTime();
            return sum + (deliveredTime - sentTime) / 1000; // Convert to seconds
          }, 0) / deliveredLogs.length
        : 0;

    return {
      totalSent,
      totalDelivered,
      totalBounced,
      totalComplained,
      totalFailed,
      deliveryRate,
      bounceRate,
      complaintRate,
      averageDeliveryTime,
    };
  }

  /**
   * Get daily trends
   */
  private async getDailyTrends(
    startDate: string,
    endDate: string,
    templateId?: string
  ) {
    try {
      let query = this.supabase
        .from('email_logs')
        .select('status, sent_at')
        .gte('sent_at', startDate)
        .lte('sent_at', endDate);

      if (templateId) {
        query = query.eq('template_id', templateId);
      }

      const { data, error } = await query;

      if (error) {
        throw new Error(`Failed to fetch daily trends: ${error.message}`);
      }

      // Group by date and calculate metrics
      const dailyData: Record<string, any> = {};

      (data || []).forEach(log => {
        const date = new Date(log.sent_at).toISOString().split('T')[0];
        if (!dailyData[date]) {
          dailyData[date] = {
            sent: 0,
            delivered: 0,
            bounced: 0,
            complained: 0,
          };
        }

        dailyData[date].sent++;
        if (log.status === 'delivered') dailyData[date].delivered++;
        if (log.status === 'bounced') dailyData[date].bounced++;
        if (log.status === 'complained') dailyData[date].complained++;
      });

      return Object.entries(dailyData).map(([date, metrics]) => ({
        date,
        ...metrics,
      }));
    } catch (error) {
      console.error('Error fetching daily trends:', error);
      return [];
    }
  }

  /**
   * Get hourly trends
   */
  private async getHourlyTrends(
    startDate: string,
    endDate: string,
    templateId?: string
  ) {
    try {
      let query = this.supabase
        .from('email_logs')
        .select('status, sent_at')
        .gte('sent_at', startDate)
        .lte('sent_at', endDate);

      if (templateId) {
        query = query.eq('template_id', templateId);
      }

      const { data, error } = await query;

      if (error) {
        throw new Error(`Failed to fetch hourly trends: ${error.message}`);
      }

      // Group by hour and calculate metrics
      const hourlyData: Record<number, any> = {};

      (data || []).forEach(log => {
        const hour = new Date(log.sent_at).getHours();
        if (!hourlyData[hour]) {
          hourlyData[hour] = { sent: 0, delivered: 0 };
        }

        hourlyData[hour].sent++;
        if (log.status === 'delivered') hourlyData[hour].delivered++;
      });

      return Object.entries(hourlyData).map(([hour, metrics]) => ({
        hour: parseInt(hour),
        ...metrics,
      }));
    } catch (error) {
      console.error('Error fetching hourly trends:', error);
      return [];
    }
  }

  /**
   * Get top templates by performance
   */
  private async getTopTemplates(startDate: string, endDate: string) {
    try {
      const { data, error } = await this.supabase
        .from('email_logs')
        .select('template_id, status')
        .gte('sent_at', startDate)
        .lte('sent_at', endDate)
        .not('template_id', 'is', null);

      if (error) {
        throw new Error(`Failed to fetch top templates: ${error.message}`);
      }

      // Group by template and calculate metrics
      const templateData: Record<string, any> = {};

      (data || []).forEach(log => {
        const templateId = log.template_id;
        if (!templateData[templateId]) {
          templateData[templateId] = { sent: 0, delivered: 0 };
        }

        templateData[templateId].sent++;
        if (log.status === 'delivered') templateData[templateId].delivered++;
      });

      return Object.entries(templateData).map(([templateId, metrics]) => ({
        templateId,
        templateName: `Template ${templateId}`, // Would need to join with templates table
        sent: metrics.sent,
        deliveryRate:
          metrics.sent > 0 ? (metrics.delivered / metrics.sent) * 100 : 0,
      }));
    } catch (error) {
      console.error('Error fetching top templates:', error);
      return [];
    }
  }

  /**
   * Get top recipients by activity
   */
  private async getTopRecipients(
    startDate: string,
    endDate: string,
    templateId?: string
  ) {
    try {
      let query = this.supabase
        .from('email_logs')
        .select('recipient, status')
        .gte('sent_at', startDate)
        .lte('sent_at', endDate);

      if (templateId) {
        query = query.eq('template_id', templateId);
      }

      const { data, error } = await query;

      if (error) {
        throw new Error(`Failed to fetch top recipients: ${error.message}`);
      }

      // Group by recipient and calculate metrics
      const recipientData: Record<string, any> = {};

      (data || []).forEach(log => {
        const recipient = log.recipient;
        if (!recipientData[recipient]) {
          recipientData[recipient] = { sent: 0, delivered: 0, bounced: 0 };
        }

        recipientData[recipient].sent++;
        if (log.status === 'delivered') recipientData[recipient].delivered++;
        if (log.status === 'bounced') recipientData[recipient].bounced++;
      });

      return Object.entries(recipientData).map(([email, metrics]) => ({
        email,
        ...metrics,
      }));
    } catch (error) {
      console.error('Error fetching top recipients:', error);
      return [];
    }
  }
}
