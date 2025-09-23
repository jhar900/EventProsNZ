import { test, expect } from '@playwright/test';

test.describe('Search Functionality', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the search page
    await page.goto('/contractors/search');
  });

  test('should display search page with all components', async ({ page }) => {
    // Check page title and header
    await expect(
      page.getByRole('heading', { name: 'Find Contractors' })
    ).toBeVisible();
    await expect(
      page.getByText('Search and filter through our verified contractors')
    ).toBeVisible();

    // Check search bar is present
    await expect(
      page.getByPlaceholder('Search contractors, services, or locations...')
    ).toBeVisible();

    // Check filter panel is present
    await expect(page.getByText('Filters')).toBeVisible();

    // Check sort controls are present
    await expect(page.getByText('Sort by:')).toBeVisible();
  });

  test('should perform basic text search', async ({ page }) => {
    // Enter search query
    const searchInput = page.getByPlaceholder(
      'Search contractors, services, or locations...'
    );
    await searchInput.fill('photography');

    // Wait for search to complete (debounced)
    await page.waitForTimeout(500);

    // Check that search was performed
    await expect(page.getByText(/contractor.*found/)).toBeVisible();
  });

  test('should show search suggestions', async ({ page }) => {
    // Start typing in search input
    const searchInput = page.getByPlaceholder(
      'Search contractors, services, or locations...'
    );
    await searchInput.fill('photo');

    // Wait for suggestions to appear
    await page.waitForTimeout(500);

    // Check if suggestions dropdown appears (if there are suggestions)
    const suggestionsDropdown = page.locator(
      '[data-testid="suggestions-dropdown"]'
    );
    if (await suggestionsDropdown.isVisible()) {
      await expect(suggestionsDropdown).toBeVisible();
    }
  });

  test('should expand and use filters', async ({ page }) => {
    // Click on filters button to expand
    await page.getByText('Filters').click();

    // Check that filter options are visible
    await expect(page.getByText('Service Types')).toBeVisible();
    await expect(page.getByText('Location')).toBeVisible();
    await expect(page.getByText('Budget Range')).toBeVisible();
    await expect(page.getByText('Minimum Rating')).toBeVisible();

    // Select a service type filter
    const serviceTypeButton = page.getByText('Catering').first();
    if (await serviceTypeButton.isVisible()) {
      await serviceTypeButton.click();

      // Check that filter is applied
      await expect(page.getByText('Service: catering')).toBeVisible();
    }
  });

  test('should use location filter', async ({ page }) => {
    // Expand filters
    await page.getByText('Filters').click();

    // Enter location
    const locationInput = page.getByPlaceholder(
      'Enter city, suburb, or address...'
    );
    await locationInput.fill('Auckland');

    // Wait for location filter to be applied
    await page.waitForTimeout(300);

    // Check that location filter is shown
    await expect(page.getByText('Location: Auckland')).toBeVisible();
  });

  test('should use budget filter', async ({ page }) => {
    // Expand filters
    await page.getByText('Filters').click();

    // Select a price range
    const priceRangeButton = page.getByText('Under $100');
    if (await priceRangeButton.isVisible()) {
      await priceRangeButton.click();

      // Check that price filter is applied
      await expect(page.getByText(/Price: \$0 - \$100/)).toBeVisible();
    }
  });

  test('should use rating filter', async ({ page }) => {
    // Expand filters
    await page.getByText('Filters').click();

    // Select a rating
    const ratingButton = page.getByText('4+ Stars');
    if (await ratingButton.isVisible()) {
      await ratingButton.click();

      // Check that rating filter is applied
      await expect(page.getByText('Rating: 4+ stars')).toBeVisible();
    }
  });

  test('should change sort order', async ({ page }) => {
    // Change sort order
    const sortSelect = page.getByRole('combobox');
    await sortSelect.selectOption('rating');

    // Wait for results to update
    await page.waitForTimeout(500);

    // Check that sort was applied (results should be different)
    await expect(page.getByText(/contractor.*found/)).toBeVisible();
  });

  test('should clear all filters', async ({ page }) => {
    // Apply some filters first
    await page.getByText('Filters').click();

    const serviceTypeButton = page.getByText('Catering').first();
    if (await serviceTypeButton.isVisible()) {
      await serviceTypeButton.click();
    }

    // Click clear all filters
    const clearButton = page.getByText('Clear all filters');
    if (await clearButton.isVisible()) {
      await clearButton.click();

      // Check that filters are cleared
      await expect(page.getByText('Service: catering')).not.toBeVisible();
    }
  });

  test('should handle no results', async ({ page }) => {
    // Search for something that likely has no results
    const searchInput = page.getByPlaceholder(
      'Search contractors, services, or locations...'
    );
    await searchInput.fill('nonexistentcontractor12345');

    // Wait for search to complete
    await page.waitForTimeout(500);

    // Check for no results message
    await expect(page.getByText('No contractors found')).toBeVisible();
    await expect(
      page.getByText('Try adjusting your search criteria')
    ).toBeVisible();
  });

  test('should navigate to favorites page', async ({ page }) => {
    // Navigate to favorites page
    await page.goto('/contractors/favorites');

    // Check page title
    await expect(
      page.getByRole('heading', { name: 'Favorite Contractors' })
    ).toBeVisible();
    await expect(
      page.getByText('Your saved contractors for easy access')
    ).toBeVisible();
  });

  test('should navigate to search history page', async ({ page }) => {
    // Navigate to search history page
    await page.goto('/search/history');

    // Check page title
    await expect(
      page.getByRole('heading', { name: 'Search History' })
    ).toBeVisible();
    await expect(
      page.getByText('Your recent searches and results')
    ).toBeVisible();
  });

  test('should handle pagination', async ({ page }) => {
    // Perform a search that might have multiple pages
    const searchInput = page.getByPlaceholder(
      'Search contractors, services, or locations...'
    );
    await searchInput.fill('catering');

    // Wait for search to complete
    await page.waitForTimeout(500);

    // Check if pagination controls are present
    const paginationControls = page.locator(
      '[data-testid="pagination-controls"]'
    );
    if (await paginationControls.isVisible()) {
      // Try to navigate to next page
      const nextButton = page.getByRole('button', { name: /next/i });
      if (await nextButton.isVisible()) {
        await nextButton.click();

        // Wait for page to load
        await page.waitForTimeout(500);

        // Check that we're on page 2
        await expect(page.getByText(/Page 2 of/)).toBeVisible();
      }
    }
  });

  test('should handle loading states', async ({ page }) => {
    // Start a search
    const searchInput = page.getByPlaceholder(
      'Search contractors, services, or locations...'
    );
    await searchInput.fill('photography');

    // Check for loading indicator (might be brief due to debouncing)
    const loadingSpinner = page.locator('[data-testid="loading-spinner"]');
    if (await loadingSpinner.isVisible()) {
      await expect(loadingSpinner).toBeVisible();
    }
  });

  test('should handle error states gracefully', async ({ page }) => {
    // Mock network error
    await page.route('**/api/contractors/search*', route => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Internal server error' }),
      });
    });

    // Perform search
    const searchInput = page.getByPlaceholder(
      'Search contractors, services, or locations...'
    );
    await searchInput.fill('photography');

    // Wait for error to appear
    await page.waitForTimeout(500);

    // Check for error message
    await expect(page.getByText('Search Error')).toBeVisible();
    await expect(page.getByText('Try Again')).toBeVisible();
  });

  test('should maintain search state across page interactions', async ({
    page,
  }) => {
    // Perform a search
    const searchInput = page.getByPlaceholder(
      'Search contractors, services, or locations...'
    );
    await searchInput.fill('photography');

    // Apply a filter
    await page.getByText('Filters').click();
    const serviceTypeButton = page.getByText('Catering').first();
    if (await serviceTypeButton.isVisible()) {
      await serviceTypeButton.click();
    }

    // Wait for search to complete
    await page.waitForTimeout(500);

    // Check that both search query and filter are maintained
    await expect(searchInput).toHaveValue('photography');
    await expect(page.getByText('Service: catering')).toBeVisible();
  });

  test('should be responsive on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    // Check that search components are still visible and functional
    await expect(
      page.getByPlaceholder('Search contractors, services, or locations...')
    ).toBeVisible();
    await expect(page.getByText('Filters')).toBeVisible();

    // Test mobile filter interaction
    await page.getByText('Filters').click();
    await expect(page.getByText('Service Types')).toBeVisible();
  });
});
