/**
 * Payment Methods API Route
 * Manages payment methods for users
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { StripeService } from '@/lib/payments/stripe-service';
import { PaymentMethodService } from '@/lib/payments/method-service';
import { rateLimit, paymentRateLimiter } from '@/lib/rate-limiting';
import { headers } from 'next/headers';

const stripeService = new StripeService();
const paymentMethodService = new PaymentMethodService();

export async function GET(request: NextRequest) {
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

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('user_id') || user.id;

    // Check if requesting user's own data or admin
    if (userId !== user.id) {
      const { data: userData } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single();

      if (userData?.role !== 'admin') {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    }

    // Get user's payment methods
    const paymentMethods = await paymentMethodService.getPaymentMethods(userId);

    const response = NextResponse.json({
      payment_methods: paymentMethods,
      success: true,
    });

    // Add rate limit headers
    Object.entries(rateLimitResult.headers).forEach(([key, value]) => {
      response.headers.set(key, value);
    });

    return response;
  } catch (error) {
    console.error('Get payment methods error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch payment methods', success: false },
      { status: 500 }
    );
  }
}

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

    const {
      stripe_payment_method_id,
      type,
      is_default = false,
    } = await request.json();

    if (!stripe_payment_method_id || !type) {
      return NextResponse.json(
        {
          error: 'Missing required fields: stripe_payment_method_id, type',
          success: false,
        },
        { status: 400 }
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

    // Attach payment method to customer
    await stripeService.attachPaymentMethod(
      stripe_payment_method_id,
      stripeCustomer.id
    );

    // Get payment method details from Stripe
    const stripePaymentMethod = await stripeService.getPaymentMethod(
      stripe_payment_method_id
    );

    // Create payment method record
    const paymentMethod = await paymentMethodService.createPaymentMethod({
      user_id: user.id,
      stripe_payment_method_id,
      type,
      last_four: stripePaymentMethod.card?.last4 || '',
      brand: stripePaymentMethod.card?.brand || '',
      exp_month: stripePaymentMethod.card?.exp_month || null,
      exp_year: stripePaymentMethod.card?.exp_year || null,
      is_default,
    });

    // If this is set as default, update other payment methods
    if (is_default) {
      await paymentMethodService.setDefaultPaymentMethod(
        user.id,
        paymentMethod.id
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

    // Log payment method creation
    await supabase.from('payment_analytics').insert({
      event_type: 'payment_method_created',
      event_data: {
        payment_method_id: paymentMethod.id,
        stripe_payment_method_id,
        type,
        is_default,
      },
      user_id: user.id,
      metadata,
    });

    const response = NextResponse.json(
      {
        payment_method: paymentMethod,
        success: true,
      },
      { status: 201 }
    );

    // Add rate limit headers
    Object.entries(rateLimitResult.headers).forEach(([key, value]) => {
      response.headers.set(key, value);
    });

    return response;
  } catch (error) {
    console.error('Create payment method error:', error);
    return NextResponse.json(
      { error: 'Failed to create payment method', success: false },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
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

    const { searchParams } = new URL(request.url);
    const paymentMethodId = searchParams.get('id');

    if (!paymentMethodId) {
      return NextResponse.json(
        { error: 'Missing required parameter: id' },
        { status: 400 }
      );
    }

    // Verify payment method belongs to user
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

    // Delete payment method from Stripe
    await stripeService.detachPaymentMethod(
      paymentMethod.stripe_payment_method_id
    );

    // Delete payment method from database
    const { error: deleteError } = await supabase
      .from('payment_methods')
      .delete()
      .eq('id', paymentMethodId);

    if (deleteError) {
      throw new Error(
        `Failed to delete payment method: ${deleteError.message}`
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
      { error: 'Failed to delete payment method' },
      { status: 500 }
    );
  }
}
