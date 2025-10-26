import { createClient } from '@/lib/supabase/server';

export interface DataRetentionRule {
  id: string;
  data_type: string;
  retention_period: number;
  cleanup_date: Date;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface DataRetentionReport {
  total_records: number;
  records_to_cleanup: number;
  cleanup_by_type: Record<string, number>;
  retention_compliance: number;
  last_cleanup: Date;
  next_cleanup: Date;
}

export interface DataCleanupLog {
  id: string;
  data_type: string;
  records_cleaned: number;
  cleanup_date: Date;
  status: 'success' | 'partial' | 'failed';
  error_message?: string;
}

export class DataRetentionService {
  private supabase;

  constructor(supabaseClient?: any) {
    this.supabase = supabaseClient || createClient();
  }

  static create(supabaseClient?: any): DataRetentionService {
    return new DataRetentionService(supabaseClient);
  }

  /**
   * Create data retention rule
   */
  async createRetentionRule(
    ruleData: Omit<DataRetentionRule, 'id' | 'created_at' | 'updated_at'>
  ): Promise<{ success: boolean; data?: DataRetentionRule; error?: string }> {
    try {
      const cleanupDate = new Date();
      cleanupDate.setDate(cleanupDate.getDate() + ruleData.retention_period);

      const { data, error } = await this.supabase
        .from('data_retention_rules')
        .insert({
          ...ruleData,
          cleanup_date: cleanupDate.toISOString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select('*')
        .single();

      if (error) {
        throw new Error(
          `Failed to create data retention rule: ${error.message}`
        );
      }

      return { success: true, data };
    } catch (error) {
      console.error('Error creating data retention rule:', error);
      return { success: false, error: 'Failed to create data retention rule' };
    }
  }

  /**
   * Get data retention rules
   */
  async getRetentionRules(
    filters: { data_type?: string; is_active?: boolean } = {}
  ): Promise<{ success: boolean; data?: DataRetentionRule[]; error?: string }> {
    try {
      let query = this.supabase.from('data_retention_rules').select('*');

      if (filters.data_type) {
        query = query.eq('data_type', filters.data_type);
      }

      if (filters.is_active !== undefined) {
        query = query.eq('is_active', filters.is_active);
      }

      const { data, error } = await query.order('created_at', {
        ascending: false,
      });

      if (error) {
        throw new Error(`Failed to get data retention rules: ${error.message}`);
      }

      return { success: true, data };
    } catch (error) {
      console.error('Error getting data retention rules:', error);
      return { success: false, error: 'Failed to get data retention rules' };
    }
  }

  /**
   * Update data retention rule
   */
  async updateRetentionRule(
    ruleId: string,
    updates: Partial<DataRetentionRule>
  ): Promise<{ success: boolean; data?: DataRetentionRule; error?: string }> {
    try {
      const { data, error } = await this.supabase
        .from('data_retention_rules')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', ruleId)
        .select('*')
        .single();

      if (error) {
        throw new Error(
          `Failed to update data retention rule: ${error.message}`
        );
      }

      return { success: true, data };
    } catch (error) {
      console.error('Error updating data retention rule:', error);
      return { success: false, error: 'Failed to update data retention rule' };
    }
  }

  /**
   * Delete data retention rule
   */
  async deleteRetentionRule(
    ruleId: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await this.supabase
        .from('data_retention_rules')
        .delete()
        .eq('id', ruleId);

      if (error) {
        throw new Error(
          `Failed to delete data retention rule: ${error.message}`
        );
      }

      return { success: true };
    } catch (error) {
      console.error('Error deleting data retention rule:', error);
      return { success: false, error: 'Failed to delete data retention rule' };
    }
  }

  /**
   * Execute automated data cleanup
   */
  async executeDataCleanup(
    dataType?: string
  ): Promise<{ success: boolean; data?: DataCleanupLog; error?: string }> {
    try {
      const rules = await this.getRetentionRules({
        is_active: true,
        ...(dataType && { data_type: dataType }),
      });

      if (!rules.success || !rules.data) {
        return { success: false, error: 'No active retention rules found' };
      }

      const cleanupLog: DataCleanupLog = {
        id: crypto.randomUUID(),
        data_type: dataType || 'all',
        records_cleaned: 0,
        cleanup_date: new Date(),
        status: 'success',
      };

      let totalCleaned = 0;

      for (const rule of rules.data || []) {
        try {
          const cleaned = await this.cleanupDataByRule(rule);
          totalCleaned += cleaned;
        } catch (error) {
          console.error(`Error cleaning up data for rule ${rule.id}:`, error);
          cleanupLog.status = 'partial';
          cleanupLog.error_message = `Failed to clean up data for rule ${rule.id}`;
        }
      }

      cleanupLog.records_cleaned = totalCleaned;

      // Log cleanup operation
      await this.logCleanupOperation(cleanupLog);

      return { success: true, data: cleanupLog };
    } catch (error) {
      console.error('Error executing data cleanup:', error);
      return { success: false, error: 'Failed to execute data cleanup' };
    }
  }

  /**
   * Cleanup data by specific rule
   */
  private async cleanupDataByRule(rule: DataRetentionRule): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - rule.retention_period);

