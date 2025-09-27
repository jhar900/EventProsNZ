import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';
import { z } from 'zod';

const resetPasswordSchema = z.object({
  email: z.string().email('Invalid email format'),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = resetPasswordSchema.parse(body);

    const { email } = validatedData;

    // Check if user exists in our database
    const { data: userData, error: userError } = await supabaseAdmin
      .from('users')
      .select('id, email, role')
      .eq('email', email)
      .single();

    if (userError) {
      // Don't reveal if user exists or not for security
      return NextResponse.json({
        message:
          'If an account with that email exists, a password reset link has been sent.',
      });
    }

    // Send password reset email
    const { error: resetError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'recovery',
      email,
    });

    if (resetError) {
      // Don't reveal the error to the client for security
      return NextResponse.json({
        message:
          'If an account with that email exists, a password reset link has been sent.',
      });
    }

    return NextResponse.json({
      message:
        'If an account with that email exists, a password reset link has been sent.',
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
