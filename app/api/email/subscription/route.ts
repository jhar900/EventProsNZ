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
      subscriptionId,
      userId,
      emailType = 'confirmation',
      subscriptionData = {},
    } = body;

    if (!subscriptionId || !userId) {
      return NextResponse.json(
        {
          error: 'Subscription ID and User ID are required',
        },
        { status: 400 }
      );
    }

    // Get subscription details
    const { data: subscription, error: subError } = await supabase
      .from('subscriptions')
      .select(
        `
        *,
        subscription_plans:plan_id (
          name,
          price,
          billing_cycle
        )
      `
      )
      .eq('id', subscriptionId)
      .single();

    if (subError || !subscription) {
      return NextResponse.json(
        { error: 'Subscription not found' },
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
        templateId = 'subscription-confirmation';
        break;
      case 'billing_reminder':
        templateId = 'subscription-billing-reminder';
        break;
      case 'payment_success':
        templateId = 'subscription-payment-success';
        break;
      case 'payment_failure':
        templateId = 'subscription-payment-failure';
        break;
      case 'renewal':
        templateId = 'subscription-renewal';
        break;
      case 'change':
        templateId = 'subscription-change';
        break;
      default:
        templateId = 'subscription-confirmation';
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
      planName: subscription.subscription_plans?.name || 'Premium Plan',
      planPrice: subscription.subscription_plans?.price || '$29.99',
      billingCycle: subscription.subscription_plans?.billing_cycle || 'monthly',
      subscriptionStatus: subscription.status || 'active',
      nextBillingDate: subscription.next_billing_date
        ? new Date(subscription.next_billing_date).toLocaleDateString()
        : 'N/A',
      amount: subscription.amount || '$29.99',
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
      categories: ['subscription', emailType],
    });

    if (!emailResponse.success) {
      return NextResponse.json(
        { error: 'Failed to send subscription email' },
        { status: 500 }
      );
    }

    // Log email communication
    await supabase.from('email_communications').insert({
      user_id: userId,
      email_type: `subscription_${emailType}`,
      template_id: template.id,
      status: 'sent',
      sent_at: new Date().toISOString(),
      metadata: {
        subscription_id: subscriptionId,
        plan_name: subscription.subscription_plans?.name,
        email_type: emailType,
      },
    });

    return NextResponse.json({
      success: true,
      messageId: emailResponse.messageId,
      message: 'Subscription email sent successfully',
    });
  } catch (error) {
    console.error('Subscription email error:', error);
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
    const subscriptionId = searchParams.get('subscriptionId');

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
      .like('email_type', 'subscription_%')
      .order('sent_at', { ascending: false });

    if (subscriptionId) {
      query = query.eq('metadata->subscription_id', subscriptionId);
    }

    const { data: subscriptionEmails, error } = await query;

    if (error) {
      return NextResponse.json(
        { error: 'Failed to fetch subscription emails' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      subscriptionEmails: subscriptionEmails || [],
    });
  } catch (error) {
    console.error('Get subscription emails error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
