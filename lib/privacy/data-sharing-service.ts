import { createClient } from '@/lib/supabase/server';

export interface DataSharingAgreement {
  id: string;
  third_party: string;
  data_types: string[];
  purpose: string;
  consent_required: boolean;
  retention_period: number;
  security_measures: string[];
  created_at: Date;
  updated_at: Date;
  is_active: boolean;
}

export interface DataSharingRecord {
  id: string;
  user_id: string;
  agreement_id: string;
  data_shared: Record<string, any>;
  shared_at: Date;
  purpose: string;
  consent_given: boolean;
  ip_address?: string;
  user_agent?: string;
}

export interface DataSharingAnalytics {
  total_shares: number;
  shares_by_third_party: Record<string, number>;
  shares_by_purpose: Record<string, number>;
  consent_rate: number;
  recent_shares: DataSharingRecord[];
}

export class DataSharingService {
  private supabase;

  constructor(supabaseClient?: any) {
    this.supabase = supabaseClient || createClient();
  }

  static create(supabaseClient?: any): DataSharingService {
    return new DataSharingService(supabaseClient);
  }

  /**
   * Create data sharing agreement
   */
  async createSharingAgreement(
    agreementData: Omit<
      DataSharingAgreement,
      'id' | 'created_at' | 'updated_at'
    >
  ): Promise<{
    success: boolean;
    data?: DataSharingAgreement;
    error?: string;
  }> {
    try {
      const { data, error } = await this.supabase
        .from('data_sharing_agreements')
        .insert({
          ...agreementData,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select('*')
        .single();

      if (error) {
        throw new Error(
          `Failed to create data sharing agreement: ${error.message}`
        );
      }

      return { success: true, data };
    } catch (error) {
      console.error('Error creating data sharing agreement:', error);
      return {
        success: false,
        error: 'Failed to create data sharing agreement',
      };
    }
  }

  /**
   * Get data sharing agreements
   */
  async getSharingAgreements(
    filters: { third_party?: string; is_active?: boolean } = {}
  ): Promise<{
    success: boolean;
    data?: DataSharingAgreement[];
    error?: string;
  }> {
    try {
      let query = this.supabase.from('data_sharing_agreements').select('*');

      if (filters.third_party) {
        query = query.eq('third_party', filters.third_party);
      }

      if (filters.is_active !== undefined) {
        query = query.eq('is_active', filters.is_active);
      }

      const { data, error } = await query.order('created_at', {
        ascending: false,
      });

      if (error) {
        throw new Error(
          `Failed to get data sharing agreements: ${error.message}`
        );
      }

      return { success: true, data };
    } catch (error) {
      console.error('Error getting data sharing agreements:', error);
      return { success: false, error: 'Failed to get data sharing agreements' };
    }
  }

  /**
   * Update data sharing agreement
   */
  async updateSharingAgreement(
    agreementId: string,
    updates: Partial<DataSharingAgreement>
  ): Promise<{
    success: boolean;
    data?: DataSharingAgreement;
    error?: string;
  }> {
    try {
      const { data, error } = await this.supabase
        .from('data_sharing_agreements')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', agreementId)
        .select('*')
        .single();

      if (error) {
        throw new Error(
          `Failed to update data sharing agreement: ${error.message}`
        );
      }

      return { success: true, data };
    } catch (error) {
      console.error('Error updating data sharing agreement:', error);
      return {
        success: false,
        error: 'Failed to update data sharing agreement',
      };
    }
  }

  /**
   * Delete data sharing agreement
   */
  async deleteSharingAgreement(
    agreementId: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await this.supabase
        .from('data_sharing_agreements')
        .delete()
        .eq('id', agreementId);

      if (error) {
        throw new Error(
          `Failed to delete data sharing agreement: ${error.message}`
        );
      }

      return { success: true };
    } catch (error) {
      console.error('Error deleting data sharing agreement:', error);
      return {
        success: false,
        error: 'Failed to delete data sharing agreement',
      };
    }
  }

  /**
   * Record data sharing
   */
  async recordDataSharing(
    userId: string,
    agreementId: string,
    dataShared: Record<string, any>,
    metadata?: { ip_address?: string; user_agent?: string }
  ): Promise<{ success: boolean; data?: DataSharingRecord; error?: string }> {
    try {
      // Get agreement details
      const { data: agreement, error: agreementError } = await this.supabase
        .from('data_sharing_agreements')
        .select('*')
        .eq('id', agreementId)
        .eq('is_active', true)
        .single();

      if (agreementError || !agreement) {
        return { success: false, error: 'Data sharing agreement not found' };
      }

      // Check if consent is required
      if (agreement.consent_required) {
        const { data: consent } = await this.supabase
          .from('user_consent')
          .select('*')
          .eq('user_id', userId)
          .eq('consent_type', 'data_sharing')
          .eq('granted', true)
          .single();

        if (!consent) {
          return { success: false, error: 'Consent required for data sharing' };
        }
      }

      const { data, error } = await this.supabase
        .from('data_sharing_records')
        .insert({
          user_id: userId,
          agreement_id: agreementId,
          data_shared: dataShared,
          shared_at: new Date().toISOString(),
          purpose: agreement.purpose,
          consent_given: agreement.consent_required,
          ip_address: metadata?.ip_address,
          user_agent: metadata?.user_agent,
        })
        .select('*')
        .single();

      if (error) {
        throw new Error(`Failed to record data sharing: ${error.message}`);
      }

      return { success: true, data };
    } catch (error) {
      console.error('Error recording data sharing:', error);
      return { success: false, error: 'Failed to record data sharing' };
    }
  }

  /**
   * Get user's data sharing history
   */
  async getUserSharingHistory(
    userId: string,
    filters: { third_party?: string; purpose?: string } = {}
  ): Promise<{ success: boolean; data?: DataSharingRecord[]; error?: string }> {
    try {
      let query = this.supabase
        .from('data_sharing_records')
        .select(
          `
          *,
          data_sharing_agreements (
            third_party,
            data_types,
            security_measures
          )
        `
        )
        .eq('user_id', userId);

      if (filters.third_party) {
        query = query.eq(
          'data_sharing_agreements.third_party',
          filters.third_party
        );
      }

      if (filters.purpose) {
        query = query.eq('purpose', filters.purpose);
      }

      const { data, error } = await query.order('shared_at', {
        ascending: false,
      });

      if (error) {
        throw new Error(`Failed to get user sharing history: ${error.message}`);
      }

      return { success: true, data };
    } catch (error) {
      console.error('Error getting user sharing history:', error);
      return { success: false, error: 'Failed to get user sharing history' };
    }
  }

  /**
   * Get data sharing analytics
   */
  async getSharingAnalytics(
    filters: { start_date?: Date; end_date?: Date } = {}
  ): Promise<{
    success: boolean;
    data?: DataSharingAnalytics;
    error?: string;
  }> {
    try {
      let query = this.supabase.from('data_sharing_records').select(`
          *,
          data_sharing_agreements (
            third_party,
            purpose
          )
        `);

      if (filters.start_date) {
        query = query.gte('shared_at', filters.start_date.toISOString());
      }

      if (filters.end_date) {
        query = query.lte('shared_at', filters.end_date.toISOString());
      }

      const { data: shares, error } = await query.order('shared_at', {
        ascending: false,
      });

      if (error) {
        throw new Error(
          `Failed to get data sharing analytics: ${error.message}`
        );
      }

      const analytics: DataSharingAnalytics = {
        total_shares: shares?.length || 0,
        shares_by_third_party: {},
        shares_by_purpose: {},
        consent_rate: 0,
        recent_shares: shares?.slice(0, 10) || [],
      };

      if (analytics.total_shares > 0) {
        // Calculate consent rate
        const consentsGiven = shares?.filter(s => s.consent_given).length || 0;
        analytics.consent_rate = Math.round(
          (consentsGiven / analytics.total_shares) * 100
        );

        // Group by third party
        shares?.forEach(share => {
          const thirdParty =
            share.data_sharing_agreements?.third_party || 'Unknown';
          analytics.shares_by_third_party[thirdParty] =
            (analytics.shares_by_third_party[thirdParty] || 0) + 1;
        });

        // Group by purpose
        shares?.forEach(share => {
          analytics.shares_by_purpose[share.purpose] =
            (analytics.shares_by_purpose[share.purpose] || 0) + 1;
        });
      }

      return { success: true, data: analytics };
    } catch (error) {
      console.error('Error getting data sharing analytics:', error);
      return { success: false, error: 'Failed to get data sharing analytics' };
    }
  }

  /**
   * Monitor data sharing compliance
   */
  async monitorSharingCompliance(): Promise<{
    success: boolean;
    data?: any;
    error?: string;
  }> {
    try {
      const [agreements, analytics] = await Promise.all([
        this.getSharingAgreements({ is_active: true }),
        this.getSharingAnalytics(),
      ]);

      if (!agreements.success || !analytics.success) {
        return { success: false, error: 'Failed to get sharing data' };
      }

      const compliance = {
        total_agreements: agreements.data?.length || 0,
        active_agreements:
          agreements.data?.filter(a => a.is_active).length || 0,
        total_shares: analytics.data?.total_shares || 0,
        consent_rate: analytics.data?.consent_rate || 0,
        compliance_score: this.calculateComplianceScore(
          agreements.data,
          analytics.data
        ),
      };

      return { success: true, data: compliance };
    } catch (error) {
      console.error('Error monitoring sharing compliance:', error);
      return { success: false, error: 'Failed to monitor sharing compliance' };
    }
  }

  /**
   * Calculate compliance score
   */
  private calculateComplianceScore(
    agreements: DataSharingAgreement[],
    analytics: DataSharingAnalytics
  ): number {
    if (agreements.length === 0) return 0;

    const activeAgreements = agreements.filter(a => a.is_active);
    const consentRequiredAgreements = activeAgreements.filter(
      a => a.consent_required
    );

    if (consentRequiredAgreements.length === 0) return 100;

    const complianceScore = (analytics.consent_rate / 100) * 100;
    return Math.round(complianceScore);
  }

  /**
   * Revoke data sharing
   */
  async revokeDataSharing(
    userId: string,
    agreementId: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Check if user has shared data with this agreement
      const { data: sharingRecord } = await this.supabase
        .from('data_sharing_records')
        .select('*')
        .eq('user_id', userId)
        .eq('agreement_id', agreementId)
        .single();

      if (!sharingRecord) {
        return { success: false, error: 'No data sharing record found' };
      }

      // Create revocation record
      await this.supabase.from('data_sharing_revocations').insert({
        user_id: userId,
        agreement_id: agreementId,
        revoked_at: new Date().toISOString(),
        reason: 'User requested revocation',
      });

      return { success: true };
    } catch (error) {
      console.error('Error revoking data sharing:', error);
      return { success: false, error: 'Failed to revoke data sharing' };
    }
  }

