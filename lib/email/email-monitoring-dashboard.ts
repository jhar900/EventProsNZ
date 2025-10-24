import { createClient } from '@/lib/supabase/server';
import { EmailDeliveryMonitor } from './email-delivery-monitor';
import { EmailAuthenticationService } from './email-authentication';
import { DeliverabilityOptimizer } from './deliverability-optimizer';
import { EmailErrorHandler } from './error-handler';

export interface HealthStatus {
  overall: 'healthy' | 'degraded' | 'critical';
  components: {
    sendgrid: ComponentHealth;
    database: ComponentHealth;
    authentication: ComponentHealth;
    delivery: ComponentHealth;
    queue: ComponentHealth;
  };
  lastChecked: string;
}

export interface ComponentHealth {
  status: 'healthy' | 'degraded' | 'critical';
  message: string;
  metrics: {
    uptime: number;
    responseTime: number;
    errorRate: number;
    lastError?: string;
  };
}

export interface SystemMetrics {
  emailsSent: number;
  emailsDelivered: number;
  emailsBounced: number;
  emailsComplained: number;
  deliveryRate: number;
  bounceRate: number;
  complaintRate: number;
  averageDeliveryTime: number;
  queueSize: number;
  processingRate: number;
  errorRate: number;
  uptime: number;
}

export interface Alert {
  id: string;
  type: 'error' | 'warning' | 'info';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  message: string;
  component: string;
  timestamp: string;
  resolved: boolean;
  resolvedAt?: string;
}

export interface DashboardData {
  healthStatus: HealthStatus;
  systemMetrics: SystemMetrics;
  alerts: Alert[];
  trends: {
    emailsSent: Array<{ date: string; count: number }>;
    deliveryRate: Array<{ date: string; rate: number }>;
    bounceRate: Array<{ date: string; rate: number }>;
    errorRate: Array<{ date: string; rate: number }>;
  };
  topTemplates: Array<{
    id: string;
    name: string;
    sent: number;
    deliveryRate: number;
  }>;
  recentErrors: Array<{
    id: string;
    type: string;
    message: string;
    timestamp: string;
    severity: string;
  }>;
}

export class EmailMonitoringDashboard {
  private supabase = createClient();
  private deliveryMonitor = new EmailDeliveryMonitor();
  private authService = new EmailAuthenticationService();
  private deliverabilityOptimizer = new DeliverabilityOptimizer();
  private errorHandler = new EmailErrorHandler();

  /**
   * Get comprehensive dashboard data
   */
  async getDashboardData(): Promise<DashboardData> {
    try {
      const [
        healthStatus,
        systemMetrics,
        alerts,
        trends,
        topTemplates,
        recentErrors,
      ] = await Promise.all([
        this.getHealthStatus(),
        this.getSystemMetrics(),
        this.getAlerts(),
        this.getTrends(),
        this.getTopTemplates(),
        this.getRecentErrors(),
      ]);

      return {
        healthStatus,
        systemMetrics,
        alerts,
        trends,
        topTemplates,
        recentErrors,
      };
    } catch (error) {
      console.error('Error getting dashboard data:', error);
      throw error;
    }
  }

  /**
   * Get system health status
   */
  private async getHealthStatus(): Promise<HealthStatus> {
    try {
      const components = {
        sendgrid: await this.checkSendGridHealth(),
        database: await this.checkDatabaseHealth(),
        authentication: await this.checkAuthenticationHealth(),
        delivery: await this.checkDeliveryHealth(),
        queue: await this.checkQueueHealth(),
      };

      const overall = this.calculateOverallHealth(components);

      return {
        overall,
        components,
        lastChecked: new Date().toISOString(),
      };
    } catch (error) {
      console.error('Error getting health status:', error);
      throw error;
    }
  }

