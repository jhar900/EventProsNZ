# Testing Guide

## Overview

This project includes comprehensive testing infrastructure with both unit/integration tests and end-to-end tests.

## Testing Stack

### Unit/Integration Tests

- **Jest**: Test runner and assertion library
- **React Testing Library**: Component testing utilities
- **@testing-library/jest-dom**: Custom Jest matchers for DOM testing

### End-to-End Tests

- **Playwright**: Cross-browser E2E testing
- **Multiple browsers**: Chrome, Firefox, Safari, Mobile Chrome, Mobile Safari

## Test Structure

```
├── __tests__/                    # Unit/Integration tests
│   ├── api/                      # API endpoint tests
│   ├── components/               # Component tests
│   ├── lib/                      # Library/utility tests
│   └── utils/                    # Test utilities
├── e2e/                         # End-to-end tests
│   ├── homepage.spec.ts         # Homepage E2E tests
│   ├── demo-hub.spec.ts         # Demo hub E2E tests
│   └── maps-demo.spec.ts        # Maps demo E2E tests
├── jest.config.js               # Jest configuration
├── jest.setup.js                # Jest setup file
└── playwright.config.ts         # Playwright configuration
```

## Running Tests

### Unit/Integration Tests

```bash
# Run all tests
npm run test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run specific test file
npm test -- __tests__/api/maps-check-config.test.ts
```

### End-to-End Tests

```bash
# Run all E2E tests
npm run test:e2e

# Run E2E tests with UI
npm run test:e2e:ui

# Run E2E tests in headed mode
npm run test:e2e:headed

# Run specific E2E test
npx playwright test e2e/homepage.spec.ts
```

### All Tests

```bash
# Run both unit and E2E tests
npm run test:all

# Run tests for CI
npm run test:ci
```

## Test Coverage

The project maintains a minimum coverage threshold of 70% for:

- Branches
- Functions
- Lines
- Statements

Coverage reports are generated in the `coverage/` directory.

## Writing Tests

### Unit Tests

Unit tests should focus on testing individual functions, components, and API endpoints in isolation.

Example:

```typescript
import { GET } from "@/app/api/maps/check-config/route";

describe("/api/maps/check-config", () => {
  it("should return configured true when MAPBOX_TOKEN is set", async () => {
    process.env.NEXT_PUBLIC_MAPBOX_TOKEN = "test-token";

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.configured).toBe(true);
  });
});
```

### Component Tests

Component tests should test user interactions and rendering behavior.

Example:

```typescript
import { render, screen } from "@testing-library/react";
import GoogleAnalytics from "@/components/GoogleAnalytics";

describe("GoogleAnalytics Component", () => {
  it("should render without crashing", () => {
    render(<GoogleAnalytics />);
    expect(screen.queryByText("Google Analytics")).not.toBeInTheDocument();
  });
});
```

### E2E Tests

E2E tests should test complete user workflows and cross-browser compatibility.

Example:

```typescript
import { test, expect } from "@playwright/test";

test.describe("Homepage", () => {
  test("should load the homepage successfully", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/Event Pros NZ/);
    await expect(page.locator("h1")).toBeVisible();
  });
});
```

## Test Data

Test data is available in:

- `docs/qa/test-data/sample-events.json`
- `docs/qa/test-data/sample-users.json`

## Mocking

### Environment Variables

Environment variables are mocked in `jest.setup.js` and individual test files.

### External Services

External services (Stripe, SendGrid, Mapbox) are mocked in tests to avoid making real API calls.

### Next.js Features

Next.js router and navigation are mocked in `jest.setup.js` and test utilities.

## CI/CD Integration

Tests are configured to run in CI environments with:

- Coverage reporting
- Multiple browser testing
- Parallel test execution
- Failure reporting

## Best Practices

1. **Test Isolation**: Each test should be independent and not rely on other tests
2. **Descriptive Names**: Test names should clearly describe what is being tested
3. **Arrange-Act-Assert**: Structure tests with clear setup, execution, and verification
4. **Mock External Dependencies**: Avoid making real API calls in tests
5. **Test Edge Cases**: Include tests for error conditions and edge cases
6. **Maintain Test Data**: Keep test data up to date and realistic
7. **Regular Test Runs**: Run tests frequently during development

## Troubleshooting

### Common Issues

1. **Tests failing due to environment variables**: Ensure all required environment variables are mocked
2. **Component tests failing**: Check that all required providers are included in test setup
3. **E2E tests timing out**: Increase timeout values or add proper wait conditions
4. **Coverage not meeting thresholds**: Add more test cases or adjust thresholds

### Debug Mode

Run tests in debug mode for detailed output:

```bash
# Jest debug mode
npm test -- --verbose

# Playwright debug mode
npx playwright test --debug
```

## Continuous Improvement

- Regularly review and update test coverage
- Add tests for new features and bug fixes
- Refactor tests to improve maintainability
- Update test data and mocks as needed
- Monitor test performance and optimize slow tests
