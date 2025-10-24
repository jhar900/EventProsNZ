import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

const updateFeatureRequestSchema = z.object({
  title: z.string().min(10).max(200).optional(),
  description: z.string().min(50).max(5000).optional(),
  category_id: z.string().uuid().optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
  status: z
    .enum([
      'submitted',
      'under_review',
      'planned',
      'in_development',
      'completed',
      'rejected',
    ])
    .optional(),
  is_public: z.boolean().optional(),
  admin_notes: z.string().optional(),
  tags: z.array(z.string()).optional(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: featureRequest, error } = await supabase
      .from('feature_requests')
      .select(
        `
        *,
        feature_request_categories(name, color),
        feature_request_tag_assignments(
          feature_request_tags(name)
        ),
        profiles(first_name, last_name, avatar_url),
        feature_request_comments(
          id,
          content,
          is_admin_comment,
          created_at,
          updated_at,
          profiles(first_name, last_name, avatar_url)
        ),
        feature_request_status_history(
          id,
          status,
          changed_by,
          comments,
          created_at,
          profiles(first_name, last_name)
        )
      `
      )
      .eq('id', params.id)
      .single();

    if (error) {
      console.error('Error fetching feature request:', error);
      return NextResponse.json(
        { error: 'Feature request not found' },
        { status: 404 }
      );
    }

    // Check if user can view this request
    if (!featureRequest.is_public && featureRequest.user_id !== user.id) {
      // Check if user is admin
      const { data: userProfile } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single();

      if (userProfile?.role !== 'admin') {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 });
      }
    }

    // Increment view count
    await supabase
      .from('feature_requests')
      .update({ view_count: featureRequest.view_count + 1 })
      .eq('id', params.id);

    return NextResponse.json(featureRequest);
  } catch (error) {
    console.error('Error in GET /api/feature-requests/[id]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = updateFeatureRequestSchema.parse(body);

    // Check if feature request exists and user has permission to update
    const { data: existingRequest, error: fetchError } = await supabase
      .from('feature_requests')
      .select('user_id, status')
      .eq('id', params.id)
      .single();

    if (fetchError) {
      return NextResponse.json(
        { error: 'Feature request not found' },
        { status: 404 }
      );
    }

    // Check permissions
    const { data: userProfile } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    const isOwner = existingRequest.user_id === user.id;
    const isAdmin = userProfile?.role === 'admin';

    if (!isOwner && !isAdmin) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Only allow status changes by admins
    if (validatedData.status && !isAdmin) {
      return NextResponse.json(
        { error: 'Only admins can change status' },
        { status: 403 }
      );
    }

    // Update the feature request
    const updateData: any = { ...validatedData };
    delete updateData.tags; // Handle tags separately

    const { data: updatedRequest, error: updateError } = await supabase
      .from('feature_requests')
      .update(updateData)
      .eq('id', params.id)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating feature request:', updateError);
      return NextResponse.json(
        { error: 'Failed to update feature request' },
        { status: 500 }
      );
    }

    // Handle tags if provided
    if (validatedData.tags) {
      // Remove existing tag assignments
      await supabase
        .from('feature_request_tag_assignments')
        .delete()
        .eq('feature_request_id', params.id);

      if (validatedData.tags.length > 0) {
        // Get or create tags
        const tagInserts = validatedData.tags.map(tagName => ({
          name: tagName.toLowerCase().replace(/\s+/g, '-'),
        }));

        const { data: tags } = await supabase
          .from('feature_request_tags')
          .upsert(tagInserts, { onConflict: 'name' })
          .select('id, name');

        if (tags) {
          // Create new tag assignments
          const tagAssignments = tags.map(tag => ({
            feature_request_id: params.id,
            tag_id: tag.id,
          }));

          await supabase
            .from('feature_request_tag_assignments')
            .insert(tagAssignments);
        }
      }
    }

    // Create status history entry if status changed
    if (
      validatedData.status &&
      validatedData.status !== existingRequest.status
    ) {
      await supabase.from('feature_request_status_history').insert({
        feature_request_id: params.id,
        status: validatedData.status,
        changed_by: user.id,
        comments: `Status changed to ${validatedData.status}`,
      });
    }

    return NextResponse.json(updatedRequest);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input data', details: error.errors },
        { status: 400 }
      );
    }
    console.error('Error in PUT /api/feature-requests/[id]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if feature request exists and user has permission to delete
    const { data: existingRequest, error: fetchError } = await supabase
      .from('feature_requests')
      .select('user_id')
      .eq('id', params.id)
      .single();

    if (fetchError) {
      return NextResponse.json(
        { error: 'Feature request not found' },
        { status: 404 }
      );
    }

    // Check permissions
    const { data: userProfile } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    const isOwner = existingRequest.user_id === user.id;
    const isAdmin = userProfile?.role === 'admin';

    if (!isOwner && !isAdmin) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Delete the feature request (cascade will handle related records)
    const { error: deleteError } = await supabase
      .from('feature_requests')
      .delete()
      .eq('id', params.id);

    if (deleteError) {
      console.error('Error deleting feature request:', deleteError);
      return NextResponse.json(
        { error: 'Failed to delete feature request' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: 'Feature request deleted successfully',
    });
  } catch (error) {
    console.error('Error in DELETE /api/feature-requests/[id]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
