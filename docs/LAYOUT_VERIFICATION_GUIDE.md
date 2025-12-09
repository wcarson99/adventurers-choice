# Layout Verification Guide: Without Browser Tools

## The Problem

Without browser tools for manual inspection, how do you verify that layouts are correct? This has been a recurring issue in the past.

## The Solution: Playwright Visual Testing

Playwright provides powerful visual testing capabilities that are **better** than manual browser inspection for layout verification:

1. **Screenshots** - Capture and compare visual state
2. **Visual Regression Testing** - Compare screenshots against baselines
3. **Element Position/Size Assertions** - Verify exact dimensions and positions
4. **Layout Assertions** - Check CSS properties, computed styles
5. **Automated Screenshots on Failure** - Already configured in tests

## Methods for Layout Verification

### 1. Screenshot-Based Verification (Recommended)

**What it does**: Takes screenshots that you can manually review or use for visual regression testing.

**How to use**:
```typescript
// In your Playwright test
await page.screenshot({ 
  path: 'test-results/layout-check.png', 
  fullPage: true 
});

// Or screenshot a specific element
const grid = page.locator('[data-testid="encounter-grid"]');
await grid.screenshot({ path: 'test-results/grid-layout.png' });
```

**When to use**:
- Quick visual verification after layout changes
- Debugging layout issues
- Creating visual documentation
- Visual regression testing (compare against baseline)

**Already in use**: `tests/e2e/encounters/push-action.spec.ts` already takes screenshots on failure.

### 2. Element Position & Size Assertions

**What it does**: Verifies exact pixel positions and dimensions of elements.

**How to use**:
```typescript
// Verify element position
const grid = page.locator('[data-testid="encounter-grid"]');
const boundingBox = await grid.boundingBox();
expect(boundingBox?.x).toBe(0); // Left position
expect(boundingBox?.y).toBe(0); // Top position
expect(boundingBox?.width).toBe(800); // Width
expect(boundingBox?.height).toBe(800); // Height

// Verify tile size
const tile = page.locator('[data-tile-x="0"][data-tile-y="0"]');
const tileBox = await tile.boundingBox();
expect(tileBox?.width).toBe(76); // Expected tile size
expect(tileBox?.height).toBe(76);
```

**When to use**:
- Verify fixed dimensions (like the 800px grid, 480px panel)
- Check tile sizes are correct
- Ensure elements don't overflow
- Verify responsive behavior

### 3. CSS Property Assertions

**What it does**: Checks computed CSS properties to verify styling.

**How to use**:
```typescript
// Check computed styles
const grid = page.locator('[data-testid="encounter-grid"]');
const display = await grid.evaluate(el => window.getComputedStyle(el).display);
expect(display).toBe('flex');

// Check specific CSS properties
const width = await grid.evaluate(el => window.getComputedStyle(el).width);
expect(width).toBe('800px');
```

**When to use**:
- Verify flexbox/grid layouts
- Check colors, borders, spacing
- Ensure CSS classes are applied correctly

### 4. Visual Regression Testing (Advanced)

**What it does**: Compares screenshots against baseline images to detect visual changes.

**How to use**:
```typescript
// Playwright has built-in visual comparison
await expect(page).toHaveScreenshot('encounter-layout.png');
```

**When to use**:
- Prevent layout regressions
- Verify UI consistency
- Catch unintended visual changes

### 5. Layout Test Helpers

**Create reusable helpers** for common layout checks:

```typescript
// tests/e2e/helpers/layout-helpers.ts
export class LayoutHelpers {
  constructor(private page: Page) {}

  async verifyEncounterLayout() {
    // Verify grid is 800x800
    const grid = this.page.locator('[data-testid="encounter-grid"]');
    const gridBox = await grid.boundingBox();
    expect(gridBox?.width).toBe(800);
    expect(gridBox?.height).toBe(800);

    // Verify info panel is 480px wide
    const panel = this.page.locator('[data-testid="info-panel"]');
    const panelBox = await panel.boundingBox();
    expect(panelBox?.width).toBe(480);

    // Verify total width is 1280px
    const container = this.page.locator('[data-testid="encounter-container"]');
    const containerBox = await container.boundingBox();
    expect(containerBox?.width).toBe(1280);
  }

  async verifyTileSize(expectedSize: number = 76) {
    const tile = this.page.locator('[data-tile-x="0"][data-tile-y="0"]');
    const tileBox = await tile.boundingBox();
    expect(tileBox?.width).toBe(expectedSize);
    expect(tileBox?.height).toBe(expectedSize);
  }

  async takeLayoutScreenshot(name: string) {
    await this.page.screenshot({ 
      path: `test-results/layout-${name}.png`,
      fullPage: true 
    });
  }
}
```

## Current Layout Specifications

Based on `EncounterView.tsx`, the layout should be:

