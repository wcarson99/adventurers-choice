import { test, expect } from '@playwright/test';

test('app loads and displays title', async ({ page }) => {
  await page.goto('/');
  
  // Check that the app title is visible
  await expect(page.getByRole('heading', { name: "The Adventurer's Choice" })).toBeVisible();
  
  // Check that the placeholder text is visible
  await expect(page.getByText('Game coming soon...')).toBeVisible();
});

