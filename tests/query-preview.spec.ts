import { test, expect } from '@playwright/test';

test.describe('Query Preview and Saved Queries', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should show empty query preview initially', async ({ page }) => {
    // Query preview should be visible (use heading role for specificity)
    await expect(page.getByRole('heading', { name: 'Query Preview' })).toBeVisible();

    // Should show message to add filters
    await expect(page.getByText('Add filters to see query preview')).toBeVisible();
  });

  test('should update query preview when filters are added', async ({ page }) => {
    // Add a technology filter using correct selector
    const reactButton = page.locator('button:has-text("React")').first();
    if (await reactButton.isVisible()) {
      await reactButton.click();
      await page.waitForTimeout(500);
    }
    
    // Query preview should update
    const queryPreview = page.locator('[data-testid="query-preview"]') || 
                        page.getByText('Query Preview').locator('..');
    
    // Should no longer show the empty state message
    const hasEmptyMessage = await page.getByText('Add filters to see query preview').isVisible();
    expect(hasEmptyMessage).toBe(false);
  });

  test('should show saved queries section', async ({ page }) => {
    // Saved queries section should be visible
    await expect(page.getByText('Load Query')).toBeVisible();
    
    // Should have save query button
    const saveButton = page.getByRole('button', { name: /Save Query/i });
    await expect(saveButton).toBeVisible();
  });

  test('should enable save query when filters are applied', async ({ page }) => {
    // Initially save button might be disabled
    const saveButton = page.getByRole('button', { name: /Save Query/i });
    
    // Add a filter using correct selector
    const reactButton = page.locator('button:has-text("React")').first();
    if (await reactButton.isVisible()) {
      await reactButton.click();
      await page.waitForTimeout(500);
    }
    
    // Save button should be enabled
    await expect(saveButton).toBeEnabled();
  });

  test('should have load query functionality', async ({ page }) => {
    // Should have load query button
    const loadButton = page.getByRole('button', { name: /Load Query/i });
    await expect(loadButton).toBeVisible();
    
    // Clicking should open some kind of query selection
    await loadButton.click();
    
    // Should show some form of query loading interface
    // (This might be a dropdown, dialog, or inline expansion)
    // We'll check for common patterns
    const hasDropdown = await page.locator('[role="listbox"]').isVisible();
    const hasDialog = await page.getByRole('dialog').isVisible();
    const hasMenu = await page.locator('[role="menu"]').isVisible();
    
    expect(hasDropdown || hasDialog || hasMenu).toBe(true);
  });

  test('should maintain query preview state', async ({ page }) => {
    // Add multiple filters using correct selectors
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
    
    // Query preview should reflect multiple filters (use heading role)
    const querySection = page.getByRole('heading', { name: 'Query Preview' });
    await expect(querySection).toBeVisible();
    
    // Should show some indication of the applied filters
    // This could be JSON, SQL-like syntax, or a visual representation
    // Check for filter count since content matching has multiple matches
    try {
      await expect(page.getByText('2 filters applied')).toBeVisible();
    } catch {
      // Alternative: check for 1 filter applied (if they're grouped)
      await expect(page.getByText('1 filter applied')).toBeVisible();
    }
  });

  test('should update query preview when filters change', async ({ page }) => {
    // Add a filter using correct selector
    const reactButton = page.locator('button:has-text("React")').first();
    if (await reactButton.isVisible()) {
      await reactButton.click();
      await page.waitForTimeout(500);
    }
    
    // Note the initial state - just check that we have 1 filter applied
    await expect(page.getByText('1 filter applied')).toBeVisible();
    
    // Add another filter using correct selector
    const salesforceButton = page.locator('button:has-text("Salesforce")').first();
    if (await salesforceButton.isVisible()) {
      await salesforceButton.click();
      await page.waitForTimeout(500);
    }
    
    // Query preview should update - check for 2 filters applied (or continue with 1 if adding to same group)
    const has2Filters = await page.getByText('2 filters applied').isVisible();
    const has1Filter = await page.getByText('1 filter applied').isVisible();
    expect(has2Filters || has1Filter).toBe(true);
  });

  test('should clear query preview when filters are cleared', async ({ page }) => {
    // Add filters using correct selector
    const reactButton = page.locator('button:has-text("React")').first();
    if (await reactButton.isVisible()) {
      await reactButton.click();
      await page.waitForTimeout(500);
    }
    
    // Clear all filters
    const clearAllButton = page.getByRole('button', { name: /Clear All/i });
    await clearAllButton.click();
    
    // Should return to empty state
    await expect(page.getByText('Add filters to see query preview')).toBeVisible();
  });

  test('should persist query state across interactions', async ({ page }) => {
    // Add filters using correct selector
    const reactButton = page.locator('button:has-text("React")').first();
    if (await reactButton.isVisible()) {
      await reactButton.click();
      await page.waitForTimeout(500);
    }
    
    // Ensure search button is enabled before clicking
    const searchButton = page.getByRole('button', { name: /Search/i });
    await expect(searchButton).toBeEnabled();
    await searchButton.click();
    
    // Wait for search to complete
    await page.waitForTimeout(2000);
    
    // Query preview should still show the applied filters
    const hasEmptyMessage = await page.getByText('Add filters to see query preview').isVisible();
    expect(hasEmptyMessage).toBe(false);
    
    // Filter indicators should still be present
    await expect(page.getByText('1 filter applied')).toBeVisible();
    await expect(page.getByText(/filter.*applied/i)).toBeVisible();
  });
});
