import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

// Validation schemas
export const createContactSchema = z.object({
  contact_user_id: z.string().uuid('Invalid contact user ID'),
  contact_type: z.enum([
    'contractor',
    'event_manager',
    'client',
    'vendor',
    'other',
  ]),
  relationship_status: z
    .enum(['active', 'inactive', 'blocked', 'archived'])
    .optional(),
});

export const updateContactSchema = z.object({
  contact_type: z
    .enum(['contractor', 'event_manager', 'client', 'vendor', 'other'])
    .optional(),
  relationship_status: z
    .enum(['active', 'inactive', 'blocked', 'archived'])
    .optional(),
  last_interaction: z.string().datetime().optional(),
});

export const getContactsSchema = z.object({
  contact_type: z
    .enum(['contractor', 'event_manager', 'client', 'vendor', 'other'])
    .optional(),
  relationship_status: z
    .enum(['active', 'inactive', 'blocked', 'archived'])
    .optional(),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
});

export interface Contact {
  id: string;
  user_id: string;
  contact_user_id: string;
  contact_type: 'contractor' | 'event_manager' | 'client' | 'vendor' | 'other';
  relationship_status: 'active' | 'inactive' | 'blocked' | 'archived';
  last_interaction: string | null;
  interaction_count: number;
  created_at: string;
  updated_at: string;
  contact_user: {
    id: string;
    email: string;
    role: string;
    is_verified: boolean;
    last_login: string | null;
    created_at: string;
  };
  contact_profile: {
    first_name: string;
    last_name: string;
    phone: string | null;
    avatar_url: string | null;
    bio: string | null;
  };
}

export interface ContactFilters {
  contact_type?: string;
  relationship_status?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface ContactResult {
  contacts: Contact[];
  total: number;
  page: number;
  limit: number;
}

export class ContactService {
  private supabase;

  constructor(supabaseClient?: any) {
    this.supabase = supabaseClient || createClient();
  }

  // Static method to create service with dependency injection
  static create(supabaseClient?: any): ContactService {
    return new ContactService(supabaseClient);
  }

  async getContacts(
    userId: string,
    filters: ContactFilters = {}
  ): Promise<ContactResult> {
    try {
      const {
        contact_type,
        relationship_status,
        search,
        page = 1,
        limit = 20,
      } = filters;
      const offset = (page - 1) * limit;

      // Build query
      let query = this.supabase
        .from('contacts')
        .select('*', { count: 'exact' })
        .eq('user_id', userId);

      if (contact_type) {
        query = query.eq('contact_type', contact_type);
      }

      if (relationship_status) {
        query = query.eq('relationship_status', relationship_status);
      }

      if (search) {
        // For now, we'll implement basic search on contact fields
        // TODO: Implement proper search with user and profile data
        query = query.or(`contact_type.ilike.%${search}%`);
      }

      // Get total count
      const { count } = await this.supabase
        .from('contacts')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId);

      // Get contacts with pagination
      const { data: contacts, error } = await query
        .order('last_interaction', { ascending: false, nullsLast: true })
        .range(offset, offset + limit - 1);

      if (error) {
        throw new Error(`Failed to fetch contacts: ${error.message}`);
      }

      return {
        success: true,
        contacts: contacts || [],
        total: count || 0,
        page,
        limit,
      };
    } catch (error) {
      console.error('Error fetching contacts:', error);
      throw error;
    }
  }

  async createContact(
    userId: string,
    contactData: z.infer<typeof createContactSchema>
  ): Promise<Contact> {
    try {
      const { contact_user_id, contact_type, relationship_status } =
        contactData;

      // Check if contact already exists
      const { data: existingContact } = await this.supabase
        .from('contacts')
        .select('id')
        .eq('user_id', userId)
        .eq('contact_user_id', contact_user_id)
        .single();

      if (existingContact) {
        throw new Error('Contact already exists');
      }

      // Verify the contact user exists
      const { data: contactUser, error: userError } = await this.supabase
        .from('users')
        .select('id, role')
        .eq('id', contact_user_id)
        .single();

      if (userError || !contactUser) {
        throw new Error('Contact user not found');
      }

      // Create contact
      const { data: contact, error } = await this.supabase
        .from('contacts')
        .insert({
          user_id: userId,
          contact_user_id,
          contact_type,
          relationship_status: relationship_status || 'active',
        })
        .select('*')
        .single();

      if (error) {
        throw new Error(`Failed to create contact: ${error.message}`);
      }

      return {
        success: true,
        contact,
      };
    } catch (error) {
      console.error('Error creating contact:', error);
      throw error;
    }
  }

  async updateContact(
    contactId: string,
    userId: string,
    updates: z.infer<typeof updateContactSchema>
  ): Promise<Contact> {
    try {
      const { data: contact, error } = await this.supabase
        .from('contacts')
        .update(updates)
        .eq('id', contactId)
        .eq('user_id', userId)
        .select('*')
        .single();

      if (error) {
        throw new Error(`Failed to update contact: ${error.message}`);
      }

      if (!contact) {
        throw new Error('Contact not found');
      }

      return {
        success: true,
        contact,
      };
    } catch (error) {
      console.error('Error updating contact:', error);
      throw error;
    }
  }

  async deleteContact(contactId: string, userId: string): Promise<void> {
    try {
      const { error } = await this.supabase
        .from('contacts')
        .delete()
        .eq('id', contactId)
        .eq('user_id', userId);

      if (error) {
        throw new Error(`Failed to delete contact: ${error.message}`);
      }
    } catch (error) {
      console.error('Error deleting contact:', error);
      throw error;
    }
  }

  async getContactById(contactId: string, userId: string): Promise<Contact> {
    try {
      const { data: contact, error } = await this.supabase
        .from('contacts')
        .select('*')
        .eq('id', contactId)
        .eq('user_id', userId)
        .single();

      if (error) {
        throw new Error(`Failed to fetch contact: ${error.message}`);
      }

      if (!contact) {
        throw new Error('Contact not found');
      }

      return contact;
    } catch (error) {
      console.error('Error fetching contact:', error);
      throw error;
    }
  }

  async searchContacts(
    userId: string,
    query: string,
    filters: ContactFilters = {}
  ): Promise<ContactResult> {
    try {
      const { page = 1, limit = 20 } = filters;
      const offset = (page - 1) * limit;

      // Build search query
      let searchQuery = this.supabase
        .from('contacts')
        .select('*', { count: 'exact' })
        .eq('user_id', userId)
        .or(`contact_type.ilike.%${query}%`);

      if (filters.contact_type) {
        searchQuery = searchQuery.eq('contact_type', filters.contact_type);
      }

      if (filters.relationship_status) {
        searchQuery = searchQuery.eq(
          'relationship_status',
          filters.relationship_status
        );
      }

      // Get total count
      const { count } = await this.supabase
        .from('contacts')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .or(`contact_type.ilike.%${query}%`);

      // Get contacts with pagination
      const { data: contacts, error } = await searchQuery
        .order('last_interaction', { ascending: false, nullsLast: true })
        .range(offset, offset + limit - 1);

      if (error) {
        throw new Error(`Failed to search contacts: ${error.message}`);
      }

      return {
        contacts: contacts || [],
        total: count || 0,
        page,
        limit,
      };
    } catch (error) {
      console.error('Error searching contacts:', error);
      throw error;
    }
  }
}
