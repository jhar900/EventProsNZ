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
      eventId,
      userId,
      emailType = 'creation_confirmation',
      eventData = {},
    } = body;

    if (!eventId || !userId) {
      return NextResponse.json(
        {
          error: 'Event ID and User ID are required',
        },
        { status: 400 }
      );
    }

    // Get event details
    const { data: event, error: eventError } = await supabase
      .from('events')
      .select('*')
      .eq('id', eventId)
      .single();

    if (eventError || !event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
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
      case 'creation_confirmation':
        templateId = 'event-creation-confirmation';
        break;
      case 'update_notification':
        templateId = 'event-update-notification';
        break;
      case 'reminder':
        templateId = 'event-reminder';
        break;
      case 'completion':
        templateId = 'event-completion';
        break;
      case 'feedback':
        templateId = 'event-feedback-request';
        break;
      default:
        templateId = 'event-creation-confirmation';
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
      eventName: event.name || 'Your Event',
      eventDate: event.date ? new Date(event.date).toLocaleDateString() : 'TBD',
      eventTime: event.time || 'TBD',
      eventLocation: event.location || 'TBD',
      eventDescription: event.description || '',
      eventType: event.type || 'Event',
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
      categories: ['event', emailType],
    });

    if (!emailResponse.success) {
      return NextResponse.json(
        { error: 'Failed to send event email' },
        { status: 500 }
      );
    }

    // Log email communication
    await supabase.from('email_communications').insert({
      user_id: userId,
      email_type: `event_${emailType}`,
      template_id: template.id,
      status: 'sent',
      sent_at: new Date().toISOString(),
      metadata: {
        event_id: eventId,
        event_name: event.name,
        email_type: emailType,
      },
    });

    return NextResponse.json({
      success: true,
      messageId: emailResponse.messageId,
      message: 'Event email sent successfully',
    });
  } catch (error) {
    console.error('Event email error:', error);
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
    const eventId = searchParams.get('eventId');

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
      .like('email_type', 'event_%')
      .order('sent_at', { ascending: false });

    if (eventId) {
      query = query.eq('metadata->event_id', eventId);
    }

    const { data: eventEmails, error } = await query;

    if (error) {
      return NextResponse.json(
        { error: 'Failed to fetch event emails' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      eventEmails: eventEmails || [],
    });
  } catch (error) {
    console.error('Get event emails error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
