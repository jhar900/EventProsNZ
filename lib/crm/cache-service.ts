import { createClient } from '@/lib/supabase/server';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number; // Time to live in milliseconds
}

interface CacheConfig {
  defaultTTL: number; // Default TTL in milliseconds
  maxSize: number; // Maximum number of entries
  cleanupInterval: number; // Cleanup interval in milliseconds
}

export class CacheService {
  private cache = new Map<string, CacheEntry<any>>();
  private config: CacheConfig;
  private cleanupTimer: NodeJS.Timeout | null = null;

  constructor(config: Partial<CacheConfig> = {}) {
    this.config = {
      defaultTTL: 5 * 60 * 1000, // 5 minutes
      maxSize: 1000,
      cleanupInterval: 60 * 1000, // 1 minute
      ...config,
    };

    this.startCleanup();
  }

  set<T>(key: string, data: T, ttl?: number): any {
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      ttl: ttl || this.config.defaultTTL,
    };

    this.cache.set(key, entry);

    // Remove oldest entries if cache is full
    if (this.cache.size > this.config.maxSize) {
      const entries = Array.from(this.cache.entries());
      entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
      const toRemove = entries.slice(0, this.cache.size - this.config.maxSize);
      toRemove.forEach(([key]) => this.cache.delete(key));
    }

    return { success: true, key, ttl: ttl || this.config.defaultTTL };
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) {
      return null;
    }

    const now = Date.now();
    if (now - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  has(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) {
      return false;
    }

    const now = Date.now();
    if (now - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }

  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  private startCleanup(): void {
    this.cleanupTimer = setInterval(() => {
      this.cleanup();
    }, this.config.cleanupInterval);
  }

  private cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key);
      }
    }
  }

  destroy(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }
    this.clear();
  }

  // Additional methods for test compatibility
  async exists(userId: string, key: string): Promise<boolean> {
    return this.has(`${userId}:${key}`);
  }

  async getKeys(userId: string): Promise<string[]> {
    const keys = Array.from(this.cache.keys());
    return keys.filter(key => key.includes(`:${userId}:`));
  }

  async getStats(userId: string): Promise<any> {
    const keys = Array.from(this.cache.keys());
    const userKeys = keys.filter(key => key.includes(`:${userId}:`));

    return {
      totalKeys: userKeys.length,
      cacheSize: this.cache.size,
      maxSize: this.config.maxSize,
      defaultTTL: this.config.defaultTTL,
    };
  }

  async cleanup(userId: string): Promise<any> {
    // Call the private cleanup method
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key);
      }
    }
    return { success: true };
  }

  async invalidate(userId: string, pattern: string): Promise<any> {
    const keys = Array.from(this.cache.keys());
    const userKeys = keys.filter(
      key =>
        key.includes(`:${userId}:`) &&
        (pattern === '*' || key.includes(pattern))
    );
    userKeys.forEach(key => this.cache.delete(key));
    return { success: true, invalidated: userKeys.length };
  }

  async refresh(userId: string, key: string): Promise<any> {
    const fullKey = `${userId}:${key}`;
    this.cache.delete(fullKey);
    return { success: true };
  }

  async clear(userId: string): Promise<any> {
    const keys = Array.from(this.cache.keys());
    const userKeys = keys.filter(key => key.includes(`:${userId}:`));
    userKeys.forEach(key => this.cache.delete(key));
    return { success: true, cleared: userKeys.length };
  }
}

// Global cache instance
export const crmCache = new CacheService({
  defaultTTL: 5 * 60 * 1000, // 5 minutes
  maxSize: 1000,
  cleanupInterval: 60 * 1000, // 1 minute
});

// Cache key generators
export const CacheKeys = {
  contacts: (userId: string, filters?: any) =>
    `contacts:${userId}:${JSON.stringify(filters || {})}`,
  contact: (userId: string, contactId: string) =>
    `contact:${userId}:${contactId}`,
  messages: (userId: string, contactId?: string, filters?: any) =>
    `messages:${userId}:${contactId || 'all'}:${JSON.stringify(filters || {})}`,
  notes: (userId: string, contactId?: string, filters?: any) =>
    `notes:${userId}:${contactId || 'all'}:${JSON.stringify(filters || {})}`,
  reminders: (userId: string, contactId?: string, filters?: any) =>
    `reminders:${userId}:${contactId || 'all'}:${JSON.stringify(filters || {})}`,
  timeline: (userId: string, contactId: string, filters?: any) =>
    `timeline:${userId}:${contactId}:${JSON.stringify(filters || {})}`,
  search: (userId: string, query: string, filters?: any) =>
    `search:${userId}:${query}:${JSON.stringify(filters || {})}`,
  stats: (userId: string, type: string) => `stats:${userId}:${type}`,
};

