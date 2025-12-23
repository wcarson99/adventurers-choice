#!/bin/bash

# Setup script for The Adventurer's Choice
# This script installs all dependencies needed to run the project

set -e  # Exit on error

echo "🚀 Setting up The Adventurer's Choice..."
echo ""

# Check Node.js version
echo "📦 Checking Node.js version..."
NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
  echo "❌ Error: Node.js 18+ is required. You have $(node --version)"
  exit 1
fi
echo "✅ Node.js $(node --version) detected"
echo ""

# Install npm dependencies
echo "📦 Installing npm dependencies..."
npm install
echo "✅ npm dependencies installed"
echo ""

# Install Playwright browsers
echo "🌐 Installing Playwright browsers..."
npx playwright install chromium
echo "✅ Playwright browsers installed"
echo ""

# Verify TypeScript compilation
echo "🔨 Verifying TypeScript compilation..."
npm run build
echo "✅ Build successful"
echo ""

echo "✨ Setup complete! You can now:"
echo "  - Run 'npm run dev' to start the development server"
echo "  - Run 'npm run test:e2e' to run E2E tests"
echo ""

