import { Page } from '@playwright/test';

/**
 * Helper functions for navigating through the game flow
 */
export class GameNavigation {
  constructor(private page: Page) {}

  /**
   * Start a new game from the splash screen
   */
  async startNewGame(): Promise<void> {
    await this.page.goto('/');
    await this.page.getByRole('button', { name: 'New Game' }).click();
    // Wait for character creation screen
    await this.page.waitForSelector('text=Assemble Your Party');
  }

  /**
   * Complete character creation and embark to town
   */
  async embarkToTown(): Promise<void> {
    // Click "Embark to Town" button
    await this.page.getByRole('button', { name: /Embark to Town/i }).click();
    // Wait for town hub
    await this.page.waitForSelector('text=Riverside Village');
  }

  /**
   * Navigate to Job Board and accept first mission
   */
  async acceptMission(): Promise<void> {
    // Click Job Board
    await this.page.getByRole('button', { name: 'Job Board' }).click();
    // Wait for missions to load
    await this.page.waitForSelector('text=Available Mission');
    
    // Accept first mission
    const acceptButtons = this.page.getByRole('button', { name: /Accept Mission/i });
    await acceptButtons.first().click();
    
    // Wait for encounter view
    await this.page.waitForSelector('[data-testid^="tile-"]', { timeout: 5000 });
  }

  /**
   * Complete full navigation: New Game -> Town -> Accept Mission
   */
  async navigateToEncounter(): Promise<void> {
    await this.startNewGame();
    await this.embarkToTown();
    await this.acceptMission();
  }
}

