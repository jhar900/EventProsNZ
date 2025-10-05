import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { rateLimit } from '@/lib/rate-limiting';

// Rate limiting configuration for tracking trial conversion
const trackConversionRateLimiter = {
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 30, // 30 requests per window
  message:
    'Too many trial conversion tracking requests, please try again later',
};

export async function POST(request: NextRequest) {
  try {
    // Apply rate limiting
    const rateLimitResult = rateLimit(request, trackConversionRateLimiter);
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
    const { user_id, conversion_status, conversion_tier, conversion_reason } =
      body;

    // Validate input
    if (!user_id || !conversion_status) {
      return NextResponse.json(
        { error: 'user_id and conversion_status are required' },
        { status: 400 }
      );
    }

    const validStatuses = ['active', 'converted', 'expired', 'cancelled'];
    if (!validStatuses.includes(conversion_status)) {
      return NextResponse.json(
        { error: 'Invalid conversion_status' },
        { status: 400 }
      );
    }

    // Check if user can track conversion for this user
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

    // Get existing trial conversion
    const { data: existingConversion, error: fetchError } = await supabase
      .from('trial_conversions')
      .select('*')
      .eq('user_id', user_id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') {
      throw new Error(
        `Failed to fetch existing trial conversion: ${fetchError.message}`
      );
    }

    // Prepare update data
    const updateData: any = {
      conversion_status,
      updated_at: new Date().toISOString(),
    };

    if (conversion_tier) {
      updateData.conversion_tier = conversion_tier;
    }

    if (conversion_reason) {
      updateData.conversion_reason = conversion_reason;
    }

    if (conversion_status === 'converted') {
      updateData.conversion_date = new Date().toISOString();
    }

    let conversion;

    if (existingConversion) {
      // Update existing conversion
      const { data: updatedConversion, error: updateError } = await supabase
        .from('trial_conversions')
        .update(updateData)
        .eq('id', existingConversion.id)
        .select()
        .single();

      if (updateError) {
        throw new Error(
          `Failed to update trial conversion: ${updateError.message}`
        );
      }

      conversion = updatedConversion;
    } else {
      // Create new conversion
      const { data: newConversion, error: createError } = await supabase
        .from('trial_conversions')
        .insert({
          user_id,
          trial_start_date: new Date().toISOString(),
          trial_end_date: new Date(
            Date.now() + 14 * 24 * 60 * 60 * 1000
          ).toISOString(), // 14 days from now
          ...updateData,
        })
        .select()
        .single();

      if (createError) {
        throw new Error(
          `Failed to create trial conversion: ${createError.message}`
        );
      }

      conversion = newConversion;
    }

    // If conversion is successful, update subscription status
    if (conversion_status === 'converted' && conversion_tier) {
      const { error: subscriptionError } = await supabase
        .from('subscriptions')
        .update({
          status: 'active',
          tier: conversion_tier,
          end_date: null, // Remove end date for active subscription
        })
        .eq('user_id', user_id)
        .eq('status', 'trial');

      if (subscriptionError) {
        console.error(
          'Failed to update subscription after conversion:',
          subscriptionError
        );
        // Don't fail the request, just log the error
      }
    }

    const response = NextResponse.json({
      conversion,
      success: true,
    });

    // Add rate limit headers
    Object.entries(rateLimitResult.headers).forEach(([key, value]) => {
      response.headers.set(key, value);
    });

    return response;
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to track trial conversion' },
      { status: 500 }
    );
  }
}
