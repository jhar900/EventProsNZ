import { createClient } from '@/lib/supabase/server';

export interface PrivacyPolicy {
  id: string;
  version: string;
  content: string;
  effective_date: Date;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface PrivacyPolicyAcceptance {
  id: string;
  user_id: string;
  policy_id: string;
  accepted_at: Date;
  ip_address?: string;
  user_agent?: string;
}

export interface DataHandlingProcedure {
  id: string;
  data_type: string;
  purpose: string;
  retention_period: number;
  security_measures: string[];
  access_controls: string[];
  created_at: Date;
  updated_at: Date;
}

export class PrivacyPolicyService {
  private supabase;

  constructor(supabaseClient?: any) {
    this.supabase = supabaseClient || createClient();
  }

  static create(supabaseClient?: any): PrivacyPolicyService {
    return new PrivacyPolicyService(supabaseClient);
  }

  /**
   * Create a new privacy policy
   */
  async createPrivacyPolicy(
    policyData: Omit<PrivacyPolicy, 'id' | 'created_at' | 'updated_at'>
  ): Promise<{ success: boolean; data?: PrivacyPolicy; error?: string }> {
    try {
      // Deactivate existing policies
      await this.supabase
        .from('privacy_policies')
        .update({ is_active: false })
        .eq('is_active', true);

      const { data, error } = await this.supabase
        .from('privacy_policies')
        .insert({
          ...policyData,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select('*')
        .single();

      if (error) {
        throw new Error(`Failed to create privacy policy: ${error.message}`);
      }

      return { success: true, data };
    } catch (error) {
      console.error('Error creating privacy policy:', error);
      return { success: false, error: 'Failed to create privacy policy' };
    }
  }

  /**
   * Get current active privacy policy
   */
  async getCurrentPolicy(): Promise<{
    success: boolean;
    data?: PrivacyPolicy;
    error?: string;
  }> {
    try {
      const { data, error } = await this.supabase
        .from('privacy_policies')
        .select('*')
        .eq('is_active', true)
        .order('effective_date', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw new Error(
          `Failed to get current privacy policy: ${error.message}`
        );
      }

      return { success: true, data: data || null };
    } catch (error) {
      console.error('Error getting current privacy policy:', error);
      return { success: false, error: 'Failed to get current privacy policy' };
    }
  }

  /**
   * Get privacy policy by version
   */
  async getPolicyByVersion(
    version: string
  ): Promise<{ success: boolean; data?: PrivacyPolicy; error?: string }> {
    try {
      const { data, error } = await this.supabase
        .from('privacy_policies')
        .select('*')
        .eq('version', version)
        .single();

      if (error) {
        throw new Error(`Failed to get privacy policy: ${error.message}`);
      }

      return { success: true, data };
    } catch (error) {
      console.error('Error getting privacy policy by version:', error);
      return { success: false, error: 'Failed to get privacy policy' };
    }
  }

  /**
   * Get all privacy policies
   */
  async getAllPolicies(): Promise<{
    success: boolean;
    data?: PrivacyPolicy[];
    error?: string;
  }> {
    try {
      const { data, error } = await this.supabase
        .from('privacy_policies')
        .select('*')
        .order('effective_date', { ascending: false });

      if (error) {
        throw new Error(`Failed to get privacy policies: ${error.message}`);
      }

      return { success: true, data };
    } catch (error) {
      console.error('Error getting privacy policies:', error);
      return { success: false, error: 'Failed to get privacy policies' };
    }
  }

  /**
   * Update privacy policy
   */
  async updatePrivacyPolicy(
    policyId: string,
    updates: Partial<PrivacyPolicy>
  ): Promise<{ success: boolean; data?: PrivacyPolicy; error?: string }> {
    try {
      const { data, error } = await this.supabase
        .from('privacy_policies')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', policyId)
        .select('*')
        .single();

      if (error) {
        throw new Error(`Failed to update privacy policy: ${error.message}`);
      }

      return { success: true, data };
    } catch (error) {
      console.error('Error updating privacy policy:', error);
      return { success: false, error: 'Failed to update privacy policy' };
    }
  }

  /**
   * Record privacy policy acceptance
   */
  async recordAcceptance(
    userId: string,
    policyId: string,
    metadata?: { ip_address?: string; user_agent?: string }
  ): Promise<{
    success: boolean;
    data?: PrivacyPolicyAcceptance;
    error?: string;
  }> {
    try {
      const { data, error } = await this.supabase
        .from('privacy_policy_acceptance')
        .insert({
          user_id: userId,
          policy_id: policyId,
          accepted_at: new Date().toISOString(),
          ip_address: metadata?.ip_address,
          user_agent: metadata?.user_agent,
        })
        .select('*')
        .single();

      if (error) {
        throw new Error(
          `Failed to record privacy policy acceptance: ${error.message}`
        );
      }

      return { success: true, data };
    } catch (error) {
      console.error('Error recording privacy policy acceptance:', error);
      return {
        success: false,
        error: 'Failed to record privacy policy acceptance',
      };
    }
  }

  /**
   * Get user's privacy policy acceptance history
   */
  async getUserAcceptanceHistory(
    userId: string
  ): Promise<{
    success: boolean;
    data?: PrivacyPolicyAcceptance[];
    error?: string;
  }> {
    try {
      const { data, error } = await this.supabase
        .from('privacy_policy_acceptance')
        .select(
          `
          *,
          privacy_policies (
            version,
            effective_date,
            content
          )
        `
        )
        .eq('user_id', userId)
        .order('accepted_at', { ascending: false });

      if (error) {
        throw new Error(
          `Failed to get user acceptance history: ${error.message}`
        );
      }

      return { success: true, data };
    } catch (error) {
      console.error('Error getting user acceptance history:', error);
      return { success: false, error: 'Failed to get user acceptance history' };
    }
  }

  /**
   * Check if user has accepted current policy
   */
  async hasUserAcceptedCurrentPolicy(
    userId: string
  ): Promise<{ success: boolean; data?: boolean; error?: string }> {
    try {
      // Get current policy
      const currentPolicy = await this.getCurrentPolicy();
      if (!currentPolicy.success || !currentPolicy.data) {
        return { success: true, data: false };
      }

      // Check if user has accepted current policy
      const { data, error } = await this.supabase
        .from('privacy_policy_acceptance')
        .select('id')
        .eq('user_id', userId)
        .eq('policy_id', currentPolicy.data.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw new Error(`Failed to check policy acceptance: ${error.message}`);
      }

      return { success: true, data: !!data };
    } catch (error) {
      console.error('Error checking policy acceptance:', error);
      return { success: false, error: 'Failed to check policy acceptance' };
    }
  }

  /**
   * Create data handling procedure
   */
  async createDataHandlingProcedure(
    procedureData: Omit<
      DataHandlingProcedure,
      'id' | 'created_at' | 'updated_at'
    >
  ): Promise<{
    success: boolean;
    data?: DataHandlingProcedure;
    error?: string;
  }> {
    try {
      const { data, error } = await this.supabase
        .from('data_handling_procedures')
        .insert({
          ...procedureData,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select('*')
        .single();

      if (error) {
        throw new Error(
          `Failed to create data handling procedure: ${error.message}`
        );
      }

      return { success: true, data };
    } catch (error) {
      console.error('Error creating data handling procedure:', error);
      return {
        success: false,
        error: 'Failed to create data handling procedure',
      };
    }
  }

  /**
   * Get data handling procedures
   */
  async getDataHandlingProcedures(): Promise<{
    success: boolean;
    data?: DataHandlingProcedure[];
    error?: string;
  }> {
    try {
      const { data, error } = await this.supabase
        .from('data_handling_procedures')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        throw new Error(
          `Failed to get data handling procedures: ${error.message}`
        );
      }

      return { success: true, data };
    } catch (error) {
      console.error('Error getting data handling procedures:', error);
      return {
        success: false,
        error: 'Failed to get data handling procedures',
      };
    }
  }

  /**
   * Update data handling procedure
   */
  async updateDataHandlingProcedure(
    procedureId: string,
    updates: Partial<DataHandlingProcedure>
  ): Promise<{
    success: boolean;
    data?: DataHandlingProcedure;
    error?: string;
  }> {
    try {
      const { data, error } = await this.supabase
        .from('data_handling_procedures')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', procedureId)
        .select('*')
        .single();

      if (error) {
        throw new Error(
          `Failed to update data handling procedure: ${error.message}`
        );
      }

      return { success: true, data };
    } catch (error) {
      console.error('Error updating data handling procedure:', error);
      return {
        success: false,
        error: 'Failed to update data handling procedure',
      };
    }
  }

  /**
   * Get privacy policy analytics
   */
  async getPolicyAnalytics(): Promise<{
    success: boolean;
    data?: any;
    error?: string;
  }> {
    try {
      const [policies, acceptances, procedures] = await Promise.all([
        this.getAllPolicies(),
        this.supabase.from('privacy_policy_acceptance').select('*'),
        this.getDataHandlingProcedures(),
      ]);

      const analytics = {
        total_policies: policies.data?.length || 0,
        active_policy: policies.data?.find(p => p.is_active),
        total_acceptances: acceptances.data?.length || 0,
        acceptance_rate: this.calculateAcceptanceRate(acceptances.data || []),
        total_procedures: procedures.data?.length || 0,
        recent_acceptances: acceptances.data?.slice(0, 10) || [],
      };

      return { success: true, data: analytics };
    } catch (error) {
      console.error('Error getting privacy policy analytics:', error);
      return {
        success: false,
        error: 'Failed to get privacy policy analytics',
      };
    }
  }

  /**
   * Calculate acceptance rate
   */
  private calculateAcceptanceRate(
    acceptances: PrivacyPolicyAcceptance[]
  ): number {
    if (acceptances.length === 0) return 0;

    const uniqueUsers = new Set(acceptances.map(a => a.user_id));
    const totalUsers = uniqueUsers.size;
    const acceptanceCount = acceptances.length;

    return Math.round((acceptanceCount / totalUsers) * 100);
  }

  /**
   * Notify users of policy updates
   */
  async notifyPolicyUpdate(
    policyId: string,
    notificationType: 'new' | 'updated' = 'updated'
  ): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      const { data: policy } = await this.getPolicyByVersion(policyId);
      if (!policy) {
        return { success: false, error: 'Policy not found' };
      }

      // Create notification for all users
      const { data: users } = await this.supabase
        .from('users')
        .select('id, email');

      if (users) {
        const notifications = users.map(user => ({
          user_id: user.id,
          type: 'privacy_policy_update',
          title: `Privacy Policy ${notificationType === 'new' ? 'Published' : 'Updated'}`,
          message: `Our privacy policy has been ${notificationType}. Please review and accept the updated terms.`,
          data: { policy_id: policyId, policy_version: policy.version },
          created_at: new Date().toISOString(),
        }));

        await this.supabase.from('notifications').insert(notifications);
      }

      return { success: true, data: { users_notified: users?.length || 0 } };
    } catch (error) {
      console.error('Error notifying policy update:', error);
      return { success: false, error: 'Failed to notify policy update' };
    }
  }
}
