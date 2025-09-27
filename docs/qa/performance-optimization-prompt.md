# Dev Agent Prompt: Fix Critical Security & Performance Issues in Story 5.5

## 🚨 **URGENT: Critical Security & Performance Fixes Required**

**Story**: 5.5 - Event Management & Status Tracking  
**QA Gate**: CONCERNS - Must be resolved before production  
**Priority**: CRITICAL - Security vulnerabilities identified

---

## 📋 **Overview**

The QA review identified **critical security vulnerabilities** and **performance issues** that must be addressed immediately. While all acceptance criteria are technically met, these issues pose significant risks to production deployment.

**Quality Score**: 65/100 (Below acceptable threshold)  
**Risk Level**: HIGH (1 critical, 2 high, 3 medium risks)

---

## 🔒 **CRITICAL SECURITY FIXES (Must Fix Before Production)**

### 1. Authorization Bypass Vulnerabilities (SEC-001) - **CRITICAL**

**Issue**: Inconsistent authorization checks across API endpoints allow potential unauthorized access.

**Affected Files**:

- `app/api/events/[id]/status/route.ts`
- `app/api/events/[id]/versions/route.ts`
- `app/api/events/[id]/notifications/route.ts`
- `app/api/events/[id]/duplicate/route.ts`
- `app/api/events/[id]/completion/route.ts`
- `app/api/events/[id]/milestones/route.ts`

**Required Actions**:

1. **Create Authorization Middleware**:

   ```typescript
   // lib/middleware/eventAuth.ts
   export async function validateEventAccess(
     eventId: string,
     userId: string,
     requiredRole?: 'event_manager' | 'admin'
   ): Promise<{ hasAccess: boolean; isAdmin: boolean }> {
     // Implement consistent authorization logic
   }
   ```

2. **Fix Admin Bypass Logic**:
   - Remove inconsistent admin checks
   - Implement proper role-based access control
   - Add audit logging for all access attempts

3. **Add Rate Limiting**:
   ```typescript
   // lib/middleware/rateLimit.ts
   export const eventApiRateLimit = rateLimit({
     windowMs: 15 * 60 * 1000, // 15 minutes
     max: 100, // limit each IP to 100 requests per windowMs
   });
   ```

### 2. SQL Injection Protection (SEC-002) - **HIGH**

**Issue**: Dynamic queries lack proper parameterization, creating SQL injection risks.

**Required Actions**:

1. **Audit All Database Queries**:
   - Replace string concatenation with parameterized queries
   - Use Supabase's built-in parameterization
   - Add input sanitization for all user inputs

2. **Add Input Validation**:

   ```typescript
   // lib/validation/eventValidation.ts
   export const eventInputSchema = z.object({
     title: z.string().min(1).max(255).trim(),
     description: z.string().max(2000).optional(),
     event_date: z.string().datetime(),
     // Add comprehensive validation for all fields
   });
   ```

3. **Implement Query Sanitization**:
   - Use Supabase's `.eq()`, `.gte()`, `.lte()` methods
   - Avoid raw SQL queries
   - Add query logging for security monitoring

---

## ⚡ **PERFORMANCE OPTIMIZATIONS (High Priority)**

### 1. Dashboard Query Optimization (PERF-001)

**Issue**: Dashboard loads all related data without pagination, causing performance issues.

**Affected File**: `app/api/events/dashboard/route.ts`

**Required Actions**:

1. **Implement Pagination**:

   ```typescript
   // Add pagination parameters
   const page = parseInt(searchParams.get('page') || '1');
   const limit = parseInt(searchParams.get('limit') || '20');
   const offset = (page - 1) * limit;

   // Modify query to include pagination
   .range(offset, offset + limit - 1)
   ```

2. **Optimize Database Queries**:

   ```typescript
   // Use selective field loading instead of loading all related data
   .select(`
     id, title, status, event_date, budget_total,
     event_milestones!inner(id, milestone_name, status),
     event_feedback!inner(id, rating)
   `)
   ```

3. **Add Caching Strategy**:
   ```typescript
   // lib/cache/dashboardCache.ts
   export async function getCachedDashboardData(
     userId: string,
     period: string
   ) {
     const cacheKey = `dashboard:${userId}:${period}`;
     // Implement Redis or in-memory caching
   }
   ```

### 2. Version History Cleanup (PERF-002)

**Issue**: Event version history grows indefinitely without cleanup.

**Required Actions**:

1. **Implement Cleanup Strategy**:

   ```typescript
   // lib/cleanup/versionCleanup.ts
   export async function cleanupOldVersions() {
     // Keep only last 10 versions per event
     // Archive older versions to cold storage
   }
   ```

