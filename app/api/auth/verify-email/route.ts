import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';
import { z } from 'zod';

const verifyEmailSchema = z.object({
  token: z.string().min(1, 'Verification token is required'),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = verifyEmailSchema.parse(body);

    const { token } = validatedData;

    // Verify the email token
    const { data: authData, error: authError } =
      await supabaseAdmin.auth.verifyOtp({
        token_hash: token,
        type: 'email',
      });

    if (authError) {
      return NextResponse.json(
        {
          error: 'Invalid or expired verification token',
          details: authError.message,
        },
        { status: 400 }
      );
    }

    if (!authData.user) {
      return NextResponse.json(
        { error: 'Verification failed' },
        { status: 400 }
      );
    }

    // Update user verification status
    const { error: updateError } = await supabaseAdmin
      .from('users')
      .update({ is_verified: true })
      .eq('id', authData.user.id);

    if (updateError) {
      return NextResponse.json(
        { error: 'Failed to update verification status' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: 'Email verified successfully',
      user: {
        id: authData.user.id,
        email: authData.user.email,
        is_verified: true,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
