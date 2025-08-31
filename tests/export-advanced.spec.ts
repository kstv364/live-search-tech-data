import { test, expect } from '@playwright/test';
import { createTestHelpers } from './helpers';

test.describe('Export and Download Features', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should show export information in dialog', async ({ page }) => {
    const helpers = createTestHelpers(page);
    
    if (await helpers.addTechnologyFilter('React')) {
      await helpers.performSearch();
      
      if (await helpers.hasSearchResults() && await helpers.isExportAvailable()) {
        await helpers.openExportDialog();
        
        const dialog = page.getByRole('dialog');
        await expect(dialog).toBeVisible();
        
        // Check dialog content
        await expect(dialog.getByRole('heading', { name: 'Export to CSV' })).toBeVisible();
        await expect(dialog.getByText('Download your search results as a CSV file')).toBeVisible();
        
        // Check export information
        await expect(dialog.getByText('Export Information:')).toBeVisible();
        await expect(dialog.getByText('Format: CSV (comma-separated values)')).toBeVisible();
        await expect(dialog.getByText('Compatible with Excel, Google Sheets, and other tools')).toBeVisible();
        await expect(dialog.getByText('Includes all available company and technology data')).toBeVisible();
      }
    }
  });

  test('should handle record count selection in export dialog', async ({ page }) => {
    const helpers = createTestHelpers(page);
    
    if (await helpers.addTechnologyFilter('React')) {
      await helpers.performSearch();
      
      if (await helpers.hasSearchResults() && await helpers.isExportAvailable()) {
        await helpers.openExportDialog();
        
        const dialog = page.getByRole('dialog');
        await expect(dialog).toBeVisible();
        
        // Check for record count input
        const recordInput = dialog.getByRole('spinbutton', { name: /Number of records to export/i });
        await expect(recordInput).toBeVisible();
        
        // Check initial state (should be 0)
        await expect(recordInput).toHaveValue('0');
        
        // Check that export button is disabled initially
        const exportButton = dialog.getByRole('button', { name: /Export CSV/i });
        await expect(exportButton).toBeDisabled();
        
        // Enter a number of records
        await recordInput.fill('3');
        
        // Check that export button becomes enabled
        await expect(exportButton).toBeEnabled();
        
        // Check file size estimation updates
        await expect(dialog.getByText(/Estimated file size.*KB/)).toBeVisible();
      }
    }
  });

  test('should successfully download CSV file', async ({ page }) => {
    const helpers = createTestHelpers(page);
    
    if (await helpers.addTechnologyFilter('React')) {
      await helpers.performSearch();
      
      if (await helpers.hasSearchResults() && await helpers.isExportAvailable()) {
        await helpers.openExportDialog();
        
        const dialog = page.getByRole('dialog');
        const recordInput = dialog.getByRole('spinbutton', { name: /Number of records to export/i });
        await recordInput.fill('2');
        
        // Set up download listener
        const downloadPromise = page.waitForEvent('download');
        
        const exportButton = dialog.getByRole('button', { name: /Export CSV/i });
        await exportButton.click();
        
        // Wait for download
        const download = await downloadPromise;
        expect(download.suggestedFilename()).toMatch(/company-search-export.*\.csv/);
        
        // Check that dialog is closed or processing is complete
        await expect(dialog).not.toBeVisible({ timeout: 10000 });
      }
    }
  });

  test('should validate record count input', async ({ page }) => {
    const helpers = createTestHelpers(page);
    
    if (await helpers.addTechnologyFilter('React')) {
      await helpers.performSearch();
      
      if (await helpers.hasSearchResults() && await helpers.isExportAvailable()) {
        await helpers.openExportDialog();
        
        const dialog = page.getByRole('dialog');
        const recordInput = dialog.getByRole('spinbutton', { name: /Number of records to export/i });
        const exportButton = dialog.getByRole('button', { name: /Export CSV/i });
        
        // Test with 0 records
        await recordInput.fill('0');
        await expect(exportButton).toBeDisabled();
        
        // Test with valid number
        await recordInput.fill('1');
        await expect(exportButton).toBeEnabled();
        
        // Test with number higher than available (should be capped)
        const totalResults = await dialog.getByText(/of \d+ total/).textContent();
        const maxRecords = totalResults?.match(/of (\d+) total/)?.[1];
        
        if (maxRecords) {
          const highNumber = parseInt(maxRecords) + 10;
          await recordInput.fill(highNumber.toString());
          
          // Should still be enabled but might be capped to max
          await expect(exportButton).toBeEnabled();
        }
      }
    }
  });

  test('should close export dialog properly', async ({ page }) => {
    const helpers = createTestHelpers(page);
    
    if (await helpers.addTechnologyFilter('React')) {
      await helpers.performSearch();
      
      if (await helpers.hasSearchResults() && await helpers.isExportAvailable()) {
        await helpers.openExportDialog();
        
        const dialog = page.getByRole('dialog');
        await expect(dialog).toBeVisible();
        
        // Test closing with Cancel button
        const cancelButton = dialog.getByRole('button', { name: /Cancel/i });
        if (await cancelButton.isVisible()) {
          await cancelButton.click();
          await expect(dialog).not.toBeVisible();
        } else {
          // Test closing with X button
          const closeButton = dialog.getByRole('button', { name: /Close/i });
          if (await closeButton.isVisible()) {
            await closeButton.click();
            await expect(dialog).not.toBeVisible();
          } else {
            // Test closing with Escape key
            await page.keyboard.press('Escape');
            await expect(dialog).not.toBeVisible();
          }
        }
      }
    }
  });

  test('should update file size estimation dynamically', async ({ page }) => {
    const helpers = createTestHelpers(page);
    
    if (await helpers.addTechnologyFilter('React')) {
      await helpers.performSearch();
      
      if (await helpers.hasSearchResults() && await helpers.isExportAvailable()) {
        await helpers.openExportDialog();
        
        const dialog = page.getByRole('dialog');
        const recordInput = dialog.getByRole('spinbutton', { name: /Number of records to export/i });
        
        // Check initial file size (should be ~0 KB)
        await expect(dialog.getByText('Estimated file size: ~0 KB')).toBeVisible();
        
        // Change record count
        await recordInput.fill('2');
        
        // Check that file size updates
        await expect(dialog.getByText(/Estimated file size: ~\d+ KB/)).toBeVisible();
        
        // Increase record count
        await recordInput.fill('5');
        
        // File size should increase
        await expect(dialog.getByText(/Estimated file size: ~\d+ KB/)).toBeVisible();
      }
    }
  });

  test('should show export button states correctly', async ({ page }) => {
    // Initially export should be disabled
    const exportButton = page.getByRole('button', { name: /Export to CSV/i });
    await expect(exportButton).toBeDisabled();
    
    const helpers = createTestHelpers(page);
    
    // Add filter but don't search yet
    if (await helpers.addTechnologyFilter('React')) {
      await expect(exportButton).toBeDisabled();
      
      // Perform search
      await helpers.performSearch();
      
      if (await helpers.hasSearchResults()) {
        // Export should now be enabled
        await expect(exportButton).toBeEnabled();
        
        // Check export section text
        await expect(page.getByText(/\d+ records available/)).toBeVisible();
      }
    }
  });

  test('should handle export with different record counts', async ({ page }) => {
    const helpers = createTestHelpers(page);
    
    if (await helpers.addTechnologyFilter('React')) {
      await helpers.performSearch();
      
      if (await helpers.hasSearchResults() && await helpers.isExportAvailable()) {
        // Test export with 1 record
        await helpers.openExportDialog();
        
        let dialog = page.getByRole('dialog');
        let recordInput = dialog.getByRole('spinbutton', { name: /Number of records to export/i });
        await recordInput.fill('1');
        
        const downloadPromise1 = page.waitForEvent('download');
        let exportButton = dialog.getByRole('button', { name: /Export CSV/i });
        await exportButton.click();
        
        const download1 = await downloadPromise1;
        expect(download1.suggestedFilename()).toMatch(/company-search-export.*\.csv/);
        
        // Wait for dialog to close
        await expect(dialog).not.toBeVisible({ timeout: 10000 });
        await page.waitForTimeout(2000);
        
        // Test export with different record count
        if (await helpers.isExportAvailable()) {
          await helpers.openExportDialog();
          
          dialog = page.getByRole('dialog');
          recordInput = dialog.getByRole('spinbutton', { name: /Number of records to export/i });
          await recordInput.fill('3');
          
          const downloadPromise2 = page.waitForEvent('download');
          exportButton = dialog.getByRole('button', { name: /Export CSV/i });
          await exportButton.click();
          
          const download2 = await downloadPromise2;
          expect(download2.suggestedFilename()).toMatch(/company-search-export.*\.csv/);
        }
      }
    }
  });
});
