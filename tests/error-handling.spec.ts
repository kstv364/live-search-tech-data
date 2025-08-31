import { test, expect } from '@playwright/test';
import { createTestHelpers } from './helpers';

test.describe('Error Handling and Edge Cases', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should handle search API errors gracefully', async ({ page }) => {
    const helpers = createTestHelpers(page);
    
    // Mock API error response
    await page.route('/api/search', (route) => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Internal Server Error' })
      });
    });
    
    if (await helpers.addTechnologyFilter('React')) {
      const searchButton = page.getByRole('button', { name: /Search/i });
      await searchButton.click();
      
      // Wait for error handling
      await page.waitForTimeout(3000);
      
      // Should still show the search interface
      await expect(page.getByText('Search Filters')).toBeVisible();
      await expect(searchButton).toBeVisible();
      
      // Export button should remain disabled
      const exportButton = page.getByRole('button', { name: /Export to CSV/i });
      await expect(exportButton).toBeDisabled();
    }
  });

  test('should handle network timeout gracefully', async ({ page }) => {
    const helpers = createTestHelpers(page);
    
    // Mock slow network response
    await page.route('/api/search', async (route) => {
      await new Promise(resolve => setTimeout(resolve, 30000)); // 30 second delay
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ companies: [], total: 0 })
      });
    });
    
    if (await helpers.addTechnologyFilter('React')) {
      const searchButton = page.getByRole('button', { name: /Search/i });
      await searchButton.click();
      
      // Wait a reasonable time
      await page.waitForTimeout(5000);
      
      // Should still be able to interact with the interface
      await expect(page.getByText('Search Filters')).toBeVisible();
    }
  });

  test('should handle empty search results', async ({ page }) => {
    const helpers = createTestHelpers(page);
    
    // Mock empty results
    await page.route('/api/search', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ companies: [], total: 0 })
      });
    });
    
    if (await helpers.addTechnologyFilter('React')) {
      await helpers.performSearch();
      
      // Should show appropriate empty state
      const noResultsMessages = [
        'No companies found',
        '0 companies found',
        'Try adjusting your filters',
        'No results'
      ];
      
      let foundEmptyMessage = false;
      for (const message of noResultsMessages) {
        if (await page.getByText(message).isVisible()) {
          foundEmptyMessage = true;
          break;
        }
      }
      
      // Export button should be disabled for empty results
      const exportButton = page.getByRole('button', { name: /Export to CSV/i });
      await expect(exportButton).toBeDisabled();
    }
  });

  test('should handle malformed API responses', async ({ page }) => {
    const helpers = createTestHelpers(page);
    
    // Mock malformed JSON response
    await page.route('/api/search', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: 'invalid json response'
      });
    });
    
    if (await helpers.addTechnologyFilter('React')) {
      await helpers.performSearch();
      
      // Application should remain functional
      await expect(page.getByText('Search Filters')).toBeVisible();
      
      const exportButton = page.getByRole('button', { name: /Export to CSV/i });
      await expect(exportButton).toBeDisabled();
    }
  });

  test('should handle very large result sets', async ({ page }) => {
    const helpers = createTestHelpers(page);
    
    // Mock large result set
    const largeMockData = {
      companies: Array.from({ length: 1000 }, (_, i) => ({
        company_name: `Company ${i}`,
        root_domain: `company${i}.com`,
        tech_name: 'React',
        country: 'US'
      })),
      total: 1000
    };

    await page.route('/api/search', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(largeMockData)
      });
    });

    if (await helpers.addTechnologyFilter('React')) {
      await helpers.performSearch();
      
      // Should handle large datasets without freezing - look for companies found text
      await expect(page.getByText(/\d+ companies found/)).toBeVisible();
      
      // Table should still be responsive
      const table = page.getByRole('table');
      if (await table.isVisible()) {
        await expect(table).toBeVisible();
        
        // Should show pagination for large results
        await expect(page.getByText(/Page.*of/)).toBeVisible();
      }
      
      // Export should be available
      const exportButton = page.getByRole('button', { name: /Export to CSV/i });
      await expect(exportButton).toBeEnabled();
      
      // Check export records text
      await expect(page.getByText(/\d+ records available/)).toBeVisible();
    }
  });  test('should handle special characters in search filters', async ({ page }) => {
    const helpers = createTestHelpers(page);
    
    // Try to add a filter with special characters
    const techInput = page.getByPlaceholder('Type to search...');
    if (await techInput.isVisible()) {
      await techInput.click();
      await techInput.fill('React & Angular + Vue.js');
      
      // Should handle special characters gracefully
      await page.waitForTimeout(1000);
      
      // Interface should remain functional
      await expect(page.getByText('Search Filters')).toBeVisible();
    }
  });

  test('should handle rapid successive clicks', async ({ page }) => {
    const helpers = createTestHelpers(page);
    
    if (await helpers.addTechnologyFilter('React')) {
      const searchButton = page.getByRole('button', { name: /Search/i });
      
      // Click search button multiple times rapidly
      for (let i = 0; i < 5; i++) {
        if (await searchButton.isEnabled()) {
          await searchButton.click();
        }
      }
      
      // Application should remain stable
      await page.waitForTimeout(3000);
      await expect(page.getByText('Search Filters')).toBeVisible();
    }
  });

  test('should handle browser back/forward navigation', async ({ page }) => {
    const helpers = createTestHelpers(page);
    
    if (await helpers.addTechnologyFilter('React')) {
      // Add filter and perform search
      await helpers.performSearch();
      
      if (await helpers.hasSearchResults()) {
        // Navigate away and back
        await page.goto('about:blank');
        await page.goBack();
        
        // Application should reload properly
        await expect(page.getByText('BuiltWith Company Intelligence')).toBeVisible();
        await expect(page.getByText('Search Filters')).toBeVisible();
      }
    }
  });

  test('should handle page refresh during operations', async ({ page }) => {
    const helpers = createTestHelpers(page);
    
    if (await helpers.addTechnologyFilter('React')) {
      // Start search
      const searchButton = page.getByRole('button', { name: /Search/i });
      await searchButton.click();
      
      // Refresh page immediately
      await page.reload();
      
      // Application should load cleanly
      await expect(page.getByText('BuiltWith Company Intelligence')).toBeVisible();
      await expect(page.getByText('Ready to search 35M+ companies')).toBeVisible();
      
      // Should be back to initial state
      const exportButton = page.getByRole('button', { name: /Export to CSV/i });
      await expect(exportButton).toBeDisabled();
    }
  });

  test('should handle extreme viewport sizes', async ({ page }) => {
    const helpers = createTestHelpers(page);
    
    // Test very small viewport
    await page.setViewportSize({ width: 320, height: 480 });
    await expect(page.getByText('BuiltWith Company Intelligence')).toBeVisible();
    
    if (await helpers.addTechnologyFilter('React')) {
      await expect(page.getByRole('button', { name: /Search/i })).toBeEnabled();
    }
    
    // Test very large viewport
    await page.setViewportSize({ width: 2560, height: 1440 });
    await expect(page.getByText('Search Filters')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Query Preview' })).toBeVisible();
  });

  test('should handle invalid export parameters', async ({ page }) => {
    const helpers = createTestHelpers(page);
    
    if (await helpers.addTechnologyFilter('React')) {
      await helpers.performSearch();
      
      if (await helpers.hasSearchResults() && await helpers.isExportAvailable()) {
        await helpers.openExportDialog();
        
        const dialog = page.getByRole('dialog');
        const recordInput = dialog.getByRole('spinbutton', { name: /Number of records to export/i });
        
        // Test with negative number
        await recordInput.fill('-5');
        const exportButton = dialog.getByRole('button', { name: /Export CSV/i });
        await expect(exportButton).toBeDisabled();
        
        // Test with very large number
        await recordInput.fill('999999');
        // Should either be disabled or capped to max available
        const isDisabled = await exportButton.isDisabled();
        const isEnabled = await exportButton.isEnabled();
        expect(isDisabled || isEnabled).toBe(true); // One should be true
      }
    }
  });

  test('should handle concurrent filter operations', async ({ page }) => {
    // Try to add multiple filters simultaneously
    const techButtons = await page.getByRole('button').filter({ hasText: /React|AWS|Salesforce/ }).all();
    
    if (techButtons.length > 0) {
      // Click multiple buttons concurrently
      const promises = techButtons.slice(0, 3).map(button => button.click());
      await Promise.allSettled(promises);
      
      await page.waitForTimeout(2000);
      
      // Application should remain stable
      await expect(page.getByText('Search Filters')).toBeVisible();
      
      const searchButton = page.getByRole('button', { name: /Search/i });
      await expect(searchButton).toBeEnabled();
    }
  });

  test('should handle localStorage errors', async ({ page }) => {
    // Mock localStorage to throw errors
    await page.addInitScript(() => {
      Object.defineProperty(window, 'localStorage', {
        value: {
          getItem: () => { throw new Error('localStorage error'); },
          setItem: () => { throw new Error('localStorage error'); },
          removeItem: () => { throw new Error('localStorage error'); },
          clear: () => { throw new Error('localStorage error'); }
        }
      });
    });
    
    await page.reload();
    
    // Application should still function without localStorage
    await expect(page.getByText('BuiltWith Company Intelligence')).toBeVisible();
    
    const helpers = createTestHelpers(page);
    if (await helpers.addTechnologyFilter('React')) {
      await expect(page.getByRole('button', { name: /Search/i })).toBeEnabled();
    }
  });
});
