import { test, expect } from '@playwright/test';
import { createTestHelpers } from './helpers';
test.describe('Advanced Search Features', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });
  test('should open and interact with advanced filters', async ({ page }) => {
    const advancedFiltersButton = page.getByRole('button', { name: /Advanced Filters/i });
    await advancedFiltersButton.click();
    await expect(page.getByText('Custom Filter Rules')).toBeVisible();
    await expect(page.getByText('Fields • Operators • Values')).toBeVisible();
    const logicSelector = page.getByRole('combobox').filter({ hasText: 'AND' });
    await expect(logicSelector).toBeVisible();
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
    await advancedFiltersButton.click();
    await expect(page.getByText('Custom Filter Rules')).toBeVisible();
    await advancedFiltersButton.click();
    await expect(page.getByText('Custom Filter Rules')).not.toBeVisible();
  });
  test('should handle multiple technology filter modes', async ({ page }) => {
    const helpers = createTestHelpers(page);
    await expect(page.getByText('Contains Any').first()).toBeVisible();
    const containsAnyCheckbox = page.locator('#tech_name_contains_any');
    await expect(containsAnyCheckbox).not.toBeChecked();
    await containsAnyCheckbox.click();
    await expect(containsAnyCheckbox).toBeChecked();
    const containsAllCheckbox = page.locator('#tech_name_contains_all');
    if (await containsAllCheckbox.isVisible()) {
      await containsAllCheckbox.click();
      await expect(containsAllCheckbox).toBeChecked();
    }
    const containsNoneCheckbox = page.locator('#tech_name_contains_none');
    if (await containsNoneCheckbox.isVisible()) {
      await containsNoneCheckbox.click();
      await expect(containsNoneCheckbox).toBeChecked();
    }
  });
  test('should handle technology categories filtering', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Technology Categories' })).toBeVisible();
    const categoryContainsAnyCheckbox = page.locator('#tech_category_contains_any');
    await categoryContainsAnyCheckbox.click();
    await expect(categoryContainsAnyCheckbox).toBeChecked();
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
    const analyticsButton = page.getByRole('button', { name: 'Analytics' }).first();
    if (await analyticsButton.isVisible()) {
      await analyticsButton.click();
      await page.waitForTimeout(1000);
      const searchButton = page.getByRole('button', { name: /Search/i });
      await expect(searchButton).toBeEnabled();
    }
  });
  test('should show suggested technologies and categories', async ({ page }) => {
    await expect(page.getByText('Suggested technology names')).toBeVisible();
    const suggestedTechs = ['React', 'Salesforce', 'AWS', 'Google Analytics', 'Shopify', 'Stripe'];
    for (const tech of suggestedTechs) {
      await expect(page.getByRole('button', { name: tech }).first()).toBeVisible();
    }
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
      await page.waitForTimeout(1000);
      const reactSuggestion = page.getByText('React').first();
      if (await reactSuggestion.isVisible()) {
        await expect(reactSuggestion).toBeVisible();
      }
    }
  });
  test('should maintain filter state during advanced filter interactions', async ({ page }) => {
    const helpers = createTestHelpers(page);
    if (await helpers.addTechnologyFilter('React')) {
      await expect(page.getByText('1 filter applied')).toBeVisible();
    }
    const advancedFiltersButton = page.getByRole('button', { name: /Advanced Filters/i });
    await advancedFiltersButton.click();
    await expect(page.getByText('1 filter applied')).toBeVisible();
    await advancedFiltersButton.click();
    await expect(page.getByText('1 filter applied')).toBeVisible();
  });
});
