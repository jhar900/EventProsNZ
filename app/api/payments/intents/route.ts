import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { PaymentService } from '@/lib/payments/payment-service';
import { rateLimit } from '@/lib/rate-limiting';

const paymentService = new PaymentService();

export async function GET(request: NextRequest) {
  try {
    // Rate limiting
    const rateLimitResult = await rateLimit(request, 'payment-intents');
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { error: 'Rate limit exceeded' },
        { status: 429, headers: rateLimitResult.headers }
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
    let paymentIntentId = searchParams.get('payment_intent_id');
    const id = searchParams.get('id');

    // If id is provided, use it as payment_intent_id
    if (id && !paymentIntentId) {
      paymentIntentId = id;
    }

    // If no parameters provided, require id parameter
    if (!id && !paymentIntentId) {
      return NextResponse.json(
        { error: 'Missing required parameter: id' },
        { status: 400 }
      );
    }

    if (paymentIntentId) {
      // Get specific payment intent
      const payment =
        await paymentService.getPaymentByStripeIntent(paymentIntentId);

      if (!payment) {
        return NextResponse.json(
          { error: 'Payment intent not found' },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        payment_intents: {
          success: true,
          data: payment,
        },
      });
    } else {
      // Get user's payment intents
      const payments = await paymentService.getUserPayments(user.id);

      return NextResponse.json({
        success: true,
        payment_intents: payments,
      });
    }
  } catch (error) {
    console.error('Error fetching payment intents:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const rateLimitResult = await rateLimit(request, 'payment-intents');
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { error: 'Rate limit exceeded' },
        { status: 429, headers: rateLimitResult.headers }
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
    const { amount, currency, payment_method_id, subscription_id, metadata } =
      body;

    // Validate required fields
    if (!amount || !currency) {
      return NextResponse.json(
        { error: 'Missing required fields: amount, currency' },
        { status: 400 }
      );
    }

    // Validate amount
    if (amount <= 0) {
      return NextResponse.json(
        { error: 'Amount must be greater than 0' },
        { status: 400 }
      );
    }

    // Create payment intent
    const paymentIntent = await paymentService.createPaymentIntent({
      amount,
      currency: currency.toLowerCase(),
      payment_method_id,
      subscription_id,
      metadata,
      user_id: user.id,
    });

    if (!paymentIntent.success) {
      return NextResponse.json(
        { error: paymentIntent.error || 'Failed to create payment intent' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        payment_intent: paymentIntent.data,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating payment intent:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
