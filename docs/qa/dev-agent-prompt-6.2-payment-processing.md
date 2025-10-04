# Dev Agent Prompt: Fix Payment Processing Test Failures

## Context

Story 6.2: Payment Processing Integration has been reviewed by Quinn (Test Architect) and received a **CONCERNS** gate status. While the implementation has been significantly improved with missing service methods added, there are critical test failures that must be addressed before production deployment.

## Current Status

- ✅ **Completed**: All missing service methods have been implemented
- ✅ **Completed**: Error handling has been enhanced across all services
- ✅ **Completed**: Performance monitoring and audit logging services created
- ❌ **Critical**: Multiple test failures due to mocking issues
- ❌ **Critical**: Component test failures and timeouts
- ❌ **Critical**: Missing API routes for some payment endpoints

## Immediate Actions Required

### 1. Fix Test Mocking Issues (Priority: HIGH)

**Problem**: Supabase client mocking is not working correctly in tests, causing widespread test failures.

**Files to Fix**:

- `__tests__/payments/services/bank-transfer-service.test.ts`
- `__tests__/payments/services/payment-service.test.ts`
- `__tests__/payments/services/method-service.test.ts`
- `__tests__/payments/services/receipt-service.test.ts`
- `__tests__/payments/security/fraud-detection.test.ts`

**Required Changes**:

```typescript
// Fix the mocking pattern - current pattern is broken
// Instead of:
const mockInsert = mockSupabase.from().insert().select().single();
mockInsert.mockResolvedValue({ data: mockData, error: null });

// Use this pattern:
mockSupabase.from.mockReturnValue({
  insert: jest.fn().mockReturnValue({
    select: jest.fn().mockReturnValue({
      single: jest.fn().mockResolvedValue({ data: mockData, error: null }),
    }),
  }),
});
```

**Specific Issues to Fix**:

1. **Bank Transfer Service Tests**: Fix mocking for `getBankTransfersByUser`, `getPendingBankTransfers`, `getBankTransferInstructions`
2. **Payment Service Tests**: Fix mocking for all CRUD operations
3. **Method Service Tests**: Fix mocking for payment method management
4. **Receipt Service Tests**: Fix mocking for receipt operations
5. **Fraud Detection Tests**: Fix mocking for fraud detection methods

### 2. Fix Component Test Failures (Priority: HIGH)

**Problem**: Component tests are failing due to incorrect expectations and test data setup.

**Files to Fix**:

- `__tests__/payments/components/FailedPaymentHandler.test.tsx`
- `__tests__/payments/components/PaymentForm.test.tsx`
- `__tests__/payments/components/PaymentMethods.test.tsx`

**Required Changes**:

1. **Fix Date Mocking**: Ensure proper date mocking for time-sensitive tests
2. **Fix Test Data**: Update test data to match actual component behavior
3. **Fix Expectations**: Update test expectations to match component output
4. **Fix Timeouts**: Resolve test timeout issues

### 3. Create Missing API Routes (Priority: MEDIUM)

**Problem**: Some payment endpoints referenced in tests don't exist.

**Missing Routes to Create**:

- `app/api/payments/failed/retry/route.ts`
- `app/api/payments/security/payment-security-service.ts`
- `app/api/payments/performance/payment-performance-service.ts`

**Required Implementation**:

```typescript
// Example for failed payment retry route
export async function POST(request: Request) {
  try {
    const { payment_id, payment_method_id } = await request.json();

    // Implement retry logic
    const result = await retryFailedPayment(payment_id, payment_method_id);

    return NextResponse.json({ success: true, payment: result });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to retry payment' },
      { status: 500 }
    );
  }
}
```

### 4. Fix Webhook Security Tests (Priority: MEDIUM)

**Problem**: Webhook security tests are failing due to incorrect error handling.

**Files to Fix**:

- `__tests__/payments/security/webhook-security.test.ts`

**Required Changes**:

1. Fix webhook signature verification tests
2. Fix error response expectations
3. Fix security header tests
4. Fix rate limiting tests

### 5. Fix Performance Tests (Priority: LOW)

**Problem**: Performance tests are failing due to missing service implementations.

**Files to Fix**:

- `__tests__/payments/performance/payment-performance.test.ts`
- `__tests__/payments/performance/load-testing.test.ts`

**Required Changes**:

1. Fix service imports and mocking
2. Fix performance metrics collection
3. Fix load testing scenarios

## Testing Strategy

### 1. Run Tests After Each Fix

```bash
# Run specific test files to verify fixes
npm test -- __tests__/payments/services/bank-transfer-service.test.ts
npm test -- __tests__/payments/components/FailedPaymentHandler.test.tsx
npm test -- __tests__/payments/security/webhook-security.test.ts
```

### 2. Verify All Tests Pass

```bash
# Run all payment tests
npm test -- __tests__/payments/
```

### 3. Check Test Coverage

```bash
# Generate coverage report
npm run test:coverage
```

## Success Criteria

### Must Fix (Blocking for Production):

- [ ] All service tests pass (currently 20+ failures)
- [ ] All component tests pass (currently 10+ failures)
- [ ] All security tests pass (currently 15+ failures)
- [ ] Missing API routes implemented

### Should Fix (Recommended):

- [ ] All performance tests pass
- [ ] Test coverage above 80%
- [ ] E2E tests pass

## Files Modified During QA Review

The following files were enhanced during the QA review and should be preserved:

**Service Enhancements**:

- `lib/payments/bank-transfer-service.ts` - Added missing methods
- `lib/payments/receipt-service.ts` - Added missing methods
- `lib/payments/security/fraud-detection-service.ts` - Added missing methods
- `lib/payments/method-service.ts` - Added missing methods

**New Services Created**:

- `lib/payments/performance/payment-performance-service.ts`
- `lib/payments/security/audit-log-service.ts`
- `lib/payments/performance/load-tester.ts`

**QA Documentation**:

- `docs/stories/6.2.payment-processing-integration.md` - Updated QA Results
- `docs/qa/gates/6.2-payment-processing-integration.yml` - Gate decision

## Notes

1. **Preserve Existing Functionality**: Don't break existing working code
2. **Follow Patterns**: Use existing code patterns and conventions
3. **Error Handling**: Maintain proper error handling throughout
4. **Type Safety**: Ensure all TypeScript types are correct
5. **Documentation**: Update any relevant documentation

## Expected Outcome

After completing these fixes, the payment processing system should:

- Pass all tests with 80%+ coverage
- Be ready for production deployment
- Have comprehensive error handling
- Meet all security requirements
- Have proper performance monitoring

## Gate Status

Current: **CONCERNS** → Target: **PASS**

The gate will be updated to **PASS** once all critical test failures are resolved and the system demonstrates production readiness.
