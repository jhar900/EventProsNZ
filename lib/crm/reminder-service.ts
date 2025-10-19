import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

// Validation schemas
const createReminderSchema = z.object({
  contact_id: z.string().uuid('Invalid contact ID'),
  reminder_type: z.enum([
    'call',
    'email',
    'meeting',
    'follow_up',
    'deadline',
    'other',
  ]),
  reminder_date: z.string().datetime('Invalid reminder date'),
  reminder_message: z.string().max(500, 'Reminder message too long').optional(),
});

const updateReminderSchema = z.object({
  is_completed: z.boolean(),
  completed_at: z.string().datetime().optional(),
});

const getRemindersSchema = z.object({
  contact_id: z.string().uuid().optional(),
  reminder_type: z
    .enum(['call', 'email', 'meeting', 'follow_up', 'deadline', 'other'])
    .optional(),
  is_completed: z.coerce.boolean().optional(),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
});

export interface Reminder {
  id: string;
  contact_id: string;
  user_id: string;
  reminder_type:
    | 'call'
    | 'email'
    | 'meeting'
    | 'follow_up'
    | 'deadline'
    | 'other';
  reminder_date: string;
  reminder_message: string | null;
  is_completed: boolean;
  completed_at: string | null;
  created_at: string;
  contact: {
    id: string;
    contact_type: string;
    relationship_status: string;
    contact_user: {
      id: string;
      email: string;
      role: string;
    };
    contact_profile: {
      first_name: string;
      last_name: string;
      avatar_url: string | null;
    };
  };
}

export interface ReminderFilters {
  contact_id?: string;
  reminder_type?: string;
  is_completed?: boolean;
  page?: number;
  limit?: number;
}

export interface ReminderResponse {
  success: boolean;
  reminders?: Reminder[];
  reminder?: Reminder;
  total?: number;
  page?: number;
  limit?: number;
  error?: string;
}

export class ReminderService {
  private supabase;

  constructor(supabaseClient?: any) {
    this.supabase = supabaseClient || createClient();
  }

  // Static method to create service with dependency injection
  static create(supabaseClient?: any): ReminderService {
    return new ReminderService(supabaseClient);
  }

