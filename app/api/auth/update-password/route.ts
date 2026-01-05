import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';
import { z } from 'zod';

const updatePasswordSchema = z.object({
  token: z.string().min(1, 'Token is required'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      'Password must contain at least one uppercase letter, one lowercase letter, and one number'
    ),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = updatePasswordSchema.parse(body);

    const { token, password } = validatedData;

    // Extract token from the URL - Supabase recovery links can have tokens in different formats
    // The token might be in the hash (#access_token=...) or as a query parameter
    // We'll use Supabase's verifyOtp or updateUser method depending on the token format

    // First, try to exchange the recovery token for a session
    // Supabase recovery links typically have the token in the URL hash
    // We need to extract it and use it to update the password

    // The token from generateLink is typically a hashed token that needs to be used
    // with Supabase's updateUser method
    // However, for recovery links, we need to use the exchangeCodeForSession or
    // verifyOtp method first, then update the password

    // Check if this is a recovery token (from email link)
    // Supabase recovery tokens are typically used with verifyOtp
    const { data: verifyData, error: verifyError } =
      await supabaseAdmin.auth.verifyOtp({
        token_hash: token,
        type: 'recovery',
      });

    if (verifyError) {
      // If verifyOtp fails, try using the token directly with updateUser
      // The token might be in a different format
      console.error('[Update Password] Verify OTP error:', verifyError);

      // Try alternative: the token might be a code that needs to be exchanged
      // Or it might be in the URL hash format
      return NextResponse.json(
        {
          error:
            'Invalid or expired reset token. Please request a new password reset link.',
        },
        { status: 400 }
      );
    }

    // If verification succeeded, we should have a session
    // Now update the password using the admin client
    if (verifyData?.user?.id) {
      const { error: updateError } =
        await supabaseAdmin.auth.admin.updateUserById(verifyData.user.id, {
          password: password,
        });

      if (updateError) {
        console.error('[Update Password] Update error:', updateError);
        return NextResponse.json(
          { error: 'Failed to update password. Please try again.' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        message: 'Password updated successfully',
      });
    }

    // If we don't have a user ID, the token verification didn't work as expected
    return NextResponse.json(
      {
        error:
          'Invalid or expired reset token. Please request a new password reset link.',
      },
      { status: 400 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Update password error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