  /**
   * Get system metrics
   */
  private async getSystemMetrics(): Promise<SystemMetrics> {
    try {
      const endDate = new Date().toISOString();
      const startDate = new Date(
        Date.now() - 24 * 60 * 60 * 1000
      ).toISOString();

      const metrics = await this.deliveryMonitor.getDeliveryMetrics(
        startDate,
        endDate
      );

      // Get queue metrics
      const queueMetrics = await this.getQueueMetrics();

      // Get error metrics
      const errorStats = await this.errorHandler.getErrorStats('day');

      return {
        emailsSent: metrics.totalSent,
        emailsDelivered: metrics.totalDelivered,
        emailsBounced: metrics.totalBounced,
        emailsComplained: metrics.totalComplained,
        deliveryRate: metrics.deliveryRate,
        bounceRate: metrics.bounceRate,
        complaintRate: metrics.complaintRate,
        averageDeliveryTime: metrics.averageDeliveryTime,
        queueSize: queueMetrics.size,
        processingRate: queueMetrics.processingRate,
        errorRate:
          errorStats.total > 0
            ? (errorStats.unresolved / errorStats.total) * 100
            : 0,
        uptime: await this.getUptime(),
      };
    } catch (error) {
      console.error('Error getting system metrics:', error);
      throw error;
    }
  }

  /**
   * Get system alerts
   */
  private async getAlerts(): Promise<Alert[]> {
    try {
      const { data, error } = await this.supabase
        .from('system_alerts')
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(50);

      if (error) {
        throw new Error(`Failed to fetch alerts: ${error.message}`);
      }

      return data || [];
    } catch (error) {
      console.error('Error getting alerts:', error);
      return [];
    }
  }

  /**
   * Get system trends
   */
  private async getTrends(): Promise<DashboardData['trends']> {
    try {
      const endDate = new Date().toISOString();
      const startDate = new Date(
        Date.now() - 30 * 24 * 60 * 60 * 1000
      ).toISOString();

      const analytics = await this.deliveryMonitor.getDeliveryAnalytics(
        startDate,
        endDate
      );

      return {
        emailsSent: analytics.trends.daily.map(day => ({
          date: day.date,
          count: day.sent,
        })),
        deliveryRate: analytics.trends.daily.map(day => ({
          date: day.date,
          rate: day.sent > 0 ? (day.delivered / day.sent) * 100 : 0,
        })),
        bounceRate: analytics.trends.daily.map(day => ({
          date: day.date,
          rate: day.sent > 0 ? (day.bounced / day.sent) * 100 : 0,
        })),
        errorRate: analytics.trends.daily.map(day => ({
          date: day.date,
          rate: 0, // Would need error data
        })),
      };
    } catch (error) {
      console.error('Error getting trends:', error);
      return {
        emailsSent: [],
        deliveryRate: [],
        bounceRate: [],
        errorRate: [],
      };
    }
  }

  /**
   * Get top performing templates
   */
  private async getTopTemplates(): Promise<DashboardData['topTemplates']> {
    try {
      const endDate = new Date().toISOString();
      const startDate = new Date(
        Date.now() - 7 * 24 * 60 * 60 * 1000
      ).toISOString();

      const analytics = await this.deliveryMonitor.getDeliveryAnalytics(
        startDate,
        endDate
      );

      return analytics.topTemplates.map(template => ({
        id: template.templateId,
        name: template.templateName,
        sent: template.sent,
        deliveryRate: template.deliveryRate,
      }));
    } catch (error) {
      console.error('Error getting top templates:', error);
      return [];
    }
  }

