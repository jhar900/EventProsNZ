import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

// Validation schemas
const updatePrioritySchema = z.object({
  priority: z.enum(['low', 'medium', 'high', 'urgent']),
  admin_notes: z.string().optional(),
});

// PUT /api/admin/feature-requests/{id}/priority - Update feature request priority
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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
    const validatedData = updatePrioritySchema.parse(body);

    // Get current feature request
    const { data: currentRequest, error: fetchError } = await supabase
      .from('feature_requests')
      .select('id, priority, user_id, title')
      .eq('id', params.id)
      .single();

    if (fetchError || !currentRequest) {
      return NextResponse.json(
        { error: 'Feature request not found' },
        { status: 404 }
      );
    }

    // Update the feature request priority
    const { data: updatedRequest, error: updateError } = await supabase
      .from('feature_requests')
      .update({
        priority: validatedData.priority,
        updated_at: new Date().toISOString(),
      })
      .eq('id', params.id)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating feature request priority:', updateError);
      return NextResponse.json(
        { error: 'Failed to update priority' },
        { status: 500 }
      );
    }

    // Add priority change to history
    const { error: historyError } = await supabase
      .from('feature_request_status_history')
      .insert({
        feature_request_id: params.id,
        status: currentRequest.status, // Keep current status
        changed_by: user.id,
        comments: `Priority changed to ${validatedData.priority}${validatedData.admin_notes ? `: ${validatedData.admin_notes}` : ''}`,
        created_at: new Date().toISOString(),
      });

    if (historyError) {
      console.error('Error adding priority change history:', historyError);
      // Don't fail the request if history logging fails
    }

    return NextResponse.json({
      success: true,
      request: updatedRequest,
      message: 'Priority updated successfully',
    });
  } catch (error) {
    console.error(
      'Error in PUT /api/admin/feature-requests/[id]/priority:',
      error
    );
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
