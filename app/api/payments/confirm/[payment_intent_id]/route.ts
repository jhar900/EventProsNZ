/**
 * Payment Confirmation API Route
 * Handles payment confirmation and receipt generation
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { StripeService } from '@/lib/payments/stripe-service';
import { PaymentService } from '@/lib/payments/payment-service';
import { ReceiptService } from '@/lib/payments/receipt-service';
import { rateLimit, paymentRateLimiter } from '@/lib/rate-limiting';
import { headers } from 'next/headers';

export async function GET(
  request: NextRequest,
  { params }: { params: { payment_intent_id: string } }
) {
  const stripeService = new StripeService();
  const paymentService = new PaymentService();
  const receiptService = new ReceiptService();
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

    const paymentIntentId = params.payment_intent_id;

    // Get payment from database
    const { data: payment, error: paymentError } = await supabase
      .from('payments')
      .select('*')
      .eq('stripe_payment_intent_id', paymentIntentId)
      .eq('user_id', user.id)
      .single();

    if (paymentError || !payment) {
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 });
    }

    // Get receipt information
    const receipt = await receiptService.getReceiptInfo(payment.id);

    const response = NextResponse.json({
      payment,
      receipt,
      success: true,
    });

    // Add rate limit headers
    Object.entries(rateLimitResult.headers).forEach(([key, value]) => {
      response.headers.set(key, value);
    });

    return response;
  } catch (error) {
    console.error('Get payment confirmation error:', error);
    return NextResponse.json(
      { error: 'Failed to get payment confirmation' },
      { status: 500 }
    );
  }
}
