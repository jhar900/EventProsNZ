import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/middleware';
import {
  validateAdminAccess,
  logAdminAction,
  checkRateLimit,
} from '@/lib/middleware/admin-auth';

export const dynamic = 'force-dynamic';

export async function PUT(request: NextRequest) {
  try {
    // Use comprehensive admin authorization middleware
    const authResult = await validateAdminAccess(request);
    if (!authResult.success) {
      return authResult.response;
    }

    const { supabase, user } = authResult;

    // Check rate limiting for bulk operations
    const rateLimitPassed = await checkRateLimit(request, 'bulk_user_actions');
    if (!rateLimitPassed) {
      return NextResponse.json(
        { error: 'Rate limit exceeded for bulk operations' },
        { status: 429 }
      );
    }

    const body = await request.json();
    const { action, user_ids, data } = body;

    if (
      !action ||
      !user_ids ||
      !Array.isArray(user_ids) ||
      user_ids.length === 0
    ) {
      return NextResponse.json(
        { error: 'Invalid request: action and user_ids are required' },
        { status: 400 }
      );
    }

    const results = [];
    const errors = [];

    for (const userId of user_ids) {
      try {
        let updateData: any = {};
        let logAction = '';

        switch (action) {
          case 'verify':
            updateData = { is_verified: true };
            logAction = 'admin_verify_user';
            break;

          case 'suspend':
            updateData = {
              status: 'suspended',
              suspension_reason: data?.message || 'Account suspended by admin',
              suspended_at: new Date().toISOString(),
              suspended_by: user.id,
            };
            logAction = 'admin_suspend_user';
            break;

          case 'activate':
            updateData = {
              status: 'active',
              suspension_reason: null,
              suspended_at: null,
              suspended_by: null,
            };
            logAction = 'admin_activate_user';
            break;

          case 'change_role':
            if (
              !data?.value ||
              !['admin', 'event_manager', 'contractor'].includes(data.value)
            ) {
              errors.push({ userId, error: 'Invalid role' });
              continue;
            }
            updateData = { role: data.value };
            logAction = 'admin_change_user_role';
            break;

          case 'delete':
            updateData = {
              status: 'deleted',
              deleted_at: new Date().toISOString(),
              deleted_by: user.id,
              deletion_reason: data?.message || 'Account deleted by admin',
            };
            logAction = 'admin_delete_user';
            break;

          default:
            errors.push({ userId, error: 'Invalid action' });
            continue;
        }

        updateData.updated_at = new Date().toISOString();

        // Update user
        const { data: updatedUser, error: updateError } = await supabase
          .from('users')
          .update(updateData)
          .eq('id', userId)
          .select()
          .single();

        if (updateError) {
          errors.push({ userId, error: updateError.message });
          continue;
        }

        // Log admin action using centralized logging
        await logAdminAction(
          supabase,
          user.id,
          logAction,
          {
            target_user_id: userId,
            changes: updateData,
            bulk_action: true,
            action_data: data,
          },
          request
        );

        results.push({ userId, success: true, data: updatedUser });
      } catch (error) {
        errors.push({ userId, error: 'Internal error' });
      }
    }

    // Log overall bulk operation
    await logAdminAction(
      supabase,
      user.id,
      'bulk_user_operation',
      {
        action,
        total_users: user_ids.length,
        successful: results.length,
        failed: errors.length,
        user_ids: user_ids,
        action_data: data,
      },
      request
    );

    return NextResponse.json({
      success: true,
      results,
      errors,
      summary: {
        total: user_ids.length,
        successful: results.length,
        failed: errors.length,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
