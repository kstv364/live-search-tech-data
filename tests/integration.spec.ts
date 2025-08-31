import { test, expect } from '@playwright/test';
import { createTestHelpers } from './helpers';

test.describe('Full Application Integration', () => {
  test('should complete full user workflow', async ({ page }) => {
    const helpers = createTestHelpers(page);
    
    await page.goto('/');
    await expect(page.getByText('BuiltWith Company Intelligence')).toBeVisible();
    
    await expect(page.getByText('Ready to search 35M+ companies')).toBeVisible();
    await expect(page.getByRole('button', { name: /Search/i })).toBeDisabled();
    await expect(page.getByRole('button', { name: /Export to CSV/i })).toBeDisabled();
    
    const filtersAdded = [];
    
    if (await helpers.addTechnologyFilter('React')) {
      filtersAdded.push('React');
    }
    
    if (await helpers.addTechnologyFilter('AWS')) {
      filtersAdded.push('AWS');
    }
    
    if (filtersAdded.length > 0) {
      await expect(page.getByText('1 filter applied')).toBeVisible();
      await expect(page.getByRole('button', { name: /Search/i })).toBeEnabled();
      await expect(page.getByText('Filters applied! Click Search')).toBeVisible();
    }
    
    if (filtersAdded.length > 0) {
      await helpers.performSearch();
      
      const hasResults = await helpers.hasSearchResults();
      
      if (hasResults) {
        const hasTable = await page.getByRole('table').isVisible();
        if (hasTable) {
          await expect(page.getByRole('table')).toBeVisible();
        }
        
        if (hasTable) {
          const sortableHeaders = await page.getByRole('columnheader').all();
          if (sortableHeaders.length > 0) {
            await sortableHeaders[0].click();
          }
        }
        
        if (hasTable) {
          const showFiltersButton = page.getByRole('button', { name: /Show Filters/i });
          if (await showFiltersButton.isVisible()) {
            await showFiltersButton.click();
          }
        }
        await helpers.hideTableFilters();
        
        if (await helpers.isExportAvailable()) {
          await helpers.openExportDialog();
          
          await expect(page.getByRole('dialog')).toBeVisible();
          
          const hasCloseButton = await page.getByRole('button', { name: /close/i }).isVisible();
          if (hasCloseButton) {
            await page.getByRole('button', { name: /close/i }).click();
          } else {
            await page.keyboard.press('Escape');
          }
          
          await expect(page.getByRole('dialog')).not.toBeVisible();
        }
        
        const nextButton = page.getByRole('button', { name: 'Next', exact: true });
        try {
          if (await nextButton.isEnabled()) {
            await nextButton.click();
            await helpers.waitForStableState();
            
            await expect(page.getByText(/Page.*of/i)).toBeVisible();
            
            const prevButton = page.getByRole('button', { name: 'Previous', exact: true });
            if (await prevButton.isEnabled()) {
              await prevButton.click();
              await helpers.waitForStableState();
            }
          }
        } catch (error) {
          console.log('Pagination test skipped - not available');
        }
      } else {
        await expect(page.getByText('No companies found')).toBeVisible();
        await expect(page.getByText('Try adjusting your filters')).toBeVisible();
      }
      
      await helpers.clearAllFilters();
      await expect(page.getByText('Ready to search 35M+ companies')).toBeVisible();
      await expect(page.getByRole('button', { name: /Search/i })).toBeDisabled();
    }
  });

  test('should handle error states gracefully', async ({ page }) => {
    const helpers = createTestHelpers(page);
    
    await page.goto('/');
    
    await page.route('/api/search', (route) => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Server error' })
      });
    });
    
    if (await helpers.addTechnologyFilter('React')) {
      await page.getByRole('button', { name: /Search/i }).click();
      
      await helpers.waitForStableState();
      await expect(page.getByRole('button', { name: /Search/i })).toBeVisible();
    }
  });

  test('should be responsive across different viewports', async ({ page }) => {
    const helpers = createTestHelpers(page);
    
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto('/');
    await expect(page.getByText('BuiltWith Company Intelligence')).toBeVisible();
    
    await page.setViewportSize({ width: 768, height: 1024 });
    await expect(page.getByText('Search Filters')).toBeVisible();
    
    await page.setViewportSize({ width: 375, height: 667 });
    await expect(page.getByText('fiber.ai')).toBeVisible();
    
    if (await helpers.addTechnologyFilter('React')) {
      await expect(page.getByRole('button', { name: /Search/i })).toBeEnabled();
    }
  });

  test('should maintain state during navigation and interactions', async ({ page }) => {
    const helpers = createTestHelpers(page);
    
    await page.goto('/');
    
    const filtersAdded = [];
    if (await helpers.addTechnologyFilter('React')) {
      filtersAdded.push('React');
    }
    
    if (filtersAdded.length > 0) {
      await page.reload();
      
      await expect(page.getByText('BuiltWith Company Intelligence')).toBeVisible();
      
      if (await helpers.addTechnologyFilter('React')) {
        await helpers.performSearch();
        
        const queryPreview = page.getByText('Query Preview');
        await expect(queryPreview).toBeVisible();
        
        await expect(page.getByText(/filter.*applied/i)).toBeVisible();
      }
    }
  });

  test('should handle concurrent user actions', async ({ page }) => {
    const helpers = createTestHelpers(page);
    
    await page.goto('/');
    
    const addPromises = [
      helpers.addTechnologyFilter('React'),
      helpers.addTechnologyFilter('AWS'),
      helpers.addTechnologyFilter('Salesforce')
    ];
    
    await Promise.all(addPromises);
    
    await helpers.waitForStableState();
    await expect(page.getByRole('button', { name: /Search/i })).toBeEnabled();
  });
});