  /**
   * Get third-party integrations
   */
  async getThirdPartyIntegrations(): Promise<{
    success: boolean;
    data?: any[];
    error?: string;
  }> {
    try {
      const { data, error } = await this.supabase
        .from('third_party_integrations')
        .select('*')
        .order('name', { ascending: true });

      if (error) {
        throw new Error(
          `Failed to get third-party integrations: ${error.message}`
        );
      }

      return { success: true, data };
    } catch (error) {
      console.error('Error getting third-party integrations:', error);
      return {
        success: false,
        error: 'Failed to get third-party integrations',
      };
    }
  }

  /**
   * Monitor third-party integrations
   */
  async monitorThirdPartyIntegrations(): Promise<{
    success: boolean;
    data?: any;
    error?: string;
  }> {
    try {
      const [integrations, agreements] = await Promise.all([
        this.getThirdPartyIntegrations(),
        this.getSharingAgreements({ is_active: true }),
      ]);

      if (!integrations.success || !agreements.success) {
        return { success: false, error: 'Failed to get integration data' };
      }

      const monitoring = {
        total_integrations: integrations.data?.length || 0,
        active_integrations:
          integrations.data?.filter(i => i.is_active).length || 0,
        total_agreements: agreements.data?.length || 0,
        active_agreements:
          agreements.data?.filter(a => a.is_active).length || 0,
        compliance_status: this.checkIntegrationCompliance(
          integrations.data,
          agreements.data
        ),
      };

      return { success: true, data: monitoring };
    } catch (error) {
      console.error('Error monitoring third-party integrations:', error);
      return {
        success: false,
        error: 'Failed to monitor third-party integrations',
      };
    }
  }

