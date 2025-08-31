import { test, expect } from '@playwright/test';

test.describe('Basic Application Tests', () => {
  test('should load the application successfully', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText('BuiltWith Company Intelligence')).toBeVisible();
    await expect(page.getByText('fiber.ai')).toBeVisible();
    await expect(page.getByText('Search Filters')).toBeVisible();
  });

  test('should show initial empty state', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText('Ready to search 35M+ companies')).toBeVisible();
    const exportButton = page.getByRole('button', { name: /Export to CSV/i });
    await expect(exportButton).toBeDisabled();
    const searchButton = page.getByRole('button', { name: /Search/i });
    await expect(searchButton).toBeDisabled();
  });

  test('should enable search button when filter is added', async ({ page }) => {
    await page.goto('/');
    const reactButton = page.getByRole('button', { name: 'React +' });
    
    if (await reactButton.isVisible()) {
      await reactButton.click();
      const searchButton = page.getByRole('button', { name: /Search/i });
      await expect(searchButton).toBeEnabled();
      await expect(page.getByText(/filter.*applied/i)).toBeVisible();
    }
  });

  test('should have working navigation elements', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText('Audiences')).toBeVisible();
    await expect(page.getByText('Exclusions')).toBeVisible();
    await expect(page.getByText('Advanced Scrapes')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Query Preview' })).toBeVisible();
    await expect(page.getByText('Export Results')).toBeVisible();
  });

  test('should handle responsive design', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto('/');
    await expect(page.getByText('BuiltWith Company Intelligence')).toBeVisible();
    await page.setViewportSize({ width: 768, height: 1024 });
    await expect(page.getByText('Search Filters')).toBeVisible();
    await page.setViewportSize({ width: 375, height: 667 });
    await expect(page.getByText('fiber.ai')).toBeVisible();
  });
});
