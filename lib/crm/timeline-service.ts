import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

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

export interface TimelineItem {
  id: string;
  type: 'interaction' | 'message' | 'note' | 'reminder';
  created_at: string;
  // Interaction fields
  interaction_type?: string;
  data?: any;
  notes?: string;
  // Message fields
  message_type?: string;
  content?: string;
  is_read?: boolean;
  read_at?: string | null;
  // Note fields
  note_type?: string;
  tags?: string[];
  is_important?: boolean;
  // Reminder fields
  reminder_type?: string;
  reminder_date?: string;
  message?: string;
  is_completed?: boolean;
  completed_at?: string | null;
}

export interface TimelineSummary {
  total_activities: number;
  interactions_count: number;
  messages_count: number;
  notes_count: number;
  reminders_count: number;
  last_activity: string | null;
  activity_by_type: { [key: string]: number };
  activity_by_period: { [key: string]: number };
}

export interface TimelineResponse {
  success: boolean;
  timeline?: TimelineItem[];
  summary?: TimelineSummary;
  total?: number;
  page?: number;
  limit?: number;
  error?: string;
}

export class TimelineService {
  private supabase;

  constructor(supabaseClient?: any) {
    this.supabase = supabaseClient || createClient();
  }

  // Static method to create service with dependency injection
  static create(supabaseClient?: any): TimelineService {
    return new TimelineService(supabaseClient);
  }

  async getTimeline(filters: any): Promise<TimelineResponse> {
    try {
      // Validate filters
      const validationResult = getTimelineSchema.safeParse(filters);
      if (!validationResult.success) {
        return {
          success: false,
          error: 'Invalid timeline parameters',
        };
      }

      const { contact_id, date_from, date_to, page, limit } =
        validationResult.data;
      const offset = (page - 1) * limit;

      // Get current user
      const {
        data: { user },
        error: authError,
      } = await this.supabase.auth.getUser();

      if (authError || !user) {
        return {
          success: false,
          error: 'Unauthorized',
        };
      }

      // Verify the contact exists and belongs to user
      const { data: contact, error: contactError } = await this.supabase
        .from('contacts')
        .select('id, user_id')
        .eq('id', contact_id)
        .eq('user_id', user.id)
        .single();

      if (contactError || !contact) {
        return {
          success: false,
          error: 'Contact not found',
        };
      }

      // Get timeline data from multiple sources
      const timelineData: TimelineItem[] = [];

      // Get interactions
      let interactionsQuery = this.supabase
        .from('contact_interactions')
        .select('*')
        .eq('contact_id', contact_id)
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
      let messagesQuery = this.supabase
        .from('contact_messages')
        .select('*')
        .eq('contact_id', contact_id)
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
      let notesQuery = this.supabase
        .from('contact_notes')
        .select('*')
        .eq('contact_id', contact_id)
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
      let remindersQuery = this.supabase
        .from('contact_reminders')
        .select('*')
        .eq('contact_id', contact_id)
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
        throw new Error(`Failed to fetch reminders: ${remindersError.message}`);
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

      return {
        success: true,
        timeline: paginatedData,
        total,
        page,
        limit,
      };
    } catch (error) {
      console.error('Error fetching timeline:', error);
      return {
        success: false,
        error: 'Failed to fetch timeline',
      };
    }
  }

  async getTimelineSummary(filters: any): Promise<TimelineResponse> {
    try {
      // Validate filters
      const validationResult = getTimelineSummarySchema.safeParse(filters);
      if (!validationResult.success) {
        return {
          success: false,
          error: 'Invalid timeline summary parameters',
        };
      }

      const { contact_id, period } = validationResult.data;

      // Get current user
      const {
        data: { user },
        error: authError,
      } = await this.supabase.auth.getUser();

      if (authError || !user) {
        return {
          success: false,
          error: 'Unauthorized',
        };
      }

      // Verify the contact exists and belongs to user
      const { data: contact, error: contactError } = await this.supabase
        .from('contacts')
        .select('id, user_id')
        .eq('id', contact_id)
        .eq('user_id', user.id)
        .single();

      if (contactError || !contact) {
        return {
          success: false,
          error: 'Contact not found',
        };
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

      // Get all timeline data for the period
      const { data: timelineData, error: timelineError } =
        await this.getTimeline({
          contact_id,
          date_from: dateFrom.toISOString(),
          date_to: now.toISOString(),
          page: 1,
          limit: 1000, // Get all data for summary
        });

      if (timelineError || !timelineData?.success) {
        throw new Error('Failed to fetch timeline data for summary');
      }

      const timeline = timelineData.timeline || [];

      // Calculate summary statistics
      const summary: TimelineSummary = {
        total_activities: timeline.length,
        interactions_count: timeline.filter(item => item.type === 'interaction')
          .length,
        messages_count: timeline.filter(item => item.type === 'message').length,
        notes_count: timeline.filter(item => item.type === 'note').length,
        reminders_count: timeline.filter(item => item.type === 'reminder')
          .length,
        last_activity: timeline.length > 0 ? timeline[0].created_at : null,
        activity_by_type: {},
        activity_by_period: {},
      };

      // Calculate activity by type
      timeline.forEach(item => {
        summary.activity_by_type[item.type] =
          (summary.activity_by_type[item.type] || 0) + 1;
      });

      // Calculate activity by period (daily for the last 30 days)
      const activityByDay: { [key: string]: number } = {};
      timeline.forEach(item => {
        const date = new Date(item.created_at).toISOString().split('T')[0];
        activityByDay[date] = (activityByDay[date] || 0) + 1;
      });

      // Fill in missing days with 0 activity
      for (let i = 0; i < 30; i++) {
        const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000)
          .toISOString()
          .split('T')[0];
        if (!activityByDay[date]) {
          activityByDay[date] = 0;
        }
      }

      summary.activity_by_period = activityByDay;

      return {
        success: true,
        summary,
      };
    } catch (error) {
      console.error('Error fetching timeline summary:', error);
      return {
        success: false,
        error: 'Failed to fetch timeline summary',
      };
    }
  }