    let cleaned = 0;

    switch (rule.data_type) {
      case 'user_data':
        const { data: userData, error: userError } = await this.supabase
          .from('users')
          .delete()
          .lt('created_at', cutoffDate.toISOString())
          .select('id');

        if (userError) throw userError;
        cleaned += userData?.length || 0;
        break;

      case 'contact_data':
        const { data: contactData, error: contactError } = await this.supabase
          .from('contacts')
          .delete()
          .lt('created_at', cutoffDate.toISOString())
          .select('id');

        if (contactError) throw contactError;
        cleaned += contactData?.length || 0;
        break;

      case 'message_data':
        const { data: messageData, error: messageError } = await this.supabase
          .from('contact_messages')
          .delete()
          .lt('created_at', cutoffDate.toISOString())
          .select('id');

        if (messageError) throw messageError;
        cleaned += messageData?.length || 0;
        break;

      case 'analytics_data':
        const { data: analyticsData, error: analyticsError } =
          await this.supabase
            .from('analytics_events')
            .delete()
            .lt('created_at', cutoffDate.toISOString())
            .select('id');

        if (analyticsError) throw analyticsError;
        cleaned += analyticsData?.length || 0;
        break;

      default:
        console.warn(`Unknown data type for cleanup: ${rule.data_type}`);
    }

    return cleaned;
  }

  /**
   * Log cleanup operation
   */
  private async logCleanupOperation(log: DataCleanupLog): Promise<void> {
    try {
      await this.supabase.from('data_cleanup_logs').insert({
        ...log,
        cleanup_date: log.cleanup_date.toISOString(),
      });
    } catch (error) {
      console.error('Error logging cleanup operation:', error);
    }
  }

