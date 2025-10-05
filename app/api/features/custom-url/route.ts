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

    if (!subscription || subscription.tier !== 'spotlight') {
      return NextResponse.json({
        custom_url: null,
        has_custom_url_access: false,
      });
    }

    // Get custom profile URL
    const { data: customUrl, error } = await supabase
      .from('custom_profile_urls')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw new Error(`Failed to get custom URL: ${error.message}`);
    }

    const response = NextResponse.json({
      custom_url: customUrl,
      has_custom_url_access: true,
    });

    // Add rate limit headers
    Object.entries(rateLimitResult.headers).forEach(([key, value]) => {
      response.headers.set(key, value);
    });

    return response;
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch custom URL' },
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
    const { custom_url } = body;

    if (!custom_url) {
      return NextResponse.json(
        { error: 'Custom URL is required' },
        { status: 400 }
      );
    }

    // Validate custom URL format
    if (!isValidCustomUrl(custom_url)) {
      return NextResponse.json(
        { error: 'Invalid custom URL format' },
        { status: 400 }
      );
    }

    // Get user's subscription
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('tier, status')
      .eq('user_id', user.id)
      .in('status', ['active', 'trial'])
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (!subscription || subscription.tier !== 'spotlight') {
      return NextResponse.json(
        { error: 'Spotlight subscription required for custom URLs' },
        { status: 403 }
      );
    }

    // Check if custom URL is already taken
    const { data: existingUrl } = await supabase
      .from('custom_profile_urls')
      .select('id')
      .eq('custom_url', custom_url)
      .eq('is_active', true)
      .single();

    if (existingUrl) {
      return NextResponse.json(
        { error: 'Custom URL is already taken' },
        { status: 409 }
      );
    }

    // Deactivate any existing custom URL for this user
    await supabase
      .from('custom_profile_urls')
      .update({ is_active: false })
      .eq('user_id', user.id);

    // Create new custom profile URL
    const { data: customProfileUrl, error } = await supabase
      .from('custom_profile_urls')
      .insert({
        user_id: user.id,
        custom_url,
        tier_required: 'spotlight',
        is_active: true,
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create custom URL: ${error.message}`);
    }

    const response = NextResponse.json({
      custom_url: customProfileUrl,
      success: true,
    });

    // Add rate limit headers
    Object.entries(rateLimitResult.headers).forEach(([key, value]) => {
      response.headers.set(key, value);
    });

    return response;
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to create custom URL' },
      { status: 500 }
    );
  }
}

// Helper function to validate custom URL format
function isValidCustomUrl(url: string): boolean {
  // Custom URL should be 3-30 characters, alphanumeric and hyphens only
  const customUrlRegex = /^[a-zA-Z0-9-]{3,30}$/;
  return customUrlRegex.test(url);
}
