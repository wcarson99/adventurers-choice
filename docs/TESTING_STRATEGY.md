# Automated Testing Strategy for React Game Development

## Executive Summary

This document outlines a comprehensive automated testing strategy for the Adventurer's Choice game, focusing on reliable E2E testing of React-based game mechanics using Playwright.

## Current State Analysis

### Existing Infrastructure
- ✅ Playwright installed and configured
- ✅ Basic test structure in place
- ✅ Data attributes added to grid tiles (`data-tile-x`, `data-tile-y`, `data-testid`)
- ✅ Console logging for debugging

### Challenges Identified
1. **Cursor IDE Browser MCP Limitations**: 
   - Snapshot-based refs are unstable (change on React re-renders)
   - "Element not found" errors when clicking dynamic elements
   - Not suitable for reliable automated testing

2. **Testing Grid-Based Games**:
   - Need stable selectors for dynamic grid tiles
   - Character/entity positions change during gameplay
   - State-dependent interactions (movement phase vs skill phase)

## Recommended Solution: Playwright E2E Testing

### Why Playwright Over Cursor Browser MCP?

1. **Stable Selectors**: Uses CSS selectors, data attributes, and text content
2. **Auto-Waiting**: Automatically waits for elements to be actionable
3. **Reliable**: Designed specifically for E2E testing
4. **CI/CD Ready**: Can run in headless mode in CI pipelines
5. **Better Debugging**: Screenshots, traces, and video recording

### Testing Architecture

```
tests/
├── e2e/
│   ├── helpers/
│   │   ├── game-navigation.ts    # Navigate through game flow
│   │   ├── encounter-helpers.ts  # Encounter-specific helpers
│   │   └── assertions.ts         # Custom assertions
│   ├── encounters/
│   │   ├── movement-phase.spec.ts
│   │   ├── skill-phase.spec.ts
│   │   └── push-action.spec.ts   # Push action testing
│   └── integration/
│       └── full-game-flow.spec.ts
```

## Implementation Plan

### Phase 1: Test Infrastructure (Immediate)

1. **Create Test Helpers**
   - Navigation helpers (start game, accept mission)
   - Grid interaction helpers (click tile, select character)
   - State verification helpers

2. **Enhance Data Attributes**
   - Ensure all interactive elements have `data-testid`
   - Add semantic attributes for game entities

3. **Console Log Integration**
   - Keep debug logs for troubleshooting
   - Add test-specific logging that can be captured

### Phase 2: Core Game Flow Tests

1. **Character Creation Flow**
2. **Mission Acceptance**
3. **Movement Phase**
4. **Skill Phase**
5. **Push Action Flow** (Priority)

### Phase 3: Advanced Testing

1. **State Management Tests**
2. **Edge Cases** (overlapping moves, invalid actions)
3. **Performance Tests**
4. **Visual Regression Tests** (optional)

## Best Practices

### Selector Strategy

**✅ DO:**
- Use `data-testid` for test-specific elements
- Use `data-tile-x` and `data-tile-y` for grid tiles
- Use role-based selectors (`getByRole`, `getByText`)
- Combine selectors for specificity

**❌ DON'T:**
- Rely on CSS classes that might change
- Use XPath (less maintainable)
- Use snapshot refs (unstable)

### Waiting Strategy

**✅ DO:**
- Use Playwright's auto-waiting (built-in)
- Use `waitForSelector` for dynamic content
- Use `waitForFunction` for state changes
- Wait for network requests if needed

**❌ DON'T:**
- Use fixed `setTimeout` delays
- Assume elements are immediately available

### Test Organization

1. **Arrange-Act-Assert Pattern**
2. **Page Object Model** (for complex flows)
3. **Test Fixtures** (for common setup)
4. **Parallel Execution** (where possible)

## Running Tests

### Local Development
```bash
# Run all tests
npm run test:e2e

# Run with UI (recommended for debugging)
npm run test:e2e:ui

# Run in headed mode (see browser)
npm run test:e2e:headed

# Run specific test file
npx playwright test tests/e2e/encounters/push-action.spec.ts
```

### CI/CD Integration
- Tests run automatically on PR
- Headless mode for speed
- Screenshots on failure
- Trace files for debugging

## Debugging Workflow

1. **Run test with UI**: `npm run test:e2e:ui`
2. **Use Playwright Inspector**: Step through test execution
3. **Check console logs**: Our debug logs will appear
4. **View screenshots**: Automatic on failure
5. **Examine traces**: Full execution replay

## Next Steps

1. ✅ Create test helpers for game navigation
2. ✅ Create push action test
3. ✅ Verify data attributes are in place
4. ✅ Run initial test suite
5. ⏳ Expand test coverage
6. ⏳ Integrate into CI/CD

