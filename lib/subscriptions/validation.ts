/**
 * Subscription validation utilities
 * Input validation and sanitization for subscription operations
 */

import { SubscriptionTier, BillingCycle } from '@/lib/supabase/types';
import { SUBSCRIPTION_CONFIG, ERROR_MESSAGES } from './constants';

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

export function validateSubscriptionTier(tier: string): ValidationResult {
  const validTiers = Object.values(SUBSCRIPTION_CONFIG.TIERS);

  if (!tier || !validTiers.includes(tier as SubscriptionTier)) {
    return {
      isValid: false,
      errors: [ERROR_MESSAGES.INVALID_TIER],
    };
  }

  return { isValid: true, errors: [] };
}

export function validateBillingCycle(billingCycle: string): ValidationResult {
  const validCycles = Object.values(SUBSCRIPTION_CONFIG.BILLING_CYCLES);

  if (!billingCycle || !validCycles.includes(billingCycle as BillingCycle)) {
    return {
      isValid: false,
      errors: [ERROR_MESSAGES.INVALID_BILLING_CYCLE],
    };
  }

  return { isValid: true, errors: [] };
}

export function validatePromotionalCode(code: string): ValidationResult {
  if (!code || typeof code !== 'string') {
    return {
      isValid: false,
      errors: ['Promotional code is required'],
    };
  }

  if (code.length < 3 || code.length > 20) {
    return {
      isValid: false,
      errors: ['Promotional code must be between 3 and 20 characters'],
    };
  }

  // Check for valid characters (alphanumeric and hyphens)
  if (!/^[A-Z0-9-]+$/i.test(code)) {
    return {
      isValid: false,
      errors: [
        'Promotional code can only contain letters, numbers, and hyphens',
      ],
    };
  }

  return { isValid: true, errors: [] };
}

export function validateSubscriptionCreateData(data: {
  tier?: string;
  billing_cycle?: string;
  promotional_code?: string;
}): ValidationResult {
  const errors: string[] = [];

  // Validate tier
  const tierValidation = validateSubscriptionTier(data.tier || '');
  if (!tierValidation.isValid) {
    errors.push(...tierValidation.errors);
  }

  // Validate billing cycle
  const cycleValidation = validateBillingCycle(data.billing_cycle || '');
  if (!cycleValidation.isValid) {
    errors.push(...cycleValidation.errors);
  }

  // Validate promotional code if provided
  if (data.promotional_code) {
    const promoValidation = validatePromotionalCode(data.promotional_code);
    if (!promoValidation.isValid) {
      errors.push(...promoValidation.errors);
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

export function sanitizePromotionalCode(code: string): string {
  return code.trim().toUpperCase();
}
