import { createClient } from '@/lib/supabase/server';
import { ContactService } from './contact-service';
import { MessageService } from './message-service';
import { NoteService } from './note-service';
import { ReminderService } from './reminder-service';
import { SearchService } from './search-service';
import { ExportService } from './export-service';
import { TimelineService } from './timeline-service';
import { crmCache, CacheKeys, CacheInvalidator } from './cache-service';

export interface CRMStats {
  total_contacts: number;
  active_contacts: number;
  total_messages: number;
  unread_messages: number;
  total_notes: number;
  important_notes: number;
  total_reminders: number;
  pending_reminders: number;
  overdue_reminders: number;
  recent_activity: any[];
}

export interface CRMResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  cached?: boolean;
}

export class CRMService {
  private supabase;
  private contactService: ContactService;
  private messageService: MessageService;
  private noteService: NoteService;
  private reminderService: ReminderService;
  private searchService: SearchService;
  private exportService: ExportService;
  private timelineService: TimelineService;

  constructor(supabaseClient?: any) {
    this.supabase = supabaseClient || createClient();
    this.contactService = ContactService.create(supabaseClient);
    this.messageService = MessageService.create(supabaseClient);
    this.noteService = NoteService.create(supabaseClient);
    this.reminderService = ReminderService.create(supabaseClient);
    this.searchService = SearchService.create(supabaseClient);
    this.exportService = ExportService.create(supabaseClient);
    this.timelineService = TimelineService.create(supabaseClient);
  }

  // Static method to create service with dependency injection
  static create(supabaseClient?: any): CRMService {
    return new CRMService(supabaseClient);
  }

  // Contact management
  async getContacts(filters: any = {}): Promise<CRMResponse> {
    try {
      const {
        data: { user },
        error: authError,
      } = await this.supabase.auth.getUser();
      if (authError || !user) {
        return { success: false, error: 'Unauthorized' };
      }

      const cacheKey = CacheKeys.contacts(user.id, filters);
      const cached = crmCache.get(cacheKey);
      if (cached) {
        return { success: true, data: cached, cached: true };
      }

      const result = await this.contactService.getContacts(user.id, filters);
      if (result) {
        crmCache.set(cacheKey, result, 5 * 60 * 1000); // 5 minutes
        return { success: true, data: result };
      }
      return { success: false, error: 'Failed to get contacts' };
    } catch (error) {
      console.error('Error getting contacts:', error);
      return { success: false, error: 'Failed to get contacts' };
    }
  }

  async createContact(contactData: any): Promise<CRMResponse> {
    try {
      const {
        data: { user },
        error: authError,
      } = await this.supabase.auth.getUser();
      if (authError || !user) {
        return { success: false, error: 'Unauthorized' };
      }

      const result = await this.contactService.createContact(
        user.id,
        contactData
      );
      if (result) {
        CacheInvalidator.invalidateUser(user.id);
        return { success: true, data: result };
      }
      return { success: false, error: 'Failed to create contact' };
    } catch (error) {
      console.error('Error creating contact:', error);
      return { success: false, error: 'Failed to create contact' };
    }
  }

  async updateContact(contactId: string, updates: any): Promise<CRMResponse> {
    try {
      const {
        data: { user },
        error: authError,
      } = await this.supabase.auth.getUser();
      if (authError || !user) {
        return { success: false, error: 'Unauthorized' };
      }

      const result = await this.contactService.updateContact(
        contactId,
        user.id,
        updates
      );
      if (result) {
        CacheInvalidator.invalidateContact(user.id, contactId);
        return { success: true, data: result };
      }
      return { success: false, error: 'Failed to update contact' };
    } catch (error) {
      console.error('Error updating contact:', error);
      return { success: false, error: 'Failed to update contact' };
    }
  }

  async deleteContact(contactId: string): Promise<CRMResponse> {
    try {
      const {
        data: { user },
        error: authError,
      } = await this.supabase.auth.getUser();
      if (authError || !user) {
        return { success: false, error: 'Unauthorized' };
      }

      await this.contactService.deleteContact(contactId, user.id);
      CacheInvalidator.invalidateContact(user.id, contactId);
      return { success: true };
    } catch (error) {
      console.error('Error deleting contact:', error);
      return { success: false, error: 'Failed to delete contact' };
    }
  }

