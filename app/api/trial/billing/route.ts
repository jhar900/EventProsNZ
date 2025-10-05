import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { rateLimit } from '@/lib/rate-limiting';

// Fraud detection function
async function performFraudDetectionChecks(
  userId: string,
  tier: string,
  paymentMethodId: string
): Promise<void> {
  const supabase = createClient();

  // Check for suspicious patterns
  const suspiciousPatterns = await checkSuspiciousPatterns(userId, tier);
  if (suspiciousPatterns.length > 0) {
    throw new Error(
      `Fraud detection triggered: ${suspiciousPatterns.join(', ')}`
    );
  }

  // Check for multiple conversion attempts
  const { data: recentConversions } = await supabase
    .from('trial_conversions')
    .select('*')
    .eq('user_id', userId)
    .eq('conversion_status', 'converted')
    .gte(
      'created_at',
      new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
    ); // Last 24 hours

  if (recentConversions && recentConversions.length > 0) {
    throw new Error('Multiple conversion attempts detected within 24 hours');
  }

  // Check for unusual payment patterns
  const { data: paymentHistory } = await supabase
    .from('subscription_analytics')
    .select('*')
    .eq('event_type', 'trial_conversion')
    .gte(
      'created_at',
      new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
    ); // Last 7 days

  if (paymentHistory && paymentHistory.length > 5) {
    throw new Error('Unusual payment activity detected');
  }

  // Log fraud detection check
  await supabase.from('security_audit_log').insert({
    event_type: 'fraud_detection_check',
    user_id: userId,
    event_data: {
      tier,
      payment_method_id: paymentMethodId,
      timestamp: new Date().toISOString(),
    },
  });
}

// Check for suspicious patterns
async function checkSuspiciousPatterns(
  userId: string,
  tier: string
): Promise<string[]> {
  const supabase = createClient();
  const suspiciousPatterns: string[] = [];

  // Check for rapid tier upgrades
  const { data: recentUpgrades } = await supabase
    .from('subscription_analytics')
    .select('*')
    .eq('user_id', userId)
    .eq('event_type', 'trial_conversion')
    .gte('created_at', new Date(Date.now() - 60 * 60 * 1000).toISOString()); // Last hour

  if (recentUpgrades && recentUpgrades.length > 2) {
    suspiciousPatterns.push('Rapid tier upgrades detected');
  }

  // Check for unusual tier selection patterns
  if (tier === 'spotlight' && recentUpgrades && recentUpgrades.length === 0) {
    // First-time user selecting highest tier might be suspicious
    const { data: userProfile } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (!userProfile || !userProfile.bio || userProfile.bio.length < 50) {
      suspiciousPatterns.push('High-tier selection without profile completion');
    }
  }

  return suspiciousPatterns;
}

// Rate limiting configuration for trial billing
const trialBillingRateLimiter = {
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 requests per window
  message: 'Too many trial billing requests, please try again later',
};

