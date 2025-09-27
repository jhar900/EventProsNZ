interface CacheEntry<T> {
  value: T;
  expires: number;
  createdAt: number;
}

interface CacheConfig {
  ttl: number; // Time to live in milliseconds
  maxSize?: number; // Maximum number of entries
  cleanupInterval?: number; // Cleanup interval in milliseconds
}

// In-memory cache implementation
class MemoryCache<T> {
  private cache = new Map<string, CacheEntry<T>>();
  private config: Required<CacheConfig>;
  private cleanupTimer?: NodeJS.Timeout;

  constructor(config: CacheConfig) {
    this.config = {
      ttl: config.ttl,
      maxSize: config.maxSize || 1000,
      cleanupInterval: config.cleanupInterval || 60000, // 1 minute
    };

    // Start cleanup timer
    this.startCleanup();
  }

  private startCleanup() {
    this.cleanupTimer = setInterval(() => {
      this.cleanup();
    }, this.config.cleanupInterval);
  }

  private cleanup() {
    const now = Date.now();
    const expiredKeys: string[] = [];

    // Find expired entries
    for (const [key, entry] of this.cache.entries()) {
      if (entry.expires < now) {
        expiredKeys.push(key);
      }
    }

    // Remove expired entries
    expiredKeys.forEach(key => this.cache.delete(key));

    // Remove oldest entries if cache is too large
    if (this.cache.size > this.config.maxSize) {
      const entries = Array.from(this.cache.entries());
      entries.sort((a, b) => a[1].createdAt - b[1].createdAt);

      const toRemove = entries.slice(0, this.cache.size - this.config.maxSize);
      toRemove.forEach(([key]) => this.cache.delete(key));
    }
  }

  get(key: string): T | null {
    const entry = this.cache.get(key);

    if (!entry) {
      return null;
    }

    // Check if expired
    if (entry.expires < Date.now()) {
      this.cache.delete(key);
      return null;
    }

    return entry.value;
  }

  set(key: string, value: T, ttl?: number): void {
    const now = Date.now();
    const expires = now + (ttl || this.config.ttl);

    this.cache.set(key, {
      value,
      expires,
      createdAt: now,
    });
  }

  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  has(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) {
      return false;
    }

    // Check if expired
    if (entry.expires < Date.now()) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }

  size(): number {
    return this.cache.size;
  }

  keys(): string[] {
    return Array.from(this.cache.keys());
  }

  destroy(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
    }
    this.cache.clear();
  }
}

// Cache manager for different types of data
export class CacheManager {
  private caches = new Map<string, MemoryCache<any>>();

  // Get or create a cache instance
  getCache<T>(name: string, config: CacheConfig): MemoryCache<T> {
    if (!this.caches.has(name)) {
      this.caches.set(name, new MemoryCache<T>(config));
    }
    return this.caches.get(name)!;
  }

  // Clear all caches
  clearAll(): void {
    this.caches.forEach(cache => cache.clear());
  }

  // Destroy all caches
  destroyAll(): void {
    this.caches.forEach(cache => cache.destroy());
    this.caches.clear();
  }

  // Get cache statistics
  getStats(): Record<string, { size: number; keys: string[] }> {
    const stats: Record<string, { size: number; keys: string[] }> = {};

    this.caches.forEach((cache, name) => {
      stats[name] = {
        size: cache.size(),
        keys: cache.keys(),
      };
    });

    return stats;
  }
}

// Global cache manager instance
export const cacheManager = new CacheManager();

// Predefined cache configurations
export const cacheConfigs = {
  // Short-term cache for frequently accessed data
  short: {
    ttl: 5 * 60 * 1000, // 5 minutes
    maxSize: 1000,
  },

  // Medium-term cache for moderately accessed data
  medium: {
    ttl: 30 * 60 * 1000, // 30 minutes
    maxSize: 500,
  },

  // Long-term cache for rarely changing data
  long: {
    ttl: 60 * 60 * 1000, // 1 hour
    maxSize: 200,
  },

  // Very long-term cache for static data
  static: {
    ttl: 24 * 60 * 60 * 1000, // 24 hours
    maxSize: 100,
  },
};