  async getReminders(filters: ReminderFilters = {}): Promise<ReminderResponse> {
    try {
      // Validate filters
      const validationResult = getRemindersSchema.safeParse(filters);
      if (!validationResult.success) {
        return {
          success: false,
          error: 'Invalid filter parameters',
        };
      }

      const { contact_id, reminder_type, is_completed, page, limit } =
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

      // Build query
      let query = this.supabase
        .from('contact_reminders')
        .select('*')
        .eq('user_id', user.id);

      if (contact_id) {
        query = query.eq('contact_id', contact_id);
      }

      if (reminder_type) {
        query = query.eq('reminder_type', reminder_type);
      }

      if (is_completed !== undefined) {
        query = query.eq('is_completed', is_completed);
      }

      // Get total count
      const { count } = await this.supabase
        .from('contact_reminders')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);

      // Get reminders with pagination
      const { data: reminders, error } = await query
        .order('reminder_date', { ascending: true })
        .range(offset, offset + limit - 1);

      if (error) {
        throw new Error(`Failed to fetch reminders: ${error.message}`);
      }

      return {
        success: true,
        reminders: reminders || [],
        total: count || 0,
        page,
        limit,
      };
    } catch (error) {
      console.error('Error fetching reminders:', error);
      return {
        success: false,
        error: 'Failed to fetch reminders',
      };
    }
  }

  async createReminder(reminderData: any): Promise<ReminderResponse> {
    try {
      // Validate reminder data
      const validationResult = createReminderSchema.safeParse(reminderData);
      if (!validationResult.success) {
        return {
          success: false,
          error: 'Invalid reminder data',
        };
      }

      const { contact_id, reminder_type, reminder_date, reminder_message } =
        validationResult.data;

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

      // Create reminder
      const { data: reminder, error } = await this.supabase
        .from('contact_reminders')
        .insert({
          contact_id,
          user_id: user.id,
          reminder_type,
          reminder_date,
          reminder_message,
        })
        .select('*')
        .single();

      if (error) {
        throw new Error(`Failed to create reminder: ${error.message}`);
      }

      return {
        success: true,
        reminder,
      };
    } catch (error) {
      console.error('Error creating reminder:', error);
      return {
        success: false,
        error: 'Failed to create reminder',
      };
    }
  }

  async updateReminder(
    reminderId: string,
    updates: any
  ): Promise<ReminderResponse> {
    try {
      // Validate update data
      const validationResult = updateReminderSchema.safeParse(updates);
      if (!validationResult.success) {
        return {
          success: false,
          error: 'Invalid update data',
        };
      }

      const { is_completed, completed_at } = validationResult.data;

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

      // Update reminder
      const { data: reminder, error } = await this.supabase
        .from('contact_reminders')
        .update({
          is_completed,
          completed_at:
            completed_at || (is_completed ? new Date().toISOString() : null),
        })
        .eq('id', reminderId)
        .eq('user_id', user.id)
        .select('*')
        .single();

      if (error) {
        throw new Error(`Failed to update reminder: ${error.message}`);
      }

      return {
        success: true,
        reminder,
      };
    } catch (error) {
      console.error('Error updating reminder:', error);
      return {
        success: false,
        error: 'Failed to update reminder',
      };
    }
  }

  async deleteReminder(reminderId: string): Promise<ReminderResponse> {
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

      // Delete reminder
      const { error } = await this.supabase
        .from('contact_reminders')
        .delete()
        .eq('id', reminderId)
        .eq('user_id', user.id);

      if (error) {
        throw new Error(`Failed to delete reminder: ${error.message}`);
      }

      return {
        success: true,
      };
    } catch (error) {
      console.error('Error deleting reminder:', error);
      return {
        success: false,
        error: 'Failed to delete reminder',
      };
    }
  }

  async getUpcomingReminders(days: number = 7): Promise<ReminderResponse> {
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

      const now = new Date();
      const futureDate = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);

      // Get upcoming reminders
      const { data: reminders, error } = await this.supabase
        .from('contact_reminders')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_completed', false)
        .gte('reminder_date', now.toISOString())
        .lte('reminder_date', futureDate.toISOString())
        .order('reminder_date', { ascending: true });

      if (error) {
        throw new Error(`Failed to fetch upcoming reminders: ${error.message}`);
      }

      return {
        success: true,
        reminders: reminders || [],
      };
    } catch (error) {
      console.error('Error fetching upcoming reminders:', error);
      return {
        success: false,
        error: 'Failed to fetch upcoming reminders',
      };
    }
  }

  async getOverdueReminders(): Promise<ReminderResponse> {
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

      const now = new Date();

      // Get overdue reminders
      const { data: reminders, error } = await this.supabase
        .from('contact_reminders')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_completed', false)
        .lt('reminder_date', now.toISOString())
        .order('reminder_date', { ascending: true });

      if (error) {
        throw new Error(`Failed to fetch overdue reminders: ${error.message}`);
      }

      return {
        success: true,
        reminders: reminders || [],
      };
    } catch (error) {
      console.error('Error fetching overdue reminders:', error);
      return {
        success: false,
        error: 'Failed to fetch overdue reminders',
      };
    }
  }

  async getRemindersByContact(contactId: string): Promise<ReminderResponse> {
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

      // Get all reminders for this contact
      const { data: reminders, error } = await this.supabase
        .from('contact_reminders')
        .select('*')
        .eq('contact_id', contactId)
        .eq('user_id', user.id)
        .order('reminder_date', { ascending: true });

      if (error) {
        throw new Error(`Failed to fetch reminders: ${error.message}`);
      }

      return {
        success: true,
        reminders: reminders || [],
      };
    } catch (error) {
      console.error('Error fetching reminders by contact:', error);
      return {
        success: false,
        error: 'Failed to fetch reminders',
      };
    }
  }
}
