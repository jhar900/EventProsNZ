import { createClient } from '@/lib/supabase/server';
import {
  FeatureAccessMiddleware,
  FeatureAccessValidation,
  FeatureAccessConfig,
} from '@/lib/middleware/featureAccess';
import { FeatureAccessCacheService } from '@/lib/cache/feature-access-cache';

export interface FeatureAccessServiceConfig {
  enableCaching: boolean;
  cacheTTL: number; // in seconds
  enableLogging: boolean;
  enableAudit: boolean;
}

export interface CachedFeatureAccess {
  validation: FeatureAccessValidation;
  timestamp: number;
  ttl: number;
}

/**
 * Centralized Feature Access Service
 * Provides comprehensive feature access validation with caching and audit logging
 */
export class FeatureAccessService {
  private supabase: any;
  private middleware: FeatureAccessMiddleware;
  private cache: Map<string, CachedFeatureAccess> = new Map();
  private config: FeatureAccessServiceConfig;

  constructor(
    config: FeatureAccessServiceConfig = {
      enableCaching: true,
      cacheTTL: 300, // 5 minutes
      enableLogging: true,
      enableAudit: true,
    }
  ) {
    this.supabase = createClient();
    this.middleware = new FeatureAccessMiddleware();
    this.config = config;
  }

  /**
   * Check if user has access to a specific feature
   * This is the main entry point for feature access validation
   */
  async hasFeatureAccess(
    userId: string,
    featureName: string,
    config?: FeatureAccessConfig
  ): Promise<boolean> {
    const validation = await this.validateFeatureAccess(
      userId,
      featureName,
      config
    );
    return validation.hasAccess;
  }

  /**
   * Validate feature access with detailed response
   */
  async validateFeatureAccess(
    userId: string,
    featureName: string,
    config?: FeatureAccessConfig
  ): Promise<FeatureAccessValidation> {
    // Check cache first if enabled
    if (this.config.enableCaching) {
      const cached = FeatureAccessCacheService.getCachedFeatureAccess(
        userId,
        featureName
      );
      if (cached) {
        return cached;
      }
    }

    // Perform server-side validation
    const validation = await this.middleware.validateFeatureAccess(
      userId,
      featureName,
      config
    );

    // Cache the result if enabled
    if (this.config.enableCaching) {
      FeatureAccessCacheService.setCachedFeatureAccess(
        userId,
        featureName,
        validation
      );
    }

    // Log access attempt if enabled
    if (this.config.enableLogging) {
      await this.middleware.logFeatureAccess(
        userId,
        featureName,
        validation.hasAccess,
        validation.reason
      );
    }

    // Audit log if enabled
    if (this.config.enableAudit) {
      await this.auditFeatureAccess(userId, featureName, validation);
    }

    return validation;
  }

  /**
   * Get all accessible features for a user
   */
  async getAccessibleFeatures(userId: string): Promise<string[]> {
    try {
      // Get user's subscription
      const { data: subscription } = await this.supabase
        .from('subscriptions')
        .select('tier, status')
        .eq('user_id', userId)
        .in('status', ['active', 'trial'])
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (!subscription) {
        return [];
      }

      // Get all features for the user's tier
      const { data: features } = await this.supabase
        .from('subscription_features')
        .select('feature_name, tier_required')
        .eq('tier_required', subscription.tier)
        .eq('is_included', true);

      if (!features) {
        return [];
      }

      // Validate each feature
      const accessibleFeatures: string[] = [];
      for (const feature of features) {
        const validation = await this.validateFeatureAccess(
          userId,
          feature.feature_name
        );
        if (validation.hasAccess) {
          accessibleFeatures.push(feature.feature_name);
        }
      }

      return accessibleFeatures;
    } catch (error) {
      console.error('Failed to get accessible features:', error);
      return [];
    }
  }

  /**
   * Get tier-specific features
   */
  async getTierFeatures(tier: string): Promise<any[]> {
    try {
      // Check cache first if enabled
      if (this.config.enableCaching) {
        const cached = FeatureAccessCacheService.getCachedTierFeatures(tier);
        if (cached) {
          return cached;
        }
      }

      const { data: features, error } = await this.supabase
        .from('subscription_features')
        .select('*')
        .eq('tier', tier)
        .eq('is_included', true)
        .order('feature_name');

      if (error) {
        throw new Error(`Failed to get tier features: ${error.message}`);
      }

      const result = features || [];

      // Cache the result if enabled
      if (this.config.enableCaching) {
        FeatureAccessCacheService.setCachedTierFeatures(tier, result);
      }

      return result;
    } catch (error) {
      console.error('Failed to get tier features:', error);
      return [];
    }
  }

  /**
   * Grant feature access to a user
   */
  async grantFeatureAccess(
    userId: string,
    featureName: string,
    tierRequired: string,
    expiresAt?: Date
  ): Promise<boolean> {
    try {
      const { error } = await this.supabase.from('feature_access').upsert({
        user_id: userId,
        feature_name: featureName,
        tier_required: tierRequired,
        is_accessible: true,
        access_granted_at: new Date().toISOString(),
        access_expires_at: expiresAt?.toISOString() || null,
      });

      if (error) {
        throw new Error(`Failed to grant feature access: ${error.message}`);
      }

      // Invalidate cache
      FeatureAccessCacheService.invalidateUserCache(userId);

      return true;
    } catch (error) {
      console.error('Failed to grant feature access:', error);
      return false;
    }
  }

  /**
   * Revoke feature access from a user
   */
  async revokeFeatureAccess(
    userId: string,
    featureName: string
  ): Promise<boolean> {
    try {
      const { error } = await this.supabase
        .from('feature_access')
        .update({ is_accessible: false })
        .eq('user_id', userId)
        .eq('feature_name', featureName);

      if (error) {
        throw new Error(`Failed to revoke feature access: ${error.message}`);
      }

      // Invalidate cache
      FeatureAccessCacheService.invalidateUserCache(userId);

      return true;
    } catch (error) {
      console.error('Failed to revoke feature access:', error);
      return false;
    }
  }

  /**
   * Get feature usage statistics
   */
  async getFeatureUsage(userId: string, featureName?: string): Promise<any[]> {
    try {
      let query = this.supabase
        .from('feature_access_logs')
        .select('*')
        .eq('user_id', userId);

      if (featureName) {
        query = query.eq('feature_name', featureName);
      }

      const { data, error } = await query
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) {
        throw new Error(`Failed to get feature usage: ${error.message}`);
      }

      return data || [];
    } catch (error) {
      console.error('Failed to get feature usage:', error);
      return [];
    }
  }

  /**
   * Audit feature access for security monitoring
   */
  private async auditFeatureAccess(
    userId: string,
    featureName: string,
    validation: FeatureAccessValidation
  ): Promise<void> {
    try {
      await this.supabase.from('feature_access_audit').insert({
        user_id: userId,
        feature_name: featureName,
        access_granted: validation.hasAccess,
        tier: validation.tier,
        reason: validation.reason,
        expires_at: validation.expiresAt,
        created_at: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Failed to audit feature access:', error);
    }
  }

  /**
   * Clear all cache entries
   */
  clearCache(): void {
    FeatureAccessCacheService.invalidateAllCache();
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { size: number; entries: string[] } {
    const stats = FeatureAccessCacheService.getCacheStatistics();
    return {
      size: stats.size,
      entries: stats.entries.map(entry => entry.key),
    };
  }
}

// Export singleton instance
export const featureAccessService = new FeatureAccessService();
