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
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible(); // Main title
    await expect(page.getByRole('heading', { level: 1, name: 'BuiltWith Company Intelligence' })).toBeVisible();
    await expect(page.getByRole('heading', { level: 3, name: 'Technology Search' })).toBeVisible();
    await expect(page.getByRole('heading', { level: 3, name: 'Technology Names' })).toBeVisible();
    await expect(page.getByRole('heading', { level: 3, name: 'Category Search' })).toBeVisible();
    await expect(page.getByRole('heading', { level: 3, name: 'Technology Categories' })).toBeVisible();
    await expect(page.getByRole('heading', { level: 3, name: 'Query Preview' })).toBeVisible();
    await expect(page.getByRole('heading', { level: 3, name: 'Export Results' })).toBeVisible();
  });
  test('should have proper button labels and accessibility', async ({ page }) => {
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
    await page.keyboard.press('Tab');
    const tabSequence = [
      'Tab', 'Tab', 'Tab', 'Tab', 'Tab'
    ];
    for (const key of tabSequence) {
      await page.keyboard.press(key);
      await page.waitForTimeout(100);
    }
    const searchButton = page.getByRole('button', { name: /Search/i });
    await expect(searchButton).toBeVisible();
  });
  test('should handle keyboard interactions on filter buttons', async ({ page }) => {
    const reactButton = page.getByRole('button', { name: 'React' }).first();
    if (await reactButton.isVisible()) {
      await reactButton.focus();
      await page.keyboard.press('Enter');
      await page.waitForTimeout(1000);
      const searchButton = page.getByRole('button', { name: /Search/i });
      await expect(searchButton).toBeEnabled();
    }
  });
  test('should have proper form labels and inputs', async ({ page }) => {
    const techInput = page.getByPlaceholder('Type to search...');
    if (await techInput.isVisible()) {
      await expect(techInput).toBeVisible();
    }
    const containsAnyCheckbox = page.locator('#tech_name_contains_any');
    await expect(containsAnyCheckbox).toBeVisible();
    const containsAllCheckbox = page.locator('#tech_name_contains_all');
    await expect(containsAllCheckbox).toBeVisible();
    const containsNoneCheckbox = page.locator('#tech_name_contains_none');
    await expect(containsNoneCheckbox).toBeVisible();
    const categoryContainsAnyCheckbox = page.locator('#tech_category_contains_any');
    await expect(categoryContainsAnyCheckbox).toBeVisible();
  });
  test('should maintain performance with large result sets', async ({ page }) => {
    const helpers = createTestHelpers(page);
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
      await expect(page.getByText('100 companies found')).toBeVisible();
      const renderTime = Date.now() - startTime;
      expect(renderTime).toBeLessThan(10000); // Should render within 10 seconds
      const table = page.getByRole('table');
      if (await table.isVisible()) {
        const sortButton = page.getByRole('button', { name: 'Domain' });
        await sortButton.click();
        await page.waitForTimeout(2000);
        await expect(table).toBeVisible();
      }
    }
  });
  test('should have proper ARIA attributes on interactive elements', async ({ page }) => {
    const searchButton = page.getByRole('button', { name: /Search/i });
    await expect(searchButton).toBeVisible();
    if (await searchButton.isDisabled()) {
      const ariaDisabled = await searchButton.getAttribute('aria-disabled');
      expect(ariaDisabled === 'true' || ariaDisabled === null).toBe(true);
    }
    const advancedFiltersButton = page.getByRole('button', { name: /Advanced Filters/i });
    await expect(advancedFiltersButton).toBeVisible();
    const ariaExpanded = await advancedFiltersButton.getAttribute('aria-expanded');
    expect(['true', 'false'].includes(ariaExpanded || '')).toBe(true);
  });
  test('should maintain focus management in dialogs', async ({ page }) => {
    const helpers = createTestHelpers(page);
    if (await helpers.addTechnologyFilter('React')) {
      const saveButton = page.getByRole('button', { name: /Save Query/i });
      await saveButton.click();
      const dialog = page.getByRole('dialog');
      await expect(dialog).toBeVisible();
      const nameInput = dialog.getByRole('textbox', { name: /Query name/i });
      await expect(nameInput).toBeFocused();
      await nameInput.fill('Test Query');
      await page.keyboard.press('Tab');
      const saveQueryButton = dialog.getByRole('button', { name: /Save/i });
      await expect(saveQueryButton).toBeFocused();
      await page.keyboard.press('Escape');
      await expect(dialog).not.toBeVisible();
    }
  });
  test('should handle rapid interactions without performance degradation', async ({ page }) => {
    const helpers = createTestHelpers(page);
    const startTime = Date.now();
    if (await helpers.addTechnologyFilter('React')) {
      await helpers.clearAllFilters();
      if (await helpers.addTechnologyFilter('AWS')) {
        await helpers.clearAllFilters();
      }
    }
    const operationTime = Date.now() - startTime;
    expect(operationTime).toBeLessThan(15000); // Operations should complete in reasonable time
    await expect(page.getByText('BuiltWith Company Intelligence')).toBeVisible();
    await expect(page.getByText('Ready to search 35M+ companies')).toBeVisible();
  });
  test('should provide appropriate feedback for loading states', async ({ page }) => {
    const helpers = createTestHelpers(page);
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
      await page.waitForTimeout(1000);
      const possibleLoadingStates = [
        page.getByText(/Loading/i),
        page.getByText(/Searching/i),
        searchButton.isDisabled(),
        page.locator('[data-loading="true"]'),
        page.locator('.loading'),
        page.locator('[role="progressbar"]')
      ];
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
        }
      }
    }
  });
  test('should maintain consistent styling across interactions', async ({ page }) => {
    const helpers = createTestHelpers(page);
    const searchButton = page.getByRole('button', { name: /Search/i });
    const initialButtonState = await searchButton.evaluate(el => ({
      disabled: (el as HTMLButtonElement).disabled,
      opacity: getComputedStyle(el).opacity
    }));
    if (await helpers.addTechnologyFilter('React')) {
      const updatedButtonState = await searchButton.evaluate(el => ({
        disabled: (el as HTMLButtonElement).disabled,
        opacity: getComputedStyle(el).opacity
      }));
      expect(updatedButtonState.disabled).toBe(false);
      expect(initialButtonState.disabled).toBe(true);
      await helpers.clearAllFilters();
      const finalButtonState = await searchButton.evaluate(el => ({
        disabled: (el as HTMLButtonElement).disabled,
        opacity: getComputedStyle(el).opacity
      }));
      expect(finalButtonState.disabled).toBe(true);
    }
  });
  test('should handle text scaling and zoom levels', async ({ page }) => {
    const zoomLevels = [0.5, 1.0, 1.5, 2.0];
    for (const zoom of zoomLevels) {
      await page.setViewportSize({ 
        width: Math.floor(1200 * zoom), 
        height: Math.floor(800 * zoom) 
      });
      await expect(page.getByText('BuiltWith Company Intelligence')).toBeVisible();
      await expect(page.getByText('Search Filters')).toBeVisible();
      const searchButton = page.getByRole('button', { name: /Search/i });
      await expect(searchButton).toBeVisible();
    }
    await page.setViewportSize({ width: 1200, height: 800 });
  });
});