  // Message management
  async getMessages(filters: any = {}): Promise<CRMResponse> {
    try {
      const {
        data: { user },
        error: authError,
      } = await this.supabase.auth.getUser();
      if (authError || !user) {
        return { success: false, error: 'Unauthorized' };
      }

      const cacheKey = CacheKeys.messages(user.id, filters.contact_id, filters);
      const cached = crmCache.get(cacheKey);
      if (cached) {
        return { success: true, data: cached, cached: true };
      }

      const result = await this.messageService.getMessages(filters);
      if (result.success) {
        crmCache.set(cacheKey, result, 2 * 60 * 1000); // 2 minutes
        return result;
      }
      return { success: false, error: 'Failed to get messages' };
    } catch (error) {
      console.error('Error getting messages:', error);
      return { success: false, error: 'Failed to get messages' };
    }
  }

  async createMessage(messageData: any): Promise<CRMResponse> {
    try {
      const {
        data: { user },
        error: authError,
      } = await this.supabase.auth.getUser();
      if (authError || !user) {
        return { success: false, error: 'Unauthorized' };
      }

      const result = await this.messageService.createMessage(messageData);
      if (result.success) {
        CacheInvalidator.invalidateContact(user.id, messageData.contact_id);
        return result;
      }
      return { success: false, error: 'Failed to create message' };
    } catch (error) {
      console.error('Error creating message:', error);
      return { success: false, error: 'Failed to create message' };
    }
  }

  // Notes management
  async getNotes(filters: any = {}): Promise<CRMResponse> {
    try {
      const {
        data: { user },
        error: authError,
      } = await this.supabase.auth.getUser();
      if (authError || !user) {
        return { success: false, error: 'Unauthorized' };
      }

      const cacheKey = CacheKeys.notes(user.id, filters.contact_id, filters);
      const cached = crmCache.get(cacheKey);
      if (cached) {
        return { success: true, data: cached, cached: true };
      }

      const result = await this.noteService.getNotes(filters);
      if (result.success) {
        crmCache.set(cacheKey, result, 5 * 60 * 1000); // 5 minutes
        return result;
      }
      return { success: false, error: 'Failed to get notes' };
    } catch (error) {
      console.error('Error getting notes:', error);
      return { success: false, error: 'Failed to get notes' };
    }
  }

  async createNote(noteData: any): Promise<CRMResponse> {
    try {
      const {
        data: { user },
        error: authError,
      } = await this.supabase.auth.getUser();
      if (authError || !user) {
        return { success: false, error: 'Unauthorized' };
      }

      const result = await this.noteService.createNote(noteData);
      if (result.success) {
        CacheInvalidator.invalidateContact(user.id, noteData.contact_id);
        return result;
      }
      return { success: false, error: 'Failed to create note' };
    } catch (error) {
      console.error('Error creating note:', error);
      return { success: false, error: 'Failed to create note' };
    }
  }

  // Reminders management
  async getReminders(filters: any = {}): Promise<CRMResponse> {
    try {
      const {
        data: { user },
        error: authError,
      } = await this.supabase.auth.getUser();
      if (authError || !user) {
        return { success: false, error: 'Unauthorized' };
      }

      const cacheKey = CacheKeys.reminders(
        user.id,
        filters.contact_id,
        filters
      );
      const cached = crmCache.get(cacheKey);
      if (cached) {
        return { success: true, data: cached, cached: true };
      }

      const result = await this.reminderService.getReminders(filters);
      if (result.success) {
        crmCache.set(cacheKey, result, 2 * 60 * 1000); // 2 minutes
        return result;
      }
      return { success: false, error: 'Failed to get reminders' };
    } catch (error) {
      console.error('Error getting reminders:', error);
      return { success: false, error: 'Failed to get reminders' };
    }
  }

  async createReminder(reminderData: any): Promise<CRMResponse> {
    try {
      const {
        data: { user },
        error: authError,
      } = await this.supabase.auth.getUser();
      if (authError || !user) {
        return { success: false, error: 'Unauthorized' };
      }

      const result = await this.reminderService.createReminder(reminderData);
      if (result.success) {
        CacheInvalidator.invalidateContact(user.id, reminderData.contact_id);
        return result;
      }
      return { success: false, error: 'Failed to create reminder' };
    } catch (error) {
      console.error('Error creating reminder:', error);
      return { success: false, error: 'Failed to create reminder' };
    }
  }

  // Search functionality
  async searchContacts(query: string, filters: any = {}): Promise<CRMResponse> {
    try {
      const {
        data: { user },
        error: authError,
      } = await this.supabase.auth.getUser();
      if (authError || !user) {
        return { success: false, error: 'Unauthorized' };
      }

      const cacheKey = CacheKeys.search(user.id, query, filters);
      const cached = crmCache.get(cacheKey);
      if (cached) {
        return { success: true, data: cached, cached: true };
      }

      const result = await this.searchService.searchContacts({
        query,
        ...filters,
      });
      if (result.success) {
        crmCache.set(cacheKey, result, 1 * 60 * 1000); // 1 minute
        return result;
      }
      return { success: false, error: 'Failed to search contacts' };
    } catch (error) {
      console.error('Error searching contacts:', error);
      return { success: false, error: 'Failed to search contacts' };
    }
  }

