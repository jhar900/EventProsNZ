/**
 * Create Stripe Payment Intent API Route
 * Creates payment intents for subscription payments
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { StripeService } from '@/lib/payments/stripe-service';
import { rateLimit, paymentRateLimiter } from '@/lib/rate-limiting';
import { headers } from 'next/headers';

const stripeService = new StripeService();

export async function POST(request: NextRequest) {
  try {
    // Apply rate limiting
    const rateLimitResult = rateLimit(request, paymentRateLimiter);
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

    let requestBody;
    try {
      requestBody = await request.json();
    } catch (error) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid request body',
        },
        { status: 400 }
      );
    }

    const { subscription_id, amount, currency = 'NZD' } = requestBody;

    if (!subscription_id || !amount) {
      return NextResponse.json(
        { error: 'Missing required fields: subscription_id, amount' },
        { status: 400 }
      );
    }

    if (amount < 50) {
      return NextResponse.json(
        { error: 'Amount must be at least 50 cents' },
        { status: 400 }
      );
    }

    // Validate currency format
    if (!/^[A-Z]{3}$/.test(currency)) {
      return NextResponse.json(
        {
          success: false,
          error:
            'Invalid currency format. Must be 3 uppercase letters (e.g., NZD, USD)',
        },
        { status: 400 }
      );
    }

    // Verify subscription belongs to user
    const { data: subscription, error: subError } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('id', subscription_id)
      .eq('user_id', user.id)
      .single();

    if (subError || !subscription) {
      if (subError) {
        return NextResponse.json(
          {
            success: false,
            error: `Database error: ${subError.message}`,
          },
          { status: 500 }
        );
      }
      return NextResponse.json(
        { error: 'Subscription not found' },
        { status: 404 }
      );
    }

    // Get user email for Stripe customer
    const { data: userData } = await supabase
      .from('users')
      .select('email')
      .eq('id', user.id)
      .single();

    if (!userData?.email) {
      return NextResponse.json(
        { error: 'User email not found' },
        { status: 400 }
      );
    }

    // Get or create Stripe customer
    const stripeCustomer = await stripeService.getOrCreateCustomer(
      user.id,
      userData.email
    );

    // Create payment intent
    const paymentIntent = await stripeService.createPaymentIntent({
      amount: Math.round(amount * 100), // Convert to cents
      currency: currency.toLowerCase(),
      customer: stripeCustomer.id,
      metadata: {
        subscription_id,
        user_id: user.id,
        tier: subscription.tier,
        billing_cycle: subscription.billing_cycle,
      },
    });

    // Get request metadata for audit logging
    const headersList = headers();
    const metadata = {
      ipAddress:
        headersList.get('x-forwarded-for') ||
        headersList.get('x-real-ip') ||
        'unknown',
      userAgent: headersList.get('user-agent') || 'unknown',
    };

    // Log payment intent creation
    await supabase.from('payment_analytics').insert({
      event_type: 'payment_intent_created',
      event_data: {
        payment_intent_id: paymentIntent.id,
        subscription_id,
        amount,
        currency,
        stripe_customer_id: stripeCustomer.id,
      },
      user_id: user.id,
      metadata,
    });

    const response = NextResponse.json({
      client_secret: paymentIntent.client_secret,
      payment_intent_id: paymentIntent.id,
      success: true,
    });

    // Add rate limit headers
    Object.entries(rateLimitResult.headers).forEach(([key, value]) => {
      response.headers.set(key, value);
    });

    return response;
  } catch (error) {
    console.error('Payment intent creation error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create payment intent',
      },
      { status: 500 }
    );
  }
}
