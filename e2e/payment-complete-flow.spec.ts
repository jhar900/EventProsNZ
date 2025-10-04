/**
 * Payment Complete Flow E2E Tests
 * Tests complete payment workflows from start to finish
 */

import { test, expect } from '@playwright/test';

test.describe('Payment Complete Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to payment page
    await page.goto('/payments');
  });

  test('should complete payment with new credit card', async ({ page }) => {
    // Fill payment form
    await page.fill('[data-testid="amount-input"]', '29.99');
    await page.selectOption('[data-testid="currency-select"]', 'NZD');

    // Select new card option
    await page.click('[data-testid="payment-method-select"]');
    await page.click('[data-testid="new-card-option"]');

    // Fill card details
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
    await expect(
      page.locator('[data-testid="payment-processing"]')
    ).toBeVisible();

    // Wait for success message
    await expect(page.locator('[data-testid="payment-success"]')).toBeVisible();

    // Verify payment details
    await expect(page.locator('[data-testid="payment-amount"]')).toContainText(
      '$29.99'
    );
    await expect(
      page.locator('[data-testid="payment-currency"]')
    ).toContainText('NZD');
    await expect(page.locator('[data-testid="payment-status"]')).toContainText(
      'Completed'
    );
  });

  test('should complete payment with existing payment method', async ({
    page,
  }) => {
    // Fill payment form
    await page.fill('[data-testid="amount-input"]', '49.99');
    await page.selectOption('[data-testid="currency-select"]', 'NZD');

    // Select existing payment method
    await page.click('[data-testid="payment-method-select"]');
    await page.click('[data-testid="existing-method-option"]');

    // Accept terms
    await page.check('[data-testid="terms-checkbox"]');

    // Submit payment
    await page.click('[data-testid="submit-payment"]');

    // Wait for payment processing
    await expect(
      page.locator('[data-testid="payment-processing"]')
    ).toBeVisible();

    // Wait for success message
    await expect(page.locator('[data-testid="payment-success"]')).toBeVisible();

    // Verify payment details
    await expect(page.locator('[data-testid="payment-amount"]')).toContainText(
      '$49.99'
    );
    await expect(
      page.locator('[data-testid="payment-currency"]')
    ).toContainText('NZD');
    await expect(page.locator('[data-testid="payment-status"]')).toContainText(
      'Completed'
    );
  });

  test('should handle payment failure gracefully', async ({ page }) => {
    // Fill payment form with invalid card
    await page.fill('[data-testid="amount-input"]', '29.99');
    await page.selectOption('[data-testid="currency-select"]', 'NZD');

    // Select new card option
    await page.click('[data-testid="payment-method-select"]');
    await page.click('[data-testid="new-card-option"]');

    // Fill invalid card details
    await page.fill('[data-testid="card-number"]', '4000000000000002'); // Declined card
    await page.fill('[data-testid="cardholder-name"]', 'John Doe');
    await page.selectOption('[data-testid="expiry-month"]', '12');
    await page.selectOption('[data-testid="expiry-year"]', '2025');
    await page.fill('[data-testid="cvv"]', '123');

    // Accept terms
    await page.check('[data-testid="terms-checkbox"]');

    // Submit payment
    await page.click('[data-testid="submit-payment"]');

    // Wait for payment processing
    await expect(
      page.locator('[data-testid="payment-processing"]')
    ).toBeVisible();

    // Wait for error message
    await expect(page.locator('[data-testid="payment-error"]')).toBeVisible();

    // Verify error message
    await expect(page.locator('[data-testid="error-message"]')).toContainText(
      'Your card was declined'
    );

    // Verify retry option is available
    await expect(page.locator('[data-testid="retry-payment"]')).toBeVisible();
  });

  test('should save payment method for future use', async ({ page }) => {
    // Fill payment form
    await page.fill('[data-testid="amount-input"]', '29.99');
    await page.selectOption('[data-testid="currency-select"]', 'NZD');

    // Select new card option
    await page.click('[data-testid="payment-method-select"]');
    await page.click('[data-testid="new-card-option"]');

    // Fill card details
    await page.fill('[data-testid="card-number"]', '4242424242424242');
    await page.fill('[data-testid="cardholder-name"]', 'John Doe');
    await page.selectOption('[data-testid="expiry-month"]', '12');
    await page.selectOption('[data-testid="expiry-year"]', '2025');
    await page.fill('[data-testid="cvv"]', '123');

    // Check save payment method
    await page.check('[data-testid="save-payment-method"]');

    // Accept terms
    await page.check('[data-testid="terms-checkbox"]');

    // Submit payment
    await page.click('[data-testid="submit-payment"]');

    // Wait for success message
    await expect(page.locator('[data-testid="payment-success"]')).toBeVisible();

    // Verify payment method was saved
    await expect(
      page.locator('[data-testid="payment-method-saved"]')
    ).toBeVisible();
  });

  test('should send payment receipt', async ({ page }) => {
    // Complete payment first
    await page.fill('[data-testid="amount-input"]', '29.99');
    await page.selectOption('[data-testid="currency-select"]', 'NZD');
    await page.click('[data-testid="payment-method-select"]');
    await page.click('[data-testid="existing-method-option"]');
    await page.check('[data-testid="terms-checkbox"]');
    await page.click('[data-testid="submit-payment"]');

    // Wait for success message
    await expect(page.locator('[data-testid="payment-success"]')).toBeVisible();

    // Click send receipt button
    await page.click('[data-testid="send-receipt-button"]');

    // Fill email address
    await page.fill('[data-testid="email-input"]', 'test@example.com');

    // Submit receipt request
    await page.click('[data-testid="submit-receipt"]');

    // Wait for confirmation
    await expect(page.locator('[data-testid="receipt-sent"]')).toBeVisible();
  });

  test('should handle bank transfer fallback', async ({ page }) => {
    // Fill payment form
    await page.fill('[data-testid="amount-input"]', '29.99');
    await page.selectOption('[data-testid="currency-select"]', 'NZD');

    // Select bank transfer option
    await page.click('[data-testid="payment-method-select"]');
    await page.click('[data-testid="bank-transfer-option"]');

    // Accept terms
    await page.check('[data-testid="terms-checkbox"]');

    // Submit payment
    await page.click('[data-testid="submit-payment"]');

    // Wait for bank transfer instructions
    await expect(
      page.locator('[data-testid="bank-transfer-instructions"]')
    ).toBeVisible();

    // Verify bank transfer details
    await expect(page.locator('[data-testid="bank-account"]')).toBeVisible();
    await expect(
      page.locator('[data-testid="reference-number"]')
    ).toBeVisible();
    await expect(page.locator('[data-testid="amount"]')).toContainText(
      '$29.99'
    );
  });

  test('should handle payment confirmation', async ({ page }) => {
    // Navigate to payment confirmation page
    await page.goto('/payments/confirm?payment_intent=pi_test123');

    // Wait for confirmation page to load
    await expect(
      page.locator('[data-testid="payment-confirmation"]')
    ).toBeVisible();

    // Verify payment details
    await expect(page.locator('[data-testid="payment-amount"]')).toContainText(
      '$29.99'
    );
    await expect(page.locator('[data-testid="payment-status"]')).toContainText(
      'Confirmed'
    );

    // Verify receipt download option
    await expect(
      page.locator('[data-testid="download-receipt"]')
    ).toBeVisible();

    // Verify email receipt option
    await expect(page.locator('[data-testid="email-receipt"]')).toBeVisible();
  });

  test('should handle mobile payment flow', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    // Navigate to payment page
    await page.goto('/payments');

    // Verify mobile layout
    await expect(
      page.locator('[data-testid="mobile-payment-form"]')
    ).toBeVisible();

    // Fill payment form
    await page.fill('[data-testid="amount-input"]', '29.99');
    await page.selectOption('[data-testid="currency-select"]', 'NZD');

    // Select new card option
    await page.click('[data-testid="payment-method-select"]');
    await page.click('[data-testid="new-card-option"]');

    // Fill card details
    await page.fill('[data-testid="card-number"]', '4242424242424242');
    await page.fill('[data-testid="cardholder-name"]', 'John Doe');
    await page.selectOption('[data-testid="expiry-month"]', '12');
    await page.selectOption('[data-testid="expiry-year"]', '2025');
    await page.fill('[data-testid="cvv"]', '123');

    // Accept terms
    await page.check('[data-testid="terms-checkbox"]');

    // Submit payment
    await page.click('[data-testid="submit-payment"]');

    // Wait for success message
    await expect(page.locator('[data-testid="payment-success"]')).toBeVisible();
  });

  test('should handle accessibility requirements', async ({ page }) => {
    // Navigate to payment page
    await page.goto('/payments');

    // Check for proper heading structure
    await expect(page.locator('h1')).toBeVisible();
    await expect(page.locator('h2')).toBeVisible();

    // Check for proper form labels
    await expect(page.locator('label[for="amount-input"]')).toBeVisible();
    await expect(page.locator('label[for="currency-select"]')).toBeVisible();

    // Check for proper ARIA attributes
    await expect(page.locator('[aria-label="Payment amount"]')).toBeVisible();
    await expect(
      page.locator('[aria-label="Currency selection"]')
    ).toBeVisible();

    // Check for proper focus management
    await page.tab();
    await expect(page.locator(':focus')).toBeVisible();

    // Check for proper error announcements
    await page.fill('[data-testid="amount-input"]', '0');
    await page.click('[data-testid="submit-payment"]');

    await expect(page.locator('[role="alert"]')).toBeVisible();
  });
});
