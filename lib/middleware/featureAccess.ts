import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { AuthenticatedUser } from './auth';

export interface FeatureAccessValidation {
  hasAccess: boolean;
  tier: string;
  reason?: string;
  expiresAt?: string;
}

export interface FeatureAccessConfig {
  featureName: string;
  requiredTier: string;
  allowTrial: boolean;
  customValidation?: (
    user: AuthenticatedUser,
    supabase: any
  ) => Promise<boolean>;
}

/**
 * Server-side feature access validation middleware
 * This is the critical security component that prevents client-side bypass
 */
export class FeatureAccessMiddleware {
  private supabase: any;

  constructor() {
    this.supabase = createClient();
  }

  /**
   * Validates feature access on the server side
   * This is the primary security function that cannot be bypassed
   */
  async validateFeatureAccess(
    userId: string,
    featureName: string,
    config?: FeatureAccessConfig
  ): Promise<FeatureAccessValidation> {
    try {
      // Get user's current subscription
      const { data: subscription, error: subError } = await this.supabase
        .from('subscriptions')
        .select('tier, status, end_date, trial_end_date')
        .eq('user_id', userId)
        .in('status', ['active', 'trial'])
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (subError || !subscription) {
        return {
          hasAccess: false,
          tier: 'essential',
          reason: 'No active subscription found',
        };
      }

      // Check if subscription is expired
      const now = new Date();
      const endDate = subscription.end_date
        ? new Date(subscription.end_date)
        : null;
      const trialEndDate = subscription.trial_end_date
        ? new Date(subscription.trial_end_date)
        : null;

      if (endDate && endDate < now) {
        return {
          hasAccess: false,
          tier: subscription.tier,
          reason: 'Subscription expired',
        };
      }

      if (
        subscription.status === 'trial' &&
        trialEndDate &&
        trialEndDate < now
      ) {
        return {
          hasAccess: false,
          tier: subscription.tier,
          reason: 'Trial period expired',
        };
      }

      // Get feature requirements
      const { data: featureReq, error: featureError } = await this.supabase
        .from('subscription_features')
        .select('tier_required, is_included, limit_value')
        .eq('feature_name', featureName)
        .eq('is_included', true)
        .single();

      if (featureError || !featureReq) {
        return {
          hasAccess: false,
          tier: subscription.tier,
          reason: 'Feature not available',
        };
      }

      // Check tier requirements
      const hasTierAccess = this.checkTierAccess(
        subscription.tier,
        featureReq.tier_required
      );

      if (!hasTierAccess) {
        return {
          hasAccess: false,
          tier: subscription.tier,
          reason: `Feature requires ${featureReq.tier_required} tier or higher`,
        };
      }

      // Check trial restrictions
      if (subscription.status === 'trial' && !config?.allowTrial) {
        return {
          hasAccess: false,
          tier: subscription.tier,
          reason: 'Feature not available during trial',
        };
      }

      // Custom validation if provided
      if (config?.customValidation) {
        const { data: userData } = await this.supabase
          .from('users')
          .select('id, email, role')
          .eq('id', userId)
          .single();

        if (!userData) {
          return {
            hasAccess: false,
            tier: subscription.tier,
            reason: 'User not found',
          };
        }

        const customValid = await config.customValidation(
          userData,
          this.supabase
        );
        if (!customValid) {
          return {
            hasAccess: false,
            tier: subscription.tier,
            reason: 'Custom validation failed',
          };
        }
      }

      // Check feature access record
      const { data: featureAccess, error: accessError } = await this.supabase
        .from('feature_access')
        .select('is_accessible, access_expires_at')
        .eq('user_id', userId)
        .eq('feature_name', featureName)
        .single();

      if (accessError && accessError.code !== 'PGRST116') {
        // PGRST116 = no rows returned
        throw new Error(
          `Failed to check feature access: ${accessError.message}`
        );
      }

      if (featureAccess) {
        // Check if access is explicitly denied
        if (!featureAccess.is_accessible) {
          return {
            hasAccess: false,
            tier: subscription.tier,
            reason: 'Feature access explicitly denied',
          };
        }

        // Check if access has expired
        if (featureAccess.access_expires_at) {
          const expiresAt = new Date(featureAccess.access_expires_at);
          if (expiresAt < now) {
            return {
              hasAccess: false,
              tier: subscription.tier,
              reason: 'Feature access expired',
              expiresAt: featureAccess.access_expires_at,
            };
          }
        }
      }

      return {
        hasAccess: true,
        tier: subscription.tier,
        expiresAt: featureAccess?.access_expires_at,
      };
    } catch (error) {
      console.error('Feature access validation error:', error);
      return {
        hasAccess: false,
        tier: 'essential',
        reason: 'Validation error occurred',
      };
    }
  }

