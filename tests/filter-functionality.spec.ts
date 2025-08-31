import { test, expect } from '@playwright/test';

test.describe('Filter Functionality', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should allow adding technology search filters', async ({ page }) => {
    // Click on Technology Search section
    const techSearchSection = page.getByText('Technology Search');
    await expect(techSearchSection).toBeVisible();
    
    // Add some suggested technology filters (without the "+")
    const reactButton = page.locator('button:has-text("React")').first();
    if (await reactButton.isVisible()) {
      await reactButton.click();
      await page.waitForTimeout(500); // Allow state to update
    }
    
    // Check that search button becomes enabled
    const searchButton = page.getByRole('button', { name: /Search/i });
    await expect(searchButton).toBeEnabled();
    
    // Check that filter count is displayed (exact text match)
    await expect(page.getByText('1 filter applied')).toBeVisible();
  });

  test('should allow clearing all filters', async ({ page }) => {
    // First add some filters
    const reactButton = page.getByRole('button', { name: 'React +' });
    if (await reactButton.isVisible()) {
      await reactButton.click();
    }
    
    // Check that clear all button works
    const clearAllButton = page.getByRole('button', { name: /Clear All/i });
    await clearAllButton.click();
    
    // Should return to initial state
    await expect(page.getByText('Ready to search 35M+ companies')).toBeVisible();
    
    const searchButton = page.getByRole('button', { name: /Search/i });
    await expect(searchButton).toBeDisabled();
  });

  test('should show advanced filters section', async ({ page }) => {
    // Click on Advanced Filters (use button role to be more specific)
    const advancedFiltersButton = page.getByRole('button', { name: /Advanced Filters/i });
    await advancedFiltersButton.click();

    // Should expand to show advanced filter options (check for Company Fields text)
    await expect(page.getByText('Company Fields')).toBeVisible();
  });  test('should validate filter requirements', async ({ page }) => {
    // Try to search without any filters
    const searchButton = page.getByRole('button', { name: /Search/i });
    await expect(searchButton).toBeDisabled();
    
    // Should show guidance message
    await expect(page.getByText('Add at least one filter above to start searching')).toBeVisible();
  });

  test('should handle filter combinations', async ({ page }) => {
    // Add multiple technology filters (without the "+")
    const reactButton = page.locator('button:has-text("React")').first();
    if (await reactButton.isVisible()) {
      await reactButton.click();
      await page.waitForTimeout(500);
    }
    
    const awsButton = page.locator('button:has-text("AWS")').first();
    if (await awsButton.isVisible()) {
      await awsButton.click();
      await page.waitForTimeout(500);
    }
    
    // Check that multiple filters are reflected (still shows "1 filter" since they're grouped)
    await expect(page.getByText('1 filter applied')).toBeVisible();
    
    // Search button should be enabled
    const searchButton = page.getByRole('button', { name: /Search/i });
    await expect(searchButton).toBeEnabled();
  });
});
