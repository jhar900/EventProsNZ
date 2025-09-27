import { createClient } from '@/lib/supabase/server';

/**
 * Cache configuration
 */
interface CacheConfig {
  ttl: number; // Time to live in seconds
  maxSize: number; // Maximum cache size
  cleanupInterval: number; // Cleanup interval in seconds
}

/**
 * Cache entry interface
 */
interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
  accessCount: number;
  lastAccessed: number;
}

/**
 * Dashboard cache service for performance optimization
 * Implements in-memory caching with TTL and size limits
 */
export class DashboardCacheService {
  private static cache = new Map<string, CacheEntry<any>>();
  private static config: CacheConfig = {
    ttl: 300, // 5 minutes
    maxSize: 1000,
    cleanupInterval: 600, // 10 minutes
  };
  private static cleanupTimer: NodeJS.Timeout | null = null;

  /**
   * Initialize cache cleanup timer
   */
  private static initializeCleanup(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
    }

    this.cleanupTimer = setInterval(() => {
      this.cleanup();
    }, this.config.cleanupInterval * 1000);
  }

  /**
   * Generate cache key for dashboard data
   * @param userId - User ID
   * @param period - Time period
   * @param page - Page number
   * @param limit - Results limit
   * @returns Cache key
   */
  private static generateCacheKey(
    userId: string,
    period: string,
    page: number,
    limit: number
  ): string {
    return `dashboard:${userId}:${period}:${page}:${limit}`;
  }

  /**
   * Get data from cache
   * @param key - Cache key
   * @returns Cached data or null if not found/expired
   */
  private static get<T>(key: string): T | null {
    const entry = this.cache.get(key);

    if (!entry) {
      return null;
    }

    // Check if entry has expired
    const now = Date.now();
    if (now - entry.timestamp > entry.ttl * 1000) {
      this.cache.delete(key);
      return null;
    }

    // Update access statistics
    entry.accessCount++;
    entry.lastAccessed = now;

    return entry.data;
  }

  /**
   * Set data in cache
   * @param key - Cache key
   * @param data - Data to cache
   * @param ttl - Time to live in seconds
   */
  private static set<T>(
    key: string,
    data: T,
    ttl: number = this.config.ttl
  ): void {
    // Check cache size limit
    if (this.cache.size >= this.config.maxSize) {
      this.evictLeastRecentlyUsed();
    }

    const now = Date.now();
    this.cache.set(key, {
      data,
      timestamp: now,
      ttl,
      accessCount: 0,
      lastAccessed: now,
    });
  }

  /**
   * Evict least recently used entries
   */
  private static evictLeastRecentlyUsed(): void {
    const entries = Array.from(this.cache.entries());
    entries.sort((a, b) => a[1].lastAccessed - b[1].lastAccessed);

    // Remove 10% of entries (or at least 1)
    const toRemove = Math.max(1, Math.floor(entries.length * 0.1));
    for (let i = 0; i < toRemove; i++) {
      this.cache.delete(entries[i][0]);
    }
  }

  /**
   * Clean up expired entries
   */
  private static cleanup(): void {
    const now = Date.now();
    const expiredKeys: string[] = [];

    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl * 1000) {
        expiredKeys.push(key);
      }
    }

    expiredKeys.forEach(key => this.cache.delete(key));

    if (expiredKeys.length > 0) {
      }
  }

  /**
   * Get cached dashboard data
   * @param userId - User ID
   * @param period - Time period
   * @param page - Page number
   * @param limit - Results limit
   * @returns Cached dashboard data or null
   */
  static async getCachedDashboardData(
    userId: string,
    period: string,
    page: number,
    limit: number
  ): Promise<any | null> {
    const key = this.generateCacheKey(userId, period, page, limit);
    return this.get(key);
  }

  /**
   * Set cached dashboard data
   * @param userId - User ID
   * @param period - Time period
   * @param page - Page number
   * @param limit - Results limit
   * @param data - Dashboard data to cache
   * @param ttl - Time to live in seconds
   */
  static async setCachedDashboardData(
    userId: string,
    period: string,
    page: number,
    limit: number,
    data: any,
    ttl?: number
  ): Promise<void> {
    const key = this.generateCacheKey(userId, period, page, limit);
    this.set(key, data, ttl);
  }

  /**
   * Invalidate cache for a specific user
   * @param userId - User ID
   */
  static async invalidateUserCache(userId: string): Promise<void> {
    const keysToDelete: string[] = [];

    for (const key of this.cache.keys()) {
      if (key.includes(`:${userId}:`)) {
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach(key => this.cache.delete(key));

    if (keysToDelete.length > 0) {
      }
  }

  /**
   * Invalidate all cache entries
   */
  static async invalidateAllCache(): Promise<void> {
    const size = this.cache.size;
    this.cache.clear();
    }

  /**
   * Get cache statistics
   * @returns Cache statistics
   */
  static getCacheStatistics(): {
    size: number;
    maxSize: number;
    hitRate: number;
    entries: Array<{
      key: string;
      age: number;
      accessCount: number;
      ttl: number;
    }>;
  } {
    const now = Date.now();
    const entries = Array.from(this.cache.entries()).map(([key, entry]) => ({
      key,
      age: now - entry.timestamp,
      accessCount: entry.accessCount,
      ttl: entry.ttl,
    }));

    // Calculate hit rate (simplified - would need to track hits/misses)
    const totalAccesses = entries.reduce(
      (sum, entry) => sum + entry.accessCount,
      0
    );
    const hitRate =
      totalAccesses > 0 ? totalAccesses / (totalAccesses + this.cache.size) : 0;

    return {
      size: this.cache.size,
      maxSize: this.config.maxSize,
      hitRate,
      entries,
    };
  }

  /**
   * Configure cache settings
   * @param config - Cache configuration
   */
  static configure(config: Partial<CacheConfig>): void {
    this.config = { ...this.config, ...config };

    // Restart cleanup timer if interval changed
    if (config.cleanupInterval) {
      this.initializeCleanup();
    }
  }

  /**
   * Initialize cache service
   */
  static initialize(): void {
    this.initializeCleanup();
    }

  /**
   * Shutdown cache service
   */
  static shutdown(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }
    this.cache.clear();
    }
}