  // Export functionality
  async exportContacts(filters: any = {}): Promise<CRMResponse> {
    try {
      const {
        data: { user },
        error: authError,
      } = await this.supabase.auth.getUser();
      if (authError || !user) {
        return { success: false, error: 'Unauthorized' };
      }

      const result = await this.exportService.exportContacts(filters);
      if (result.success) {
        return result;
      }
      return { success: false, error: 'Failed to export contacts' };
    } catch (error) {
      console.error('Error exporting contacts:', error);
      return { success: false, error: 'Failed to export contacts' };
    }
  }

  // Timeline functionality
  async getTimeline(
    contactId: string,
    filters: any = {}
  ): Promise<CRMResponse> {
    try {
      const {
        data: { user },
        error: authError,
      } = await this.supabase.auth.getUser();
      if (authError || !user) {
        return { success: false, error: 'Unauthorized' };
      }

      const cacheKey = CacheKeys.timeline(user.id, contactId, filters);
      const cached = crmCache.get(cacheKey);
      if (cached) {
        return { success: true, data: cached, cached: true };
      }

      const result = await this.timelineService.getTimeline({
        contact_id: contactId,
        ...filters,
      });
      if (result.success) {
        crmCache.set(cacheKey, result, 2 * 60 * 1000); // 2 minutes
        return result;
      }
      return { success: false, error: 'Failed to get timeline' };
    } catch (error) {
      console.error('Error getting timeline:', error);
      return { success: false, error: 'Failed to get timeline' };
    }
  }

  // Statistics and analytics
  async getCRMStats(): Promise<CRMResponse<CRMStats>> {
    try {
      const {
        data: { user },
        error: authError,
      } = await this.supabase.auth.getUser();
      if (authError || !user) {
        return { success: false, error: 'Unauthorized' };
      }

      const cacheKey = CacheKeys.stats(user.id, 'crm');
      const cached = crmCache.get(cacheKey);
      if (cached) {
        return { success: true, data: cached, cached: true };
      }

      // Get all statistics in parallel
      const [
        contactsResult,
        messagesResult,
        notesResult,
        remindersResult,
        overdueRemindersResult,
        recentActivityResult,
      ] = await Promise.all([
        this.contactService.getContacts({}),
        this.messageService.getMessages({}),
        this.noteService.getNotes({}),
        this.reminderService.getReminders({}),
        this.reminderService.getOverdueReminders(),
        this.getRecentActivity(),
      ]);

      const stats: CRMStats = {
        total_contacts: contactsResult.success
          ? contactsResult.contacts?.length || 0
          : 0,
        active_contacts: contactsResult.success
          ? contactsResult.contacts?.filter(
              (c: any) => c.relationship_status === 'active'
            ).length || 0
          : 0,
        total_messages: messagesResult.success
          ? messagesResult.messages?.length || 0
          : 0,
        unread_messages: messagesResult.success
          ? messagesResult.messages?.filter((m: any) => !m.is_read).length || 0
          : 0,
        total_notes: notesResult.success ? notesResult.notes?.length || 0 : 0,
        important_notes: notesResult.success
          ? notesResult.notes?.filter((n: any) => n.is_important).length || 0
          : 0,
        total_reminders: remindersResult.success
          ? remindersResult.reminders?.length || 0
          : 0,
        pending_reminders: remindersResult.success
          ? remindersResult.reminders?.filter((r: any) => !r.is_completed)
              .length || 0
          : 0,
        overdue_reminders: overdueRemindersResult.success
          ? overdueRemindersResult.reminders?.length || 0
          : 0,
        recent_activity: recentActivityResult.success
          ? recentActivityResult.data || []
          : [],
      };

      crmCache.set(cacheKey, stats, 5 * 60 * 1000); // 5 minutes
      return { success: true, data: stats };
    } catch (error) {
      console.error('Error getting CRM stats:', error);
      return { success: false, error: 'Failed to get CRM stats' };
    }
  }

