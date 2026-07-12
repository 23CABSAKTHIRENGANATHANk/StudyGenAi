#!/bin/bash
# Start Backend - StudyGen AI
# This script starts the FastAPI backend server on http://localhost:8000

echo "=========================================="
echo "Starting StudyGen AI Backend"
echo "=========================================="
echo ""
echo "Backend will run on: http://localhost:8000"
echo "Press Ctrl+C to stop"
echo ""

cd backend

# Check if venv exists
if [ ! -d "venv" ]; then
    echo "Virtual environment not found. Creating..."
    python3 -m venv venv
fi

# Activate virtual environment
source venv/bin/activate

# Install dependencies if needed
pip install -q -r requirements.txt

# Start the backend
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
