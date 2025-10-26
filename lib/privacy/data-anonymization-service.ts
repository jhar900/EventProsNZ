import { createClient } from '@/lib/supabase/server';
import { DataEncryptionService } from '@/lib/security/data-encryption-service';

export interface AnonymizedData {
  id: string;
  original_id: string;
  anonymized_data: Record<string, any>;
  algorithm_used: string;
  created_at: Date;
  updated_at: Date;
}

export interface AnonymizationRule {
  id: string;
  data_type: string;
  field_name: string;
  anonymization_method: 'hash' | 'mask' | 'replace' | 'remove';
  replacement_value?: string;
  mask_pattern?: string;
  hash_algorithm?: string;
  created_at: Date;
  updated_at: Date;
  is_active: boolean;
}

export interface AnonymizationReport {
  total_records: number;
  anonymized_records: number;
  anonymization_rate: number;
  by_algorithm: Record<string, number>;
  by_data_type: Record<string, number>;
  compliance_score: number;
}

export class DataAnonymizationService {
  private supabase;
  private encryptionService: DataEncryptionService;

  constructor(supabaseClient?: any) {
    this.supabase = supabaseClient || createClient();
    this.encryptionService = new DataEncryptionService();
  }

  static create(supabaseClient?: any): DataAnonymizationService {
    return new DataAnonymizationService(supabaseClient);
  }

  /**
   * Create anonymization rule
   */
  async createAnonymizationRule(
    ruleData: Omit<AnonymizationRule, 'id' | 'created_at' | 'updated_at'>
  ): Promise<{ success: boolean; data?: AnonymizationRule; error?: string }> {
    try {
      const { data, error } = await this.supabase
        .from('anonymization_rules')
        .insert({
          ...ruleData,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select('*')
        .single();

      if (error) {
        throw new Error(
          `Failed to create anonymization rule: ${error.message}`
        );
      }

      return { success: true, data };
    } catch (error) {
      console.error('Error creating anonymization rule:', error);
      return { success: false, error: 'Failed to create anonymization rule' };
    }
  }

  /**
   * Get anonymization rules
   */
  async getAnonymizationRules(
    filters: { data_type?: string; is_active?: boolean } = {}
  ): Promise<{ success: boolean; data?: AnonymizationRule[]; error?: string }> {
    try {
      let query = this.supabase.from('anonymization_rules').select('*');

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
        throw new Error(`Failed to get anonymization rules: ${error.message}`);
      }

      return { success: true, data };
    } catch (error) {
      console.error('Error getting anonymization rules:', error);
      return { success: false, error: 'Failed to get anonymization rules' };
    }
  }

  /**
   * Update anonymization rule
   */
  async updateAnonymizationRule(
    ruleId: string,
    updates: Partial<AnonymizationRule>
  ): Promise<{ success: boolean; data?: AnonymizationRule; error?: string }> {
    try {
      const { data, error } = await this.supabase
        .from('anonymization_rules')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', ruleId)
        .select('*')
        .single();

      if (error) {
        throw new Error(
          `Failed to update anonymization rule: ${error.message}`
        );
      }

      return { success: true, data };
    } catch (error) {
      console.error('Error updating anonymization rule:', error);
      return { success: false, error: 'Failed to update anonymization rule' };
    }
  }

  /**
   * Delete anonymization rule
   */
  async deleteAnonymizationRule(
    ruleId: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await this.supabase
        .from('anonymization_rules')
        .delete()
        .eq('id', ruleId);

      if (error) {
        throw new Error(
          `Failed to delete anonymization rule: ${error.message}`
        );
      }

      return { success: true };
    } catch (error) {
      console.error('Error deleting anonymization rule:', error);
      return { success: false, error: 'Failed to delete anonymization rule' };
    }
  }

