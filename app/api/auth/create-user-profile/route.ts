import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';
import { z } from 'zod';

const createUserSchema = z.object({
  user_id: z.string().uuid('Invalid user ID'),
  email: z.string().email('Invalid email format'),
  role: z.enum(['event_manager', 'contractor', 'admin']),
  first_name: z.string().min(1, 'First name is required'),
  last_name: z.string().min(1, 'Last name is required'),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = createUserSchema.parse(body);

    const { user_id, email, role, first_name, last_name } = validatedData;

    // Create user record in our database using admin client
    const { error: userError } = await supabaseAdmin.from('users').insert({
      id: user_id,
      email,
      role,
      is_verified: true,
      last_login: new Date().toISOString(),
    });

    if (userError) {
      console.error('Failed to create user record:', userError);
      return NextResponse.json(
        { error: 'Failed to create user record', details: userError.message },
        { status: 500 }
      );
    }

    // Create profile record
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .insert({
        user_id,
        first_name,
        last_name,
        timezone: 'Pacific/Auckland',
      });

    if (profileError) {
      console.error('Failed to create profile:', profileError);
      return NextResponse.json(
        { error: 'Failed to create profile', details: profileError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: 'User profile created successfully',
      user: {
        id: user_id,
        email,
        role,
        first_name,
        last_name,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Create user profile error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
