import { ContractorMatch, MatchingFilters } from '@/types/matching';

interface MatchingCache {
  key: string;
  results: ContractorMatch[];
  expires: Date;
  created_at: Date;
}

export class MatchingCacheService {
  private cache: Map<string, MatchingCache> = new Map();
  private readonly DEFAULT_TTL = 15 * 60 * 1000; // 15 minutes

  /**
   * Generate cache key for matching request
   */
  private generateCacheKey(
    eventId: string,
    filters: MatchingFilters,
    algorithm: string
  ): string {
    const filterHash = JSON.stringify(filters);
    return `${eventId}_${algorithm}_${Buffer.from(filterHash).toString('base64')}`;
  }

  /**
   * Get cached matches if available and not expired
   */
  async getCachedMatches(
    eventId: string,
    filters: MatchingFilters,
    algorithm: string
  ): Promise<ContractorMatch[] | null> {
    const key = this.generateCacheKey(eventId, filters, algorithm);
    const cached = this.cache.get(key);

    if (!cached) {
      return null;
    }

    // Check if cache has expired
    if (new Date() > cached.expires) {
      this.cache.delete(key);
      return null;
    }

    console.log(`Cache hit for key: ${key}`);
    return cached.results;
  }

  /**
   * Cache matching results
   */
  async setCachedMatches(
    eventId: string,
    filters: MatchingFilters,
    algorithm: string,
    matches: ContractorMatch[],
    ttl: number = this.DEFAULT_TTL
  ): Promise<void> {
    const key = this.generateCacheKey(eventId, filters, algorithm);
    const expires = new Date(Date.now() + ttl);

    this.cache.set(key, {
      key,
      results: matches,
      expires,
      created_at: new Date(),
    });

    console.log(
      `Cached ${matches.length} matches for key: ${key}, expires: ${expires.toISOString()}`
    );
  }

  /**
   * Invalidate cache for specific event
   */
  async invalidateEventCache(eventId: string): Promise<void> {
    const keysToDelete: string[] = [];

    for (const [key, cached] of this.cache.entries()) {
      if (key.startsWith(eventId)) {
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach(key => this.cache.delete(key));
    console.log(
      `Invalidated ${keysToDelete.length} cache entries for event: ${eventId}`
    );
  }

  /**
   * Invalidate all cache entries
   */
  async invalidateAllCache(): Promise<void> {
    const size = this.cache.size;
    this.cache.clear();
    console.log(`Invalidated all ${size} cache entries`);
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): {
    totalEntries: number;
    expiredEntries: number;
    memoryUsage: number;
  } {
    const now = new Date();
    let expiredEntries = 0;
    let memoryUsage = 0;

    for (const cached of this.cache.values()) {
      if (now > cached.expires) {
        expiredEntries++;
      }
      memoryUsage += JSON.stringify(cached.results).length;
    }

    return {
      totalEntries: this.cache.size,
      expiredEntries,
      memoryUsage,
    };
  }

  /**
   * Clean up expired entries
   */
  async cleanupExpiredEntries(): Promise<void> {
    const now = new Date();
    const keysToDelete: string[] = [];

    for (const [key, cached] of this.cache.entries()) {
      if (now > cached.expires) {
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach(key => this.cache.delete(key));
    console.log(`Cleaned up ${keysToDelete.length} expired cache entries`);
  }
}

// Export singleton instance
export const matchingCacheService = new MatchingCacheService();
