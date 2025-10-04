/**
 * Bank Transfer Fallback API Route
 * Handles bank transfer payments as fallback option
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { BankTransferService } from '@/lib/payments/bank-transfer-service';
import { rateLimit, paymentRateLimiter } from '@/lib/rate-limiting';
import { headers } from 'next/headers';

const bankTransferService = new BankTransferService();

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

    const { subscription_id, amount, reference } = await request.json();

    if (!subscription_id || !amount) {
      return NextResponse.json(
        { error: 'Missing required fields: subscription_id, amount' },
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
      return NextResponse.json(
        { error: 'Subscription not found' },
        { status: 404 }
      );
    }

    // Create bank transfer request
    const bankTransfer = await bankTransferService.createBankTransfer({
      subscription_id,
      amount,
      reference: reference || `EventProsNZ-${subscription_id.slice(-8)}`,
      user_id: user.id,
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

    // Log bank transfer creation
    await supabase.from('payment_analytics').insert({
      event_type: 'bank_transfer_created',
      event_data: {
        bank_transfer_id: bankTransfer.id,
        subscription_id,
        amount,
        reference: bankTransfer.reference,
      },
      user_id: user.id,
      metadata,
    });

    const response = NextResponse.json({
      bank_transfer: bankTransfer,
      success: true,
    });

    // Add rate limit headers
    Object.entries(rateLimitResult.headers).forEach(([key, value]) => {
      response.headers.set(key, value);
    });

    return response;
  } catch (error) {
    console.error('Create bank transfer error:', error);
    return NextResponse.json(
      { error: 'Failed to create bank transfer' },
      { status: 500 }
    );
  }
}