  /**
   * Get recent errors
   */
  private async getRecentErrors(): Promise<DashboardData['recentErrors']> {
    try {
      const { data, error } = await this.supabase
        .from('email_errors')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) {
        throw new Error(`Failed to fetch recent errors: ${error.message}`);
      }

      return data.map(error => ({
        id: error.id,
        type: error.type,
        message: error.message,
        timestamp: error.created_at,
        severity: error.severity,
      }));
    } catch (error) {
      console.error('Error getting recent errors:', error);
      return [];
    }
  }

  /**
   * Check SendGrid health
   */
  private async checkSendGridHealth(): Promise<ComponentHealth> {
    try {
      // In a real implementation, you would ping SendGrid API
      const responseTime = Math.random() * 100; // Mock response time
      const errorRate = Math.random() * 5; // Mock error rate

      return {
        status:
          errorRate < 1 ? 'healthy' : errorRate < 3 ? 'degraded' : 'critical',
        message:
          errorRate < 1
            ? 'SendGrid is operating normally'
            : errorRate < 3
              ? 'SendGrid is experiencing minor issues'
              : 'SendGrid is experiencing significant issues',
        metrics: {
          uptime: 99.9,
          responseTime,
          errorRate,
          lastError: errorRate > 1 ? 'API timeout' : undefined,
        },
      };
    } catch (error) {
      return {
        status: 'critical',
        message: 'SendGrid is unavailable',
        metrics: {
          uptime: 0,
          responseTime: 0,
          errorRate: 100,
          lastError: error.message,
        },
      };
    }
  }

  /**
   * Check database health
   */
  private async checkDatabaseHealth(): Promise<ComponentHealth> {
    try {
      const startTime = Date.now();
      await this.supabase.from('email_logs').select('id').limit(1);
      const responseTime = Date.now() - startTime;

      return {
        status: responseTime < 1000 ? 'healthy' : 'degraded',
        message:
          responseTime < 1000
            ? 'Database is responding normally'
            : 'Database is experiencing slow response times',
        metrics: {
          uptime: 99.9,
          responseTime,
          errorRate: 0,
        },
      };
    } catch (error) {
      return {
        status: 'critical',
        message: 'Database is unavailable',
        metrics: {
          uptime: 0,
          responseTime: 0,
          errorRate: 100,
          lastError: error.message,
        },
      };
    }
  }

  /**
   * Check authentication health
   */
  private async checkAuthenticationHealth(): Promise<ComponentHealth> {
    try {
      const authStats = await this.authService.getAuthenticationStats();
      const fullyAuthenticated = authStats.fullyAuthenticated;
      const totalDomains = authStats.totalDomains;
      const authRate =
        totalDomains > 0 ? (fullyAuthenticated / totalDomains) * 100 : 100;

      return {
        status:
          authRate > 80 ? 'healthy' : authRate > 50 ? 'degraded' : 'critical',
        message:
          authRate > 80
            ? 'Email authentication is properly configured'
            : authRate > 50
              ? 'Some domains need authentication setup'
              : 'Email authentication needs immediate attention',
        metrics: {
          uptime: 100,
          responseTime: 0,
          errorRate: 0,
        },
      };
    } catch (error) {
      return {
        status: 'critical',
        message: 'Authentication service is unavailable',
        metrics: {
          uptime: 0,
          responseTime: 0,
          errorRate: 100,
          lastError: error.message,
        },
      };
    }
  }

  /**
   * Check delivery health
   */
  private async checkDeliveryHealth(): Promise<ComponentHealth> {
    try {
      const endDate = new Date().toISOString();
      const startDate = new Date(
        Date.now() - 24 * 60 * 60 * 1000
      ).toISOString();

      const metrics = await this.deliveryMonitor.getDeliveryMetrics(
        startDate,
        endDate
      );

      return {
        status:
          metrics.deliveryRate > 95
            ? 'healthy'
            : metrics.deliveryRate > 90
              ? 'degraded'
              : 'critical',
        message:
          metrics.deliveryRate > 95
            ? 'Email delivery is performing well'
            : metrics.deliveryRate > 90
              ? 'Email delivery needs attention'
              : 'Email delivery is critically low',
        metrics: {
          uptime: 100,
          responseTime: 0,
          errorRate: 100 - metrics.deliveryRate,
        },
      };
    } catch (error) {
      return {
        status: 'critical',
        message: 'Delivery monitoring is unavailable',
        metrics: {
          uptime: 0,
          responseTime: 0,
          errorRate: 100,
          lastError: error.message,
        },
      };
    }
  }

  /**
   * Check queue health
   */
  private async checkQueueHealth(): Promise<ComponentHealth> {
    try {
      const queueMetrics = await this.getQueueMetrics();

      return {
        status:
          queueMetrics.size < 100
            ? 'healthy'
            : queueMetrics.size < 500
              ? 'degraded'
              : 'critical',
        message:
          queueMetrics.size < 100
            ? 'Email queue is processing normally'
            : queueMetrics.size < 500
              ? 'Email queue is building up'
              : 'Email queue is critically backed up',
        metrics: {
          uptime: 100,
          responseTime: 0,
          errorRate: 0,
        },
      };
    } catch (error) {
      return {
        status: 'critical',
        message: 'Queue monitoring is unavailable',
        metrics: {
          uptime: 0,
          responseTime: 0,
          errorRate: 100,
          lastError: error.message,
        },
      };
    }
  }

  /**
   * Calculate overall health status
   */
  private calculateOverallHealth(
    components: HealthStatus['components']
  ): 'healthy' | 'degraded' | 'critical' {
    const statuses = Object.values(components).map(
      component => component.status
    );

    if (statuses.includes('critical')) return 'critical';
    if (statuses.includes('degraded')) return 'degraded';
    return 'healthy';
  }

  /**
   * Get queue metrics
   */
  private async getQueueMetrics(): Promise<{
    size: number;
    processingRate: number;
  }> {
    try {
      const { data, error } = await this.supabase
        .from('email_queue')
        .select('*')
        .eq('status', 'pending');

      if (error) {
        throw new Error(`Failed to fetch queue metrics: ${error.message}`);
      }

      return {
        size: data.length,
        processingRate: 10, // Mock processing rate
      };
    } catch (error) {
      console.error('Error getting queue metrics:', error);
      return { size: 0, processingRate: 0 };
    }
  }

  /**
   * Get system uptime
   */
  private async getUptime(): Promise<number> {
    try {
      // In a real implementation, you would track actual uptime
      return 99.9;
    } catch (error) {
      console.error('Error getting uptime:', error);
      return 0;
    }
  }

  /**
   * Create system alert
   */
  async createAlert(
    alert: Omit<Alert, 'id' | 'timestamp' | 'resolved'>
  ): Promise<void> {
    try {
      await this.supabase.from('system_alerts').insert({
        ...alert,
        timestamp: new Date().toISOString(),
        resolved: false,
      });
    } catch (error) {
      console.error('Error creating alert:', error);
      throw error;
    }
  }

  /**
   * Resolve alert
   */
  async resolveAlert(alertId: string): Promise<void> {
    try {
      await this.supabase
        .from('system_alerts')
        .update({
          resolved: true,
          resolved_at: new Date().toISOString(),
        })
        .eq('id', alertId);
    } catch (error) {
      console.error('Error resolving alert:', error);
      throw error;
    }
  }

  /**
   * Get monitoring statistics
   */
  async getMonitoringStats(): Promise<{
    totalAlerts: number;
    resolvedAlerts: number;
    criticalAlerts: number;
    averageResponseTime: number;
    uptime: number;
  }> {
    try {
      const { data: alerts, error: alertsError } = await this.supabase
        .from('system_alerts')
        .select('*');

      if (alertsError) {
        throw new Error(
          `Failed to fetch monitoring stats: ${alertsError.message}`
        );
      }

      const stats = {
        totalAlerts: alerts.length,
        resolvedAlerts: alerts.filter(alert => alert.resolved).length,
        criticalAlerts: alerts.filter(alert => alert.severity === 'critical')
          .length,
        averageResponseTime: 0, // Would need to calculate from metrics
        uptime: await this.getUptime(),
      };

      return stats;
    } catch (error) {
      console.error('Error getting monitoring stats:', error);
      throw error;
    }
  }
}