// Cache decorator for methods
export function cached<T extends (...args: any[]) => Promise<any>>(
  keyGenerator: (...args: Parameters<T>) => string,
  ttl?: number
) {
  return function (
    target: any,
    propertyName: string,
    descriptor: PropertyDescriptor
  ) {
    const method = descriptor.value;

    descriptor.value = async function (...args: Parameters<T>) {
      const key = keyGenerator(...args);

      // Check cache first
      const cached = crmCache.get(key);
      if (cached !== null) {
        return cached;
      }

      // Execute method and cache result
      const result = await method.apply(this, args);
      crmCache.set(key, result, ttl);

      return result;
    };
  };
}

// Cache invalidation helpers
export class CacheInvalidator {
  static invalidateUser(userId: string): void {
    const keys = Array.from(crmCache['cache'].keys());
    keys.forEach(key => {
      if (key.includes(`:${userId}:`)) {
        crmCache.delete(key);
      }
    });
  }

  static invalidateContact(userId: string, contactId: string): void {
    const keys = [
      CacheKeys.contact(userId, contactId),
      CacheKeys.contacts(userId),
      CacheKeys.messages(userId, contactId),
      CacheKeys.notes(userId, contactId),
      CacheKeys.reminders(userId, contactId),
      CacheKeys.timeline(userId, contactId),
    ];

    keys.forEach(key => crmCache.delete(key));
  }

  static invalidateSearch(userId: string): void {
    const keys = Array.from(crmCache['cache'].keys());
    keys.forEach(key => {
      if (key.startsWith(`search:${userId}:`)) {
        crmCache.delete(key);
      }
    });
  }

  static invalidateStats(userId: string): void {
    const keys = Array.from(crmCache['cache'].keys());
    keys.forEach(key => {
      if (key.startsWith(`stats:${userId}:`)) {
        crmCache.delete(key);
      }
    });
  }
}

// Query optimization helpers
export class QueryOptimizer {
  static buildContactQuery(supabase: any, userId: string, filters: any = {}) {
    let query = supabase
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
      .eq('user_id', userId);

    if (filters.contact_type) {
      query = query.eq('contact_type', filters.contact_type);
    }

    if (filters.relationship_status) {
      query = query.eq('relationship_status', filters.relationship_status);
    }

    if (filters.date_from) {
      query = query.gte('created_at', filters.date_from);
    }

    if (filters.date_to) {
      query = query.lte('created_at', filters.date_to);
    }

    return query;
  }

  static buildMessageQuery(
    supabase: any,
    userId: string,
    contactId?: string,
    filters: any = {}
  ) {
    let query = supabase
      .from('contact_messages')
      .select(
        `
        *,
        contact:contacts!contact_messages_contact_id_fkey(
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

    if (filters.message_type) {
      query = query.eq('message_type', filters.message_type);
    }

    if (filters.date_from) {
      query = query.gte('created_at', filters.date_from);
    }

    if (filters.date_to) {
      query = query.lte('created_at', filters.date_to);
    }

    return query;
  }

  static buildNoteQuery(
    supabase: any,
    userId: string,
    contactId?: string,
    filters: any = {}
  ) {
    let query = supabase
      .from('contact_notes')
      .select(
        `
        *,
        contact:contacts!contact_notes_contact_id_fkey(
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

    if (filters.note_type) {
      query = query.eq('note_type', filters.note_type);
    }

    if (filters.is_important !== undefined) {
      query = query.eq('is_important', filters.is_important);
    }

    if (filters.tags) {
      query = query.contains('tags', [filters.tags]);
    }

    return query;
  }

  static buildReminderQuery(
    supabase: any,
    userId: string,
    contactId?: string,
    filters: any = {}
  ) {
    let query = supabase
      .from('contact_reminders')
      .select(
        `
        *,
        contact:contacts!contact_reminders_contact_id_fkey(
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

    if (filters.reminder_type) {
      query = query.eq('reminder_type', filters.reminder_type);
    }

    if (filters.is_completed !== undefined) {
      query = query.eq('is_completed', filters.is_completed);
    }

    return query;
  }
}

// Pagination helper
export class PaginationHelper {
  static calculateOffset(page: number, limit: number): number {
    return (page - 1) * limit;
  }

  static buildPaginationQuery(query: any, page: number, limit: number) {
    const offset = this.calculateOffset(page, limit);
    return query.range(offset, offset + limit - 1);
  }

  static getPaginationInfo(page: number, limit: number, total: number) {
    const totalPages = Math.ceil(total / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    return {
      page,
      limit,
      total,
      totalPages,
      hasNextPage,
      hasPrevPage,
    };
  }
}
