import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

const step2Schema = z.object({
  role_type: z.enum(['personal', 'business'], {
    required_error: 'Role type is required',
    invalid_type_error: 'Role type must be either "personal" or "business"',
  }),
});

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();

    // Get the current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Validate request body
    const body = await request.json();
    const validatedData = step2Schema.parse(body);

    // Update user preferences to store role type
    const { data: profile, error: updateError } = await supabase
      .from('profiles')
      .update({
        preferences: { role_type: validatedData.role_type },
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', user.id)
      .select()
      .single();

    if (updateError) {
      return NextResponse.json(
        { error: 'Failed to update profile preferences' },
        { status: 500 }
      );
    }

    // Determine next step based on role type
    const nextStep =
      validatedData.role_type === 'business' ? 'step3' : 'complete';

    return NextResponse.json({
      success: true,
      next_step: nextStep,
      role_type: validatedData.role_type,
      message: 'Role type saved successfully',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: 'Validation error',
          details: error.errors,
        },
        { status: 400 }
      );
    }

    console.error('Step 2 error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
      },
      { status: 500 }
    );
  }
}
