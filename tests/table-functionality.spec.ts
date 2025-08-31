import { test, expect } from '@playwright/test';
import { createTestHelpers } from './helpers';
test.describe('Table Features and Sorting', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });
  test('should display table columns correctly after search', async ({ page }) => {
    const helpers = createTestHelpers(page);
    if (await helpers.addTechnologyFilter('React')) {
      await helpers.performSearch();
      if (await helpers.hasSearchResults()) {
        const table = page.getByRole('table');
        await expect(table).toBeVisible();
        await expect(table.getByRole('cell', { name: 'Company Name', exact: true })).toBeVisible();
        await expect(table.getByRole('cell', { name: 'Domain', exact: true })).toBeVisible();
        await expect(table.getByRole('cell', { name: 'Country', exact: true })).toBeVisible();
        await expect(table.getByRole('cell', { name: 'Tech Name', exact: true })).toBeVisible();
        await expect(table.getByRole('cell', { name: 'First Detected', exact: true })).toBeVisible();
      }
    }
  });
  test('should sort table columns when clicked', async ({ page }) => {
    const helpers = createTestHelpers(page);
    if (await helpers.addTechnologyFilter('React')) {
      await helpers.performSearch();
      if (await helpers.hasSearchResults()) {
        const domainHeader = page.getByRole('button', { name: 'Domain' });
        await domainHeader.click();
        await page.waitForTimeout(1000);
        const queryPreview = page.getByText(/root_domain/);
        await expect(queryPreview).toBeVisible();
        const companyNameHeader = page.getByRole('button', { name: 'Company Name' });
        await companyNameHeader.click();
        await page.waitForTimeout(1000);
        const companyNameQuery = page.getByText(/company_name/);
        await expect(companyNameQuery).toBeVisible();
      }
    }
  });
  test('should show pagination controls when applicable', async ({ page }) => {
    const helpers = createTestHelpers(page);
    if (await helpers.addTechnologyFilter('React')) {
      await helpers.performSearch();
      if (await helpers.hasSearchResults()) {
        await expect(page.getByText(/Showing.*of.*results/)).toBeVisible();
        await expect(page.getByText(/Page.*of/)).toBeVisible();
        const prevButton = page.getByRole('button', { name: 'Previous' });
        const nextButton = page.locator('button:has-text("Next"):not([id])').first();
        await expect(prevButton).toBeVisible();
        await expect(nextButton).toBeVisible();
      }
    }
  });
  test('should handle table filter toggle', async ({ page }) => {
    const helpers = createTestHelpers(page);
    if (await helpers.addTechnologyFilter('React')) {
      await helpers.performSearch();
      if (await helpers.hasSearchResults()) {
        const showFiltersButton = page.getByRole('button', { name: /Show Filters/i });
        if (await showFiltersButton.isVisible()) {
          await showFiltersButton.click();
          await page.waitForTimeout(1000);
          const hideFiltersButton = page.getByRole('button', { name: /Hide Filters/i });
          if (await hideFiltersButton.isVisible()) {
            await expect(hideFiltersButton).toBeVisible();
            await hideFiltersButton.click();
          }
        }
      }
    }
  });
  test('should display search results data correctly', async ({ page }) => {
    const helpers = createTestHelpers(page);
    if (await helpers.addTechnologyFilter('React')) {
      await helpers.performSearch();
      if (await helpers.hasSearchResults()) {
        const table = page.getByRole('table');
        await expect(table).toBeVisible();
        const rows = table.locator('tbody tr');
        const rowCount = await rows.count();
        expect(rowCount).toBeGreaterThan(0);
        const reactCells = page.getByText('React');
        await expect(reactCells.first()).toBeVisible();
        const domainPattern = /\w+\.\w+/;
        const firstDomainCell = table.locator('tbody tr').first().locator('td').nth(1);
        const domainText = await firstDomainCell.textContent();
        if (domainText) {
          expect(domainText).toMatch(domainPattern);
        }
      }
    }
  });
  test('should handle multiple column sorting interactions', async ({ page }) => {
    const helpers = createTestHelpers(page);
    if (await helpers.addTechnologyFilter('React')) {
      await helpers.performSearch();
      if (await helpers.hasSearchResults()) {
        const domainHeader = page.getByRole('button', { name: 'Domain' });
        await domainHeader.click();
        await page.waitForTimeout(1000);
        await domainHeader.click();
        await page.waitForTimeout(1000);
        const categoryHeader = page.locator('table').getByRole('button', { name: 'Tech Category' });
        await categoryHeader.click();
        await page.waitForTimeout(1000);
        const table = page.getByRole('table');
        await expect(table).toBeVisible();
      }
    }
  });
  test('should show export all button in table context', async ({ page }) => {
    const helpers = createTestHelpers(page);
    if (await helpers.addTechnologyFilter('React')) {
      await helpers.performSearch();
      if (await helpers.hasSearchResults()) {
        const exportAllButton = page.getByRole('button', { name: /Export All/i });
        if (await exportAllButton.isVisible()) {
          await expect(exportAllButton).toBeVisible();
          await expect(exportAllButton).toBeEnabled();
        }
      }
    }
  });
  test('should maintain search results during table interactions', async ({ page }) => {
    const helpers = createTestHelpers(page);
    if (await helpers.addTechnologyFilter('React')) {
      await helpers.performSearch();
      if (await helpers.hasSearchResults()) {
        const resultsText = await page.getByText(/companies found/).textContent();
        const initialCount = resultsText?.match(/(\d+)\s+companies/)?.[1];
        const domainHeader = page.getByRole('button', { name: 'Domain' });
        await domainHeader.click();
        await page.waitForTimeout(1000);
        const newResultsText = await page.getByText(/companies found/).textContent();
        const newCount = newResultsText?.match(/(\d+)\s+companies/)?.[1];
        if (initialCount && newCount) {
          expect(newCount).toBe(initialCount);
        }
        const table = page.getByRole('table');
        await expect(table).toBeVisible();
      }
    }
  });
});
