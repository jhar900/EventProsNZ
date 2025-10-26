import { NextRequest, NextResponse } from 'next/server';

interface CacheConfig {
  ttl?: number; // Time to live in seconds
  key?: string; // Custom cache key
  tags?: string[]; // Cache tags for invalidation
}

// Simple in-memory cache (in production, use Redis or similar)
const cache = new Map<string, { data: any; expires: number; tags: string[] }>();

/**
 * Cache middleware wrapper that adds caching to API routes
 * @param handler - The API route handler function
 * @param config - Cache configuration
 * @returns Wrapped handler with caching
 */
export function withCache<T extends any[]>(
  handler: (request: NextRequest, ...args: T) => Promise<NextResponse>,
  config: CacheConfig = {}
) {
  return async (request: NextRequest, ...args: T): Promise<NextResponse> => {
    const { ttl = 300, key, tags = [] } = config; // Default 5 minutes TTL

    // Generate cache key
    const cacheKey = key || generateCacheKey(request);

    // Check if cached data exists and is not expired
    const cached = cache.get(cacheKey);
    if (cached && cached.expires > Date.now()) {
      // Return cached response
      const response = NextResponse.json(cached.data);
      response.headers.set('X-Cache', 'HIT');
      response.headers.set('X-Cache-Key', cacheKey);
      return response;
    }

    // Call the original handler
    const response = await handler(request, ...args);

    // Only cache successful responses
    if (response.status >= 200 && response.status < 300) {
      try {
        const responseData = await response.clone().json();

        // Store in cache
        cache.set(cacheKey, {
          data: responseData,
          expires: Date.now() + ttl * 1000,
          tags,
        });

        // Add cache headers
        response.headers.set('X-Cache', 'MISS');
        response.headers.set('X-Cache-Key', cacheKey);
        response.headers.set('X-Cache-TTL', ttl.toString());
      } catch (error) {
        console.error('Error caching response:', error);
      }
    }

    return response;
  };
}

/**
 * Generate a cache key based on the request
 * @param request - The incoming request
 * @returns Cache key string
 */
function generateCacheKey(request: NextRequest): string {
  const url = new URL(request.url);
  const method = request.method;
  const pathname = url.pathname;
  const searchParams = url.searchParams.toString();

  // Include user ID in cache key if available
  const userId = request.headers.get('x-user-id');
  const userKey = userId ? `:user:${userId}` : '';

  return `cache:${method}:${pathname}:${searchParams}${userKey}`;
}

/**
 * Invalidate cache entries by tags
 * @param tags - Array of tags to invalidate
 */
export function invalidateCacheByTags(tags: string[]): void {
  for (const [key, entry] of cache.entries()) {
    if (entry.tags.some(tag => tags.includes(tag))) {
      cache.delete(key);
    }
  }
}

/**
 * Invalidate cache entries by pattern
 * @param pattern - Pattern to match against cache keys
 */
export function invalidateCacheByPattern(pattern: string): void {
  const regex = new RegExp(pattern);
  for (const key of cache.keys()) {
    if (regex.test(key)) {
      cache.delete(key);
    }
  }
}

/**
 * Clear all cache entries
 */
export function clearCache(): void {
  cache.clear();
}

/**
 * Get cache statistics
 * @returns Cache statistics object
 */
export function getCacheStats() {
  const now = Date.now();
  let totalEntries = 0;
  let expiredEntries = 0;
  let totalSize = 0;

  for (const [key, entry] of cache.entries()) {
    totalEntries++;
    totalSize += key.length + JSON.stringify(entry.data).length;

    if (entry.expires <= now) {
      expiredEntries++;
    }
  }

  return {
    totalEntries,
    expiredEntries,
    activeEntries: totalEntries - expiredEntries,
    totalSize,
  };
}
