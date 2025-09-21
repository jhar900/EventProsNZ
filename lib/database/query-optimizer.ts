/**
 * Database Query Optimizer
 * Provides optimized queries with caching and performance monitoring
 */

import { DatabaseConnectionPool, getDatabasePool } from './connection-pool';
import { createClient } from '@supabase/supabase-js';

export interface QueryOptions {
  useCache?: boolean;
  cacheTTL?: number; // Time to live in seconds
  timeout?: number; // Query timeout in milliseconds
  retries?: number;
}

export interface QueryResult<T = any> {
  data: T[];
  executionTime: number;
  fromCache: boolean;
  query: string;
}

export class QueryOptimizer {
  private dbPool: DatabaseConnectionPool;
  private supabaseClient: any;
  private cache: Map<string, { data: any; timestamp: number; ttl: number }> = new Map();
  private queryStats: Map<string, { count: number; totalTime: number; avgTime: number }> = new Map();

  constructor(dbPool: DatabaseConnectionPool) {
    this.dbPool = dbPool;
    this.supabaseClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
  }

  /**
   * Execute an optimized query with caching and monitoring
   */
  async executeQuery<T = any>(
    query: string,
    params: any[] = [],
    options: QueryOptions = {}
  ): Promise<QueryResult<T>> {
    const {
      useCache = true,
      cacheTTL = 300, // 5 minutes default
      timeout = 30000, // 30 seconds default
      retries = 3
    } = options;

    const cacheKey = this.generateCacheKey(query, params);
    const startTime = Date.now();

    // Check cache first
    if (useCache) {
      const cached = this.getFromCache<T>(cacheKey);
      if (cached) {
        return {
          data: cached,
          executionTime: 0,
          fromCache: true,
          query
        };
      }
    }

    // Execute query with retry logic
    let lastError: Error | null = null;
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        const result = await this.executeWithTimeout(query, params, timeout);
        const executionTime = Date.now() - startTime;

        // Update query statistics
        this.updateQueryStats(query, executionTime);

        // Cache the result
        if (useCache) {
          this.setCache(cacheKey, result, cacheTTL);
        }

        return {
          data: result,
          executionTime,
          fromCache: false,
          query
        };
      } catch (error) {
        lastError = error as Error;
        console.warn(`Query attempt ${attempt} failed:`, error);
        
        if (attempt < retries) {
          // Exponential backoff
          await this.delay(Math.pow(2, attempt) * 1000);
        }
      }
    }

    throw new Error(`Query failed after ${retries} attempts: ${lastError?.message}`);
  }

  /**
   * Optimized contractor search with full-text search and filtering
   */
  async searchContractors(filters: {
    search?: string;
    location?: string;
    category?: string;
    priceMin?: number;
    priceMax?: number;
    rating?: number;
    limit?: number;
    offset?: number;
  }): Promise<QueryResult> {
    const {
      search = '',
      location = '',
      category = '',
      priceMin = 0,
      priceMax = 1000000,
      rating = 0,
      limit = 20,
      offset = 0
    } = filters;

    // Use optimized query with proper indexing
    const query = `
      SELECT 
        bp.id,
        bp.company_name,
        bp.description,
        bp.location,
        bp.service_categories,
        bp.average_rating,
        bp.review_count,
        bp.is_verified,
        bp.subscription_tier,
        p.first_name,
        p.last_name,
        p.avatar_url,
        -- Calculate relevance score for search
        CASE 
          WHEN $1 = '' THEN 0
          ELSE (
            ts_rank(
              to_tsvector('english', 
                COALESCE(bp.company_name, '') || ' ' || 
                COALESCE(bp.description, '') || ' ' || 
                COALESCE(array_to_string(bp.service_categories, ' '), '')
              ), 
              plainto_tsquery('english', $1)
            ) * 0.4 +
            ts_rank(
              to_tsvector('english', bp.location), 
              plainto_tsquery('english', $1)
            ) * 0.3 +
            CASE WHEN bp.is_verified THEN 0.2 ELSE 0 END +
            CASE WHEN bp.subscription_tier = 'spotlight' THEN 0.1 ELSE 0 END
          )
        END as relevance_score
      FROM business_profiles bp
      JOIN profiles p ON bp.user_id = p.user_id
      WHERE 
        ($1 = '' OR (
          to_tsvector('english', 
            COALESCE(bp.company_name, '') || ' ' || 
            COALESCE(bp.description, '') || ' ' || 
            COALESCE(array_to_string(bp.service_categories, ' '), '')
          ) @@ plainto_tsquery('english', $1)
          OR to_tsvector('english', bp.location) @@ plainto_tsquery('english', $1)
        ))
        AND ($2 = '' OR bp.location ILIKE '%' || $2 || '%')
        AND ($3 = '' OR $3 = ANY(bp.service_categories))
        AND bp.average_rating >= $6
        AND bp.is_verified = true
      ORDER BY 
        relevance_score DESC,
        bp.average_rating DESC,
        bp.review_count DESC
      LIMIT $4 OFFSET $5
    `;

    return this.executeQuery(query, [search, location, category, limit, offset, rating], {
      useCache: true,
      cacheTTL: 60, // 1 minute cache for search results
      timeout: 10000
    });
  }

  /**
   * Optimized event search with location and date filtering
   */
  async searchEvents(filters: {
    userId?: string;
    eventType?: string;
    location?: string;
    dateFrom?: string;
    dateTo?: string;
    status?: string;
    limit?: number;
    offset?: number;
  }): Promise<QueryResult> {
    const {
      userId,
      eventType = '',
      location = '',
      dateFrom = '1900-01-01',
      dateTo = '2100-12-31',
      status = '',
      limit = 20,
      offset = 0
    } = filters;

    const query = `
      SELECT 
        e.*,
        p.first_name,
        p.last_name,
        -- Count related services
        (SELECT COUNT(*) FROM event_services es WHERE es.event_id = e.id) as service_count,
        -- Count applications
        (SELECT COUNT(*) FROM job_applications ja 
         JOIN jobs j ON ja.job_id = j.id 
         WHERE j.event_id = e.id) as application_count
      FROM events e
      JOIN profiles p ON e.user_id = p.user_id
      WHERE 
        ($1::uuid IS NULL OR e.user_id = $1)
        AND ($2 = '' OR e.event_type = $2)
        AND ($3 = '' OR e.location ILIKE '%' || $3 || '%')
        AND e.event_date >= $4::timestamp
        AND e.event_date <= $5::timestamp
        AND ($6 = '' OR e.status = $6)
      ORDER BY e.event_date DESC, e.created_at DESC
      LIMIT $7 OFFSET $8
    `;

    return this.executeQuery(query, [userId, eventType, location, dateFrom, dateTo, status, limit, offset], {
      useCache: true,
      cacheTTL: 120, // 2 minutes cache for event searches
      timeout: 15000
    });
  }

  /**
   * Get query performance statistics
   */
  getQueryStats(): Record<string, any> {
    const stats: Record<string, any> = {};
    
    for (const [query, stat] of this.queryStats.entries()) {
      stats[query] = {
        ...stat,
        avgTime: stat.totalTime / stat.count
      };
    }
    
    return stats;
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { size: number; hitRate: number } {
    const totalRequests = Array.from(this.queryStats.values())
      .reduce((sum, stat) => sum + stat.count, 0);
    
    const cacheHits = Array.from(this.cache.values())
      .filter(entry => Date.now() - entry.timestamp < entry.ttl * 1000).length;
    
    return {
      size: this.cache.size,
      hitRate: totalRequests > 0 ? cacheHits / totalRequests : 0
    };
  }

  private generateCacheKey(query: string, params: any[]): string {
    return `${query}:${JSON.stringify(params)}`;
  }

  private getFromCache<T>(key: string): T[] | null {
    const cached = this.cache.get(key);
    
    if (!cached) return null;
    
    // Check if cache entry is still valid
    if (Date.now() - cached.timestamp > cached.ttl * 1000) {
      this.cache.delete(key);
      return null;
    }
    
    return cached.data;
  }

  private setCache(key: string, data: any, ttl: number): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });
  }

  private async executeWithTimeout(query: string, params: any[], timeout: number): Promise<any[]> {
    return new Promise(async (resolve, reject) => {
      const timer = setTimeout(() => {
        reject(new Error(`Query timeout after ${timeout}ms`));
      }, timeout);

      try {
        const result = await this.dbPool.query(query, params);
        clearTimeout(timer);
        resolve(result);
      } catch (error) {
        clearTimeout(timer);
        reject(error);
      }
    });
  }

  private updateQueryStats(query: string, executionTime: number): void {
    const existing = this.queryStats.get(query) || { count: 0, totalTime: 0, avgTime: 0 };
    
    this.queryStats.set(query, {
      count: existing.count + 1,
      totalTime: existing.totalTime + executionTime,
      avgTime: (existing.totalTime + executionTime) / (existing.count + 1)
    });
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Singleton instance
let queryOptimizer: QueryOptimizer | null = null;

export function getQueryOptimizer(): QueryOptimizer {
  if (!queryOptimizer) {
    const dbPool = getDatabasePool();
    queryOptimizer = new QueryOptimizer(dbPool);
  }
  return queryOptimizer;
}