2. **Add Version Limits**:
   - Limit versions per event (e.g., max 50 versions)
   - Implement automatic cleanup for old events
   - Add version compression for large change sets

---

## 🧪 **TESTING REQUIREMENTS (Medium Priority)**

### 1. Add Missing Integration Tests

**Required Test Files**:

- `__tests__/events/management/event-status-transitions.test.ts`
- `__tests__/events/management/authorization.test.ts`
- `__tests__/events/management/performance.test.ts`

**Test Scenarios**:

```typescript
describe('Event Status Transitions', () => {
  it('should prevent unauthorized status changes', async () => {
    // Test authorization bypass attempts
  });

  it('should handle concurrent status updates', async () => {
    // Test race conditions
  });
});

describe('Dashboard Performance', () => {
  it('should load dashboard within 2 seconds with 1000+ events', async () => {
    // Performance test
  });
});
```

### 2. Security Testing

**Required Tests**:

- SQL injection attempt testing
- Authorization bypass testing
- Rate limiting validation
- Input validation edge cases

---

## 🏗️ **ARCHITECTURAL IMPROVEMENTS (Medium Priority)**

### 1. Extract Authorization Logic

**Create**: `lib/middleware/eventAuth.ts`

```typescript
export class EventAuthService {
  static async validateEventAccess(
    eventId: string,
    userId: string
  ): Promise<boolean> {
    // Centralized authorization logic
  }

  static async validateAdminAccess(userId: string): Promise<boolean> {
    // Admin role validation
  }
}
```

### 2. Implement Error Handling Middleware

**Create**: `lib/middleware/errorHandler.ts`

```typescript
export function withErrorHandling(handler: Function) {
  return async (req: NextRequest, context: any) => {
    try {
      return await handler(req, context);
    } catch (error) {
      // Centralized error handling and logging
    }
  };
}
```

---

## 📊 **MONITORING & LOGGING**

### 1. Add Security Monitoring

```typescript
// lib/monitoring/securityLogger.ts
export function logSecurityEvent(event: string, details: any) {
  // Log authorization attempts, failed validations, etc.
}
```

### 2. Add Performance Monitoring

```typescript
// lib/monitoring/performanceLogger.ts
export function logPerformanceMetrics(endpoint: string, duration: number) {
  // Track API response times
}
```

---

## ✅ **ACCEPTANCE CRITERIA FOR FIXES**

### Security Fixes Must:

- [ ] All API endpoints use consistent authorization middleware
- [ ] No SQL injection vulnerabilities remain
- [ ] Rate limiting implemented on all endpoints
- [ ] Input validation covers all user inputs
- [ ] Security tests pass (authorization, injection, rate limiting)

### Performance Fixes Must:

- [ ] Dashboard loads within 2 seconds with 1000+ events
- [ ] Pagination implemented for all list endpoints
- [ ] Caching strategy implemented for frequently accessed data
- [ ] Version history cleanup strategy in place
- [ ] Performance tests pass (load testing, query optimization)

### Testing Must:

- [ ] Integration tests added for all critical workflows
- [ ] Security tests cover all identified vulnerabilities
- [ ] Performance tests validate optimization requirements
- [ ] Test coverage above 80% for modified code

---

## 🚀 **IMPLEMENTATION PRIORITY**

1. **IMMEDIATE (This Sprint)**:
   - Fix authorization bypass vulnerabilities
   - Add SQL injection protection
   - Implement dashboard pagination

2. **HIGH (Next Sprint)**:
   - Add comprehensive test coverage
   - Implement caching strategy
   - Extract authorization middleware

3. **MEDIUM (Future)**:
   - Version history cleanup
   - Advanced performance monitoring
   - Architectural refactoring

---

## 📝 **DELIVERABLES**

After implementing fixes, provide:

1. **Updated API endpoints** with security fixes
2. **New test files** with comprehensive coverage
3. **Performance benchmarks** showing improvements
4. **Security audit report** confirming vulnerabilities are resolved
5. **Updated documentation** for new middleware and patterns

---

## ⚠️ **CRITICAL NOTES**

- **DO NOT DEPLOY** until all security vulnerabilities are resolved
- **Test thoroughly** - these are critical production issues
- **Document changes** - update API documentation and code comments
- **Monitor closely** - implement logging for security and performance metrics

**Estimated Effort**: 2-3 days for critical fixes, 1 week for complete implementation

**Risk if not addressed**: Production security breach, performance degradation, potential data exposure
