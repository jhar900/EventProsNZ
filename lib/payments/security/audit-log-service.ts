/**
 * Audit Log Service
 * Handles payment security audit logging
 */

import { createClient } from '@/lib/supabase/server';

export interface AuditLogEntry {
  id: string;
  user_id: string;
  event_type: string;
  event_data: any;
  ip_address: string;
  user_agent: string;
  created_at: string;
}

export interface AuditLogCreateData {
  user_id: string;
  event_type: string;
  event_data: any;
  ip_address: string;
  user_agent: string;
}

export class AuditLogService {
  private supabase = createClient();

  /**
   * Create audit log entry
   */
  async createAuditLog(data: AuditLogCreateData): Promise<AuditLogEntry> {
    try {
      const { data: auditLog, error } = await this.supabase
        .from('audit_logs')
        .insert({
          user_id: data.user_id,
          event_type: data.event_type,
          event_data: data.event_data,
          ip_address: data.ip_address,
          user_agent: data.user_agent,
          created_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to create audit log: ${error.message}`);
      }

      return {
        id: auditLog.id,
        user_id: auditLog.user_id,
        event_type: auditLog.event_type,
        event_data: auditLog.event_data,
        ip_address: auditLog.ip_address,
        user_agent: auditLog.user_agent,
        created_at: auditLog.created_at,
      };
    } catch (error) {
      throw new Error('Failed to create audit log');
    }
  }

  /**
   * Get audit logs (alias for getUserAuditLogs for backward compatibility)
   */
  async getAuditLogs(
    userId: string,
    startDate?: string,
    endDate?: string
  ): Promise<AuditLogEntry[]> {
    try {
      let query = this.supabase
        .from('audit_logs')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (startDate) {
        query = query.gte('created_at', startDate);
      }
      if (endDate) {
        query = query.lte('created_at', endDate);
      }

      const { data: auditLogs, error } = await query;

      if (error) {
        throw new Error(`Failed to get audit logs: ${error.message}`);
      }

      return (auditLogs || []).map(log => ({
        id: log.id,
        user_id: log.user_id,
        event_type: log.event_type,
        event_data: log.event_data,
        ip_address: log.ip_address,
        user_agent: log.user_agent,
        created_at: log.created_at,
      }));
    } catch (error) {
      throw new Error('Failed to get audit logs');
    }
  }

  /**
   * Get audit logs for user
   */
  async getUserAuditLogs(
    userId: string,
    limit = 50,
    offset = 0
  ): Promise<AuditLogEntry[]> {
    try {
      const { data: auditLogs, error } = await this.supabase
        .from('audit_logs')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) {
        throw new Error(`Failed to get user audit logs: ${error.message}`);
      }

      return (auditLogs || []).map(log => ({
        id: log.id,
        user_id: log.user_id,
        event_type: log.event_type,
        event_data: log.event_data,
        ip_address: log.ip_address,
        user_agent: log.user_agent,
        created_at: log.created_at,
      }));
    } catch (error) {
      throw new Error('Failed to get user audit logs');
    }
  }

  /**
   * Get audit logs by event type
   */
  async getAuditLogsByEventType(
    eventType: string,
    limit = 50,
    offset = 0
  ): Promise<AuditLogEntry[]> {
    try {
      const { data: auditLogs, error } = await this.supabase
        .from('audit_logs')
        .select('*')
        .eq('event_type', eventType)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) {
        throw new Error(
          `Failed to get audit logs by event type: ${error.message}`
        );
      }

      return (auditLogs || []).map(log => ({
        id: log.id,
        user_id: log.user_id,
        event_type: log.event_type,
        event_data: log.event_data,
        ip_address: log.ip_address,
        user_agent: log.user_agent,
        created_at: log.created_at,
      }));
    } catch (error) {
      throw new Error('Failed to get audit logs by event type');
    }
  }

  /**
   * Get audit logs for date range
   */
  async getAuditLogsByDateRange(
    startDate: string,
    endDate: string,
    limit = 100,
    offset = 0
  ): Promise<AuditLogEntry[]> {
    try {
      const { data: auditLogs, error } = await this.supabase
        .from('audit_logs')
        .select('*')
        .gte('created_at', startDate)
        .lte('created_at', endDate)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) {
        throw new Error(
          `Failed to get audit logs by date range: ${error.message}`
        );
      }

      return (auditLogs || []).map(log => ({
        id: log.id,
        user_id: log.user_id,
        event_type: log.event_type,
        event_data: log.event_data,
        ip_address: log.ip_address,
        user_agent: log.user_agent,
        created_at: log.created_at,
      }));
    } catch (error) {
      throw new Error('Failed to get audit logs by date range');
    }
  }

  /**
   * Get audit log statistics
   */
  async getAuditLogStatistics(userId?: string): Promise<{
    total_logs: number;
    event_types: { [key: string]: number };
    recent_activity: number;
    security_events: number;
  }> {
    try {
      let query = this.supabase.from('audit_logs').select('*');

      if (userId) {
        query = query.eq('user_id', userId);
      }

      const { data: auditLogs, error } = await query;

      if (error) {
        throw new Error(`Failed to get audit log statistics: ${error.message}`);
      }

      const logs = auditLogs || [];
      const totalLogs = logs.length;

      // Count event types
      const eventTypes: { [key: string]: number } = {};
      logs.forEach(log => {
        eventTypes[log.event_type] = (eventTypes[log.event_type] || 0) + 1;
      });

      // Count recent activity (last 24 hours)
      const recentCutoff = new Date(
        Date.now() - 24 * 60 * 60 * 1000
      ).toISOString();
      const recentActivity = logs.filter(
        log => log.created_at >= recentCutoff
      ).length;

      // Count security events
      const securityEventTypes = [
        'payment_failed',
        'fraud_detected',
        'suspicious_activity',
        'unauthorized_access',
        'security_violation',
      ];
      const securityEvents = logs.filter(log =>
        securityEventTypes.includes(log.event_type)
      ).length;

      return {
        total_logs: totalLogs,
        event_types: eventTypes,
        recent_activity: recentActivity,
        security_events: securityEvents,
      };
    } catch (error) {
      throw new Error('Failed to get audit log statistics');
    }
  }

  /**
   * Log payment event
   */
  async logPaymentEvent(
    userId: string,
    eventType: string,
    paymentData: any,
    ipAddress: string,
    userAgent: string
  ): Promise<void> {
    try {
      await this.createAuditLog({
        user_id: userId,
        event_type: eventType,
        event_data: paymentData,
        ip_address: ipAddress,
        user_agent: userAgent,
      });
    } catch (error) {
      console.error('Failed to log payment event:', error);
    }
  }

  /**
   * Log security event
   */
  async logSecurityEvent(
    userId: string,
    eventType: string,
    securityData: any,
    ipAddress: string,
    userAgent: string
  ): Promise<void> {
    try {
      await this.createAuditLog({
        user_id: userId,
        event_type: eventType,
        event_data: securityData,
        ip_address: ipAddress,
        user_agent: userAgent,
      });
    } catch (error) {
      console.error('Failed to log security event:', error);
    }
  }

  /**
   * Clean up old audit logs
   */
  async cleanupOldLogs(daysToKeep: number = 90): Promise<void> {
    try {
      const cutoffDate = new Date(
        Date.now() - daysToKeep * 24 * 60 * 60 * 1000
      ).toISOString();

      const { error } = await this.supabase
        .from('audit_logs')
        .delete()
        .lt('created_at', cutoffDate);

      if (error) {
        throw new Error(`Failed to cleanup old audit logs: ${error.message}`);
      }
    } catch (error) {
      throw new Error('Failed to cleanup old audit logs');
    }
  }

  /**
   * Search audit logs
   */
  async searchAuditLogs(filters: {
    event_type?: string;
    user_id?: string;
    start_date?: string;
    end_date?: string;
  }): Promise<AuditLogEntry[]> {
    try {
      let query = this.supabase.from('payment_audit_logs').select('*');

      if (filters.event_type) {
        query = query.eq('event_type', filters.event_type);
      }
      if (filters.user_id) {
        query = query.eq('user_id', filters.user_id);
      }
      if (filters.start_date) {
        query = query.gte('created_at', filters.start_date);
      }
      if (filters.end_date) {
        query = query.lte('created_at', filters.end_date);
      }

      const { data: logs, error } = await query;

      if (error) {
        throw new Error(`Failed to search audit logs: ${error.message}`);
      }

      return logs || [];
    } catch (error) {
      throw new Error('Failed to search audit logs');
    }
  }

  /**
   * Delete old audit logs
   */
  async deleteOldAuditLogs(cutoffDate: string): Promise<void> {
    try {
      const { error } = await this.supabase
        .from('payment_audit_logs')
        .delete()
        .lt('timestamp', cutoffDate);

      if (error) {
        throw new Error(`Failed to delete old audit logs: ${error.message}`);
      }
    } catch (error) {
      throw new Error('Failed to delete old audit logs');
    }
  }
}
