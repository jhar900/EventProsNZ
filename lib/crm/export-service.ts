import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

// Validation schemas
const exportContactsSchema = z.object({
  format: z.enum(['csv', 'json', 'xlsx']).default('csv'),
  contact_type: z
    .enum(['contractor', 'event_manager', 'client', 'vendor', 'other'])
    .optional(),
  relationship_status: z
    .enum(['active', 'inactive', 'blocked', 'archived'])
    .optional(),
  date_from: z.string().datetime().optional(),
  date_to: z.string().datetime().optional(),
  include_notes: z.boolean().default(false),
  include_messages: z.boolean().default(false),
  include_reminders: z.boolean().default(false),
});

const scheduleExportSchema = z.object({
  format: z.enum(['csv', 'json', 'xlsx']),
  contact_type: z
    .enum(['contractor', 'event_manager', 'client', 'vendor', 'other'])
    .optional(),
  relationship_status: z
    .enum(['active', 'inactive', 'blocked', 'archived'])
    .optional(),
  date_from: z.string().datetime().optional(),
  date_to: z.string().datetime().optional(),
  include_notes: z.boolean().default(false),
  include_messages: z.boolean().default(false),
  include_reminders: z.boolean().default(false),
  email: z.string().email().optional(),
  schedule: z.enum(['once', 'daily', 'weekly', 'monthly']).default('once'),
});

export interface ExportFilters {
  format: 'csv' | 'json' | 'xlsx';
  contact_type?: string;
  relationship_status?: string;
  date_from?: string;
  date_to?: string;
  include_notes?: boolean;
  include_messages?: boolean;
  include_reminders?: boolean;
}

export interface ExportResponse {
  success: boolean;
  data?: any;
  filename?: string;
  mimeType?: string;
  error?: string;
}

export interface ExportJob {
  id: string;
  user_id: string;
  format: string;
  filters: any;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  created_at: string;
  completed_at?: string;
  download_url?: string;
}

export class ExportService {
  private supabase;

  constructor(supabaseClient?: any) {
    this.supabase = supabaseClient || createClient();
  }

  // Static method to create service with dependency injection
  static create(supabaseClient?: any): ExportService {
    return new ExportService(supabaseClient);
  }

  async exportContacts(filters: ExportFilters): Promise<ExportResponse> {
    try {
      // Validate filters
      const validationResult = exportContactsSchema.safeParse(filters);
      if (!validationResult.success) {
        return {
          success: false,
          error: 'Invalid export parameters',
        };
      }

      const {
        format,
        contact_type,
        relationship_status,
        date_from,
        date_to,
        include_notes,
        include_messages,
        include_reminders,
      } = validationResult.data;

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
        .from('contacts')
        .select(
          `
          *,
          contact_user:users!contacts_contact_user_id_fkey(
            id,
            email,
            role,
            is_verified,
            last_login,
            created_at
          ),
          contact_profile:profiles!contacts_contact_user_id_fkey(
            first_name,
            last_name,
            phone,
            address,
            bio
          )
        `
        )
        .eq('user_id', user.id);

      if (contact_type) {
        query = query.eq('contact_type', contact_type);
      }

      if (relationship_status) {
        query = query.eq('relationship_status', relationship_status);
      }

      if (date_from) {
        query = query.gte('created_at', date_from);
      }

      if (date_to) {
        query = query.lte('created_at', date_to);
      }

      // Get all contacts for export
      const { data: contacts, error } = await query.order('created_at', {
        ascending: false,
      });

      if (error) {
        throw new Error(
          `Failed to fetch contacts for export: ${error.message}`
        );
      }

      if (!contacts || contacts.length === 0) {
        return {
          success: false,
          error: 'No contacts found to export',
        };
      }

      // Get additional data if requested
      let notes: any[] = [];
      let messages: any[] = [];
      let reminders: any[] = [];

      if (include_notes) {
        const { data: notesData } = await this.supabase
          .from('contact_notes')
          .select('*')
          .in(
            'contact_id',
            contacts.map(c => c.id)
          )
          .eq('user_id', user.id);
        notes = notesData || [];
      }

      if (include_messages) {
        const { data: messagesData } = await this.supabase
          .from('contact_messages')
          .select('*')
          .in(
            'contact_id',
            contacts.map(c => c.id)
          )
          .eq('user_id', user.id);
        messages = messagesData || [];
      }

      if (include_reminders) {
        const { data: remindersData } = await this.supabase
          .from('contact_reminders')
          .select('*')
          .in(
            'contact_id',
            contacts.map(c => c.id)
          )
          .eq('user_id', user.id);
        reminders = remindersData || [];
      }

      // Format data for export
      const exportData = contacts.map(contact => {
        const contactNotes = notes.filter(
          note => note.contact_id === contact.id
        );
        const contactMessages = messages.filter(
          message => message.contact_id === contact.id
        );
        const contactReminders = reminders.filter(
          reminder => reminder.contact_id === contact.id
        );

        return {
          id: contact.id,
          contact_type: contact.contact_type,
          relationship_status: contact.relationship_status,
          last_interaction: contact.last_interaction,
          interaction_count: contact.interaction_count,
          created_at: contact.created_at,
          updated_at: contact.updated_at,
          contact_email: contact.contact_user?.email || '',
          contact_role: contact.contact_user?.role || '',
          contact_verified: contact.contact_user?.is_verified || false,
          contact_first_name: contact.contact_profile?.first_name || '',
          contact_last_name: contact.contact_profile?.last_name || '',
          contact_phone: contact.contact_profile?.phone || '',
          contact_address: contact.contact_profile?.address || '',
          contact_bio: contact.contact_profile?.bio || '',
          notes_count: contactNotes.length,
          messages_count: contactMessages.length,
          reminders_count: contactReminders.length,
          notes: include_notes
            ? contactNotes.map(note => ({
                content: note.note_content,
                type: note.note_type,
                tags: note.tags,
                is_important: note.is_important,
                created_at: note.created_at,
              }))
            : [],
          messages: include_messages
            ? contactMessages.map(message => ({
                type: message.message_type,
                content: message.message_content,
                is_read: message.is_read,
                created_at: message.created_at,
              }))
            : [],
          reminders: include_reminders
            ? contactReminders.map(reminder => ({
                type: reminder.reminder_type,
                date: reminder.reminder_date,
                message: reminder.reminder_message,
                is_completed: reminder.is_completed,
                created_at: reminder.created_at,
              }))
            : [],
        };
      });

      // Generate filename
      const timestamp = new Date().toISOString().split('T')[0];
      const filename = `contacts-export-${timestamp}.${format}`;

      if (format === 'csv') {
        const csvContent = this.convertToCSV(exportData);
        return {
          success: true,
          data: csvContent,
          filename,
          mimeType: 'text/csv',
        };
      } else if (format === 'json') {
        return {
          success: true,
          data: JSON.stringify(
            {
              contacts: exportData,
              exported_at: new Date().toISOString(),
              total_contacts: exportData.length,
              filters,
            },
            null,
            2
          ),
          filename,
          mimeType: 'application/json',
        };
      } else if (format === 'xlsx') {
        // For XLSX, we'll return the data and let the client handle the conversion
        return {
          success: true,
          data: exportData,
          filename,
          mimeType:
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        };
      }

      return {
        success: false,
        error: 'Unsupported export format',
      };
    } catch (error) {
      console.error('Error exporting contacts:', error);
      return {
        success: false,
        error: 'Failed to export contacts',
      };
    }
  }