/**
 * Event cache service for individual event data
 */
export class EventCacheService {
  private static cache = new Map<string, CacheEntry<any>>();
  private static config: CacheConfig = {
    ttl: 600, // 10 minutes
    maxSize: 500,
    cleanupInterval: 300, // 5 minutes
  };

  /**
   * Get cached event data
   * @param eventId - Event ID
   * @returns Cached event data or null
   */
  static async getCachedEventData(eventId: string): Promise<any | null> {
    const key = `event:${eventId}`;
    const entry = this.cache.get(key);

    if (!entry) {
      return null;
    }

    // Check if entry has expired
    const now = Date.now();
    if (now - entry.timestamp > entry.config.ttl * 1000) {
      this.cache.delete(key);
      return null;
    }

    // Update access statistics
    entry.accessCount++;
    entry.lastAccessed = now;

    return entry.data;
  }

  /**
   * Set cached event data
   * @param eventId - Event ID
   * @param data - Event data to cache
   * @param ttl - Time to live in seconds
   */
  static async setCachedEventData(
    eventId: string,
    data: any,
    ttl: number = this.config.ttl
  ): Promise<void> {
    const key = `event:${eventId}`;

    // Check cache size limit
    if (this.cache.size >= this.config.maxSize) {
      this.evictLeastRecentlyUsed();
    }

    const now = Date.now();
    this.cache.set(key, {
      data,
      timestamp: now,
      ttl,
      accessCount: 0,
      lastAccessed: now,
    });
  }

  /**
   * Invalidate cache for a specific event
   * @param eventId - Event ID
   */
  static async invalidateEventCache(eventId: string): Promise<void> {
    const key = `event:${eventId}`;
    this.cache.delete(key);
  }

  /**
   * Evict least recently used entries
   */
  private static evictLeastRecentlyUsed(): void {
    const entries = Array.from(this.cache.entries());
    entries.sort((a, b) => a[1].lastAccessed - b[1].lastAccessed);

    // Remove 10% of entries (or at least 1)
    const toRemove = Math.max(1, Math.floor(entries.length * 0.1));
    for (let i = 0; i < toRemove; i++) {
      this.cache.delete(entries[i][0]);
    }
  }
}

// Initialize cache service on module load
DashboardCacheService.initialize();
