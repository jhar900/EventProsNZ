import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';
import { validateAdminAccess } from '@/lib/middleware/admin-auth';
import { z } from 'zod';

// Validation schemas
const updateStatusSchema = z.object({
  status: z.enum([
    'submitted',
    'under_review',
    'planned',
    'in_development',
    'completed',
    'rejected',
  ]),
  admin_notes: z.string().optional(),
});

// PUT /api/admin/feature-requests/{id}/status - Update feature request status
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Validate admin access
    const authResult = await validateAdminAccess(request);
    if (!authResult.success) {
      return (
        authResult.response ||
        NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      );
    }

    const user = authResult.user;
    // Use admin client to bypass RLS for admin operations
    const supabase = supabaseAdmin;

    // Parse and validate request body
    const body = await request.json();
    const validatedData = updateStatusSchema.parse(body);

    // Get current feature request
    const { data: currentRequest, error: fetchError } = await supabase
      .from('feature_requests')
      .select('id, status, user_id, title')
      .eq('id', params.id)
      .single();

    if (fetchError || !currentRequest) {
      return NextResponse.json(
        { error: 'Feature request not found' },
        { status: 404 }
      );
    }

    // Update the feature request status
    const { data: updatedRequest, error: updateError } = await supabase
      .from('feature_requests')
      .update({
        status: validatedData.status,
        updated_at: new Date().toISOString(),
      })
      .eq('id', params.id)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating feature request status:', updateError);
      return NextResponse.json(
        { error: 'Failed to update status' },
        { status: 500 }
      );
    }

    // Add status change to history
    const { error: historyError } = await supabase
      .from('feature_request_status_history')
      .insert({
        feature_request_id: params.id,
        status: validatedData.status,
        changed_by: user.id,
        comments: validatedData.admin_notes || null,
        created_at: new Date().toISOString(),
      });

    if (historyError) {
      console.error('Error adding status history:', historyError);
      // Don't fail the request if history logging fails
    }

    // If status changed to completed, update completion date
    if (validatedData.status === 'completed') {
      await supabase
        .from('feature_requests')
        .update({ completed_at: new Date().toISOString() })
        .eq('id', params.id);
    }

    // If status changed to rejected, update rejection date
    if (validatedData.status === 'rejected') {
      await supabase
        .from('feature_requests')
        .update({ rejected_at: new Date().toISOString() })
        .eq('id', params.id);
    }

    return NextResponse.json({
      success: true,
      request: updatedRequest,
      message: 'Status updated successfully',
    });
  } catch (error) {
    console.error(
      'Error in PUT /api/admin/feature-requests/[id]/status:',
      error
    );
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
