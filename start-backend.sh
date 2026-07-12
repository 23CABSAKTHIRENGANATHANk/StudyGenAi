#!/bin/bash
# Start Backend - StudyGen AI
# This script starts the FastAPI backend server on http://localhost:8000

set -e

echo ""
echo "=========================================="
echo "Starting StudyGen AI Backend"
echo "=========================================="
echo ""

cd backend

# Check if venv exists
if [ ! -d "venv" ]; then
    echo "[1/4] Creating Virtual Environment..."
    python3 -m venv venv
fi

# Activate virtual environment
echo "[2/4] Activating Virtual Environment..."
source venv/bin/activate

# Install dependencies
echo "[3/4] Installing Dependencies..."
pip install -q -r requirements.txt 2>/dev/null || {
    echo "WARNING: Some dependencies failed silently, trying with output..."
    pip install -r requirements.txt
}

# Run diagnostics
echo "[4/4] Running Diagnostics..."
python diagnose.py
if [ $? -ne 0 ]; then
    echo ""
    echo "ERROR: Diagnostics failed. Please fix the issues above."
    echo ""
    exit 1
fi

echo ""
echo "=========================================="
echo "Backend Starting..."
echo "=========================================="
echo ""
echo "URL: http://localhost:8000"
echo "Health: http://localhost:8000/"
echo "Docs: http://localhost:8000/docs"
echo ""
echo "Press Ctrl+C to stop"
echo ""

# Start the backend
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000 --log-level info
