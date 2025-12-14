import { test, expect } from '@playwright/test';

test.describe('Splash Screen', () => {
  test('Start Adventure button is positioned correctly', async ({ page }) => {
    await page.goto('/');
    
    // Wait for the button to be visible
    const button = page.getByRole('button', { name: /Start.*Adventure/i });
    await expect(button).toBeVisible();
    
    // Get the button's bounding box
    const boundingBox = await button.boundingBox();
    expect(boundingBox).not.toBeNull();
    
    if (boundingBox) {
      // Verify the button is centered horizontally
      // Button should be centered in the 1280px wide container
      const containerWidth = 1280;
      const buttonCenterX = boundingBox.x + boundingBox.width / 2;
      const expectedCenterX = containerWidth / 2;
      expect(buttonCenterX).toBeCloseTo(expectedCenterX, 0);
      
      // Verify the button's vertical position
      expect(boundingBox.y).toBeCloseTo(402, 0);
    }
    
    // Verify the button's inline styles
    const styleTop = await button.evaluate((el) => {
      return window.getComputedStyle(el).top;
    });
    const styleLeft = await button.evaluate((el) => {
      return window.getComputedStyle(el).left;
    });
    const styleTransform = await button.evaluate((el) => {
      return window.getComputedStyle(el).transform;
    });
    
    // Verify styles are set correctly
    expect(styleTop).toBe('402px');
    expect(styleLeft).toBe('640px'); // 50% of 1280px
    expect(styleTransform).toContain('translateX');
  });
  
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

