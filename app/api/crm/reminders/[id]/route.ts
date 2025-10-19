import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';
import {
  withSecurity,
  crmSecurityConfig,
} from '@/lib/security/security-middleware';
import { textSanitizer } from '@/lib/security/input-sanitization';
import { crmDataCache } from '@/lib/cache/crm-cache';
import { queryOptimizer } from '@/lib/database/query-optimization';
import { CRMPagination } from '@/lib/database/pagination';

// Validation schemas
const updateReminderSchema = z.object({
  is_completed: z.boolean(),
  completed_at: z.string().datetime().optional(),
});

// PUT /api/crm/reminders/[id] - Update a reminder
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return withSecurity(
    request,
    async () => {
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

        const reminderId = params.id;

        // Parse and validate request body
        const body = await request.json();

        // Sanitize input data
        const sanitizedBody = textSanitizer.sanitizeObject(body);
        const validationResult = updateReminderSchema.safeParse(sanitizedBody);

        if (!validationResult.success) {
          return NextResponse.json(
            {
              success: false,
              message: 'Validation failed',
              errors:
                validationResult.error.errors?.map(err => ({
                  field: err.path.join('.'),
                  message: err.message,
                })) || [],
            },
            { status: 400 }
          );
        }

        const { is_completed, completed_at } = validationResult.data;

        // Check if reminder exists and belongs to user
        const { data: existingReminder, error: fetchError } = await supabase
          .from('contact_reminders')
          .select('id, user_id')
          .eq('id', reminderId)
          .eq('user_id', user.id)
          .single();

        if (fetchError || !existingReminder) {
          return NextResponse.json(
            { success: false, message: 'Reminder not found' },
            { status: 404 }
          );
        }

        // Prepare update data
        const updateData: any = { is_completed };
        if (is_completed && !completed_at) {
          updateData.completed_at = new Date().toISOString();
        } else if (completed_at) {
          updateData.completed_at = completed_at;
        }

        // Update reminder
        const { data: reminder, error } = await supabase
          .from('contact_reminders')
          .update(updateData)
          .eq('id', reminderId)
          .eq('user_id', user.id)
          .select(
            `
        *,
        contact:contacts!contact_reminders_contact_id_fkey(
          id,
          contact_type,
          relationship_status,
          contact_user:users!contacts_contact_user_id_fkey(
            id,
            email,
            role
          ),
          contact_profile:profiles!contacts_contact_user_id_fkey(
            first_name,
            last_name,
            avatar_url
          )
        )
      `
          )
          .single();

        if (error) {
          throw new Error(`Failed to update reminder: ${error.message}`);
        }

        return NextResponse.json({
          success: true,
          reminder,
        });
      } catch (error) {
        console.error('Error updating reminder:', error);
        return NextResponse.json(
          { success: false, message: 'Failed to update reminder' },
          { status: 500 }
        );
      }
    },
    crmSecurityConfig
  );
}

// DELETE /api/crm/reminders/[id] - Delete a reminder
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return withSecurity(
    request,
    async () => {
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

        const reminderId = params.id;

        // Check if reminder exists and belongs to user
        const { data: existingReminder, error: fetchError } = await supabase
          .from('contact_reminders')
          .select('id, user_id')
          .eq('id', reminderId)
          .eq('user_id', user.id)
          .single();

        if (fetchError || !existingReminder) {
          return NextResponse.json(
            { success: false, message: 'Reminder not found' },
            { status: 404 }
          );
        }

        // Delete reminder
        const { error } = await supabase
          .from('contact_reminders')
          .delete()
          .eq('id', reminderId)
          .eq('user_id', user.id);

        if (error) {
          throw new Error(`Failed to delete reminder: ${error.message}`);
        }

        return NextResponse.json({
          success: true,
          message: 'Reminder deleted successfully',
        });
      } catch (error) {
        console.error('Error deleting reminder:', error);
        return NextResponse.json(
          { success: false, message: 'Failed to delete reminder' },
          { status: 500 }
        );
      }
    },
    crmSecurityConfig
  );
}
