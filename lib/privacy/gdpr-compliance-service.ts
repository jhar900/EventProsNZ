import { createClient } from '@/lib/supabase/server';
import { DataEncryptionService } from '@/lib/security/data-encryption-service';

export interface GDPRComplianceData {
  id: string;
  user_id: string;
  data_type: string;
  processing_purpose: string;
  lawful_basis: string;
  data_categories: string[];
  retention_period: number;
  created_at: Date;
  updated_at: Date;
  is_active: boolean;
}

export interface DataSubjectRights {
  right_to_access: boolean;
  right_to_rectification: boolean;
  right_to_erasure: boolean;
  right_to_portability: boolean;
  right_to_object: boolean;
  right_to_restrict: boolean;
}

export interface GDPRViolation {
  id: string;
  user_id: string;
  violation_type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  detected_at: Date;
  resolved_at?: Date;
  status: 'open' | 'investigating' | 'resolved';
}

export class GDPRComplianceService {
  private supabase;
  private encryptionService: DataEncryptionService;

  constructor(supabaseClient?: any) {
    this.supabase = supabaseClient || createClient();
    this.encryptionService = new DataEncryptionService();
  }

  static create(supabaseClient?: any): GDPRComplianceService {
    return new GDPRComplianceService(supabaseClient);
  }

