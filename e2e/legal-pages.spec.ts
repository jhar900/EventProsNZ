import { test, expect } from '@playwright/test';

test.describe('Legal Pages', () => {
  test('user can navigate to terms of service page', async ({ page }) => {
    await page.goto('/legal/terms');

    // Check page title and header
    await expect(page).toHaveTitle(/Terms of Service/);
    await expect(page.locator('h1')).toContainText('Terms of Service');
    await expect(
      page.locator('text=comprehensive legal terms and user agreement')
    ).toBeVisible();
  });

  test('user can navigate to privacy policy page', async ({ page }) => {
    await page.goto('/legal/privacy');

    // Check page title and header
    await expect(page).toHaveTitle(/Privacy Policy/);
    await expect(page.locator('h1')).toContainText('Privacy Policy');
    await expect(
      page.locator(
        'text=How we collect, use, and protect your personal information'
      )
    ).toBeVisible();
  });

  test('user can navigate to cookie policy page', async ({ page }) => {
    await page.goto('/legal/cookies');

    // Check page title and header
    await expect(page).toHaveTitle(/Cookie Policy/);
    await expect(page.locator('h1')).toContainText('Cookie Policy');
    await expect(
      page.locator('text=How we use cookies and similar technologies')
    ).toBeVisible();
  });

  test('terms of service page navigation works correctly', async ({ page }) => {
    await page.goto('/legal/terms');

    // Check that overview section is shown by default
    await expect(page.locator('text=Terms of Service Overview')).toBeVisible();

    // Navigate to User Agreement section
    await page.click('text=User Agreement');
    await expect(page.locator('text=User Agreement')).toBeVisible();
    await expect(page.locator('text=Account Registration')).toBeVisible();

    // Navigate to Platform Rules section
    await page.click('text=Platform Rules');
    await expect(page.locator('text=Platform Rules')).toBeVisible();
    await expect(page.locator('text=Content Guidelines')).toBeVisible();

    // Navigate to Intellectual Property section
    await page.click('text=Intellectual Property');
    await expect(page.locator('text=Intellectual Property')).toBeVisible();
    await expect(page.locator('text=Platform Content')).toBeVisible();

    // Navigate to Liability section
    await page.click('text=Liability');
    await expect(page.locator('text=Liability Limitations')).toBeVisible();
    await expect(page.locator('text=Service Disclaimer')).toBeVisible();

    // Navigate to Dispute Resolution section
    await page.click('text=Dispute Resolution');
    await expect(page.locator('text=Dispute Resolution')).toBeVisible();
    await expect(page.locator('text=Governing Law')).toBeVisible();
  });

  test('privacy policy page navigation works correctly', async ({ page }) => {
    await page.goto('/legal/privacy');

    // Check that overview section is shown by default
    await expect(page.locator('text=Privacy Policy Overview')).toBeVisible();

    // Navigate to Data Collection section
    await page.click('text=Data Collection');
    await expect(page.locator('text=Data Collection')).toBeVisible();
    await expect(page.locator('text=Personal Information')).toBeVisible();

    // Navigate to Data Usage section
    await page.click('text=Data Usage');
    await expect(page.locator('text=Data Usage')).toBeVisible();
    await expect(page.locator('text=Service Provision')).toBeVisible();

    // Navigate to Data Sharing section
    await page.click('text=Data Sharing');
    await expect(page.locator('text=Data Sharing')).toBeVisible();
    await expect(page.locator('text=Platform Users')).toBeVisible();

    // Navigate to User Rights section
    await page.click('text=User Rights');
    await expect(page.locator('text=User Rights')).toBeVisible();
    await expect(page.locator('text=Access Rights')).toBeVisible();

    // Navigate to Data Retention section
    await page.click('text=Data Retention');
    await expect(page.locator('text=Data Retention')).toBeVisible();
    await expect(page.locator('text=Retention Periods')).toBeVisible();

    // Navigate to GDPR Compliance section
    await page.click('text=GDPR Compliance');
    await expect(page.locator('text=GDPR Compliance')).toBeVisible();
    await expect(page.locator('text=Legal Basis for Processing')).toBeVisible();
  });

  test('cookie policy page navigation works correctly', async ({ page }) => {
    await page.goto('/legal/cookies');

    // Check that overview section is shown by default
    await expect(page.locator('text=Cookie Policy Overview')).toBeVisible();

    // Navigate to Cookie Types section
    await page.click('text=Cookie Types');
    await expect(page.locator('text=Cookie Types')).toBeVisible();
    await expect(page.locator('text=Essential Cookies')).toBeVisible();

    // Navigate to Cookie Usage section
    await page.click('text=Cookie Usage');
    await expect(page.locator('text=Cookie Usage')).toBeVisible();
    await expect(page.locator('text=Essential Cookies')).toBeVisible();

    // Navigate to Cookie Management section
    await page.click('text=Cookie Management');
    await expect(page.locator('text=Cookie Management')).toBeVisible();
    await expect(page.locator('text=Cookie Preferences')).toBeVisible();

    // Navigate to Third-Party Cookies section
    await page.click('text=Third-Party Cookies');
    await expect(page.locator('text=Third-Party Cookies')).toBeVisible();
    await expect(page.locator('text=Google Analytics')).toBeVisible();

    // Navigate to Compliance section
    await page.click('text=Compliance');
    await expect(page.locator('text=Compliance')).toBeVisible();
    await expect(page.locator('text=GDPR Compliance')).toBeVisible();
  });

  test('cookie management interface works correctly', async ({ page }) => {
    await page.goto('/legal/cookies');

    // Navigate to Cookie Management section
    await page.click('text=Cookie Management');

    // Check that cookie preferences are displayed
    await expect(page.locator('text=Essential Cookies')).toBeVisible();
    await expect(page.locator('text=Analytics Cookies')).toBeVisible();
    await expect(page.locator('text=Marketing Cookies')).toBeVisible();
    await expect(page.locator('text=Functional Cookies')).toBeVisible();

    // Check that essential cookies are marked as required
    await expect(page.locator('text=Required')).toBeVisible();

    // Check that management buttons are present
    await expect(page.locator('text=Accept Essential Only')).toBeVisible();
    await expect(page.locator('text=Accept All')).toBeVisible();
  });

  test('legal pages are mobile responsive', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    // Test terms page on mobile
    await page.goto('/legal/terms');
    await expect(page.locator('h1')).toContainText('Terms of Service');

    // Test privacy page on mobile
    await page.goto('/legal/privacy');
    await expect(page.locator('h1')).toContainText('Privacy Policy');

    // Test cookie page on mobile
    await page.goto('/legal/cookies');
    await expect(page.locator('h1')).toContainText('Cookie Policy');
  });

  test('legal pages have proper SEO metadata', async ({ page }) => {
    // Test terms page metadata
    await page.goto('/legal/terms');
    await expect(page).toHaveTitle(/Terms of Service.*EventProsNZ/);

    // Test privacy page metadata
    await page.goto('/legal/privacy');
    await expect(page).toHaveTitle(/Privacy Policy.*EventProsNZ/);

    // Test cookie page metadata
    await page.goto('/legal/cookies');
    await expect(page).toHaveTitle(/Cookie Policy.*EventProsNZ/);
  });

  test('legal pages display contact information', async ({ page }) => {
    // Test terms page footer
    await page.goto('/legal/terms');
    await expect(page.locator('text=legal@eventpros.co.nz')).toBeVisible();

    // Test privacy page footer
    await page.goto('/legal/privacy');
    await expect(page.locator('text=privacy@eventpros.co.nz')).toBeVisible();

    // Test cookie page footer
    await page.goto('/legal/cookies');
    await expect(page.locator('text=privacy@eventpros.co.nz')).toBeVisible();
  });

  test('legal pages show version and update information', async ({ page }) => {
    // Test terms page version info
    await page.goto('/legal/terms');
    await expect(
      page.locator('text=Last updated: December 19, 2024')
    ).toBeVisible();
    await expect(page.locator('text=Version 1.0')).toBeVisible();

    // Test privacy page version info
    await page.goto('/legal/privacy');
    await expect(
      page.locator('text=Last updated: December 19, 2024')
    ).toBeVisible();
    await expect(page.locator('text=GDPR Compliant')).toBeVisible();

    // Test cookie page version info
    await page.goto('/legal/cookies');
    await expect(
      page.locator('text=Last updated: December 19, 2024')
    ).toBeVisible();
    await expect(page.locator('text=GDPR Compliant')).toBeVisible();
  });
});