  private async getRecentActivity(): Promise<CRMResponse> {
    try {
      const {
        data: { user },
        error: authError,
      } = await this.supabase.auth.getUser();
      if (authError || !user) {
        return { success: false, error: 'Unauthorized' };
      }

      // Get recent activity from all sources
      const [interactionsResult, messagesResult, notesResult, remindersResult] =
        await Promise.all([
          this.supabase
            .from('contact_interactions')
            .select('id, interaction_type, created_at, contact_id')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(10),
          this.supabase
            .from('contact_messages')
            .select('id, message_type, created_at, contact_id')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(10),
          this.supabase
            .from('contact_notes')
            .select('id, note_type, created_at, contact_id')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(10),
          this.supabase
            .from('contact_reminders')
            .select('id, reminder_type, created_at, contact_id')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(10),
        ]);

      const activities = [
        ...(interactionsResult.data || []).map(item => ({
          ...item,
          type: 'interaction',
        })),
        ...(messagesResult.data || []).map(item => ({
          ...item,
          type: 'message',
        })),
        ...(notesResult.data || []).map(item => ({ ...item, type: 'note' })),
        ...(remindersResult.data || []).map(item => ({
          ...item,
          type: 'reminder',
        })),
      ];

      // Sort by created_at and take the most recent 20
      activities.sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
      const recentActivity = activities.slice(0, 20);

      return { success: true, data: recentActivity };
    } catch (error) {
      console.error('Error getting recent activity:', error);
      return { success: false, error: 'Failed to get recent activity' };
    }
  }

  // Cache management
  async clearCache(): Promise<CRMResponse> {
    try {
      crmCache.clear();
      return { success: true };
    } catch (error) {
      console.error('Error clearing cache:', error);
      return { success: false, error: 'Failed to clear cache' };
    }
  }

  async invalidateUserCache(userId: string): Promise<CRMResponse> {
    try {
      CacheInvalidator.invalidateUser(userId);
      return { success: true };
    } catch (error) {
      console.error('Error invalidating user cache:', error);
      return { success: false, error: 'Failed to invalidate user cache' };
    }
  }

  // Additional methods for test compatibility
  async getContactStats(userId: string): Promise<CRMResponse> {
    try {
      const result = await this.searchService.getContactStats();
      return result;
    } catch (error) {
      console.error('Error getting contact stats:', error);
      return { success: false, error: 'Failed to get contact stats' };
    }
  }

  async getMessageStats(userId: string): Promise<CRMResponse> {
    try {
      const result = await this.messageService.getMessages({});
      if (result.success) {
        const messages = result.messages || [];
        const stats = {
          total: messages.length,
          byType: messages.reduce((acc: any, msg: any) => {
            acc[msg.message_type] = (acc[msg.message_type] || 0) + 1;
            return acc;
          }, {}),
        };
        return { success: true, data: stats };
      }
      return { success: false, error: 'Failed to get message stats' };
    } catch (error) {
      console.error('Error getting message stats:', error);
      return { success: false, error: 'Failed to get message stats' };
    }
  }

  async getReminderStats(userId: string): Promise<CRMResponse> {
    try {
      const result = await this.reminderService.getReminders({});
      if (result.success) {
        const reminders = result.reminders || [];
        const stats = {
          total: reminders.length,
          pending: reminders.filter((r: any) => !r.is_completed).length,
          completed: reminders.filter((r: any) => r.is_completed).length,
        };
        return { success: true, data: stats };
      }
      return { success: false, error: 'Failed to get reminder stats' };
    } catch (error) {
      console.error('Error getting reminder stats:', error);
      return { success: false, error: 'Failed to get reminder stats' };
    }
  }

  async getNoteStats(userId: string): Promise<CRMResponse> {
    try {
      const result = await this.noteService.getNotes({});
      if (result.success) {
        const notes = result.notes || [];
        const stats = {
          total: notes.length,
          important: notes.filter((n: any) => n.is_important).length,
          byType: notes.reduce((acc: any, note: any) => {
            acc[note.note_type] = (acc[note.note_type] || 0) + 1;
            return acc;
          }, {}),
        };
        return { success: true, data: stats };
      }
      return { success: false, error: 'Failed to get note stats' };
    } catch (error) {
      console.error('Error getting note stats:', error);
      return { success: false, error: 'Failed to get note stats' };
    }
  }

  async searchAll(userId: string, query: string): Promise<CRMResponse> {
    try {
      const result = await this.searchService.searchContacts({ query });
      return result;
    } catch (error) {
      console.error('Error searching all:', error);
      return { success: false, error: 'Failed to search all' };
    }
  }

  async getActivityTimeline(
    userId: string,
    contactId: string,
    filters: any = {}
  ): Promise<CRMResponse> {
    try {
      const result = await this.timelineService.getTimeline({
        contact_id: contactId,
        ...filters,
      });
      return result;
    } catch (error) {
      console.error('Error getting activity timeline:', error);
      return { success: false, error: 'Failed to get activity timeline' };
    }
  }
}
