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

export class CRMCache {
  private cache = new Map<string, CacheEntry<any>>();
  private config: CacheConfig;

  constructor(config: Partial<CacheConfig> = {}) {
    this.config = {
      defaultTTL: 5 * 60 * 1000, // 5 minutes
      maxSize: 1000,
      cleanupInterval: 60 * 1000, // 1 minute
      ...config,
    };

    // Start cleanup interval
    setInterval(() => this.cleanup(), this.config.cleanupInterval);
  }

  async get<T>(key: string): Promise<T | null> {
    const entry = this.cache.get(key);

    if (!entry) {
      return null;
    }

    // Check if entry has expired
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  async set<T>(key: string, data: T, ttl?: number): Promise<void> {
    // Remove oldest entries if cache is full
    if (this.cache.size >= this.config.maxSize) {
      const oldestKey = this.cache.keys().next().value;
      this.cache.delete(oldestKey);
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttl || this.config.defaultTTL,
    });
  }

  async delete(key: string): Promise<void> {
    this.cache.delete(key);
  }

  async clear(): Promise<void> {
    this.cache.clear();
  }

  private cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key);
      }
    }
  }

  // Generate cache keys for different CRM operations
  static generateKey(operation: string, params: Record<string, any>): string {
    const sortedParams = Object.keys(params)
      .sort()
      .map(key => `${key}:${params[key]}`)
      .join('|');
    return `crm:${operation}:${sortedParams}`;
  }
}

// Global cache instance
export const crmCache = new CRMCache({
  defaultTTL: 5 * 60 * 1000, // 5 minutes
  maxSize: 1000,
});

// Cache decorator for CRM operations
export function withCache<T extends any[], R>(operation: string, ttl?: number) {
  return function (
    target: any,
    propertyName: string,
    descriptor: PropertyDescriptor
  ) {
    const method = descriptor.value;

    descriptor.value = async function (...args: T): Promise<R> {
      const cacheKey = CRMCache.generateKey(operation, {
        args: JSON.stringify(args),
      });

      // Try to get from cache
      const cached = await crmCache.get<R>(cacheKey);
      if (cached) {
        return cached;
      }

      // Execute method and cache result
      const result = await method.apply(this, args);
      await crmCache.set(cacheKey, result, ttl);

      return result;
    };
  };
}

// CRM-specific cache operations
export class CRMDataCache {
  private cache: CRMCache;

  constructor() {
    this.cache = new CRMCache({
      defaultTTL: 5 * 60 * 1000, // 5 minutes
      maxSize: 500,
    });
  }

  async getContacts(userId: string, filters?: any) {
    const key = CRMCache.generateKey('contacts', { userId, ...filters });
    return this.cache.get(key);
  }

  async setContacts(
    userId: string,
    contacts: any[],
    filters?: any,
    ttl?: number
  ) {
    const key = CRMCache.generateKey('contacts', { userId, ...filters });
    return this.cache.set(key, contacts, ttl);
  }

  async getContact(userId: string, contactId: string) {
    const key = CRMCache.generateKey('contact', { userId, contactId });
    return this.cache.get(key);
  }

  async setContact(
    userId: string,
    contactId: string,
    contact: any,
    ttl?: number
  ) {
    const key = CRMCache.generateKey('contact', { userId, contactId });
    return this.cache.set(key, contact, ttl);
  }

  async getInteractions(userId: string, contactId?: string) {
    const key = CRMCache.generateKey('interactions', { userId, contactId });
    return this.cache.get(key);
  }

  async setInteractions(
    userId: string,
    interactions: any[],
    contactId?: string,
    ttl?: number
  ) {
    const key = CRMCache.generateKey('interactions', { userId, contactId });
    return this.cache.set(key, interactions, ttl);
  }

  async getMessages(userId: string, contactId?: string) {
    const key = CRMCache.generateKey('messages', { userId, contactId });
    return this.cache.get(key);
  }

  async setMessages(
    userId: string,
    messages: any[],
    contactId?: string,
    ttl?: number
  ) {
    const key = CRMCache.generateKey('messages', { userId, contactId });
    return this.cache.set(key, messages, ttl);
  }

  async getNotes(userId: string, contactId?: string) {
    const key = CRMCache.generateKey('notes', { userId, contactId });
    return this.cache.get(key);
  }

  async setNotes(
    userId: string,
    notes: any[],
    contactId?: string,
    ttl?: number
  ) {
    const key = CRMCache.generateKey('notes', { userId, contactId });
    return this.cache.set(key, notes, ttl);
  }

  async getReminders(userId: string, contactId?: string) {
    const key = CRMCache.generateKey('reminders', { userId, contactId });
    return this.cache.get(key);
  }

  async setReminders(
    userId: string,
    reminders: any[],
    contactId?: string,
    ttl?: number
  ) {
    const key = CRMCache.generateKey('reminders', { userId, contactId });
    return this.cache.set(key, reminders, ttl);
  }

  async getTimeline(userId: string, contactId: string) {
    const key = CRMCache.generateKey('timeline', { userId, contactId });
    return this.cache.get(key);
  }

  async setTimeline(
    userId: string,
    contactId: string,
    timeline: any[],
    ttl?: number
  ) {
    const key = CRMCache.generateKey('timeline', { userId, contactId });
    return this.cache.set(key, timeline, ttl);
  }

  // Invalidate cache entries
  async invalidateContact(userId: string, contactId: string) {
    const keys = [
      CRMCache.generateKey('contact', { userId, contactId }),
      CRMCache.generateKey('contacts', { userId }),
      CRMCache.generateKey('interactions', { userId, contactId }),
      CRMCache.generateKey('messages', { userId, contactId }),
      CRMCache.generateKey('notes', { userId, contactId }),
      CRMCache.generateKey('reminders', { userId, contactId }),
      CRMCache.generateKey('timeline', { userId, contactId }),
    ];

    for (const key of keys) {
      await this.cache.delete(key);
    }
  }

  async invalidateUser(userId: string) {
    // This is a simplified version - in production, you'd want to use pattern matching
    await this.cache.clear();
  }
}

// Global CRM data cache instance
export const crmDataCache = new CRMDataCache();
