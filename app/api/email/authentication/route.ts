import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { EmailAuthenticationService } from '@/lib/email/email-authentication';
import { rateLimit } from '@/lib/rate-limiting';
import { DataSanitizer } from '@/lib/security/data-sanitizer';

// Rate limiting configuration
const authRateLimiter = {
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // 20 requests per window
  message: 'Too many authentication requests, please try again later',
};

export const GET = async (request: NextRequest) => {
  try {
    // Apply rate limiting
    const rateLimitResult = rateLimit(request, authRateLimiter);
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

    const authService = new EmailAuthenticationService();
    const status = await authService.getAuthenticationStatus(domain);

    const response = NextResponse.json({
      success: true,
      status,
    });

    // Add rate limit headers
    Object.entries(rateLimitResult.headers).forEach(([key, value]) => {
      response.headers.set(key, value);
    });

    return response;
  } catch (error) {
    console.error('Authentication check error:', error);
    return NextResponse.json(
      { error: 'Failed to check authentication' },
      { status: 500 }
    );
  }
};

export const POST = async (request: NextRequest) => {
  try {
    // Apply rate limiting
    const rateLimitResult = rateLimit(request, authRateLimiter);
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

    if (!userData || userData.role !== 'admin') {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    const sanitizer = new DataSanitizer();
    const body = await request.json();
    const { domain, type } = sanitizer.sanitizeObject(body);

    if (!domain || !type) {
      return NextResponse.json(
        { error: 'Domain and type are required' },
        { status: 400 }
      );
    }

    const authService = new EmailAuthenticationService();
    let result;

    switch (type) {
      case 'spf':
        result = await authService.validateSPFRecord(domain);
        break;
      case 'dkim':
        result = await authService.validateDKIMRecord(domain);
        break;
      case 'dmarc':
        result = await authService.validateDMARCRecord(domain);
        break;
      default:
        return NextResponse.json(
          { error: 'Invalid type. Must be spf, dkim, or dmarc' },
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
    console.error('Authentication validation error:', error);
    return NextResponse.json(
      { error: 'Failed to validate authentication' },
      { status: 500 }
    );
  }
};
