import { test, expect } from "@playwright/test";

test.describe("Maps Demo", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/maps-demo");
  });

  test("should load maps demo page", async ({ page }) => {
    await expect(page).toHaveTitle(/Event Pros NZ/);
    await expect(page.locator("h1")).toContainText("Maps Integration Demo");
  });

  test("should have map container", async ({ page }) => {
    // Check for map container
    const mapContainer = page.locator("#map");
    await expect(mapContainer).toBeVisible();

    // Check for search input
    const searchInput = page.locator('input[placeholder*="search"]');
    await expect(searchInput).toBeVisible();
  });

  test("should test mapbox configuration", async ({ page }) => {
    // Click the test configuration button
    await page.click('button:has-text("Run Test")');

    // Wait for test results
    await page.waitForSelector('[data-testid="test-results"]', {
      timeout: 10000,
    });

    // Check that test results are displayed
    const testResults = page.locator('[data-testid="test-results"]');
    await expect(testResults).toBeVisible();
  });

  test("should test map rendering", async ({ page }) => {
    // Click the test map rendering button
    await page.click('button:has-text("Test Map")');

    // Wait for test results
    await page.waitForSelector('[data-testid="test-results"]', {
      timeout: 10000,
    });

    // Check that test results are displayed
    const testResults = page.locator('[data-testid="test-results"]');
    await expect(testResults).toBeVisible();
  });

  test("should handle address search", async ({ page }) => {
    const searchInput = page.locator('input[placeholder*="search"]');

    // Type in search query
    await searchInput.fill("Christchurch");

    // Wait for suggestions to appear
    await page.waitForSelector('[data-testid="suggestions"]', {
      timeout: 5000,
    });

    // Check that suggestions are visible
    const suggestions = page.locator('[data-testid="suggestions"]');
    await expect(suggestions).toBeVisible();
  });
});
