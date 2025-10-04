/**
 * Confirm Stripe Payment Intent API Route
 * Confirms payment intents and processes payments
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { StripeService } from '@/lib/payments/stripe-service';
import { PaymentService } from '@/lib/payments/payment-service';
import { rateLimit, paymentRateLimiter } from '@/lib/rate-limiting';
import { headers } from 'next/headers';

export async function POST(request: NextRequest) {
  const stripeService = new StripeService();
  const paymentService = new PaymentService();
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

    let payment_intent_id, payment_method_id;
    try {
      const body = await request.json();
      payment_intent_id = body.payment_intent_id;
      payment_method_id = body.payment_method_id;
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid request body', success: false },
        { status: 400 }
      );
    }

    if (!payment_intent_id) {
      return NextResponse.json(
        { error: 'Missing required field: payment_intent_id', success: false },
        { status: 400 }
      );
    }

    if (!payment_method_id) {
      return NextResponse.json(
        { error: 'Missing required field: payment_method_id', success: false },
        { status: 400 }
      );
    }

    // Confirm payment intent with Stripe
    let paymentIntent;
    try {
      paymentIntent = await stripeService.confirmPaymentIntent(
        payment_intent_id,
        payment_method_id
      );
    } catch (error) {
      console.error('Stripe service error:', error);
      return NextResponse.json(
        { error: 'Failed to confirm payment', success: false },
        { status: 500 }
      );
    }

    if (paymentIntent.status !== 'succeeded') {
      return NextResponse.json(
        { error: 'Payment confirmation failed', success: false },
        { status: 400 }
      );
    }

    // Get subscription from payment intent metadata
    const subscriptionId = paymentIntent.metadata?.subscription_id;
    if (!subscriptionId) {
      return NextResponse.json(
        { error: 'Invalid payment intent', success: false },
        { status: 400 }
      );
    }

    // Verify subscription belongs to user
    const { data: subscription, error: subError } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('id', subscriptionId)
      .eq('user_id', user.id)
      .single();

    if (subError || !subscription) {
      return NextResponse.json(
        { error: 'Subscription not found', success: false },
        { status: 404 }
      );
    }

    // Create payment record
    let payment;
    try {
      payment = await paymentService.createPayment({
        subscription_id: subscriptionId,
        stripe_payment_intent_id: payment_intent_id,
        amount: paymentIntent.amount / 100, // Convert from cents
        currency: paymentIntent.currency.toUpperCase(),
        status: 'succeeded',
        payment_method: paymentIntent.payment_method?.type || 'card',
        receipt_url: paymentIntent.charges?.data?.[0]?.receipt_url || null,
      });
    } catch (error) {
      console.error('Payment creation error:', error);
      return NextResponse.json(
        { error: 'Failed to save payment', success: false },
        { status: 500 }
      );
    }

    // Update subscription status to active
    await supabase
      .from('subscriptions')
      .update({
        status: 'active',
        updated_at: new Date().toISOString(),
      })
      .eq('id', subscriptionId);

    // Get request metadata for audit logging
    const headersList = headers();
    const metadata = {
      ipAddress:
        headersList.get('x-forwarded-for') ||
        headersList.get('x-real-ip') ||
        'unknown',
      userAgent: headersList.get('user-agent') || 'unknown',
    };

    // Log successful payment
    await supabase.from('payment_analytics').insert({
      event_type: 'payment_succeeded',
      event_data: {
        payment_id: payment.id,
        payment_intent_id,
        subscription_id: subscriptionId,
        amount: payment.amount,
        currency: payment.currency,
      },
      user_id: user.id,
      metadata,
    });

    const response = NextResponse.json({
      payment,
      success: true,
    });

    // Add rate limit headers
    Object.entries(rateLimitResult.headers).forEach(([key, value]) => {
      response.headers.set(key, value);
    });

    return response;
  } catch (error) {
    console.error('Payment confirmation error:', error);
    return NextResponse.json(
      { error: 'Failed to confirm payment', success: false },
      { status: 500 }
    );
  }
}
