#!/bin/bash
# Start Frontend - StudyGen AI
# This script starts the Vite development server on http://localhost:5173

set -e

echo ""
echo "=========================================="
echo "Starting StudyGen AI Frontend"
echo "=========================================="
echo ""

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "[1/2] Installing Dependencies..."
    npm install
fi

echo "[2/2] Starting Development Server..."
echo ""
echo "=========================================="
echo "Frontend Starting..."
echo "=========================================="
echo ""
echo "URL: http://localhost:5173"
echo "Backend: http://localhost:8000"
echo ""
echo "Press Ctrl+C to stop"
echo ""

# Start the frontend
npm run dev