  /**
   * Create GDPR compliance record for data processing
   */
  async createComplianceRecord(
    userId: string,
    complianceData: Omit<
      GDPRComplianceData,
      'id' | 'user_id' | 'created_at' | 'updated_at'
    >
  ): Promise<{ success: boolean; data?: GDPRComplianceData; error?: string }> {
    try {
      const { data, error } = await this.supabase
        .from('gdpr_compliance')
        .insert({
          user_id: userId,
          ...complianceData,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select('*')
        .single();

      if (error) {
        throw new Error(
          `Failed to create GDPR compliance record: ${error.message}`
        );
      }

      return { success: true, data };
    } catch (error) {
      console.error('Error creating GDPR compliance record:', error);
      return {
        success: false,
        error: 'Failed to create GDPR compliance record',
      };
    }
  }

  /**
   * Get GDPR compliance records for a user
   */
  async getComplianceRecords(
    userId: string,
    filters: { data_type?: string; is_active?: boolean } = {}
  ): Promise<{
    success: boolean;
    data?: GDPRComplianceData[];
    error?: string;
  }> {
    try {
      let query = this.supabase
        .from('gdpr_compliance')
        .select('*')
        .eq('user_id', userId);

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
        throw new Error(
          `Failed to get GDPR compliance records: ${error.message}`
        );
      }

      return { success: true, data };
    } catch (error) {
      console.error('Error getting GDPR compliance records:', error);
      return { success: false, error: 'Failed to get GDPR compliance records' };
    }
  }

  /**
   * Update GDPR compliance record
   */
  async updateComplianceRecord(
    recordId: string,
    userId: string,
    updates: Partial<GDPRComplianceData>
  ): Promise<{ success: boolean; data?: GDPRComplianceData; error?: string }> {
    try {
      const { data, error } = await this.supabase
        .from('gdpr_compliance')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', recordId)
        .eq('user_id', userId)
        .select('*')
        .single();

      if (error) {
        throw new Error(
          `Failed to update GDPR compliance record: ${error.message}`
        );
      }

      return { success: true, data };
    } catch (error) {
      console.error('Error updating GDPR compliance record:', error);
      return {
        success: false,
        error: 'Failed to update GDPR compliance record',
      };
    }
  }

  /**
   * Get data subject rights for a user
   */
  async getDataSubjectRights(
    userId: string
  ): Promise<{ success: boolean; data?: DataSubjectRights; error?: string }> {
    try {
      const { data, error } = await this.supabase
        .from('data_subject_rights')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw new Error(`Failed to get data subject rights: ${error.message}`);
      }

      // If no record exists, create default rights
      if (!data) {
        const defaultRights: DataSubjectRights = {
          right_to_access: true,
          right_to_rectification: true,
          right_to_erasure: true,
          right_to_portability: true,
          right_to_object: true,
          right_to_restrict: true,
        };

        const { data: newRights, error: createError } = await this.supabase
          .from('data_subject_rights')
          .insert({
            user_id: userId,
            ...defaultRights,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .select('*')
          .single();

        if (createError) {
          throw new Error(
            `Failed to create data subject rights: ${createError.message}`
          );
        }

        return { success: true, data: newRights };
      }

      return { success: true, data };
    } catch (error) {
      console.error('Error getting data subject rights:', error);
      return { success: false, error: 'Failed to get data subject rights' };
    }
  }

  /**
   * Update data subject rights
   */
  async updateDataSubjectRights(
    userId: string,
    rights: Partial<DataSubjectRights>
  ): Promise<{ success: boolean; data?: DataSubjectRights; error?: string }> {
    try {
      const { data, error } = await this.supabase
        .from('data_subject_rights')
        .upsert({
          user_id: userId,
          ...rights,
          updated_at: new Date().toISOString(),
        })
        .select('*')
        .single();

      if (error) {
        throw new Error(
          `Failed to update data subject rights: ${error.message}`
        );
      }

      return { success: true, data };
    } catch (error) {
      console.error('Error updating data subject rights:', error);
      return { success: false, error: 'Failed to update data subject rights' };
    }
  }

  /**
   * Detect GDPR violations
   */
  async detectViolations(
    userId: string
  ): Promise<{ success: boolean; data?: GDPRViolation[]; error?: string }> {
    try {
      const violations: GDPRViolation[] = [];

      // Check for data processing without lawful basis
      const { data: complianceRecords } = await this.supabase
        .from('gdpr_compliance')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true);

      if (complianceRecords) {
        for (const record of complianceRecords) {
          if (!record.lawful_basis || record.lawful_basis === '') {
            violations.push({
              id: crypto.randomUUID(),
              user_id: userId,
              violation_type: 'missing_lawful_basis',
              severity: 'high',
              description: `Data processing for ${record.data_type} lacks lawful basis`,
              detected_at: new Date(),
              status: 'open',
            });
          }

          // Check retention period
          const retentionDate = new Date(record.created_at);
          retentionDate.setDate(
            retentionDate.getDate() + record.retention_period
          );

          if (new Date() > retentionDate) {
            violations.push({
              id: crypto.randomUUID(),
              user_id: userId,
              violation_type: 'data_retention_exceeded',
              severity: 'medium',
              description: `Data for ${record.data_type} has exceeded retention period`,
              detected_at: new Date(),
              status: 'open',
            });
          }
        }
      }

      // Check for missing consent records
      const { data: consentRecords } = await this.supabase
        .from('user_consent')
        .select('*')
        .eq('user_id', userId);

      if (!consentRecords || consentRecords.length === 0) {
        violations.push({
          id: crypto.randomUUID(),
          user_id: userId,
          violation_type: 'missing_consent',
          severity: 'critical',
          description: 'No consent records found for user',
          detected_at: new Date(),
          status: 'open',
        });
      }

      return { success: true, data: violations };
    } catch (error) {
      console.error('Error detecting GDPR violations:', error);
      return { success: false, error: 'Failed to detect GDPR violations' };
    }
  }

  /**
   * Log GDPR violation
   */
  async logViolation(
    violation: Omit<GDPRViolation, 'id' | 'detected_at'>
  ): Promise<{ success: boolean; data?: GDPRViolation; error?: string }> {
    try {
      const { data, error } = await this.supabase
        .from('gdpr_violations')
        .insert({
          ...violation,
          id: crypto.randomUUID(),
          detected_at: new Date().toISOString(),
        })
        .select('*')
        .single();

      if (error) {
        throw new Error(`Failed to log GDPR violation: ${error.message}`);
      }

      return { success: true, data };
    } catch (error) {
      console.error('Error logging GDPR violation:', error);
      return { success: false, error: 'Failed to log GDPR violation' };
    }
  }

  /**
   * Get GDPR compliance status
   */
  async getComplianceStatus(
    userId: string
  ): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      const [complianceRecords, violations, rights] = await Promise.all([
        this.getComplianceRecords(userId),
        this.detectViolations(userId),
        this.getDataSubjectRights(userId),
      ]);

      const status = {
        total_records: complianceRecords.data?.length || 0,
        active_records:
          complianceRecords.data?.filter(r => r.is_active).length || 0,
        violations: violations.data?.length || 0,
        critical_violations:
          violations.data?.filter(v => v.severity === 'critical').length || 0,
        rights_enabled: Object.values(rights.data || {}).filter(Boolean).length,
        compliance_score: this.calculateComplianceScore(
          complianceRecords.data || [],
          violations.data || []
        ),
      };

      return { success: true, data: status };
    } catch (error) {
      console.error('Error getting compliance status:', error);
      return { success: false, error: 'Failed to get compliance status' };
    }
  }

  /**
   * Calculate compliance score
   */
  private calculateComplianceScore(
    records: GDPRComplianceData[],
    violations: GDPRViolation[]
  ): number {
    if (records.length === 0) return 0;

    const totalChecks = records.length * 4; // 4 checks per record
    const violationPenalty = violations.reduce((penalty, violation) => {
      switch (violation.severity) {
        case 'critical':
          return penalty + 4;
        case 'high':
          return penalty + 3;
        case 'medium':
          return penalty + 2;
        case 'low':
          return penalty + 1;
        default:
          return penalty;
      }
    }, 0);

    const score = Math.max(
      0,
      ((totalChecks - violationPenalty) / totalChecks) * 100
    );
    return Math.round(score);
  }

  /**
   * Monitor GDPR compliance
   */
  async monitorCompliance(
    userId: string
  ): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      const violations = await this.detectViolations(userId);

      if (violations.data && violations.data.length > 0) {
        // Log violations
        for (const violation of violations.data) {
          await this.logViolation(violation);
        }

        // Send alerts for critical violations
        const criticalViolations = violations.data.filter(
          v => v.severity === 'critical'
        );
        if (criticalViolations.length > 0) {
          await this.sendComplianceAlert(userId, criticalViolations);
        }
      }

      return {
        success: true,
        data: { violations_detected: violations.data?.length || 0 },
      };
    } catch (error) {
      console.error('Error monitoring compliance:', error);
      return { success: false, error: 'Failed to monitor compliance' };
    }
  }

  /**
   * Send compliance alert
   */
  private async sendComplianceAlert(
    userId: string,
    violations: GDPRViolation[]
  ): Promise<void> {
    try {
      await this.supabase.from('compliance_alerts').insert({
        user_id: userId,
        alert_type: 'gdpr_violation',
        severity: 'critical',
        message: `${violations.length} critical GDPR violations detected`,
        violation_ids: violations.map(v => v.id),
        created_at: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Error sending compliance alert:', error);
    }
  }
}
