import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { rateLimit } from '@/lib/rate-limiting';
import { withCSRFProtection } from '@/lib/security/csrf-protection';
import { DataSanitizer } from '@/lib/security/data-sanitizer';
import { AuditLogger } from '@/lib/security/audit-logger';

// Rate limiting configuration for trial conversion
const trialConversionRateLimiter = {
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per window
  message: 'Too many trial conversion requests, please try again later',
};

export const GET = withCSRFProtection(async (request: NextRequest) => {
  try {
    // Check if we're in a build environment
    if (
      process.env.NODE_ENV === 'production' &&
      !process.env.SUPABASE_SERVICE_ROLE_KEY
    ) {
      return NextResponse.json(
        { error: 'Service temporarily unavailable during build' },
        { status: 503 }
      );
    }

    // Apply rate limiting
    const rateLimitResult = rateLimit(request, trialConversionRateLimiter);
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

    const sanitizer = new DataSanitizer();
    const auditLogger = new AuditLogger();

    const { searchParams } = new URL(request.url);
    const sanitizedParams = sanitizer.sanitizeSearchParams(searchParams);
    const userId = sanitizedParams.user_id || user.id;

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

    // Get trial conversion data
    const { data: conversion, error: conversionError } = await supabase
      .from('trial_conversions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (conversionError && conversionError.code !== 'PGRST116') {
      throw new Error(
        `Failed to fetch trial conversion: ${conversionError.message}`
      );
    }

    // Get trial analytics
    const { data: analytics, error: analyticsError } = await supabase
      .from('trial_analytics')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (analyticsError) {
      throw new Error(
        `Failed to fetch trial analytics: ${analyticsError.message}`
      );
    }

    // Log audit event
    await auditLogger.logTrialEvent({
      userId: user.id,
      action: 'trial_conversion_fetched',
      resource: 'trial_conversion',
      details: { userId, conversionId: conversion?.id },
      ipAddress:
        request.headers.get('x-forwarded-for') ||
        request.headers.get('x-real-ip'),
      userAgent: request.headers.get('user-agent'),
      timestamp: new Date(),
    });

    const response = NextResponse.json({
      conversion: conversion || null,
      analytics: analytics || [],
    });

    // Add rate limit headers
    Object.entries(rateLimitResult.headers).forEach(([key, value]) => {
      response.headers.set(key, value);
    });

    return response;
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch trial conversion data' },
      { status: 500 }
    );
  }
});

export const POST = withCSRFProtection(async (request: NextRequest) => {
  try {
    // Check if we're in a build environment
    if (
      process.env.NODE_ENV === 'production' &&
      !process.env.SUPABASE_SERVICE_ROLE_KEY
    ) {
      return NextResponse.json(
        { error: 'Service temporarily unavailable during build' },
        { status: 503 }
      );
    }

    // Apply rate limiting
    const rateLimitResult = rateLimit(request, trialConversionRateLimiter);
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

    const sanitizer = new DataSanitizer();
    const auditLogger = new AuditLogger();

    const body = await request.json();
    const sanitizedBody = sanitizer.sanitizeObject(body);
    const { user_id, conversion_status, conversion_tier, conversion_reason } =
      sanitizedBody;

    // Validate input
    if (!user_id || !conversion_status) {
      return NextResponse.json(
        { error: 'user_id and conversion_status are required' },
        { status: 400 }
      );
    }

    // Validate conversion status
    if (!sanitizer.validateTrialConversionStatus(conversion_status)) {
      return NextResponse.json(
        { error: 'Invalid conversion_status' },
        { status: 400 }
      );
    }

    // Validate conversion tier if provided
    if (conversion_tier && !sanitizer.validateTrialTier(conversion_tier)) {
      return NextResponse.json(
        { error: 'Invalid conversion_tier' },
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

    // Update or create trial conversion
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

    const { data: conversion, error } = await supabase
      .from('trial_conversions')
      .upsert({
        user_id,
        ...updateData,
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to track trial conversion: ${error.message}`);
    }

    // Log audit event
    await auditLogger.logTrialConversion(
      user.id,
      conversion,
      request.headers.get('x-forwarded-for') ||
        request.headers.get('x-real-ip'),
      request.headers.get('user-agent')
    );

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
});
