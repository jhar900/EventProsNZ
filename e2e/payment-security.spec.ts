/**
 * Payment Security E2E Tests
 * Tests security features and fraud detection
 */

import { test, expect } from '@playwright/test';

test.describe('Payment Security', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to payment page
    await page.goto('/payments');
  });

  test('should validate card number format', async ({ page }) => {
    // Fill payment form with invalid card number
    await page.fill('[data-testid="amount-input"]', '29.99');
    await page.selectOption('[data-testid="currency-select"]', 'NZD');

    // Select new card option
    await page.click('[data-testid="payment-method-select"]');
    await page.click('[data-testid="new-card-option"]');

    // Fill invalid card number
    await page.fill('[data-testid="card-number"]', '1234'); // Invalid format

    // Accept terms
    await page.check('[data-testid="terms-checkbox"]');

    // Submit payment
    await page.click('[data-testid="submit-payment"]');

    // Wait for validation error
    await expect(
      page.locator('[data-testid="card-number-error"]')
    ).toBeVisible();

    // Verify error message
    await expect(
      page.locator('[data-testid="card-number-error"]')
    ).toContainText('Invalid card number format');
  });

  test('should validate expiry date', async ({ page }) => {
    // Fill payment form with expired card
    await page.fill('[data-testid="amount-input"]', '29.99');
    await page.selectOption('[data-testid="currency-select"]', 'NZD');

    // Select new card option
    await page.click('[data-testid="payment-method-select"]');
    await page.click('[data-testid="new-card-option"]');

    // Fill expired card
    await page.fill('[data-testid="card-number"]', '4242424242424242');
    await page.fill('[data-testid="cardholder-name"]', 'John Doe');
    await page.selectOption('[data-testid="expiry-month"]', '01');
    await page.selectOption('[data-testid="expiry-year"]', '2020'); // Expired
    await page.fill('[data-testid="cvv"]', '123');

    // Accept terms
    await page.check('[data-testid="terms-checkbox"]');

    // Submit payment
    await page.click('[data-testid="submit-payment"]');

    // Wait for validation error
    await expect(page.locator('[data-testid="expiry-error"]')).toBeVisible();

    // Verify error message
    await expect(page.locator('[data-testid="expiry-error"]')).toContainText(
      'Card has expired'
    );
  });

  test('should validate CVV format', async ({ page }) => {
    // Fill payment form with invalid CVV
    await page.fill('[data-testid="amount-input"]', '29.99');
    await page.selectOption('[data-testid="currency-select"]', 'NZD');

    // Select new card option
    await page.click('[data-testid="payment-method-select"]');
    await page.click('[data-testid="new-card-option"]');

    // Fill invalid CVV
    await page.fill('[data-testid="card-number"]', '4242424242424242');
    await page.fill('[data-testid="cardholder-name"]', 'John Doe');
    await page.selectOption('[data-testid="expiry-month"]', '12');
    await page.selectOption('[data-testid="expiry-year"]', '2025');
    await page.fill('[data-testid="cvv"]', '12'); // Invalid CVV length

    // Accept terms
    await page.check('[data-testid="terms-checkbox"]');

    // Submit payment
    await page.click('[data-testid="submit-payment"]');

    // Wait for validation error
    await expect(page.locator('[data-testid="cvv-error"]')).toBeVisible();

    // Verify error message
    await expect(page.locator('[data-testid="cvv-error"]')).toContainText(
      'Invalid CVV format'
    );
  });

  test('should detect suspicious payment patterns', async ({ page }) => {
    // Fill payment form with suspicious amount
    await page.fill('[data-testid="amount-input"]', '999999.99'); // Suspiciously high amount
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

    // Wait for fraud detection
    await expect(page.locator('[data-testid="fraud-detection"]')).toBeVisible();

    // Verify fraud detection message
    await expect(page.locator('[data-testid="fraud-message"]')).toContainText(
      'Payment flagged for review'
    );

    // Verify additional verification required
    await expect(
      page.locator('[data-testid="additional-verification"]')
    ).toBeVisible();
  });

  test('should handle rate limiting', async ({ page }) => {
    // Submit multiple payments rapidly
    for (let i = 0; i < 10; i++) {
      await page.fill('[data-testid="amount-input"]', '29.99');
      await page.selectOption('[data-testid="currency-select"]', 'NZD');
      await page.click('[data-testid="payment-method-select"]');
      await page.click('[data-testid="existing-method-option"]');
      await page.check('[data-testid="terms-checkbox"]');
      await page.click('[data-testid="submit-payment"]');

      // Wait for rate limit error
      if (i >= 5) {
        await expect(
          page.locator('[data-testid="rate-limit-error"]')
        ).toBeVisible();
        break;
      }
    }

    // Verify rate limit message
    await expect(
      page.locator('[data-testid="rate-limit-message"]')
    ).toContainText('Too many requests');

    // Verify retry after delay option
    await expect(
      page.locator('[data-testid="retry-after-delay"]')
    ).toBeVisible();
  });

  test('should validate payment amount limits', async ({ page }) => {
    // Fill payment form with amount below minimum
    await page.fill('[data-testid="amount-input"]', '0.50'); // Below minimum
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

    // Wait for validation error
    await expect(page.locator('[data-testid="amount-error"]')).toBeVisible();

    // Verify error message
    await expect(page.locator('[data-testid="amount-error"]')).toContainText(
      'Amount below minimum'
    );
  });

  test('should handle invalid payment methods', async ({ page }) => {
    // Fill payment form
    await page.fill('[data-testid="amount-input"]', '29.99');
    await page.selectOption('[data-testid="currency-select"]', 'NZD');

    // Select invalid payment method
    await page.click('[data-testid="payment-method-select"]');
    await page.click('[data-testid="invalid-method-option"]');

    // Accept terms
    await page.check('[data-testid="terms-checkbox"]');

    // Submit payment
    await page.click('[data-testid="submit-payment"]');

    // Wait for validation error
    await expect(
      page.locator('[data-testid="payment-method-error"]')
    ).toBeVisible();

    // Verify error message
    await expect(
      page.locator('[data-testid="payment-method-error"]')
    ).toContainText('Invalid payment method');
  });

  test('should validate currency restrictions', async ({ page }) => {
    // Fill payment form with restricted currency
    await page.fill('[data-testid="amount-input"]', '29.99');
    await page.selectOption('[data-testid="currency-select"]', 'USD'); // Restricted currency

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

    // Wait for validation error
    await expect(page.locator('[data-testid="currency-error"]')).toBeVisible();

    // Verify error message
    await expect(page.locator('[data-testid="currency-error"]')).toContainText(
      'Currency not supported'
    );
  });

  test('should handle payment method expiration', async ({ page }) => {
    // Fill payment form
    await page.fill('[data-testid="amount-input"]', '29.99');
    await page.selectOption('[data-testid="currency-select"]', 'NZD');

    // Select expired payment method
    await page.click('[data-testid="payment-method-select"]');
    await page.click('[data-testid="expired-method-option"]');

    // Accept terms
    await page.check('[data-testid="terms-checkbox"]');

    // Submit payment
    await page.click('[data-testid="submit-payment"]');

    // Wait for expiration error
    await expect(
      page.locator('[data-testid="payment-method-expired"]')
    ).toBeVisible();

    // Verify error message
    await expect(
      page.locator('[data-testid="expiration-message"]')
    ).toContainText('Payment method expired');

    // Verify update payment method option
    await expect(
      page.locator('[data-testid="update-payment-method"]')
    ).toBeVisible();
  });

  test('should handle payment method deletion', async ({ page }) => {
    // Fill payment form
    await page.fill('[data-testid="amount-input"]', '29.99');
    await page.selectOption('[data-testid="currency-select"]', 'NZD');

    // Select deleted payment method
    await page.click('[data-testid="payment-method-select"]');
    await page.click('[data-testid="deleted-method-option"]');

    // Accept terms
    await page.check('[data-testid="terms-checkbox"]');

    // Submit payment
    await page.click('[data-testid="submit-payment"]');

    // Wait for deletion error
    await expect(
      page.locator('[data-testid="payment-method-deleted"]')
    ).toBeVisible();

    // Verify error message
    await expect(
      page.locator('[data-testid="deletion-message"]')
    ).toContainText('Payment method no longer available');

    // Verify add new payment method option
    await expect(
      page.locator('[data-testid="add-new-payment-method"]')
    ).toBeVisible();
  });

  test('should handle payment method restrictions', async ({ page }) => {
    // Fill payment form
    await page.fill('[data-testid="amount-input"]', '29.99');
    await page.selectOption('[data-testid="currency-select"]', 'NZD');

    // Select restricted payment method
    await page.click('[data-testid="payment-method-select"]');
    await page.click('[data-testid="restricted-method-option"]');

    // Accept terms
    await page.check('[data-testid="terms-checkbox"]');

    // Submit payment
    await page.click('[data-testid="submit-payment"]');

    // Wait for restriction error
    await expect(
      page.locator('[data-testid="payment-method-restricted"]')
    ).toBeVisible();

    // Verify error message
    await expect(
      page.locator('[data-testid="restriction-message"]')
    ).toContainText('Payment method restricted');

    // Verify alternative payment methods
    await expect(
      page.locator('[data-testid="alternative-methods"]')
    ).toBeVisible();
  });

  test('should handle payment method verification', async ({ page }) => {
    // Fill payment form
    await page.fill('[data-testid="amount-input"]', '29.99');
    await page.selectOption('[data-testid="currency-select"]', 'NZD');

    // Select unverified payment method
    await page.click('[data-testid="payment-method-select"]');
    await page.click('[data-testid="unverified-method-option"]');

    // Accept terms
    await page.check('[data-testid="terms-checkbox"]');

    // Submit payment
    await page.click('[data-testid="submit-payment"]');

    // Wait for verification required
    await expect(
      page.locator('[data-testid="verification-required"]')
    ).toBeVisible();

    // Verify verification message
    await expect(
      page.locator('[data-testid="verification-message"]')
    ).toContainText('Payment method verification required');

    // Verify verification options
    await expect(
      page.locator('[data-testid="verify-payment-method"]')
    ).toBeVisible();
    await expect(
      page.locator('[data-testid="use-different-method"]')
    ).toBeVisible();
  });

  test('should handle payment method limits', async ({ page }) => {
    // Fill payment form with amount exceeding payment method limit
    await page.fill('[data-testid="amount-input"]', '10000.00'); // Exceeds limit
    await page.selectOption('[data-testid="currency-select"]', 'NZD');

    // Select limited payment method
    await page.click('[data-testid="payment-method-select"]');
    await page.click('[data-testid="limited-method-option"]');

    // Accept terms
    await page.check('[data-testid="terms-checkbox"]');

    // Submit payment
    await page.click('[data-testid="submit-payment"]');

    // Wait for limit error
    await expect(
      page.locator('[data-testid="payment-limit-error"]')
    ).toBeVisible();

    // Verify error message
    await expect(page.locator('[data-testid="limit-message"]')).toContainText(
      'Amount exceeds payment method limit'
    );

    // Verify alternative options
    await expect(page.locator('[data-testid="split-payment"]')).toBeVisible();
    await expect(
      page.locator('[data-testid="different-method"]')
    ).toBeVisible();
  });
});
