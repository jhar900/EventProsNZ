/**
 * Send Payment Receipt API Route
 * Sends payment receipts via email
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { ReceiptService } from '@/lib/payments/receipt-service';
import { rateLimit, paymentRateLimiter } from '@/lib/rate-limiting';
import { headers } from 'next/headers';

export async function POST(request: NextRequest) {
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

    const { payment_id, email } = await request.json();

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

    // Get user email if not provided
    const recipientEmail = email || user.email;
    if (!recipientEmail) {
      return NextResponse.json(
        { error: 'Email address required' },
        { status: 400 }
      );
    }

    // Send receipt
    const receiptUrl = await receiptService.sendReceipt(
      payment.id,
      recipientEmail
    );

    // Get request metadata for audit logging
    const headersList = headers();
    const metadata = {
      ipAddress:
        headersList.get('x-forwarded-for') ||
        headersList.get('x-real-ip') ||
        'unknown',
      userAgent: headersList.get('user-agent') || 'unknown',
    };

    // Log receipt sending
    await supabase.from('payment_analytics').insert({
      event_type: 'receipt_sent',
      event_data: {
        payment_id,
        recipient_email: recipientEmail,
        receipt_url: receiptUrl,
      },
      user_id: user.id,
      metadata,
    });

    const response = NextResponse.json({
      receipt_url: receiptUrl,
      success: true,
    });

    // Add rate limit headers
    Object.entries(rateLimitResult.headers).forEach(([key, value]) => {
      response.headers.set(key, value);
    });

    return response;
  } catch (error) {
    console.error('Send receipt error:', error);
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: `Failed to send receipt: ${errorMessage}` },
      { status: 500 }
    );
  }
}
