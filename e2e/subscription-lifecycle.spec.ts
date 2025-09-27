/**
 * Subscription Lifecycle E2E Tests
 * Complete end-to-end tests for subscription management
 */

import { test, expect } from '@playwright/test';

test.describe('Subscription Lifecycle', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the subscription page
    await page.goto('/subscriptions');
  });

  test('complete subscription lifecycle', async ({ page }) => {
    // Step 1: User registration and login
    await page.click('[data-testid="login-button"]');
    await page.fill('[data-testid="email-input"]', 'test@example.com');
    await page.fill('[data-testid="password-input"]', 'password123');
    await page.click('[data-testid="login-submit"]');

    // Wait for login to complete
    await expect(page.locator('[data-testid="user-menu"]')).toBeVisible();

    // Step 2: Start free trial
    await page.click('[data-testid="start-trial-button"]');
    await page.selectOption('[data-testid="tier-selector"]', 'showcase');
    await page.click('[data-testid="start-trial-submit"]');

    // Verify trial started
    await expect(page.locator('[data-testid="trial-status"]')).toContainText(
      '14 days remaining'
    );
    await expect(page.locator('[data-testid="trial-tier"]')).toContainText(
      'Showcase'
    );

    // Step 3: View subscription features
    await page.click('[data-testid="view-features-button"]');
    await expect(
      page.locator('[data-testid="feature-comparison"]')
    ).toBeVisible();
    await expect(
      page.locator('[data-testid="showcase-features"]')
    ).toContainText('20 portfolio uploads');
    await expect(
      page.locator('[data-testid="showcase-features"]')
    ).toContainText('5 video uploads');

    // Step 4: Upgrade to paid subscription
    await page.click('[data-testid="upgrade-subscription-button"]');
    await page.selectOption('[data-testid="billing-cycle-selector"]', 'yearly');

    // Apply promotional code
    await page.fill('[data-testid="promotional-code-input"]', 'WELCOME10');
    await page.click('[data-testid="apply-promo-button"]');
    await expect(
      page.locator('[data-testid="discount-applied"]')
    ).toContainText('10% discount applied');

    // Verify pricing calculation
    await expect(page.locator('[data-testid="base-price"]')).toContainText(
      '$299.00'
    );
    await expect(page.locator('[data-testid="discount-amount"]')).toContainText(
      '$29.90'
    );
    await expect(page.locator('[data-testid="final-price"]')).toContainText(
      '$269.10'
    );

    // Step 5: Payment process
    await page.click('[data-testid="proceed-to-payment-button"]');

    // Fill payment form (using Stripe test card)
    await page.fill('[data-testid="card-number"]', '4242424242424242');
    await page.fill('[data-testid="card-expiry"]', '12/25');
    await page.fill('[data-testid="card-cvc"]', '123');
    await page.fill('[data-testid="card-name"]', 'Test User');

    // Submit payment
    await page.click('[data-testid="submit-payment-button"]');

    // Wait for payment processing
    await expect(
      page.locator('[data-testid="payment-processing"]')
    ).toBeVisible();
    await expect(page.locator('[data-testid="payment-success"]')).toBeVisible({
      timeout: 10000,
    });

    // Step 6: Verify subscription is active
    await expect(
      page.locator('[data-testid="subscription-status"]')
    ).toContainText('Active');
    await expect(
      page.locator('[data-testid="subscription-tier"]')
    ).toContainText('Showcase');
    await expect(page.locator('[data-testid="billing-cycle"]')).toContainText(
      'Yearly'
    );
    await expect(
      page.locator('[data-testid="next-billing-date"]')
    ).toBeVisible();

    // Step 7: Test feature access
    await page.goto('/profile');
    await page.click('[data-testid="upload-portfolio-button"]');
    await expect(page.locator('[data-testid="upload-limit"]')).toContainText(
      '20 uploads remaining'
    );

    // Step 8: View billing history
    await page.goto('/subscriptions');
    await page.click('[data-testid="billing-history-button"]');
    await expect(page.locator('[data-testid="billing-history"]')).toBeVisible();
    await expect(page.locator('[data-testid="invoice-item"]')).toContainText(
      '$269.10'
    );

    // Step 9: Test subscription management
    await page.click('[data-testid="manage-subscription-button"]');
    await expect(
      page.locator('[data-testid="subscription-management"]')
    ).toBeVisible();
    await expect(page.locator('[data-testid="upgrade-option"]')).toBeVisible();
    await expect(
      page.locator('[data-testid="downgrade-option"]')
    ).toBeVisible();
    await expect(page.locator('[data-testid="cancel-option"]')).toBeVisible();

    // Step 10: Test upgrade to Spotlight tier
    await page.click('[data-testid="upgrade-to-spotlight-button"]');
    await expect(
      page.locator('[data-testid="upgrade-confirmation"]')
    ).toBeVisible();
    await expect(
      page.locator('[data-testid="proration-amount"]')
    ).toContainText('$');

    await page.click('[data-testid="confirm-upgrade-button"]');
    await expect(page.locator('[data-testid="upgrade-success"]')).toBeVisible();

    // Verify new tier
    await expect(
      page.locator('[data-testid="subscription-tier"]')
    ).toContainText('Spotlight');
    await expect(
      page.locator('[data-testid="unlimited-features"]')
    ).toBeVisible();

    // Step 11: Test cancellation
    await page.click('[data-testid="cancel-subscription-button"]');
    await page.fill('[data-testid="cancellation-reason"]', 'No longer needed');
    await page.click('[data-testid="confirm-cancellation-button"]');

    await expect(
      page.locator('[data-testid="cancellation-confirmation"]')
    ).toBeVisible();
    await expect(
      page.locator('[data-testid="subscription-status"]')
    ).toContainText('Cancelled');
    await expect(
      page.locator('[data-testid="access-until-date"]')
    ).toBeVisible();
  });

  test('trial expiration and conversion', async ({ page }) => {
    // Start trial
    await page.click('[data-testid="start-trial-button"]');
    await page.selectOption('[data-testid="tier-selector"]', 'showcase');
    await page.click('[data-testid="start-trial-submit"]');

    // Simulate trial expiration (this would normally happen after 14 days)
    await page.evaluate(() => {
      // Mock trial expiration by setting trial_end_date to past date
      localStorage.setItem('mock_trial_expired', 'true');
    });

    // Refresh page to trigger trial expiration check
    await page.reload();

    // Verify trial expiration notification
    await expect(
      page.locator('[data-testid="trial-expired-notification"]')
    ).toBeVisible();
    await expect(
      page.locator('[data-testid="trial-expired-message"]')
    ).toContainText('Your trial has expired');

    // Test conversion flow
    await page.click('[data-testid="convert-to-paid-button"]');
    await expect(
      page.locator('[data-testid="conversion-modal"]')
    ).toBeVisible();
    await expect(
      page.locator('[data-testid="conversion-pricing"]')
    ).toBeVisible();

    // Complete conversion
    await page.selectOption(
      '[data-testid="billing-cycle-selector"]',
      'monthly'
    );
    await page.click('[data-testid="proceed-to-payment-button"]');

    // Fill payment form
    await page.fill('[data-testid="card-number"]', '4242424242424242');
    await page.fill('[data-testid="card-expiry"]', '12/25');
    await page.fill('[data-testid="card-cvc"]', '123');
    await page.fill('[data-testid="card-name"]', 'Test User');

    await page.click('[data-testid="submit-payment-button"]');
    await expect(
      page.locator('[data-testid="conversion-success"]')
    ).toBeVisible();
  });

  test('promotional code validation', async ({ page }) => {
    // Start subscription process
    await page.click('[data-testid="start-trial-button"]');
    await page.selectOption('[data-testid="tier-selector"]', 'showcase');

    // Test invalid promotional code
    await page.fill('[data-testid="promotional-code-input"]', 'INVALID123');
    await page.click('[data-testid="apply-promo-button"]');
    await expect(page.locator('[data-testid="promo-error"]')).toContainText(
      'Invalid or expired promotional code'
    );

    // Test valid promotional code
    await page.fill('[data-testid="promotional-code-input"]', 'WELCOME10');
    await page.click('[data-testid="apply-promo-button"]');
    await expect(page.locator('[data-testid="promo-success"]')).toContainText(
      '10% discount applied'
    );

    // Test expired promotional code
    await page.fill('[data-testid="promotional-code-input"]', 'EXPIRED123');
    await page.click('[data-testid="apply-promo-button"]');
    await expect(page.locator('[data-testid="promo-error"]')).toContainText(
      'Promotional code has expired'
    );

    // Test usage limit exceeded
    await page.fill('[data-testid="promotional-code-input"]', 'LIMITED123');
    await page.click('[data-testid="apply-promo-button"]');
    await expect(page.locator('[data-testid="promo-error"]')).toContainText(
      'Usage limit exceeded'
    );
  });

  test('subscription upgrade and downgrade', async ({ page }) => {
    // Start with paid subscription
    await page.click('[data-testid="start-trial-button"]');
    await page.selectOption('[data-testid="tier-selector"]', 'showcase');
    await page.click('[data-testid="start-trial-submit"]');

    // Complete payment to activate subscription
    await page.click('[data-testid="upgrade-subscription-button"]');
    await page.selectOption(
      '[data-testid="billing-cycle-selector"]',
      'monthly'
    );
    await page.click('[data-testid="proceed-to-payment-button"]');

    await page.fill('[data-testid="card-number"]', '4242424242424242');
    await page.fill('[data-testid="card-expiry"]', '12/25');
    await page.fill('[data-testid="card-cvc"]', '123');
    await page.fill('[data-testid="card-name"]', 'Test User');
    await page.click('[data-testid="submit-payment-button"]');

    await expect(page.locator('[data-testid="payment-success"]')).toBeVisible();

    // Test upgrade to Spotlight
    await page.click('[data-testid="upgrade-to-spotlight-button"]');
    await expect(page.locator('[data-testid="upgrade-modal"]')).toBeVisible();
    await expect(page.locator('[data-testid="upgrade-pricing"]')).toContainText(
      '$69.00'
    );
    await expect(page.locator('[data-testid="proration-info"]')).toBeVisible();

    await page.click('[data-testid="confirm-upgrade-button"]');
    await expect(page.locator('[data-testid="upgrade-success"]')).toBeVisible();
    await expect(
      page.locator('[data-testid="subscription-tier"]')
    ).toContainText('Spotlight');

    // Test downgrade to Essential
    await page.click('[data-testid="downgrade-to-essential-button"]');
    await expect(page.locator('[data-testid="downgrade-modal"]')).toBeVisible();
    await expect(
      page.locator('[data-testid="downgrade-warning"]')
    ).toContainText('You will lose access to premium features');

    await page.click('[data-testid="confirm-downgrade-button"]');
    await expect(
      page.locator('[data-testid="downgrade-success"]')
    ).toBeVisible();
    await expect(
      page.locator('[data-testid="subscription-tier"]')
    ).toContainText('Essential');
  });

  test('error handling and recovery', async ({ page }) => {
    // Test payment failure
    await page.click('[data-testid="start-trial-button"]');
    await page.selectOption('[data-testid="tier-selector"]', 'showcase');
    await page.click('[data-testid="start-trial-submit"]');

    await page.click('[data-testid="upgrade-subscription-button"]');
    await page.selectOption(
      '[data-testid="billing-cycle-selector"]',
      'monthly'
    );
    await page.click('[data-testid="proceed-to-payment-button"]');

    // Use card that will be declined
    await page.fill('[data-testid="card-number"]', '4000000000000002');
    await page.fill('[data-testid="card-expiry"]', '12/25');
    await page.fill('[data-testid="card-cvc"]', '123');
    await page.fill('[data-testid="card-name"]', 'Test User');

    await page.click('[data-testid="submit-payment-button"]');
    await expect(page.locator('[data-testid="payment-error"]')).toBeVisible();
    await expect(
      page.locator('[data-testid="payment-error-message"]')
    ).toContainText('Your card was declined');

    // Test retry with different card
    await page.fill('[data-testid="card-number"]', '4242424242424242');
    await page.click('[data-testid="retry-payment-button"]');
    await expect(page.locator('[data-testid="payment-success"]')).toBeVisible();

    // Test network error handling
    await page.route('**/api/subscriptions/**', route => route.abort());

    await page.click('[data-testid="manage-subscription-button"]');
    await expect(page.locator('[data-testid="error-message"]')).toBeVisible();
    await expect(page.locator('[data-testid="retry-button"]')).toBeVisible();

    // Test retry after network recovery
    await page.unroute('**/api/subscriptions/**');
    await page.click('[data-testid="retry-button"]');
    await expect(
      page.locator('[data-testid="subscription-management"]')
    ).toBeVisible();
  });

  test('admin subscription management', async ({ page }) => {
    // Login as admin
    await page.click('[data-testid="login-button"]');
    await page.fill('[data-testid="email-input"]', 'admin@example.com');
    await page.fill('[data-testid="password-input"]', 'admin123');
    await page.click('[data-testid="login-submit"]');

    // Navigate to admin subscription management
    await page.goto('/admin/subscriptions');
    await expect(
      page.locator('[data-testid="admin-subscription-dashboard"]')
    ).toBeVisible();

    // View all subscriptions
    await expect(
      page.locator('[data-testid="subscription-list"]')
    ).toBeVisible();
    await expect(
      page.locator('[data-testid="subscription-item"]')
    ).toHaveCount.greaterThan(0);

    // Filter subscriptions
    await page.selectOption('[data-testid="status-filter"]', 'active');
    await page.selectOption('[data-testid="tier-filter"]', 'showcase');
    await expect(
      page.locator('[data-testid="filtered-subscription-count"]')
    ).toBeVisible();

    // View subscription details
    await page.click('[data-testid="view-subscription-details"]');
    await expect(
      page.locator('[data-testid="subscription-details-modal"]')
    ).toBeVisible();
    await expect(
      page.locator('[data-testid="subscription-analytics"]')
    ).toBeVisible();

    // Test subscription management actions
    await page.click('[data-testid="pause-subscription-button"]');
    await expect(
      page.locator('[data-testid="pause-confirmation"]')
    ).toBeVisible();
    await page.click('[data-testid="confirm-pause-button"]');
    await expect(
      page.locator('[data-testid="subscription-paused"]')
    ).toBeVisible();

    // Test reactivation
    await page.click('[data-testid="reactivate-subscription-button"]');
    await expect(
      page.locator('[data-testid="reactivation-success"]')
    ).toBeVisible();

    // Test promotional code management
    await page.click('[data-testid="promotional-codes-tab"]');
    await expect(
      page.locator('[data-testid="promotional-codes-list"]')
    ).toBeVisible();

    await page.click('[data-testid="create-promo-code-button"]');
    await page.fill('[data-testid="promo-code-input"]', 'NEWYEAR2024');
    await page.fill('[data-testid="discount-value-input"]', '20');
    await page.selectOption(
      '[data-testid="discount-type-selector"]',
      'percentage'
    );
    await page.click('[data-testid="create-promo-submit"]');
    await expect(
      page.locator('[data-testid="promo-created-success"]')
    ).toBeVisible();
  });
});
