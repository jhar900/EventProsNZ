import { createClient } from '@/lib/supabase/server';

/**
 * Security event types for monitoring
 */
export enum SecurityEventType {
  AUTHORIZATION_BYPASS = 'authorization_bypass',
  INVALID_ACCESS_ATTEMPT = 'invalid_access_attempt',
  RATE_LIMIT_EXCEEDED = 'rate_limit_exceeded',
  SQL_INJECTION_ATTEMPT = 'sql_injection_attempt',
  XSS_ATTEMPT = 'xss_attempt',
  SUSPICIOUS_ACTIVITY = 'suspicious_activity',
  AUTHENTICATION_FAILURE = 'authentication_failure',
  UNAUTHORIZED_ACCESS = 'unauthorized_access',
  DATA_BREACH_ATTEMPT = 'data_breach_attempt',
  MALICIOUS_INPUT = 'malicious_input',
}

/**
 * Security severity levels
 */
export enum SecuritySeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

/**
 * Security event interface
 */
export interface SecurityEvent {
  id?: string;
  event_type: SecurityEventType;
  severity: SecuritySeverity;
  user_id?: string;
  ip_address?: string;
  user_agent?: string;
  endpoint?: string;
  method?: string;
  request_data?: any;
  response_status?: number;
  error_message?: string;
  metadata?: Record<string, any>;
  timestamp: string;
}

/**
 * Security monitoring and logging service
 */
export class SecurityLogger {
  private static supabase: any = null;

  /**
   * Get Supabase client instance
   */
  private static async getSupabase() {
    if (!this.supabase) {
      this.supabase = await createClient();
    }
    return this.supabase;
  }

  /**
   * Log a security event
   * @param event - Security event to log
   * @returns Promise<void>
   */
  static async logSecurityEvent(
    event: Omit<SecurityEvent, 'id' | 'timestamp'>
  ): Promise<void> {
    try {
      const supabase = await this.getSupabase();

      const securityEvent: SecurityEvent = {
        ...event,
        timestamp: new Date().toISOString(),
      };

      const { error } = await supabase
        .from('security_logs')
        .insert(securityEvent);

      if (error) {
        // Don't throw - logging failures shouldn't break the application
      }

      // Also log to console for immediate visibility
    } catch (error) {
      }
  }

  /**
   * Log authorization bypass attempt
   * @param userId - User ID attempting bypass
   * @param endpoint - Endpoint being accessed
   * @param ipAddress - IP address of the request
   * @param userAgent - User agent string
   */
  static async logAuthorizationBypass(
    userId: string,
    endpoint: string,
    ipAddress: string,
    userAgent: string
  ): Promise<void> {
    await this.logSecurityEvent({
      event_type: SecurityEventType.AUTHORIZATION_BYPASS,
      severity: SecuritySeverity.HIGH,
      user_id: userId,
      ip_address: ipAddress,
      user_agent: userAgent,
      endpoint,
      metadata: {
        description: 'User attempted to bypass authorization checks',
        risk_level: 'high',
      },
    });
  }

  /**
   * Log SQL injection attempt
   * @param userId - User ID making the request
   * @param endpoint - Endpoint being accessed
   * @param input - Malicious input detected
   * @param ipAddress - IP address of the request
   */
  static async logSqlInjectionAttempt(
    userId: string,
    endpoint: string,
    input: string,
    ipAddress: string
  ): Promise<void> {
    await this.logSecurityEvent({
      event_type: SecurityEventType.SQL_INJECTION_ATTEMPT,
      severity: SecuritySeverity.CRITICAL,
      user_id: userId,
      ip_address: ipAddress,
      endpoint,
      metadata: {
        malicious_input: input,
        description: 'SQL injection attempt detected',
        risk_level: 'critical',
      },
    });
  }

  /**
   * Log XSS attempt
   * @param userId - User ID making the request
   * @param endpoint - Endpoint being accessed
   * @param input - Malicious input detected
   * @param ipAddress - IP address of the request
   */
  static async logXssAttempt(
    userId: string,
    endpoint: string,
    input: string,
    ipAddress: string
  ): Promise<void> {
    await this.logSecurityEvent({
      event_type: SecurityEventType.XSS_ATTEMPT,
      severity: SecuritySeverity.HIGH,
      user_id: userId,
      ip_address: ipAddress,
      endpoint,
      metadata: {
        malicious_input: input,
        description: 'XSS attempt detected',
        risk_level: 'high',
      },
    });
  }

  /**
   * Log rate limit exceeded
   * @param userId - User ID that exceeded rate limit
   * @param endpoint - Endpoint being accessed
   * @param ipAddress - IP address of the request
   * @param requestCount - Number of requests made
   */
  static async logRateLimitExceeded(
    userId: string,
    endpoint: string,
    ipAddress: string,
    requestCount: number
  ): Promise<void> {
    await this.logSecurityEvent({
      event_type: SecurityEventType.RATE_LIMIT_EXCEEDED,
      severity: SecuritySeverity.MEDIUM,
      user_id: userId,
      ip_address: ipAddress,
      endpoint,
      metadata: {
        request_count: requestCount,
        description: 'Rate limit exceeded',
        risk_level: 'medium',
      },
    });
  }

