import { createClient } from '@/lib/supabase/server';

export interface FeatureAccess {
  id: string;
  user_id: string;
  feature_name: string;
  tier_required: string;
  is_accessible: boolean;
  access_granted_at: string;
  access_expires_at?: string;
}

export interface TierFeature {
  id: string;
  tier: string;
  feature_name: string;
  feature_description: string;
  is_included: boolean;
  limit_value?: number;
}

export interface SpotlightFeature {
  id: string;
  user_id: string;
  feature_type: string;
  feature_data: any;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CustomProfileURL {
  id: string;
  user_id: string;
  custom_url: string;
  tier_required: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface AnalyticsData {
  profile_views: number;
  search_appearances: number;
  inquiries: number;
  conversion_rate: number;
  top_search_terms: any[];
  recent_activity: any[];
}

export interface SupportTicket {
  id: string;
  user_id: string;
  subject: string;
  description: string;
  priority: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface EarlyAccessFeature {
  id: string;
  feature_name: string;
  feature_description: string;
  tier_required: string;
  is_active: boolean;
  created_at: string;
}

export interface EarlyAccessRequest {
  id: string;
  user_id: string;
  feature_name: string;
  reason: string;
  status: string;
  created_at: string;
}

export class FeatureService {
  private supabase;

  constructor() {
    this.supabase = createClient();
  }

  // Feature Access Methods
  async getFeatureAccess(
    userId: string,
    featureName?: string
  ): Promise<FeatureAccess[]> {
    let query = this.supabase
      .from('feature_access')
      .select('*')
      .eq('user_id', userId);

    if (featureName) {
      query = query.eq('feature_name', featureName);
    }

    const { data, error } = await query;
    if (error) {
      throw new Error(`Failed to get feature access: ${error.message}`);
    }

    return data || [];
  }

  async createFeatureAccess(
    userId: string,
    featureName: string,
    tierRequired: string
  ): Promise<FeatureAccess> {
    const { data, error } = await this.supabase
      .from('feature_access')
      .insert({
        user_id: userId,
        feature_name: featureName,
        tier_required: tierRequired,
        is_accessible: true,
        access_granted_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create feature access: ${error.message}`);
    }

    return data;
  }

  async checkFeatureAccess(
    userId: string,
    featureName: string
  ): Promise<boolean> {
    const { data, error } = await this.supabase.rpc('has_feature_access', {
      user_uuid: userId,
      feature_name: featureName,
    });

    if (error) {
      throw new Error(`Failed to check feature access: ${error.message}`);
    }

    return data || false;
  }

  // Tier Features Methods
  async getTierFeatures(tier: string): Promise<TierFeature[]> {
    const { data, error } = await this.supabase
      .from('subscription_features')
      .select('*')
      .eq('tier', tier)
      .eq('is_included', true)
      .order('feature_name');

    if (error) {
      throw new Error(`Failed to get tier features: ${error.message}`);
    }

    return data || [];
  }

  // Spotlight Features Methods
  async getSpotlightFeatures(userId: string): Promise<SpotlightFeature[]> {
    const { data, error } = await this.supabase
      .from('spotlight_features')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to get spotlight features: ${error.message}`);
    }

    return data || [];
  }

  async createSpotlightFeature(
    userId: string,
    featureType: string,
    featureData: any
  ): Promise<SpotlightFeature> {
    const { data, error } = await this.supabase
      .from('spotlight_features')
      .insert({
        user_id: userId,
        feature_type: featureType,
        feature_data: featureData,
        is_active: true,
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create spotlight feature: ${error.message}`);
    }

    return data;
  }

  // Custom Profile URL Methods
  async getCustomProfileURL(userId: string): Promise<CustomProfileURL | null> {
    const { data, error } = await this.supabase
      .from('custom_profile_urls')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw new Error(`Failed to get custom profile URL: ${error.message}`);
    }

    return data;
  }

  async createCustomProfileURL(
    userId: string,
    customUrl: string
  ): Promise<CustomProfileURL> {
    // Check if URL is already taken
    const { data: existingUrl } = await this.supabase
      .from('custom_profile_urls')
      .select('id')
      .eq('custom_url', customUrl)
      .eq('is_active', true)
      .single();

    if (existingUrl) {
      throw new Error('Custom URL is already taken');
    }

    // Deactivate any existing custom URL for this user
    await this.supabase
      .from('custom_profile_urls')
      .update({ is_active: false })
      .eq('user_id', userId);

    const { data, error } = await this.supabase
      .from('custom_profile_urls')
      .insert({
        user_id: userId,
        custom_url: customUrl,
        tier_required: 'spotlight',
        is_active: true,
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create custom profile URL: ${error.message}`);
    }

    return data;
  }

  // Analytics Methods
  async getAdvancedAnalytics(
    userId: string,
    dateFrom?: string,
    dateTo?: string
  ): Promise<AnalyticsData> {
    const fromDate =
      dateFrom || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const toDate = dateTo || new Date().toISOString();

    // Get profile views
    const { data: profileViews } = await this.supabase
      .from('profile_views')
      .select('*')
      .eq('contractor_id', userId)
      .gte('created_at', fromDate)
      .lte('created_at', toDate);

    // Get search appearances
    const { data: searchAppearances } = await this.supabase
      .from('search_analytics')
      .select('*')
      .eq('contractor_id', userId)
      .gte('created_at', fromDate)
      .lte('created_at', toDate);

    // Get inquiries
    const { data: inquiries } = await this.supabase
      .from('enquiries')
      .select('*')
      .eq('contractor_id', userId)
      .gte('created_at', fromDate)
      .lte('created_at', toDate);

    return {
      profile_views: profileViews?.length || 0,
      search_appearances: searchAppearances?.length || 0,
      inquiries: inquiries?.length || 0,
      conversion_rate:
        inquiries?.length && profileViews?.length
          ? (inquiries.length / profileViews.length) * 100
          : 0,
      top_search_terms: searchAppearances?.slice(0, 5) || [],
      recent_activity: [
        ...(profileViews || []).slice(0, 10),
        ...(searchAppearances || []).slice(0, 10),
        ...(inquiries || []).slice(0, 10),
      ].sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      ),
    };
  }

  // Support Methods
  async createSupportTicket(
    userId: string,
    subject: string,
    description: string,
    priority: string
  ): Promise<SupportTicket> {
    const { data, error } = await this.supabase
      .from('support_tickets')
      .insert({
        user_id: userId,
        subject,
        description,
        priority,
        status: 'open',
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create support ticket: ${error.message}`);
    }

    return data;
  }

  // Early Access Methods
  async getEarlyAccessFeatures(userId: string): Promise<EarlyAccessFeature[]> {
    // Get user's subscription tier
    const { data: subscription } = await this.supabase
      .from('subscriptions')
      .select('tier')
      .eq('user_id', userId)
      .in('status', ['active', 'trial'])
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (!subscription) {
      return [];
    }

    const { data, error } = await this.supabase
      .from('early_access_features')
      .select('*')
      .eq('is_active', true)
      .lte('tier_required', subscription.tier)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to get early access features: ${error.message}`);
    }

    return data || [];
  }

  async createEarlyAccessRequest(
    userId: string,
    featureName: string,
    reason: string
  ): Promise<EarlyAccessRequest> {
    const { data, error } = await this.supabase
      .from('early_access_requests')
      .insert({
        user_id: userId,
        feature_name: featureName,
        reason,
        status: 'pending',
      })
      .select()
      .single();

    if (error) {
      throw new Error(
        `Failed to create early access request: ${error.message}`
      );
    }

    return data;
  }
}
