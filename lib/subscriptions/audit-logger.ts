/**
 * Audit Logger
 * Comprehensive audit logging for subscription operations
 */

import { createClient } from '@/lib/supabase/server';

export interface AuditLogEntry {
  subscription_id: string;
  event_type: string;
  event_data: any;
  user_id: string;
  ip_address?: string;
  user_agent?: string;
  created_at: string;
}

export class AuditLogger {
  private supabase;

  constructor() {
    this.supabase = createClient();
  }

  /**
   * Log subscription event
   */
  async logSubscriptionEvent(
    subscriptionId: string,
    eventType: string,
    eventData: any,
    userId: string,
    metadata?: {
      ipAddress?: string;
      userAgent?: string;
    }
  ): Promise<void> {
    try {
      const logEntry: AuditLogEntry = {
        subscription_id: subscriptionId,
        event_type: eventType,
        event_data: eventData,
        user_id: userId,
        ip_address: metadata?.ipAddress,
        user_agent: metadata?.userAgent,
        created_at: new Date().toISOString(),
      };

      await this.supabase.from('subscription_analytics').insert(logEntry);
    } catch (error) {
      // Don't throw error to avoid breaking the main operation
    }
  }

  /**
   * Log payment event
   */
  async logPaymentEvent(
    subscriptionId: string,
    eventType: string,
    eventData: any,
    userId: string,
    metadata?: {
      ipAddress?: string;
      userAgent?: string;
    }
  ): Promise<void> {
    try {
      const logEntry: AuditLogEntry = {
        subscription_id: subscriptionId,
        event_type: eventType,
        event_data: eventData,
        user_id: userId,
        ip_address: metadata?.ipAddress,
        user_agent: metadata?.userAgent,
        created_at: new Date().toISOString(),
      };

      await this.supabase.from('subscription_analytics').insert(logEntry);
    } catch (error) {
      }
  }

  /**
   * Log security event
   */
  async logSecurityEvent(
    eventType: string,
    eventData: any,
    userId: string,
    severity: 'low' | 'medium' | 'high' | 'critical',
    metadata?: {
      ipAddress?: string;
      userAgent?: string;
    }
  ): Promise<void> {
    try {
      const logEntry: AuditLogEntry = {
        subscription_id: '', // No subscription ID for security events
        event_type: `security_${eventType}`,
        event_data: {
          ...eventData,
          severity,
        },
        user_id: userId,
        ip_address: metadata?.ipAddress,
        user_agent: metadata?.userAgent,
        created_at: new Date().toISOString(),
      };

      await this.supabase.from('subscription_analytics').insert(logEntry);
    } catch (error) {
      }
  }

  /**
   * Get audit logs for subscription
   */
  async getSubscriptionAuditLogs(
    subscriptionId: string,
    limit: number = 50
  ): Promise<AuditLogEntry[]> {
    try {
      const { data, error } = await this.supabase
        .from('subscription_analytics')
        .select('*')
        .eq('subscription_id', subscriptionId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        throw new Error(`Failed to get audit logs: ${error.message}`);
      }

      return data || [];
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get security audit logs
   */
  async getSecurityAuditLogs(
    userId?: string,
    severity?: string,
    limit: number = 100
  ): Promise<AuditLogEntry[]> {
    try {
      let query = this.supabase
        .from('subscription_analytics')
        .select('*')
        .like('event_type', 'security_%')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (userId) {
        query = query.eq('user_id', userId);
      }

      if (severity) {
        query = query.contains('event_data', { severity });
      }

      const { data, error } = await query;

      if (error) {
        throw new Error(`Failed to get security audit logs: ${error.message}`);
      }

      return data || [];
    } catch (error) {
      throw error;
    }
  }
}
