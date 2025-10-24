import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { SendGridService } from '@/lib/email/sendgrid-service';
import { EmailTemplateManager } from '@/lib/email/email-template-manager';
import { rateLimit } from '@/lib/rate-limiting';
import { withCSRFProtection } from '@/lib/security/csrf-protection';
import { DataSanitizer } from '@/lib/security/data-sanitizer';

// Rate limiting configuration
const testEmailRateLimiter = {
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 requests per window
  message: 'Too many test email requests, please try again later',
};

export const POST = withCSRFProtection(async (request: NextRequest) => {
  try {
    // Apply rate limiting
    const rateLimitResult = rateLimit(request, testEmailRateLimiter);
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
    const sanitizedBody = sanitizer.sanitizeObject(body);

    const { to, subject, html, text, templateId, variables } = sanitizedBody;

    // Validate required fields
    if (!to || !subject || (!html && !text && !templateId)) {
      return NextResponse.json(
        {
          error:
            'Missing required fields: to, subject, and (html or text or templateId)',
        },
        { status: 400 }
      );
    }

    // Validate email address
    if (!sanitizer.validateEmail(to)) {
      return NextResponse.json(
        { error: 'Invalid email address' },
        { status: 400 }
      );
    }

    const sendGridService = new SendGridService();
    let emailMessage;

    // Handle template-based email
    if (templateId) {
      const templateManager = new EmailTemplateManager();
      const template = await templateManager.getTemplate(templateId);

      if (!template) {
        return NextResponse.json(
          { error: 'Template not found' },
          { status: 404 }
        );
      }

      // Validate template variables
      const validation = templateManager.validateTemplateVariables(
        template,
        variables || {}
      );
      if (!validation.isValid) {
        return NextResponse.json(
          { error: 'Template validation failed', details: validation.errors },
          { status: 400 }
        );
      }

      // Render template
      const rendered = await templateManager.renderTemplate(
        templateId,
        variables || {}
      );
      emailMessage = {
        to,
        subject: rendered.subject,
        html: rendered.html,
        text: rendered.text,
        templateId,
        dynamicTemplateData: variables,
      };
    } else {
      // Handle direct email
      emailMessage = {
        to,
        subject,
        html,
        text,
      };
    }

    // Send test email
    const result = await sendGridService.sendEmail(emailMessage);

    if (!result.success) {
      return NextResponse.json(
        { error: 'Failed to send test email', details: result.error },
        { status: 500 }
      );
    }

    const response = NextResponse.json({
      success: true,
      messageId: result.messageId,
      message: 'Test email sent successfully',
    });

    // Add rate limit headers
    Object.entries(rateLimitResult.headers).forEach(([key, value]) => {
      response.headers.set(key, value);
    });

    return response;
  } catch (error) {
    console.error('Test email error:', error);
    return NextResponse.json(
      { error: 'Failed to send test email' },
      { status: 500 }
    );
  }
});