  async scheduleExport(
    exportData: any
  ): Promise<{ success: boolean; job?: ExportJob; error?: string }> {
    try {
      // Validate export data
      const validationResult = scheduleExportSchema.safeParse(exportData);
      if (!validationResult.success) {
        return {
          success: false,
          error: 'Invalid export parameters',
        };
      }

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

      // Create export job
      const { data: job, error } = await this.supabase
        .from('export_jobs')
        .insert({
          user_id: user.id,
          format: exportData.format,
          filters: exportData,
          status: 'pending',
          schedule: exportData.schedule,
          email: exportData.email,
        })
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to schedule export: ${error.message}`);
      }

      return {
        success: true,
        job,
      };
    } catch (error) {
      console.error('Error scheduling export:', error);
      return {
        success: false,
        error: 'Failed to schedule export',
      };
    }
  }

  async getExportJobs(): Promise<{
    success: boolean;
    jobs?: ExportJob[];
    error?: string;
  }> {
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

      // Get export jobs
      const { data: jobs, error } = await this.supabase
        .from('export_jobs')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        throw new Error(`Failed to fetch export jobs: ${error.message}`);
      }

      return {
        success: true,
        jobs: jobs || [],
      };
    } catch (error) {
      console.error('Error fetching export jobs:', error);
      return {
        success: false,
        error: 'Failed to fetch export jobs',
      };
    }
  }

  private convertToCSV(data: any[]): string {
    if (data.length === 0) return '';

    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(','),
      ...data.map(row =>
        headers
          .map(header => {
            const value = row[header as keyof typeof row];
            // Handle nested objects and arrays
            if (typeof value === 'object' && value !== null) {
              return `"${JSON.stringify(value).replace(/"/g, '""')}"`;
            }
            // Escape CSV values
            if (
              typeof value === 'string' &&
              (value.includes(',') ||
                value.includes('"') ||
                value.includes('\n'))
            ) {
              return `"${value.replace(/"/g, '""')}"`;
            }
            return value;
          })
          .join(',')
      ),
    ].join('\n');

    return csvContent;
  }

  async getExportStats(): Promise<{
    success: boolean;
    stats?: any;
    error?: string;
  }> {
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

      // Get export statistics
      const { data: jobs, error } = await this.supabase
        .from('export_jobs')
        .select('status, format, created_at')
        .eq('user_id', user.id);

      if (error) {
        throw new Error(`Failed to fetch export stats: ${error.message}`);
      }

      // Calculate statistics
      const stats = {
        total: jobs?.length || 0,
        completed: jobs?.filter(job => job.status === 'completed').length || 0,
        failed: jobs?.filter(job => job.status === 'failed').length || 0,
        pending: jobs?.filter(job => job.status === 'pending').length || 0,
        byFormat: {} as { [key: string]: number },
        recent: jobs?.slice(0, 5) || [],
      };

      jobs?.forEach(job => {
        stats.byFormat[job.format] = (stats.byFormat[job.format] || 0) + 1;
      });

      return {
        success: true,
        stats,
      };
    } catch (error) {
      console.error('Error getting export stats:', error);
      return {
        success: false,
        error: 'Failed to get export stats',
      };
    }
  }
}
