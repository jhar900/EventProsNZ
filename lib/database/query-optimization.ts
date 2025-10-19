import { createClient } from '@/lib/supabase/server';

export interface QueryOptions {
  select?: string[];
  filters?: Record<string, any>;
  orderBy?: { column: string; ascending?: boolean }[];
  limit?: number;
  offset?: number;
  include?: string[];
}

export class QueryOptimizer {
  private supabase = createClient();

  // Optimized contact queries
  async getContactsOptimized(userId: string, options: QueryOptions = {}) {
    const {
      select = ['*'],
      filters = {},
      orderBy = [{ column: 'last_interaction', ascending: false }],
      limit = 20,
      offset = 0,
      include = ['contact_user', 'contact_profile'],
    } = options;

    // Build select clause with relations
    const selectClause = this.buildSelectClause(select, include);

    // Build query
    let query = this.supabase
      .from('contacts')
      .select(selectClause)
      .eq('user_id', userId);

    // Apply filters
    query = this.applyFilters(query, filters);

    // Apply ordering
    query = this.applyOrdering(query, orderBy);

    // Apply pagination
    query = query.range(offset, offset + limit - 1);

    const { data, error } = await query;

    if (error) {
      throw new Error(`Query failed: ${error.message}`);
    }

    return data;
  }

  // Optimized interaction queries with proper joins
  async getInteractionsOptimized(
    userId: string,
    contactId?: string,
    options: QueryOptions = {}
  ) {
    const {
      select = ['*'],
      filters = {},
      orderBy = [{ column: 'created_at', ascending: false }],
      limit = 50,
      offset = 0,
    } = options;

    let query = this.supabase
      .from('contact_interactions')
      .select(
        `
        *,
        contact:contacts!contact_interactions_contact_id_fkey(
          id,
          contact_type,
          relationship_status,
          contact_user:users!contacts_contact_user_id_fkey(
            id,
            email,
            role
          ),
          contact_profile:profiles!contacts_contact_user_id_fkey(
            first_name,
            last_name,
            avatar_url
          )
        )
      `
      )
      .eq('user_id', userId);

    if (contactId) {
      query = query.eq('contact_id', contactId);
    }

    // Apply filters
    query = this.applyFilters(query, filters);

    // Apply ordering
    query = this.applyOrdering(query, orderBy);

    // Apply pagination
    query = query.range(offset, offset + limit - 1);

    const { data, error } = await query;

    if (error) {
      throw new Error(`Query failed: ${error.message}`);
    }

    return data;
  }

  // Optimized timeline queries
  async getTimelineOptimized(
    userId: string,
    contactId: string,
    options: QueryOptions = {}
  ) {
    const { limit = 100, offset = 0 } = options;

    // Get all activities for a contact in a single query
    const { data: interactions, error: interactionsError } = await this.supabase
      .from('contact_interactions')
      .select('*')
      .eq('user_id', userId)
      .eq('contact_id', contactId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (interactionsError) {
      throw new Error(
        `Interactions query failed: ${interactionsError.message}`
      );
    }

    const { data: messages, error: messagesError } = await this.supabase
      .from('contact_messages')
      .select('*')
      .eq('user_id', userId)
      .eq('contact_id', contactId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (messagesError) {
      throw new Error(`Messages query failed: ${messagesError.message}`);
    }

    const { data: notes, error: notesError } = await this.supabase
      .from('contact_notes')
      .select('*')
      .eq('user_id', userId)
      .eq('contact_id', contactId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (notesError) {
      throw new Error(`Notes query failed: ${notesError.message}`);
    }

    const { data: reminders, error: remindersError } = await this.supabase
      .from('contact_reminders')
      .select('*')
      .eq('user_id', userId)
      .eq('contact_id', contactId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (remindersError) {
      throw new Error(`Reminders query failed: ${remindersError.message}`);
    }

    // Combine and sort all activities
    const timeline = [
      ...(interactions || []).map(item => ({ ...item, type: 'interaction' })),
      ...(messages || []).map(item => ({ ...item, type: 'message' })),
      ...(notes || []).map(item => ({ ...item, type: 'note' })),
      ...(reminders || []).map(item => ({ ...item, type: 'reminder' })),
    ].sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    return timeline;
  }

  // Optimized search queries with full-text search
  async searchContactsOptimized(
    userId: string,
    query: string,
    options: QueryOptions = {}
  ) {
    const { limit = 20, offset = 0 } = options;

    // Use full-text search on multiple fields
    const { data, error } = await this.supabase
      .from('contacts')
      .select(
        `
        *,
        contact_user:users!contacts_contact_user_id_fkey(
          id,
          email,
          role,
          is_verified
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
      .eq('user_id', userId)
      .or(
        `contact_user.email.ilike.%${query}%,contact_profile.first_name.ilike.%${query}%,contact_profile.last_name.ilike.%${query}%,contact_profile.bio.ilike.%${query}%`
      )
      .order('last_interaction', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      throw new Error(`Search query failed: ${error.message}`);
    }

    return data;
  }

  // Batch operations for better performance
  async batchCreateInteractions(interactions: any[]) {
    const { data, error } = await this.supabase
      .from('contact_interactions')
      .insert(interactions);

    if (error) {
      throw new Error(`Batch insert failed: ${error.message}`);
    }

    return data;
  }

  async batchUpdateContacts(updates: { id: string; data: any }[]) {
    const promises = updates.map(({ id, data }) =>
      this.supabase.from('contacts').update(data).eq('id', id)
    );

    const results = await Promise.all(promises);

    // Check for errors
    const errors = results.filter(result => result.error);
    if (errors.length > 0) {
      throw new Error(`Batch update failed: ${errors[0].error.message}`);
    }

    return results.map(result => result.data);
  }

  // Helper methods
  private buildSelectClause(select: string[], include: string[]): string {
    const baseSelect = select.join(', ');
    const relations = include
      .map(relation => {
        switch (relation) {
          case 'contact_user':
            return 'contact_user:users!contacts_contact_user_id_fkey(id,email,role,is_verified,last_login,created_at)';
          case 'contact_profile':
            return 'contact_profile:profiles!contacts_contact_user_id_fkey(first_name,last_name,phone,avatar_url,bio)';
          case 'interactions':
            return 'interactions:contact_interactions(id,interaction_type,interaction_data,interaction_notes,created_at)';
          case 'messages':
            return 'messages:contact_messages(id,message_type,message_content,is_read,created_at)';
          case 'notes':
            return 'notes:contact_notes(id,note_content,note_type,tags,is_important,created_at)';
          case 'reminders':
            return 'reminders:contact_reminders(id,reminder_type,reminder_date,reminder_message,is_completed,created_at)';
          default:
            return '';
        }
      })
      .filter(Boolean);

    return [baseSelect, ...relations].join(',');
  }

  private applyFilters(query: any, filters: Record<string, any>) {
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        if (Array.isArray(value)) {
          query = query.in(key, value);
        } else if (typeof value === 'string' && value.includes('%')) {
          query = query.ilike(key, value);
        } else {
          query = query.eq(key, value);
        }
      }
    });
    return query;
  }

  private applyOrdering(
    query: any,
    orderBy: { column: string; ascending?: boolean }[]
  ) {
    orderBy.forEach(({ column, ascending = false }) => {
      query = query.order(column, { ascending });
    });
    return query;
  }
}

// Global query optimizer instance
export const queryOptimizer = new QueryOptimizer();
