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

- Node.js 18+
- npm or yarn

### Setup

1. Install dependencies:

```bash
npm install
```

2. Start development server:

```bash
npm run dev
```

3. Run E2E tests:

```bash
npm run test:e2e
```

4. Run unit tests (if added):

```bash
npm run test:unit
```

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
