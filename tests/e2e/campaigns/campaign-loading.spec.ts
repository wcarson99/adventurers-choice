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

    // Step 2: Select push-test-campaign from dropdown
    const gameSelect = page.locator('select').first();
    await expect(gameSelect).toBeVisible();
    await gameSelect.selectOption('push-test-campaign');

    // Step 3: Verify campaign description is shown
    await expect(page.getByText(/Test campaign for push mechanics/i)).toBeVisible();

    // Step 4: Click New Game button
    const newGameButton = page.getByRole('button', { name: 'New Game' });
    await expect(newGameButton).toBeEnabled();
    await newGameButton.click();

    // Step 5: Should go to character creation screen first
    await expect(page.getByText(/Assemble Your Party/i)).toBeVisible({ timeout: 3000 });

    // Step 6: Verify campaign character (Hero 1 - Warrior) is pre-filled
    // Character names are in input fields, so check for the value
    const hero1Input = page.locator('input[type="text"]').first();
    await expect(hero1Input).toHaveValue(/Hero 1/i);
    
    // Check for Warrior archetype text
    await expect(page.getByText(/Warrior/i)).toBeVisible();

    // Step 7: Click "Embark to Town" button (which will start the campaign)
    const embarkButton = page.getByRole('button', { name: /Embark to Town/i });
    await embarkButton.click();

    // Step 8: Wait for encounter to load
    await page.waitForTimeout(2000);
    
    // Step 9: Verify we're in the encounter view (check for grid tiles)
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

  test('game selection dropdown shows Random and available campaigns', async ({ page }) => {
    // Step 1: Verify dropdown exists
    const gameSelect = page.locator('select').first();
    await expect(gameSelect).toBeVisible();

    // Step 2: Verify Random is the default option
    await expect(gameSelect).toHaveValue('random');

    // Step 3: Verify campaigns are listed
    const options = gameSelect.locator('option');
    const optionCount = await options.count();
    
    // Should have at least "Random" + campaigns
    expect(optionCount).toBeGreaterThan(1);

    // Step 4: Verify Random option exists
    const randomOption = gameSelect.locator('option[value="random"]');
    await expect(randomOption).toHaveCount(1);
    await expect(randomOption).toHaveText(/Random/i);
    
    // Step 5: Verify push-test-campaign is in the list
    const pushOption = gameSelect.locator('option[value="push-test-campaign"]');
    await expect(pushOption).toHaveCount(1);
    await expect(pushOption).toHaveText(/Push Test Campaign/i);
    
    // Step 6: Verify movement-test-campaign is in the list
    const movementOption = gameSelect.locator('option[value="movement-test-campaign"]');
    await expect(movementOption).toHaveCount(1);
    await expect(movementOption).toHaveText(/Movement Test Campaign/i);
  });

  test('Random mode is default and works', async ({ page }) => {
    // Step 1: Verify Random is selected by default
    const gameSelect = page.locator('select').first();
    await expect(gameSelect).toHaveValue('random');

    // Step 2: Click New Game should go to character creation
    const newGameButton = page.getByRole('button', { name: 'New Game' });
    await newGameButton.click();

    // Step 3: Verify we're on character creation screen
    await expect(page.getByText(/Assemble Your Party/i)).toBeVisible({ timeout: 3000 });

    // Step 4: Verify default characters are shown (not campaign characters)
    await expect(page.getByText(/Warrior/i)).toBeVisible();
    await expect(page.getByText(/Thief/i)).toBeVisible();
    await expect(page.getByText(/Paladin/i)).toBeVisible();
    await expect(page.getByText(/Cleric/i)).toBeVisible();
  });
});