  /**
   * Check integration compliance
   */
  private checkIntegrationCompliance(
    integrations: any[],
    agreements: DataSharingAgreement[]
  ): string {
    const activeIntegrations = integrations.filter(i => i.is_active);
    const activeAgreements = agreements.filter(a => a.is_active);

    if (activeIntegrations.length === 0) return 'no_integrations';
    if (activeAgreements.length === 0) return 'no_agreements';
    if (activeIntegrations.length === activeAgreements.length)
      return 'compliant';
    return 'non_compliant';
  }

  /**
   * Get data sharing report
   */
  async getSharingReport(
    userId: string
  ): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      const [history, analytics] = await Promise.all([
        this.getUserSharingHistory(userId),
        this.getSharingAnalytics(),
      ]);

      if (!history.success || !analytics.success) {
        return { success: false, error: 'Failed to get sharing data' };
      }

      const report = {
        user_shares: history.data?.length || 0,
        total_shares: analytics.data?.total_shares || 0,
        consent_rate: analytics.data?.consent_rate || 0,
        shares_by_third_party: analytics.data?.shares_by_third_party || {},
        shares_by_purpose: analytics.data?.shares_by_purpose || {},
        recent_shares: history.data?.slice(0, 5) || [],
      };

      return { success: true, data: report };
    } catch (error) {
      console.error('Error getting sharing report:', error);
      return { success: false, error: 'Failed to get sharing report' };
    }
  }
}
