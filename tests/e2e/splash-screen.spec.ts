import { test, expect } from '@playwright/test';

test.describe('Splash Screen', () => {
  test('Start Adventure button is clickable', async ({ page }) => {
    await page.goto('/');
    
    const button = page.getByRole('button', { name: /Start.*Adventure/i });
    await expect(button).toBeVisible();
    await expect(button).toBeEnabled();
    
    // Verify button text
    await expect(button).toContainText('Start');
    await expect(button).toContainText('Adventure');
  });
});

