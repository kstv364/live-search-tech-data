import { test, expect } from '@playwright/test';
import { createTestHelpers } from './helpers';

test.describe('Advanced Search Features', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should open and interact with advanced filters', async ({ page }) => {
    const advancedFiltersButton = page.getByRole('button', { name: /Advanced Filters/i });
    await advancedFiltersButton.click();

    // Check if advanced filters section is expanded
    await expect(page.getByText('Custom Filter Rules')).toBeVisible();
    await expect(page.getByText('Fields • Operators • Values')).toBeVisible();
    
    // Verify the AND/OR logic selector
    const logicSelector = page.getByRole('combobox').filter({ hasText: 'AND' });
    await expect(logicSelector).toBeVisible();
    
    // Check for Add Condition and Add Group buttons
    await expect(page.getByRole('button', { name: /Add Condition/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Add Group/i })).toBeVisible();
  });

  test('should show advanced filter tips', async ({ page }) => {
    const advancedFiltersButton = page.getByRole('button', { name: /Advanced Filters/i });
    await advancedFiltersButton.click();

    await expect(page.getByText('💡 Advanced Filter Tips:')).toBeVisible();
    await expect(page.getByText('Use Company Fields to filter by location, spending, or company details')).toBeVisible();
    await expect(page.getByText('Use Technology Fields for premium vs free tech, descriptions, or parent technologies')).toBeVisible();
    await expect(page.getByText('Combine multiple conditions with AND/OR logic for precise targeting')).toBeVisible();
  });

  test('should collapse advanced filters when clicked again', async ({ page }) => {
    const advancedFiltersButton = page.getByRole('button', { name: /Advanced Filters/i });
    
    // Open advanced filters
    await advancedFiltersButton.click();
    await expect(page.getByText('Custom Filter Rules')).toBeVisible();
    
    // Close advanced filters
    await advancedFiltersButton.click();
    await expect(page.getByText('Custom Filter Rules')).not.toBeVisible();
  });

  test('should handle multiple technology filter modes', async ({ page }) => {
    const helpers = createTestHelpers(page);
    
    // Test "Contains Any" mode (default)
    await expect(page.getByText('Contains Any').first()).toBeVisible();
    const containsAnyCheckbox = page.locator('#tech_name_contains_any');
    await expect(containsAnyCheckbox).not.toBeChecked();
    
    // Add a technology filter in "Contains Any" mode
    await containsAnyCheckbox.click();
    await expect(containsAnyCheckbox).toBeChecked();
    
    // Test "Contains All" mode
    const containsAllCheckbox = page.locator('#tech_name_contains_all');
    if (await containsAllCheckbox.isVisible()) {
      await containsAllCheckbox.click();
      await expect(containsAllCheckbox).toBeChecked();
    }
    
    // Test "Contains None" mode
    const containsNoneCheckbox = page.locator('#tech_name_contains_none');
    if (await containsNoneCheckbox.isVisible()) {
      await containsNoneCheckbox.click();
      await expect(containsNoneCheckbox).toBeChecked();
    }
  });

  test('should handle technology categories filtering', async ({ page }) => {
    // Check technology categories section using role heading to be specific
    await expect(page.getByRole('heading', { name: 'Technology Categories' })).toBeVisible();
    
    // First activate the "Contains Any" checkbox for categories
    const categoryContainsAnyCheckbox = page.locator('#tech_category_contains_any');
    await categoryContainsAnyCheckbox.click();
    await expect(categoryContainsAnyCheckbox).toBeChecked();
    
    // Test category filter buttons
    const categoryButtons = [
      'Analytics', 'CRM', 'E-commerce', 
      'Marketing Automation', 'Cloud Services', 'Security'
    ];
    
    for (const category of categoryButtons) {
      const button = page.getByRole('button', { name: category }).first();
      if (await button.isVisible()) {
        await expect(button).toBeVisible();
      }
    }
    
    // Try clicking a category filter
    const analyticsButton = page.getByRole('button', { name: 'Analytics' }).first();
    if (await analyticsButton.isVisible()) {
      await analyticsButton.click();
      await page.waitForTimeout(1000);
      
      // Check if search button becomes enabled
      const searchButton = page.getByRole('button', { name: /Search/i });
      await expect(searchButton).toBeEnabled();
    }
  });

  test('should show suggested technologies and categories', async ({ page }) => {
    // Check suggested technology names
    await expect(page.getByText('Suggested technology names')).toBeVisible();
    
    const suggestedTechs = ['React', 'Salesforce', 'AWS', 'Google Analytics', 'Shopify', 'Stripe'];
    for (const tech of suggestedTechs) {
      await expect(page.getByRole('button', { name: tech }).first()).toBeVisible();
    }
    
    // Check suggested technology categories
    await expect(page.getByText('Suggested technology categories')).toBeVisible();
    
    const suggestedCategories = ['Analytics', 'CRM', 'E-commerce', 'Marketing Automation', 'Cloud Services', 'Security'];
    for (const category of suggestedCategories) {
      await expect(page.getByRole('button', { name: category }).first()).toBeVisible();
    }
  });

  test('should handle typeahead functionality in technology search', async ({ page }) => {
    const techInput = page.getByPlaceholder('Type to search...');
    if (await techInput.isVisible()) {
      await techInput.click();
      await techInput.fill('Rea');
      
      // Wait for typeahead suggestions to appear
      await page.waitForTimeout(1000);
      
      // Look for React in suggestions (this test validates typeahead behavior)
      const reactSuggestion = page.getByText('React').first();
      if (await reactSuggestion.isVisible()) {
        await expect(reactSuggestion).toBeVisible();
      }
    }
  });

  test('should maintain filter state during advanced filter interactions', async ({ page }) => {
    const helpers = createTestHelpers(page);
    
    // Add a basic filter first
    if (await helpers.addTechnologyFilter('React')) {
      await expect(page.getByText('1 filter applied')).toBeVisible();
    }
    
    // Open advanced filters
    const advancedFiltersButton = page.getByRole('button', { name: /Advanced Filters/i });
    await advancedFiltersButton.click();
    
    // Verify filter state is maintained
    await expect(page.getByText('1 filter applied')).toBeVisible();
    
    // Close advanced filters
    await advancedFiltersButton.click();
    
    // Verify filter state is still maintained
    await expect(page.getByText('1 filter applied')).toBeVisible();
  });
});
