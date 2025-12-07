import { test, expect } from '@playwright/test';
import { EncounterHelpers } from '../helpers/encounter-helpers';

test.describe('Campaign Loading', () => {
  let encounter: EncounterHelpers;

  test.beforeEach(async ({ page }) => {
    encounter = new EncounterHelpers(page);
    await page.goto('/');
  });

  test('can see first encounter when loading push-test-campaign', async ({ page }) => {
    // Step 1: Verify we're on splash screen
    await expect(page.getByRole('heading', { name: /Adventurer's Choice/i })).toBeVisible();

    // Step 2: Select Campaign mode
    const gameModeSelect = page.locator('select').first();
    await expect(gameModeSelect).toBeVisible();
    await gameModeSelect.selectOption('campaign');

    // Step 3: Wait for campaign dropdown to appear and select push-test-campaign
    const campaignSelect = page.locator('select').nth(1);
    await expect(campaignSelect).toBeVisible({ timeout: 3000 });
    await campaignSelect.selectOption('push-test-campaign');

    // Step 4: Verify campaign description is shown
    await expect(page.getByText(/Test campaign for push mechanics/i)).toBeVisible();

    // Step 5: Click New Game button
    const newGameButton = page.getByRole('button', { name: 'New Game' });
    await expect(newGameButton).toBeEnabled();
    
    // Listen for console messages (errors and logs)
    const consoleMessages: Array<{ type: string; text: string }> = [];
    page.on('console', msg => {
      consoleMessages.push({ type: msg.type(), text: msg.text() });
      if (msg.type() === 'error') {
        console.log(`[CONSOLE ERROR] ${msg.text()}`);
      }
    });
    
    // Listen for page errors
    page.on('pageerror', error => {
      console.log(`[PAGE ERROR] ${error.message}`);
    });
    
    await newGameButton.click();

    // Step 6: Wait for encounter to load
    // Check if we're still on splash or if we've moved to mission view
    await page.waitForTimeout(2000);
    
    // Log all console messages for debugging
    console.log('Console messages:', consoleMessages);
    
    // Check what view we're on
    const currentView = await page.evaluate(() => {
      // Try to find any indication of what view we're on
      const splashHeading = document.querySelector('h1');
      const encounterGrid = document.querySelector('[data-tile-x]');
      const characterCreation = Array.from(document.querySelectorAll('*')).find(el => 
        el.textContent?.includes('Assemble Your Party')
      );
      return {
        hasSplash: !!splashHeading?.textContent?.includes('Adventurer'),
        hasGrid: !!encounterGrid,
        hasCharacterCreation: !!characterCreation,
        bodyText: document.body.innerText.substring(0, 300)
      };
    });
    console.log('Current view state:', currentView);
    
    // Try to find grid tiles - they should appear after campaign loads
    await expect(encounter.getTile(0, 0)).toBeVisible({ timeout: 10000 });

    // Step 7: Verify we're in the encounter view (not splash screen)
    await expect(page.getByRole('heading', { name: /Adventurer's Choice/i })).not.toBeVisible();

    // Step 8: Verify campaign title is displayed
    await expect(page.getByText(/Push Test Campaign/i)).toBeVisible();

    // Step 9: Verify encounter name is displayed
    await expect(page.getByText(/Push Test Encounter/i)).toBeVisible();

    // Step 10: Verify encounter progress indicator
    await expect(page.getByText(/Encounter 1 of 1/i)).toBeVisible();

    // Step 11: Verify Warrior character is present at (0, 1)
    const warriorTile = encounter.getTile(0, 1);
    await expect(warriorTile).toBeVisible();
    const warriorEntity = warriorTile.locator('[data-entity-id]');
    await expect(warriorEntity).toHaveCount(1);

    // Step 12: Verify crate is present at (2, 1)
    const crateTile = encounter.getTile(2, 1);
    await expect(crateTile).toBeVisible();
    const crateEntity = crateTile.locator('[data-entity-id]');
    await expect(crateEntity).toHaveCount(1);

    // Step 13: Verify grid is 10x10 (check a few tiles)
    await expect(encounter.getTile(0, 0)).toBeVisible();
    await expect(encounter.getTile(9, 9)).toBeVisible();
    await expect(encounter.getTile(5, 5)).toBeVisible();
  });

  test('campaign mode dropdown shows available campaigns', async ({ page }) => {
    // Step 1: Select Campaign mode
    const gameModeSelect = page.locator('select').first();
    await gameModeSelect.selectOption('campaign');

    // Step 2: Wait for campaign dropdown
    const campaignSelect = page.locator('select').nth(1);
    await expect(campaignSelect).toBeVisible({ timeout: 3000 });

    // Step 3: Verify campaigns are listed
    const options = campaignSelect.locator('option');
    const optionCount = await options.count();
    
    // Should have at least "-- Select Campaign --" + campaigns
    expect(optionCount).toBeGreaterThan(1);

    // Step 4: Verify push-test-campaign is in the list (options are hidden in select, so check count)
    const pushOption = campaignSelect.locator('option[value="push-test-campaign"]');
    await expect(pushOption).toHaveCount(1);
    await expect(pushOption).toHaveText(/Push Test Campaign/i);
    
    // Step 5: Verify movement-test-campaign is in the list
    const movementOption = campaignSelect.locator('option[value="movement-test-campaign"]');
    await expect(movementOption).toHaveCount(1);
    await expect(movementOption).toHaveText(/Movement Test Campaign/i);
  });

  test('roguelike mode is default and works', async ({ page }) => {
    // Step 1: Verify roguelike is selected by default
    const gameModeSelect = page.locator('select').first();
    await expect(gameModeSelect).toHaveValue('roguelike');

    // Step 2: Verify campaign dropdown is not visible
    const campaignSelect = page.locator('select').nth(1);
    await expect(campaignSelect).not.toBeVisible();

    // Step 3: Click New Game should go to character creation
    const newGameButton = page.getByRole('button', { name: 'New Game' });
    await newGameButton.click();

    // Step 4: Verify we're on character creation screen
    await expect(page.getByText(/Assemble Your Party/i)).toBeVisible({ timeout: 3000 });
  });
});

