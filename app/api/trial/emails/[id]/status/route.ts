import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { rateLimit } from '@/lib/rate-limiting';

// Rate limiting configuration for updating email status
const updateEmailStatusRateLimiter = {
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 50, // 50 requests per window
  message: 'Too many email status update requests, please try again later',
};

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Apply rate limiting
    const rateLimitResult = rateLimit(request, updateEmailStatusRateLimiter);
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { error: rateLimitResult.message },
        {
          status: 429,
          headers: rateLimitResult.headers,
        }
      );
    }

    const supabase = createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;
    const body = await request.json();
    const { email_status } = body;

    // Validate input
    if (!email_status) {
      return NextResponse.json(
        { error: 'email_status is required' },
        { status: 400 }
      );
    }

    const validStatuses = [
      'pending',
      'sent',
      'delivered',
      'opened',
      'clicked',
      'failed',
    ];
    if (!validStatuses.includes(email_status)) {
      return NextResponse.json(
        { error: 'Invalid email_status' },
        { status: 400 }
      );
    }

    // Get the email to check ownership
    const { data: email, error: emailError } = await supabase
      .from('trial_emails')
      .select('user_id')
      .eq('id', id)
      .single();

    if (emailError || !email) {
      return NextResponse.json(
        { error: 'Trial email not found' },
        { status: 404 }
      );
    }

    // Check if user can update this email
    if (email.user_id !== user.id) {
      const { data: userData } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single();

      if (userData?.role !== 'admin') {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    }

    // Update email status
    const updateData: any = { email_status };

    // Set sent_date if status is being changed to sent
    if (email_status === 'sent') {
      updateData.sent_date = new Date().toISOString();
    }

    const { data: updatedEmail, error: updateError } = await supabase
      .from('trial_emails')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      throw new Error(`Failed to update email status: ${updateError.message}`);
    }

    const response = NextResponse.json({
      email: updatedEmail,
      success: true,
    });

    // Add rate limit headers
    Object.entries(rateLimitResult.headers).forEach(([key, value]) => {
      response.headers.set(key, value);
    });

    return response;
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to update email status' },
      { status: 500 }
    );
  }
}
