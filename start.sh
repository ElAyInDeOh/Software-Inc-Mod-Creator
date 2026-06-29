#!/bin/bash
# Software Inc Mod Studio — Quick Start (macOS / Linux)
# Requires Node.js: https://nodejs.org/

set -e

echo "=========================================="
echo "   Software Inc Mod Studio"
echo "=========================================="
echo ""

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "Installing dependencies..."
    npm install
    echo ""
fi

echo "Starting server..."
echo "Open http://localhost:8080 in your browser"
echo "Press Ctrl+C to stop"
echo ""

node server.js
