import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

// Validation schemas
const createNoteSchema = z.object({
  contact_id: z.string().uuid('Invalid contact ID'),
  note_content: z
    .string()
    .min(1, 'Note content is required')
    .max(2000, 'Note content too long'),
  note_type: z
    .enum(['general', 'meeting', 'call', 'email', 'follow_up', 'important'])
    .optional(),
  tags: z.array(z.string()).optional(),
  is_important: z.boolean().optional(),
});

const updateNoteSchema = z.object({
  note_content: z
    .string()
    .min(1, 'Note content is required')
    .max(2000, 'Note content too long')
    .optional(),
  note_type: z
    .enum(['general', 'meeting', 'call', 'email', 'follow_up', 'important'])
    .optional(),
  tags: z.array(z.string()).optional(),
  is_important: z.boolean().optional(),
});

const getNotesSchema = z.object({
  contact_id: z.string().uuid().optional(),
  note_type: z
    .enum(['general', 'meeting', 'call', 'email', 'follow_up', 'important'])
    .optional(),
  tags: z.string().optional(),
  is_important: z.coerce.boolean().optional(),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
});

export interface Note {
  id: string;
  contact_id: string;
  user_id: string;
  note_content: string;
  note_type:
    | 'general'
    | 'meeting'
    | 'call'
    | 'email'
    | 'follow_up'
    | 'important';
  tags: string[];
  is_important: boolean;
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

export interface NoteFilters {
  contact_id?: string;
  note_type?: string;
  tags?: string;
  is_important?: boolean;
  page?: number;
  limit?: number;
}

export interface NoteResponse {
  success: boolean;
  notes?: Note[];
  note?: Note;
  total?: number;
  page?: number;
  limit?: number;
  error?: string;
}

export class NoteService {
  private supabase;

  constructor(supabaseClient?: any) {
    this.supabase = supabaseClient || createClient();
  }

  // Static method to create service with dependency injection
  static create(supabaseClient?: any): NoteService {
    return new NoteService(supabaseClient);
  }

  async getNotes(filters: NoteFilters = {}): Promise<NoteResponse> {
    try {
      // Validate filters
      const validationResult = getNotesSchema.safeParse(filters);
      if (!validationResult.success) {
        return {
          success: false,
          error: 'Invalid filter parameters',
        };
      }

      const { contact_id, note_type, tags, is_important, page, limit } =
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
        .from('contact_notes')
        .select('*')
        .eq('user_id', user.id);

      if (contact_id) {
        query = query.eq('contact_id', contact_id);
      }

      if (note_type) {
        query = query.eq('note_type', note_type);
      }

      if (is_important !== undefined) {
        query = query.eq('is_important', is_important);
      }

      if (tags) {
        query = query.contains('tags', [tags]);
      }

      // Get total count
      const { count } = await this.supabase
        .from('contact_notes')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);

      // Get notes with pagination
      const { data: notes, error } = await query
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) {
        throw new Error(`Failed to fetch notes: ${error.message}`);
      }

