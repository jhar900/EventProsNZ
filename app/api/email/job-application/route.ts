import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { SendGridService } from '@/lib/email/sendgrid-service';
import { EmailTemplateManager } from '@/lib/email/email-template-manager';

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      applicationId,
      userId,
      jobId,
      emailType = 'confirmation',
      status = 'submitted',
    } = body;

    if (!applicationId || !userId || !jobId) {
      return NextResponse.json(
        {
          error: 'Application ID, User ID, and Job ID are required',
        },
        { status: 400 }
      );
    }

    // Get application and job details
    const { data: application, error: appError } = await supabase
      .from('job_applications')
      .select(
        `
        *,
        jobs:job_id (
          title,
          company_name,
          location
        )
      `
      )
      .eq('id', applicationId)
      .single();

    if (appError || !application) {
      return NextResponse.json(
        { error: 'Application not found' },
        { status: 404 }
      );
    }

    // Get user details
    const { data: userData, error: userError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (userError || !userData) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Determine template based on email type
    let templateId = '';
    switch (emailType) {
      case 'confirmation':
        templateId = 'job-application-confirmation';
        break;
      case 'status_update':
        templateId = 'job-application-status-update';
        break;
      case 'reminder':
        templateId = 'job-application-reminder';
        break;
      case 'success':
        templateId = 'job-application-success';
        break;
      case 'rejection':
        templateId = 'job-application-rejection';
        break;
      default:
        templateId = 'job-application-confirmation';
    }

    // Get email template
    const templateManager = new EmailTemplateManager();
    const template = await templateManager.getTemplate(templateId);

    if (!template) {
      return NextResponse.json(
        { error: 'Email template not found' },
        { status: 404 }
      );
    }

    // Prepare template variables
    const templateVariables = {
      firstName: userData.first_name || 'User',
      lastName: userData.last_name || '',
      email: userData.email,
      jobTitle: application.jobs?.title || 'Job Position',
      companyName: application.jobs?.company_name || 'Company',
      jobLocation: application.jobs?.location || 'Location',
      applicationDate: new Date(application.created_at).toLocaleDateString(),
      applicationStatus: status,
      company: 'EventProsNZ',
    };

    // Render template
    const renderedTemplate = await templateManager.renderTemplate(
      template.id,
      templateVariables
    );

    // Send email
    const sendGridService = new SendGridService();
    const emailResponse = await sendGridService.sendEmail({
      to: userData.email,
      subject: renderedTemplate.subject,
      html: renderedTemplate.html,
      text: renderedTemplate.text,
      templateId: template.id,
      dynamicTemplateData: templateVariables,
      categories: ['job_application', emailType],
    });

    if (!emailResponse.success) {
      return NextResponse.json(
        { error: 'Failed to send job application email' },
        { status: 500 }
      );
    }

    // Log email communication
    await supabase.from('email_communications').insert({
      user_id: userId,
      email_type: `job_application_${emailType}`,
      template_id: template.id,
      status: 'sent',
      sent_at: new Date().toISOString(),
      metadata: {
        application_id: applicationId,
        job_id: jobId,
        status: status,
      },
    });

    return NextResponse.json({
      success: true,
      messageId: emailResponse.messageId,
      message: 'Job application email sent successfully',
    });
  } catch (error) {
    console.error('Job application email error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const applicationId = searchParams.get('applicationId');

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    let query = supabase
      .from('email_communications')
      .select('*')
      .eq('user_id', userId)
      .like('email_type', 'job_application_%')
      .order('sent_at', { ascending: false });

    if (applicationId) {
      query = query.eq('metadata->application_id', applicationId);
    }

    const { data: jobEmails, error } = await query;

    if (error) {
      return NextResponse.json(
        { error: 'Failed to fetch job application emails' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      jobEmails: jobEmails || [],
    });
  } catch (error) {
    console.error('Get job application emails error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
