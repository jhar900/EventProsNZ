/**
 * Subscription system constants
 * Centralized configuration for subscription management
 */

export const SUBSCRIPTION_CONFIG = {
  // Trial configuration
  TRIAL_DURATION_DAYS: 14,
  TRIAL_DEFAULT_TIER: 'showcase' as const,

  // Billing cycles
  BILLING_CYCLES: {
    MONTHLY: 'monthly',
    YEARLY: 'yearly',
    TWO_YEAR: '2year',
  } as const,

  // Subscription tiers
  TIERS: {
    ESSENTIAL: 'essential',
    SHOWCASE: 'showcase',
    SPOTLIGHT: 'spotlight',
  } as const,

  // Subscription statuses
  STATUSES: {
    ACTIVE: 'active',
    INACTIVE: 'inactive',
    CANCELLED: 'cancelled',
    EXPIRED: 'expired',
    TRIAL: 'trial',
  } as const,

  // Pricing (in cents for Stripe)
  PRICING: {
    ESSENTIAL: {
      MONTHLY: 0,
      YEARLY: 0,
      TWO_YEAR: 0,
    },
    SHOWCASE: {
      MONTHLY: 2900, // $29.00
      YEARLY: 29900, // $299.00
      TWO_YEAR: 49900, // $499.00
    },
    SPOTLIGHT: {
      MONTHLY: 6900, // $69.00
      YEARLY: 69900, // $699.00
      TWO_YEAR: 119900, // $1199.00
    },
  },

  // Feature limits
  FEATURE_LIMITS: {
    ESSENTIAL: {
      PORTFOLIO_UPLOADS: 5,
      VIDEO_UPLOADS: 0,
    },
    SHOWCASE: {
      PORTFOLIO_UPLOADS: 20,
      VIDEO_UPLOADS: 5,
    },
    SPOTLIGHT: {
      PORTFOLIO_UPLOADS: -1, // Unlimited
      VIDEO_UPLOADS: -1, // Unlimited
    },
  },
} as const;

export const ERROR_MESSAGES = {
  SUBSCRIPTION_NOT_FOUND: 'Subscription not found',
  USER_ALREADY_HAS_SUBSCRIPTION: 'User already has an active subscription',
  INVALID_TIER: 'Invalid subscription tier',
  INVALID_BILLING_CYCLE: 'Invalid billing cycle',
  PROMOTIONAL_CODE_INVALID: 'Invalid or expired promotional code',
  PROMOTIONAL_CODE_USAGE_LIMIT: 'Promotional code usage limit exceeded',
  TRIAL_ALREADY_USED: 'Trial period has already been used',
  INSUFFICIENT_PERMISSIONS: 'Insufficient permissions for this operation',
} as const;
