/**
 * Payment Flow E2E Tests
 * Comprehensive end-to-end testing for complete payment workflows
 */

import { test, expect } from '@playwright/test';

test.describe('Payment Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Mock authentication
    await page.goto('/login');
    await page.fill('[data-testid="email-input"]', 'test@example.com');
    await page.fill('[data-testid="password-input"]', 'password123');
    await page.click('[data-testid="login-button"]');

    // Wait for dashboard to load
    await page.waitForSelector('[data-testid="dashboard"]');
  });

  test('should complete successful payment flow', async ({ page }) => {
    // Navigate to subscription page
    await page.goto('/subscriptions');
    await page.waitForSelector('[data-testid="subscription-tiers"]');

    // Select Essential tier
    await page.click('[data-testid="essential-tier"]');
    await page.click('[data-testid="select-tier-button"]');

    // Navigate to payment page
    await page.waitForSelector('[data-testid="payment-form"]');

    // Fill payment form with test card
    await page.fill('[data-testid="card-number"]', '4242424242424242');
    await page.fill('[data-testid="cardholder-name"]', 'John Doe');
    await page.selectOption('[data-testid="expiry-month"]', '12');
    await page.selectOption('[data-testid="expiry-year"]', '2025');
    await page.fill('[data-testid="cvv"]', '123');

    // Accept terms
    await page.check('[data-testid="terms-checkbox"]');

    // Submit payment
    await page.click('[data-testid="submit-payment"]');

    // Wait for payment processing
    await page.waitForSelector('[data-testid="payment-processing"]');

    // Verify success page
    await page.waitForSelector('[data-testid="payment-success"]');
    expect(await page.textContent('[data-testid="success-message"]')).toContain(
      'Payment Successful'
    );

    // Verify receipt generation
    await page.waitForSelector('[data-testid="receipt-download"]');
    expect(await page.isVisible('[data-testid="receipt-number"]')).toBeTruthy();
  });

  test('should handle payment failure gracefully', async ({ page }) => {
    // Navigate to subscription page
    await page.goto('/subscriptions');
    await page.waitForSelector('[data-testid="subscription-tiers"]');

    // Select Essential tier
    await page.click('[data-testid="essential-tier"]');
    await page.click('[data-testid="select-tier-button"]');

    // Navigate to payment page
    await page.waitForSelector('[data-testid="payment-form"]');

    // Fill payment form with declined card
    await page.fill('[data-testid="card-number"]', '4000000000000002');
    await page.fill('[data-testid="cardholder-name"]', 'John Doe');
    await page.selectOption('[data-testid="expiry-month"]', '12');
    await page.selectOption('[data-testid="expiry-year"]', '2025');
    await page.fill('[data-testid="cvv"]', '123');

    // Accept terms
    await page.check('[data-testid="terms-checkbox"]');

    // Submit payment
    await page.click('[data-testid="submit-payment"]');

    // Wait for payment failure
    await page.waitForSelector('[data-testid="payment-failed"]');
    expect(await page.textContent('[data-testid="error-message"]')).toContain(
      'Your card was declined'
    );

    // Verify retry options are available
    expect(await page.isVisible('[data-testid="retry-payment"]')).toBeTruthy();
    expect(
      await page.isVisible('[data-testid="update-payment-method"]')
    ).toBeTruthy();
  });

  test('should handle payment method management', async ({ page }) => {
    // Navigate to payment methods page
    await page.goto('/profile/payment-methods');
    await page.waitForSelector('[data-testid="payment-methods"]');

    // Add new payment method
    await page.click('[data-testid="add-payment-method"]');
    await page.waitForSelector('[data-testid="add-payment-form"]');

    // Fill new payment method form
    await page.fill('[data-testid="card-number"]', '5555555555554444');
    await page.fill('[data-testid="cardholder-name"]', 'Jane Doe');
    await page.selectOption('[data-testid="expiry-month"]', '06');
    await page.selectOption('[data-testid="expiry-year"]', '2026');
    await page.fill('[data-testid="cvv"]', '456');

    // Save payment method
    await page.click('[data-testid="save-payment-method"]');

    // Verify payment method was added
    await page.waitForSelector('[data-testid="payment-method-added"]');
    expect(await page.textContent('[data-testid="payment-methods"]')).toContain(
      '5555'
    );

    // Set as default
    await page.click('[data-testid="set-default-payment-method"]');
    await page.waitForSelector('[data-testid="default-indicator"]');

    // Delete payment method
    await page.click('[data-testid="delete-payment-method"]');
    await page.click('[data-testid="confirm-delete"]');

    // Verify payment method was deleted
    await page.waitForSelector('[data-testid="payment-method-deleted"]');
    expect(
      await page.textContent('[data-testid="payment-methods"]')
    ).not.toContain('5555');
  });

  test('should handle bank transfer fallback', async ({ page }) => {
    // Navigate to subscription page
    await page.goto('/subscriptions');
    await page.waitForSelector('[data-testid="subscription-tiers"]');

    // Select Essential tier
    await page.click('[data-testid="essential-tier"]');
    await page.click('[data-testid="select-tier-button"]');

    // Navigate to payment page
    await page.waitForSelector('[data-testid="payment-form"]');

    // Select bank transfer option
    await page.click('[data-testid="bank-transfer-option"]');
    await page.waitForSelector('[data-testid="bank-transfer-form"]');

    // Fill bank transfer form
    await page.fill('[data-testid="bank-account-name"]', 'John Doe');
    await page.fill('[data-testid="bank-account-number"]', '1234567890');
    await page.fill('[data-testid="bank-routing-number"]', '021000021');

    // Submit bank transfer request
    await page.click('[data-testid="submit-bank-transfer"]');

    // Verify bank transfer instructions
    await page.waitForSelector('[data-testid="bank-transfer-instructions"]');
    expect(
      await page.textContent('[data-testid="bank-transfer-instructions"]')
    ).toContain('Bank Transfer Instructions');

    // Verify reference number
    expect(
      await page.isVisible('[data-testid="reference-number"]')
    ).toBeTruthy();
  });

  test('should handle payment retry flow', async ({ page }) => {
    // Navigate to failed payments page
    await page.goto('/payments/failed');
    await page.waitForSelector('[data-testid="failed-payments"]');

    // Verify failed payment is displayed
    expect(await page.textContent('[data-testid="failed-payments"]')).toContain(
      'Card declined'
    );

    // Retry payment with different method
    await page.click('[data-testid="retry-payment"]');
    await page.waitForSelector('[data-testid="retry-payment-modal"]');

    // Select different payment method
    await page.selectOption('[data-testid="payment-method-select"]', 'pm_2');

    // Confirm retry
    await page.click('[data-testid="confirm-retry"]');

    // Wait for retry processing
    await page.waitForSelector('[data-testid="retry-processing"]');

    // Verify retry result
    await page.waitForSelector('[data-testid="retry-result"]');
    expect(await page.textContent('[data-testid="retry-result"]')).toContain(
      'Payment retry successful'
    );
  });

  test('should handle receipt management', async ({ page }) => {
    // Navigate to payments history
    await page.goto('/payments/history');
    await page.waitForSelector('[data-testid="payments-history"]');

    // Find a successful payment
    const paymentRow = page.locator('[data-testid="payment-row"]').first();
    await paymentRow.waitFor();

    // Download receipt
    await paymentRow.locator('[data-testid="download-receipt"]').click();
    await page.waitForSelector('[data-testid="receipt-downloaded"]');

    // Send receipt via email
    await paymentRow.locator('[data-testid="send-receipt"]').click();
    await page.waitForSelector('[data-testid="send-receipt-modal"]');

    // Fill email and send
    await page.fill('[data-testid="receipt-email"]', 'test@example.com');
    await page.click('[data-testid="send-receipt-button"]');

    // Verify receipt was sent
    await page.waitForSelector('[data-testid="receipt-sent"]');
    expect(await page.textContent('[data-testid="receipt-sent"]')).toContain(
      'Receipt sent successfully'
    );
  });

  test('should handle subscription upgrade flow', async ({ page }) => {
    // Navigate to current subscription
    await page.goto('/subscriptions/current');
    await page.waitForSelector('[data-testid="current-subscription"]');

    // Verify current tier
    expect(await page.textContent('[data-testid="current-tier"]')).toContain(
      'Essential'
    );

    // Upgrade to Professional
    await page.click('[data-testid="upgrade-subscription"]');
    await page.waitForSelector('[data-testid="upgrade-modal"]');

    // Select Professional tier
    await page.click('[data-testid="professional-tier"]');
    await page.click('[data-testid="confirm-upgrade"]');

    // Navigate to payment page
    await page.waitForSelector('[data-testid="payment-form"]');

    // Use existing payment method
    await page.click('[data-testid="existing-payment-method"]');
    await page.selectOption('[data-testid="payment-method-select"]', 'pm_1');

    // Accept terms and submit
    await page.check('[data-testid="terms-checkbox"]');
    await page.click('[data-testid="submit-payment"]');

    // Wait for upgrade completion
    await page.waitForSelector('[data-testid="upgrade-success"]');
    expect(await page.textContent('[data-testid="upgrade-success"]')).toContain(
      'Subscription upgraded successfully'
    );
  });

  test('should handle payment notifications', async ({ page }) => {
    // Navigate to payment notifications
    await page.goto('/payments/notifications');
    await page.waitForSelector('[data-testid="payment-notifications"]');

    // Verify notification history
    expect(
      await page.textContent('[data-testid="notification-history"]')
    ).toContain('Payment successful');

    // Send test notification
    await page.click('[data-testid="send-test-notification"]');
    await page.waitForSelector('[data-testid="notification-sent"]');

    // Verify notification was sent
    expect(
      await page.textContent('[data-testid="notification-sent"]')
    ).toContain('Notification sent successfully');
  });

  test('should handle mobile payment flow', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    // Navigate to subscription page
    await page.goto('/subscriptions');
    await page.waitForSelector('[data-testid="subscription-tiers"]');

    // Select Essential tier
    await page.click('[data-testid="essential-tier"]');
    await page.click('[data-testid="select-tier-button"]');

    // Navigate to payment page
    await page.waitForSelector('[data-testid="payment-form"]');

    // Verify mobile-optimized form
    expect(
      await page.isVisible('[data-testid="mobile-payment-form"]')
    ).toBeTruthy();

    // Fill payment form
    await page.fill('[data-testid="card-number"]', '4242424242424242');
    await page.fill('[data-testid="cardholder-name"]', 'John Doe');
    await page.selectOption('[data-testid="expiry-month"]', '12');
    await page.selectOption('[data-testid="expiry-year"]', '2025');
    await page.fill('[data-testid="cvv"]', '123');

    // Accept terms
    await page.check('[data-testid="terms-checkbox"]');

    // Submit payment
    await page.click('[data-testid="submit-payment"]');

    // Wait for success
    await page.waitForSelector('[data-testid="payment-success"]');
    expect(await page.textContent('[data-testid="success-message"]')).toContain(
      'Payment Successful'
    );
  });

  test('should handle payment security features', async ({ page }) => {
    // Navigate to payment security page
    await page.goto('/payments/security');
    await page.waitForSelector('[data-testid="payment-security"]');

    // Verify security indicators
    expect(
      await page.textContent('[data-testid="security-indicators"]')
    ).toContain('SSL Encrypted');
    expect(
      await page.textContent('[data-testid="security-indicators"]')
    ).toContain('PCI Compliant');

    // Test fraud detection
    await page.goto('/subscriptions');
    await page.click('[data-testid="essential-tier"]');
    await page.click('[data-testid="select-tier-button"]');

    // Use suspicious card (should trigger fraud detection)
    await page.fill('[data-testid="card-number"]', '4000000000000119');
    await page.fill('[data-testid="cardholder-name"]', 'John Doe');
    await page.selectOption('[data-testid="expiry-month"]', '12');
    await page.selectOption('[data-testid="expiry-year"]', '2025');
    await page.fill('[data-testid="cvv"]', '123');

    await page.check('[data-testid="terms-checkbox"]');
    await page.click('[data-testid="submit-payment"]');

    // Verify fraud detection
    await page.waitForSelector('[data-testid="fraud-detection"]');
    expect(await page.textContent('[data-testid="fraud-detection"]')).toContain(
      'Additional verification required'
    );
  });

  test('should handle payment analytics', async ({ page }) => {
    // Navigate to payment analytics
    await page.goto('/payments/analytics');
    await page.waitForSelector('[data-testid="payment-analytics"]');

    // Verify analytics data
    expect(await page.isVisible('[data-testid="payment-chart"]')).toBeTruthy();
    expect(await page.isVisible('[data-testid="success-rate"]')).toBeTruthy();
    expect(await page.isVisible('[data-testid="total-revenue"]')).toBeTruthy();

    // Test date range filtering
    await page.selectOption('[data-testid="date-range"]', 'last-30-days');
    await page.waitForSelector('[data-testid="analytics-updated"]');

    // Verify filtered data
    expect(
      await page.textContent('[data-testid="date-range-display"]')
    ).toContain('Last 30 days');
  });
});
