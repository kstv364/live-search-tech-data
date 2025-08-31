import { Page, expect } from '@playwright/test';

/**
 * Utility functions for common test operations
 */

export class TestHelpers {
  constructor(private page: Page) {}

  /**
   * Add a technology filter by name
   */
  async addTechnologyFilter(techName: string): Promise<boolean> {
    // Try multiple selector patterns since the buttons might not have "+" in text
    const selectors = [
      `button:has-text("${techName}")`,
      `[role="button"]:has-text("${techName}")`,
    ];
    
    for (const selector of selectors) {
      try {
        const button = this.page.locator(selector).first();
        await button.waitFor({ state: 'visible', timeout: 2000 });
        await button.click();
        await this.page.waitForTimeout(500); // Small delay to allow state update
        console.log(`✓ Successfully clicked technology filter: ${techName}`);
        return true;
      } catch (error) {
        // Continue to next selector
        continue;
      }
    }
    
    console.log(`Technology filter "${techName}" not found or not clickable`);
    return false;
  }

  /**
   * Perform a search operation
   */
  async performSearch(): Promise<boolean> {
    const searchButton = this.page.getByRole('button', { name: /Search/i });
    
    try {
      // Wait for search button to be enabled
      await searchButton.waitFor({ state: 'visible', timeout: 5000 });
      await expect(searchButton).toBeEnabled({ timeout: 10000 });
      await searchButton.click();
      
      // Wait for loading to start
      await this.page.waitForTimeout(1000);
      
      // Wait for loading to complete (either success or failure)
      await this.page.waitForTimeout(5000);
      
      return true;
    } catch (error) {
      console.log('Search button not available or enabled:', error);
      return false;
    }
  }

  /**
   * Check if search has results
   */
  async hasSearchResults(): Promise<boolean> {
    const hasTable = await this.page.getByRole('table').isVisible();
    const hasResultsText = await this.page.getByText(/companies found/i).isVisible();
    return hasTable || hasResultsText;
  }

  /**
   * Get the number of applied filters
   */
  async getFilterCount(): Promise<number> {
    const filterText = await this.page.getByText(/(\d+)\s+filter/).textContent();
    if (filterText) {
      const match = filterText.match(/(\d+)\s+filter/);
      return match ? parseInt(match[1]) : 0;
    }
    return 0;
  }

  /**
   * Clear all filters
   */
  async clearAllFilters() {
    // Try multiple selectors for the Clear All button
    const selectors = [
      'button:has-text("Clear All")',
      'button[data-slot="button"]:has-text("Clear All")',
      '[data-slot="button"]:has-text("Clear All")',
      'button.text-gray-600:has-text("Clear All")'
    ];
    
    for (const selector of selectors) {
      try {
        const clearButton = this.page.locator(selector).first();
        await clearButton.waitFor({ state: 'visible', timeout: 2000 });
        await clearButton.click();
        await this.page.waitForTimeout(500);
        console.log('✓ Successfully clicked Clear All button');
        return;
      } catch (error) {
        continue;
      }
    }
    
    console.log('Clear All button not found or not clickable');
  }

  /**
   * Show table filters
   */
  async showTableFilters() {
    const showFiltersButton = this.page.getByRole('button', { name: /Show Filters/i });
    if (await showFiltersButton.isVisible()) {
      await showFiltersButton.click();
    }
  }

  /**
   * Hide table filters
   */
  async hideTableFilters() {
    const hideFiltersButton = this.page.getByRole('button', { name: /Hide Filters/i });
    if (await hideFiltersButton.isVisible()) {
      await hideFiltersButton.click();
    }
  }

  /**
   * Sort table by column
   */
  async sortTableColumn(columnName: string) {
    const columnHeader = this.page.getByRole('columnheader', { name: new RegExp(columnName, 'i') });
    const sortButton = columnHeader.getByRole('button');
    await sortButton.click();
  }

  /**
   * Filter table column
   */
  async filterTableColumn(columnName: string, value: string) {
    await this.showTableFilters();
    const filterInput = this.page.getByPlaceholder(new RegExp(`Filter ${columnName.toLowerCase()}`, 'i'));
    await filterInput.fill(value);
  }

  /**
   * Check if export is available
   */
  async isExportAvailable(): Promise<boolean> {
    const exportButton = this.page.getByRole('button', { name: /Export to CSV/i });
    return await exportButton.isEnabled();
  }

  /**
   * Open export dialog
   */
  async openExportDialog() {
    const exportButton = this.page.getByRole('button', { name: /Export to CSV/i });
    await expect(exportButton).toBeEnabled();
    await exportButton.click();
  }

  /**
   * Wait for page to be in a stable state
   */
  async waitForStableState() {
    // Wait for any pending animations or transitions
    await this.page.waitForTimeout(500);
    
    // Wait for network to be idle
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Take a screenshot for debugging
   */
  async takeDebugScreenshot(name: string) {
    await this.page.screenshot({ 
      path: `tests/screenshots/${name}.png`,
      fullPage: true 
    });
  }

  /**
   * Check if element is in viewport
   */
  async isInViewport(selector: string): Promise<boolean> {
    return await this.page.evaluate((sel) => {
      const element = document.querySelector(sel);
      if (!element) return false;
      
      const rect = element.getBoundingClientRect();
      return (
        rect.top >= 0 &&
        rect.left >= 0 &&
        rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
        rect.right <= (window.innerWidth || document.documentElement.clientWidth)
      );
    }, selector);
  }
}

/**
 * Create test helpers instance
 */
export function createTestHelpers(page: Page): TestHelpers {
  return new TestHelpers(page);
}
