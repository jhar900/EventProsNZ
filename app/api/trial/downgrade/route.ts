import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { rateLimit } from '@/lib/rate-limiting';

// Rate limiting configuration for trial downgrade
const trialDowngradeRateLimiter = {
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 requests per window
  message: 'Too many trial downgrade requests, please try again later',
};

export async function POST(request: NextRequest) {
  try {
    // Apply rate limiting
    const rateLimitResult = rateLimit(request, trialDowngradeRateLimiter);
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
    const { user_id, reason } = body;

    // Validate input
    if (!user_id) {
      return NextResponse.json(
        { error: 'user_id is required' },
        { status: 400 }
      );
    }

    // Check if user can downgrade this user
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

    // Get current subscription
    const { data: subscription, error: subscriptionError } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', user_id)
      .eq('status', 'trial')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (subscriptionError || !subscription) {
      return NextResponse.json(
        { error: 'No active trial subscription found' },
        { status: 404 }
      );
    }

    // Update subscription to inactive (free tier)
    const { data: updatedSubscription, error: updateError } = await supabase
      .from('subscriptions')
      .update({
        status: 'inactive',
        tier: 'essential', // Free tier
        price: 0.0,
        end_date: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', subscription.id)
      .select()
      .single();

    if (updateError) {
      throw new Error(
        `Failed to downgrade subscription: ${updateError.message}`
      );
    }

    // Update trial conversion status
    const { data: trialConversion, error: conversionError } = await supabase
      .from('trial_conversions')
      .select('*')
      .eq('user_id', user_id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (trialConversion && !conversionError) {
      const { error: updateConversionError } = await supabase
        .from('trial_conversions')
        .update({
          conversion_status: 'expired',
          conversion_reason: reason || 'Trial expired without conversion',
          updated_at: new Date().toISOString(),
        })
        .eq('id', trialConversion.id);

      if (updateConversionError) {
        console.error(
          'Failed to update trial conversion status:',
          updateConversionError
        );
        // Don't fail the request, just log the error
      }
    }

    // Log the downgrade event
    const { error: logError } = await supabase
      .from('subscription_analytics')
      .insert({
        subscription_id: subscription.id,
        event_type: 'trial_downgrade',
        event_data: {
          reason: reason || 'Trial expired without conversion',
          downgrade_date: new Date().toISOString(),
          previous_tier: subscription.tier,
          new_tier: 'essential',
        },
      });

    if (logError) {
      console.error('Failed to log downgrade event:', logError);
      // Don't fail the request, just log the error
    }

    const response = NextResponse.json({
      subscription: updatedSubscription,
      success: true,
      message: 'Trial downgraded to free tier successfully',
    });

    // Add rate limit headers
    Object.entries(rateLimitResult.headers).forEach(([key, value]) => {
      response.headers.set(key, value);
    });

    return response;
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to downgrade trial subscription' },
      { status: 500 }
    );
  }
}
