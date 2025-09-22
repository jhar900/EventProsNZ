import { test, expect } from "@playwright/test";

test.describe("Demo Hub", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/demo");
  });

  test("should load demo hub page", async ({ page }) => {
    await expect(page).toHaveTitle(/Event Pros NZ/);
    await expect(page.locator("h1")).toContainText(
      "External Services Demo Hub"
    );
  });

  test("should have all demo service links", async ({ page }) => {
    // Check for Maps demo
    await expect(page.locator('a[href="/maps-demo"]')).toBeVisible();
    await expect(page.locator('a[href="/maps-demo"]')).toContainText(
      "Maps Integration"
    );

    // Check for Stripe demo
    await expect(page.locator('a[href="/stripe-demo"]')).toBeVisible();
    await expect(page.locator('a[href="/stripe-demo"]')).toContainText(
      "Payment Processing"
    );

    // Check for SendGrid demo
    await expect(page.locator('a[href="/sendgrid-demo"]')).toBeVisible();
    await expect(page.locator('a[href="/sendgrid-demo"]')).toContainText(
      "Email Services"
    );

    // Check for Analytics demo
    await expect(page.locator('a[href="/analytics-demo"]')).toBeVisible();
    await expect(page.locator('a[href="/analytics-demo"]')).toContainText(
      "Analytics Tracking"
    );
  });

  test("should navigate to maps demo", async ({ page }) => {
    await page.click('a[href="/maps-demo"]');
    await expect(page).toHaveURL("/maps-demo");
    await expect(page.locator("h1")).toContainText("Maps Integration Demo");
  });

  test("should navigate to stripe demo", async ({ page }) => {
    await page.click('a[href="/stripe-demo"]');
    await expect(page).toHaveURL("/stripe-demo");
    await expect(page.locator("h1")).toContainText(
      "Stripe Payment Integration Demo"
    );
  });

  test("should navigate to sendgrid demo", async ({ page }) => {
    await page.click('a[href="/sendgrid-demo"]');
    await expect(page).toHaveURL("/sendgrid-demo");
    await expect(page.locator("h1")).toContainText(
      "SendGrid Email Integration Demo"
    );
  });

  test("should navigate to analytics demo", async ({ page }) => {
    await page.click('a[href="/analytics-demo"]');
    await expect(page).toHaveURL("/analytics-demo");
    await expect(page.locator("h1")).toContainText(
      "Google Analytics Integration Demo"
    );
  });
});
