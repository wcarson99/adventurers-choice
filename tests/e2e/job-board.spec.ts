import { test, expect } from '@playwright/test';
import { GameNavigation } from './helpers/game-navigation';

test.describe('Job Board', () => {
  // Capture console errors
  test.beforeEach(async ({ page }) => {
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.error('Browser console error:', msg.text());
      }
    });
    page.on('pageerror', error => {
      console.error('Page error:', error.message);
    });
  });

  test('displays missions with encounter types and stat requirements', async ({ page }) => {
    test.setTimeout(30000); // 30 second timeout for this test
    
    const nav = new GameNavigation(page);
    
    // Navigate to job board
    await nav.startNewGame();
    await nav.embarkToTown();
    await page.getByRole('button', { name: 'Job Board' }).click();
    
    // Wait for job board to load with explicit timeout
    await page.waitForSelector('[data-testid="missions-list"]', { timeout: 5000 });
    
    // Verify missions list container exists and is visible
    const missionsList = page.locator('[data-testid="missions-list"]');
    await expect(missionsList).toBeVisible();
    
    // Check that mission cards exist
    await expect(page.locator('[data-testid="mission-m1"]')).toBeVisible({ timeout: 3000 });
    await expect(page.locator('[data-testid="mission-m2"]')).toBeVisible({ timeout: 3000 });
    await expect(page.locator('[data-testid="mission-m3"]')).toBeVisible({ timeout: 3000 });
    
    // Check that mission names are visible
    await expect(page.getByTestId('mission-title-m1')).toHaveText('Clear the Goblin Cave');
    await expect(page.getByTestId('mission-title-m2')).toHaveText('Rescue the Caravan');
    await expect(page.getByTestId('mission-title-m3')).toHaveText('Explore Ancient Ruins');
    
    // Check that encounter types are displayed
    await expect(page.getByTestId('mission-type-m1')).toHaveText('Combat');
    await expect(page.getByTestId('mission-type-m2')).toHaveText('Trading');
    await expect(page.getByTestId('mission-type-m3')).toHaveText('Obstacle');
    
    // Check that stat requirements are displayed (as badges)
    // Combat mission (m1) should have PWR 3+, MOV 2+
    await expect(page.getByTestId('mission-stats-m1').getByTestId('stat-badge-pwr-3')).toBeVisible({ timeout: 3000 });
    await expect(page.getByTestId('mission-stats-m1').getByTestId('stat-badge-mov-2')).toBeVisible({ timeout: 3000 });
    
    // Trading mission (m2) should have INF 3+, CRE 2+
    await expect(page.getByTestId('mission-stats-m2').getByTestId('stat-badge-inf-3')).toBeVisible({ timeout: 3000 });
    await expect(page.getByTestId('mission-stats-m2').getByTestId('stat-badge-cre-2')).toBeVisible({ timeout: 3000 });
    
    // Obstacle mission (m3) should have CRE 3+, MOV 2+
    await expect(page.getByTestId('mission-stats-m3').getByTestId('stat-badge-cre-3')).toBeVisible({ timeout: 3000 });
    await expect(page.getByTestId('mission-stats-m3').getByTestId('stat-badge-mov-2')).toBeVisible({ timeout: 3000 });
    
    // Verify no console errors occurred
    const errors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });
    // Re-check after a brief wait to catch any delayed errors
    await page.waitForTimeout(500);
    expect(errors).toHaveLength(0);
  });
  
  test('mission data structure is correct', async ({ page }) => {
    test.setTimeout(20000);
    
    const nav = new GameNavigation(page);
    
    await nav.startNewGame();
    await nav.embarkToTown();
    await page.getByRole('button', { name: 'Job Board' }).click();
    
    await page.waitForSelector('[data-testid="missions-list"]', { timeout: 5000 });
    
    // Verify mission data structure by checking the rendered content
    // This ensures the encounterType field is properly included
    const mission1 = page.locator('[data-testid="mission-m1"]');
    await expect(mission1).toBeVisible();
    
    // Verify all required fields are present
    await expect(mission1.getByTestId('mission-title-m1')).toBeVisible();
    await expect(mission1.getByTestId('mission-type-m1')).toBeVisible();
    await expect(mission1.getByTestId('mission-stats-m1')).toBeVisible();
    
    // Verify encounter type is one of the expected values
    const encounterType = await mission1.getByTestId('mission-type-m1').textContent();
    expect(['Combat', 'Trading', 'Obstacle']).toContain(encounterType);
    
    // Verify stat badges are present
    const statBadges = mission1.getByTestId('mission-stats-m1').locator('[data-testid^="stat-badge-"]');
    const badgeCount = await statBadges.count();
    expect(badgeCount).toBeGreaterThan(0);
  });

  test('job board is scrollable', async ({ page }) => {
    test.setTimeout(30000); // 30 second timeout for this test
    
    const nav = new GameNavigation(page);
    
    await nav.startNewGame();
    await nav.embarkToTown();
    await page.getByRole('button', { name: 'Job Board' }).click();
    
    await page.waitForSelector('[data-testid="missions-list"]', { timeout: 5000 });
    
    // Check that the missions container is scrollable using test ID
    const missionsContainer = page.locator('[data-testid="missions-list"]');
    const isScrollable = await missionsContainer.evaluate((el) => {
      return el.scrollHeight > el.clientHeight;
    });
    
    // Should be scrollable if there are multiple missions
    expect(isScrollable).toBe(true);
    
    // Verify we can actually scroll
    const initialScrollTop = await missionsContainer.evaluate((el) => el.scrollTop);
    await missionsContainer.evaluate((el) => {
      el.scrollTop = 100;
    });
    const scrolledTop = await missionsContainer.evaluate((el) => el.scrollTop);
    expect(scrolledTop).toBeGreaterThan(initialScrollTop);
  });
});




