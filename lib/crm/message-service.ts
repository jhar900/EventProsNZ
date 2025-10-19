import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

// Validation schemas
const createMessageSchema = z.object({
  contact_id: z.string().uuid('Invalid contact ID'),
  message_type: z.enum(['inquiry', 'response', 'follow_up', 'general']),
  message_content: z
    .string()
    .min(1, 'Message content is required')
    .max(2000, 'Message content too long'),
  message_data: z.record(z.any()).optional(),
});

const getMessagesSchema = z.object({
  contact_id: z.string().uuid().optional(),
  message_type: z
    .enum(['inquiry', 'response', 'follow_up', 'general'])
    .optional(),
  date_from: z.string().datetime().optional(),
  date_to: z.string().datetime().optional(),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
});

export interface Message {
  id: string;
  contact_id: string;
  user_id: string;
  message_type: 'inquiry' | 'response' | 'follow_up' | 'general';
  message_content: string;
  message_data: any;
  is_read: boolean;
  read_at: string | null;
  created_at: string;
  updated_at: string;
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

export interface MessageFilters {
  contact_id?: string;
  message_type?: string;
  date_from?: string;
  date_to?: string;
  page?: number;
  limit?: number;
}

export interface MessageResponse {
  success: boolean;
  messages?: Message[];
  message?: Message;
  total?: number;
  page?: number;
  limit?: number;
  error?: string;
}

export class MessageService {
  private supabase;

  constructor(supabaseClient?: any) {
    this.supabase = supabaseClient || createClient();
  }

  // Static method to create service with dependency injection
  static create(supabaseClient?: any): MessageService {
    return new MessageService(supabaseClient);
  }

  async getMessages(filters: MessageFilters = {}): Promise<MessageResponse> {
    try {
      // Validate filters
      const validationResult = getMessagesSchema.safeParse(filters);
      if (!validationResult.success) {
        return {
          success: false,
          error: 'Invalid filter parameters',
        };
      }

      const { contact_id, message_type, date_from, date_to, page, limit } =
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
        .from('contact_messages')
        .select('*')
        .eq('user_id', user.id);

      if (contact_id) {
        query = query.eq('contact_id', contact_id);
      }

      if (message_type) {
        query = query.eq('message_type', message_type);
      }

      if (date_from) {
        query = query.gte('created_at', date_from);
      }

      if (date_to) {
        query = query.lte('created_at', date_to);
      }

      // Get total count
      const { count } = await this.supabase
        .from('contact_messages')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);

      // Get messages with pagination
      const { data: messages, error } = await query
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) {
        throw new Error(`Failed to fetch messages: ${error.message}`);
      }

      return {
        success: true,
        messages: messages || [],
        total: count || 0,
        page,
        limit,
      };
    } catch (error) {
      console.error('Error fetching messages:', error);
      return {
        success: false,
        error: 'Failed to fetch messages',
      };
    }
  }

  async createMessage(messageData: any): Promise<MessageResponse> {
    try {
      // Validate message data
      const validationResult = createMessageSchema.safeParse(messageData);
      if (!validationResult.success) {
        return {
          success: false,
          error: 'Invalid message data',
        };
      }

      const { contact_id, message_type, message_content, message_data } =
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

      // Create message
      const { data: message, error } = await this.supabase
        .from('contact_messages')
        .insert({
          contact_id,
          user_id: user.id,
          message_type,
          message_content,
          message_data,
        })
        .select('*')
        .single();

      if (error) {
        throw new Error(`Failed to create message: ${error.message}`);
      }

      // Update contact's last_interaction and interaction_count
      await this.supabase.rpc('increment_contact_interaction_count', {
        contact_id: contact_id,
        user_id: user.id,
      });

      return {
        success: true,
        message,
      };
    } catch (error) {
      console.error('Error creating message:', error);
      return {
        success: false,
        error: 'Failed to create message',
      };
    }
  }

  async updateMessage(
    messageId: string,
    updates: any
  ): Promise<MessageResponse> {
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

      // Update message
      const { data: message, error } = await this.supabase
        .from('contact_messages')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', messageId)
        .eq('user_id', user.id)
        .select('*')
        .single();

      if (error) {
        throw new Error(`Failed to update message: ${error.message}`);
      }

      return {
        success: true,
        message,
      };
    } catch (error) {
      console.error('Error updating message:', error);
      return {
        success: false,
        error: 'Failed to update message',
      };
    }
  }

  async markAsRead(messageId: string): Promise<MessageResponse> {
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

      // Update message as read
      const { data: message, error } = await this.supabase
        .from('contact_messages')
        .update({
          is_read: true,
          read_at: new Date().toISOString(),
        })
        .eq('id', messageId)
        .eq('user_id', user.id)
        .select('*')
        .single();

      if (error) {
        throw new Error(`Failed to mark message as read: ${error.message}`);
      }

      return {
        success: true,
        message,
      };
    } catch (error) {
      console.error('Error marking message as read:', error);
      return {
        success: false,
        error: 'Failed to mark message as read',
      };
    }
  }

  async deleteMessage(messageId: string): Promise<MessageResponse> {
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

      // Delete message
      const { error } = await this.supabase
        .from('contact_messages')
        .delete()
        .eq('id', messageId)
        .eq('user_id', user.id);

      if (error) {
        throw new Error(`Failed to delete message: ${error.message}`);
      }

      return {
        success: true,
      };
    } catch (error) {
      console.error('Error deleting message:', error);
      return {
        success: false,
        error: 'Failed to delete message',
      };
    }
  }

  async getConversationThread(contactId: string): Promise<MessageResponse> {
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

      // Get all messages for this contact
      const { data: messages, error } = await this.supabase
        .from('contact_messages')
        .select('*')
        .eq('contact_id', contactId)
        .eq('user_id', user.id)
        .order('created_at', { ascending: true });

      if (error) {
        throw new Error(
          `Failed to fetch conversation thread: ${error.message}`
        );
      }

      return {
        success: true,
        messages: messages || [],
      };
    } catch (error) {
      console.error('Error fetching conversation thread:', error);
      return {
        success: false,
        error: 'Failed to fetch conversation thread',
      };
    }
  }

  async searchMessages(
    query: string,
    filters: MessageFilters = {}
  ): Promise<MessageResponse> {
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

      // Build search query
      let searchQuery = this.supabase
        .from('contact_messages')
        .select('*')
        .eq('user_id', user.id)
        .textSearch('message_content', query);

      if (filters.contact_id) {
        searchQuery = searchQuery.eq('contact_id', filters.contact_id);
      }

      if (filters.message_type) {
        searchQuery = searchQuery.eq('message_type', filters.message_type);
      }

      if (filters.date_from) {
        searchQuery = searchQuery.gte('created_at', filters.date_from);
      }

      if (filters.date_to) {
        searchQuery = searchQuery.lte('created_at', filters.date_to);
      }

      const { data: messages, error } = await searchQuery.order('created_at', {
        ascending: false,
      });

      if (error) {
        throw new Error(`Failed to search messages: ${error.message}`);
      }

      return {
        success: true,
        messages: messages || [],
      };
    } catch (error) {
      console.error('Error searching messages:', error);
      return {
        success: false,
        error: 'Failed to search messages',
      };
    }
  }
}
