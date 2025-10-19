import { test, expect } from '@playwright/test';

test.describe('CRM Workflow E2E', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto('/login');
    await page.fill('[data-testid="email-input"]', 'test@example.com');
    await page.fill('[data-testid="password-input"]', 'TestPassword123');
    await page.click('[data-testid="login-button"]');
    await expect(page).toHaveURL('/dashboard');
  });

  test('complete CRM contact lifecycle', async ({ page }) => {
    // Navigate to CRM
    await page.goto('/crm');
    await expect(page).toHaveURL('/crm');

    // Verify CRM dashboard loads
    await expect(page.locator('text=CRM Dashboard')).toBeVisible();
    await expect(
      page.locator('text=Manage your business relationships and interactions')
    ).toBeVisible();

    // Check stats cards are displayed
    await expect(page.locator('text=Total Contacts')).toBeVisible();
    await expect(page.locator('text=Active Contacts')).toBeVisible();
    await expect(page.locator('text=Interactions')).toBeVisible();
    await expect(page.locator('text=Pending Reminders')).toBeVisible();
    await expect(page.locator('text=Recent Activity')).toBeVisible();

    // Navigate to contacts tab
    await page.click('[data-testid="contacts-tab"]');
    await expect(
      page.locator('[data-testid="contact-management"]')
    ).toBeVisible();

    // Add a new contact
    await page.click('[data-testid="add-contact-button"]');
    await expect(page.locator('[data-testid="contact-form"]')).toBeVisible();

    // Fill contact form
    await page.fill('[data-testid="contact-user-id-input"]', 'user-2');
    await page.selectOption(
      '[data-testid="contact-type-select"]',
      'contractor'
    );
    await page.selectOption(
      '[data-testid="relationship-status-select"]',
      'active'
    );

    // Submit contact form
    await page.click('[data-testid="submit-contact-button"]');
    await expect(
      page.locator('text=Contact created successfully')
    ).toBeVisible();

    // Verify contact appears in list
    await expect(page.locator('text=contractor@example.com')).toBeVisible();

    // Navigate to messages tab
    await page.click('[data-testid="messages-tab"]');
    await expect(
      page.locator('[data-testid="message-tracking"]')
    ).toBeVisible();

    // Send a message
    await page.click('[data-testid="send-message-button"]');
    await expect(page.locator('[data-testid="message-form"]')).toBeVisible();

    await page.fill(
      '[data-testid="message-content-textarea"]',
      'Hello, I am interested in your services'
    );
    await page.selectOption('[data-testid="message-type-select"]', 'inquiry');

    await page.click('[data-testid="submit-message-button"]');
    await expect(page.locator('text=Message sent successfully')).toBeVisible();

    // Navigate to notes tab
    await page.click('[data-testid="notes-tab"]');
    await expect(page.locator('[data-testid="notes-and-tags"]')).toBeVisible();

    // Add a note
    await page.click('[data-testid="add-note-button"]');
    await expect(page.locator('[data-testid="note-form"]')).toBeVisible();

    await page.fill(
      '[data-testid="note-content-textarea"]',
      'Great contractor, very professional'
    );
    await page.selectOption('[data-testid="note-type-select"]', 'general');
    await page.fill('[data-testid="tags-input"]', 'professional, reliable');
    await page.check('[data-testid="is-important-checkbox"]');

    await page.click('[data-testid="submit-note-button"]');
    await expect(page.locator('text=Note added successfully')).toBeVisible();

    // Navigate to reminders tab
    await page.click('[data-testid="reminders-tab"]');
    await expect(
      page.locator('[data-testid="follow-up-reminders"]')
    ).toBeVisible();

    // Add a reminder
    await page.click('[data-testid="add-reminder-button"]');
    await expect(page.locator('[data-testid="reminder-form"]')).toBeVisible();

    await page.selectOption(
      '[data-testid="reminder-type-select"]',
      'follow_up'
    );
    await page.fill('[data-testid="reminder-date-input"]', '2024-12-25');
    await page.fill(
      '[data-testid="reminder-message-textarea"]',
      'Follow up on project status'
    );

    await page.click('[data-testid="submit-reminder-button"]');
    await expect(
      page.locator('text=Reminder created successfully')
    ).toBeVisible();

    // Navigate to search tab
    await page.click('[data-testid="search-tab"]');
    await expect(page.locator('[data-testid="contact-search"]')).toBeVisible();

    // Search for contacts
    await page.fill('[data-testid="search-input"]', 'professional');
    await page.click('[data-testid="search-button"]');

    // Verify search results
    await expect(page.locator('[data-testid="search-results"]')).toBeVisible();
    await expect(page.locator('text=contractor@example.com')).toBeVisible();

    // Navigate to export tab
    await page.click('[data-testid="export-tab"]');
    await expect(page.locator('[data-testid="contact-export"]')).toBeVisible();

    // Export contacts
    await page.selectOption('[data-testid="export-format-select"]', 'csv');
    await page.click('[data-testid="export-button"]');

    // Verify export starts
    await expect(page.locator('text=Export started')).toBeVisible();

    // Navigate to timeline tab
    await page.click('[data-testid="timeline-tab"]');
    await expect(
      page.locator('[data-testid="activity-timeline"]')
    ).toBeVisible();

    // Select a contact to view timeline
    await page.click('[data-testid="select-contact-button"]');
    await page.click('[data-testid="contact-option"]');

    // Verify timeline displays activities
    await expect(page.locator('[data-testid="timeline-item"]')).toBeVisible();
    await expect(page.locator('text=Contact created')).toBeVisible();
    await expect(page.locator('text=Message sent')).toBeVisible();
    await expect(page.locator('text=Note added')).toBeVisible();
    await expect(page.locator('text=Reminder created')).toBeVisible();
  });

  test('CRM error handling', async ({ page }) => {
    // Navigate to CRM
    await page.goto('/crm');

    // Test network error handling
    await page.route('**/api/crm/contacts', route => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({
          success: false,
          message: 'Internal server error',
        }),
      });
    });

    // Navigate to contacts tab
    await page.click('[data-testid="contacts-tab"]');

    // Verify error message is displayed
    await expect(page.locator('text=Failed to load contacts')).toBeVisible();
    await expect(page.locator('text=Internal server error')).toBeVisible();

    // Test error dismissal
    await page.click('[data-testid="dismiss-error-button"]');
    await expect(
      page.locator('text=Failed to load contacts')
    ).not.toBeVisible();
  });

  test('CRM form validation', async ({ page }) => {
    // Navigate to CRM
    await page.goto('/crm');

    // Navigate to contacts tab
    await page.click('[data-testid="contacts-tab"]');

    // Try to add contact with invalid data
    await page.click('[data-testid="add-contact-button"]');

    // Submit empty form
    await page.click('[data-testid="submit-contact-button"]');

    // Verify validation errors
    await expect(
      page.locator('text=Contact User ID is required')
    ).toBeVisible();
    await expect(page.locator('text=Contact Type is required')).toBeVisible();

    // Fill invalid data
    await page.fill('[data-testid="contact-user-id-input"]', 'invalid-uuid');
    await page.selectOption(
      '[data-testid="contact-type-select"]',
      'contractor'
    );

    await page.click('[data-testid="submit-contact-button"]');

    // Verify validation error for invalid UUID
    await expect(page.locator('text=Invalid contact user ID')).toBeVisible();
  });

  test('CRM responsive design', async ({ page }) => {
    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/crm');

    // Verify mobile layout
    await expect(page.locator('[data-testid="mobile-menu"]')).toBeVisible();
    await expect(page.locator('[data-testid="mobile-stats"]')).toBeVisible();

    // Test tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.reload();

    // Verify tablet layout
    await expect(page.locator('[data-testid="tablet-layout"]')).toBeVisible();

    // Test desktop viewport
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.reload();

    // Verify desktop layout
    await expect(page.locator('[data-testid="desktop-layout"]')).toBeVisible();
    await expect(page.locator('[data-testid="sidebar"]')).toBeVisible();
  });

  test('CRM accessibility', async ({ page }) => {
    // Navigate to CRM
    await page.goto('/crm');

    // Test keyboard navigation
    await page.keyboard.press('Tab');
    await expect(page.locator(':focus')).toBeVisible();

    // Test screen reader support
    await expect(page.locator('[aria-label="CRM Dashboard"]')).toBeVisible();
    await expect(
      page.locator('[aria-label="Contact Management"]')
    ).toBeVisible();

    // Test ARIA labels
    await expect(page.locator('[aria-label="Add Contact"]')).toBeVisible();
    await expect(page.locator('[aria-label="Search Contacts"]')).toBeVisible();

    // Test focus management
    await page.click('[data-testid="add-contact-button"]');
    await expect(page.locator('[data-testid="contact-form"]')).toBeFocused();
  });

  test('CRM performance', async ({ page }) => {
    // Navigate to CRM
    const startTime = Date.now();
    await page.goto('/crm');
    const loadTime = Date.now() - startTime;

    // Verify page loads within acceptable time
    expect(loadTime).toBeLessThan(3000); // 3 seconds

    // Test lazy loading
    await page.click('[data-testid="contacts-tab"]');
    await expect(
      page.locator('[data-testid="contact-management"]')
    ).toBeVisible();

    // Test data loading performance
    const dataStartTime = Date.now();
    await page.click('[data-testid="load-contacts-button"]');
    await page.waitForSelector('[data-testid="contact-list"]');
    const dataLoadTime = Date.now() - dataStartTime;

    // Verify data loads within acceptable time
    expect(dataLoadTime).toBeLessThan(2000); // 2 seconds
  });
});