- **Total Container**: 1280px × 800px
- **Grid Section**: 800px × 800px (left side)
  - Tile size: 76px × 76px
  - Grid: 10×10 tiles
  - Padding: 8px
  - Gap: 2px
- **Info Panel**: 480px × 800px (right side)

## Recommended Workflow

### For New Layout Features

1. **Write layout test first** (TDD approach):
   ```typescript
   test('encounter layout has correct dimensions', async ({ page }) => {
     await navigation.navigateToEncounter();
     await layoutHelpers.verifyEncounterLayout();
   });
   ```

2. **Take screenshot** for visual verification:
   ```typescript
   await layoutHelpers.takeLayoutScreenshot('encounter-initial');
   ```

3. **Run test in headed mode** to see it visually:
   ```bash
   npm run test:e2e:headed -- tests/e2e/layout/encounter-layout.spec.ts
   ```

4. **Check screenshot** in `test-results/` folder

### For Debugging Layout Issues

1. **Run test** that's failing
2. **Check auto-generated screenshot** (Playwright creates these on failure)
3. **Add explicit screenshot** in test for debugging:
   ```typescript
   await page.screenshot({ path: 'test-results/debug-layout.png' });
   ```
4. **Use Playwright Inspector** (`npm run test:e2e:ui`) to step through and see layout at each step
5. **Add layout assertions** to catch the issue programmatically

## Playwright UI Mode: The Best of Both Worlds

**Use Playwright's UI mode** for interactive debugging:

```bash
npm run test:e2e:ui
```

This gives you:
- ✅ Visual browser window (like browser tools)
- ✅ Step-through debugging
- ✅ Time travel debugging
- ✅ Element inspector
- ✅ Network/console logs
- ✅ **Stable selectors** (not snapshot refs)
- ✅ **Reliable automation** (not manual clicking)

**This is better than browser tools** because:
- Uses stable CSS selectors instead of snapshot refs
- Can pause and inspect at any point
- Can replay test execution
- Works reliably with React re-renders

## Example: Complete Layout Test

```typescript
import { test, expect } from '@playwright/test';
import { GameNavigation } from '../helpers/game-navigation';
import { LayoutHelpers } from '../helpers/layout-helpers';

test.describe('Encounter Layout', () => {
  let navigation: GameNavigation;
  let layout: LayoutHelpers;

  test.beforeEach(async ({ page }) => {
    navigation = new GameNavigation(page);
    layout = new LayoutHelpers(page);
    await navigation.navigateToEncounter();
  });

  test('has correct dimensions', async ({ page }) => {
    // Verify main container
    const container = page.locator('[data-testid="encounter-container"]');
    const containerBox = await container.boundingBox();
    expect(containerBox?.width).toBe(1280);
    expect(containerBox?.height).toBe(800);

    // Verify grid section
    const grid = page.locator('[data-testid="encounter-grid"]');
    const gridBox = await grid.boundingBox();
    expect(gridBox?.width).toBe(800);
    expect(gridBox?.height).toBe(800);

    // Verify info panel
    const panel = page.locator('[data-testid="info-panel"]');
    const panelBox = await panel.boundingBox();
    expect(panelBox?.width).toBe(480);
    expect(panelBox?.height).toBe(800);
  });

  test('tiles have correct size', async ({ page }) => {
    const tile = page.locator('[data-tile-x="0"][data-tile-y="0"]');
    const tileBox = await tile.boundingBox();
    expect(tileBox?.width).toBe(76);
    expect(tileBox?.height).toBe(76);
  });

  test('layout screenshot matches baseline', async ({ page }) => {
    // First run: creates baseline
    // Subsequent runs: compares against baseline
    await expect(page).toHaveScreenshot('encounter-layout.png');
  });
});
```

## Adding Data Attributes for Layout Testing

To make layout testing easier, add `data-testid` attributes to key layout elements:

```tsx
// In EncounterView.tsx
<div 
  data-testid="encounter-container"
  style={{ display: 'flex', height: '800px', width: '1280px' }}
>
  <div data-testid="encounter-grid" style={{ width: '800px', height: '800px' }}>
    {/* Grid content */}
  </div>
  <div data-testid="info-panel" style={{ width: '480px', height: '800px' }}>
    {/* Info panel content */}
  </div>
</div>
```

## Summary

**You don't need browser tools for layout verification!** Use:

1. ✅ **Playwright screenshots** - Visual verification
2. ✅ **Element position/size assertions** - Programmatic verification
3. ✅ **Playwright UI mode** - Interactive debugging (better than browser tools)
4. ✅ **Visual regression testing** - Prevent layout regressions
5. ✅ **Layout test helpers** - Reusable layout checks

**Playwright UI mode** (`npm run test:e2e:ui`) gives you everything browser tools do, but with:
- Stable selectors (not snapshot refs)
- Reliable automation
- Better debugging tools
- CI/CD compatibility

This is actually **better** than browser tools for layout verification!

