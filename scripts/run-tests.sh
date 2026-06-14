#!/bin/bash
# WSL Path Fix Script for Jest
# This script bypasses UNC path issues when running tests in WSL

# Force proper working directory and ensure we're using WSL native tools
cd "$(dirname "$0")/.."
export CURRENT_DIR="$(pwd)"

# Set environment variables to force Node.js path resolution
export NODE_PATH="$CURRENT_DIR/node_modules"
export PWD="$CURRENT_DIR"

# Force npm to use WSL paths and avoid Windows path conflicts
export npm_config_cache="$CURRENT_DIR/.npm-cache"
export npm_config_prefix="$CURRENT_DIR/.npm-global"
export npm_config_fund=false
export npm_config_audit=false

export BROWSER=none
export CI=true

echo "Current directory: $CURRENT_DIR"

# Check if node_modules exists and install if needed
if [ ! -d "node_modules" ] || [ ! -f "node_modules/.bin/jest" ]; then
    echo "Installing dependencies..."
    npm install --ignore-scripts
    npm rebuild --ignore-scripts || true
fi

if [ -f "node_modules/.bin/jest" ]; then
    echo "Running tests with jest..."
    node_modules/.bin/jest --config jest.config.cjs --watchAll=false "$@"
else
    echo "Error: jest not found. Dependencies may not be properly installed."
    exit 1
fi