  /**
   * Get data retention report
   */
  async getRetentionReport(): Promise<{
    success: boolean;
    data?: DataRetentionReport;
    error?: string;
  }> {
    try {
      const [rules, cleanupLogs] = await Promise.all([
        this.getRetentionRules({ is_active: true }),
        this.supabase
          .from('data_cleanup_logs')
          .select('*')
          .order('cleanup_date', { ascending: false })
          .limit(1),
      ]);

      if (!rules.success) {
        return { success: false, error: 'Failed to get retention rules' };
      }

      const report: DataRetentionReport = {
        total_records: 0,
        records_to_cleanup: 0,
        cleanup_by_type: {},
        retention_compliance: 0,
        last_cleanup: new Date(),
        next_cleanup: new Date(),
      };

      // Calculate records to cleanup
      for (const rule of rules.data || []) {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - rule.retention_period);

        const { count } = await this.supabase
          .from(this.getTableName(rule.data_type))
          .select('*', { count: 'exact', head: true })
          .lt('created_at', cutoffDate.toISOString());

        report.records_to_cleanup += count || 0;
        report.cleanup_by_type[rule.data_type] = count || 0;
      }

      // Get last cleanup date
      if (cleanupLogs.data && cleanupLogs.data.length > 0) {
        report.last_cleanup = new Date(cleanupLogs.data[0].cleanup_date);
      }

      // Calculate next cleanup date
      const nextCleanup = new Date();
      nextCleanup.setDate(nextCleanup.getDate() + 1); // Daily cleanup
      report.next_cleanup = nextCleanup;

      // Calculate compliance score
      report.retention_compliance = this.calculateComplianceScore(
        rules.data || []
      );

      return { success: true, data: report };
    } catch (error) {
      console.error('Error getting retention report:', error);
      return { success: false, error: 'Failed to get retention report' };
    }
  }

  /**
   * Get table name for data type
   */
  private getTableName(dataType: string): string {
    const tableMap: Record<string, string> = {
      user_data: 'users',
      contact_data: 'contacts',
      message_data: 'contact_messages',
      analytics_data: 'analytics_events',
      event_data: 'events',
      payment_data: 'payments',
    };

    return tableMap[dataType] || 'users';
  }

  /**
   * Calculate compliance score
   */
  private calculateComplianceScore(rules: DataRetentionRule[]): number {
    if (rules.length === 0) return 0;

    const activeRules = rules.filter(rule => rule.is_active);
    const complianceScore = (activeRules.length / rules.length) * 100;

    return Math.round(complianceScore);
  }

  /**
   * Monitor data retention compliance
   */
  async monitorRetentionCompliance(): Promise<{
    success: boolean;
    data?: any;
    error?: string;
  }> {
    try {
      const [report, rules] = await Promise.all([
        this.getRetentionReport(),
        this.getRetentionRules({ is_active: true }),
      ]);

      if (!report.success || !rules.success) {
        return { success: false, error: 'Failed to get retention data' };
      }

      const compliance = {
        total_rules: rules.data?.length || 0,
        active_rules: rules.data?.filter(r => r.is_active).length || 0,
        records_to_cleanup: report.data?.records_to_cleanup || 0,
        compliance_score: report.data?.retention_compliance || 0,
        last_cleanup: report.data?.last_cleanup,
        next_cleanup: report.data?.next_cleanup,
        needs_cleanup: (report.data?.records_to_cleanup || 0) > 0,
      };

      return { success: true, data: compliance };
    } catch (error) {
      console.error('Error monitoring retention compliance:', error);
      return {
        success: false,
        error: 'Failed to monitor retention compliance',
      };
    }
  }

  /**
   * Schedule automated cleanup
   */
  async scheduleCleanup(
    scheduleType: 'daily' | 'weekly' | 'monthly' = 'daily'
  ): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      const schedule = {
        type: scheduleType,
        next_run: this.calculateNextRun(scheduleType),
        is_active: true,
        created_at: new Date().toISOString(),
      };

      await this.supabase.from('cleanup_schedules').upsert(schedule);

      return { success: true, data: schedule };
    } catch (error) {
      console.error('Error scheduling cleanup:', error);
      return { success: false, error: 'Failed to schedule cleanup' };
    }
  }

  /**
   * Calculate next run time
   */
  private calculateNextRun(scheduleType: string): Date {
    const nextRun = new Date();

    switch (scheduleType) {
      case 'daily':
        nextRun.setDate(nextRun.getDate() + 1);
        nextRun.setHours(2, 0, 0, 0); // 2 AM
        break;
      case 'weekly':
        nextRun.setDate(nextRun.getDate() + 7);
        nextRun.setHours(2, 0, 0, 0);
        break;
      case 'monthly':
        nextRun.setMonth(nextRun.getMonth() + 1);
        nextRun.setDate(1);
        nextRun.setHours(2, 0, 0, 0);
        break;
    }

    return nextRun;
  }

  /**
   * Get cleanup history
   */
  async getCleanupHistory(
    limit: number = 50
  ): Promise<{ success: boolean; data?: DataCleanupLog[]; error?: string }> {
    try {
      const { data, error } = await this.supabase
        .from('data_cleanup_logs')
        .select('*')
        .order('cleanup_date', { ascending: false })
        .limit(limit);

      if (error) {
        throw new Error(`Failed to get cleanup history: ${error.message}`);
      }

      return { success: true, data };
    } catch (error) {
      console.error('Error getting cleanup history:', error);
      return { success: false, error: 'Failed to get cleanup history' };
    }
  }
}
