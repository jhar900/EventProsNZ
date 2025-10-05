import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';
import {
  SendInquiryNotificationRequest,
  InquiryNotificationResponse,
  InquiryNotificationListResponse,
  NOTIFICATION_TYPES,
} from '@/types/inquiries';

// Validation schemas
const sendNotificationSchema = z.object({
  inquiry_id: z.string().uuid('Invalid inquiry ID'),
  notification_type: z.enum(
    Object.values(NOTIFICATION_TYPES) as [string, ...string[]]
  ),
});

const getNotificationsSchema = z.object({
  user_id: z.string().uuid().optional(),
  inquiry_id: z.string().uuid().optional(),
  is_read: z.coerce.boolean().optional(),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
});

// POST /api/inquiries/notifications/send - Send a notification
export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();

    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validationResult = sendNotificationSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          message: 'Validation failed',
          errors: validationResult.error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message,
          })),
        },
        { status: 400 }
      );
    }

    const { inquiry_id, notification_type } = validationResult.data;

    // Verify inquiry exists and user has access
    const { data: inquiry, error: inquiryError } = await supabase
      .from('inquiries')
      .select('*')
      .eq('id', inquiry_id)
      .single();

    if (inquiryError || !inquiry) {
      return NextResponse.json(
        { success: false, message: 'Inquiry not found' },
        { status: 404 }
      );
    }

    // Get user role and check permissions
    const { data: userProfile, error: profileError } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profileError || !userProfile) {
      return NextResponse.json(
        { success: false, message: 'User profile not found' },
        { status: 404 }
      );
    }

    // Check notification permissions
    const canSendNotification =
      userProfile.role === 'admin' ||
      (userProfile.role === 'event_manager' &&
        inquiry.event_manager_id === user.id) ||
      (userProfile.role === 'contractor' && inquiry.contractor_id === user.id);

    if (!canSendNotification) {
      return NextResponse.json(
        { success: false, message: 'Access denied' },
        { status: 403 }
      );
    }

    // Determine notification message based on type
    let message = '';
    let targetUserId = '';

    switch (notification_type) {
      case 'new_inquiry':
        message = `New inquiry: ${inquiry.subject}`;
        targetUserId = inquiry.contractor_id;
        break;
      case 'inquiry_response':
        message = `Response received for inquiry: ${inquiry.subject}`;
        targetUserId = inquiry.event_manager_id;
        break;
      case 'inquiry_status_update':
        message = `Inquiry status updated: ${inquiry.subject}`;
        targetUserId = inquiry.event_manager_id;
        break;
      case 'reminder':
        message = `Reminder: ${inquiry.subject}`;
        targetUserId = inquiry.contractor_id;
        break;
      default:
        message = `Notification for inquiry: ${inquiry.subject}`;
        targetUserId = inquiry.contractor_id;
    }

    // Create notification record
    const { data: notification, error: notificationError } = await supabase
      .from('inquiry_notifications')
      .insert({
        inquiry_id,
        user_id: targetUserId,
        notification_type,
        message,
        is_read: false,
      })
      .select()
      .single();

    if (notificationError) {
      console.error('Notification creation error:', notificationError);
      return NextResponse.json(
        { success: false, message: 'Failed to create notification' },
        { status: 500 }
      );
    }

    // TODO: Send actual email notification
    // This would integrate with the email service (SendGrid, etc.)

    const response: InquiryNotificationResponse = {
      notification,
      success: true,
      message: 'Notification sent successfully',
    };

    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    console.error('Notification send error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET /api/inquiries/notifications - Get notifications
export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();

    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Parse and validate query parameters
    const { searchParams } = new URL(request.url);
    const queryParams = Object.fromEntries(searchParams.entries());
    const validationResult = getNotificationsSchema.safeParse(queryParams);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          message: 'Invalid query parameters',
          errors: validationResult.error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message,
          })),
        },
        { status: 400 }
      );
    }

    const { user_id, inquiry_id, is_read, page, limit } = validationResult.data;
    const offset = (page - 1) * limit;

    // Get user role to determine access
    const { data: userProfile, error: profileError } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profileError || !userProfile) {
      return NextResponse.json(
        { success: false, message: 'User profile not found' },
        { status: 404 }
      );
    }

    // Build query
    let query = supabase
      .from('inquiry_notifications')
      .select(
        `
        *,
        inquiry:inquiry_id (
          id,
          subject,
          status,
          contractor:contractor_id (
            id,
            profiles!inner (
              first_name,
              last_name
            ),
            business_profiles!inner (
              company_name
            )
          ),
          event_manager:event_manager_id (
            id,
            profiles!inner (
              first_name,
              last_name
            )
          )
        )
      `
      )
      .order('created_at', { ascending: false });

    // Apply role-based filtering
    if (userProfile.role === 'admin') {
      // Admins can see all notifications
      if (user_id) {
        query = query.eq('user_id', user_id);
      }
    } else {
      // Regular users can only see their own notifications
      query = query.eq('user_id', user.id);
    }

    // Apply filters
    if (inquiry_id) {
      query = query.eq('inquiry_id', inquiry_id);
    }

    if (is_read !== undefined) {
      query = query.eq('is_read', is_read);
    }

    // Apply pagination
    query = query.range(offset, offset + limit - 1);

    const { data: notifications, error: notificationsError } = await query;

    if (notificationsError) {
      console.error('Notifications fetch error:', notificationsError);
      return NextResponse.json(
        { success: false, message: 'Failed to fetch notifications' },
        { status: 500 }
      );
    }

    const response: InquiryNotificationListResponse = {
      notifications: notifications || [],
      success: true,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Notifications fetch error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}
