export interface PaginationOptions {
  page: number;
  limit: number;
  maxLimit?: number;
}

export interface PaginatedResult<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export class PaginationHelper {
  static validateOptions(options: PaginationOptions): PaginationOptions {
    const { page, limit, maxLimit = 100 } = options;

    return {
      page: Math.max(1, Math.floor(page)),
      limit: Math.min(Math.max(1, Math.floor(limit)), maxLimit),
      maxLimit,
    };
  }

  static calculateOffset(page: number, limit: number): number {
    return (page - 1) * limit;
  }

  static calculateTotalPages(total: number, limit: number): number {
    return Math.ceil(total / limit);
  }

  static createPaginatedResult<T>(
    data: T[],
    total: number,
    page: number,
    limit: number
  ): PaginatedResult<T> {
    const totalPages = this.calculateTotalPages(total, limit);

    return {
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    };
  }

  static createCursorPagination<T>(
    data: T[],
    limit: number,
    cursor?: string
  ): {
    data: T[];
    nextCursor?: string;
    hasNext: boolean;
  } {
    if (data.length <= limit) {
      return {
        data,
        hasNext: false,
      };
    }

    // Remove the extra item used for pagination
    const actualData = data.slice(0, limit);
    const nextCursor = data[limit]?.id || undefined;

    return {
      data: actualData,
      nextCursor,
      hasNext: data.length > limit,
    };
  }
}

// Cursor-based pagination for better performance with large datasets
export class CursorPagination {
  private cursor?: string;
  private limit: number;
  private direction: 'asc' | 'desc';

  constructor(limit: number = 20, direction: 'asc' | 'desc' = 'desc') {
    this.limit = limit;
    this.direction = direction;
  }

  setCursor(cursor?: string) {
    this.cursor = cursor;
  }

  getQueryOptions() {
    return {
      limit: this.limit + 1, // Get one extra to determine if there's a next page
      cursor: this.cursor,
      direction: this.direction,
    };
  }

  processResults<T extends { id: string; created_at: string }>(results: T[]) {
    const hasNext = results.length > this.limit;
    const data = hasNext ? results.slice(0, this.limit) : results;
    const nextCursor = hasNext ? data[data.length - 1]?.id : undefined;

    return {
      data,
      nextCursor,
      hasNext,
    };
  }
}

// Efficient pagination for CRM data
export class CRMPagination {
  static async paginateContacts(
    supabase: any,
    userId: string,
    options: PaginationOptions,
    filters: Record<string, any> = {}
  ) {
    const { page, limit } = PaginationHelper.validateOptions(options);
    const offset = PaginationHelper.calculateOffset(page, limit);

    // Build base query
    let baseQuery = supabase.from('contacts').eq('user_id', userId);

    // Apply filters
    if (filters.contact_type) {
      baseQuery = baseQuery.eq('contact_type', filters.contact_type);
    }
    if (filters.relationship_status) {
      baseQuery = baseQuery.eq(
        'relationship_status',
        filters.relationship_status
      );
    }

    // Get total count in parallel with data
    const [countResult, dataResult] = await Promise.all([
      baseQuery.select('*', { count: 'exact', head: true }),
      baseQuery
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
        .order('last_interaction', { ascending: false, nullsLast: true })
        .range(offset, offset + limit - 1),
    ]);

    if (countResult.error) {
      throw new Error(`Count query failed: ${countResult.error.message}`);
    }

    if (dataResult.error) {
      throw new Error(`Data query failed: ${dataResult.error.message}`);
    }

    return PaginationHelper.createPaginatedResult(
      dataResult.data || [],
      countResult.count || 0,
      page,
      limit
    );
  }

  static async paginateInteractions(
    supabase: any,
    userId: string,
    contactId: string,
    options: PaginationOptions
  ) {
    const { page, limit } = PaginationHelper.validateOptions(options);
    const offset = PaginationHelper.calculateOffset(page, limit);

    // Get total count in parallel with data
    const [countResult, dataResult] = await Promise.all([
      supabase
        .from('contact_interactions')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('contact_id', contactId),
      supabase
        .from('contact_interactions')
        .select('*')
        .eq('user_id', userId)
        .eq('contact_id', contactId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1),
    ]);

    if (countResult.error) {
      throw new Error(`Count query failed: ${countResult.error.message}`);
    }

    if (dataResult.error) {
      throw new Error(`Data query failed: ${dataResult.error.message}`);
    }

    return PaginationHelper.createPaginatedResult(
      dataResult.data || [],
      countResult.count || 0,
      page,
      limit
    );
  }

  static async paginateMessages(
    supabase: any,
    userId: string,
    contactId: string,
    options: PaginationOptions
  ) {
    const { page, limit } = PaginationHelper.validateOptions(options);
    const offset = PaginationHelper.calculateOffset(page, limit);

    // Get total count in parallel with data
    const [countResult, dataResult] = await Promise.all([
      supabase
        .from('contact_messages')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('contact_id', contactId),
      supabase
        .from('contact_messages')
        .select('*')
        .eq('user_id', userId)
        .eq('contact_id', contactId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1),
    ]);

    if (countResult.error) {
      throw new Error(`Count query failed: ${countResult.error.message}`);
    }

    if (dataResult.error) {
      throw new Error(`Data query failed: ${dataResult.error.message}`);
    }

    return PaginationHelper.createPaginatedResult(
      dataResult.data || [],
      countResult.count || 0,
      page,
      limit
    );
  }

  static async paginateNotes(
    supabase: any,
    userId: string,
    contactId: string,
    options: PaginationOptions
  ) {
    const { page, limit } = PaginationHelper.validateOptions(options);
    const offset = PaginationHelper.calculateOffset(page, limit);

    // Get total count in parallel with data
    const [countResult, dataResult] = await Promise.all([
      supabase
        .from('contact_notes')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('contact_id', contactId),
      supabase
        .from('contact_notes')
        .select('*')
        .eq('user_id', userId)
        .eq('contact_id', contactId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1),
    ]);

    if (countResult.error) {
      throw new Error(`Count query failed: ${countResult.error.message}`);
    }

    if (dataResult.error) {
      throw new Error(`Data query failed: ${dataResult.error.message}`);
    }

    return PaginationHelper.createPaginatedResult(
      dataResult.data || [],
      countResult.count || 0,
      page,
      limit
    );
  }

  static async paginateReminders(
    supabase: any,
    userId: string,
    contactId: string,
    options: PaginationOptions
  ) {
    const { page, limit } = PaginationHelper.validateOptions(options);
    const offset = PaginationHelper.calculateOffset(page, limit);

    // Get total count in parallel with data
    const [countResult, dataResult] = await Promise.all([
      supabase
        .from('contact_reminders')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('contact_id', contactId),
      supabase
        .from('contact_reminders')
        .select('*')
        .eq('user_id', userId)
        .eq('contact_id', contactId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1),
    ]);

    if (countResult.error) {
      throw new Error(`Count query failed: ${countResult.error.message}`);
    }

    if (dataResult.error) {
      throw new Error(`Data query failed: ${dataResult.error.message}`);
    }

    return PaginationHelper.createPaginatedResult(
      dataResult.data || [],
      countResult.count || 0,
      page,
      limit
    );
  }
}
