import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';
import { validateAdminAccess } from '@/lib/middleware/admin-auth';

export const dynamic = 'force-dynamic';

// GET /api/admin/emails/logs - Get all email communications with pagination and filters
export async function GET(request: NextRequest) {
  try {
    const authResult = await validateAdminAccess(request);
    if (!authResult.success) {
      return (
        authResult.response ||
        NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      );
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const emailType = searchParams.get('email_type');
    const status = searchParams.get('status');
    const templateId = searchParams.get('template_id');
    const userId = searchParams.get('user_id');
    const dateFrom = searchParams.get('date_from');
    const dateTo = searchParams.get('date_to');
    const search = searchParams.get('search');

    // Calculate offset
    const offset = (page - 1) * limit;

    // Build base query
    let query = supabaseAdmin
      .from('email_communications')
      .select('*', { count: 'exact' })
      .order('sent_at', { ascending: false });

    // Apply filters
    if (emailType) {
      query = query.eq('email_type', emailType);
    }

    if (status) {
      query = query.eq('status', status);
    }

    if (templateId) {
      query = query.eq('template_id', templateId);
    }

    if (userId) {
      query = query.eq('user_id', userId);
    }

    if (dateFrom) {
      query = query.gte('sent_at', dateFrom);
    }

    if (dateTo) {
      query = query.lte('sent_at', dateTo);
    }

    if (search) {
      // Search in email_type (metadata is JSONB, so we'll search it differently)
      query = query.ilike('email_type', `%${search}%`);
    }

    // Apply pagination
    query = query.range(offset, offset + limit - 1);

    const { data: logs, error, count } = await query;

    if (error) {
      console.error('Error fetching email logs:', error);
      console.error('Error details:', JSON.stringify(error, null, 2));
      return NextResponse.json(
        {
          error: 'Failed to fetch email logs',
          details: error.message,
          hint: error.hint,
          code: error.code,
        },
        { status: 500 }
      );
    }

    // Get unique user IDs and template IDs to fetch related data
    const userIds = [
      ...new Set((logs || []).map((log: any) => log.user_id).filter(Boolean)),
    ];
    const templateIds = [
      ...new Set(
        (logs || []).map((log: any) => log.template_id).filter(Boolean)
      ),
    ];

    // Fetch user emails
    const userEmailsMap: Record<string, string> = {};
    if (userIds.length > 0) {
      const { data: users } = await supabaseAdmin
        .from('users')
        .select('id, email')
        .in('id', userIds);

      if (users) {
        users.forEach((user: any) => {
          userEmailsMap[user.id] = user.email;
        });
      }
    }

    // Fetch template names
    const templateMap: Record<
      string,
      { name: string; trigger_action: string }
    > = {};
    if (templateIds.length > 0) {
      const { data: templates } = await supabaseAdmin
        .from('email_templates')
        .select('id, name, trigger_action')
        .in('id', templateIds);

      if (templates) {
        templates.forEach((template: any) => {
          templateMap[template.id] = {
            name: template.name,
            trigger_action: template.trigger_action,
          };
        });
      }
    }

    // Transform the data to include user email and template info
    const transformedLogs = (logs || []).map((log: any) => {
      // Get recipient email from user lookup, or from metadata (for test emails), or null
      let recipientEmail = userEmailsMap[log.user_id] || null;

      // Check metadata for recipient email (useful for test emails or emails sent to non-users)
      if (!recipientEmail && log.metadata) {
        if (typeof log.metadata === 'object') {
          recipientEmail =
            log.metadata.recipient || log.metadata.recipient_email || null;
        }
      }

      return {
        id: log.id,
        user_id: log.user_id,
        recipient_email: recipientEmail,
        email_type: log.email_type,
        template_id: log.template_id,
        template_name: templateMap[log.template_id]?.name || null,
        trigger_action: templateMap[log.template_id]?.trigger_action || null,
        status: log.status,
        sent_at: log.sent_at,
        metadata: log.metadata,
      };
    });

    return NextResponse.json({
      logs: transformedLogs,
      total: count || 0,
      page,
      limit,
      totalPages: Math.ceil((count || 0) / limit),
    });
  } catch (error) {
    console.error('Error in GET /api/admin/emails/logs:', error);
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : undefined;
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: errorMessage,
        ...(errorStack && { stack: errorStack }),
      },
      { status: 500 }
    );
  }
}