// Cache decorator for functions
export function withCache<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  cacheName: string,
  config: CacheConfig,
  keyGenerator?: (...args: Parameters<T>) => string
): T {
  const cache = cacheManager.getCache<ReturnType<T>>(cacheName, config);

  return (async (...args: Parameters<T>) => {
    const key = keyGenerator ? keyGenerator(...args) : JSON.stringify(args);

    // Try to get from cache
    const cached = cache.get(key);
    if (cached !== null) {
      return cached;
    }

    // Execute function and cache result
    const result = await fn(...args);
    cache.set(key, result);

    return result;
  }) as T;
}

// Cache utilities for analytics data
export const analyticsCache = {
  // Query analytics cache
  queries: cacheManager.getCache('analytics-queries', cacheConfigs.short),

  // Filter analytics cache
  filters: cacheManager.getCache('analytics-filters', cacheConfigs.short),

  // CTR analytics cache
  ctr: cacheManager.getCache('analytics-ctr', cacheConfigs.short),

  // Trending data cache
  trending: cacheManager.getCache('analytics-trending', cacheConfigs.medium),

  // Behavior analytics cache
  behavior: cacheManager.getCache('analytics-behavior', cacheConfigs.medium),

  // Engagement metrics cache
  engagement: cacheManager.getCache(
    'analytics-engagement',
    cacheConfigs.medium
  ),

  // Performance metrics cache
  performance: cacheManager.getCache(
    'analytics-performance',
    cacheConfigs.short
  ),

  // A/B tests cache
  abTests: cacheManager.getCache('analytics-ab-tests', cacheConfigs.long),
};

// Cache key generators
export const cacheKeys = {
  queryAnalytics: (period: string, limit: number) =>
    `queries:${period}:${limit}`,
  filterAnalytics: (period: string) => `filters:${period}`,
  ctrAnalytics: (period: string) => `ctr:${period}`,
  trendingData: (period: string, limit: number) =>
    `trending:${period}:${limit}`,
  behaviorAnalytics: (period: string, userSegment: string) =>
    `behavior:${period}:${userSegment}`,
  engagementMetrics: (period: string) => `engagement:${period}`,
  performanceMetrics: (period: string) => `performance:${period}`,
  abTests: () => 'ab-tests',
  abTestResults: (testId: string) => `ab-test-results:${testId}`,
};

// Cache invalidation utilities
export const cacheInvalidation = {
  // Invalidate all analytics caches
  invalidateAll: () => {
    Object.values(analyticsCache).forEach(cache => cache.clear());
  },

  // Invalidate specific analytics cache
  invalidate: (cacheName: keyof typeof analyticsCache) => {
    analyticsCache[cacheName].clear();
  },

  // Invalidate caches by pattern
  invalidateByPattern: (pattern: string) => {
    Object.values(analyticsCache).forEach(cache => {
      const keys = cache.keys();
      keys.forEach(key => {
        if (key.includes(pattern)) {
          cache.delete(key);
        }
      });
    });
  },

  // Invalidate caches by time period
  invalidateByPeriod: (period: string) => {
    cacheInvalidation.invalidateByPattern(period);
  },
};

// Cache warming utilities
export const cacheWarming = {
  // Warm up analytics caches with common queries
  warmAnalyticsCaches: async () => {
    const commonPeriods = ['day', 'week', 'month'];
    const commonLimits = [10, 50, 100];

    // This would typically call the actual analytics functions
    // to populate the cache with commonly requested data
    // TODO: Implement actual cache warming logic
    // This would involve calling the analytics service functions
    // with common parameters to populate the cache
  },
};

// Cache middleware for API routes
export function withCacheMiddleware<T>(
  handler: (req: Request) => Promise<Response>,
  cacheName: string,
  config: CacheConfig,
  keyGenerator?: (req: Request) => string
) {
  const cache = cacheManager.getCache<T>(cacheName, config);

  return async (req: Request): Promise<Response> => {
    const key = keyGenerator ? keyGenerator(req) : req.url;

    // Try to get from cache
    const cached = cache.get(key);
    if (cached !== null) {
      return new Response(JSON.stringify(cached), {
        headers: {
          'Content-Type': 'application/json',
          'X-Cache': 'HIT',
        },
      });
    }

    // Execute handler
    const response = await handler(req);

    // Cache successful responses
    if (response.ok) {
      const data = await response.json();
      cache.set(key, data);
    }

    // Add cache headers
    const newResponse = new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: {
        ...Object.fromEntries(response.headers.entries()),
        'X-Cache': 'MISS',
      },
    });

    return newResponse;
  };
}
