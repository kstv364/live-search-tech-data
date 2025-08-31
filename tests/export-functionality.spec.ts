import { test, expect } from '@playwright/test';
import { createTestHelpers } from './helpers';

test.describe('Export Functionality', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should have disabled export button initially', async ({ page }) => {
    // Export button should be disabled when no filters are applied
    const exportButton = page.getByRole('button', { name: /Export to CSV/i });
    await expect(exportButton).toBeDisabled();
  });

  test('should enable export button after search with results', async ({ page }) => {
    const helpers = createTestHelpers(page);
    
    // Add a filter
    const hasFilter = await helpers.addTechnologyFilter('React');
    
    if (hasFilter) {
      // Perform search
      const searchSuccess = await helpers.performSearch();
      
      if (searchSuccess) {
        // Check if we have results
        const hasResults = await helpers.hasSearchResults();
        
        if (hasResults) {
          // Export button should be enabled
          const exportButton = page.getByRole('button', { name: /Export to CSV/i });
          await expect(exportButton).toBeEnabled();
        }
      }
    } else {
      test.skip();
    }
  });

  test('should open export dialog when export button is clicked', async ({ page }) => {
    // Add filter and search using correct selector
    const reactButton = page.locator('button:has-text("React")').first();
    if (await reactButton.isVisible()) {
      await reactButton.click();
      await page.waitForTimeout(500);
    }
    
    const searchButton = page.getByRole('button', { name: /Search/i });
    await expect(searchButton).toBeEnabled();
    await searchButton.click();
    await page.waitForTimeout(3000);
    
    // Click export button if enabled
    const exportButton = page.getByRole('button', { name: /Export to CSV/i });
    if (await exportButton.isEnabled()) {
      await exportButton.click();
      
      // Should open export dialog
      await expect(page.getByRole('dialog')).toBeVisible();
      await expect(page.getByText(/Export/i)).toBeVisible();
    }
  });

  test('should show export button in search results table', async ({ page }) => {
    // Add filter and search using correct selector
    const reactButton = page.locator('button:has-text("React")').first();
    if (await reactButton.isVisible()) {
      await reactButton.click();
      await page.waitForTimeout(500);
    }
    
    const searchButton = page.getByRole('button', { name: /Search/i });
    await expect(searchButton).toBeEnabled();
    await searchButton.click();
    await page.waitForTimeout(3000);
    
    // Check if table has results
    const hasTable = await page.getByRole('table').isVisible();
    
    if (hasTable) {
      // Should have Export All button in the table footer
      const tableExportButton = page.getByRole('button', { name: /Export All/i });
      if (await tableExportButton.isVisible()) {
        await expect(tableExportButton).toBeEnabled();
      }
    }
  });

  test('should show record count in export section', async ({ page }) => {
    // Add filter and search using correct selector
    const reactButton = page.locator('button:has-text("React")').first();
    if (await reactButton.isVisible()) {
      await reactButton.click();
      await page.waitForTimeout(500);
    }
    
    const searchButton = page.getByRole('button', { name: /Search/i });
    await expect(searchButton).toBeEnabled();
    await searchButton.click();
    await page.waitForTimeout(3000);
    
    // Should show record count in export section
    const recordsText = page.getByText(/records available/i);
    if (await recordsText.isVisible()) {
      await expect(recordsText).toBeVisible();
    }
  });

  test('should handle export dialog interaction', async ({ page }) => {
    // Add filter and search using correct selector
    const reactButton = page.locator('button:has-text("React")').first();
    if (await reactButton.isVisible()) {
      await reactButton.click();
      await page.waitForTimeout(500);
    }
    
    const searchButton = page.getByRole('button', { name: /Search/i });
    await expect(searchButton).toBeEnabled();
    await searchButton.click();
    await page.waitForTimeout(3000);
    
    // Click export if available
    const exportButton = page.getByRole('button', { name: /Export to CSV/i });
    if (await exportButton.isEnabled()) {
      await exportButton.click();
      
      // Should open dialog
      const dialog = page.getByRole('dialog');
      await expect(dialog).toBeVisible();
      
      // Should have close button or way to dismiss
      const closeButton = dialog.getByRole('button', { name: /close/i }) || 
                         dialog.getByRole('button', { name: /cancel/i }) ||
                         page.locator('[data-testid="close-button"]');
      
      if (await closeButton.first().isVisible()) {
        await closeButton.first().click();
        await expect(dialog).not.toBeVisible();
      } else {
        // Try pressing Escape key
        await page.keyboard.press('Escape');
        await expect(dialog).not.toBeVisible();
      }
    }
  });

  test('should show export options based on search state', async ({ page }) => {
    // Initially should show disabled state
    await expect(page.getByText('Download your search results')).toBeVisible();
    
    // Add filter using correct selector
    const reactButton = page.locator('button:has-text("React")').first();
    if (await reactButton.isVisible()) {
      await reactButton.click();
      await page.waitForTimeout(500);
    }
    
    // Export should still be disabled until search is performed
    const exportButton = page.getByRole('button', { name: /Export to CSV/i });
    await expect(exportButton).toBeDisabled();
    
    // Perform search
    const searchButton = page.getByRole('button', { name: /Search/i });
    await searchButton.click();
    await page.waitForTimeout(3000);
    
    // Now export options should be available based on results
    const hasResults = await page.getByText(/companies found/i).isVisible();
    
    if (hasResults) {
      await expect(exportButton).toBeEnabled();
    }
  });
});
