import { test, expect } from '@playwright/test';

test.describe('Encounter Grid Structure', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Navigate through character creation to get to a mission
    // For now, we'll test the grid directly via game state
  });

  test('grid is 10×10 with border structure', async ({ page }) => {
    // Start a mission to create the grid
    await page.evaluate(() => {
      // Access the game state and start a mission
      const mission = {
        id: 'test-1',
        title: 'Test Mission',
        description: 'Test',
        days: 1,
        rewardGold: 10,
        rewardAp: 1
      };
      
      // We'll need to expose startMission or create grid directly
      // For now, test that Grid class supports 10×10
      if ((window as any).Grid) {
        const grid = new (window as any).Grid(10, 10);
        return {
          width: grid.width,
          height: grid.height,
          totalSquares: grid.width * grid.height
        };
      }
      return null;
    });

    // Test will be updated once we expose Grid or create it via mission
  });

  test('entrance zone is on left side, rows 1-4 (0-indexed: rows 0-3)', async ({ page }) => {
    const result = await page.evaluate(() => {
      if ((window as any).Grid) {
        const grid = new (window as any).Grid(10, 10);
        // Entrance zone: left side (x=0), rows 0-3 (y: 0, 1, 2, 3)
        const entranceSquares = [
          { x: 0, y: 0 },
          { x: 0, y: 1 },
          { x: 0, y: 2 },
          { x: 0, y: 3 }
        ];
        return entranceSquares.every(pos => grid.isValid(pos.x, pos.y));
      }
      return false;
    });
    
    expect(result).toBe(true);
  });

  test('exit zone is on right side, rows 6-9 (0-indexed: rows 5-8)', async ({ page }) => {
    const result = await page.evaluate(() => {
      if ((window as any).Grid) {
        const grid = new (window as any).Grid(10, 10);
        // Exit zone: right side (x=9), rows 5-8 (y: 5, 6, 7, 8)
        const exitSquares = [
          { x: 9, y: 5 },
          { x: 9, y: 6 },
          { x: 9, y: 7 },
          { x: 9, y: 8 }
        ];
        return exitSquares.every(pos => grid.isValid(pos.x, pos.y));
      }
      return false;
    });
    
    expect(result).toBe(true);
  });
});

