import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { SendGridService } from '@/lib/email/sendgrid-service';

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
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const emailType = searchParams.get('emailType');
    const templateId = searchParams.get('templateId');

    // Build filters for email analytics
    const filters: any = {};
    if (startDate) filters.startDate = startDate;
    if (endDate) filters.endDate = endDate;
    if (emailType) filters.emailType = emailType;
    if (templateId) filters.templateId = templateId;

    // Get email analytics from SendGrid service
    const sendGridService = new SendGridService();
    const analytics = await sendGridService.getEmailAnalytics(filters);

    // Get additional communication data from database
    let query = supabase
      .from('email_communications')
      .select('*')
      .order('sent_at', { ascending: false });

    if (startDate) {
      query = query.gte('sent_at', startDate);
    }
    if (endDate) {
      query = query.lte('sent_at', endDate);
    }
    if (emailType) {
      query = query.eq('email_type', emailType);
    }

    const { data: communications, error: commError } = await query;

    if (commError) {
      return NextResponse.json(
        { error: 'Failed to fetch communication data' },
        { status: 500 }
      );
    }

    // Calculate additional metrics
    const totalCommunications = communications?.length || 0;
    const sentCount =
      communications?.filter(c => c.status === 'sent').length || 0;
    const failedCount =
      communications?.filter(c => c.status === 'failed').length || 0;

    // Group by email type
    const emailTypeStats =
      communications?.reduce((acc: any, comm: any) => {
        const type = comm.email_type;
        if (!acc[type]) {
          acc[type] = { count: 0, sent: 0, failed: 0 };
        }
        acc[type].count++;
        if (comm.status === 'sent') acc[type].sent++;
        if (comm.status === 'failed') acc[type].failed++;
        return acc;
      }, {}) || {};

    // Group by template
    const templateStats =
      communications?.reduce((acc: any, comm: any) => {
        const template = comm.template_id;
        if (!acc[template]) {
          acc[template] = { count: 0, sent: 0, failed: 0 };
        }
        acc[template].count++;
        if (comm.status === 'sent') acc[template].sent++;
        if (comm.status === 'failed') acc[template].failed++;
        return acc;
      }, {}) || {};

    return NextResponse.json({
      success: true,
      analytics: {
        ...analytics,
        totalCommunications,
        sentCount,
        failedCount,
        emailTypeStats,
        templateStats,
      },
    });
  } catch (error) {
    console.error('Get email analytics error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

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
      emailType,
      startDate,
      endDate,
      metrics = ['delivery_rate', 'open_rate', 'click_rate'],
    } = body;

    if (!emailType) {
      return NextResponse.json(
        {
          error: 'Email type is required',
        },
        { status: 400 }
      );
    }

    // Get detailed analytics for specific email type
    const { data: communications, error } = await supabase
      .from('email_communications')
      .select('*')
      .eq('email_type', emailType)
      .order('sent_at', { ascending: false });

    if (error) {
      return NextResponse.json(
        { error: 'Failed to fetch email analytics' },
        { status: 500 }
      );
    }

    // Calculate detailed metrics
    const totalSent = communications?.length || 0;
    const successfulSent =
      communications?.filter(c => c.status === 'sent').length || 0;
    const failedSent =
      communications?.filter(c => c.status === 'failed').length || 0;

    const deliveryRate = totalSent > 0 ? (successfulSent / totalSent) * 100 : 0;
    const failureRate = totalSent > 0 ? (failedSent / totalSent) * 100 : 0;

    // Get engagement data from email logs
    const { data: emailLogs, error: logsError } = await supabase
      .from('email_logs')
      .select('*')
      .in('template_id', communications?.map(c => c.template_id) || []);

    if (logsError) {
      console.warn('Failed to fetch email logs:', logsError);
    }

    const totalDelivered =
      emailLogs?.filter(log => log.status === 'delivered').length || 0;
    const totalOpened = emailLogs?.filter(log => log.opened_at).length || 0;
    const totalClicked = emailLogs?.filter(log => log.clicked_at).length || 0;

    const openRate =
      totalDelivered > 0 ? (totalOpened / totalDelivered) * 100 : 0;
    const clickRate =
      totalDelivered > 0 ? (totalClicked / totalDelivered) * 100 : 0;

    // Time-based analysis
    const dailyStats =
      communications?.reduce((acc: any, comm: any) => {
        const date = new Date(comm.sent_at).toISOString().split('T')[0];
        if (!acc[date]) {
          acc[date] = { sent: 0, successful: 0, failed: 0 };
        }
        acc[date].sent++;
        if (comm.status === 'sent') acc[date].successful++;
        if (comm.status === 'failed') acc[date].failed++;
        return acc;
      }, {}) || {};

    return NextResponse.json({
      success: true,
      analytics: {
        emailType,
        totalSent,
        successfulSent,
        failedSent,
        deliveryRate: Math.round(deliveryRate * 100) / 100,
        failureRate: Math.round(failureRate * 100) / 100,
        openRate: Math.round(openRate * 100) / 100,
        clickRate: Math.round(clickRate * 100) / 100,
        dailyStats,
        timeRange: {
          startDate,
          endDate,
        },
      },
    });
  } catch (error) {
    console.error('Get detailed email analytics error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
