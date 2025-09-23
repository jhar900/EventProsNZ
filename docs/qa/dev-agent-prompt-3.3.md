# Dev Agent Prompt: Fix Story 3.3 Issues

## Context

Story 3.3: Contractor Profile Pages has been reviewed by the Test Architect and received a **CONCERNS** gate decision. The implementation is functionally complete but has test failures and performance concerns that need to be addressed before production deployment.

## Quality Gate Summary

- **Gate Status**: CONCERNS
- **Quality Score**: 75/100
- **Reviewer**: Quinn (Test Architect)
- **Review Date**: 2024-12-01

## Critical Issues to Fix

### 1. Test Failures (Priority: HIGH)

**Issue**: Multiple test failures in portfolio gallery component tests
**Files Affected**:

- `__tests__/contractors/profile/portfolio-gallery.test.tsx`
- `components/features/contractors/profile/PortfolioGallery.tsx`

**Specific Problems**:

- Tests expecting "All" filter button that doesn't render in certain states
- Tests expecting "Load More" button that doesn't appear when expected
- Tests expecting "No Portfolio Items" message that doesn't show properly
- Multiple elements with same text causing test selector conflicts
- Error handling issues in fetch response processing

**Required Actions**:

1. Fix error handling in `PortfolioGallery.tsx` - add proper `response.ok` checks before calling `response.json()`
2. Update test expectations to match actual component behavior
3. Fix test selectors to handle multiple elements with same text
4. Ensure proper async handling in tests
5. Verify all test scenarios work with actual component states

### 2. Performance Issues (Priority: MEDIUM)

**Issue**: Missing caching strategy and performance monitoring
**Files Affected**:

- `app/contractors/[id]/page.tsx`
- `components/features/contractors/profile/PortfolioGallery.tsx`

**Required Actions**:

1. Implement profile caching strategy for frequently accessed contractor profiles
2. Add performance monitoring for image loading times
3. Consider implementing React Query or SWR for data fetching and caching
4. Add loading states for all async operations

### 3. Error Handling Improvements (Priority: MEDIUM)

**Issue**: Missing comprehensive error boundary components
**Files Affected**:

- `components/features/contractors/profile/`

**Required Actions**:

1. Add error boundary components for profile sections
2. Implement proper error states for API failures
3. Add retry mechanisms for failed requests
4. Ensure graceful degradation when services are unavailable

## Implementation Guidelines

### Test Fixes

```typescript
// Example fix for error handling in PortfolioGallery.tsx
const response = await fetch(
  `/api/contractors/${contractorId}/portfolio?${params}`
);
if (!response.ok) {
  throw new Error(`HTTP error! status: ${response.status}`);
}
const data = await response.json();
```

### Performance Improvements

```typescript
// Example caching implementation
import { useQuery } from '@tanstack/react-query';

const {
  data: portfolio,
  isLoading,
  error,
} = useQuery({
  queryKey: ['portfolio', contractorId, selectedCategory],
  queryFn: () => fetchPortfolio(contractorId, selectedCategory),
  staleTime: 5 * 60 * 1000, // 5 minutes
  cacheTime: 10 * 60 * 1000, // 10 minutes
});
```

### Error Boundaries

```typescript
// Example error boundary component
import { ErrorBoundary } from 'react-error-boundary';

function ErrorFallback({ error, resetErrorBoundary }) {
  return (
    <div role="alert" className="p-4 bg-red-50 border border-red-200 rounded-md">
      <h2 className="text-lg font-semibold text-red-800">Something went wrong:</h2>
      <pre className="text-sm text-red-600">{error.message}</pre>
      <button onClick={resetErrorBoundary} className="mt-2 px-4 py-2 bg-red-600 text-white rounded">
        Try again
      </button>
    </div>
  );
}
```

## Acceptance Criteria Verification

Ensure all 11 acceptance criteria still work after fixes:

1. ✅ Comprehensive contractor profile layout
2. ✅ Business information display
3. ✅ Portfolio gallery with past event photos
4. ✅ Service listings with detailed descriptions
5. ✅ Pricing information and package options
6. ✅ Testimonials and review display
7. ✅ Contact information and inquiry form
8. ✅ Social proof and verification badges
9. ✅ Public profiles (viewable without login)
10. ✅ Authentication required for "Get in touch" functionality
11. ✅ Integration with inquiry system

## Testing Requirements

1. **Unit Tests**: Fix all failing tests in `__tests__/contractors/profile/`
2. **Integration Tests**: Ensure API endpoints work correctly
3. **E2E Tests**: Verify complete user flows work end-to-end
4. **Performance Tests**: Verify caching and image loading performance

## Success Criteria

- [ ] All tests pass without failures
- [ ] Portfolio gallery loads and functions correctly
- [ ] Error handling works gracefully
- [ ] Performance improvements are measurable
- [ ] No regression in existing functionality
- [ ] Code follows project standards and patterns

## Files to Update

1. `components/features/contractors/profile/PortfolioGallery.tsx` - Fix error handling
2. `__tests__/contractors/profile/portfolio-gallery.test.tsx` - Fix test failures
3. `app/contractors/[id]/page.tsx` - Add caching strategy
4. `components/features/contractors/profile/` - Add error boundaries
5. Any additional files needed for performance improvements

## Notes

- Maintain backward compatibility
- Follow existing code patterns and architecture
- Ensure accessibility standards are maintained
- Test on multiple devices and browsers
- Update documentation if needed

## Expected Outcome

After implementing these fixes, the story should receive a **PASS** gate decision and be ready for production deployment.
