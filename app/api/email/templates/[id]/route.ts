import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { EmailTemplateManager } from '@/lib/email/email-template-manager';
import { rateLimit } from '@/lib/rate-limiting';
import { withCSRFProtection } from '@/lib/security/csrf-protection';
import { DataSanitizer } from '@/lib/security/data-sanitizer';

// Rate limiting configuration
const templateRateLimiter = {
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50, // 50 requests per window
  message: 'Too many template requests, please try again later',
};

export const GET = async (
  request: NextRequest,
  { params }: { params: { id: string } }
) => {
  try {
    // Apply rate limiting
    const rateLimitResult = rateLimit(request, templateRateLimiter);
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
    const templateId = sanitizer.sanitizeString(params.id);

    const templateManager = new EmailTemplateManager();
    const template = await templateManager.getTemplate(templateId);

    if (!template) {
      return NextResponse.json(
        { error: 'Template not found' },
        { status: 404 }
      );
    }

    const response = NextResponse.json({
      success: true,
      template,
    });

    // Add rate limit headers
    Object.entries(rateLimitResult.headers).forEach(([key, value]) => {
      response.headers.set(key, value);
    });

    return response;
  } catch (error) {
    console.error('Template fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch template' },
      { status: 500 }
    );
  }
};

export const PUT = withCSRFProtection(
  async (request: NextRequest, { params }: { params: { id: string } }) => {
    try {
      // Apply rate limiting
      const rateLimitResult = rateLimit(request, templateRateLimiter);
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
        (userData.role !== 'admin' && userData.role !== 'editor')
      ) {
        return NextResponse.json(
          { error: 'Insufficient permissions' },
          { status: 403 }
        );
      }

      const sanitizer = new DataSanitizer();
      const templateId = sanitizer.sanitizeString(params.id);
      const body = await request.json();
      const sanitizedBody = sanitizer.sanitizeObject(body);

      const { name, subject, html_content, text_content, is_active } =
        sanitizedBody;

      // Validate required fields
      if (!name || !subject || (!html_content && !text_content)) {
        return NextResponse.json(
          {
            error:
              'Missing required fields: name, subject, and (html_content or text_content)',
          },
          { status: 400 }
        );
      }

      const templateManager = new EmailTemplateManager();
      const template = await templateManager.updateTemplate(templateId, {
        name,
        subject,
        html_content,
        text_content,
        is_active,
      });

      const response = NextResponse.json({
        success: true,
        template,
      });

      // Add rate limit headers
      Object.entries(rateLimitResult.headers).forEach(([key, value]) => {
        response.headers.set(key, value);
      });

      return response;
    } catch (error) {
      console.error('Template update error:', error);
      return NextResponse.json(
        { error: 'Failed to update template' },
        { status: 500 }
      );
    }
  }
);

export const DELETE = withCSRFProtection(
  async (request: NextRequest, { params }: { params: { id: string } }) => {
    try {
      // Apply rate limiting
      const rateLimitResult = rateLimit(request, templateRateLimiter);
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
      const templateId = sanitizer.sanitizeString(params.id);

      const templateManager = new EmailTemplateManager();
      await templateManager.deleteTemplate(templateId);

      const response = NextResponse.json({
        success: true,
        message: 'Template deleted successfully',
      });

      // Add rate limit headers
      Object.entries(rateLimitResult.headers).forEach(([key, value]) => {
        response.headers.set(key, value);
      });

      return response;
    } catch (error) {
      console.error('Template deletion error:', error);
      return NextResponse.json(
        { error: 'Failed to delete template' },
        { status: 500 }
      );
    }
  }
);