  /**
   * Check if user's tier meets feature requirements
   */
  private checkTierAccess(userTier: string, requiredTier: string): boolean {
    const tierHierarchy = {
      essential: 1,
      showcase: 2,
      spotlight: 3,
    };

    const userLevel =
      tierHierarchy[userTier as keyof typeof tierHierarchy] || 0;
    const requiredLevel =
      tierHierarchy[requiredTier as keyof typeof tierHierarchy] || 0;

    return userLevel >= requiredLevel;
  }

  /**
   * Middleware wrapper for API routes
   */
  async withFeatureAccess(
    request: NextRequest,
    featureName: string,
    config?: FeatureAccessConfig
  ): Promise<{ validation: FeatureAccessValidation; response?: NextResponse }> {
    try {
      // Get authenticated user
      const {
        data: { user },
        error: authError,
      } = await this.supabase.auth.getUser();

      if (authError || !user) {
        return {
          validation: {
            hasAccess: false,
            tier: 'essential',
            reason: 'Authentication required',
          },
          response: NextResponse.json(
            { error: 'Authentication required' },
            { status: 401 }
          ),
        };
      }

      // Validate feature access
      const validation = await this.validateFeatureAccess(
        user.id,
        featureName,
        config
      );

      if (!validation.hasAccess) {
        return {
          validation,
          response: NextResponse.json(
            {
              error: 'Feature access denied',
              reason: validation.reason,
              tier: validation.tier,
            },
            { status: 403 }
          ),
        };
      }

      return { validation };
    } catch (error) {
      console.error('Feature access middleware error:', error);
      return {
        validation: {
          hasAccess: false,
          tier: 'essential',
          reason: 'Middleware error',
        },
        response: NextResponse.json(
          { error: 'Internal server error' },
          { status: 500 }
        ),
      };
    }
  }

  /**
   * Log feature access attempts for security monitoring
   */
  async logFeatureAccess(
    userId: string,
    featureName: string,
    hasAccess: boolean,
    reason?: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    try {
      await this.supabase.from('feature_access_logs').insert({
        user_id: userId,
        feature_name: featureName,
        access_granted: hasAccess,
        reason: reason || null,
        metadata: metadata || {},
        ip_address: null, // Would need to extract from request
        user_agent: null, // Would need to extract from request
        created_at: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Failed to log feature access:', error);
    }
  }
}

/**
 * Feature access validation helper for API routes
 */
export async function validateFeatureAccess(
  request: NextRequest,
  featureName: string,
  config?: FeatureAccessConfig
): Promise<{ validation: FeatureAccessValidation; response?: NextResponse }> {
  const middleware = new FeatureAccessMiddleware();
  return await middleware.withFeatureAccess(request, featureName, config);
}

/**
 * Feature access validation helper for server components
 */
export async function checkFeatureAccess(
  userId: string,
  featureName: string,
  config?: FeatureAccessConfig
): Promise<FeatureAccessValidation> {
  const middleware = new FeatureAccessMiddleware();
  return await middleware.validateFeatureAccess(userId, featureName, config);
}
