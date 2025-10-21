import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';
import {
  withSecurity,
  crmSecurityConfig,
} from '@/lib/security/security-middleware';
import { textSanitizer } from '@/lib/security/input-sanitization';
import { crmDataCache } from '@/lib/cache/crm-cache';
import { queryOptimizer } from '@/lib/database/query-optimization';

// Validation schemas
const getTimelineSchema = z.object({
  contact_id: z.string().uuid('Contact ID is required'),
  date_from: z.string().datetime().optional(),
  date_to: z.string().datetime().optional(),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
});

const getTimelineSummarySchema = z.object({
  contact_id: z.string().uuid('Contact ID is required'),
  period: z.enum(['day', 'week', 'month', 'year']).default('month'),
});

// GET /api/crm/timeline - Get activity timeline for a contact
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

        const validationResult = getTimelineSchema.safeParse(queryParams);
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

        const { contact_id, date_from, date_to, page, limit } =
          validationResult.data;
        const offset = (page - 1) * limit;

        // Sanitize contact_id
        const sanitizedContactId = textSanitizer.sanitizeString(contact_id);

        // Verify the contact exists and belongs to user
        const { data: contact, error: contactError } = await supabase
          .from('contacts')
          .select('id, user_id')
          .eq('id', sanitizedContactId)
          .eq('user_id', user.id)
          .single();

        if (contactError || !contact) {
          return NextResponse.json(
            { success: false, message: 'Contact not found' },
            { status: 404 }
          );
        }

        // Get timeline data from multiple sources
        const timelineData = [];

        // Get interactions
        let interactionsQuery = supabase
          .from('contact_interactions')
          .select('*')
          .eq('contact_id', sanitizedContactId)
          .eq('user_id', user.id);

        if (date_from) {
          interactionsQuery = interactionsQuery.gte('created_at', date_from);
        }
        if (date_to) {
          interactionsQuery = interactionsQuery.lte('created_at', date_to);
        }

        const { data: interactions, error: interactionsError } =
          await interactionsQuery.order('created_at', { ascending: false });

        if (interactionsError) {
          throw new Error(
            `Failed to fetch interactions: ${interactionsError.message}`
          );
        }

        if (interactions) {
          interactions.forEach(interaction => {
            timelineData.push({
              id: interaction.id,
              type: 'interaction',
              interaction_type: interaction.interaction_type,
              data: interaction.interaction_data,
              notes: interaction.interaction_notes,
              created_at: interaction.created_at,
            });
          });
        }

        // Get messages
        let messagesQuery = supabase
          .from('contact_messages')
          .select('*')
          .eq('contact_id', sanitizedContactId)
          .eq('user_id', user.id);

        if (date_from) {
          messagesQuery = messagesQuery.gte('created_at', date_from);
        }
        if (date_to) {
          messagesQuery = messagesQuery.lte('created_at', date_to);
        }

        const { data: messages, error: messagesError } =
          await messagesQuery.order('created_at', { ascending: false });

        if (messagesError) {
          throw new Error(`Failed to fetch messages: ${messagesError.message}`);
        }

        if (messages) {
          messages.forEach(message => {
            timelineData.push({
              id: message.id,
              type: 'message',
              message_type: message.message_type,
              content: message.message_content,
              data: message.message_data,
              is_read: message.is_read,
              read_at: message.read_at,
              created_at: message.created_at,
            });
          });
        }

        // Get notes
        let notesQuery = supabase
          .from('contact_notes')
          .select('*')
          .eq('contact_id', sanitizedContactId)
          .eq('user_id', user.id);

        if (date_from) {
          notesQuery = notesQuery.gte('created_at', date_from);
        }
        if (date_to) {
          notesQuery = notesQuery.lte('created_at', date_to);
        }

        const { data: notes, error: notesError } = await notesQuery.order(
          'created_at',
          { ascending: false }
        );

        if (notesError) {
          throw new Error(`Failed to fetch notes: ${notesError.message}`);
        }

        if (notes) {
          notes.forEach(note => {
            timelineData.push({
              id: note.id,
              type: 'note',
              note_type: note.note_type,
              content: note.note_content,
              tags: note.tags,
              is_important: note.is_important,
              created_at: note.created_at,
            });
          });
        }

        // Get reminders
        let remindersQuery = supabase
          .from('contact_reminders')
          .select('*')
          .eq('contact_id', sanitizedContactId)
          .eq('user_id', user.id);

        if (date_from) {
          remindersQuery = remindersQuery.gte('created_at', date_from);
        }
        if (date_to) {
          remindersQuery = remindersQuery.lte('created_at', date_to);
        }

        const { data: reminders, error: remindersError } =
          await remindersQuery.order('created_at', { ascending: false });

        if (remindersError) {
          throw new Error(
            `Failed to fetch reminders: ${remindersError.message}`
          );
        }

        if (reminders) {
          reminders.forEach(reminder => {
            timelineData.push({
              id: reminder.id,
              type: 'reminder',
              reminder_type: reminder.reminder_type,
              reminder_date: reminder.reminder_date,
              message: reminder.reminder_message,
              is_completed: reminder.is_completed,
              completed_at: reminder.completed_at,
              created_at: reminder.created_at,
            });
          });
        }

        // Sort timeline by created_at descending
        timelineData.sort(
          (a, b) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );

        // Apply pagination
        const total = timelineData.length;
        const paginatedData = timelineData.slice(offset, offset + limit);

        return NextResponse.json({
          success: true,
          timeline: paginatedData,
          total,
          page,
          limit,
        });
      } catch (error) {
        console.error('Error fetching timeline:', error);
        return NextResponse.json(
          { success: false, message: 'Failed to fetch timeline' },
          { status: 500 }
        );
      }
    },
    crmSecurityConfig
  );
}
