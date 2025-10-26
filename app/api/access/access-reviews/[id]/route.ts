import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { validateAdminAccess } from '@/lib/middleware/admin-auth';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Validate admin access
    const authResult = await validateAdminAccess(request);
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: 401 });
    }

    const supabase = createClient();
    const { data: review, error } = await supabase
      .from('access_reviews')
      .select(
        `
        *,
        users:user_id(email),
        reviewers:reviewer_id(email)
      `
      )
      .eq('id', params.id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Access review not found' },
          { status: 404 }
        );
      }
      console.error('Error fetching access review:', error);
      return NextResponse.json(
        { error: 'Failed to fetch access review' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      review: {
        ...review,
        user_email: review.users?.email,
        reviewer_email: review.reviewers?.email,
      },
    });
  } catch (error) {
    console.error('Error in access review GET:', error);
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
    // Validate admin access
    const authResult = await validateAdminAccess(request);
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: 401 });
    }

    const supabase = createClient();
    const body = await request.json();
    const { status, review_notes } = body;

    // Validate status
    if (!['pending', 'approved', 'rejected', 'needs_review'].includes(status)) {
      return NextResponse.json(
        {
          error:
            'Invalid status. Must be pending, approved, rejected, or needs_review',
        },
        { status: 400 }
      );
    }

    // Get current review for logging
    const { data: currentReview } = await supabase
      .from('access_reviews')
      .select('*')
      .eq('id', params.id)
      .single();

    if (!currentReview) {
      return NextResponse.json(
        { error: 'Access review not found' },
        { status: 404 }
      );
    }

    // Update the review
    const updateData: any = {
      status,
      review_notes: review_notes || null,
    };

    // If status is being changed from pending to completed, set completed_at
    if (
      currentReview.status === 'pending' &&
      ['approved', 'rejected'].includes(status)
    ) {
      updateData.completed_at = new Date().toISOString();
    }

    const { data: review, error } = await supabase
      .from('access_reviews')
      .update(updateData)
      .eq('id', params.id)
      .select()
      .single();

    if (error) {
      console.error('Error updating access review:', error);
      return NextResponse.json(
        { error: 'Failed to update access review' },
        { status: 500 }
      );
    }

    // Log admin action
    await supabase.from('admin_actions').insert({
      admin_id: authResult.userId,
      action_type: 'update_access_review',
      resource: 'access_reviews',
      resource_id: params.id,
      details: {
        changes: updateData,
        previous: currentReview,
      },
      ip_address: request.headers.get('x-forwarded-for') || 'unknown',
    });

    return NextResponse.json({
      review,
      message: 'Access review updated successfully',
    });
  } catch (error) {
    console.error('Error in access review PUT:', error);
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
    // Validate admin access
    const authResult = await validateAdminAccess(request);
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: 401 });
    }

    const supabase = createClient();

    // Get current review for logging
    const { data: currentReview } = await supabase
      .from('access_reviews')
      .select('*')
      .eq('id', params.id)
      .single();

    if (!currentReview) {
      return NextResponse.json(
        { error: 'Access review not found' },
        { status: 404 }
      );
    }

    // Delete the review
    const { error } = await supabase
      .from('access_reviews')
      .delete()
      .eq('id', params.id);

    if (error) {
      console.error('Error deleting access review:', error);
      return NextResponse.json(
        { error: 'Failed to delete access review' },
        { status: 500 }
      );
    }

    // Log admin action
    await supabase.from('admin_actions').insert({
      admin_id: authResult.userId,
      action_type: 'delete_access_review',
      resource: 'access_reviews',
      resource_id: params.id,
      details: {
        deleted_review: currentReview,
      },
      ip_address: request.headers.get('x-forwarded-for') || 'unknown',
    });

    return NextResponse.json({
      message: 'Access review deleted successfully',
    });
  } catch (error) {
    console.error('Error in access review DELETE:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
