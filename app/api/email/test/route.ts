import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/middleware';

export const dynamic = 'force-dynamic';

export const POST = async (request: NextRequest) => {
  try {
    // Check for admin token header first (development bypass)
    const adminToken = request.headers.get('x-admin-token');
    const expectedToken =
      process.env.ADMIN_ACCESS_TOKEN || 'admin-secure-token-2024-eventpros';
    const isDevelopment =
      process.env.NODE_ENV === 'development' ||
      process.env.VERCEL_ENV === 'development' ||
      request.url.includes('localhost');

    let user: any;

    // If admin token is provided and matches, or we're in development, allow access
    if (adminToken === expectedToken || isDevelopment) {
      // In development, try to get user but don't fail if not found
      const { supabase } = createClient(request);
      const {
        data: { session },
      } = await supabase.auth.getSession();
      user = session?.user;
    } else {
      // Normal authentication flow
      const { supabase } = createClient(request);

      // Try to get user from session first (better cookie handling)
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (session?.user) {
        user = session.user;
      } else {
        // Fallback to getUser (reads from cookies)
        const {
          data: { user: getUserUser },
          error: authError,
        } = await supabase.auth.getUser();

        if (authError || !getUserUser) {
          return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        user = getUserUser;
      }

      if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    }

    const body = await request.json();
    const {
      templateId,
      recipientEmail,
      emailType = 'test',
      variables = {},
      // Direct template content (for mock templates)
      subject,
      htmlContent,
      textContent,
    } = body;

    if (!recipientEmail) {
      return NextResponse.json(
        {
          error: 'Recipient email is required',
        },
        { status: 400 }
      );
    }

    let renderedTemplate: { subject: string; html: string; text: string };
    let templateName = 'Test Template';

    // If template content is provided directly (for mock templates), use it
    if (subject && htmlContent) {
      // Prepare test variables
      const testVariables = {
        firstName: 'Test',
        lastName: 'User',
        email: recipientEmail,
        company: 'EventProsNZ',
        date: new Date().toLocaleDateString(),
        time: new Date().toLocaleTimeString(),
        ...variables,
      };

      // Replace variables in template content
      let renderedSubject = subject;
      let renderedHtml = htmlContent;
      let renderedText = textContent || htmlContent.replace(/<[^>]*>/g, '');

      // Simple variable replacement
      Object.entries(testVariables).forEach(([key, value]) => {
        const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
        renderedSubject = renderedSubject.replace(regex, String(value));
        renderedHtml = renderedHtml.replace(regex, String(value));
        renderedText = renderedText.replace(regex, String(value));
      });

      renderedTemplate = {
        subject: renderedSubject,
        html: renderedHtml,
        text: renderedText,
      };
    } else if (templateId) {
      // Get email template from database
      const { EmailTemplateManager } = await import(
        '@/lib/email/email-template-manager'
      );
      const templateManager = new EmailTemplateManager();
      const template = await templateManager.getTemplate(templateId);

      if (!template) {
        return NextResponse.json(
          { error: 'Email template not found' },
          { status: 404 }
        );
      }

      templateName = template.name;

      // Prepare test variables
      const testVariables = {
        firstName: 'Test',
        lastName: 'User',
        email: recipientEmail,
        company: 'EventProsNZ',
        date: new Date().toLocaleDateString(),
        time: new Date().toLocaleTimeString(),
        ...variables,
      };

      // Render template
      renderedTemplate = await templateManager.renderTemplate(
        template.id,
        testVariables
      );
    } else {
      return NextResponse.json(
        {
          error:
            'Either templateId or template content (subject, htmlContent) is required',
        },
        { status: 400 }
      );
    }

    // Send test email using SimpleEmailService (works with any provider)
    const { SimpleEmailService } = await import(
      '@/lib/email/simple-email-service'
    );
    const emailResponse = await SimpleEmailService.sendEmail({
      to: recipientEmail,
      subject: `[TEST] ${renderedTemplate.subject}`,
      html: renderedTemplate.html,
      text: renderedTemplate.text,
      from: 'no-reply@eventpros.co.nz',
      fromName: 'Event Pros NZ',
    });

    if (!emailResponse.success) {
      return NextResponse.json(
        {
          error: 'Failed to send test email',
          details: emailResponse.error,
        },
        { status: 500 }
      );
    }

    // Log test email to email_communications table
    try {
      const { supabaseAdmin } = await import('@/lib/supabase/server');
      await supabaseAdmin.from('email_communications').insert({
        user_id: user?.id || null,
        email_type: `test_${emailType}`,
        template_id: templateId || null,
        status: 'sent',
        sent_at: new Date().toISOString(),
        metadata: {
          test_email: true,
          recipient: recipientEmail,
          template_name: templateName,
          ...(templateId ? {} : { is_mock_template: true }),
        },
      });
    } catch (logError) {
      // Don't fail if logging fails
      console.warn('Failed to log test email:', logError);
    }

    return NextResponse.json({
      success: true,
      messageId: emailResponse.messageId || 'dev-mode',
      message: 'Test email sent successfully',
      recipient: recipientEmail,
      template: templateName,
    });
  } catch (error) {
    console.error('Send test email error:', error);
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: errorMessage,
      },
      { status: 500 }
    );
  }
};

export const GET = async (request: NextRequest) => {
  try {
    const { supabase } = createClient(request);

    // Try to get user from session first (better cookie handling)
    let user: any;
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (session?.user) {
      user = session.user;
    } else {
      // Fallback to getUser (reads from cookies)
      const {
        data: { user: getUserUser },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !getUserUser) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      user = getUserUser;
    }

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const templateId = searchParams.get('templateId');

    if (!templateId) {
      return NextResponse.json(
        { error: 'Template ID is required' },
        { status: 400 }
      );
    }

    // Get template preview
    const { EmailTemplateManager } = await import(
      '@/lib/email/email-template-manager'
    );
    const templateManager = new EmailTemplateManager();
    const template = await templateManager.getTemplate(templateId);

    if (!template) {
      return NextResponse.json(
        { error: 'Email template not found' },
        { status: 404 }
      );
    }

    // Generate preview with sample data
    const preview = await templateManager.previewTemplate(templateId);

    return NextResponse.json({
      success: true,
      template: {
        id: template.id,
        name: template.name,
        subject: template.subject,
        variables: template.variables,
      },
      preview: {
        subject: preview.subject,
        html: preview.html,
        text: preview.text,
      },
    });
  } catch (error) {
    console.error('Get template preview error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
};
