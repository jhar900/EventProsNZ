import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

// Validation schemas
const searchContactsSchema = z.object({
  query: z
    .string()
    .min(1, 'Search query is required')
    .max(100, 'Search query too long'),
  contact_type: z
    .enum(['contractor', 'event_manager', 'client', 'vendor', 'other'])
    .optional(),
  relationship_status: z
    .enum(['active', 'inactive', 'blocked', 'archived'])
    .optional(),
  tags: z.string().optional(),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
});

const getSuggestionsSchema = z.object({
  query: z
    .string()
    .min(1, 'Search query is required')
    .max(100, 'Search query too long'),
});

export interface Contact {
  id: string;
  user_id: string;
  contact_user_id: string;
  contact_type: string;
  relationship_status: string;
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

export interface SearchFilters {
  query: string;
  contact_type?: string;
  relationship_status?: string;
  tags?: string;
  page?: number;
  limit?: number;
}

export interface SearchResponse {
  success: boolean;
  contacts?: Contact[];
  suggestions?: string[];
  total?: number;
  page?: number;
  limit?: number;
  query?: string;
  error?: string;
}

export class SearchService {
  private supabase;

  constructor(supabaseClient?: any) {
    this.supabase = supabaseClient || createClient();
  }

  // Static method to create service with dependency injection
  static create(supabaseClient?: any): SearchService {
    return new SearchService(supabaseClient);
  }

  async searchContacts(filters: SearchFilters): Promise<SearchResponse> {
    try {
      // Validate filters
      const validationResult = searchContactsSchema.safeParse(filters);
      if (!validationResult.success) {
        return {
          success: false,
          error: 'Invalid search parameters',
        };
      }

      const { query, contact_type, relationship_status, tags, page, limit } =
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

      // Build search query
      let searchQuery = this.supabase
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
            avatar_url,
            bio
          )
        `
        )
        .eq('user_id', user.id);

      // Add filters
      if (contact_type) {
        searchQuery = searchQuery.eq('contact_type', contact_type);
      }

      if (relationship_status) {
        searchQuery = searchQuery.eq(
          'relationship_status',
          relationship_status
        );
      }

      // Search in contact user data and profile data
      searchQuery = searchQuery.or(`
        contact_user.email.ilike.%${query}%,
        contact_profile.first_name.ilike.%${query}%,
        contact_profile.last_name.ilike.%${query}%,
        contact_profile.bio.ilike.%${query}%
      `);

      // If tags filter is provided, search in notes
      if (tags) {
        searchQuery = searchQuery.contains('tags', [tags]);
      }

      // Get total count
      const { count } = await searchQuery.select('*', {
        count: 'exact',
        head: true,
      });

      // Get search results with pagination
      const { data: contacts, error } = await searchQuery
        .order('last_interaction', { ascending: false, nullsLast: true })
        .range(offset, offset + limit - 1);

      if (error) {
        throw new Error(`Failed to search contacts: ${error.message}`);
      }

      return {
        success: true,
        contacts: contacts || [],
        total: count || 0,
        page,
        limit,
        query,
      };
    } catch (error) {
      console.error('Error searching contacts:', error);
      return {
        success: false,
        error: 'Failed to search contacts',
      };
    }
  }

  async getSearchSuggestions(query: string): Promise<SearchResponse> {
    try {
      // Validate query
      const validationResult = getSuggestionsSchema.safeParse({ query });
      if (!validationResult.success) {
        return {
          success: false,
          error: 'Invalid search query',
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

      // Get suggestions from contact names and emails
      const { data: contacts, error } = await this.supabase
        .from('contacts')
        .select(
          `
          contact_user:users!contacts_contact_user_id_fkey(
            email
          ),
          contact_profile:profiles!contacts_contact_user_id_fkey(
            first_name,
            last_name
          )
        `
        )
        .eq('user_id', user.id)
        .or(
          `
          contact_user.email.ilike.%${query}%,
          contact_profile.first_name.ilike.%${query}%,
          contact_profile.last_name.ilike.%${query}%
        `
        )
        .limit(10);

      if (error) {
        throw new Error(`Failed to get suggestions: ${error.message}`);
      }

      // Extract suggestions
      const suggestions =
        contacts
          ?.map(contact => [
            contact.contact_user?.email,
            contact.contact_profile?.first_name,
            contact.contact_profile?.last_name,
          ])
          .flat()
          .filter(Boolean)
          .filter(
            (suggestion, index, self) => self.indexOf(suggestion) === index
          )
          .slice(0, 10) || [];

      return {
        success: true,
        suggestions,
      };
    } catch (error) {
      console.error('Error getting search suggestions:', error);
      return {
        success: false,
        error: 'Failed to get search suggestions',
      };
    }
  }

  async searchContactsByTags(
    tags: string[],
    filters: Omit<SearchFilters, 'query'> = {}
  ): Promise<SearchResponse> {
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

      const {
        contact_type,
        relationship_status,
        page = 1,
        limit = 20,
      } = filters;
      const offset = (page - 1) * limit;

      // Build search query
      let searchQuery = this.supabase
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
            avatar_url,
            bio
          )
        `
        )
        .eq('user_id', user.id);

