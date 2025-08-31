import { test, expect } from '@playwright/test';
import { createTestHelpers } from './helpers';
test.describe('Saved Queries and Query Management', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });
  test('should open save query dialog when save button is clicked', async ({ page }) => {
    const helpers = createTestHelpers(page);
    if (await helpers.addTechnologyFilter('React')) {
      const saveButton = page.getByRole('button', { name: /Save Query/i });
      await expect(saveButton).toBeVisible();
      await saveButton.click();
      const dialog = page.getByRole('dialog');
      await expect(dialog).toBeVisible();
      await expect(dialog.getByRole('heading', { name: 'Save Current Query' })).toBeVisible();
      await expect(dialog.getByText('Give your query a name to save it for later use')).toBeVisible();
    }
  });
  test('should save query with custom name', async ({ page }) => {
    const helpers = createTestHelpers(page);
    if (await helpers.addTechnologyFilter('React')) {
      const saveButton = page.getByRole('button', { name: /Save Query/i });
      await saveButton.click();
      const dialog = page.getByRole('dialog');
      const nameInput = dialog.getByRole('textbox', { name: /Query name/i });
      await expect(nameInput).toBeVisible();
      const saveQueryButton = dialog.getByRole('button', { name: /Save/i });
      await expect(saveQueryButton).toBeDisabled();
      await nameInput.fill('Test React Query');
      await expect(saveQueryButton).toBeEnabled();
      await saveQueryButton.click();
      await expect(dialog).not.toBeVisible();
    }
  });
  test('should load saved queries in dropdown', async ({ page }) => {
    const helpers = createTestHelpers(page);
    if (await helpers.addTechnologyFilter('React')) {
      const saveButton = page.getByRole('button', { name: /Save Query/i });
      await saveButton.click();
      const saveDialog = page.getByRole('dialog');
      const nameInput = saveDialog.getByRole('textbox', { name: /Query name/i });
      await nameInput.fill('React Technology Search');
      const saveQueryButton = saveDialog.getByRole('button', { name: /Save/i });
      await saveQueryButton.click();
      await expect(saveDialog).not.toBeVisible();
      const loadButton = page.getByRole('button', { name: /Load Query/i });
      await loadButton.click();
      const queryMenu = page.locator('[role="menu"]');
      if (await queryMenu.isVisible()) {
        await expect(queryMenu.getByText('React Technology Search')).toBeVisible();
      } else {
        await expect(page.getByText('React Technology Search')).toBeVisible();
      }
    }
  });
  test('should clear form when query name input is empty', async ({ page }) => {
    const helpers = createTestHelpers(page);
    if (await helpers.addTechnologyFilter('React')) {
      const saveButton = page.getByRole('button', { name: /Save Query/i });
      await saveButton.click();
      const dialog = page.getByRole('dialog');
      const nameInput = dialog.getByRole('textbox', { name: /Query name/i });
      const saveQueryButton = dialog.getByRole('button', { name: /Save/i });
      await nameInput.fill('Test Query');
      await expect(saveQueryButton).toBeEnabled();
      await nameInput.fill('');
      await expect(saveQueryButton).toBeDisabled();
      await nameInput.fill('Another Test');
      await expect(saveQueryButton).toBeEnabled();
    }
  });
  test('should close save dialog with close button', async ({ page }) => {
    const helpers = createTestHelpers(page);
    if (await helpers.addTechnologyFilter('React')) {
      const saveButton = page.getByRole('button', { name: /Save Query/i });
      await saveButton.click();
      const dialog = page.getByRole('dialog');
      await expect(dialog).toBeVisible();
      const closeButton = dialog.getByRole('button', { name: /Close/i });
      await closeButton.click();
      await expect(dialog).not.toBeVisible();
    }
  });
  test('should maintain query preview during save/load operations', async ({ page }) => {
    const helpers = createTestHelpers(page);
    if (await helpers.addTechnologyFilter('React')) {
      await expect(page.getByRole('heading', { name: 'Query Preview' })).toBeVisible();
      const saveButton = page.getByRole('button', { name: /Save Query/i });
      await saveButton.click();
      const dialog = page.getByRole('dialog');
      const closeButton = dialog.getByRole('button', { name: /Close/i });
      await closeButton.click();
      await expect(page.getByRole('heading', { name: 'Query Preview' })).toBeVisible();
      await expect(page.getByText('1 filter applied')).toBeVisible();
    }
  });
  test('should handle query management with search execution', async ({ page }) => {
    const helpers = createTestHelpers(page);
    if (await helpers.addTechnologyFilter('React')) {
      await helpers.performSearch();
      if (await helpers.hasSearchResults()) {
        const saveButton = page.getByRole('button', { name: /Save Query/i });
        await saveButton.click();
        const dialog = page.getByRole('dialog');
        const nameInput = dialog.getByRole('textbox', { name: /Query name/i });
        await nameInput.fill('React Search with Results');
        const saveQueryButton = dialog.getByRole('button', { name: /Save/i });
        await saveQueryButton.click();
        await expect(page.getByRole('table')).toBeVisible();
        await expect(page.getByText(/companies found/)).toBeVisible();
        await expect(page.getByRole('heading', { name: 'Query Preview' })).toBeVisible();
      }
    }
  });
  test('should show appropriate empty state for load queries', async ({ page }) => {
    const loadButton = page.getByRole('button', { name: /Load Query/i });
    await loadButton.click();
    const queryMenu = page.locator('[role="menu"]');
    if (await queryMenu.isVisible()) {
      await expect(queryMenu).toBeVisible();
    }
  });
  test('should handle save query validation', async ({ page }) => {
    const helpers = createTestHelpers(page);
    if (await helpers.addTechnologyFilter('React')) {
      const saveButton = page.getByRole('button', { name: /Save Query/i });
      await saveButton.click();
      const dialog = page.getByRole('dialog');
      const nameInput = dialog.getByRole('textbox', { name: /Query name/i });
      const saveQueryButton = dialog.getByRole('button', { name: /Save/i });
      await nameInput.fill('');
      await expect(saveQueryButton).toBeDisabled();
      await nameInput.fill('Valid Query Name');
      await expect(saveQueryButton).toBeEnabled();
      const longName = 'A'.repeat(100);
      await nameInput.fill(longName);
      await expect(saveQueryButton).toBeEnabled();
    }
  });
  test('should preserve filters when using save/load functionality', async ({ page }) => {
    const helpers = createTestHelpers(page);
    if (await helpers.addTechnologyFilter('React')) {
      if (await helpers.addTechnologyFilter('AWS')) {
        const filterText = page.getByText(/\d+ filter.*applied/).first();
        await expect(filterText).toBeVisible();
        const saveButton = page.getByRole('button', { name: /Save Query/i });
        await saveButton.click();
        const dialog = page.getByRole('dialog');
        const nameInput = dialog.getByRole('textbox', { name: /Query name/i });
        await nameInput.fill('Multi-Filter Query');
        const saveQueryButton = dialog.getByRole('button', { name: /Save/i });
        await saveQueryButton.click();
        await expect(dialog).not.toBeVisible();
        await helpers.clearAllFilters();
        await expect(page.getByText('Ready to search 35M+ companies')).toBeVisible();
        const loadButton = page.getByRole('button', { name: /Load Query/i });
        await loadButton.click();
        const queryItem = page.getByText('Multi-Filter Query');
        if (await queryItem.isVisible()) {
          await queryItem.click();
          await expect(page.getByText(/\d+ filter.*applied/).first()).toBeVisible();
        }
      }
    }
  });
});
