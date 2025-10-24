import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

// Validation schemas
const createMilestoneSchema = z.object({
  title: z.string().min(5).max(200),
  description: z.string().min(10).max(2000),
  target_date: z.string(),
  feature_request_ids: z.array(z.string().uuid()).optional(),
});

const getMilestonesSchema = z.object({
  status: z
    .enum(['planned', 'in_progress', 'completed', 'cancelled'])
    .optional(),
  limit: z
    .string()
    .optional()
    .transform(val => Math.min(parseInt(val) || 20, 100)),
  offset: z
    .string()
    .optional()
    .transform(val => parseInt(val) || 0),
});

// GET /api/admin/feature-requests/roadmap - Get roadmap milestones
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
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (userError || userData?.role !== 'admin') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    // Parse and validate query parameters
    const { searchParams } = new URL(request.url);
    const queryParams = Object.fromEntries(searchParams.entries());
    const validatedParams = getMilestonesSchema.parse(queryParams);

    const { status, limit, offset } = validatedParams;

    // Build query
    let query = supabase.from('roadmap_milestones').select(
      `
        *,
        feature_requests(
          id,
          title,
          status,
          priority
        )
        `,
      { count: 'exact' }
    );

    // Apply filters
    if (status) {
      query = query.eq('status', status);
    }

    // Apply sorting and pagination
    query = query.order('target_date', { ascending: true });
    query = query.range(offset, offset + limit - 1);

    const { data: milestones, error: milestonesError, count } = await query;

    if (milestonesError) {
      console.error('Error fetching milestones:', milestonesError);
      return NextResponse.json(
        { error: 'Failed to fetch milestones' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      milestones: milestones || [],
      pagination: {
        limit,
        offset,
        total: count || 0,
      },
    });
  } catch (error) {
    console.error('Error in GET /api/admin/feature-requests/roadmap:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/admin/feature-requests/roadmap - Create roadmap milestone
export async function POST(request: NextRequest) {
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
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (userError || userData?.role !== 'admin') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validatedData = createMilestoneSchema.parse(body);

    // Create the milestone
    const { data: milestone, error: insertError } = await supabase
      .from('roadmap_milestones')
      .insert({
        title: validatedData.title,
        description: validatedData.description,
        target_date: validatedData.target_date,
        status: 'planned',
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error creating milestone:', insertError);
      return NextResponse.json(
        { error: 'Failed to create milestone' },
        { status: 500 }
      );
    }

    // Add feature requests to milestone if provided
    if (
      validatedData.feature_request_ids &&
      validatedData.feature_request_ids.length > 0
    ) {
      const milestoneFeatureRequests = validatedData.feature_request_ids.map(
        frId => ({
          milestone_id: milestone.id,
          feature_request_id: frId,
        })
      );

      const { error: linkError } = await supabase
        .from('milestone_feature_requests')
        .insert(milestoneFeatureRequests);

      if (linkError) {
        console.error(
          'Error linking feature requests to milestone:',
          linkError
        );
        // Don't fail the request if linking fails
      }
    }

    return NextResponse.json({
      success: true,
      milestone,
      message: 'Milestone created successfully',
    });
  } catch (error) {
    console.error('Error in POST /api/admin/feature-requests/roadmap:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
