import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { rateLimit } from '@/lib/rate-limiting';

// Rate limiting configuration for trial support contact
const trialSupportContactRateLimiter = {
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 10, // 10 requests per window
  message: 'Too many trial support contact requests, please try again later',
};

export async function POST(request: NextRequest) {
  try {
    // Apply rate limiting
    const rateLimitResult = rateLimit(request, trialSupportContactRateLimiter);
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

    const body = await request.json();
    const { user_id, subject, message, priority = 'normal' } = body;

    // Validate input
    if (!user_id || !subject || !message) {
      return NextResponse.json(
        { error: 'user_id, subject, and message are required' },
        { status: 400 }
      );
    }

    // Check if user can create support ticket for this user
    if (user_id !== user.id) {
      const { data: userData } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single();

      if (userData?.role !== 'admin') {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    }

    // Get user data for ticket context
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select(
        `
        email,
        profiles!inner(first_name, last_name)
      `
      )
      .eq('id', user_id)
      .single();

    if (userError || !userData) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get trial status for context
    const { data: trialConversion } = await supabase
      .from('trial_conversions')
      .select('*')
      .eq('user_id', user_id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', user_id)
      .eq('status', 'trial')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    // Create support ticket with context
    const ticketData = {
      user_id,
      subject,
      message,
      priority,
      status: 'open',
    };

    const { data: supportTicket, error } = await supabase
      .from('trial_support_tickets')
      .insert(ticketData)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create support ticket: ${error.message}`);
    }

    // TODO: Send notification to support team
    // This could include:
    // - Email notification to support team
    // - Slack notification
    // - Integration with support ticket system
    // - Auto-assignment based on priority and user type

    // Prepare response with additional context
    const response = NextResponse.json({
      support_ticket: {
        ...supportTicket,
        user_context: {
          name: `${userData.profiles.first_name} ${userData.profiles.last_name}`,
          email: userData.email,
          trial_status: trialConversion?.conversion_status || 'active',
          trial_days_remaining: subscription?.trial_end_date
            ? Math.ceil(
                (new Date(subscription.trial_end_date).getTime() -
                  new Date().getTime()) /
                  (1000 * 60 * 60 * 24)
              )
            : 14,
        },
      },
      success: true,
      estimated_response_time:
        priority === 'high' ? 'Within 4 hours' : 'Within 24 hours',
    });

    // Add rate limit headers
    Object.entries(rateLimitResult.headers).forEach(([key, value]) => {
      response.headers.set(key, value);
    });

    return response;
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to create support ticket' },
      { status: 500 }
    );
  }
}
