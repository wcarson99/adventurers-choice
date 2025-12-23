# The Adventurer's Choice

A cooperative party adventure game centered on collaborative, attribute-driven mini-games, emphasizing multiple viable paths to survival.

## Tech Stack

- **TypeScript** - Type-safe development
- **React** - UI framework
- **HTML5 Canvas** - Game board rendering
- **Vite** - Build tool and dev server
- **Playwright** - E2E testing
- **Vitest** - Unit testing (optional for MVP)

## Development

### Prerequisites

- **Node.js 18+** (check with `node --version`)
- **npm** (comes with Node.js)

### Setup (After Cloning)

**Option 1: Automated Setup (Recommended)**
```bash
npm run setup
```

This script will:
- Check Node.js version
- Install npm dependencies
- Install Playwright browsers
- Verify the build

**Option 2: Manual Setup**

1. **Install Node.js dependencies:**
   ```bash
   npm install
   ```

2. **Install Playwright browsers** (required for E2E tests):
   ```bash
   npx playwright install chromium
   ```

3. **Verify setup:**
   ```bash
   npm run build
   ```

### Development Workflow

**Start the development server:**
```bash
npm run dev
```

The app will be available at `http://localhost:5173`

**Run E2E tests:**
```bash
npm run test:e2e
```

**Run E2E tests with UI (interactive):**
```bash
npm run test:e2e:ui
```

**Run E2E tests in headed mode (see browser):**
```bash
npm run test:e2e:headed
```

**Run unit tests:**
```bash
npm run test:unit
```

**Build for production:**
```bash
npm run build
```

**Preview production build:**
```bash
npm run preview
```

### Clean & Reset

**Clean build artifacts** (keeps node_modules):
```bash
npm run clean
```

This removes:
- `dist/` and `dist-ssr/` (build output)
- `test-results/` and `playwright-report/` (test artifacts)
- `*.log` files (log files)

**Deep clean** (removes everything including node_modules):
```bash
npm run clean:all
```

**Full reset** (clean everything + reinstall):
```bash
npm run reset
```

This is equivalent to:
```bash
npm run clean:all
npm install
npm run setup
```

### CI/CD Setup

For continuous integration (GitHub Actions, GitLab CI, etc.), add these steps:

```yaml
# Example GitHub Actions workflow
- name: Install dependencies
  run: npm ci

- name: Install Playwright browsers
  run: npx playwright install --with-deps chromium

- name: Run tests
  run: npm run test:e2e

- name: Build
  run: npm run build
```

**Note:** In CI environments, use `npx playwright install --with-deps` to install system dependencies (like libraries required by Chromium) automatically.

## Project Structure

See `ARCHITECTURE.md` for detailed architecture documentation.

## Development Workflow

This project follows **Test-Driven Development (TDD)** with **Vertical Slicing**:

1. **RED**: Write a failing Playwright E2E test
2. **GREEN**: Write minimum code to pass the test
3. **REFACTOR**: Clean up and improve

See `BACKLOG.md` for prioritized vertical slices.

## Documentation

- **[Game Design](docs/DESIGN.md)**: Detailed game mechanics, theme, and design pillars.
- **[Architecture](docs/ARCHITECTURE.md)**: Technical stack, ECS structure, and code organization.
- **[Backlog](docs/BACKLOG.md)**: Development roadmap and vertical slices.
- **[Decisions](docs/DECISIONS.md)**: Architecture Decision Records (ADR) log.