  async getContactActivityStats(
    contactId: string
  ): Promise<{ success: boolean; stats?: any; error?: string }> {
    try {
      // Get current user
      const {
        data: { user },
        error: authError,
      } = await this.supabase.auth.getUser();

      if (authError || !user) {
        return {
          success: false,
          error: 'Unauthorized',
        };
      }

      // Get activity statistics for the contact
      const [interactionsResult, messagesResult, notesResult, remindersResult] =
        await Promise.all([
          this.supabase
            .from('contact_interactions')
            .select('interaction_type, created_at')
            .eq('contact_id', contactId)
            .eq('user_id', user.id),
          this.supabase
            .from('contact_messages')
            .select('message_type, created_at, is_read')
            .eq('contact_id', contactId)
            .eq('user_id', user.id),
          this.supabase
            .from('contact_notes')
            .select('note_type, created_at, is_important')
            .eq('contact_id', contactId)
            .eq('user_id', user.id),
          this.supabase
            .from('contact_reminders')
            .select('reminder_type, created_at, is_completed')
            .eq('contact_id', contactId)
            .eq('user_id', user.id),
        ]);

      const interactions = interactionsResult.data || [];
      const messages = messagesResult.data || [];
      const notes = notesResult.data || [];
      const reminders = remindersResult.data || [];

      // Calculate statistics
      const stats = {
        total_activities:
          interactions.length +
          messages.length +
          notes.length +
          reminders.length,
        interactions: {
          total: interactions.length,
          by_type: {} as { [key: string]: number },
        },
        messages: {
          total: messages.length,
          unread: messages.filter(m => !m.is_read).length,
          by_type: {} as { [key: string]: number },
        },
        notes: {
          total: notes.length,
          important: notes.filter(n => n.is_important).length,
          by_type: {} as { [key: string]: number },
        },
        reminders: {
          total: reminders.length,
          completed: reminders.filter(r => r.is_completed).length,
          pending: reminders.filter(r => !r.is_completed).length,
          by_type: {} as { [key: string]: number },
        },
        recent_activity: [
          ...interactions.map(i => ({
            type: 'interaction',
            created_at: i.created_at,
          })),
          ...messages.map(m => ({ type: 'message', created_at: m.created_at })),
          ...notes.map(n => ({ type: 'note', created_at: n.created_at })),
          ...reminders.map(r => ({
            type: 'reminder',
            created_at: r.created_at,
          })),
        ]
          .sort(
            (a, b) =>
              new Date(b.created_at).getTime() -
              new Date(a.created_at).getTime()
          )
          .slice(0, 10),
      };

      // Calculate by type statistics
      interactions.forEach(interaction => {
        stats.interactions.by_type[interaction.interaction_type] =
          (stats.interactions.by_type[interaction.interaction_type] || 0) + 1;
      });

      messages.forEach(message => {
        stats.messages.by_type[message.message_type] =
          (stats.messages.by_type[message.message_type] || 0) + 1;
      });

      notes.forEach(note => {
        stats.notes.by_type[note.note_type] =
          (stats.notes.by_type[note.note_type] || 0) + 1;
      });

      reminders.forEach(reminder => {
        stats.reminders.by_type[reminder.reminder_type] =
          (stats.reminders.by_type[reminder.reminder_type] || 0) + 1;
      });

      return {
        success: true,
        stats,
      };
    } catch (error) {
      console.error('Error getting contact activity stats:', error);
      return {
        success: false,
        error: 'Failed to get contact activity stats',
      };
    }
  }
}