      return {
        success: true,
        notes: notes || [],
        total: count || 0,
        page,
        limit,
      };
    } catch (error) {
      console.error('Error fetching notes:', error);
      return {
        success: false,
        error: 'Failed to fetch notes',
      };
    }
  }

  async createNote(noteData: any): Promise<NoteResponse> {
    try {
      // Validate note data
      const validationResult = createNoteSchema.safeParse(noteData);
      if (!validationResult.success) {
        return {
          success: false,
          error: 'Invalid note data',
        };
      }

      const { contact_id, note_content, note_type, tags, is_important } =
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

      // Create note
      const { data: note, error } = await this.supabase
        .from('contact_notes')
        .insert({
          contact_id,
          user_id: user.id,
          note_content,
          note_type: note_type || 'general',
          tags: tags || [],
          is_important: is_important || false,
        })
        .select('*')
        .single();

      if (error) {
        throw new Error(`Failed to create note: ${error.message}`);
      }

      return {
        success: true,
        note,
      };
    } catch (error) {
      console.error('Error creating note:', error);
      return {
        success: false,
        error: 'Failed to create note',
      };
    }
  }

  async updateNote(noteId: string, updates: any): Promise<NoteResponse> {
    try {
      // Validate update data
      const validationResult = updateNoteSchema.safeParse(updates);
      if (!validationResult.success) {
        return {
          success: false,
          error: 'Invalid update data',
        };
      }

      const updateData = validationResult.data;

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

      // Update note
      const { data: note, error } = await this.supabase
        .from('contact_notes')
        .update({
          ...updateData,
          updated_at: new Date().toISOString(),
        })
        .eq('id', noteId)
        .eq('user_id', user.id)
        .select('*')
        .single();

      if (error) {
        throw new Error(`Failed to update note: ${error.message}`);
      }

      return {
        success: true,
        note,
      };
    } catch (error) {
      console.error('Error updating note:', error);
      return {
        success: false,
        error: 'Failed to update note',
      };
    }
  }

  async deleteNote(noteId: string): Promise<NoteResponse> {
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

      // Delete note
      const { error } = await this.supabase
        .from('contact_notes')
        .delete()
        .eq('id', noteId)
        .eq('user_id', user.id);

      if (error) {
        throw new Error(`Failed to delete note: ${error.message}`);
      }

      return {
        success: true,
      };
    } catch (error) {
      console.error('Error deleting note:', error);
      return {
        success: false,
        error: 'Failed to delete note',
      };
    }
  }

  async getNotesByContact(contactId: string): Promise<NoteResponse> {
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

      // Get all notes for this contact
      const { data: notes, error } = await this.supabase
        .from('contact_notes')
        .select('*')
        .eq('contact_id', contactId)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        throw new Error(`Failed to fetch notes: ${error.message}`);
      }

      return {
        success: true,
        notes: notes || [],
      };
    } catch (error) {
      console.error('Error fetching notes by contact:', error);
      return {
        success: false,
        error: 'Failed to fetch notes',
      };
    }
  }

  async searchNotes(
    query: string,
    filters: NoteFilters = {}
  ): Promise<NoteResponse> {
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
        .from('contact_notes')
        .select('*')
        .eq('user_id', user.id)
        .textSearch('note_content', query);

      if (filters.contact_id) {
        searchQuery = searchQuery.eq('contact_id', filters.contact_id);
      }

      if (filters.note_type) {
        searchQuery = searchQuery.eq('note_type', filters.note_type);
      }

      if (filters.is_important !== undefined) {
        searchQuery = searchQuery.eq('is_important', filters.is_important);
      }

      if (filters.tags) {
        searchQuery = searchQuery.contains('tags', [filters.tags]);
      }

      const { data: notes, error } = await searchQuery.order('created_at', {
        ascending: false,
      });

      if (error) {
        throw new Error(`Failed to search notes: ${error.message}`);
      }

      return {
        success: true,
        notes: notes || [],
      };
    } catch (error) {
      console.error('Error searching notes:', error);
      return {
        success: false,
        error: 'Failed to search notes',
      };
    }
  }

  async getTags(): Promise<{
    success: boolean;
    tags?: string[];
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

      // Get all unique tags
      const { data: notes, error } = await this.supabase
        .from('contact_notes')
        .select('tags')
        .eq('user_id', user.id)
        .not('tags', 'is', null);

      if (error) {
        throw new Error(`Failed to fetch tags: ${error.message}`);
      }

      // Extract and flatten all tags
      const allTags =
        notes
          ?.map(note => note.tags || [])
          .flat()
          .filter((tag, index, self) => self.indexOf(tag) === index) || [];

      return {
        success: true,
        tags: allTags,
      };
    } catch (error) {
      console.error('Error fetching tags:', error);
      return {
        success: false,
        error: 'Failed to fetch tags',
      };
    }
  }
}
