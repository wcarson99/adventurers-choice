import { test, expect } from '@playwright/test';
import { EncounterHelpers } from '../helpers/encounter-helpers';

test.describe('Campaign Loading', () => {
  let encounter: EncounterHelpers;

  test.beforeEach(async ({ page }) => {
    encounter = new EncounterHelpers(page);
    await page.goto('/');
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

});

