import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { EmailDeliveryMonitor } from '@/lib/email/email-delivery-monitor';
import { rateLimit } from '@/lib/rate-limiting';
import { DataSanitizer } from '@/lib/security/data-sanitizer';

// Rate limiting configuration
const analyticsRateLimiter = {
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30, // 30 requests per window
  message: 'Too many analytics requests, please try again later',
};

export const GET = async (request: NextRequest) => {
  try {
    // Apply rate limiting
    const rateLimitResult = rateLimit(request, analyticsRateLimiter);
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { error: rateLimitResult.message },
        {
          status: 429,
          headers: rateLimitResult.headers,
        }
      );
    }

    // Authenticate user
    const supabase = createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check user permissions
    const { data: userData } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (
      !userData ||
      (userData.role !== 'admin' && userData.role !== 'analyst')
    ) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    const sanitizer = new DataSanitizer();
    const { searchParams } = new URL(request.url);
    const sanitizedParams = sanitizer.sanitizeSearchParams(searchParams);

    const {
      startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      endDate = new Date().toISOString(),
      templateId,
    } = sanitizedParams;

    const deliveryMonitor = new EmailDeliveryMonitor();
    const analytics = await deliveryMonitor.getDeliveryAnalytics(
      startDate,
      endDate,
      templateId
    );

    const response = NextResponse.json({
      success: true,
      analytics,
    });

    // Add rate limit headers
    Object.entries(rateLimitResult.headers).forEach(([key, value]) => {
      response.headers.set(key, value);
    });

    return response;
  } catch (error) {
    console.error('Analytics fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analytics' },
      { status: 500 }
    );
  }
};
