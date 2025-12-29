import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/middleware';
import { supabaseAdmin } from '@/lib/supabase/server';
import { validateAdminAccess } from '@/lib/middleware/admin-auth';
import { z } from 'zod';

const updateProfileSchema = z.object({
  first_name: z.string().min(1).max(50).optional(),
  last_name: z.string().min(1).max(50).optional(),
  phone: z.string().optional().nullable(),
  address: z.string().max(200).optional().nullable(),
  bio: z.string().max(500).optional().nullable(),
  location: z.string().max(100).optional().nullable(),
  timezone: z.string().max(50).optional(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const authResult = await validateAdminAccess(request);
    if (!authResult.success) {
      return (
        authResult.response ||
        NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      );
    }

    const { userId } = params;
    const adminSupabase = authResult.supabase || supabaseAdmin;

    // Get profile for this user
    const { data: profile, error: profileError } = await adminSupabase
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (profileError) {
      console.error('Error fetching profile:', profileError);
      return NextResponse.json(
        {
          error: 'Failed to fetch profile',
          details: profileError.message,
        },
        { status: 500 }
      );
    }

    if (!profile) {
      return NextResponse.json({ profile: null });
    }

    return NextResponse.json({ profile });
  } catch (error) {
    console.error('Error in GET /api/admin/users/[userId]/profile:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const authResult = await validateAdminAccess(request);
    if (!authResult.success) {
      return (
        authResult.response ||
        NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      );
    }

    const { userId } = params;
    const adminSupabase = authResult.supabase || supabaseAdmin;
    const body = await request.json();

    const validatedData = updateProfileSchema.parse(body);

    // Use admin client to update profile
    const { data: profile, error: profileError } = await adminSupabase
      .from('profiles')
      .update(validatedData)
      .eq('user_id', userId)
      .select()
      .single();

    if (profileError) {
      // If profile doesn't exist, create it
      if (profileError.code === 'PGRST116') {
        const { data: newProfile, error: createError } = await adminSupabase
          .from('profiles')
          .insert({
            user_id: userId,
            ...validatedData,
          })
          .select()
          .single();

        if (createError) {
          return NextResponse.json(
            { error: 'Failed to create profile', details: createError.message },
            { status: 500 }
          );
        }

        return NextResponse.json({
          message: 'Profile created successfully',
          profile: newProfile,
        });
      }

      return NextResponse.json(
        { error: 'Failed to update profile', details: profileError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: 'Profile updated successfully',
      profile,
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
