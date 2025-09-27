import { createClient } from '@/lib/supabase/server';
import {
  Subscription,
  SubscriptionTier,
  SubscriptionStatus,
  BillingCycle,
} from '@/lib/supabase/types';
import { SUBSCRIPTION_CONFIG, ERROR_MESSAGES } from './constants';
import { StripeService } from './stripe-service';
import { AuditLogger } from './audit-logger';

export interface SubscriptionCreateData {
  tier: SubscriptionTier;
  billing_cycle: BillingCycle;
  promotional_code?: string;
}

export interface SubscriptionUpdateData {
  tier?: SubscriptionTier;
  billing_cycle?: BillingCycle;
  status?: SubscriptionStatus;
}

export interface SubscriptionTierInfo {
  id: string;
  name: string;
  price: number;
  billing_cycle: BillingCycle;
  features: string[];
  limits: Record<string, number>;
  is_trial_eligible: boolean;
}

export interface PricingInfo {
  tier: SubscriptionTier;
  billing_cycle: BillingCycle;
  base_price: number;
  discount_applied: number;
  final_price: number;
  savings: number;
}

export interface TrialInfo {
  subscription_id: string;
  tier: SubscriptionTier;
  start_date: string;
  end_date: string;
  days_remaining: number;
  is_active: boolean;
}

export interface ProrationInfo {
  current_cycle_remaining: number;
  proration_amount: number;
  new_cycle_amount: number;
  effective_date: string;
}

export class SubscriptionService {
  private supabase;
  private stripeService: StripeService;
  private auditLogger: AuditLogger;

  constructor() {
    this.supabase = createClient();
    this.stripeService = new StripeService();
    this.auditLogger = new AuditLogger();
  }

  // Get user's current subscription
  async getCurrentSubscription(userId: string): Promise<Subscription | null> {
    const { data, error } = await this.supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .in('status', ['active', 'trial'])
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw new Error(`Failed to get subscription: ${error.message}`);
    }

