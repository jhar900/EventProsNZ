import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { DeliverabilityOptimizer } from '@/lib/email/deliverability-optimizer';
import { rateLimit } from '@/lib/rate-limiting';
import { DataSanitizer } from '@/lib/security/data-sanitizer';

// Rate limiting configuration
const deliverabilityRateLimiter = {
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 requests per window
  message: 'Too many deliverability requests, please try again later',
};

export const GET = async (request: NextRequest) => {
  try {
    // Apply rate limiting
    const rateLimitResult = rateLimit(request, deliverabilityRateLimiter);
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

    const sanitizer = new DataSanitizer();
    const { searchParams } = new URL(request.url);
    const domain = sanitizer.sanitizeString(searchParams.get('domain') || '');

    if (!domain) {
      return NextResponse.json(
        { error: 'Domain parameter is required' },
        { status: 400 }
      );
    }

    const optimizer = new DeliverabilityOptimizer();
    const report = await optimizer.getDeliverabilityReport(domain);

    const response = NextResponse.json({
      success: true,
      report,
    });

    // Add rate limit headers
    Object.entries(rateLimitResult.headers).forEach(([key, value]) => {
      response.headers.set(key, value);
    });

    return response;
  } catch (error) {
    console.error('Deliverability report error:', error);
    return NextResponse.json(
      { error: 'Failed to generate deliverability report' },
      { status: 500 }
    );
  }
};

export const POST = async (request: NextRequest) => {
  try {
    // Apply rate limiting
    const rateLimitResult = rateLimit(request, deliverabilityRateLimiter);
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

    const sanitizer = new DataSanitizer();
    const body = await request.json();
    const { domain, action } = sanitizer.sanitizeObject(body);

    if (!domain) {
      return NextResponse.json(
        { error: 'Domain is required' },
        { status: 400 }
      );
    }

    const optimizer = new DeliverabilityOptimizer();
    let result;

    switch (action) {
      case 'optimization-actions':
        result = await optimizer.getOptimizationActions(domain);
        break;
      case 'trends':
        const days = body.days || 30;
        result = await optimizer.getDeliverabilityTrends(domain, days);
        break;
      case 'stats':
        result = await optimizer.getDeliverabilityStats();
        break;
      default:
        return NextResponse.json(
          {
            error:
              'Invalid action. Must be optimization-actions, trends, or stats',
          },
          { status: 400 }
        );
    }

    const response = NextResponse.json({
      success: true,
      result,
    });

    // Add rate limit headers
    Object.entries(rateLimitResult.headers).forEach(([key, value]) => {
      response.headers.set(key, value);
    });

    return response;
  } catch (error) {
    console.error('Deliverability action error:', error);
    return NextResponse.json(
      { error: 'Failed to perform deliverability action' },
      { status: 500 }
    );
  }
};