export async function POST(request: NextRequest) {
  try {
    // Apply rate limiting
    const rateLimitResult = rateLimit(request, trialBillingRateLimiter);
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { error: rateLimitResult.message },
        {
          status: 429,
          headers: rateLimitResult.headers,
        }
      );
    }

    const supabase = createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { user_id, tier, payment_method_id } = body;

    // Validate input
    if (!user_id || !tier || !payment_method_id) {
      return NextResponse.json(
        { error: 'user_id, tier, and payment_method_id are required' },
        { status: 400 }
      );
    }

    const validTiers = ['essential', 'showcase', 'spotlight'];
    if (!validTiers.includes(tier)) {
      return NextResponse.json(
        {
          error: 'Invalid tier. Must be one of: essential, showcase, spotlight',
        },
        { status: 400 }
      );
    }

    // Check if user can process billing for this user
    if (user_id !== user.id) {
      const { data: userData } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single();

      if (userData?.role !== 'admin') {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    }

    // Get current subscription
    const { data: subscription, error: subscriptionError } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', user_id)
      .eq('status', 'trial')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (subscriptionError || !subscription) {
      return NextResponse.json(
        { error: 'No active trial subscription found' },
        { status: 404 }
      );
    }

    // Get pricing for the selected tier
    const { data: pricing, error: pricingError } = await supabase
      .from('subscription_pricing')
      .select('*')
      .eq('tier', tier)
      .eq('billing_cycle', subscription.billing_cycle)
      .eq('is_active', true)
      .single();

    if (pricingError || !pricing) {
      return NextResponse.json(
        { error: 'Pricing not found for selected tier' },
        { status: 404 }
      );
    }

    // Fraud detection checks
    await performFraudDetectionChecks(user_id, tier, payment_method_id);

    // Get user email for Stripe customer
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('email')
      .eq('id', user_id)
      .single();

    if (userError || !userData) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Initialize Stripe service
    const { StripeService } = await import('@/lib/payments/stripe-service');
    const stripeService = new StripeService();

    try {
      // Create or get Stripe customer
      const stripeCustomer = await stripeService.getOrCreateCustomer(
        user_id,
        userData.email
      );

      // Get or create Stripe price for the tier
      let stripePriceId = pricing.stripe_price_id;

      if (!stripePriceId) {
        // Create a new price if one doesn't exist
        const stripePrice = await stripeService.createPrice(
          'prod_eventpros', // Default product ID - should be configured
          Math.round(pricing.price * 100), // Convert to cents
          'nzd',
          subscription.billing_cycle === 'yearly' ? 'year' : 'month'
        );
        stripePriceId = stripePrice.id;

        // Update pricing record with Stripe price ID
        await supabase
          .from('subscription_pricing')
          .update({ stripe_price_id: stripePriceId })
          .eq('id', pricing.id);
      }

      // Create Stripe subscription
      const stripeSubscription = await stripeService.createSubscription(
        stripeCustomer.id,
        stripePriceId,
        payment_method_id
      );

      const stripeSubscriptionId = stripeSubscription.id;
      const stripeCustomerId = stripeCustomer.id;

      // Update subscription to active
      const { data: updatedSubscription, error: updateError } = await supabase
        .from('subscriptions')
        .update({
          status: 'active',
          tier: tier,
          price: pricing.price,
          stripe_subscription_id: stripeSubscriptionId,
          stripe_customer_id: stripeCustomerId,
          end_date: null, // Remove end date for active subscription
          updated_at: new Date().toISOString(),
        })
        .eq('id', subscription.id)
        .select()
        .single();

      if (updateError) {
        throw new Error(
          `Failed to update subscription: ${updateError.message}`
        );
      }

      // Update trial conversion status
      const { data: trialConversion, error: conversionError } = await supabase
        .from('trial_conversions')
        .select('*')
        .eq('user_id', user_id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (trialConversion && !conversionError) {
        const { error: updateConversionError } = await supabase
          .from('trial_conversions')
          .update({
            conversion_status: 'converted',
            conversion_tier: tier,
            conversion_date: new Date().toISOString(),
            conversion_reason: 'Trial converted to paid subscription',
            updated_at: new Date().toISOString(),
          })
          .eq('id', trialConversion.id);

        if (updateConversionError) {
          console.error(
            'Failed to update trial conversion status:',
            updateConversionError
          );
          // Don't fail the request, just log the error
        }
      }

      // Log the conversion event
      const { error: logError } = await supabase
        .from('subscription_analytics')
        .insert({
          subscription_id: subscription.id,
          event_type: 'trial_conversion',
          event_data: {
            conversion_date: new Date().toISOString(),
            previous_tier: subscription.tier,
            new_tier: tier,
            payment_method_id: payment_method_id,
            stripe_subscription_id: stripeSubscriptionId,
          },
        });

      if (logError) {
        console.error('Failed to log conversion event:', logError);
        // Don't fail the request, just log the error
      }

      const response = NextResponse.json({
        subscription: updatedSubscription,
        success: true,
        message: 'Trial converted to paid subscription successfully',
        stripe_subscription_id: stripeSubscriptionId,
        stripe_customer_id: stripeCustomerId,
      });

      // Add rate limit headers
      Object.entries(rateLimitResult.headers).forEach(([key, value]) => {
        response.headers.set(key, value);
      });

      return response;
    } catch (stripeError) {
      console.error('Stripe integration error:', stripeError);
      return NextResponse.json(
        {
          error: 'Payment processing failed',
          details:
            stripeError instanceof Error
              ? stripeError.message
              : 'Unknown error',
        },
        { status: 500 }
      );
    }
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to process trial billing' },
      { status: 500 }
    );
  }
}
