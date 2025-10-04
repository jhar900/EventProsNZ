import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { PaymentService } from '@/lib/payments/payment-service';
import { BankTransferService } from '@/lib/payments/bank-transfer-service';

export async function POST(request: NextRequest) {
  try {
    const { payment_id, payment_method_id } = await request.json();

    if (!payment_id) {
      return NextResponse.json(
        { error: 'Payment ID is required' },
        { status: 400 }
      );
    }

    const supabase = createClient();
    const paymentService = new PaymentService();
    const bankTransferService = new BankTransferService();

    // Get the failed payment details
    const payment = await paymentService.getPayment(payment_id);

    if (!payment) {
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 });
    }

    if (payment.status !== 'failed') {
      return NextResponse.json(
        { error: 'Payment is not in failed status' },
        { status: 400 }
      );
    }

    // Check if payment is within retry window
    const gracePeriodEnd = new Date(payment.created_at);
    gracePeriodEnd.setDate(gracePeriodEnd.getDate() + 7); // 7-day grace period

    if (new Date() > gracePeriodEnd) {
      return NextResponse.json(
        { error: 'Payment retry window has expired' },
        { status: 400 }
      );
    }

    // Retry the payment
    let retryResult;

    if (payment_method_id) {
      // Retry with different payment method
      retryResult = await paymentService.retryPaymentWithMethod(
        payment_id,
        payment_method_id
      );
    } else {
      // Retry with same payment method
      retryResult = await paymentService.retryPayment(payment_id);
    }

    if (retryResult.success) {
      return NextResponse.json({
        success: true,
        payment: retryResult.payment,
        message: 'Payment retry successful',
      });
    } else {
      return NextResponse.json(
        {
          error: 'Payment retry failed',
          details: retryResult.error,
        },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Payment retry error:', error);
    return NextResponse.json(
      { error: 'Failed to retry payment' },
      { status: 500 }
    );
  }
}
