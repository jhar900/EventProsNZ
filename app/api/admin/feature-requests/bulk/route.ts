import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

// Validation schemas
const bulkActionSchema = z.object({
  request_ids: z.array(z.string().uuid()),
  action: z.enum([
    'approve',
    'reject',
    'assign',
    'priority_high',
    'priority_medium',
    'priority_low',
  ]),
  admin_notes: z.string().optional(),
  assigned_to: z.string().uuid().optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
});

// PUT /api/admin/feature-requests/bulk - Perform bulk actions on feature requests
export async function PUT(request: NextRequest) {
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
    const validatedData = bulkActionSchema.parse(body);

    const { request_ids, action, admin_notes, assigned_to, priority } =
      validatedData;

    // Verify all feature requests exist
    const { data: existingRequests, error: fetchError } = await supabase
      .from('feature_requests')
      .select('id, status, priority')
      .in('id', request_ids);

    if (fetchError) {
      console.error('Error fetching feature requests:', fetchError);
      return NextResponse.json(
        { error: 'Failed to fetch feature requests' },
        { status: 500 }
      );
    }

    if (existingRequests.length !== request_ids.length) {
      return NextResponse.json(
        { error: 'Some feature requests not found' },
        { status: 404 }
      );
    }

    const updateData: any = {};
    let historyComments = '';

    // Determine update data based on action
    switch (action) {
      case 'approve':
        updateData.status = 'planned';
        historyComments = 'Bulk approved and planned';
        break;
      case 'reject':
        updateData.status = 'rejected';
        updateData.rejected_at = new Date().toISOString();
        historyComments = 'Bulk rejected';
        break;
      case 'assign':
        if (!assigned_to) {
          return NextResponse.json(
            { error: 'assigned_to is required for assign action' },
            { status: 400 }
          );
        }
        updateData.assigned_to = assigned_to;
        historyComments = `Bulk assigned to user ${assigned_to}`;
        break;
      case 'priority_high':
        updateData.priority = 'high';
        historyComments = 'Bulk priority set to high';
        break;
      case 'priority_medium':
        updateData.priority = 'medium';
        historyComments = 'Bulk priority set to medium';
        break;
      case 'priority_low':
        updateData.priority = 'low';
        historyComments = 'Bulk priority set to low';
        break;
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    // Add admin notes if provided
    if (admin_notes) {
      historyComments += `: ${admin_notes}`;
    }

    // Add priority override if provided
    if (priority) {
      updateData.priority = priority;
      historyComments += ` (priority: ${priority})`;
    }

    updateData.updated_at = new Date().toISOString();

    // Update all feature requests
    const { data: updatedRequests, error: updateError } = await supabase
      .from('feature_requests')
      .update(updateData)
      .in('id', request_ids)
      .select();

    if (updateError) {
      console.error('Error updating feature requests:', updateError);
      return NextResponse.json(
        { error: 'Failed to update feature requests' },
        { status: 500 }
      );
    }

    // Add history entries for all updated requests
    const historyEntries = request_ids.map(requestId => ({
      feature_request_id: requestId,
      status:
        updateData.status ||
        existingRequests.find(r => r.id === requestId)?.status,
      changed_by: user.id,
      comments: historyComments,
      created_at: new Date().toISOString(),
    }));

    const { error: historyError } = await supabase
      .from('feature_request_status_history')
      .insert(historyEntries);

    if (historyError) {
      console.error('Error adding bulk action history:', historyError);
      // Don't fail the request if history logging fails
    }

    return NextResponse.json({
      success: true,
      updated_count: updatedRequests.length,
      message: `Bulk ${action} completed successfully`,
      updated_requests: updatedRequests,
    });
  } catch (error) {
    console.error('Error in PUT /api/admin/feature-requests/bulk:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
