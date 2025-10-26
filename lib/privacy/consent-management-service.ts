import { createClient } from '@/lib/supabase/server';

export interface UserConsent {
  id: string;
  user_id: string;
  consent_type: string;
  granted: boolean;
  granted_at?: Date;
  withdrawn_at?: Date;
  purpose: string;
  data_categories: string[];
  retention_period: number;
  created_at: Date;
  updated_at: Date;
}

export interface ConsentCollection {
  id: string;
  user_id: string;
  consent_data: Record<string, any>;
  ip_address?: string;
  user_agent?: string;
  created_at: Date;
  updated_at: Date;
}

export interface ConsentAnalytics {
  total_consents: number;
  granted_consents: number;
  withdrawn_consents: number;
  consent_rate: number;
  by_type: Record<string, number>;
  by_purpose: Record<string, number>;
}

export class ConsentManagementService {
  private supabase;

  constructor(supabaseClient?: any) {
    this.supabase = supabaseClient || createClient();
  }

  static create(supabaseClient?: any): ConsentManagementService {
    return new ConsentManagementService(supabaseClient);
  }

  /**
   * Create user consent
   */
  async createConsent(
    userId: string,
    consentData: Omit<
      UserConsent,
      'id' | 'user_id' | 'created_at' | 'updated_at'
    >
  ): Promise<{ success: boolean; data?: UserConsent; error?: string }> {
    try {
      const { data, error } = await this.supabase
        .from('user_consent')
        .insert({
          user_id: userId,
          ...consentData,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select('*')
        .single();

      if (error) {
        throw new Error(`Failed to create user consent: ${error.message}`);
      }

      return { success: true, data };
    } catch (error) {
      console.error('Error creating user consent:', error);
      return { success: false, error: 'Failed to create user consent' };
    }
  }

  /**
   * Get user consents
   */
  async getUserConsents(
    userId: string,
    filters: { consent_type?: string; granted?: boolean } = {}
  ): Promise<{ success: boolean; data?: UserConsent[]; error?: string }> {
    try {
      let query = this.supabase
        .from('user_consent')
        .select('*')
        .eq('user_id', userId);

      if (filters.consent_type) {
        query = query.eq('consent_type', filters.consent_type);
      }

      if (filters.granted !== undefined) {
        query = query.eq('granted', filters.granted);
      }

      const { data, error } = await query.order('created_at', {
        ascending: false,
      });

      if (error) {
        throw new Error(`Failed to get user consents: ${error.message}`);
      }

      return { success: true, data };
    } catch (error) {
      console.error('Error getting user consents:', error);
      return { success: false, error: 'Failed to get user consents' };
    }
  }

  /**
   * Update user consent
   */
  async updateConsent(
    consentId: string,
    userId: string,
    updates: Partial<UserConsent>
  ): Promise<{ success: boolean; data?: UserConsent; error?: string }> {
    try {
      const { data, error } = await this.supabase
        .from('user_consent')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', consentId)
        .eq('user_id', userId)
        .select('*')
        .single();

      if (error) {
        throw new Error(`Failed to update user consent: ${error.message}`);
      }

      return { success: true, data };
    } catch (error) {
      console.error('Error updating user consent:', error);
      return { success: false, error: 'Failed to update user consent' };
    }
  }

  /**
   * Grant consent
   */
  async grantConsent(
    userId: string,
    consentType: string,
    purpose: string,
    dataCategories: string[],
    retentionPeriod: number,
    metadata?: { ip_address?: string; user_agent?: string }
  ): Promise<{ success: boolean; data?: UserConsent; error?: string }> {
    try {
      // Check if consent already exists
      const { data: existingConsent } = await this.supabase
        .from('user_consent')
        .select('*')
        .eq('user_id', userId)
        .eq('consent_type', consentType)
        .single();

      if (existingConsent) {
        // Update existing consent
        return await this.updateConsent(existingConsent.id, userId, {
          granted: true,
          granted_at: new Date(),
          withdrawn_at: null,
          purpose,
          data_categories: dataCategories,
          retention_period: retentionPeriod,
        });
      } else {
        // Create new consent
        return await this.createConsent(userId, {
          consent_type: consentType,
          granted: true,
          granted_at: new Date(),
          purpose,
          data_categories: dataCategories,
          retention_period: retentionPeriod,
        });
      }
    } catch (error) {
      console.error('Error granting consent:', error);
      return { success: false, error: 'Failed to grant consent' };
    }
  }

  /**
   * Withdraw consent
   */
  async withdrawConsent(
    userId: string,
    consentType: string
  ): Promise<{ success: boolean; data?: UserConsent; error?: string }> {
    try {
      const { data: consent } = await this.supabase
        .from('user_consent')
        .select('*')
        .eq('user_id', userId)
        .eq('consent_type', consentType)
        .single();

      if (!consent) {
        return { success: false, error: 'Consent not found' };
      }

      return await this.updateConsent(consent.id, userId, {
        granted: false,
        withdrawn_at: new Date(),
      });
    } catch (error) {
      console.error('Error withdrawing consent:', error);
      return { success: false, error: 'Failed to withdraw consent' };
    }
  }

  /**
   * Check if user has granted consent
   */
  async hasConsent(
    userId: string,
    consentType: string
  ): Promise<{ success: boolean; data?: boolean; error?: string }> {
    try {
      const { data, error } = await this.supabase
        .from('user_consent')
        .select('granted')
        .eq('user_id', userId)
        .eq('consent_type', consentType)
        .eq('granted', true)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw new Error(`Failed to check consent: ${error.message}`);
      }

      return { success: true, data: !!data };
    } catch (error) {
      console.error('Error checking consent:', error);
      return { success: false, error: 'Failed to check consent' };
    }
  }

  /**
   * Collect consent data
   */
  async collectConsent(
    userId: string,
    consentData: Record<string, any>,
    metadata?: { ip_address?: string; user_agent?: string }
  ): Promise<{ success: boolean; data?: ConsentCollection; error?: string }> {
    try {
      const { data, error } = await this.supabase
        .from('consent_collection')
        .insert({
          user_id: userId,
          consent_data: consentData,
          ip_address: metadata?.ip_address,
          user_agent: metadata?.user_agent,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select('*')
        .single();

      if (error) {
        throw new Error(`Failed to collect consent: ${error.message}`);
      }

      return { success: true, data };
    } catch (error) {
      console.error('Error collecting consent:', error);
      return { success: false, error: 'Failed to collect consent' };
    }
  }

  /**
   * Get consent analytics
   */
  async getConsentAnalytics(
    filters: { start_date?: Date; end_date?: Date } = {}
  ): Promise<{ success: boolean; data?: ConsentAnalytics; error?: string }> {
    try {
      let query = this.supabase.from('user_consent').select('*');

      if (filters.start_date) {
        query = query.gte('created_at', filters.start_date.toISOString());
      }

      if (filters.end_date) {
        query = query.lte('created_at', filters.end_date.toISOString());
      }

      const { data: consents, error } = await query;

      if (error) {
        throw new Error(`Failed to get consent analytics: ${error.message}`);
      }

      const analytics: ConsentAnalytics = {
        total_consents: consents?.length || 0,
        granted_consents: consents?.filter(c => c.granted).length || 0,
        withdrawn_consents: consents?.filter(c => !c.granted).length || 0,
        consent_rate: 0,
        by_type: {},
        by_purpose: {},
      };

      if (analytics.total_consents > 0) {
        analytics.consent_rate = Math.round(
          (analytics.granted_consents / analytics.total_consents) * 100
        );

        // Group by consent type
        consents?.forEach(consent => {
          analytics.by_type[consent.consent_type] =
            (analytics.by_type[consent.consent_type] || 0) + 1;
        });

        // Group by purpose
        consents?.forEach(consent => {
          analytics.by_purpose[consent.purpose] =
            (analytics.by_purpose[consent.purpose] || 0) + 1;
        });
      }

      return { success: true, data: analytics };
    } catch (error) {
      console.error('Error getting consent analytics:', error);
      return { success: false, error: 'Failed to get consent analytics' };
    }
  }

  /**
   * Monitor consent compliance
   */
  async monitorConsentCompliance(
    userId: string
  ): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      const [consents, analytics] = await Promise.all([
        this.getUserConsents(userId),
        this.getConsentAnalytics(),
      ]);

      const compliance = {
        total_consents: consents.data?.length || 0,
        active_consents: consents.data?.filter(c => c.granted).length || 0,
        expired_consents:
          consents.data?.filter(c => {
            if (!c.granted || !c.granted_at) return false;
            const expiryDate = new Date(c.granted_at);
            expiryDate.setDate(expiryDate.getDate() + c.retention_period);
            return new Date() > expiryDate;
          }).length || 0,
        compliance_score: this.calculateComplianceScore(consents.data || []),
      };

      return { success: true, data: compliance };
    } catch (error) {
      console.error('Error monitoring consent compliance:', error);
      return { success: false, error: 'Failed to monitor consent compliance' };
    }
  }

  /**
   * Calculate compliance score
   */
  private calculateComplianceScore(consents: UserConsent[]): number {
    if (consents.length === 0) return 0;

    const activeConsents = consents.filter(c => c.granted);
    const expiredConsents = activeConsents.filter(c => {
      if (!c.granted_at) return false;
      const expiryDate = new Date(c.granted_at);
      expiryDate.setDate(expiryDate.getDate() + c.retention_period);
      return new Date() > expiryDate;
    });

    const score = Math.max(
      0,
      ((activeConsents.length - expiredConsents.length) / consents.length) * 100
    );
    return Math.round(score);
  }

  /**
   * Get consent history for a user
   */
  async getConsentHistory(
    userId: string
  ): Promise<{ success: boolean; data?: UserConsent[]; error?: string }> {
    try {
      const { data, error } = await this.supabase
        .from('user_consent')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        throw new Error(`Failed to get consent history: ${error.message}`);
      }

      return { success: true, data };
    } catch (error) {
      console.error('Error getting consent history:', error);
      return { success: false, error: 'Failed to get consent history' };
    }
  }

