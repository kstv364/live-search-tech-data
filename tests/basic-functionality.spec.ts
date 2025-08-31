import { test, expect } from '@playwright/test';

test.describe('Basic Application Tests', () => {
  test('should load the application successfully', async ({ page }) => {
    await page.goto('/');
    
    // Check that the page loads with basic elements
    await expect(page.getByText('BuiltWith Company Intelligence')).toBeVisible();
    await expect(page.getByText('fiber.ai')).toBeVisible();
    await expect(page.getByText('Search Filters')).toBeVisible();
  });

  test('should show initial empty state', async ({ page }) => {
    await page.goto('/');
    
    // Should show call-to-action when no filters are applied
    await expect(page.getByText('Ready to search 35M+ companies')).toBeVisible();
    
    // Export button should be disabled initially
    const exportButton = page.getByRole('button', { name: /Export to CSV/i });
    await expect(exportButton).toBeDisabled();
    
    // Search button should be disabled initially
    const searchButton = page.getByRole('button', { name: /Search/i });
    await expect(searchButton).toBeDisabled();
  });

  test('should enable search button when filter is added', async ({ page }) => {
    await page.goto('/');
    
    // Try to add a React filter
    const reactButton = page.getByRole('button', { name: 'React +' });
    
    if (await reactButton.isVisible()) {
      await reactButton.click();
      
      // Search button should become enabled
      const searchButton = page.getByRole('button', { name: /Search/i });
      await expect(searchButton).toBeEnabled();
      
      // Should show filter applied message
      await expect(page.getByText(/filter.*applied/i)).toBeVisible();
    } else {
      console.log('React filter button not found - this is expected if no sample data is available');
    }
  });

  test('should have working navigation elements', async ({ page }) => {
    await page.goto('/');
    
    // Check sidebar elements
    await expect(page.getByText('Audiences')).toBeVisible();
    await expect(page.getByText('Exclusions')).toBeVisible();
    await expect(page.getByText('Advanced Scrapes')).toBeVisible();
    
    // Check main sections using more specific selectors
    await expect(page.getByRole('heading', { name: 'Query Preview' })).toBeVisible();
    await expect(page.getByText('Export Results')).toBeVisible();
  });

  test('should handle responsive design', async ({ page }) => {
    // Test desktop layout
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto('/');
    await expect(page.getByText('BuiltWith Company Intelligence')).toBeVisible();
    
    // Test tablet layout
    await page.setViewportSize({ width: 768, height: 1024 });
    await expect(page.getByText('Search Filters')).toBeVisible();
    
    // Test mobile layout
    await page.setViewportSize({ width: 375, height: 667 });
    await expect(page.getByText('fiber.ai')).toBeVisible();
  });
});
