import { createClient } from '@/lib/supabase/server';

export interface FeatureAccessCacheConfig {
  ttl: number; // Time to live in seconds
  maxSize: number; // Maximum cache size
  cleanupInterval: number; // Cleanup interval in seconds
}

export interface CachedFeatureAccess {
  validation: any;
  timestamp: number;
  ttl: number;
  accessCount: number;
  lastAccessed: number;
}

/**
 * Feature Access Cache Service
 * Implements in-memory caching with TTL and size limits for feature access data
 * This addresses the performance concern by caching frequently accessed data
 */
export class FeatureAccessCacheService {
  private static cache = new Map<string, CachedFeatureAccess>();
  private static config: FeatureAccessCacheConfig = {
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
   * Generate cache key for feature access data
   */
  private static generateCacheKey(
    userId: string,
    featureName: string,
    tier?: string
  ): string {
    return `feature_access:${userId}:${featureName}:${tier || 'all'}`;
  }

  /**
   * Get cached feature access validation
   */
  static getCachedFeatureAccess(
    userId: string,
    featureName: string,
    tier?: string
  ): any | null {
    const key = this.generateCacheKey(userId, featureName, tier);
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

    return entry.validation;
  }

  /**
   * Set cached feature access validation
   */
  static setCachedFeatureAccess(
    userId: string,
    featureName: string,
    validation: any,
    tier?: string,
    ttl?: number
  ): void {
    const key = this.generateCacheKey(userId, featureName, tier);

    // Check cache size limit
    if (this.cache.size >= this.config.maxSize) {
      this.evictLeastRecentlyUsed();
    }

    const now = Date.now();
    this.cache.set(key, {
      validation,
      timestamp: now,
      ttl: ttl || this.config.ttl,
      accessCount: 0,
      lastAccessed: now,
    });
  }

  /**
   * Get cached subscription data
   */
  static getCachedSubscription(userId: string): any | null {
    const key = `subscription:${userId}`;
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

    return entry.validation;
  }

  /**
   * Set cached subscription data
   */
  static setCachedSubscription(
    userId: string,
    subscription: any,
    ttl?: number
  ): void {
    const key = `subscription:${userId}`;

    // Check cache size limit
    if (this.cache.size >= this.config.maxSize) {
      this.evictLeastRecentlyUsed();
    }

    const now = Date.now();
    this.cache.set(key, {
      validation: subscription,
      timestamp: now,
      ttl: ttl || this.config.ttl,
      accessCount: 0,
      lastAccessed: now,
    });
  }

  /**
   * Get cached tier features
   */
  static getCachedTierFeatures(tier: string): any[] | null {
    const key = `tier_features:${tier}`;
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

    return entry.validation;
  }

  /**
   * Set cached tier features
   */
  static setCachedTierFeatures(
    tier: string,
    features: any[],
    ttl?: number
  ): void {
    const key = `tier_features:${tier}`;

    // Check cache size limit
    if (this.cache.size >= this.config.maxSize) {
      this.evictLeastRecentlyUsed();
    }

    const now = Date.now();
    this.cache.set(key, {
      validation: features,
      timestamp: now,
      ttl: ttl || this.config.ttl,
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
      console.log(`Cleaned up ${expiredKeys.length} expired cache entries`);
    }
  }

  /**
   * Invalidate cache for a specific user
   */
  static invalidateUserCache(userId: string): void {
    const keysToDelete: string[] = [];

    for (const key of this.cache.keys()) {
      if (
        key.includes(`:${userId}:`) ||
        key.includes(`subscription:${userId}`)
      ) {
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach(key => this.cache.delete(key));

    if (keysToDelete.length > 0) {
      console.log(
        `Invalidated ${keysToDelete.length} cache entries for user ${userId}`
      );
    }
  }

  /**
   * Invalidate cache for a specific feature
   */
  static invalidateFeatureCache(featureName: string): void {
    const keysToDelete: string[] = [];

    for (const key of this.cache.keys()) {
      if (key.includes(`:${featureName}:`)) {
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach(key => this.cache.delete(key));

    if (keysToDelete.length > 0) {
      console.log(
        `Invalidated ${keysToDelete.length} cache entries for feature ${featureName}`
      );
    }
  }

  /**
   * Invalidate all cache entries
   */
  static invalidateAllCache(): void {
    const size = this.cache.size;
    this.cache.clear();
    console.log(`Invalidated all ${size} cache entries`);
  }

  /**
   * Get cache statistics
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
   */
  static configure(config: Partial<FeatureAccessCacheConfig>): void {
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
    console.log('Feature Access Cache Service initialized');
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
    console.log('Feature Access Cache Service shutdown');
  }
}

// Initialize cache service on module load
FeatureAccessCacheService.initialize();
