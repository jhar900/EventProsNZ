import { test, expect } from '@playwright/test';

test.describe('Trial Conversion Flow - E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the trial signup page
    await page.goto('/trial/signup');
  });

  test('should complete full trial conversion flow', async ({ page }) => {
    // Step 1: Sign up for trial
    await page.fill('[data-testid="email-input"]', 'test@example.com');
    await page.fill('[data-testid="password-input"]', 'TestPassword123!');
    await page.fill('[data-testid="first-name-input"]', 'John');
    await page.fill('[data-testid="last-name-input"]', 'Doe');
    await page.click('[data-testid="signup-button"]');

    // Wait for redirect to trial dashboard
    await expect(page).toHaveURL('/trial/dashboard');
    await expect(page.locator('[data-testid="trial-dashboard"]')).toBeVisible();

    // Step 2: Complete profile setup
    await page.click('[data-testid="complete-profile-button"]');
    await page.fill(
      '[data-testid="bio-input"]',
      'Professional event contractor with 5+ years experience'
    );
    await page.selectOption(
      '[data-testid="service-categories-select"]',
      'photography'
    );
    await page.uploadFile(
      '[data-testid="portfolio-upload"]',
      'test-portfolio.jpg'
    );
    await page.click('[data-testid="save-profile-button"]');

    // Verify profile completion
    await expect(
      page.locator('[data-testid="profile-completion"]')
    ).toContainText('100%');

    // Step 3: Explore trial features
    await page.click('[data-testid="search-tab"]');
    await page.fill('[data-testid="search-input"]', 'wedding photography');
    await page.click('[data-testid="search-button"]');
    await expect(page.locator('[data-testid="search-results"]')).toBeVisible();

    // Step 4: Contact a contractor
    await page.click('[data-testid="contact-contractor-button"]');
    await page.fill(
      '[data-testid="message-input"]',
      "Hi, I'm interested in your photography services for my wedding."
    );
    await page.click('[data-testid="send-message-button"]');
    await expect(page.locator('[data-testid="success-message"]')).toBeVisible();

    // Step 5: Check trial analytics
    await page.click('[data-testid="analytics-tab"]');
    await expect(page.locator('[data-testid="trial-analytics"]')).toBeVisible();
    await expect(
      page.locator('[data-testid="conversion-likelihood"]')
    ).toBeVisible();

    // Step 6: Receive trial emails (simulated)
    await page.click('[data-testid="check-email-button"]');
    await expect(page.locator('[data-testid="trial-emails"]')).toBeVisible();

    // Step 7: Upgrade to paid plan
    await page.click('[data-testid="upgrade-button"]');
    await expect(page).toHaveURL('/trial/upgrade');

    await page.click('[data-testid="showcase-plan-button"]');
    await expect(page).toHaveURL('/payments/checkout');

    // Fill payment form
    await page.fill('[data-testid="card-number-input"]', '4242424242424242');
    await page.fill('[data-testid="card-expiry-input"]', '12/25');
    await page.fill('[data-testid="card-cvc-input"]', '123');
    await page.fill('[data-testid="card-name-input"]', 'John Doe');
    await page.click('[data-testid="submit-payment-button"]');

    // Wait for payment processing
    await expect(page.locator('[data-testid="payment-success"]')).toBeVisible();
    await expect(page).toHaveURL('/dashboard');
  });

  test('should handle trial expiration gracefully', async ({ page }) => {
    // Navigate to expired trial dashboard
    await page.goto('/trial/dashboard?expired=true');

    // Should show expiration message
    await expect(
      page.locator('[data-testid="trial-expired-message"]')
    ).toBeVisible();
    await expect(page.locator('[data-testid="upgrade-button"]')).toBeVisible();

    // Should redirect to upgrade page
    await page.click('[data-testid="upgrade-button"]');
    await expect(page).toHaveURL('/trial/upgrade');
  });

  test('should track user engagement throughout trial', async ({ page }) => {
    // Start trial
    await page.goto('/trial/signup');
    await page.fill(
      '[data-testid="email-input"]',
      'engagement-test@example.com'
    );
    await page.fill('[data-testid="password-input"]', 'TestPassword123!');
    await page.fill('[data-testid="first-name-input"]', 'Engagement');
    await page.fill('[data-testid="last-name-input"]', 'Tester');
    await page.click('[data-testid="signup-button"]');

    // Simulate high engagement
    await page.click('[data-testid="complete-profile-button"]');
    await page.fill('[data-testid="bio-input"]', 'Highly engaged user');
    await page.selectOption(
      '[data-testid="service-categories-select"]',
      'photography'
    );
    await page.uploadFile(
      '[data-testid="portfolio-upload"]',
      'test-portfolio.jpg'
    );
    await page.click('[data-testid="save-profile-button"]');

    // Use search feature multiple times
    for (let i = 0; i < 5; i++) {
      await page.click('[data-testid="search-tab"]');
      await page.fill('[data-testid="search-input"]', `search query ${i}`);
      await page.click('[data-testid="search-button"]');
      await page.waitForSelector('[data-testid="search-results"]');
    }

    // Contact multiple contractors
    for (let i = 0; i < 3; i++) {
      await page.click('[data-testid="contact-contractor-button"]');
      await page.fill('[data-testid="message-input"]', `Message ${i}`);
      await page.click('[data-testid="send-message-button"]');
      await page.waitForSelector('[data-testid="success-message"]');
    }

    // Check analytics show high engagement
    await page.click('[data-testid="analytics-tab"]');
    await expect(
      page.locator('[data-testid="engagement-score"]')
    ).toContainText('High');
    await expect(
      page.locator('[data-testid="conversion-likelihood"]')
    ).toContainText('80%');
  });

  test('should send appropriate trial emails based on engagement', async ({
    page,
  }) => {
    // Start trial
    await page.goto('/trial/signup');
    await page.fill('[data-testid="email-input"]', 'email-test@example.com');
    await page.fill('[data-testid="password-input"]', 'TestPassword123!');
    await page.fill('[data-testid="first-name-input"]', 'Email');
    await page.fill('[data-testid="last-name-input"]', 'Tester');
    await page.click('[data-testid="signup-button"]');

    // Check for Day 2 email
    await page.click('[data-testid="check-email-button"]');
    await expect(page.locator('[data-testid="day-2-email"]')).toBeVisible();
    await expect(page.locator('[data-testid="day-2-email"]')).toContainText(
      'Optimize Your Profile'
    );

    // Simulate Day 7
    await page.goto('/trial/dashboard?day=7');
    await page.click('[data-testid="check-email-button"]');
    await expect(page.locator('[data-testid="day-7-email"]')).toBeVisible();
    await expect(page.locator('[data-testid="day-7-email"]')).toContainText(
      'How is your trial going?'
    );

    // Simulate Day 12
    await page.goto('/trial/dashboard?day=12');
    await page.click('[data-testid="check-email-button"]');
    await expect(page.locator('[data-testid="day-12-email"]')).toBeVisible();
    await expect(page.locator('[data-testid="day-12-email"]')).toContainText(
      'Your trial ends soon'
    );
  });

  test('should handle payment conversion flow', async ({ page }) => {
    // Navigate to upgrade page
    await page.goto('/trial/upgrade');

    // Select Showcase plan
    await page.click('[data-testid="showcase-plan-button"]');
    await expect(page).toHaveURL('/payments/checkout');

    // Fill payment form
    await page.fill('[data-testid="card-number-input"]', '4242424242424242');
    await page.fill('[data-testid="card-expiry-input"]', '12/25');
    await page.fill('[data-testid="card-cvc-input"]', '123');
    await page.fill('[data-testid="card-name-input"]', 'John Doe');
    await page.click('[data-testid="submit-payment-button"]');

    // Wait for payment processing
    await expect(page.locator('[data-testid="payment-success"]')).toBeVisible();
    await expect(page).toHaveURL('/dashboard');

    // Verify conversion tracking
    await page.goto('/trial/analytics');
    await expect(
      page.locator('[data-testid="conversion-status"]')
    ).toContainText('Converted');
    await expect(page.locator('[data-testid="conversion-tier"]')).toContainText(
      'Showcase'
    );
  });

  test('should handle payment failure gracefully', async ({ page }) => {
    // Navigate to upgrade page
    await page.goto('/trial/upgrade');

    // Select Showcase plan
    await page.click('[data-testid="showcase-plan-button"]');
    await expect(page).toHaveURL('/payments/checkout');

    // Fill payment form with invalid card
    await page.fill('[data-testid="card-number-input"]', '4000000000000002');
    await page.fill('[data-testid="card-expiry-input"]', '12/25');
    await page.fill('[data-testid="card-cvc-input"]', '123');
    await page.fill('[data-testid="card-name-input"]', 'John Doe');
    await page.click('[data-testid="submit-payment-button"]');

    // Should show payment failure message
    await expect(page.locator('[data-testid="payment-error"]')).toBeVisible();
    await expect(
      page.locator('[data-testid="retry-payment-button"]')
    ).toBeVisible();

    // Should allow retry
    await page.click('[data-testid="retry-payment-button"]');
    await expect(page.locator('[data-testid="payment-form"]')).toBeVisible();
  });

  test('should provide trial analytics and insights', async ({ page }) => {
    // Navigate to trial analytics
    await page.goto('/trial/analytics');

    // Should show trial metrics
    await expect(page.locator('[data-testid="trial-metrics"]')).toBeVisible();
    await expect(page.locator('[data-testid="days-remaining"]')).toBeVisible();
    await expect(page.locator('[data-testid="feature-usage"]')).toBeVisible();
    await expect(
      page.locator('[data-testid="engagement-score"]')
    ).toBeVisible();
    await expect(
      page.locator('[data-testid="conversion-likelihood"]')
    ).toBeVisible();

    // Should show recommendations
    await expect(page.locator('[data-testid="recommendations"]')).toBeVisible();
    await expect(
      page.locator('[data-testid="recommendation-item"]')
    ).toHaveCount.greaterThan(0);
  });

  test('should handle trial extension requests', async ({ page }) => {
    // Navigate to trial dashboard with low engagement
    await page.goto('/trial/dashboard?engagement=low');

    // Should show extension offer
    await expect(page.locator('[data-testid="extension-offer"]')).toBeVisible();
    await expect(
      page.locator('[data-testid="request-extension-button"]')
    ).toBeVisible();

    // Request extension
    await page.click('[data-testid="request-extension-button"]');
    await expect(
      page.locator('[data-testid="extension-requested"]')
    ).toBeVisible();
  });

  test('should handle trial cancellation', async ({ page }) => {
    // Navigate to trial dashboard
    await page.goto('/trial/dashboard');

    // Should show cancellation option
    await expect(
      page.locator('[data-testid="cancel-trial-button"]')
    ).toBeVisible();

    // Cancel trial
    await page.click('[data-testid="cancel-trial-button"]');
    await expect(
      page.locator('[data-testid="cancellation-confirmation"]')
    ).toBeVisible();

    // Confirm cancellation
    await page.click('[data-testid="confirm-cancellation-button"]');
    await expect(page.locator('[data-testid="trial-cancelled"]')).toBeVisible();
  });

  test('should handle trial reactivation', async ({ page }) => {
    // Navigate to cancelled trial
    await page.goto('/trial/dashboard?cancelled=true');

    // Should show reactivation option
    await expect(
      page.locator('[data-testid="reactivate-trial-button"]')
    ).toBeVisible();

    // Reactivate trial
    await page.click('[data-testid="reactivate-trial-button"]');
    await expect(
      page.locator('[data-testid="trial-reactivated"]')
    ).toBeVisible();
  });
});