  /**
   * Renew consent
   */
  async renewConsent(
    userId: string,
    consentType: string,
    newRetentionPeriod: number
  ): Promise<{ success: boolean; data?: UserConsent; error?: string }> {
    try {
      const { data: consent } = await this.supabase
        .from('user_consent')
        .select('*')
        .eq('user_id', userId)
        .eq('consent_type', consentType)
        .single();

      if (!consent) {
        return { success: false, error: 'Consent not found' };
      }

      return await this.updateConsent(consent.id, userId, {
        granted: true,
        granted_at: new Date(),
        withdrawn_at: null,
        retention_period: newRetentionPeriod,
      });
    } catch (error) {
      console.error('Error renewing consent:', error);
      return { success: false, error: 'Failed to renew consent' };
    }
  }

  /**
   * Bulk consent operations
   */
  async bulkConsentOperation(
    userId: string,
    operations: Array<{
      consent_type: string;
      action: 'grant' | 'withdraw';
      purpose?: string;
      data_categories?: string[];
      retention_period?: number;
    }>
  ): Promise<{ success: boolean; data?: UserConsent[]; error?: string }> {
    try {
      const results: UserConsent[] = [];

      for (const operation of operations) {
        if (operation.action === 'grant') {
          const result = await this.grantConsent(
            userId,
            operation.consent_type,
            operation.purpose || '',
            operation.data_categories || [],
            operation.retention_period || 365
          );
          if (result.success && result.data) {
            results.push(result.data);
          }
        } else if (operation.action === 'withdraw') {
          const result = await this.withdrawConsent(
            userId,
            operation.consent_type
          );
          if (result.success && result.data) {
            results.push(result.data);
          }
        }
      }

      return { success: true, data: results };
    } catch (error) {
      console.error('Error performing bulk consent operations:', error);
      return {
        success: false,
        error: 'Failed to perform bulk consent operations',
      };
    }
  }
}
