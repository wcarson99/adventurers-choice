import { test, expect } from '@playwright/test';
import { ScenarioHelpers } from '../helpers/scenario-helpers';

test.describe('Path Planning System', () => {
  let scenario: ScenarioHelpers;

  test.beforeEach(async ({ page }) => {
    scenario = new ScenarioHelpers(page);
    
    // Navigate to splash screen
    await page.goto('/', { waitUntil: 'networkidle' });
    
    // Wait for select dropdown with timeout
    const gameSelect = page.locator('select').first();
    await gameSelect.waitFor({ state: 'visible', timeout: 10000 });
    
    // Select movement-test-job
    await gameSelect.selectOption('movement-test-job');
    
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
    await scenario.getTile(0, 0).waitFor({ state: 'visible', timeout: 15000 });
  });

  test('character does not move immediately when clicking tiles in planning mode', async ({ page }) => {
    // Step 1: Select character at (0,1)
    await scenario.clickTile(0, 1);
    await page.waitForTimeout(500);
    
    // Step 2: Click a valid move tile (1,1) - character should NOT move yet
    await scenario.clickTile(1, 1);
    await page.waitForTimeout(500);
    
    // Step 3: Verify character is STILL at starting position (0,1)
    const entityAtStart = await scenario.getEntityAtTile(0, 1);
    expect(entityAtStart).not.toBeNull();
    
    // Step 4: Verify character is NOT at clicked position (1,1) yet
    const entityAtTarget = await scenario.getEntityAtTile(1, 1);
    expect(entityAtTarget).toBeNull();
  });

  test('execute free moves button appears when path is planned', async ({ page }) => {
    // Step 1: Select character and add a step to path
    await scenario.clickTile(0, 1);
    await page.waitForTimeout(500);
    await scenario.clickTile(1, 1);
    await page.waitForTimeout(500);
    
    // Step 2: Look for "Execute Free Moves" button
    const executeButton = page.getByRole('button', { name: /Execute Free Moves/i });
    await expect(executeButton).toBeVisible({ timeout: 2000 });
  });

  test('conflict detection: button disabled when both characters plan to same square', async ({ page }) => {
    // Warrior starts at (0,1), Thief starts at (0,2)
    // Both will plan to move to (1,1) - same square (conflict)
    
    // Step 1: Plan warrior to move to (1,1)
    await scenario.clickTile(0, 1); // Select warrior
    await page.waitForTimeout(300);
    await scenario.clickTile(1, 1); // Plan move to (1,1)
    await page.waitForTimeout(300);
    
    // Step 2: Deselect warrior by clicking warrior again (Option 1)
    await scenario.clickTile(0, 1); // Click warrior again to deselect
    await page.waitForTimeout(300);
    
    // Step 3: Plan thief to move to (1,1) - same square as warrior's next step
    // This should be allowed (no blocking), but button should be disabled
    await scenario.clickTile(0, 2); // Select thief
    await page.waitForTimeout(300);
    await scenario.clickTile(1, 1); // Plan move to (1,1) - CONFLICT!
    await page.waitForTimeout(300);
    
    // Step 4: Verify Execute Free Moves button is disabled
    // (Because next steps conflict - both trying to move to (1,1))
    const executeButton = page.getByRole('button', { name: /Execute Free Moves/i });
    await expect(executeButton).toBeVisible({ timeout: 2000 });
    const isDisabled = await executeButton.isDisabled();
    expect(isDisabled).toBe(true);
    
    // Step 5: Fix conflict - update warrior's path to (1,2) instead
    // First, clear all to start fresh
    const clearButton = page.getByRole('button', { name: /Clear All Movements/i });
    await clearButton.click();
    await page.waitForTimeout(300);
    
    // Replan: warrior to (1,2), thief to (1,1) - no conflict
    await scenario.clickTile(0, 1); // Select warrior
    await page.waitForTimeout(300);
    await scenario.clickTile(1, 2); // Plan warrior to (1,2)
    await page.waitForTimeout(300);
    
    await scenario.clickTile(0, 1); // Deselect warrior
    await page.waitForTimeout(300);
    
    await scenario.clickTile(0, 2); // Select thief
    await page.waitForTimeout(300);
    await scenario.clickTile(1, 1); // Plan thief to (1,1)
    await page.waitForTimeout(300);
    
    // Step 6: Verify Execute Free Moves is now enabled
    // (No conflict - warrior going to (1,2), thief going to (1,1))
    const executeButton2 = page.getByRole('button', { name: /Execute Free Moves/i });
    await expect(executeButton2).toBeVisible({ timeout: 2000 });
    const isDisabled2 = await executeButton2.isDisabled();
    expect(isDisabled2).toBe(false);
  });

  test('execute free moves moves all characters simultaneously', async ({ page }) => {
    // Step 1: Plan warrior to move right to (1,1)
    await scenario.clickTile(0, 1); // Select warrior
    await page.waitForTimeout(300);
    await scenario.clickTile(1, 1); // Plan move right
    await page.waitForTimeout(300);
    
    // Step 2: Deselect warrior by clicking warrior again (Option 1)
    await scenario.clickTile(0, 1); // Click warrior again to deselect
    await page.waitForTimeout(300);
    
    // Step 3: Plan thief to move right to (1,2)
    await scenario.clickTile(0, 2); // Select thief
    await page.waitForTimeout(300);
    await scenario.clickTile(1, 2); // Plan move right
    await page.waitForTimeout(300);
    
    // Step 4: Click Execute Free Moves
    const executeButton = page.getByRole('button', { name: /Execute Free Moves/i });
    await expect(executeButton).toBeVisible({ timeout: 2000 });
    await executeButton.click();
    await page.waitForTimeout(500);
    
    // Step 5: Verify both characters moved
    const warriorAtNewPos = await scenario.getEntityAtTile(1, 1);
    const thiefAtNewPos = await scenario.getEntityAtTile(1, 2);
    
    expect(warriorAtNewPos).not.toBeNull();
    expect(thiefAtNewPos).not.toBeNull();
    
    // Step 6: Verify characters are no longer at starting positions
    const warriorAtStart = await scenario.getEntityAtTile(0, 1);
    const thiefAtStart = await scenario.getEntityAtTile(0, 2);
    
    expect(warriorAtStart).toBeNull();
    expect(thiefAtStart).toBeNull();
  });

  test('clear all movements resets paths and positions', async ({ page }) => {
    // Step 1: Plan movements for both characters
    await scenario.clickTile(0, 1); // Select warrior
    await page.waitForTimeout(300);
    await scenario.clickTile(1, 1); // Plan move
    await page.waitForTimeout(300);
    
    await scenario.clickTile(0, 1); // Deselect warrior
    await page.waitForTimeout(300);
    
    await scenario.clickTile(0, 2); // Select thief
    await page.waitForTimeout(300);
    await scenario.clickTile(1, 2); // Plan move
    await page.waitForTimeout(300);
    
    // Step 2: Click Clear All Movements
    const clearButton = page.getByRole('button', { name: /Clear All Movements/i });
    await clearButton.click();
    await page.waitForTimeout(500);
    
    // Step 3: Verify characters are back at starting positions
    const warriorAtStart = await scenario.getEntityAtTile(0, 1);
    const thiefAtStart = await scenario.getEntityAtTile(0, 2);
    
    expect(warriorAtStart).not.toBeNull();
    expect(thiefAtStart).not.toBeNull();
    
    // Step 4: Verify Execute Free Moves button is not visible (no paths planned)
    const executeButton = page.getByRole('button', { name: /Execute Free Moves/i });
    const isVisible = await executeButton.isVisible().catch(() => false);
    expect(isVisible).toBe(false);
    
    // Step 5: Plan new movements
    await scenario.clickTile(0, 1); // Select warrior
    await page.waitForTimeout(300);
    await scenario.clickTile(1, 1); // Plan move right
    await page.waitForTimeout(300);
    
    await scenario.clickTile(0, 1); // Deselect warrior
    await page.waitForTimeout(300);
    
    await scenario.clickTile(0, 2); // Select thief
    await page.waitForTimeout(300);
    await scenario.clickTile(1, 2); // Plan move right
    await page.waitForTimeout(300);
    
    // Step 6: Click Execute Free Moves
    const executeButton2 = page.getByRole('button', { name: /Execute Free Moves/i });
    await expect(executeButton2).toBeVisible({ timeout: 2000 });
    await executeButton2.click();
    await page.waitForTimeout(500);
    
    // Step 7: Verify both characters moved
    const warriorMoved = await scenario.getEntityAtTile(1, 1);
    const thiefMoved = await scenario.getEntityAtTile(1, 2);
    
    expect(warriorMoved).not.toBeNull();
    expect(thiefMoved).not.toBeNull();
  });

  test('button state updates after execution based on next step validity', async ({ page }) => {
    // Step 1: Plan warrior with 2 steps: (1,1) then (2,1)
    await scenario.clickTile(0, 1); // Select warrior
    await page.waitForTimeout(300);
    await scenario.clickTile(1, 1); // First step
    await page.waitForTimeout(300);
    await scenario.clickTile(2, 1); // Second step
    await page.waitForTimeout(300);
    
    // Step 2: Verify button is enabled (first step is valid)
    const executeButton = page.getByRole('button', { name: /Execute Free Moves/i });
    await expect(executeButton).toBeVisible({ timeout: 2000 });
    let isDisabled = await executeButton.isDisabled();
    expect(isDisabled).toBe(false);
    
    // Step 3: Execute first step
    await executeButton.click();
    await page.waitForTimeout(500);
    
    // Step 4: Verify button is still enabled (next step is still valid)
    isDisabled = await executeButton.isDisabled();
    expect(isDisabled).toBe(false);
    
    // Step 5: Execute second step
    await executeButton.click();
    await page.waitForTimeout(500);
    
    // Step 6: Verify button is disabled or not visible (no more steps)
    const isVisible = await executeButton.isVisible().catch(() => false);
    const isDisabledAfter = isVisible ? await executeButton.isDisabled() : true;
    expect(isDisabledAfter || !isVisible).toBe(true);
  });
});
