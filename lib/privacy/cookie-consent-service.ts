import { createClient } from '@/lib/supabase/server';

export interface CookieConsent {
  id: string;
  user_id: string;
  consent_data: Record<string, any>;
  ip_address?: string;
  user_agent?: string;
  created_at: Date;
  updated_at: Date;
}

export interface CookieCategory {
  id: string;
  name: string;
  description: string;
  required: boolean;
  cookies: string[];
  created_at: Date;
  updated_at: Date;
}

export interface CookiePreferences {
  necessary: boolean;
  functional: boolean;
  analytics: boolean;
  marketing: boolean;
  preferences: boolean;
}

export interface CookieAnalytics {
  total_consents: number;
  consent_rate: number;
  by_category: Record<string, number>;
  recent_consents: CookieConsent[];
}

export class CookieConsentService {
  private supabase;

  constructor(supabaseClient?: any) {
    this.supabase = supabaseClient || createClient();
  }

  static create(supabaseClient?: any): CookieConsentService {
    return new CookieConsentService(supabaseClient);
  }

  /**
   * Create cookie category
   */
  async createCookieCategory(
    categoryData: Omit<CookieCategory, 'id' | 'created_at' | 'updated_at'>
  ): Promise<{ success: boolean; data?: CookieCategory; error?: string }> {
    try {
      const { data, error } = await this.supabase
        .from('cookie_categories')
        .insert({
          ...categoryData,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select('*')
        .single();

      if (error) {
        throw new Error(`Failed to create cookie category: ${error.message}`);
      }

      return { success: true, data };
    } catch (error) {
      console.error('Error creating cookie category:', error);
      return { success: false, error: 'Failed to create cookie category' };
    }
  }

  /**
   * Get cookie categories
   */
  async getCookieCategories(): Promise<{
    success: boolean;
    data?: CookieCategory[];
    error?: string;
  }> {
    try {
      const { data, error } = await this.supabase
        .from('cookie_categories')
        .select('*')
        .order('name', { ascending: true });

      if (error) {
        throw new Error(`Failed to get cookie categories: ${error.message}`);
      }

      return { success: true, data };
    } catch (error) {
      console.error('Error getting cookie categories:', error);
      return { success: false, error: 'Failed to get cookie categories' };
    }
  }

  /**
   * Update cookie category
   */
  async updateCookieCategory(
    categoryId: string,
    updates: Partial<CookieCategory>
  ): Promise<{ success: boolean; data?: CookieCategory; error?: string }> {
    try {
      const { data, error } = await this.supabase
        .from('cookie_categories')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', categoryId)
        .select('*')
        .single();

      if (error) {
        throw new Error(`Failed to update cookie category: ${error.message}`);
      }

      return { success: true, data };
    } catch (error) {
      console.error('Error updating cookie category:', error);
      return { success: false, error: 'Failed to update cookie category' };
    }
  }

  /**
   * Delete cookie category
   */
  async deleteCookieCategory(
    categoryId: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await this.supabase
        .from('cookie_categories')
        .delete()
        .eq('id', categoryId);

      if (error) {
        throw new Error(`Failed to delete cookie category: ${error.message}`);
      }

      return { success: true };
    } catch (error) {
      console.error('Error deleting cookie category:', error);
      return { success: false, error: 'Failed to delete cookie category' };
    }
  }

  /**
   * Record cookie consent
   */
  async recordConsent(
    userId: string,
    consentData: CookiePreferences,
    metadata?: { ip_address?: string; user_agent?: string }
  ): Promise<{ success: boolean; data?: CookieConsent; error?: string }> {
    try {
      const { data, error } = await this.supabase
        .from('cookie_consent')
        .upsert({
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
        throw new Error(`Failed to record cookie consent: ${error.message}`);
      }

      return { success: true, data };
    } catch (error) {
      console.error('Error recording cookie consent:', error);
      return { success: false, error: 'Failed to record cookie consent' };
    }
  }

  /**
   * Get user cookie consent
   */
  async getUserConsent(
    userId: string
  ): Promise<{ success: boolean; data?: CookieConsent; error?: string }> {
    try {
      const { data, error } = await this.supabase
        .from('cookie_consent')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw new Error(`Failed to get user cookie consent: ${error.message}`);
      }

      return { success: true, data: data || null };
    } catch (error) {
      console.error('Error getting user cookie consent:', error);
      return { success: false, error: 'Failed to get user cookie consent' };
    }
  }

  /**
   * Update user cookie preferences
   */
  async updatePreferences(
    userId: string,
    preferences: CookiePreferences
  ): Promise<{ success: boolean; data?: CookieConsent; error?: string }> {
    try {
      const { data, error } = await this.supabase
        .from('cookie_consent')
        .update({
          consent_data: preferences,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', userId)
        .select('*')
        .single();

      if (error) {
        throw new Error(
          `Failed to update cookie preferences: ${error.message}`
        );
      }

      return { success: true, data };
    } catch (error) {
      console.error('Error updating cookie preferences:', error);
      return { success: false, error: 'Failed to update cookie preferences' };
    }
  }

  /**
   * Withdraw cookie consent
   */
  async withdrawConsent(
    userId: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await this.supabase
        .from('cookie_consent')
        .delete()
        .eq('user_id', userId);

      if (error) {
        throw new Error(`Failed to withdraw cookie consent: ${error.message}`);
      }

      return { success: true };
    } catch (error) {
      console.error('Error withdrawing cookie consent:', error);
      return { success: false, error: 'Failed to withdraw cookie consent' };
    }
  }

  /**
   * Check if user has consented to specific cookie category
   */
  async hasConsentedToCategory(
    userId: string,
    category: keyof CookiePreferences
  ): Promise<{ success: boolean; data?: boolean; error?: string }> {
    try {
      const consent = await this.getUserConsent(userId);
      if (!consent.success || !consent.data) {
        return { success: true, data: false };
      }

      const preferences = consent.data.consent_data as CookiePreferences;
      return { success: true, data: preferences[category] || false };
    } catch (error) {
      console.error('Error checking cookie consent:', error);
      return { success: false, error: 'Failed to check cookie consent' };
    }
  }

  /**
   * Get cookie consent analytics
   */
  async getConsentAnalytics(
    filters: { start_date?: Date; end_date?: Date } = {}
  ): Promise<{ success: boolean; data?: CookieAnalytics; error?: string }> {
    try {
      let query = this.supabase.from('cookie_consent').select('*');

      if (filters.start_date) {
        query = query.gte('created_at', filters.start_date.toISOString());
      }

      if (filters.end_date) {
        query = query.lte('created_at', filters.end_date.toISOString());
      }

      const { data: consents, error } = await query.order('created_at', {
        ascending: false,
      });

      if (error) {
        throw new Error(
          `Failed to get cookie consent analytics: ${error.message}`
        );
      }

      const analytics: CookieAnalytics = {
        total_consents: consents?.length || 0,
        consent_rate: 0,
        by_category: {},
        recent_consents: consents?.slice(0, 10) || [],
      };

      if (analytics.total_consents > 0) {
        // Calculate consent rate (users who have consented to at least one category)
        const usersWithConsent = new Set(consents?.map(c => c.user_id) || []);
        analytics.consent_rate = Math.round(
          (usersWithConsent.size / analytics.total_consents) * 100
        );

        // Group by category
        consents?.forEach(consent => {
          const preferences = consent.consent_data as CookiePreferences;
          Object.keys(preferences).forEach(category => {
            if (preferences[category as keyof CookiePreferences]) {
              analytics.by_category[category] =
                (analytics.by_category[category] || 0) + 1;
            }
          });
        });
      }

      return { success: true, data: analytics };
    } catch (error) {
      console.error('Error getting cookie consent analytics:', error);
      return {
        success: false,
        error: 'Failed to get cookie consent analytics',
      };
    }
  }

  /**
   * Monitor cookie compliance
   */
  async monitorCompliance(): Promise<{
    success: boolean;
    data?: any;
    error?: string;
  }> {
    try {
      const [analytics, categories] = await Promise.all([
        this.getConsentAnalytics(),
        this.getCookieCategories(),
      ]);

      if (!analytics.success || !categories.success) {
        return { success: false, error: 'Failed to get compliance data' };
      }

      const compliance = {
        total_categories: categories.data?.length || 0,
        required_categories:
          categories.data?.filter(c => c.required).length || 0,
        total_consents: analytics.data?.total_consents || 0,
        consent_rate: analytics.data?.consent_rate || 0,
        compliance_score: this.calculateComplianceScore(
          analytics.data,
          categories.data
        ),
      };

      return { success: true, data: compliance };
    } catch (error) {
      console.error('Error monitoring cookie compliance:', error);
      return { success: false, error: 'Failed to monitor cookie compliance' };
    }
  }

  /**
   * Calculate compliance score
   */
  private calculateComplianceScore(
    analytics: CookieAnalytics,
    categories: CookieCategory[]
  ): number {
    if (categories.length === 0) return 0;

    const requiredCategories = categories.filter(c => c.required);
    const totalRequired = requiredCategories.length;
    const consentedRequired = Object.keys(analytics.by_category).length;

    const score = Math.round((consentedRequired / totalRequired) * 100);
    return Math.min(100, Math.max(0, score));
  }

  /**
   * Get consent history for a user
   */
  async getConsentHistory(
    userId: string
  ): Promise<{ success: boolean; data?: CookieConsent[]; error?: string }> {
    try {
      const { data, error } = await this.supabase
        .from('cookie_consent')
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
   * Bulk consent operations
   */
  async bulkConsentOperation(
    userId: string,
    operations: Array<{
      category: keyof CookiePreferences;
      action: 'grant' | 'withdraw';
    }>
  ): Promise<{ success: boolean; data?: CookiePreferences; error?: string }> {
    try {
      const currentConsent = await this.getUserConsent(userId);
      const preferences: CookiePreferences = currentConsent.data
        ?.consent_data || {
        necessary: true, // Always true for necessary cookies
        functional: false,
        analytics: false,
        marketing: false,
        preferences: false,
      };

      // Apply operations
      operations.forEach(operation => {
        if (operation.category === 'necessary') {
          // Necessary cookies cannot be withdrawn
          return;
        }

        if (operation.action === 'grant') {
          preferences[operation.category] = true;
        } else if (operation.action === 'withdraw') {
          preferences[operation.category] = false;
        }
      });

      // Update preferences
      const result = await this.updatePreferences(userId, preferences);
      if (!result.success) {
        return { success: false, error: 'Failed to update preferences' };
      }

      return { success: true, data: preferences };
    } catch (error) {
      console.error('Error performing bulk consent operations:', error);
      return {
        success: false,
        error: 'Failed to perform bulk consent operations',
      };
    }
  }

  /**
   * Get cookie policy
   */
  async getCookiePolicy(): Promise<{
    success: boolean;
    data?: any;
    error?: string;
  }> {
    try {
      const { data, error } = await this.supabase
        .from('cookie_policies')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw new Error(`Failed to get cookie policy: ${error.message}`);
      }

      return { success: true, data: data || null };
    } catch (error) {
      console.error('Error getting cookie policy:', error);
      return { success: false, error: 'Failed to get cookie policy' };
    }
  }

  /**
   * Create cookie policy
   */
  async createCookiePolicy(policyData: {
    title: string;
    content: string;
    is_active: boolean;
  }): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      // Deactivate existing policies
      await this.supabase
        .from('cookie_policies')
        .update({ is_active: false })
        .eq('is_active', true);

      const { data, error } = await this.supabase
        .from('cookie_policies')
        .insert({
          ...policyData,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select('*')
        .single();

      if (error) {
        throw new Error(`Failed to create cookie policy: ${error.message}`);
      }

      return { success: true, data };
    } catch (error) {
      console.error('Error creating cookie policy:', error);
      return { success: false, error: 'Failed to create cookie policy' };
    }
  }
}
