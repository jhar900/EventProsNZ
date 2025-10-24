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
      userId,
      userType = 'event_manager',
      emailType = 'welcome_series',
    } = body;

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
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

    // Get email template
    const templateManager = new EmailTemplateManager();
    const template = await templateManager.getTemplate(
      'welcome-series-template'
    );

    if (!template) {
      return NextResponse.json(
        { error: 'Welcome email template not found' },
        { status: 404 }
      );
    }

    // Prepare template variables
    const templateVariables = {
      firstName: userData.first_name || 'User',
      lastName: userData.last_name || '',
      email: userData.email,
      userType: userType,
      company: 'EventProsNZ',
      date: new Date().toLocaleDateString(),
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
      categories: ['welcome', 'onboarding'],
    });

    if (!emailResponse.success) {
      return NextResponse.json(
        { error: 'Failed to send welcome email' },
        { status: 500 }
      );
    }

    // Log email communication
    await supabase.from('email_communications').insert({
      user_id: userId,
      email_type: emailType,
      template_id: template.id,
      status: 'sent',
      sent_at: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      messageId: emailResponse.messageId,
      message: 'Welcome email sent successfully',
    });
  } catch (error) {
    console.error('Welcome email error:', error);
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

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Get welcome email series status
    const { data: welcomeEmails, error } = await supabase
      .from('email_communications')
      .select('*')
      .eq('user_id', userId)
      .eq('email_type', 'welcome_series')
      .order('sent_at', { ascending: false });

    if (error) {
      return NextResponse.json(
        { error: 'Failed to fetch welcome emails' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      welcomeEmails: welcomeEmails || [],
    });
  } catch (error) {
    console.error('Get welcome emails error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