  /**
   * Log suspicious activity
   * @param userId - User ID involved
   * @param activity - Description of suspicious activity
   * @param endpoint - Endpoint being accessed
   * @param ipAddress - IP address of the request
   * @param severity - Severity level
   */
  static async logSuspiciousActivity(
    userId: string,
    activity: string,
    endpoint: string,
    ipAddress: string,
    severity: SecuritySeverity = SecuritySeverity.MEDIUM
  ): Promise<void> {
    await this.logSecurityEvent({
      event_type: SecurityEventType.SUSPICIOUS_ACTIVITY,
      severity,
      user_id: userId,
      ip_address: ipAddress,
      endpoint,
      metadata: {
        activity,
        description: 'Suspicious activity detected',
        risk_level: severity,
      },
    });
  }

  /**
   * Log authentication failure
   * @param userId - User ID attempting authentication
   * @param endpoint - Authentication endpoint
   * @param ipAddress - IP address of the request
   * @param reason - Reason for failure
   */
  static async logAuthenticationFailure(
    userId: string,
    endpoint: string,
    ipAddress: string,
    reason: string
  ): Promise<void> {
    await this.logSecurityEvent({
      event_type: SecurityEventType.AUTHENTICATION_FAILURE,
      severity: SecuritySeverity.MEDIUM,
      user_id: userId,
      ip_address: ipAddress,
      endpoint,
      metadata: {
        failure_reason: reason,
        description: 'Authentication failure',
        risk_level: 'medium',
      },
    });
  }

  /**
   * Log unauthorized access attempt
   * @param userId - User ID attempting access
   * @param endpoint - Endpoint being accessed
   * @param ipAddress - IP address of the request
   * @param resource - Resource being accessed
   */
  static async logUnauthorizedAccess(
    userId: string,
    endpoint: string,
    ipAddress: string,
    resource: string
  ): Promise<void> {
    await this.logSecurityEvent({
      event_type: SecurityEventType.UNAUTHORIZED_ACCESS,
      severity: SecuritySeverity.HIGH,
      user_id: userId,
      ip_address: ipAddress,
      endpoint,
      metadata: {
        resource,
        description: 'Unauthorized access attempt',
        risk_level: 'high',
      },
    });
  }

  /**
   * Get security events for analysis
   * @param filters - Filters to apply
   * @returns Array of security events
   */
  static async getSecurityEvents(
    filters: {
      event_type?: SecurityEventType;
      severity?: SecuritySeverity;
      user_id?: string;
      start_date?: string;
      end_date?: string;
      limit?: number;
    } = {}
  ): Promise<SecurityEvent[]> {
    try {
      const supabase = await this.getSupabase();

      let query = supabase
        .from('security_logs')
        .select('*')
        .order('timestamp', { ascending: false });

      if (filters.event_type) {
        query = query.eq('event_type', filters.event_type);
      }

      if (filters.severity) {
        query = query.eq('severity', filters.severity);
      }

      if (filters.user_id) {
        query = query.eq('user_id', filters.user_id);
      }

      if (filters.start_date) {
        query = query.gte('timestamp', filters.start_date);
      }

      if (filters.end_date) {
        query = query.lte('timestamp', filters.end_date);
      }

      if (filters.limit) {
        query = query.limit(filters.limit);
      }

      const { data, error } = await query;

      if (error) {
        throw new Error('Failed to fetch security events');
      }

      return data || [];
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get security statistics
   * @param days - Number of days to analyze
   * @returns Security statistics
   */
  static async getSecurityStatistics(days: number = 7): Promise<{
    total_events: number;
    events_by_type: Record<string, number>;
    events_by_severity: Record<string, number>;
    top_offenders: Array<{ user_id: string; count: number }>;
    recent_events: SecurityEvent[];
  }> {
    try {
      const supabase = await this.getSupabase();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      // Get total events
      const { count: totalEvents, error: countError } = await supabase
        .from('security_logs')
        .select('*', { count: 'exact', head: true })
        .gte('timestamp', startDate.toISOString());

      if (countError) {
        throw new Error('Failed to get security event count');
      }

      // Get events by type
      const { data: eventsByType, error: typeError } = await supabase
        .from('security_logs')
        .select('event_type')
        .gte('timestamp', startDate.toISOString());

      if (typeError) {
        throw new Error('Failed to get events by type');
      }

      // Get events by severity
      const { data: eventsBySeverity, error: severityError } = await supabase
        .from('security_logs')
        .select('severity')
        .gte('timestamp', startDate.toISOString());

      if (severityError) {
        throw new Error('Failed to get events by severity');
      }

      // Get recent events
      const { data: recentEvents, error: recentError } = await supabase
        .from('security_logs')
        .select('*')
        .gte('timestamp', startDate.toISOString())
        .order('timestamp', { ascending: false })
        .limit(10);

      if (recentError) {
        throw new Error('Failed to get recent events');
      }

      // Process statistics
      const eventsByTypeCount: Record<string, number> = {};
      eventsByType?.forEach(event => {
        eventsByTypeCount[event.event_type] =
          (eventsByTypeCount[event.event_type] || 0) + 1;
      });

      const eventsBySeverityCount: Record<string, number> = {};
      eventsBySeverity?.forEach(event => {
        eventsBySeverityCount[event.severity] =
          (eventsBySeverityCount[event.severity] || 0) + 1;
      });

      return {
        total_events: totalEvents || 0,
        events_by_type: eventsByTypeCount,
        events_by_severity: eventsBySeverityCount,
        top_offenders: [], // Would need additional query to calculate
        recent_events: recentEvents || [],
      };
    } catch (error) {
      throw error;
    }
  }
}
