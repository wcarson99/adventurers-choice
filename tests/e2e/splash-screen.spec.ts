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
      // Verify the button's position matches expected values
      // Expected: left: 633px, top: 222px
      // Allow some tolerance for browser rendering differences (±5px)
      expect(boundingBox.x).toBeCloseTo(633, 0);
      expect(boundingBox.y).toBeCloseTo(222, 0);
      
      // Log the actual position for debugging
      console.log('Button position:', {
        left: boundingBox.x,
        top: boundingBox.y,
        width: boundingBox.width,
        height: boundingBox.height
      });
    }
    
    // Verify the button's inline styles
    const styleTop = await button.evaluate((el) => {
      return window.getComputedStyle(el).top;
    });
    const styleLeft = await button.evaluate((el) => {
      return window.getComputedStyle(el).left;
    });
    
    // Verify styles are set to pixel values
    expect(styleTop).toBe('222px');
    expect(styleLeft).toBe('633px');
    
    // #region agent log
    await page.evaluate((data) => {
      fetch('http://127.0.0.1:7243/ingest/a8076b67-7120-45c4-b321-06759ddc4b1d', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          location: 'splash-screen.spec.ts:40',
          message: 'Button position test results',
          data: data,
          timestamp: Date.now(),
          sessionId: 'debug-session',
          runId: 'run1',
          hypothesisId: 'positioning'
        })
      }).catch(() => {});
    }, {
      boundingBoxX: boundingBox?.x,
      boundingBoxY: boundingBox?.y,
      styleTop,
      styleLeft,
      expectedLeft: 633,
      expectedTop: 222
    });
    // #endregion
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