    return data;
  }

  // Get all subscriptions for a user
  async getUserSubscriptions(userId: string): Promise<Subscription[]> {
    const { data, error } = await this.supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to get subscriptions: ${error.message}`);
    }

    return data || [];
  }

  // Create a new subscription
  async createSubscription(
    userId: string,
    data: SubscriptionCreateData,
    userEmail: string,
    metadata?: { ipAddress?: string; userAgent?: string }
  ): Promise<Subscription> {
    try {
      // Get pricing information
      const pricing = await this.getPricing(data.tier, data.billing_cycle);

      // Apply promotional code if provided
      let finalPrice = pricing.price;
      let promotionalCode = null;

      if (data.promotional_code) {
        const promoResult = await this.validatePromotionalCode(
          data.promotional_code,
          data.tier
        );
        if (promoResult.valid) {
          finalPrice = this.calculateDiscountedPrice(
            pricing.price,
            promoResult.discount
          );
          promotionalCode = data.promotional_code;
        }
      }

      // Create or get Stripe customer
      const stripeCustomer = await this.stripeService.getOrCreateCustomer(
        userId,
        userEmail
      );

      // Create Stripe price
      const stripePrice = await this.stripeService.createPrice(
        data.tier,
        data.billing_cycle
      );

      // Create Stripe subscription
      const stripeSubscription = await this.stripeService.createSubscription(
        stripeCustomer.id,
        stripePrice.id,
        SUBSCRIPTION_CONFIG.TRIAL_DURATION_DAYS
      );

      const subscriptionData = {
        user_id: userId,
        tier: data.tier,
        billing_cycle: data.billing_cycle,
        price: finalPrice,
        promotional_code: promotionalCode,
        status: 'trial' as SubscriptionStatus,
        stripe_customer_id: stripeCustomer.id,
        stripe_subscription_id: stripeSubscription.id,
        stripe_price_id: stripePrice.id,
        trial_end_date: new Date(
          Date.now() +
            SUBSCRIPTION_CONFIG.TRIAL_DURATION_DAYS * 24 * 60 * 60 * 1000
        ).toISOString(),
      };

      const { data: subscription, error } = await this.supabase
        .from('subscriptions')
        .insert(subscriptionData)
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to create subscription: ${error.message}`);
      }

      // Log subscription creation with audit trail
      await this.auditLogger.logSubscriptionEvent(
        subscription.id,
        'subscription_created',
        {
          tier: data.tier,
          billing_cycle: data.billing_cycle,
          price: finalPrice,
          promotional_code: promotionalCode,
          stripe_customer_id: stripeCustomer.id,
          stripe_subscription_id: stripeSubscription.id,
        },
        userId,
        metadata
      );

      return subscription;
    } catch (error) {
      // Log error for audit trail
      await this.auditLogger.logSecurityEvent(
        'subscription_creation_failed',
        {
          error: error instanceof Error ? error.message : 'Unknown error',
          tier: data.tier,
          billing_cycle: data.billing_cycle,
        },
        userId,
        'high',
        metadata
      );
      throw error;
    }
  }

  // Update subscription
  async updateSubscription(
    subscriptionId: string,
    data: SubscriptionUpdateData
  ): Promise<Subscription> {
    const { data: subscription, error } = await this.supabase
      .from('subscriptions')
      .update(data)
      .eq('id', subscriptionId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update subscription: ${error.message}`);
    }

    // Log subscription update
    await this.logSubscriptionEvent(
      subscriptionId,
      'subscription_updated',
      data
    );

    return subscription;
  }

  // Get subscription tiers
  async getSubscriptionTiers(): Promise<SubscriptionTierInfo[]> {
    const { data: pricing, error: pricingError } = await this.supabase
      .from('subscription_pricing')
      .select('*')
      .eq('is_active', true)
      .order('tier', { ascending: true });

    if (pricingError) {
      throw new Error(`Failed to get pricing: ${pricingError.message}`);
    }

    const { data: features, error: featuresError } = await this.supabase
      .from('subscription_features')
      .select('*')
      .order('tier', { ascending: true });

    if (featuresError) {
      throw new Error(`Failed to get features: ${featuresError.message}`);
    }

    // Group pricing by tier
    const pricingByTier =
      pricing?.reduce(
        (acc, price) => {
          if (!acc[price.tier]) {
            acc[price.tier] = [];
          }
          acc[price.tier].push(price);
          return acc;
        },
        {} as Record<string, any[]>
      ) || {};

    // Group features by tier
    const featuresByTier =
      features?.reduce(
        (acc, feature) => {
          if (!acc[feature.tier]) {
            acc[feature.tier] = [];
          }
          acc[feature.tier].push(feature);
          return acc;
        },
        {} as Record<string, any[]>
      ) || {};

    // Create tier information
    const tiers: SubscriptionTierInfo[] = [];

    for (const tier of [
      'essential',
      'showcase',
      'spotlight',
    ] as SubscriptionTier[]) {
      const tierPricing = pricingByTier[tier] || [];
      const tierFeatures = featuresByTier[tier] || [];

      // Get monthly pricing as base
      const monthlyPricing = tierPricing.find(
        p => p.billing_cycle === 'monthly'
      );

      if (monthlyPricing) {
        tiers.push({
          id: tier,
          name: this.getTierDisplayName(tier),
          price: monthlyPricing.price,
          billing_cycle: 'monthly',
          features: tierFeatures.map(f => f.feature_name),
          limits: tierFeatures.reduce(
            (acc, f) => {
              if (f.limit_value) {
                acc[f.feature_name] = f.limit_value;
              }
              return acc;
            },
            {} as Record<string, number>
          ),
          is_trial_eligible: tier !== 'essential',
        });
      }
    }

    return tiers;
  }

  // Get pricing information
  async getPricing(
    tier: SubscriptionTier,
    billingCycle: BillingCycle
  ): Promise<{ price: number }> {
    const { data, error } = await this.supabase
      .from('subscription_pricing')
      .select('price')
      .eq('tier', tier)
      .eq('billing_cycle', billingCycle)
      .eq('is_active', true)
      .single();

    if (error) {
      throw new Error(`Failed to get pricing: ${error.message}`);
    }

    return { price: data.price };
  }

  // Calculate pricing with promotional code
  async calculatePricing(
    tier: SubscriptionTier,
    billingCycle: BillingCycle,
    promotionalCode?: string
  ): Promise<PricingInfo> {
    const basePricing = await this.getPricing(tier, billingCycle);
    let discountApplied = 0;
    let finalPrice = basePricing.price;

    if (promotionalCode) {
      const promoResult = await this.validatePromotionalCode(
        promotionalCode,
        tier
      );
      if (promoResult.valid) {
        discountApplied = this.calculateDiscountAmount(
          basePricing.price,
          promoResult.discount
        );
        finalPrice = basePricing.price - discountApplied;
      }
    }

    const savings = this.calculateSavings(tier, billingCycle);

    return {
      tier,
      billing_cycle: billingCycle,
      base_price: basePricing.price,
      discount_applied: discountApplied,
      final_price: finalPrice,
      savings,
    };
  }

  // Start trial
  async startTrial(userId: string, tier: SubscriptionTier): Promise<TrialInfo> {
    // Check if user already has an active subscription
    const currentSubscription = await this.getCurrentSubscription(userId);
    if (currentSubscription) {
      throw new Error('User already has an active subscription');
    }

    // Check if user has already used trial
    const { data: existingTrials, error: trialError } = await this.supabase
      .from('subscriptions')
      .select('id')
      .eq('user_id', userId)
      .eq('status', 'trial');

    if (trialError) {
      throw new Error(`Failed to check existing trials: ${trialError.message}`);
    }

    if (existingTrials && existingTrials.length > 0) {
      throw new Error('User has already used their trial');
    }

    // Create trial subscription
    const subscription = await this.createSubscription(userId, {
      tier,
      billing_cycle: 'monthly',
    });

    const trialEndDate = new Date(subscription.trial_end_date!);
    const daysRemaining = Math.ceil(
      (trialEndDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    );

    return {
      subscription_id: subscription.id,
      tier: subscription.tier,
      start_date: subscription.start_date,
      end_date: subscription.trial_end_date!,
      days_remaining: Math.max(0, daysRemaining),
      is_active: true,
    };
  }

  // Get trial status
  async getTrialStatus(userId: string): Promise<TrialInfo | null> {
    const { data, error } = await this.supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'trial')
      .single();

    if (error && error.code !== 'PGRST116') {
      throw new Error(`Failed to get trial status: ${error.message}`);
    }

    if (!data) {
      return null;
    }

    const trialEndDate = new Date(data.trial_end_date!);
    const daysRemaining = Math.ceil(
      (trialEndDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    );

    return {
      subscription_id: data.id,
      tier: data.tier,
      start_date: data.start_date,
      end_date: data.trial_end_date!,
      days_remaining: Math.max(0, daysRemaining),
      is_active: daysRemaining > 0,
    };
  }

  // Upgrade subscription
  async upgradeSubscription(
    subscriptionId: string,
    newTier: SubscriptionTier,
    effectiveDate?: Date
  ): Promise<{ subscription: Subscription; proration: ProrationInfo }> {
    const { data: currentSubscription, error: fetchError } = await this.supabase
      .from('subscriptions')
      .select('*')
      .eq('id', subscriptionId)
      .single();

    if (fetchError) {
      throw new Error(
        `Failed to get current subscription: ${fetchError.message}`
      );
    }

    const effective = effectiveDate || new Date();
    const proration = this.calculateProration(
      currentSubscription,
      newTier,
      effective
    );

    const { data: subscription, error } = await this.supabase
      .from('subscriptions')
      .update({
        tier: newTier,
        price: proration.new_cycle_amount,
        updated_at: new Date().toISOString(),
      })
      .eq('id', subscriptionId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to upgrade subscription: ${error.message}`);
    }

    // Log upgrade event
    await this.logSubscriptionEvent(subscriptionId, 'subscription_upgraded', {
      old_tier: currentSubscription.tier,
      new_tier: newTier,
      proration,
    });

    return { subscription, proration };
  }

  // Downgrade subscription
  async downgradeSubscription(
    subscriptionId: string,
    newTier: SubscriptionTier,
    effectiveDate?: Date
  ): Promise<{ subscription: Subscription; proration: ProrationInfo }> {
    const { data: currentSubscription, error: fetchError } = await this.supabase
      .from('subscriptions')
      .select('*')
      .eq('id', subscriptionId)
      .single();

    if (fetchError) {
      throw new Error(
        `Failed to get current subscription: ${fetchError.message}`
      );
    }

    const effective = effectiveDate || new Date();
    const proration = this.calculateProration(
      currentSubscription,
      newTier,
      effective
    );

    const { data: subscription, error } = await this.supabase
      .from('subscriptions')
      .update({
        tier: newTier,
        price: proration.new_cycle_amount,
        updated_at: new Date().toISOString(),
      })
      .eq('id', subscriptionId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to downgrade subscription: ${error.message}`);
    }

    // Log downgrade event
    await this.logSubscriptionEvent(subscriptionId, 'subscription_downgraded', {
      old_tier: currentSubscription.tier,
      new_tier: newTier,
      proration,
    });

    return { subscription, proration };
  }

  // Validate promotional code
  async validatePromotionalCode(
    code: string,
    tier: SubscriptionTier
  ): Promise<{ valid: boolean; discount: any }> {
    const { data, error } = await this.supabase
      .from('promotional_codes')
      .select('*')
      .eq('code', code)
      .eq('is_active', true)
      .single();

    if (error || !data) {
      return { valid: false, discount: null };
    }

    // Check if code is expired
    if (data.expires_at && new Date(data.expires_at) < new Date()) {
      return { valid: false, discount: null };
    }

    // Check usage limit
    if (data.usage_limit && data.usage_count >= data.usage_limit) {
      return { valid: false, discount: null };
    }

    // Check if tier is applicable
    if (data.tier_applicable && !data.tier_applicable.includes(tier)) {
      return { valid: false, discount: null };
    }

    return {
      valid: true,
      discount: {
        type: data.discount_type,
        value: data.discount_value,
      },
    };
  }

  // Check feature access
  async hasFeatureAccess(
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

  // Get user subscription features
  async getUserSubscriptionFeatures(userId: string): Promise<any[]> {
    const { data, error } = await this.supabase.rpc(
      'get_user_subscription_features',
      {
        user_uuid: userId,
      }
    );

    if (error) {
      throw new Error(`Failed to get subscription features: ${error.message}`);
    }

    return data || [];
  }

  // Private helper methods
  private getTierDisplayName(tier: SubscriptionTier): string {
    const names = {
      essential: 'Essential',
      showcase: 'Showcase',
      spotlight: 'Spotlight',
    };
    return names[tier];
  }

  private calculateDiscountedPrice(basePrice: number, discount: any): number {
    if (discount.type === 'percentage') {
      return basePrice * (1 - discount.value / 100);
    } else {
      return Math.max(0, basePrice - discount.value);
    }
  }

  private calculateDiscountAmount(basePrice: number, discount: any): number {
    if (discount.type === 'percentage') {
      return basePrice * (discount.value / 100);
    } else {
      return Math.min(discount.value, basePrice);
    }
  }

  private calculateSavings(
    tier: SubscriptionTier,
    billingCycle: BillingCycle
  ): number {
    // Calculate savings compared to monthly billing
    if (billingCycle === 'monthly') {
      return 0;
    }

    const monthlyPrice = this.getMonthlyPrice(tier);
    const cyclePrice = this.getCyclePrice(tier, billingCycle);
    const monthsInCycle = billingCycle === 'yearly' ? 12 : 24;

    return monthlyPrice * monthsInCycle - cyclePrice;
  }

  private getMonthlyPrice(tier: SubscriptionTier): number {
    const prices = {
      essential: 0,
      showcase: 29,
      spotlight: 69,
    };
    return prices[tier];
  }

  private getCyclePrice(
    tier: SubscriptionTier,
    billingCycle: BillingCycle
  ): number {
    const prices = {
      essential: { monthly: 0, yearly: 0, '2year': 0 },
      showcase: { monthly: 29, yearly: 299, '2year': 499 },
      spotlight: { monthly: 69, yearly: 699, '2year': 1199 },
    };
    return prices[tier][billingCycle];
  }

  private calculateProration(
    currentSubscription: Subscription,
    newTier: SubscriptionTier,
    effectiveDate: Date
  ): ProrationInfo {
    // Simplified proration calculation
    const now = new Date();
    const cycleStart = new Date(currentSubscription.start_date);
    const cycleEnd = new Date(cycleStart);

    // Add cycle duration based on billing cycle
    if (currentSubscription.billing_cycle === 'monthly') {
      cycleEnd.setMonth(cycleEnd.getMonth() + 1);
    } else if (currentSubscription.billing_cycle === 'yearly') {
      cycleEnd.setFullYear(cycleEnd.getFullYear() + 1);
    } else {
      cycleEnd.setFullYear(cycleEnd.getFullYear() + 2);
    }

    const totalCycleDays = Math.ceil(
      (cycleEnd.getTime() - cycleStart.getTime()) / (1000 * 60 * 60 * 24)
    );
    const remainingDays = Math.ceil(
      (cycleEnd.getTime() - effectiveDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    const currentCycleRemaining = Math.max(0, remainingDays);
    const prorationAmount =
      (currentSubscription.price * currentCycleRemaining) / totalCycleDays;
    const newCycleAmount = this.getCyclePrice(
      newTier,
      currentSubscription.billing_cycle
    );

    return {
      current_cycle_remaining: currentCycleRemaining,
      proration_amount: prorationAmount,
      new_cycle_amount: newCycleAmount,
      effective_date: effectiveDate.toISOString(),
    };
  }

  private async logSubscriptionEvent(
    subscriptionId: string,
    eventType: string,
    eventData: any
  ): Promise<void> {
    await this.supabase.from('subscription_analytics').insert({
      subscription_id: subscriptionId,
      event_type: eventType,
      event_data: eventData,
    });
  }
}
