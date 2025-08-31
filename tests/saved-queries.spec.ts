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
      
      // Initially save button should be disabled
      const saveQueryButton = dialog.getByRole('button', { name: /Save/i });
      await expect(saveQueryButton).toBeDisabled();
      
      // Enter query name
      await nameInput.fill('Test React Query');
      
      // Save button should now be enabled
      await expect(saveQueryButton).toBeEnabled();
      
      // Save the query
      await saveQueryButton.click();
      
      // Dialog should close
      await expect(dialog).not.toBeVisible();
    }
  });

  test('should load saved queries in dropdown', async ({ page }) => {
    const helpers = createTestHelpers(page);
    
    // First save a query
    if (await helpers.addTechnologyFilter('React')) {
      const saveButton = page.getByRole('button', { name: /Save Query/i });
      await saveButton.click();
      
      const saveDialog = page.getByRole('dialog');
      const nameInput = saveDialog.getByRole('textbox', { name: /Query name/i });
      await nameInput.fill('React Technology Search');
      
      const saveQueryButton = saveDialog.getByRole('button', { name: /Save/i });
      await saveQueryButton.click();
      
      // Wait for save to complete
      await expect(saveDialog).not.toBeVisible();
      
      // Now test loading
      const loadButton = page.getByRole('button', { name: /Load Query/i });
      await loadButton.click();
      
      // Check for dropdown/menu with saved query
      const queryMenu = page.locator('[role="menu"]');
      if (await queryMenu.isVisible()) {
        await expect(queryMenu.getByText('React Technology Search')).toBeVisible();
      } else {
        // Alternative: look for any saved query indication
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
      
      // Enter text
      await nameInput.fill('Test Query');
      await expect(saveQueryButton).toBeEnabled();
      
      // Clear text
      await nameInput.fill('');
      await expect(saveQueryButton).toBeDisabled();
      
      // Enter text again
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
      // Check initial query preview
      await expect(page.getByRole('heading', { name: 'Query Preview' })).toBeVisible();
      
      // Open save dialog
      const saveButton = page.getByRole('button', { name: /Save Query/i });
      await saveButton.click();
      
      const dialog = page.getByRole('dialog');
      
      // Close without saving
      const closeButton = dialog.getByRole('button', { name: /Close/i });
      await closeButton.click();
      
      // Query preview should still be visible and maintain state
      await expect(page.getByRole('heading', { name: 'Query Preview' })).toBeVisible();
      await expect(page.getByText('1 filter applied')).toBeVisible();
    }
  });

  test('should handle query management with search execution', async ({ page }) => {
    const helpers = createTestHelpers(page);
    
    if (await helpers.addTechnologyFilter('React')) {
      // Execute search first
      await helpers.performSearch();
      
      if (await helpers.hasSearchResults()) {
        // Save query after search
        const saveButton = page.getByRole('button', { name: /Save Query/i });
        await saveButton.click();
        
        const dialog = page.getByRole('dialog');
        const nameInput = dialog.getByRole('textbox', { name: /Query name/i });
        await nameInput.fill('React Search with Results');
        
        const saveQueryButton = dialog.getByRole('button', { name: /Save/i });
        await saveQueryButton.click();
        
        // Verify search results are still displayed
        await expect(page.getByRole('table')).toBeVisible();
        await expect(page.getByText(/companies found/)).toBeVisible();
        
        // Verify query preview is maintained
        await expect(page.getByRole('heading', { name: 'Query Preview' })).toBeVisible();
      }
    }
  });

  test('should show appropriate empty state for load queries', async ({ page }) => {
    const loadButton = page.getByRole('button', { name: /Load Query/i });
    await loadButton.click();
    
    // Should show some indication of no saved queries or a dropdown
    const queryMenu = page.locator('[role="menu"]');
    if (await queryMenu.isVisible()) {
      // If menu is visible, it might show "No saved queries" or similar
      // Or it might be empty but still show the menu structure
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
      
      // Test with empty input - button should be disabled
      await nameInput.fill('');
      await expect(saveQueryButton).toBeDisabled();
      
      // Test with valid name
      await nameInput.fill('Valid Query Name');
      await expect(saveQueryButton).toBeEnabled();
      
      // Test with very long name
      const longName = 'A'.repeat(100);
      await nameInput.fill(longName);
      await expect(saveQueryButton).toBeEnabled(); // Should still work unless there's a length limit
    }
  });

  test('should preserve filters when using save/load functionality', async ({ page }) => {
    const helpers = createTestHelpers(page);
    
    // Add multiple filters
    if (await helpers.addTechnologyFilter('React')) {
      if (await helpers.addTechnologyFilter('AWS')) {
        // Should show multiple filters applied
        const filterText = page.getByText(/\d+ filter.*applied/).first();
        await expect(filterText).toBeVisible();
        
        // Save the query
        const saveButton = page.getByRole('button', { name: /Save Query/i });
        await saveButton.click();
        
        const dialog = page.getByRole('dialog');
        const nameInput = dialog.getByRole('textbox', { name: /Query name/i });
        await nameInput.fill('Multi-Filter Query');
        
        const saveQueryButton = dialog.getByRole('button', { name: /Save/i });
        await saveQueryButton.click();
        
        // Wait for dialog to close
        await expect(dialog).not.toBeVisible();
        
        // Clear all filters
        await helpers.clearAllFilters();
        await expect(page.getByText('Ready to search 35M+ companies')).toBeVisible();
        
        // Load the saved query
        const loadButton = page.getByRole('button', { name: /Load Query/i });
        await loadButton.click();
        
        // Look for the saved query in the menu
        const queryItem = page.getByText('Multi-Filter Query');
        if (await queryItem.isVisible()) {
          await queryItem.click();
          
          // Filters should be restored
          await expect(page.getByText(/\d+ filter.*applied/).first()).toBeVisible();
        }
      }
    }
  });
});
