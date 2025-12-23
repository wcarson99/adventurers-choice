#!/bin/bash

# Clean script for The Adventurer's Choice
# Removes all build artifacts, dependencies, and generated files

set -e  # Exit on error

echo "🧹 Cleaning The Adventurer's Choice..."
echo ""

# Remove build artifacts
echo "🗑️  Removing build artifacts..."
rm -rf dist
rm -rf dist-ssr
echo "✅ Build artifacts removed"
echo ""

# Remove test artifacts
echo "🗑️  Removing test artifacts..."
rm -rf test-results
rm -rf playwright-report
rm -rf playwright/.cache
echo "✅ Test artifacts removed"
echo ""

# Remove logs
echo "🗑️  Removing log files..."
find . -name "*.log" -type f -not -path "./node_modules/*" -delete 2>/dev/null || true
echo "✅ Log files removed"
echo ""

# Remove node_modules (optional - comment out if you want to keep it)
if [ "$1" == "--all" ] || [ "$1" == "-a" ]; then
  echo "🗑️  Removing node_modules..."
  rm -rf node_modules
  echo "✅ node_modules removed"
  echo ""
  
  echo "🗑️  Removing package-lock.json..."
  rm -f package-lock.json
  echo "✅ package-lock.json removed"
  echo ""
  
  echo "✨ Deep clean complete!"
  echo "   Run 'npm install' and 'npm run setup' to reinstall everything"
else
  echo "✨ Clean complete! (node_modules preserved)"
  echo "   Run 'npm run clean -- --all' to also remove node_modules"
fi

echo ""

