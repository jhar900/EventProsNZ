import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

const queueQuerySchema = z.object({
  status: z.enum(['pending', 'approved', 'rejected']).optional(),
  priority: z.string().optional(),
  limit: z.string().optional(),
  offset: z.string().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();

    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    if (profileError || profile?.role !== 'admin') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const query = queueQuerySchema.parse({
      status: searchParams.get('status'),
      priority: searchParams.get('priority'),
      limit: searchParams.get('limit'),
      offset: searchParams.get('offset'),
    });

    const limit = query.limit ? parseInt(query.limit) : 20;
    const offset = query.offset ? parseInt(query.offset) : 0;

    // Get verification queue
    let queryBuilder = supabase
      .from('users')
      .select(
        `
        id,
        email,
        role,
        is_verified,
        created_at,
        profiles!inner(
          first_name,
          last_name,
          phone,
          address
        ),
        business_profiles(
          company_name,
          business_address,
          nzbn,
          description,
          service_areas,
          is_verified
        )
      `
      )
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    // Apply status filter
    if (query.status === 'pending') {
      queryBuilder = queryBuilder.eq('is_verified', false);
    } else if (query.status === 'approved') {
      queryBuilder = queryBuilder.eq('is_verified', true);
    }

    const { data: users, error: usersError } = await queryBuilder;

    if (usersError) {
      return NextResponse.json(
        { error: 'Failed to fetch verification queue' },
        { status: 400 }
      );
    }

    // Get total count
    const { count, error: countError } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true });

    if (countError) {
      return NextResponse.json(
        { error: 'Failed to get total count' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      verifications: users || [],
      total: count || 0,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }
    console.error('Error fetching verification queue:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
