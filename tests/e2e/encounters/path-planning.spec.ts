import { test, expect } from '@playwright/test';
import { EncounterHelpers } from '../helpers/encounter-helpers';

test.describe('Path Planning System', () => {
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
    
    // Wait for encounter grid to appear (with reasonable timeout)
    await encounter.getTile(0, 0).waitFor({ state: 'visible', timeout: 15000 });
  });

  test('character does not move immediately when clicking tiles in planning mode', async ({ page }) => {
    // This is the core behavior change: characters should NOT move immediately
    // They should enter planning mode and build a path
    
    // Step 1: Select character at (0,1)
    await encounter.clickTile(0, 1);
    await page.waitForTimeout(500);
    
    // Step 2: Click a valid move tile (1,1) - character should NOT move yet
    await encounter.clickTile(1, 1);
    await page.waitForTimeout(500);
    
    // Step 3: Verify character is STILL at starting position (0,1)
    // This is the key assertion - with current code, character would have moved
    const entityAtStart = await encounter.getEntityAtTile(0, 1);
    expect(entityAtStart).not.toBeNull();
    
    // Step 4: Verify character is NOT at clicked position (1,1) yet
    const entityAtTarget = await encounter.getEntityAtTile(1, 1);
    expect(entityAtTarget).toBeNull();
  });

  test('execute free moves button appears when path is planned', async ({ page }) => {
    // Step 1: Select character and add a step to path
    await encounter.clickTile(0, 1);
    await page.waitForTimeout(500);
    await encounter.clickTile(1, 1);
    await page.waitForTimeout(500);
    
    // Step 2: Look for "Execute Free Moves" button
    // This button should appear when at least one character has a planned path
    const executeButton = page.getByRole('button', { name: /Execute Free Moves/i });
    
    // This will fail initially because the button doesn't exist yet
    await expect(executeButton).toBeVisible({ timeout: 2000 });
  });
});
