import { test, expect } from '@playwright/test';

test('game engine can execute a turn', async ({ page }) => {
  await page.goto('/');
  
  // The game engine should be available and can execute a turn
  // We'll test this by checking that executeTurn can be called and returns game state
  const gameState = await page.evaluate(() => {
    // @ts-ignore - GameEngine will be available on window for testing
    const { GameEngine } = (window as any);
    const engine = new GameEngine();
    const action = { type: 'NO_OP' }; // Simple no-op action for initial test
    return engine.executeTurn(action);
  });
  
  // Game engine should return a game state object
  expect(gameState).toBeDefined();
  expect(typeof gameState).toBe('object');
});

