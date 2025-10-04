/**
 * Payment Failure Recovery E2E Tests
 * Tests payment failure scenarios and recovery mechanisms
 */

import { test, expect } from '@playwright/test';

test.describe('Payment Failure Recovery', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to payment page
    await page.goto('/payments');
  });

  test('should handle declined card and offer retry', async ({ page }) => {
    // Fill payment form with declined card
    await page.fill('[data-testid="amount-input"]', '29.99');
    await page.selectOption('[data-testid="currency-select"]', 'NZD');

    // Select new card option
    await page.click('[data-testid="payment-method-select"]');
    await page.click('[data-testid="new-card-option"]');

    // Fill declined card details
    await page.fill('[data-testid="card-number"]', '4000000000000002'); // Declined card
    await page.fill('[data-testid="cardholder-name"]', 'John Doe');
    await page.selectOption('[data-testid="expiry-month"]', '12');
    await page.selectOption('[data-testid="expiry-year"]', '2025');
    await page.fill('[data-testid="cvv"]', '123');

    // Accept terms
    await page.check('[data-testid="terms-checkbox"]');

    // Submit payment
    await page.click('[data-testid="submit-payment"]');

    // Wait for error message
    await expect(page.locator('[data-testid="payment-error"]')).toBeVisible();

    // Verify error message
    await expect(page.locator('[data-testid="error-message"]')).toContainText(
      'Your card was declined'
    );

    // Verify retry option is available
    await expect(page.locator('[data-testid="retry-payment"]')).toBeVisible();

    // Click retry button
    await page.click('[data-testid="retry-payment"]');

    // Verify form is reset and ready for retry
    await expect(page.locator('[data-testid="payment-form"]')).toBeVisible();
  });

  test('should handle insufficient funds and suggest alternatives', async ({
    page,
  }) => {
    // Fill payment form with insufficient funds card
    await page.fill('[data-testid="amount-input"]', '29.99');
    await page.selectOption('[data-testid="currency-select"]', 'NZD');

    // Select new card option
    await page.click('[data-testid="payment-method-select"]');
    await page.click('[data-testid="new-card-option"]');

    // Fill insufficient funds card details
    await page.fill('[data-testid="card-number"]', '4000000000009995'); // Insufficient funds
    await page.fill('[data-testid="cardholder-name"]', 'John Doe');
    await page.selectOption('[data-testid="expiry-month"]', '12');
    await page.selectOption('[data-testid="expiry-year"]', '2025');
    await page.fill('[data-testid="cvv"]', '123');

    // Accept terms
    await page.check('[data-testid="terms-checkbox"]');

    // Submit payment
    await page.click('[data-testid="submit-payment"]');

    // Wait for error message
    await expect(page.locator('[data-testid="payment-error"]')).toBeVisible();

    // Verify error message
    await expect(page.locator('[data-testid="error-message"]')).toContainText(
      'Insufficient funds'
    );

    // Verify alternative payment options are suggested
    await expect(
      page.locator('[data-testid="bank-transfer-option"]')
    ).toBeVisible();
    await expect(
      page.locator('[data-testid="split-payment-option"]')
    ).toBeVisible();
  });

  test('should handle expired card and allow update', async ({ page }) => {
    // Fill payment form with expired card
    await page.fill('[data-testid="amount-input"]', '29.99');
    await page.selectOption('[data-testid="currency-select"]', 'NZD');

    // Select new card option
    await page.click('[data-testid="payment-method-select"]');
    await page.click('[data-testid="new-card-option"]');

    // Fill expired card details
    await page.fill('[data-testid="card-number"]', '4242424242424242');
    await page.fill('[data-testid="cardholder-name"]', 'John Doe');
    await page.selectOption('[data-testid="expiry-month"]', '01');
    await page.selectOption('[data-testid="expiry-year"]', '2020'); // Expired
    await page.fill('[data-testid="cvv"]', '123');

    // Accept terms
    await page.check('[data-testid="terms-checkbox"]');

    // Submit payment
    await page.click('[data-testid="submit-payment"]');

    // Wait for error message
    await expect(page.locator('[data-testid="payment-error"]')).toBeVisible();

    // Verify error message
    await expect(page.locator('[data-testid="error-message"]')).toContainText(
      'Your card has expired'
    );

    // Verify update card option is available
    await expect(page.locator('[data-testid="update-card"]')).toBeVisible();

    // Click update card button
    await page.click('[data-testid="update-card"]');

    // Verify form allows card update
    await expect(page.locator('[data-testid="card-number"]')).toBeVisible();
    await expect(page.locator('[data-testid="expiry-month"]')).toBeVisible();
    await expect(page.locator('[data-testid="expiry-year"]')).toBeVisible();
  });

  test('should handle network timeout and retry', async ({ page }) => {
    // Mock network timeout
    await page.route('**/api/payments/**', route => {
      // Simulate network timeout
      setTimeout(() => {
        route.abort('failed');
      }, 100);
    });

    // Fill payment form
    await page.fill('[data-testid="amount-input"]', '29.99');
    await page.selectOption('[data-testid="currency-select"]', 'NZD');
    await page.click('[data-testid="payment-method-select"]');
    await page.click('[data-testid="existing-method-option"]');
    await page.check('[data-testid="terms-checkbox"]');

    // Submit payment
    await page.click('[data-testid="submit-payment"]');

    // Wait for timeout error
    await expect(page.locator('[data-testid="payment-error"]')).toBeVisible();

    // Verify error message
    await expect(page.locator('[data-testid="error-message"]')).toContainText(
      'Network timeout'
    );

    // Verify retry option is available
    await expect(page.locator('[data-testid="retry-payment"]')).toBeVisible();
  });

  test('should handle server error and show fallback options', async ({
    page,
  }) => {
    // Mock server error
    await page.route('**/api/payments/**', route => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Internal server error' }),
      });
    });

    // Fill payment form
    await page.fill('[data-testid="amount-input"]', '29.99');
    await page.selectOption('[data-testid="currency-select"]', 'NZD');
    await page.click('[data-testid="payment-method-select"]');
    await page.click('[data-testid="existing-method-option"]');
    await page.check('[data-testid="terms-checkbox"]');

    // Submit payment
    await page.click('[data-testid="submit-payment"]');

    // Wait for server error
    await expect(page.locator('[data-testid="payment-error"]')).toBeVisible();

    // Verify error message
    await expect(page.locator('[data-testid="error-message"]')).toContainText(
      'Server error'
    );

    // Verify fallback options are available
    await expect(page.locator('[data-testid="contact-support"]')).toBeVisible();
    await expect(page.locator('[data-testid="try-later"]')).toBeVisible();
  });

  test('should handle fraud detection and manual review', async ({ page }) => {
    // Fill payment form with suspicious card
    await page.fill('[data-testid="amount-input"]', '29.99');
    await page.selectOption('[data-testid="currency-select"]', 'NZD');

    // Select new card option
    await page.click('[data-testid="payment-method-select"]');
    await page.click('[data-testid="new-card-option"]');

    // Fill suspicious card details
    await page.fill('[data-testid="card-number"]', '4000000000000119'); // Fraud detection
    await page.fill('[data-testid="cardholder-name"]', 'John Doe');
    await page.selectOption('[data-testid="expiry-month"]', '12');
    await page.selectOption('[data-testid="expiry-year"]', '2025');
    await page.fill('[data-testid="cvv"]', '123');

    // Accept terms
    await page.check('[data-testid="terms-checkbox"]');

    // Submit payment
    await page.click('[data-testid="submit-payment"]');

    // Wait for fraud detection message
    await expect(page.locator('[data-testid="payment-review"]')).toBeVisible();

    // Verify review message
    await expect(page.locator('[data-testid="review-message"]')).toContainText(
      'Payment under review'
    );

    // Verify contact information
    await expect(page.locator('[data-testid="contact-info"]')).toBeVisible();
    await expect(page.locator('[data-testid="review-timeline"]')).toBeVisible();
  });

  test('should handle partial payment failure', async ({ page }) => {
    // Fill payment form
    await page.fill('[data-testid="amount-input"]', '29.99');
    await page.selectOption('[data-testid="currency-select"]', 'NZD');
    await page.click('[data-testid="payment-method-select"]');
    await page.click('[data-testid="existing-method-option"]');
    await page.check('[data-testid="terms-checkbox"]');

    // Submit payment
    await page.click('[data-testid="submit-payment"]');

    // Wait for partial failure message
    await expect(
      page.locator('[data-testid="payment-partial-failure"]')
    ).toBeVisible();

    // Verify partial failure message
    await expect(
      page.locator('[data-testid="partial-failure-message"]')
    ).toContainText('Payment partially processed');

    // Verify retry options
    await expect(page.locator('[data-testid="retry-payment"]')).toBeVisible();
    await expect(page.locator('[data-testid="contact-support"]')).toBeVisible();
  });

  test('should handle payment method failure and suggest alternatives', async ({
    page,
  }) => {
    // Fill payment form
    await page.fill('[data-testid="amount-input"]', '29.99');
    await page.selectOption('[data-testid="currency-select"]', 'NZD');
    await page.click('[data-testid="payment-method-select"]');
    await page.click('[data-testid="existing-method-option"]');
    await page.check('[data-testid="terms-checkbox"]');

    // Submit payment
    await page.click('[data-testid="submit-payment"]');

    // Wait for payment method failure
    await expect(
      page.locator('[data-testid="payment-method-failure"]')
    ).toBeVisible();

    // Verify failure message
    await expect(page.locator('[data-testid="failure-message"]')).toContainText(
      'Payment method failed'
    );

    // Verify alternative payment methods are suggested
    await expect(
      page.locator('[data-testid="bank-transfer-option"]')
    ).toBeVisible();
    await expect(page.locator('[data-testid="new-card-option"]')).toBeVisible();
    await expect(page.locator('[data-testid="paypal-option"]')).toBeVisible();
  });

  test('should handle payment cancellation', async ({ page }) => {
    // Fill payment form
    await page.fill('[data-testid="amount-input"]', '29.99');
    await page.selectOption('[data-testid="currency-select"]', 'NZD');
    await page.click('[data-testid="payment-method-select"]');
    await page.click('[data-testid="existing-method-option"]');
    await page.check('[data-testid="terms-checkbox"]');

    // Submit payment
    await page.click('[data-testid="submit-payment"]');

    // Cancel payment during processing
    await page.click('[data-testid="cancel-payment"]');

    // Wait for cancellation confirmation
    await expect(
      page.locator('[data-testid="payment-cancelled"]')
    ).toBeVisible();

    // Verify cancellation message
    await expect(
      page.locator('[data-testid="cancellation-message"]')
    ).toContainText('Payment cancelled');

    // Verify restart option
    await expect(page.locator('[data-testid="restart-payment"]')).toBeVisible();
  });

  test('should handle payment timeout and auto-retry', async ({ page }) => {
    // Mock slow payment processing
    await page.route('**/api/payments/**', route => {
      setTimeout(() => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true }),
        });
      }, 5000);
    });

    // Fill payment form
    await page.fill('[data-testid="amount-input"]', '29.99');
    await page.selectOption('[data-testid="currency-select"]', 'NZD');
    await page.click('[data-testid="payment-method-select"]');
    await page.click('[data-testid="existing-method-option"]');
    await page.check('[data-testid="terms-checkbox"]');

    // Submit payment
    await page.click('[data-testid="submit-payment"]');

    // Wait for timeout message
    await expect(page.locator('[data-testid="payment-timeout"]')).toBeVisible();

    // Verify timeout message
    await expect(page.locator('[data-testid="timeout-message"]')).toContainText(
      'Payment timeout'
    );

    // Verify auto-retry option
    await expect(page.locator('[data-testid="auto-retry"]')).toBeVisible();

    // Click auto-retry
    await page.click('[data-testid="auto-retry"]');

    // Wait for retry to complete
    await expect(page.locator('[data-testid="payment-success"]')).toBeVisible();
  });
});
