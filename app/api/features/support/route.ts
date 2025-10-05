import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { rateLimit } from '@/lib/rate-limiting';

export async function GET(request: NextRequest) {
  try {
    // Apply rate limiting
    const rateLimitResult = rateLimit(request, { requests: 100, window: '1m' });
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { error: rateLimitResult.message },
        { status: 429, headers: rateLimitResult.headers }
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

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('user_id') || user.id;

    // Check if requesting user's own data or admin
    if (userId !== user.id) {
      const { data: userData } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single();

      if (userData?.role !== 'admin') {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    }

    // Get user's subscription
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('tier, status')
      .eq('user_id', userId)
      .in('status', ['active', 'trial'])
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (!subscription) {
      return NextResponse.json({
        priority_level: 'standard',
        response_time: '24-48 hours',
        features: [],
      });
    }

    // Determine priority level based on tier
    const priorityLevel = getPriorityLevel(subscription.tier);
    const responseTime = getResponseTime(subscription.tier);

    // Get support features for the tier
    const { data: supportFeatures } = await supabase
      .from('subscription_features')
      .select('*')
      .eq('tier', subscription.tier)
      .like('feature_name', 'support_%')
      .eq('is_included', true);

    const response = NextResponse.json({
      priority_level: priorityLevel,
      response_time: responseTime,
      features: supportFeatures || [],
    });

    // Add rate limit headers
    Object.entries(rateLimitResult.headers).forEach(([key, value]) => {
      response.headers.set(key, value);
    });

    return response;
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch support features' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Apply rate limiting
    const rateLimitResult = rateLimit(request, { requests: 50, window: '1m' });
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { error: rateLimitResult.message },
        { status: 429, headers: rateLimitResult.headers }
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
    const { subject, description, priority } = body;

    if (!subject || !description) {
      return NextResponse.json(
        { error: 'Subject and description are required' },
        { status: 400 }
      );
    }

    // Get user's subscription to determine priority
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('tier, status')
      .eq('user_id', user.id)
      .in('status', ['active', 'trial'])
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    const ticketPriority =
      priority || getPriorityLevel(subscription?.tier || 'essential');

    // Create support ticket
    const { data: ticket, error } = await supabase
      .from('support_tickets')
      .insert({
        user_id: user.id,
        subject,
        description,
        priority: ticketPriority,
        status: 'open',
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create support ticket: ${error.message}`);
    }

    const response = NextResponse.json({
      ticket,
      success: true,
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

// Helper functions
function getPriorityLevel(tier: string): string {
  const priorityLevels = {
    essential: 'standard',
    showcase: 'high',
    spotlight: 'urgent',
  };
  return priorityLevels[tier as keyof typeof priorityLevels] || 'standard';
}

function getResponseTime(tier: string): string {
  const responseTimes = {
    essential: '24-48 hours',
    showcase: '4-8 hours',
    spotlight: '1-2 hours',
  };
  return responseTimes[tier as keyof typeof responseTimes] || '24-48 hours';
}
