import { Page, Locator } from '@playwright/test';

/**
 * Helper functions for encounter/grid interactions
 */
export class EncounterHelpers {
  constructor(private page: Page) {}

  /**
   * Click a grid tile by coordinates
   */
  async clickTile(x: number, y: number): Promise<void> {
    const tile = this.page.locator(`[data-tile-x="${x}"][data-tile-y="${y}"]`);
    await tile.click();
  }

  /**
   * Get a tile locator by coordinates
   */
  getTile(x: number, y: number): Locator {
    return this.page.locator(`[data-tile-x="${x}"][data-tile-y="${y}"]`);
  }

  /**
   * Check if a tile contains an entity (character or object)
   */
  async hasEntity(x: number, y: number): Promise<boolean> {
    const tile = this.getTile(x, y);
    const entity = tile.locator('[data-entity-id]');
    return await entity.count() > 0;
  }

  /**
   * Get entity ID at a specific tile (if any)
   */
  async getEntityAtTile(x: number, y: number): Promise<number | null> {
    const tile = this.getTile(x, y);
    const entity = tile.locator('[data-entity-id]');
    const count = await entity.count();
    if (count > 0) {
      const entityId = await entity.first().getAttribute('data-entity-id');
      return entityId ? parseInt(entityId, 10) : null;
    }
    return null;
  }

  /**
   * Click "Plan Skills" button
   */
  async clickPlanSkills(): Promise<void> {
    await this.page.getByRole('button', { name: /Plan Skill/i }).click();
    // Wait for skill phase (button text changes or phase indicator)
    await this.page.waitForTimeout(500); // Brief wait for state update
  }

  /**
   * Click "Execute" button
   */
  async clickExecute(): Promise<void> {
    await this.page.getByRole('button', { name: 'Execute' }).click();
  }

  /**
   * Click "Back" button (in skill phase)
   */
  async clickBack(): Promise<void> {
    await this.page.getByRole('button', { name: 'Back' }).click();
  }

  /**
   * Get console logs (for debugging)
   */
  async getConsoleLogs(): Promise<string[]> {
    const logs: string[] = [];
    this.page.on('console', msg => {
      logs.push(`[${msg.type()}] ${msg.text()}`);
    });
    return logs;
  }

  /**
   * Wait for a specific console log message
   */
  async waitForConsoleMessage(pattern: string | RegExp, timeout = 5000): Promise<void> {
    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        this.page.off('console', handler);
        reject(new Error(`Timeout waiting for console message: ${pattern}`));
      }, timeout);

      const handler = (msg: any) => {
        const text = msg.text();
        const matches = typeof pattern === 'string' 
          ? text.includes(pattern)
          : pattern.test(text);
        if (matches) {
          clearTimeout(timeoutId);
          this.page.off('console', handler);
          resolve();
        }
      };

      this.page.on('console', handler);
    });
  }
}

