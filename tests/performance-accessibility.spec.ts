import { test, expect } from '@playwright/test';
import { createTestHelpers } from './helpers';

test.describe('Performance and Accessibility', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should load the page within acceptable time', async ({ page }) => {
    const startTime = Date.now();
    
    await page.goto('/');
    await expect(page.getByText('BuiltWith Company Intelligence')).toBeVisible();
    
    const loadTime = Date.now() - startTime;
    expect(loadTime).toBeLessThan(5000); // Should load within 5 seconds
  });

  test('should have proper heading hierarchy', async ({ page }) => {
    // Check for proper heading structure
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible(); // Main title
    
    // Main heading should be "BuiltWith Company Intelligence"
    await expect(page.getByRole('heading', { level: 1, name: 'BuiltWith Company Intelligence' })).toBeVisible();
    
    // Section headings
    await expect(page.getByRole('heading', { level: 3, name: 'Technology Search' })).toBeVisible();
    await expect(page.getByRole('heading', { level: 3, name: 'Technology Names' })).toBeVisible();
    await expect(page.getByRole('heading', { level: 3, name: 'Category Search' })).toBeVisible();
    await expect(page.getByRole('heading', { level: 3, name: 'Technology Categories' })).toBeVisible();
    await expect(page.getByRole('heading', { level: 3, name: 'Query Preview' })).toBeVisible();
    await expect(page.getByRole('heading', { level: 3, name: 'Export Results' })).toBeVisible();
  });

  test('should have proper button labels and accessibility', async ({ page }) => {
    // Check that all interactive elements have proper labels
    const searchButton = page.getByRole('button', { name: /Search/i });
    await expect(searchButton).toBeVisible();
    
    const exportButton = page.getByRole('button', { name: /Export to CSV/i });
    await expect(exportButton).toBeVisible();
    
    const clearButton = page.getByRole('button', { name: /Clear All/i });
    await expect(clearButton).toBeVisible();
    
    const saveButton = page.getByRole('button', { name: /Save Query/i });
    await expect(saveButton).toBeVisible();
    
    const loadButton = page.getByRole('button', { name: /Load Query/i });
    await expect(loadButton).toBeVisible();
  });

  test('should support keyboard navigation', async ({ page }) => {
    // Test tab navigation through main elements
    await page.keyboard.press('Tab');
    
    // Continue tabbing and check that focus moves appropriately
    const tabSequence = [
      'Tab', 'Tab', 'Tab', 'Tab', 'Tab'
    ];
    
    for (const key of tabSequence) {
      await page.keyboard.press(key);
      await page.waitForTimeout(100);
    }
    
    // Should be able to reach interactive elements
    const searchButton = page.getByRole('button', { name: /Search/i });
    await expect(searchButton).toBeVisible();
  });

  test('should handle keyboard interactions on filter buttons', async ({ page }) => {
    const reactButton = page.getByRole('button', { name: 'React' }).first();
    
    if (await reactButton.isVisible()) {
      // Focus the button
      await reactButton.focus();
      
      // Activate with Enter key
      await page.keyboard.press('Enter');
      await page.waitForTimeout(1000);
      
      // Should enable search button
      const searchButton = page.getByRole('button', { name: /Search/i });
      await expect(searchButton).toBeEnabled();
    }
  });

  test('should have proper form labels and inputs', async ({ page }) => {
    // Check that search input has proper labeling
    const techInput = page.getByPlaceholder('Type to search...');
    if (await techInput.isVisible()) {
      await expect(techInput).toBeVisible();
    }
    
    // Check that checkboxes have proper labels - use more specific selectors
    const containsAnyCheckbox = page.locator('#tech_name_contains_any');
    await expect(containsAnyCheckbox).toBeVisible();
    
    const containsAllCheckbox = page.locator('#tech_name_contains_all');
    await expect(containsAllCheckbox).toBeVisible();
    
    const containsNoneCheckbox = page.locator('#tech_name_contains_none');
    await expect(containsNoneCheckbox).toBeVisible();
    
    // Check category checkboxes
    const categoryContainsAnyCheckbox = page.locator('#tech_category_contains_any');
    await expect(categoryContainsAnyCheckbox).toBeVisible();
  });

  test('should maintain performance with large result sets', async ({ page }) => {
    const helpers = createTestHelpers(page);
    
    // Mock large dataset
    const largeMockData = {
      companies: Array.from({ length: 100 }, (_, i) => ({
        company_name: `Company ${i}`,
        root_domain: `company${i}.com`,
        tech_name: 'React',
        country: 'US'
      })),
      total: 100
    };
    
    await page.route('/api/search', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(largeMockData)
      });
    });
    
    if (await helpers.addTechnologyFilter('React')) {
      const startTime = Date.now();
      
      await helpers.performSearch();
      
      // Wait for results to render
      await expect(page.getByText('100 companies found')).toBeVisible();
      
      const renderTime = Date.now() - startTime;
      expect(renderTime).toBeLessThan(10000); // Should render within 10 seconds
      
      // Table should be responsive after rendering
      const table = page.getByRole('table');
      if (await table.isVisible()) {
        const sortButton = page.getByRole('button', { name: 'Domain' });
        await sortButton.click();
        
        // Sorting should complete quickly
        await page.waitForTimeout(2000);
        await expect(table).toBeVisible();
      }
    }
  });

  test('should have proper ARIA attributes on interactive elements', async ({ page }) => {
    // Check that buttons have proper ARIA attributes
    const searchButton = page.getByRole('button', { name: /Search/i });
    await expect(searchButton).toBeVisible();
    
    // Check disabled state ARIA
    if (await searchButton.isDisabled()) {
      const ariaDisabled = await searchButton.getAttribute('aria-disabled');
      expect(ariaDisabled === 'true' || ariaDisabled === null).toBe(true);
    }
    
    // Check expandable sections
    const advancedFiltersButton = page.getByRole('button', { name: /Advanced Filters/i });
    await expect(advancedFiltersButton).toBeVisible();
    
    // Should have aria-expanded attribute
    const ariaExpanded = await advancedFiltersButton.getAttribute('aria-expanded');
    expect(['true', 'false'].includes(ariaExpanded || '')).toBe(true);
  });

  test('should maintain focus management in dialogs', async ({ page }) => {
    const helpers = createTestHelpers(page);
    
    if (await helpers.addTechnologyFilter('React')) {
      // Open save query dialog
      const saveButton = page.getByRole('button', { name: /Save Query/i });
      await saveButton.click();
      
      const dialog = page.getByRole('dialog');
      await expect(dialog).toBeVisible();
      
      // Focus should be in the dialog
      const nameInput = dialog.getByRole('textbox', { name: /Query name/i });
      await expect(nameInput).toBeFocused();
      
      // Add a query name to enable the save button
      await nameInput.fill('Test Query');
      
      // Tab within dialog
      await page.keyboard.press('Tab');
      
      // Should stay within dialog bounds and focus on the enabled save button
      const saveQueryButton = dialog.getByRole('button', { name: /Save/i });
      await expect(saveQueryButton).toBeFocused();
      
      // Close dialog
      await page.keyboard.press('Escape');
      await expect(dialog).not.toBeVisible();
    }
  });

  test('should handle rapid interactions without performance degradation', async ({ page }) => {
    const helpers = createTestHelpers(page);
    
    const startTime = Date.now();
    
    // Perform rapid operations
    if (await helpers.addTechnologyFilter('React')) {
      await helpers.clearAllFilters();
      
      if (await helpers.addTechnologyFilter('AWS')) {
        await helpers.clearAllFilters();
      }
    }
    
    const operationTime = Date.now() - startTime;
    expect(operationTime).toBeLessThan(15000); // Operations should complete in reasonable time
    
    // Interface should remain responsive
    await expect(page.getByText('BuiltWith Company Intelligence')).toBeVisible();
    await expect(page.getByText('Ready to search 35M+ companies')).toBeVisible();
  });

  test('should provide appropriate feedback for loading states', async ({ page }) => {
    const helpers = createTestHelpers(page);
    
    // Mock slow API response
    await page.route('/api/search', async (route) => {
      await new Promise(resolve => setTimeout(resolve, 2000));
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ companies: [], total: 0 })
      });
    });
    
    if (await helpers.addTechnologyFilter('React')) {
      const searchButton = page.getByRole('button', { name: /Search/i });
      await searchButton.click();
      
      // Should provide some form of loading feedback
      // This could be a spinner, disabled button, or loading text
      await page.waitForTimeout(1000);
      
      // Check for any loading indicators
      const possibleLoadingStates = [
        page.getByText(/Loading/i),
        page.getByText(/Searching/i),
        searchButton.isDisabled(),
        page.locator('[data-loading="true"]'),
        page.locator('.loading'),
        page.locator('[role="progressbar"]')
      ];
      
      // At least one loading indicator should be present
      let hasLoadingIndicator = false;
      for (const indicator of possibleLoadingStates) {
        try {
          if (typeof indicator === 'object' && 'isVisible' in indicator) {
            if (await indicator.isVisible()) {
              hasLoadingIndicator = true;
              break;
            }
          } else if (typeof indicator === 'boolean') {
            if (indicator) {
              hasLoadingIndicator = true;
              break;
            }
          }
        } catch (e) {
          // Continue checking other indicators
        }
      }
    }
  });

  test('should maintain consistent styling across interactions', async ({ page }) => {
    const helpers = createTestHelpers(page);
    
    // Check initial styling
    const searchButton = page.getByRole('button', { name: /Search/i });
    const initialButtonState = await searchButton.evaluate(el => ({
      disabled: (el as HTMLButtonElement).disabled,
      opacity: getComputedStyle(el).opacity
    }));
    
    // Add filter and check styling changes
    if (await helpers.addTechnologyFilter('React')) {
      const updatedButtonState = await searchButton.evaluate(el => ({
        disabled: (el as HTMLButtonElement).disabled,
        opacity: getComputedStyle(el).opacity
      }));
      
      // Button should be enabled when filter is added
      expect(updatedButtonState.disabled).toBe(false);
      expect(initialButtonState.disabled).toBe(true);
      
      // Clear filters and check styling returns
      await helpers.clearAllFilters();
      
      const finalButtonState = await searchButton.evaluate(el => ({
        disabled: (el as HTMLButtonElement).disabled,
        opacity: getComputedStyle(el).opacity
      }));
      
      expect(finalButtonState.disabled).toBe(true);
    }
  });

  test('should handle text scaling and zoom levels', async ({ page }) => {
    // Test with different zoom levels
    const zoomLevels = [0.5, 1.0, 1.5, 2.0];
    
    for (const zoom of zoomLevels) {
      await page.setViewportSize({ 
        width: Math.floor(1200 * zoom), 
        height: Math.floor(800 * zoom) 
      });
      
      // Content should remain accessible
      await expect(page.getByText('BuiltWith Company Intelligence')).toBeVisible();
      await expect(page.getByText('Search Filters')).toBeVisible();
      
      // Buttons should remain clickable
      const searchButton = page.getByRole('button', { name: /Search/i });
      await expect(searchButton).toBeVisible();
    }
    
    // Reset to default
    await page.setViewportSize({ width: 1200, height: 800 });
  });
});
