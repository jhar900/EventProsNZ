/**
 * Bank Transfer Status API Route
 * Checks bank transfer payment status
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { BankTransferService } from '@/lib/payments/bank-transfer-service';
import { rateLimit, paymentRateLimiter } from '@/lib/rate-limiting';
import { headers } from 'next/headers';

const bankTransferService = new BankTransferService();

export async function GET(
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

    const bankTransferId = params.id;

    // Get bank transfer and verify ownership
    const { data: bankTransfer, error: btError } = await supabase
      .from('bank_transfers')
      .select('*')
      .eq('id', bankTransferId)
      .eq('user_id', user.id)
      .single();

    if (btError || !bankTransfer) {
      return NextResponse.json(
        { error: 'Bank transfer not found' },
        { status: 404 }
      );
    }

    // Get bank transfer status
    const status =
      await bankTransferService.getBankTransferStatus(bankTransferId);

    const response = NextResponse.json({
      status: status.status,
      payment: status.payment,
      success: true,
    });

    // Add rate limit headers
    Object.entries(rateLimitResult.headers).forEach(([key, value]) => {
      response.headers.set(key, value);
    });

    return response;
  } catch (error) {
    console.error('Get bank transfer status error:', error);
    return NextResponse.json(
      { error: 'Failed to get bank transfer status' },
      { status: 500 }
    );
  }
}
