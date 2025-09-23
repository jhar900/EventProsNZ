/**
 * AI Recommendations Cache Utility
 * Provides centralized caching for AI-related API endpoints
 */

interface CacheEntry<T = any> {
  data: T;
  timestamp: number;
  ttl: number;
  key: string;
}

interface CacheStats {
  hits: number;
  misses: number;
  size: number;
  totalRequests: number;
}

class AICache {
  private cache = new Map<string, CacheEntry>();
  private stats: CacheStats = {
    hits: 0,
    misses: 0,
    size: 0,
    totalRequests: 0,
  };

  // Default TTL values (in milliseconds)
  private readonly DEFAULT_TTL = {
    recommendations: 60 * 60 * 1000, // 1 hour
    abTests: 30 * 60 * 1000, // 30 minutes
    analytics: 15 * 60 * 1000, // 15 minutes
    userPreferences: 10 * 60 * 1000, // 10 minutes
    learningInsights: 5 * 60 * 1000, // 5 minutes
  };

  /**
   * Generate a cache key from parameters
   */
  generateKey(prefix: string, ...params: (string | number | object)[]): string {
    const paramString = params
      .map(param =>
        typeof param === 'object'
          ? JSON.stringify(param, Object.keys(param).sort())
          : String(param)
      )
      .join(':');

    return `${prefix}:${paramString}`;
  }

  /**
   * Get data from cache
   */
  get<T>(key: string): T | null {
    this.stats.totalRequests++;

    const entry = this.cache.get(key);
    if (!entry) {
      this.stats.misses++;
      return null;
    }

    // Check if entry has expired
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      this.stats.misses++;
      this.stats.size--;
      return null;
    }

    this.stats.hits++;
    return entry.data as T;
  }

  /**
   * Set data in cache
   */
  set<T>(key: string, data: T, ttl?: number): void {
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      ttl: ttl || this.DEFAULT_TTL.recommendations,
      key,
    };

    // If key already exists, update size
    if (!this.cache.has(key)) {
      this.stats.size++;
    }

    this.cache.set(key, entry);
  }

  /**
   * Set data with specific cache type TTL
   */
  setWithType<T>(
    key: string,
    data: T,
    type: keyof typeof this.DEFAULT_TTL
  ): void {
    this.set(key, data, this.DEFAULT_TTL[type]);
  }

  /**
   * Delete specific key from cache
   */
  delete(key: string): boolean {
    const existed = this.cache.delete(key);
    if (existed) {
      this.stats.size--;
    }
    return existed;
  }

  /**
   * Clear cache entries matching a pattern
   */
  clearByPattern(pattern: string): number {
    let deletedCount = 0;
    const keysToDelete: string[] = [];

    for (const key of this.cache.keys()) {
      if (key.includes(pattern)) {
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach(key => {
      if (this.cache.delete(key)) {
        deletedCount++;
        this.stats.size--;
      }
    });

    return deletedCount;
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    this.cache.clear();
    this.stats.size = 0;
  }

  /**
   * Get cache statistics
   */
  getStats(): CacheStats & { hitRate: number } {
    return {
      ...this.stats,
      hitRate:
        this.stats.totalRequests > 0
          ? this.stats.hits / this.stats.totalRequests
          : 0,
    };
  }

  /**
   * Clean up expired entries
   */
  cleanup(): number {
    const now = Date.now();
    let deletedCount = 0;
    const keysToDelete: string[] = [];

    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach(key => {
      if (this.cache.delete(key)) {
        deletedCount++;
        this.stats.size--;
      }
    });

    return deletedCount;
  }

  /**
   * Get cache size in bytes (approximate)
   */
  getSizeInBytes(): number {
    let size = 0;
    for (const [key, entry] of this.cache.entries()) {
      size += key.length * 2; // UTF-16 encoding
      size += JSON.stringify(entry.data).length * 2;
      size += 24; // Entry overhead (timestamp, ttl, etc.)
    }
    return size;
  }

  /**
   * Get all cache keys
   */
  getKeys(): string[] {
    return Array.from(this.cache.keys());
  }

  /**
   * Check if key exists in cache
   */
  has(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;

    // Check if expired
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      this.stats.size--;
      return false;
    }

    return true;
  }
}

// Export singleton instance
export const aiCache = new AICache();

// Export types
export type { CacheEntry, CacheStats };

// Auto-cleanup every 5 minutes
if (typeof window === 'undefined') {
  setInterval(
    () => {
      const deleted = aiCache.cleanup();
      if (deleted > 0) {
        console.log(`AI Cache: Cleaned up ${deleted} expired entries`);
      }
    },
    5 * 60 * 1000
  );
}
