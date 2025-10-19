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
const getTimelineSummarySchema = z.object({
  contact_id: z.string().uuid('Contact ID is required'),
  period: z.enum(['day', 'week', 'month', 'year']).default('month'),
});

// GET /api/crm/timeline/summary - Get timeline summary for a contact
export async function GET(request: NextRequest) {
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

        // Parse and validate query parameters
        const { searchParams } = new URL(request.url);
        const queryParams = Object.fromEntries(searchParams.entries());

        const validationResult =
          getTimelineSummarySchema.safeParse(queryParams);
        if (!validationResult.success) {
          return NextResponse.json(
            {
              success: false,
              message: 'Invalid query parameters',
              errors:
                validationResult.error.errors?.map(err => ({
                  field: err.path.join('.'),
                  message: err.message,
                })) || [],
            },
            { status: 400 }
          );
        }

        const { contact_id, period } = validationResult.data;

        // Sanitize contact_id
        const sanitizedContactId = textSanitizer.sanitizeString(contact_id);

        // Verify the contact exists and belongs to user
        const { data: contact, error: contactError } = await supabase
          .from('contacts')
          .select(
            'id, user_id, created_at, last_interaction, interaction_count'
          )
          .eq('id', sanitizedContactId)
          .eq('user_id', user.id)
          .single();

        if (contactError || !contact) {
          return NextResponse.json(
            { success: false, message: 'Contact not found' },
            { status: 404 }
          );
        }

        // Calculate date range based on period
        const now = new Date();
        let dateFrom: Date;

        switch (period) {
          case 'day':
            dateFrom = new Date(now.getTime() - 24 * 60 * 60 * 1000);
            break;
          case 'week':
            dateFrom = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            break;
          case 'month':
            dateFrom = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            break;
          case 'year':
            dateFrom = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
            break;
          default:
            dateFrom = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        }

        const dateFromISO = dateFrom.toISOString();

        // Get interaction counts by type
        const { data: interactions, error: interactionsError } = await supabase
          .from('contact_interactions')
          .select('interaction_type, created_at')
          .eq('contact_id', sanitizedContactId)
          .eq('user_id', user.id)
          .gte('created_at', dateFromISO)
          .order('created_at', { ascending: false });

        if (interactionsError) {
          throw new Error(
            `Failed to fetch interactions: ${interactionsError.message}`
          );
        }

        // Get message counts by type
        const { data: messages, error: messagesError } = await supabase
          .from('contact_messages')
          .select('message_type, created_at, is_read')
          .eq('contact_id', sanitizedContactId)
          .eq('user_id', user.id)
          .gte('created_at', dateFromISO)
          .order('created_at', { ascending: false });

        if (messagesError) {
          throw new Error(`Failed to fetch messages: ${messagesError.message}`);
        }

        // Get note counts by type
        const { data: notes, error: notesError } = await supabase
          .from('contact_notes')
          .select('note_type, created_at, is_important')
          .eq('contact_id', sanitizedContactId)
          .eq('user_id', user.id)
          .gte('created_at', dateFromISO)
          .order('created_at', { ascending: false });

        if (notesError) {
          throw new Error(`Failed to fetch notes: ${notesError.message}`);
        }

        // Get reminder counts by type
        const { data: reminders, error: remindersError } = await supabase
          .from('contact_reminders')
          .select('reminder_type, created_at, is_completed')
          .eq('contact_id', sanitizedContactId)
          .eq('user_id', user.id)
          .gte('created_at', dateFromISO)
          .order('created_at', { ascending: false });

        if (remindersError) {
          throw new Error(
            `Failed to fetch reminders: ${remindersError.message}`
          );
        }

        // Calculate summary statistics
        const interactionCounts = (interactions || []).reduce(
          (acc, interaction) => {
            acc[interaction.interaction_type] =
              (acc[interaction.interaction_type] || 0) + 1;
            return acc;
          },
          {} as Record<string, number>
        );

        const messageCounts = (messages || []).reduce(
          (acc, message) => {
            acc[message.message_type] = (acc[message.message_type] || 0) + 1;
            return acc;
          },
          {} as Record<string, number>
        );

        const noteCounts = (notes || []).reduce(
          (acc, note) => {
            acc[note.note_type] = (acc[note.note_type] || 0) + 1;
            return acc;
          },
          {} as Record<string, number>
        );

        const reminderCounts = (reminders || []).reduce(
          (acc, reminder) => {
            acc[reminder.reminder_type] =
              (acc[reminder.reminder_type] || 0) + 1;
            return acc;
          },
          {} as Record<string, number>
        );

        const totalInteractions = (interactions || []).length;
        const totalMessages = (messages || []).length;
        const totalNotes = (notes || []).length;
        const totalReminders = (reminders || []).length;

        const readMessages = (messages || []).filter(m => m.is_read).length;
        const importantNotes = (notes || []).filter(n => n.is_important).length;
        const completedReminders = (reminders || []).filter(
          r => r.is_completed
        ).length;

        // Calculate activity frequency
        const totalActivities =
          totalInteractions + totalMessages + totalNotes + totalReminders;
        const daysInPeriod = Math.ceil(
          (now.getTime() - dateFrom.getTime()) / (24 * 60 * 60 * 1000)
        );
        const activityFrequency =
          daysInPeriod > 0 ? totalActivities / daysInPeriod : 0;

        const summary = {
          period,
          date_from: dateFromISO,
          date_to: now.toISOString(),
          contact_info: {
            id: contact.id,
            created_at: contact.created_at,
            last_interaction: contact.last_interaction,
            total_interaction_count: contact.interaction_count,
          },
          activity_summary: {
            total_activities: totalActivities,
            total_interactions: totalInteractions,
            total_messages: totalMessages,
            total_notes: totalNotes,
            total_reminders: totalReminders,
            activity_frequency: Math.round(activityFrequency * 100) / 100,
          },
          breakdown: {
            interactions: interactionCounts,
            messages: messageCounts,
            notes: noteCounts,
            reminders: reminderCounts,
          },
          metrics: {
            read_messages: readMessages,
            unread_messages: totalMessages - readMessages,
            important_notes: importantNotes,
            completed_reminders: completedReminders,
            pending_reminders: totalReminders - completedReminders,
          },
        };

        return NextResponse.json({
          success: true,
          summary,
        });
      } catch (error) {
        console.error('Error fetching timeline summary:', error);
        return NextResponse.json(
          { success: false, message: 'Failed to fetch timeline summary' },
          { status: 500 }
        );
      }
    },
    crmSecurityConfig
  );
}
