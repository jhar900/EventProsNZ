import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { SendGridService } from '@/lib/email/sendgrid-service';
import { EmailTemplateManager } from '@/lib/email/email-template-manager';
import { EmailQueueManager } from '@/lib/email/email-queue-manager';
import { EmailErrorHandler } from '@/lib/email/error-handler';
import { rateLimit } from '@/lib/rate-limiting';
import { withCSRFProtection } from '@/lib/security/csrf-protection';
import { DataSanitizer } from '@/lib/security/data-sanitizer';
import { AuditLogger } from '@/lib/security/audit-logger';

export const dynamic = 'force-dynamic';

// Rate limiting configuration
const emailSendRateLimiter = {
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per window
  message: 'Too many email requests, please try again later',
};

export const POST = withCSRFProtection(async (request: NextRequest) => {
  try {
    // Apply rate limiting
    const rateLimitResult = rateLimit(request, emailSendRateLimiter);
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

    // Authenticate user
    const supabase = createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse and sanitize request body
    const body = await request.json();
    const sanitizedBody = sanitizer.sanitizeObject(body);
    const {
      to,
      subject,
      html,
      text,
      templateId,
      variables,
      priority = 'normal',
      scheduledAt,
    } = sanitizedBody;

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

    // Validate email addresses
    if (!sanitizer.validateEmail(to)) {
      return NextResponse.json(
        { error: 'Invalid email address' },
        { status: 400 }
      );
    }

    // Check user permissions
    const { data: userData } = await supabase
      .from('users')
      .select('role, email_quota, emails_sent_today')
      .eq('id', user.id)
      .single();

    if (!userData) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check email quota
    if (
      userData.role !== 'admin' &&
      userData.emails_sent_today >= userData.email_quota
    ) {
      return NextResponse.json(
        { error: 'Daily email quota exceeded' },
        { status: 429 }
      );
    }

    const sendGridService = new SendGridService();
    const templateManager = new EmailTemplateManager();
    const queueManager = new EmailQueueManager();
    const errorHandler = new EmailErrorHandler();

    let emailMessage;

    // Handle template-based email
    if (templateId) {
      try {
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
      } catch (error) {
        return NextResponse.json(
          { error: 'Template rendering failed' },
          { status: 500 }
        );
      }
    } else {
      // Handle direct email
      emailMessage = {
        to,
        subject,
        html,
        text,
      };
    }

    // Add email to queue
    const queueId = await queueManager.addToQueue({
      recipient: to,
      template_id: templateId,
      subject: emailMessage.subject,
      html_content: emailMessage.html,
      text_content: emailMessage.text,
      dynamic_template_data: emailMessage.dynamicTemplateData,
      priority: priority as 'low' | 'normal' | 'high' | 'urgent',
      scheduled_at: scheduledAt,
      max_retries: 3,
    });

    // Log audit event
    await auditLogger.logEvent({
      action: 'email_sent',
      details: {
        recipient: to,
        subject: emailMessage.subject,
        templateId,
        queueId,
        priority,
      },
    });

    // Update user email count
    await supabase
      .from('users')
      .update({
        emails_sent_today: userData.emails_sent_today + 1,
      })
      .eq('id', user.id);

    const response = NextResponse.json({
      success: true,
      queueId,
      message: 'Email queued for sending',
    });

    // Add rate limit headers
    Object.entries(rateLimitResult.headers).forEach(([key, value]) => {
      response.headers.set(key, value);
    });

    return response;
  } catch (error) {
    console.error('Email send error:', error);
    return NextResponse.json(
      { error: 'Failed to send email' },
      { status: 500 }
    );
  }
});
