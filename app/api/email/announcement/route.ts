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
      announcementId,
      emailType = 'feature_announcement',
      targetAudience = 'all_users',
      priority = 'medium',
      announcementData = {},
    } = body;

    if (!announcementId) {
      return NextResponse.json(
        {
          error: 'Announcement ID is required',
        },
        { status: 400 }
      );
    }

    // Get announcement details
    const { data: announcement, error: announcementError } = await supabase
      .from('platform_announcements')
      .select('*')
      .eq('id', announcementId)
      .single();

    if (announcementError || !announcement) {
      return NextResponse.json(
        { error: 'Announcement not found' },
        { status: 404 }
      );
    }

    // Determine template based on email type
    let templateId = '';
    switch (emailType) {
      case 'feature_announcement':
        templateId = 'platform-feature-announcement';
        break;
      case 'maintenance':
        templateId = 'platform-maintenance-notification';
        break;
      case 'policy_update':
        templateId = 'platform-policy-update';
        break;
      case 'security_alert':
        templateId = 'platform-security-alert';
        break;
      case 'newsletter':
        templateId = 'platform-newsletter';
        break;
      default:
        templateId = 'platform-feature-announcement';
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

    // Get target users based on audience
    let userQuery = supabase.from('profiles').select('*');

    if (targetAudience === 'event_managers') {
      userQuery = userQuery.eq('user_type', 'event_manager');
    } else if (targetAudience === 'contractors') {
      userQuery = userQuery.eq('user_type', 'contractor');
    } else if (targetAudience === 'premium_users') {
      userQuery = userQuery.eq('subscription_status', 'active');
    }

    const { data: targetUsers, error: usersError } = await userQuery;

    if (usersError || !targetUsers || targetUsers.length === 0) {
      return NextResponse.json(
        { error: 'No target users found' },
        { status: 404 }
      );
    }

    // Prepare template variables
    const templateVariables = {
      announcementTitle: announcement.title || 'Platform Update',
      announcementContent: announcement.content || '',
      announcementType: emailType,
      priority: priority,
      company: 'EventProsNZ',
      date: new Date().toLocaleDateString(),
    };

    // Render template
    const renderedTemplate = await templateManager.renderTemplate(
      template.id,
      templateVariables
    );

    // Send emails to all target users
    const sendGridService = new SendGridService();
    const emailPromises = targetUsers.map(async targetUser => {
      const userVariables = {
        ...templateVariables,
        firstName: targetUser.first_name || 'User',
        lastName: targetUser.last_name || '',
        email: targetUser.email,
      };

      return sendGridService.sendEmail({
        to: targetUser.email,
        subject: renderedTemplate.subject,
        html: renderedTemplate.html,
        text: renderedTemplate.text,
        templateId: template.id,
        dynamicTemplateData: userVariables,
        categories: ['platform_announcement', emailType, priority],
      });
    });

    const emailResults = await Promise.allSettled(emailPromises);
    const successfulEmails = emailResults.filter(
      result => result.status === 'fulfilled' && result.value.success
    ).length;

    // Log email communications
    const communicationLogs = targetUsers.map(targetUser => ({
      user_id: targetUser.id,
      email_type: `platform_${emailType}`,
      template_id: template.id,
      status: 'sent',
      sent_at: new Date().toISOString(),
      metadata: {
        announcement_id: announcementId,
        target_audience: targetAudience,
        priority: priority,
      },
    }));

    await supabase.from('email_communications').insert(communicationLogs);

    return NextResponse.json({
      success: true,
      message: `Platform announcement sent to ${successfulEmails} users`,
      totalTargeted: targetUsers.length,
      successfulEmails: successfulEmails,
      failedEmails: targetUsers.length - successfulEmails,
    });
  } catch (error) {
    console.error('Platform announcement email error:', error);
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
    const announcementId = searchParams.get('announcementId');

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
      .like('email_type', 'platform_%')
      .order('sent_at', { ascending: false });

    if (announcementId) {
      query = query.eq('metadata->announcement_id', announcementId);
    }

    const { data: announcementEmails, error } = await query;

    if (error) {
      return NextResponse.json(
        { error: 'Failed to fetch announcement emails' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      announcementEmails: announcementEmails || [],
    });
  } catch (error) {
    console.error('Get announcement emails error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