  /**
   * Anonymize data
   */
  async anonymizeData(
    originalData: Record<string, any>,
    dataType: string
  ): Promise<{ success: boolean; data?: AnonymizedData; error?: string }> {
    try {
      // Get anonymization rules for this data type
      const rules = await this.getAnonymizationRules({
        data_type: dataType,
        is_active: true,
      });

      if (!rules.success || !rules.data) {
        return { success: false, error: 'No anonymization rules found' };
      }

      const anonymizedData = { ...originalData };
      const algorithmUsed = 'multi_rule_anonymization';

      // Apply anonymization rules
      for (const rule of rules.data) {
        if (originalData[rule.field_name] !== undefined) {
          anonymizedData[rule.field_name] = this.applyAnonymizationRule(
            originalData[rule.field_name],
            rule
          );
        }
      }

      // Store anonymized data
      const { data, error } = await this.supabase
        .from('anonymized_data')
        .insert({
          original_id: originalData.id || crypto.randomUUID(),
          anonymized_data: anonymizedData,
          algorithm_used: algorithmUsed,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select('*')
        .single();

      if (error) {
        throw new Error(`Failed to store anonymized data: ${error.message}`);
      }

      return { success: true, data };
    } catch (error) {
      console.error('Error anonymizing data:', error);
      return { success: false, error: 'Failed to anonymize data' };
    }
  }

  /**
   * Apply anonymization rule to a field value
   */
  private applyAnonymizationRule(value: any, rule: AnonymizationRule): any {
    if (value === null || value === undefined) {
      return value;
    }

    switch (rule.anonymization_method) {
      case 'hash':
        return this.hashValue(value, rule.hash_algorithm || 'sha256');
      case 'mask':
        return this.maskValue(value, rule.mask_pattern || '***');
      case 'replace':
        return rule.replacement_value || '[ANONYMIZED]';
      case 'remove':
        return null;
      default:
        return value;
    }
  }

  /**
   * Hash a value
   */
  private hashValue(value: any, algorithm: string): string {
    const crypto = require('crypto');
    const stringValue = String(value);
    return crypto.createHash(algorithm).update(stringValue).digest('hex');
  }

  /**
   * Mask a value
   */
  private maskValue(value: any, pattern: string): string {
    const stringValue = String(value);
    if (stringValue.length <= 3) {
      return pattern;
    }

    const start = stringValue.substring(0, 1);
    const end = stringValue.substring(stringValue.length - 1);
    return `${start}${pattern}${end}`;
  }

  /**
   * Pseudonymize data
   */
  async pseudonymizeData(
    originalData: Record<string, any>,
    dataType: string
  ): Promise<{ success: boolean; data?: AnonymizedData; error?: string }> {
    try {
      const pseudonymizedData = { ...originalData };

      // Create pseudonym for user ID
      if (originalData.user_id) {
        pseudonymizedData.user_id = this.createPseudonym(originalData.user_id);
      }

      // Create pseudonym for email
      if (originalData.email) {
        pseudonymizedData.email = this.createPseudonym(originalData.email);
      }

      // Create pseudonym for phone
      if (originalData.phone) {
        pseudonymizedData.phone = this.createPseudonym(originalData.phone);
      }

      // Store pseudonymized data
      const { data, error } = await this.supabase
        .from('anonymized_data')
        .insert({
          original_id: originalData.id || crypto.randomUUID(),
          anonymized_data: pseudonymizedData,
          algorithm_used: 'pseudonymization',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select('*')
        .single();

      if (error) {
        throw new Error(`Failed to store pseudonymized data: ${error.message}`);
      }

      return { success: true, data };
    } catch (error) {
      console.error('Error pseudonymizing data:', error);
      return { success: false, error: 'Failed to pseudonymize data' };
    }
  }

  /**
   * Create pseudonym
   */
  private createPseudonym(value: string): string {
    const crypto = require('crypto');
    const hash = crypto.createHash('sha256').update(value).digest('hex');
    return `pseudo_${hash.substring(0, 8)}`;
  }

  /**
   * Get anonymized data
   */
  async getAnonymizedData(
    originalId: string
  ): Promise<{ success: boolean; data?: AnonymizedData; error?: string }> {
    try {
      const { data, error } = await this.supabase
        .from('anonymized_data')
        .select('*')
        .eq('original_id', originalId)
        .single();

      if (error) {
        throw new Error(`Failed to get anonymized data: ${error.message}`);
      }

      return { success: true, data };
    } catch (error) {
      console.error('Error getting anonymized data:', error);
      return { success: false, error: 'Failed to get anonymized data' };
    }
  }

  /**
   * Get anonymization analytics
   */
  async getAnonymizationAnalytics(): Promise<{
    success: boolean;
    data?: AnonymizationReport;
    error?: string;
  }> {
    try {
      const { data: anonymizedData, error } = await this.supabase
        .from('anonymized_data')
        .select('*');

      if (error) {
        throw new Error(
          `Failed to get anonymization analytics: ${error.message}`
        );
      }

      const report: AnonymizationReport = {
        total_records: anonymizedData?.length || 0,
        anonymized_records: anonymizedData?.length || 0,
        anonymization_rate: 100,
        by_algorithm: {},
        by_data_type: {},
        compliance_score: 0,
      };

      if (anonymizedData) {
        // Group by algorithm
        anonymizedData.forEach(record => {
          report.by_algorithm[record.algorithm_used] =
            (report.by_algorithm[record.algorithm_used] || 0) + 1;
        });

        // Group by data type (inferred from anonymized_data structure)
        anonymizedData.forEach(record => {
          const dataType = this.inferDataType(record.anonymized_data);
          report.by_data_type[dataType] =
            (report.by_data_type[dataType] || 0) + 1;
        });

        // Calculate compliance score
        report.compliance_score = this.calculateComplianceScore(anonymizedData);
      }

      return { success: true, data: report };
    } catch (error) {
      console.error('Error getting anonymization analytics:', error);
      return { success: false, error: 'Failed to get anonymization analytics' };
    }
  }

  /**
   * Infer data type from anonymized data structure
   */
  private inferDataType(data: Record<string, any>): string {
    if (data.user_id) return 'user_data';
    if (data.contact_id) return 'contact_data';
    if (data.message_id) return 'message_data';
    if (data.event_id) return 'event_data';
    if (data.payment_id) return 'payment_data';
    return 'unknown';
  }

  /**
   * Calculate compliance score
   */
  private calculateComplianceScore(anonymizedData: AnonymizedData[]): number {
    if (anonymizedData.length === 0) return 0;

    const totalFields = anonymizedData.reduce((total, record) => {
      return total + Object.keys(record.anonymized_data).length;
    }, 0);

    const anonymizedFields = anonymizedData.reduce((total, record) => {
      return (
        total +
        Object.values(record.anonymized_data).filter(
          value =>
            value === null ||
            value === '[ANONYMIZED]' ||
            (typeof value === 'string' && value.startsWith('pseudo_'))
        ).length
      );
    }, 0);

    return Math.round((anonymizedFields / totalFields) * 100);
  }

  /**
   * Monitor anonymization compliance
   */
  async monitorAnonymizationCompliance(): Promise<{
    success: boolean;
    data?: any;
    error?: string;
  }> {
    try {
      const [analytics, rules] = await Promise.all([
        this.getAnonymizationAnalytics(),
        this.getAnonymizationRules({ is_active: true }),
      ]);

      if (!analytics.success || !rules.success) {
        return { success: false, error: 'Failed to get anonymization data' };
      }

      const compliance = {
        total_rules: rules.data?.length || 0,
        active_rules: rules.data?.filter(r => r.is_active).length || 0,
        total_anonymized: analytics.data?.total_records || 0,
        compliance_score: analytics.data?.compliance_score || 0,
        anonymization_rate: analytics.data?.anonymization_rate || 0,
        needs_anonymization: (analytics.data?.total_records || 0) === 0,
      };

      return { success: true, data: compliance };
    } catch (error) {
      console.error('Error monitoring anonymization compliance:', error);
      return {
        success: false,
        error: 'Failed to monitor anonymization compliance',
      };
    }
  }

  /**
   * Bulk anonymize data
   */
  async bulkAnonymizeData(
    dataType: string,
    filters: Record<string, any> = {}
  ): Promise<{ success: boolean; data?: number; error?: string }> {
    try {
      // Get data to anonymize
      const { data: records, error } = await this.supabase
        .from(this.getTableName(dataType))
        .select('*')
        .match(filters);

      if (error) {
        throw new Error(
          `Failed to get data for anonymization: ${error.message}`
        );
      }

      if (!records || records.length === 0) {
        return { success: true, data: 0 };
      }

      let anonymizedCount = 0;

      // Anonymize each record
      for (const record of records) {
        const result = await this.anonymizeData(record, dataType);
        if (result.success) {
          anonymizedCount++;
        }
      }

      return { success: true, data: anonymizedCount };
    } catch (error) {
      console.error('Error bulk anonymizing data:', error);
      return { success: false, error: 'Failed to bulk anonymize data' };
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
      event_data: 'events',
      payment_data: 'payments',
      analytics_data: 'analytics_events',
    };

    return tableMap[dataType] || 'users';
  }

  /**
   * Verify anonymization
   */
  async verifyAnonymization(
    originalId: string
  ): Promise<{ success: boolean; data?: boolean; error?: string }> {
    try {
      const anonymizedData = await this.getAnonymizedData(originalId);
      if (!anonymizedData.success || !anonymizedData.data) {
        return { success: true, data: false };
      }

      const data = anonymizedData.data.anonymized_data;
      const isAnonymized = Object.values(data).some(
        value =>
          value === null ||
          value === '[ANONYMIZED]' ||
          (typeof value === 'string' && value.startsWith('pseudo_'))
      );

      return { success: true, data: isAnonymized };
    } catch (error) {
      console.error('Error verifying anonymization:', error);
      return { success: false, error: 'Failed to verify anonymization' };
    }
  }
}
