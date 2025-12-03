#!/bin/bash

# Setup script for Python virtual environment for image processing
# This script creates a virtual environment and installs Pillow

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
VENV_DIR="$PROJECT_ROOT/venv-image-processing"

echo "Setting up Python virtual environment for image processing..."
echo ""

# Check if Python 3 is available
if ! command -v python3 &> /dev/null; then
    echo "Error: python3 is not installed or not in PATH"
    exit 1
fi

# Create virtual environment if it doesn't exist
if [ -d "$VENV_DIR" ]; then
    echo "Virtual environment already exists at $VENV_DIR"
    echo "Skipping creation..."
else
    echo "Creating virtual environment at $VENV_DIR..."
    python3 -m venv "$VENV_DIR"
    echo "Virtual environment created successfully!"
fi

# Activate virtual environment and install Pillow
echo ""
echo "Installing Pillow..."
source "$VENV_DIR/bin/activate"
pip install --upgrade pip > /dev/null 2>&1
pip install Pillow

echo ""
echo "Setup complete!"
echo ""
echo "To use the virtual environment:"
echo "  source $VENV_DIR/bin/activate"
echo ""
echo "To run the image processing script:"
echo "  source $VENV_DIR/bin/activate"
echo "  python scripts/remove-background.py --input <path> --output <path> [--color <color>]"
echo ""

