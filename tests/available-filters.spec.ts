import { test, expect } from '@playwright/test';

test.describe('Available Filters Check', () => {
  test('should check what technology filters are available', async ({ page }) => {
    await page.goto('/');
    
    // Wait for page to load completely
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
    
    // Look for the Technology Search section
    const techSearchSection = page.getByText('Technology Search');
    await expect(techSearchSection).toBeVisible();
    
    // Look for suggested technology names section
    const suggestedTechSection = page.getByText('Suggested technology names');
    if (await suggestedTechSection.isVisible()) {
      console.log('✓ Found suggested technology names section');
    }
    
    // Look for any technology filter buttons with different patterns
    const filterButtonPatterns = [
      'button:has-text("+")',
      'button[class*="react"]',
      'button[class*="technology"]',
      'button:has-text("React")',
      'button:has-text("Salesforce")',
      'button:has-text("AWS")'
    ];
    
    for (const pattern of filterButtonPatterns) {
      const buttons = page.locator(pattern);
      const count = await buttons.count();
      if (count > 0) {
        console.log(`Found ${count} buttons matching pattern: ${pattern}`);
        
        // Log the first few
        for (let i = 0; i < Math.min(count, 3); i++) {
          const buttonText = await buttons.nth(i).textContent();
          console.log(`  Button ${i + 1}: "${buttonText}"`);
        }
      }
    }
    
    // Check the full page content for debugging
    const pageContent = await page.textContent('body');
    const hasReact = pageContent?.includes('React');
    const hasSalesforce = pageContent?.includes('Salesforce');
    const hasAWS = pageContent?.includes('AWS');
    
    console.log(`Page contains "React": ${hasReact}`);
    console.log(`Page contains "Salesforce": ${hasSalesforce}`);
    console.log(`Page contains "AWS": ${hasAWS}`);
    
    // Take a screenshot for debugging
    await page.screenshot({ path: 'tests/screenshots/available-filters-debug.png', fullPage: true });
    console.log('📸 Screenshot saved to tests/screenshots/available-filters-debug.png');
    
    // Just pass the test - this is informational
    expect(true).toBe(true);
  });
});
