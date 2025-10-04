/**
 * Failed Payments API Route
 * Handles failed payment management and retry functionality
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { PaymentService } from '@/lib/payments/payment-service';
import { FailedPaymentService } from '@/lib/payments/failed-payment-service';
import { rateLimit, paymentRateLimiter } from '@/lib/rate-limiting';
import { headers } from 'next/headers';

// Services will be instantiated inside functions to allow proper mocking

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
    const status = searchParams.get('status');

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

    // Get failed payments
    const failedPaymentService = new FailedPaymentService();
    const failedPayments = await failedPaymentService.getFailedPayments(
      userId,
      status
    );

    const response = NextResponse.json({
      failed_payments: failedPayments,
      success: true,
    });

    // Add rate limit headers
    Object.entries(rateLimitResult.headers).forEach(([key, value]) => {
      response.headers.set(key, value);
    });

    return response;
  } catch (error) {
    console.error('Get failed payments error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch failed payments' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Parse JSON first to catch malformed JSON errors
    let requestBody;
    try {
      requestBody = await request.json();
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 }
      );
    }

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

    const { payment_id, payment_method_id } = requestBody;

    if (!payment_id) {
      return NextResponse.json(
        { error: 'Missing required field: payment_id' },
        { status: 400 }
      );
    }

    // Verify payment belongs to user
    const { data: payment, error: paymentError } = await supabase
      .from('payments')
      .select('*')
      .eq('id', payment_id)
      .eq('user_id', user.id)
      .single();

    if (paymentError || !payment) {
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 });
    }

    // Retry failed payment
    const failedPaymentService = new FailedPaymentService();
    const retryResult = await failedPaymentService.retryFailedPayment(
      payment_id,
      payment_method_id
    );

    if (!retryResult.success) {
      return NextResponse.json(
        { error: retryResult.error || 'Payment retry failed' },
        { status: 400 }
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

    // Log payment retry
    await supabase.from('payment_analytics').insert({
      event_type: 'payment_retry',
      event_data: {
        payment_id,
        payment_method_id,
        success: retryResult.success,
      },
      user_id: user.id,
      metadata,
    });

    const response = NextResponse.json({
      payment: retryResult.payment,
      success: true,
    });

    // Add rate limit headers
    Object.entries(rateLimitResult.headers).forEach(([key, value]) => {
      response.headers.set(key, value);
    });

    return response;
  } catch (error) {
    console.error('Retry failed payment error:', error);
    return NextResponse.json(
      { error: 'Failed to retry payment' },
      { status: 500 }
    );
  }
}
