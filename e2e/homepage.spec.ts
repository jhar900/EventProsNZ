import { test, expect } from "@playwright/test";

test.describe("Homepage", () => {
  test("should load the homepage successfully", async ({ page }) => {
    await page.goto("/");

    // Check that the page loads without errors
    await expect(page).toHaveTitle(/Event Pros NZ/);

    // Check for main navigation elements
    await expect(page.locator("h1")).toBeVisible();

    // Check for demo link
    await expect(page.locator('a[href="/demo"]')).toBeVisible();
  });

  test("should navigate to demo page", async ({ page }) => {
    await page.goto("/");

    // Click on demo link
    await page.click('a[href="/demo"]');

    // Should navigate to demo page
    await expect(page).toHaveURL("/demo");
    await expect(page.locator("h1")).toContainText("Demo Hub");
  });

  test("should be responsive on mobile", async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    await page.goto("/");

    // Check that content is visible on mobile
    await expect(page.locator("h1")).toBeVisible();
    await expect(page.locator('a[href="/demo"]')).toBeVisible();
  });
});
