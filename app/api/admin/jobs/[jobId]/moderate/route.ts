import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/middleware';

export const dynamic = 'force-dynamic';

export async function PUT(
  request: NextRequest,
  { params }: { params: { jobId: string } }
) {
  try {
    const { supabase } = createClient(request);
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
        { error: 'Forbidden - Admin access required' },
        { status: 403 }
      );
    }

    const { jobId } = params;

    // Validate jobId parameter
    if (!jobId || typeof jobId !== 'string' || jobId.trim() === '') {
      return NextResponse.json(
        { error: 'Invalid job ID parameter' },
        { status: 400 }
      );
    }

    // Validate UUID format for jobId
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(jobId)) {
      return NextResponse.json(
        { error: 'Invalid job ID format' },
        { status: 400 }
      );
    }

    let body;
    try {
      body = await request.json();
    } catch (parseError) {
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 }
      );
    }

    const { action, comment } = body;

    if (!action || !['approve', 'reject'].includes(action)) {
      return NextResponse.json(
        { error: 'Invalid action. Must be "approve" or "reject"' },
        { status: 400 }
      );
    }

    // Validate comment field if provided
    if (comment && (typeof comment !== 'string' || comment.length > 1000)) {
      return NextResponse.json(
        { error: 'Comment must be a string with maximum 1000 characters' },
        { status: 400 }
      );
    }

    // Get the job first to check its current status
    const { data: job, error: jobError } = await supabase
      .from('jobs')
      .select('id, status, user_id')
      .eq('id', jobId)
      .single();

    if (jobError) {
      console.error('Error fetching job for moderation:', jobError);

      // Enhanced error handling for database errors
      if (jobError.message.includes('connection')) {
        return NextResponse.json(
          { error: 'Database connection error' },
          { status: 503 }
        );
      }

      if (jobError.message.includes('timeout')) {
        return NextResponse.json(
          { error: 'Database query timeout' },
          { status: 408 }
        );
      }

      if (jobError.message.includes('permission')) {
        return NextResponse.json(
          { error: 'Database permission error' },
          { status: 403 }
        );
      }

      return NextResponse.json(
        { error: 'Failed to fetch job' },
        { status: 500 }
      );
    }

    if (!job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    // Update job status based on action
    const newStatus = action === 'approve' ? 'active' : 'rejected';

    const { error: updateError } = await supabase
      .from('jobs')
      .update({
        status: newStatus,
        updated_at: new Date().toISOString(),
      })
      .eq('id', jobId);

    if (updateError) {
      console.error('Error updating job status:', updateError);
      return NextResponse.json(
        { error: 'Failed to update job status' },
        { status: 500 }
      );
    }

    // Create moderation record
    const { error: moderationError } = await supabase
      .from('job_moderation')
      .insert({
        job_id: jobId,
        moderator_id: user.id,
        action: action,
        comment: comment || null,
        created_at: new Date().toISOString(),
      });

    if (moderationError) {
      console.error('Error creating moderation record:', moderationError);
      // Don't fail the request if moderation record creation fails
    }

    // If job was approved, send notification to job owner
    if (action === 'approve') {
      try {
        // This would typically send an email notification
        // For now, we'll just log it
        console.log(`Job ${jobId} approved by admin ${user.id}`);
      } catch (notificationError) {
        console.error(
          'Error sending approval notification:',
          notificationError
        );
        // Don't fail the request if notification fails
      }
    }

    // If job was rejected, send notification to job owner
    if (action === 'reject') {
      try {
        // This would typically send an email notification
        // For now, we'll just log it
        console.log(`Job ${jobId} rejected by admin ${user.id}`);
      } catch (notificationError) {
        console.error(
          'Error sending rejection notification:',
          notificationError
        );
        // Don't fail the request if notification fails
      }
    }

    return NextResponse.json({
      success: true,
      message: `Job ${action}d successfully`,
      jobId,
      newStatus,
    });
  } catch (error) {
    console.error('Error moderating job:', error);

    // Enhanced error handling for different error types
    if (error instanceof TypeError && error.message.includes('Invalid URL')) {
      return NextResponse.json(
        { error: 'Invalid request parameters' },
        { status: 400 }
      );
    }

    if (error instanceof Error && error.message.includes('database')) {
      return NextResponse.json(
        { error: 'Database connection error' },
        { status: 503 }
      );
    }

    if (error instanceof Error && error.message.includes('timeout')) {
      return NextResponse.json({ error: 'Request timeout' }, { status: 408 });
    }

    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