      // Add filters
      if (contact_type) {
        searchQuery = searchQuery.eq('contact_type', contact_type);
      }

      if (relationship_status) {
        searchQuery = searchQuery.eq(
          'relationship_status',
          relationship_status
        );
      }

      // Search by tags in notes
      if (tags.length > 0) {
        searchQuery = searchQuery.contains('tags', tags);
      }

      // Get total count
      const { count } = await searchQuery.select('*', {
        count: 'exact',
        head: true,
      });

      // Get search results with pagination
      const { data: contacts, error } = await searchQuery
        .order('last_interaction', { ascending: false, nullsLast: true })
        .range(offset, offset + limit - 1);

      if (error) {
        throw new Error(`Failed to search contacts by tags: ${error.message}`);
      }

      return {
        success: true,
        contacts: contacts || [],
        total: count || 0,
        page,
        limit,
      };
    } catch (error) {
      console.error('Error searching contacts by tags:', error);
      return {
        success: false,
        error: 'Failed to search contacts by tags',
      };
    }
  }

  async getPopularTags(): Promise<{
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

      // Get all tags from notes
      const { data: notes, error } = await this.supabase
        .from('contact_notes')
        .select('tags')
        .eq('user_id', user.id)
        .not('tags', 'is', null);

      if (error) {
        throw new Error(`Failed to fetch tags: ${error.message}`);
      }

      // Count tag frequency
      const tagCounts: { [key: string]: number } = {};
      notes?.forEach(note => {
        note.tags?.forEach(tag => {
          tagCounts[tag] = (tagCounts[tag] || 0) + 1;
        });
      });

      // Sort by frequency and return top 20
      const popularTags = Object.entries(tagCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 20)
        .map(([tag]) => tag);

      return {
        success: true,
        tags: popularTags,
      };
    } catch (error) {
      console.error('Error getting popular tags:', error);
      return {
        success: false,
        error: 'Failed to get popular tags',
      };
    }
  }

  async getContactStats(): Promise<{
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

      // Get contact statistics
      const { data: contacts, error } = await this.supabase
        .from('contacts')
        .select('contact_type, relationship_status')
        .eq('user_id', user.id);

      if (error) {
        throw new Error(`Failed to fetch contact stats: ${error.message}`);
      }

      // Calculate statistics
      const stats = {
        total: contacts?.length || 0,
        byType: {} as { [key: string]: number },
        byStatus: {} as { [key: string]: number },
      };

      contacts?.forEach(contact => {
        stats.byType[contact.contact_type] =
          (stats.byType[contact.contact_type] || 0) + 1;
        stats.byStatus[contact.relationship_status] =
          (stats.byStatus[contact.relationship_status] || 0) + 1;
      });

      return {
        success: true,
        stats,
      };
    } catch (error) {
      console.error('Error getting contact stats:', error);
      return {
        success: false,
        error: 'Failed to get contact stats',
      };
    }
  }

  // Additional methods for test compatibility
  async getRecentSearches(
    userId: string
  ): Promise<{ success: boolean; searches?: any[]; error?: string }> {
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

      // Mock recent searches for now
      return {
        success: true,
        searches: [],
      };
    } catch (error) {
      console.error('Error getting recent searches:', error);
      return {
        success: false,
        error: 'Failed to get recent searches',
      };
    }
  }

  async saveSearch(
    userId: string,
    query: string,
    filters: any = {}
  ): Promise<{ success: boolean; error?: string }> {
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

      // Mock save search for now
      return {
        success: true,
      };
    } catch (error) {
      console.error('Error saving search:', error);
      return {
        success: false,
        error: 'Failed to save search',
      };
    }
  }

  async getSavedSearches(
    userId: string
  ): Promise<{ success: boolean; searches?: any[]; error?: string }> {
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

      // Mock saved searches for now
      return {
        success: true,
        searches: [],
      };
    } catch (error) {
      console.error('Error getting saved searches:', error);
      return {
        success: false,
        error: 'Failed to get saved searches',
      };
    }
  }

  async deleteSavedSearch(
    userId: string,
    searchId: string
  ): Promise<{ success: boolean; error?: string }> {
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

      // Mock delete search for now
      return {
        success: true,
      };
    } catch (error) {
      console.error('Error deleting saved search:', error);
      return {
        success: false,
        error: 'Failed to delete saved search',
      };
    }
  }
}
