# Performance Optimization Prompt for Story 5.4

## Context

Following the QA review of Story 5.4: Intelligent Contractor Matching, the Test Architect identified performance concerns with the complex matching algorithm. This prompt provides specific guidance for optimizing the contractor matching system for large datasets.

## Performance Concerns Identified

**Primary Issue**: Complex matching algorithm may be slow with large contractor datasets (1000+ contractors)

**Location**: `lib/matching/matching-service.ts:330-405` - `calculateMatches()` method

**Impact**:

- Multiple database queries per contractor
- Complex scoring calculations for each contractor
- No batching or optimization for large datasets

## Optimization Requirements

### 1. Algorithm Performance Optimization

**Target**: Reduce matching time from O(n) to O(log n) or implement efficient batching

**Implementation Tasks**:

1. **Batch Database Queries**

   ```typescript
   // Current: Individual queries per contractor
   // Optimize: Single query with JOINs for all contractors
   const contractors = await this.supabase
     .from('users')
     .select(
       `
       id,
       business_profiles!inner(*),
       services(*),
       contractor_performance(*),
       contractor_availability(*)
     `
     )
     .eq('role', 'contractor')
     .eq('is_verified', true);
   ```

2. **Implement Result Caching**

   ```typescript
   // Add caching layer for matching results
   interface MatchingCache {
     key: string;
     results: ContractorMatch[];
     expires: Date;
   }

   // Cache key based on event_id + filters hash
   const cacheKey = `${event_id}_${JSON.stringify(filters)}`;
   ```

3. **Optimize Scoring Algorithm**
   ```typescript
   // Pre-calculate common scores
   // Use vectorized operations where possible
   // Implement early termination for low-scoring matches
   ```

### 2. Database Optimization

**Required Changes**:

1. **Add Composite Indexes**

   ```sql
   -- Add composite index for common query patterns
   CREATE INDEX idx_contractors_matching
   ON users(role, is_verified)
   INCLUDE (id);

   -- Add index for performance scoring
   CREATE INDEX idx_contractor_performance_score
   ON contractor_performance(contractor_id, overall_performance_score);
   ```

2. **Implement Query Optimization**
   - Use database-level filtering instead of application-level
   - Implement proper JOIN strategies
   - Add query result caching

### 3. Performance Monitoring

**Implementation Tasks**:

1. **Add Performance Metrics**

   ```typescript
   interface MatchingMetrics {
     query_time_ms: number;
     contractors_processed: number;
     cache_hit_rate: number;
     algorithm_time_ms: number;
   }
   ```

2. **Implement Performance Logging**

   ```typescript
   // Log performance metrics for monitoring
   const startTime = performance.now();
   const result = await this.calculateMatches(event, filters, algorithm);
   const endTime = performance.now();

   await this.logPerformanceMetrics({
     event_id,
     processing_time_ms: endTime - startTime,
     contractors_processed: result.length,
   });
   ```

### 4. Caching Strategy

**Implementation Requirements**:

1. **Redis/Memory Cache Integration**

   ```typescript
   // Implement caching service
   class MatchingCacheService {
     async getCachedMatches(
       eventId: string,
       filters: MatchingFilters
     ): Promise<ContractorMatch[] | null>;
     async setCachedMatches(
       eventId: string,
       filters: MatchingFilters,
       matches: ContractorMatch[],
       ttl: number
     ): Promise<void>;
     async invalidateCache(eventId: string): Promise<void>;
   }
   ```

2. **Cache Invalidation Strategy**
   - Invalidate when contractor profiles change
   - Invalidate when event requirements change
   - Implement TTL-based expiration

### 5. Algorithm Improvements

**Specific Optimizations**:

1. **Early Termination**

   ```typescript
   // Stop processing contractors with very low scores
   if (overallScore < 0.3) {
     continue; // Skip detailed calculations
   }
   ```

2. **Parallel Processing**

   ```typescript
   // Process contractors in batches
   const batches = this.chunkArray(contractors, 50);
   const results = await Promise.all(
     batches.map(batch => this.processBatch(batch, event))
   );
   ```

3. **Score Pre-calculation**
   ```typescript
   // Pre-calculate common scores
   const baseScores = await this.calculateBaseScores(contractors);
   ```

## Implementation Priority

### Phase 1 (Immediate - High Impact)

1. ✅ Batch database queries
2. ✅ Add composite indexes
3. ✅ Implement early termination

### Phase 2 (Short-term - Medium Impact)

1. ✅ Add result caching
2. ✅ Implement performance monitoring
3. ✅ Optimize scoring algorithm

### Phase 3 (Long-term - Low Impact)

1. ✅ Advanced caching strategies
2. ✅ Parallel processing
3. ✅ Performance analytics

## Success Criteria

**Performance Targets**:

- Matching time < 2 seconds for 1000+ contractors
- Database queries < 5 per matching request
- Cache hit rate > 80% for repeated requests
- Memory usage < 100MB for large datasets

**Monitoring Requirements**:

- Performance metrics logged for all matching operations
- Alert thresholds for slow queries (> 5 seconds)
- Dashboard for monitoring matching performance

## Testing Requirements

**Performance Tests**:

```typescript
describe('Matching Performance', () => {
  it('should complete matching for 1000+ contractors in < 2 seconds', async () => {
    const startTime = performance.now();
    const result = await matchingService.findMatches({
      event_id: 'test-event',
      filters: {},
      page: 1,
      limit: 1000,
    });
    const endTime = performance.now();

    expect(endTime - startTime).toBeLessThan(2000);
    expect(result.matches.length).toBeGreaterThan(0);
  });
});
```

## Files to Modify

1. **`lib/matching/matching-service.ts`** - Main optimization target
2. **`supabase/migrations/`** - Add performance indexes
3. **`lib/matching/cache-service.ts`** - New caching service
4. **`lib/matching/performance-monitor.ts`** - New monitoring service
5. **`__tests__/matching/performance.test.ts`** - Performance tests

## Expected Outcomes

After implementation:

- ✅ 10x performance improvement for large datasets
- ✅ Reduced database load
- ✅ Better user experience with faster matching
- ✅ Scalable architecture for future growth
- ✅ Comprehensive performance monitoring

## Notes

- Maintain backward compatibility with existing API
- Ensure all existing tests continue to pass
- Add new performance tests
- Document performance improvements in story
- Update File List with new/modified files

---

**Priority**: High
**Estimated Effort**: 2-3 days
**Risk Level**: Low (optimization only, no breaking changes)
