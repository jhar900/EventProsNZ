import { test, expect } from '@playwright/test';
import {
  mockTiersData,
  mockTestimonialsData,
  mockFaqsData,
} from './mocks/pricing-data';

test.describe('Pricing Page', () => {
  test.beforeEach(async ({ page }) => {
    // Mock API responses to prevent loading timeouts
    await page.route('**/api/pricing/tiers', route =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ tiers: mockTiersData }),
      })
    );

    await page.route('**/api/pricing/testimonials', route =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ testimonials: mockTestimonialsData }),
      })
    );

    await page.route('**/api/pricing/faq', route =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ faqs: mockFaqsData }),
      })
    );

    await page.goto('/pricing');
  });

  test('displays pricing page with all sections', async ({ page }) => {
    // Wait for page to load completely
    await page.waitForLoadState('networkidle');

    // Check main heading
    await expect(page.locator('h1')).toContainText(
      'Simple, transparent pricing'
    );

    // Wait for components to load
    await page.waitForSelector('[data-testid="tier-essential"]', {
      timeout: 10000,
    });

    // Check subscription tiers - use more specific selectors
    await expect(page.locator('[data-testid="tier-essential"]')).toBeVisible();
    await expect(page.locator('[data-testid="tier-showcase"]')).toBeVisible();
    await expect(page.locator('[data-testid="tier-spotlight"]')).toBeVisible();

    // Check pricing - use more specific selectors
    await expect(page.locator('[data-testid="price-essential"]')).toContainText(
      'Free'
    );
    await expect(page.locator('[data-testid="price-showcase"]')).toContainText(
      '$29'
    );
    await expect(page.locator('[data-testid="price-spotlight"]')).toContainText(
      '$69'
    );
  });

  test('displays feature comparison table', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('[data-testid="feature-comparison"]', {
      timeout: 10000,
    });
    await expect(
      page.locator('[data-testid="feature-comparison"]')
    ).toBeVisible();

    // Check for desktop table on large screens, mobile cards on small screens
    const isMobile = await page.evaluate(() => window.innerWidth < 1024);
    if (isMobile) {
      await expect(
        page.locator('[data-testid="features-table-mobile"]').first()
      ).toBeVisible();
    } else {
      await expect(
        page.locator('[data-testid="features-table"]').first()
      ).toBeVisible();
    }
  });

  test('shows annual pricing with discounts', async ({ page }) => {
    // Toggle to annual billing
    await page.click('[data-testid="annual-pricing-annual-toggle"]');

    // Check for savings indicators
    await expect(page.locator('[data-testid="annual-savings"]')).toBeVisible();
  });

  test('displays free trial section', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('[data-testid="free-trial-section"]', {
      timeout: 10000,
    });
    await expect(
      page.locator('[data-testid="free-trial-section"]')
    ).toBeVisible();
    await expect(page.locator('[data-testid="trial-duration"]')).toContainText(
      'Limited Time Offer'
    );
    await expect(page.locator('[data-testid="trial-no-card"]')).toBeVisible();
  });

  test('shows testimonials section', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('[data-testid="testimonials-section"]', {
      timeout: 10000,
    });
    await expect(
      page.locator('[data-testid="testimonials-section"]')
    ).toBeVisible();
  });

  test('displays FAQ section', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('[data-testid="faq-section"]', {
      timeout: 10000,
    });
    await expect(page.locator('[data-testid="faq-section"]')).toBeVisible();

    // Check for common FAQ questions
    await expect(
      page.locator('[data-testid="faq-subscription-plan"]')
    ).toBeVisible();
    await expect(
      page.locator('[data-testid="faq-payment-methods"]')
    ).toBeVisible();
  });

  test('shows payment methods section', async ({ page }) => {
    await expect(
      page.locator('[data-testid="payment-methods-section"]')
    ).toBeVisible();
    await expect(page.locator('[data-testid="credit-cards"]')).toBeVisible();
    await expect(page.locator('[data-testid="paypal"]')).toBeVisible();
  });

  test('displays refund policy section', async ({ page }) => {
    await expect(
      page.locator('[data-testid="refund-policy-section"]')
    ).toBeVisible();
    await expect(
      page.locator('[data-testid="refund-policy-money-back-guarantee"]')
    ).toBeVisible();
  });

  test('shows upgrade/downgrade information', async ({ page }) => {
    await expect(
      page.locator('[data-testid="plan-management-section"]')
    ).toBeVisible();
    await expect(page.locator('[data-testid="upgrade-info"]')).toBeVisible();
    await expect(page.locator('[data-testid="downgrade-info"]')).toBeVisible();
  });

  test('displays call-to-action section', async ({ page }) => {
    await expect(page.locator('[data-testid="cta-section"]')).toBeVisible();
    await expect(
      page.locator('[data-testid="cta-final-start-trial-btn"]')
    ).toBeVisible();
  });

  test('handles tier selection', async ({ page }) => {
    // Click on a tier button
    await page.click('[data-testid="get-started-essential"]');

    // Should not cause errors
    await expect(page.locator('[data-testid="tier-essential"]')).toBeVisible();
  });

  test('toggles billing cycle', async ({ page }) => {
    // Toggle to annual
    await page.click('[data-testid="annual-pricing-annual-toggle"]');
    await expect(
      page.locator('[data-testid="annual-pricing-annual-toggle"]')
    ).toBeVisible();

    // Toggle back to monthly
    await page.click('[data-testid="annual-pricing-monthly-toggle"]');
    await expect(
      page.locator('[data-testid="annual-pricing-monthly-toggle"]')
    ).toBeVisible();
  });

  test('displays mobile responsive design', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    // Check that content is still visible and accessible
    await expect(page.locator('[data-testid="tier-essential"]')).toBeVisible();
    await expect(page.locator('[data-testid="tier-showcase"]')).toBeVisible();
    await expect(page.locator('[data-testid="tier-spotlight"]')).toBeVisible();
  });

  test('handles FAQ search', async ({ page }) => {
    // Scroll to FAQ section
    await page.locator('[data-testid="faq-section"]').scrollIntoViewIfNeeded();

    // Search for a question
    await page.fill('[data-testid="faq-search"]', 'payment');

    // Should show filtered results
    await expect(
      page.locator('[data-testid="faq-payment-methods"]')
    ).toBeVisible();
  });

  test('displays trust indicators', async ({ page }) => {
    await expect(
      page.locator('[data-testid="no-setup-fees"]').first()
    ).toBeVisible();
    await expect(
      page.locator('[data-testid="cta-cancel-anytime"]')
    ).toBeVisible();
    await expect(
      page.locator('[data-testid="cta-money-back-guarantee"]').first()
    ).toBeVisible();
  });

  test('shows pricing comparison', async ({ page }) => {
    await expect(
      page.locator('[data-testid="pricing-comparison"]')
    ).toBeVisible();

    // Check for pricing table
    await expect(
      page.locator('[data-testid="annual-pricing-monthly-toggle"]')
    ).toBeVisible();
    await expect(
      page.locator('[data-testid="annual-pricing-annual-toggle"]')
    ).toBeVisible();
  });

  test('displays security information', async ({ page }) => {
    await expect(
      page.locator('[data-testid="security-section"]')
    ).toBeVisible();
    await expect(page.locator('[data-testid="pci-dss"]')).toBeVisible();
    await expect(page.locator('[data-testid="ssl-encryption"]')).toBeVisible();
  });
});
