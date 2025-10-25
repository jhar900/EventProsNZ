import { test, expect } from '@playwright/test';

test.describe('Homepage', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should display the homepage with all sections', async ({ page }) => {
    // Check that the page loads
    await expect(page).toHaveTitle(/Event Pros NZ/);

    // Check hero section
    await expect(page.getByText("New Zealand's Premier")).toBeVisible();
    await expect(page.getByText('Event Ecosystem')).toBeVisible();
    await expect(page.getByText('Get Started Free')).toBeVisible();
    await expect(page.getByText('Browse Contractors')).toBeVisible();
  });

  test('should display testimonials section', async ({ page }) => {
    await expect(page.getByText('What Our Users Say')).toBeVisible();
    await expect(
      page.getByText(/Discover why event managers and contractors trust/)
    ).toBeVisible();
  });

  test('should display service categories section', async ({ page }) => {
    await expect(page.getByText('Service Categories')).toBeVisible();
    await expect(
      page.getByText(/Find the perfect contractors for every aspect/)
    ).toBeVisible();
  });

  test('should display how it works section', async ({ page }) => {
    await expect(page.getByText('How It Works')).toBeVisible();
    await expect(
      page.getByText(/Simple steps to connect event managers/)
    ).toBeVisible();

    // Check for both user types
    await expect(page.getByText('Event Managers')).toBeVisible();
    await expect(page.getByText('Contractors')).toBeVisible();
  });

  test('should display featured contractors section', async ({ page }) => {
    await expect(page.getByText('Featured Contractors')).toBeVisible();
    await expect(
      page.getByText(/Meet our spotlight contractors/)
    ).toBeVisible();
  });

  test('should display statistics section', async ({ page }) => {
    await expect(page.getByText('Our Impact in Numbers')).toBeVisible();
    await expect(
      page.getByText(/Join thousands of satisfied customers/)
    ).toBeVisible();
  });

  test('should display New Zealand pride section', async ({ page }) => {
    await expect(
      page.getByText('EventPros.co.nz Is Proudly Made In NZ')
    ).toBeVisible();
    await expect(
      page.getByText(/Supporting New Zealand's event industry/)
    ).toBeVisible();
  });

  test('should have working navigation', async ({ page }) => {
    // Check navigation is visible
    await expect(page.getByText('Event Pros NZ')).toBeVisible();

    // Check navigation links
    await expect(page.getByText('How It Works')).toBeVisible();
    await expect(page.getByText('Contractors')).toBeVisible();
    await expect(page.getByText('Pricing')).toBeVisible();
    await expect(page.getByText('About')).toBeVisible();
  });

  test('should have working CTA buttons', async ({ page }) => {
    // Test Get Started button
    const getStartedButton = page.getByText('Get Started Free');
    await expect(getStartedButton).toBeVisible();
    await getStartedButton.click();
    await expect(page).toHaveURL(/.*register/);

    // Go back to homepage
    await page.goto('/');

    // Test Browse Contractors button
    const browseButton = page.getByText('Browse Contractors');
    await expect(browseButton).toBeVisible();
    await browseButton.click();
    await expect(page).toHaveURL(/.*contractors/);
  });

  test('should be responsive on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    // Check that mobile navigation works
    const mobileMenuButton = page.locator('[data-testid="mobile-menu-button"]');
    if (await mobileMenuButton.isVisible()) {
      await mobileMenuButton.click();
      await expect(page.getByText('Login')).toBeVisible();
      await expect(page.getByText('Get Started')).toBeVisible();
    }

    // Check that content is still visible on mobile
    await expect(page.getByText("New Zealand's Premier")).toBeVisible();
    await expect(page.getByText('Event Ecosystem')).toBeVisible();
  });

  test('should have proper footer with links', async ({ page }) => {
    // Scroll to footer
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));

    // Check footer content
    await expect(page.getByText('Event Pros NZ')).toBeVisible();
    await expect(page.getByText("New Zealand's Event Ecosystem")).toBeVisible();

    // Check footer links
    await expect(page.getByText('Platform')).toBeVisible();
    await expect(page.getByText('Support')).toBeVisible();
    await expect(page.getByText('Company')).toBeVisible();

    // Check copyright
    await expect(page.getByText(/© 2024 Event Pros NZ/)).toBeVisible();
    await expect(page.getByText('Made in New Zealand')).toBeVisible();
  });

  test('should load within performance budget', async ({ page }) => {
    const startTime = Date.now();
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    const loadTime = Date.now() - startTime;

    // Should load within 3 seconds (generous for development)
    expect(loadTime).toBeLessThan(3000);
  });

  test('should have proper meta tags for SEO', async ({ page }) => {
    await expect(page.locator('meta[name="description"]')).toHaveAttribute(
      'content',
      /Connect event managers with qualified contractors/
    );
    await expect(page.locator('title')).toContainText('Event Pros NZ');
  });
});
