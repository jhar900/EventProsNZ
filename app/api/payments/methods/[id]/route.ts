/**
 * Payment Method by ID API Route
 * Manages individual payment methods
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { StripeService } from '@/lib/payments/stripe-service';
import { PaymentMethodService } from '@/lib/payments/method-service';
import { rateLimit, paymentRateLimiter } from '@/lib/rate-limiting';
import { headers } from 'next/headers';

const stripeService = new StripeService();
const paymentMethodService = new PaymentMethodService();

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const paymentMethodId = params.id;

    if (!paymentMethodId) {
      return NextResponse.json(
        { error: 'Missing required parameter: id', success: false },
        { status: 400 }
      );
    }

    // Get payment method and verify ownership
    const { data: paymentMethod, error: pmError } = await supabase
      .from('payment_methods')
      .select('*')
      .eq('id', paymentMethodId)
      .eq('user_id', user.id)
      .single();

    if (pmError || !paymentMethod) {
      return NextResponse.json(
        { error: 'Payment method not found' },
        { status: 404 }
      );
    }

    // Detach from Stripe
    await stripeService.detachPaymentMethod(
      paymentMethod.stripe_payment_method_id
    );

    // Delete from database
    await paymentMethodService.deletePaymentMethod(paymentMethodId);

    // Get request metadata for audit logging
    const headersList = headers();
    const metadata = {
      ipAddress:
        headersList.get('x-forwarded-for') ||
        headersList.get('x-real-ip') ||
        'unknown',
      userAgent: headersList.get('user-agent') || 'unknown',
    };

    // Log payment method deletion
    await supabase.from('payment_analytics').insert({
      event_type: 'payment_method_deleted',
      event_data: {
        payment_method_id: paymentMethodId,
        stripe_payment_method_id: paymentMethod.stripe_payment_method_id,
      },
      user_id: user.id,
      metadata,
    });

    const response = NextResponse.json({
      success: true,
    });

    // Add rate limit headers
    Object.entries(rateLimitResult.headers).forEach(([key, value]) => {
      response.headers.set(key, value);
    });

    return response;
  } catch (error) {
    console.error('Delete payment method error:', error);
    return NextResponse.json(
      { error: 'Failed to delete payment method', success: false },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const paymentMethodId = params.id;
    const { is_default } = await request.json();

    // Get payment method and verify ownership
    const { data: paymentMethod, error: pmError } = await supabase
      .from('payment_methods')
      .select('*')
      .eq('id', paymentMethodId)
      .eq('user_id', user.id)
      .single();

    if (pmError || !paymentMethod) {
      return NextResponse.json(
        { error: 'Payment method not found' },
        { status: 404 }
      );
    }

    // Update payment method
    const updatedPaymentMethod = await paymentMethodService.updatePaymentMethod(
      paymentMethodId,
      { is_default }
    );

    // If setting as default, update other payment methods
    if (is_default) {
      await paymentMethodService.setDefaultPaymentMethod(
        user.id,
        paymentMethodId
      );
    }

    // Get request metadata for audit logging
    const headersList = headers();
    const metadata = {
      ipAddress:
        headersList.get('x-forwarded-for') ||
        headersList.get('x-real-ip') ||
        'unknown',
      userAgent: headersList.get('user-agent') || 'unknown',
    };

    // Log payment method update
    await supabase.from('payment_analytics').insert({
      event_type: 'payment_method_updated',
      event_data: {
        payment_method_id: paymentMethodId,
        is_default,
      },
      user_id: user.id,
      metadata,
    });

    const response = NextResponse.json({
      payment_method: updatedPaymentMethod,
      success: true,
    });

    // Add rate limit headers
    Object.entries(rateLimitResult.headers).forEach(([key, value]) => {
      response.headers.set(key, value);
    });

    return response;
  } catch (error) {
    console.error('Update payment method error:', error);
    return NextResponse.json(
      { error: 'Failed to update payment method' },
      { status: 500 }
    );
  }
}
