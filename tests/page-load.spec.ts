import { test, expect } from '@playwright/test';

test.describe('Application Load and Layout', () => {
  test('should load the main page with proper layout', async ({ page }) => {
    await page.goto('/');

    // Check that the page loads (using actual title)
    await expect(page).toHaveTitle(/Create Next App/);

    // Check main header elements
    await expect(page.getByText('BuiltWith Company Intelligence')).toBeVisible();
    await expect(page.getByText('Search and discover companies using 35M+ technology profiles')).toBeVisible();
    
    // Check sidebar navigation
    await expect(page.getByText('fiber.ai')).toBeVisible();
    await expect(page.getByText('Audiences')).toBeVisible();
    await expect(page.getByText('Exclusions')).toBeVisible();
    await expect(page.getByText('Advanced Scrapes')).toBeVisible();
    
    // Check main sections
    await expect(page.getByText('Search Filters')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Query Preview' })).toBeVisible();
    await expect(page.getByText('Export Results')).toBeVisible();
  });

  test('should display proper initial state', async ({ page }) => {
    await page.goto('/');
    
    // Should show call-to-action when no filters are applied
    await expect(page.getByText('Ready to search 35M+ companies')).toBeVisible();
    await expect(page.getByText('Add at least one filter to start discovering companies')).toBeVisible();
    
    // Export button should be disabled initially
    const exportButton = page.getByRole('button', { name: /Export to CSV/i });
    await expect(exportButton).toBeDisabled();
    
    // Search button should be disabled initially
    const searchButton = page.getByRole('button', { name: /Search/i });
    await expect(searchButton).toBeDisabled();
  });

  test('should have responsive design elements', async ({ page }) => {
    await page.goto('/');
    
    // Test desktop layout
    await page.setViewportSize({ width: 1920, height: 1080 });
    await expect(page.getByText('Search Filters')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Query Preview' })).toBeVisible();
    
    // Test tablet layout
    await page.setViewportSize({ width: 768, height: 1024 });
    await expect(page.getByText('Search Filters')).toBeVisible();
    
    // Test mobile layout
    await page.setViewportSize({ width: 375, height: 667 });
    await expect(page.getByText('BuiltWith Company Intelligence')).toBeVisible();
  });
});
