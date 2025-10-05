import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { rateLimit } from '@/lib/rate-limiting';
import { headers } from 'next/headers';
import { withCSRFProtection } from '@/lib/security/csrf-protection';
import { DataSanitizer } from '@/lib/security/data-sanitizer';
import { AuditLogger } from '@/lib/security/audit-logger';

// Rate limiting configuration for trial emails
const trialEmailRateLimiter = {
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per window
  message: 'Too many trial email requests, please try again later',
};

export const GET = withCSRFProtection(async (request: NextRequest) => {
  try {
    // Apply rate limiting
    const rateLimitResult = rateLimit(request, trialEmailRateLimiter);
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { error: rateLimitResult.message },
        {
          status: 429,
          headers: rateLimitResult.headers,
        }
      );
    }

    const sanitizer = new DataSanitizer();
    const auditLogger = new AuditLogger();

    const supabase = createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const sanitizedParams = sanitizer.sanitizeSearchParams(searchParams);
    const userId = sanitizedParams.user_id || user.id;
    const emailType = sanitizedParams.email_type;

    // Validate email type if provided
    if (emailType && !sanitizer.validateTrialEmailType(emailType)) {
      return NextResponse.json(
        { error: 'Invalid email type' },
        { status: 400 }
      );
    }

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

    // Build query
    let query = supabase
      .from('trial_emails')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (emailType) {
      query = query.eq('email_type', emailType);
    }

    const { data: emails, error } = await query;

    if (error) {
      throw new Error(`Failed to fetch trial emails: ${error.message}`);
    }

    // Log audit event
    await auditLogger.logTrialEvent({
      userId: user.id,
      action: 'trial_emails_fetched',
      resource: 'trial_emails',
      details: { emailType, count: emails?.length || 0 },
      ipAddress:
        request.headers.get('x-forwarded-for') ||
        request.headers.get('x-real-ip'),
      userAgent: request.headers.get('user-agent'),
      timestamp: new Date(),
    });

    const response = NextResponse.json({
      emails: emails || [],
      total: emails?.length || 0,
    });

    // Add rate limit headers
    Object.entries(rateLimitResult.headers).forEach(([key, value]) => {
      response.headers.set(key, value);
    });

    return response;
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch trial emails' },
      { status: 500 }
    );
  }
});

export const POST = withCSRFProtection(async (request: NextRequest) => {
  try {
    // Apply rate limiting
    const rateLimitResult = rateLimit(request, trialEmailRateLimiter);
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { error: rateLimitResult.message },
        {
          status: 429,
          headers: rateLimitResult.headers,
        }
      );
    }

    const sanitizer = new DataSanitizer();
    const auditLogger = new AuditLogger();

    const supabase = createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const sanitizedBody = sanitizer.sanitizeObject(body);
    const { user_id, email_type, scheduled_date } = sanitizedBody;

    // Validate input
    if (!user_id || !email_type) {
      return NextResponse.json(
        { error: 'user_id and email_type are required' },
        { status: 400 }
      );
    }

    // Validate email type
    if (!sanitizer.validateTrialEmailType(email_type)) {
      return NextResponse.json(
        { error: 'Invalid email type' },
        { status: 400 }
      );
    }

    // Check if user can create email for this user
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

    // Create trial email
    const { data: email, error } = await supabase
      .from('trial_emails')
      .insert({
        user_id,
        email_type,
        scheduled_date: scheduled_date || new Date().toISOString(),
        email_status: 'pending',
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create trial email: ${error.message}`);
    }

    // Log audit event
    await auditLogger.logTrialEvent({
      userId: user.id,
      action: 'trial_email_created',
      resource: 'trial_email',
      resourceId: email.id,
      details: { email_type: email_type, scheduled_date },
      ipAddress:
        request.headers.get('x-forwarded-for') ||
        request.headers.get('x-real-ip'),
      userAgent: request.headers.get('user-agent'),
      timestamp: new Date(),
    });

    const response = NextResponse.json({
      email,
      success: true,
    });

    // Add rate limit headers
    Object.entries(rateLimitResult.headers).forEach(([key, value]) => {
      response.headers.set(key, value);
    });

    return response;
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to create trial email' },
      { status: 500 }
    );
  }
});
