import { test, expect } from '@playwright/test';
import { EncounterHelpers } from '../helpers/encounter-helpers';

test.describe('Win Condition - Direct Test', () => {
  let encounter: EncounterHelpers;

  test.beforeEach(async ({ page }) => {
    encounter = new EncounterHelpers(page);
    
    // Navigate to splash screen
    await page.goto('/', { waitUntil: 'networkidle' });
    
    // Wait for select dropdown with timeout
    const gameSelect = page.locator('select').first();
    await gameSelect.waitFor({ state: 'visible', timeout: 10000 });
    
    // Select movement-test-campaign
    await gameSelect.selectOption('movement-test-campaign');
    
    // Click Start Adventure button
    const startButton = page.getByRole('button', { name: /Start Adventure/i });
    await startButton.waitFor({ state: 'visible', timeout: 5000 });
    await startButton.click();
    
    // Wait for character creation screen
    await page.waitForSelector('text=Assemble Your Party', { timeout: 10000 });
    
    // Click Embark to Town
    const embarkButton = page.getByRole('button', { name: /Embark to Town/i });
    await embarkButton.waitFor({ state: 'visible', timeout: 5000 });
    await embarkButton.click();
    
    // Wait for encounter grid to appear
    await encounter.getTile(0, 0).waitFor({ state: 'visible', timeout: 15000 });
  });

  test('encounter ends when characters are manually placed in exit zone', async ({ page }) => {
    // Exit zone is at x=9, y=5-8
    // Characters start at (0,1) and (0,2)
    
    // Use JavaScript to directly move characters to exit zone
    await page.evaluate(() => {
      // @ts-ignore - accessing game state
      const gameState = (window as any).__GAME_STATE__;
      if (gameState && gameState.world && gameState.grid) {
        const world = gameState.world;
        const grid = gameState.grid;
        
        // Get all player characters
        const entities = world.getAllEntities();
        const characters = entities.filter((id: number) => {
          const r = world.getComponent(id, 'Renderable');
          return r && r.color === '#4A7C59'; // theme.colors.accent
        });
        
        // Move first character to (9,5) - exit zone
        if (characters.length > 0) {
          const pos1 = world.getComponent(characters[0], 'Position');
          if (pos1) {
            pos1.x = 9;
            pos1.y = 5;
          }
        }
        
        // Move second character to (9,6) - exit zone
        if (characters.length > 1) {
          const pos2 = world.getComponent(characters[1], 'Position');
          if (pos2) {
            pos2.x = 9;
            pos2.y = 6;
          }
        }
      }
    });
    
    // Wait a moment for state to update
    await page.waitForTimeout(500);
    
    // Verify characters are in exit zone
    const char1InExit = await encounter.getEntityAtTile(9, 5);
    const char2InExit = await encounter.getEntityAtTile(9, 6);
    
    expect(char1InExit).not.toBeNull();
    expect(char2InExit).not.toBeNull();
    
    // Trigger a win condition check by executing an empty movement (or any action)
    // Actually, let's just wait - the win condition should check automatically
    // But since we're not executing any actions, let's trigger a re-render
    await page.evaluate(() => {
      // Force a re-render by clicking somewhere
      const tile = document.querySelector('[data-tile-x="9"][data-tile-y="5"]') as HTMLElement;
      if (tile) {
        tile.click();
      }
    });
    
    await page.waitForTimeout(2000);
    
    // Check for completion message or view change
    const completionIndicators = [
      page.getByText(/Encounter Complete/i),
      page.getByText(/Mission Complete/i),
      page.getByText(/Campaign Complete/i),
      page.getByText(/All characters reached the exit/i)
    ];
    
    let encounterCompleted = false;
    for (const indicator of completionIndicators) {
      const visible = await indicator.isVisible().catch(() => false);
      if (visible) {
        encounterCompleted = true;
        break;
      }
    }
    
    // If no message, check if grid is gone (encounter ended)
    if (!encounterCompleted) {
      const gridVisible = await encounter.getTile(0, 0).isVisible().catch(() => false);
      encounterCompleted = !gridVisible; // Grid gone = encounter completed
    }
    
    // This test verifies that win condition check runs when characters are in exit zone
    // If it fails, it means the win condition check isn't being triggered
    expect(encounterCompleted).toBe(true);
  });
});

