import { createClient } from '@/lib/supabase/server';

export interface AuditLogEntry {
  userId: string;
  action: string;
  resource: string;
  resourceId?: string;
  details?: any;
  ipAddress?: string;
  userAgent?: string;
  timestamp: Date;
}

export class AuditLogger {
  private supabase = createClient();

  async logTrialEvent(entry: AuditLogEntry): Promise<void> {
    try {
      const { error } = await this.supabase.from('audit_logs').insert({
        user_id: entry.userId,
        action: entry.action,
        resource: entry.resource,
        resource_id: entry.resourceId,
        details: entry.details,
        ip_address: entry.ipAddress,
        user_agent: entry.userAgent,
        timestamp: entry.timestamp.toISOString(),
        category: 'trial_conversion',
      });

      if (error) {
        console.error('Failed to log audit event:', error);
        // Don't throw error to avoid breaking the main flow
      }
    } catch (error) {
      console.error('Failed to log audit event:', error);
    }
  }

  async logTrialConversion(
    userId: string,
    conversionData: any,
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    await this.logTrialEvent({
      userId,
      action: 'trial_conversion',
      resource: 'trial_conversion',
      resourceId: conversionData.id,
      details: {
        conversion_status: conversionData.conversion_status,
        conversion_tier: conversionData.conversion_tier,
        conversion_reason: conversionData.conversion_reason,
      },
      ipAddress,
      userAgent,
      timestamp: new Date(),
    });
  }

  async logTrialEmailSent(
    userId: string,
    emailType: string,
    emailId: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    await this.logTrialEvent({
      userId,
      action: 'trial_email_sent',
      resource: 'trial_email',
      resourceId: emailId,
      details: {
        email_type: emailType,
        email_status: 'sent',
      },
      ipAddress,
      userAgent,
      timestamp: new Date(),
    });
  }

  async logTrialAnalyticsTracked(
    userId: string,
    analyticsData: any,
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    await this.logTrialEvent({
      userId,
      action: 'trial_analytics_tracked',
      resource: 'trial_analytics',
      resourceId: analyticsData.id,
      details: {
        trial_day: analyticsData.trial_day,
        conversion_likelihood: analyticsData.conversion_likelihood,
        feature_usage: analyticsData.feature_usage,
        platform_engagement: analyticsData.platform_engagement,
      },
      ipAddress,
      userAgent,
      timestamp: new Date(),
    });
  }

  async logTrialDowngrade(
    userId: string,
    downgradeData: any,
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    await this.logTrialEvent({
      userId,
      action: 'trial_downgrade',
      resource: 'trial_conversion',
      resourceId: downgradeData.id,
      details: {
        downgrade_reason: downgradeData.downgrade_reason,
        previous_tier: downgradeData.previous_tier,
        new_tier: downgradeData.new_tier,
      },
      ipAddress,
      userAgent,
      timestamp: new Date(),
    });
  }

  async logTrialBillingSetup(
    userId: string,
    billingData: any,
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    await this.logTrialEvent({
      userId,
      action: 'trial_billing_setup',
      resource: 'trial_billing',
      resourceId: billingData.id,
      details: {
        payment_method_type: billingData.payment_method_type,
        billing_tier: billingData.billing_tier,
        setup_status: billingData.setup_status,
      },
      ipAddress,
      userAgent,
      timestamp: new Date(),
    });
  }

  async getTrialAuditLogs(userId: string, limit: number = 100): Promise<any[]> {
    try {
      const { data: logs, error } = await this.supabase
        .from('audit_logs')
        .select('*')
        .eq('user_id', userId)
        .eq('category', 'trial_conversion')
        .order('timestamp', { ascending: false })
        .limit(limit);

      if (error) {
        throw new Error(`Failed to fetch audit logs: ${error.message}`);
      }

      return logs || [];
    } catch (error) {
      console.error('Failed to get trial audit logs:', error);
      throw error;
    }
  }
}
